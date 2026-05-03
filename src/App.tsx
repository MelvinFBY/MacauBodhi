/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Lightbulb, 
  ShieldCheck, 
  Zap, 
  Search, 
  RefreshCcw, 
  ArrowRight,
  Sparkles,
  MessageCircle,
  X,
  Send,
  User,
  AlertCircle,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { summarizeBug, getPatch, chatWithBodhisattva, getLifeDivination, Bodhisattva, Patch, Language } from './services/gemini.ts';

type AppStep = 'input' | 'scanning' | 'choice' | 'patching' | 'result';

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const translations: Record<Language, any> = {
  zh: {
    title: "菩薩養成所",
    subtitle: "快速掃描心靈 Bug，提供智慧補丁。",
    placeholder: "輸入你最近遇到的煩惱或卡頓狀態...",
    scanBtn: "執行 Bug Scan",
    scanning: "DEBUGGING_CORE...",
    patching: "APPLYING_PATCH...",
    retrieving: "從雲端智慧庫檢索中",
    bugReport: "🛠️ Bug 報告",
    chooseTitle: "Deployment: 選擇模組",
    patchUpdate: "🧘 Patch Update",
    command: "👣 執行指令",
    switchBtn: "切換模組",
    restartBtn: "重新掃描",
    footer: "科技是翅膀，慈悲是方向。",
    module: "模組",
    ready: "指引已就緒",
    chatWith: "與 聊天",
    chatPlaceholder: "輸入訊息...",
    send: "發送",
    divination: "人生卜事",
    drawDivination: "抽選智慧卦",
    divinationLoading: "正在檢索星雲大師智慧...",
    retry: "重試",
    chatError: "連線不穩定，請重試。",
    close: "關閉"
  },
  en: {
    title: "Bodhisattva Training Lab",
    subtitle: "Quickly scan spiritual bugs and deploy wisdom patches.",
    placeholder: "Input your recent troubles or 'lags' here...",
    scanBtn: "Execute Bug Scan",
    scanning: "DEBUGGING_CORE...",
    patching: "APPLYING_PATCH...",
    retrieving: "Retrieving from Cloud Wisdom",
    bugReport: "🛠️ Bug Report",
    chooseTitle: "Deployment: Select Module",
    patchUpdate: "🧘 Patch Update",
    command: "👣 EXEC_COMMAND",
    switchBtn: "Switch Module",
    restartBtn: "Restart Scan",
    footer: "Technology for wings, compassion for direction.",
    module: "Module",
    ready: "Online & Ready",
    chatWith: "Chat with ",
    chatPlaceholder: "Type a message...",
    send: "Send",
    divination: "Life Divination",
    drawDivination: "Draw Wisdom",
    divinationLoading: "Retrieving Master Hsing Yun's wisdom...",
    retry: "Retry",
    chatError: "Connection unstable. Please retry.",
    close: "Close"
  },
  jp: {
    title: "菩薩養成所",
    subtitle: "心のバグをスキャンし、知恵のパッチを当てる。",
    placeholder: "最近の悩みや「ラグ」を入力してください...",
    scanBtn: "バグスキャン実行",
    scanning: "デバッグ中...",
    patching: "パッチ適用中...",
    retrieving: "クラウド知恵袋から取得中",
    bugReport: "🛠️ バグ報告",
    chooseTitle: "デプロイ: モジュール選択",
    patchUpdate: "🧘 パッチ修正",
    command: "👣 実行コマンド",
    switchBtn: "モジュール変更",
    restartBtn: "再スキャン",
    footer: "技術は翼、慈悲は方向。",
    module: "モジュール",
    ready: "ガイダンス完了",
    chatWith: "とチャット",
    chatPlaceholder: "メッセージを入力...",
    send: "送信",
    divination: "人生占い",
    drawDivination: "知恵を引く",
    divinationLoading: "星雲大師の知恵を取得中...",
    retry: "リトライ",
    chatError: "接続が不安定です。再試行してください。",
    close: "閉じる"
  },
  kr: {
    title: "보살 양성소",
    subtitle: "마음의 버그을 스캔하고 지혜의 패치를 배포합니다.",
    placeholder: "최근의 고민이나 '랙'을 입력하세요...",
    scanBtn: "버그 스캔 실행",
    scanning: "디버깅 중...",
    patching: "패치 적용 중...",
    retrieving: "클라우드 지혜에서 검색 중",
    bugReport: "🛠️ 버그 리포트",
    chooseTitle: "배포: 모듈 선택",
    patchUpdate: "🧘 패치 업데이트",
    command: "👣 실행 명령",
    switchBtn: "모듈 전환",
    restartBtn: "다시 스캔",
    footer: "기술은 날개, 자비는 방향.",
    module: "모듈",
    ready: "가이드 준비 완료",
    chatWith: "와(과) 대화",
    chatPlaceholder: "메시지 입력...",
    send: "전송",
    divination: "인생 점술",
    drawDivination: "지혜 뽑기",
    divinationLoading: "성운대사의 지혜를 가져오는 중...",
    retry: "재시도",
    chatError: "연결이 불안정합니다. 다시 시도하십시오.",
    close: "닫기"
  }
};

export default function App() {
  const [step, setStep] = useState<AppStep>('input');
  const [lang, setLang] = useState<Language>('zh');
  const [userInput, setUserInput] = useState('');
  const [bugSummary, setBugSummary] = useState('');
  const [selectedBodhisattva, setSelectedBodhisattva] = useState<Bodhisattva | null>(null);
  const [patch, setPatch] = useState<Patch | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Divination state
  const [divination, setDivination] = useState<string | null>(null);
  const [isDivinationLoading, setIsDivinationLoading] = useState(false);
  const [isDivinationModalOpen, setIsDivinationModalOpen] = useState(false);

  const t = translations[lang];

  const handleScan = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    setStep('scanning');
    try {
      const summary = await summarizeBug(userInput, lang);
      setBugSummary(summary);
      setStep('choice');
    } catch (error) {
      console.error(error);
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBodhisattva = async (b: Bodhisattva) => {
    setSelectedBodhisattva(b);
    setLoading(true);
    setStep('patching');
    try {
      const result = await getPatch(bugSummary, b, lang);
      setPatch(result);
      setChatMessages([]);
      setStep('result');
    } catch (error) {
      console.error(error);
      setStep('choice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedBodhisattva || isChatLoading) return;
    
    const userMsg: ChatMessage = { role: "user", parts: [{ text: chatInput }] };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    setChatError(null);
    
    try {
      const responseText = await chatWithBodhisattva(chatMessages, chatInput, selectedBodhisattva, lang);
      const modelMsg: ChatMessage = { role: "model", parts: [{ text: responseText }] };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setChatError(t.chatError);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRetryChat = () => {
    if (chatMessages.length > 0) {
      const lastUserMsg = chatMessages.findLast(m => m.role === 'user');
      if (lastUserMsg) {
        setChatInput(lastUserMsg.parts[0].text);
        setChatMessages(prev => prev.slice(0, -1));
        handleSendMessage();
      }
    }
  };

  const handleDrawDivination = async () => {
    setIsDivinationLoading(true);
    setIsDivinationModalOpen(true);
    try {
      const quote = await getLifeDivination(lang);
      setDivination(quote);
    } catch (error) {
      console.error(error);
      setDivination("智慧正在連線中，請稍後再試。");
    } finally {
      setIsDivinationLoading(false);
    }
  };

  const reset = () => {
    setStep('input');
    setUserInput('');
    setBugSummary('');
    setSelectedBodhisattva(null);
    setPatch(null);
    setIsChatOpen(false);
    setChatMessages([]);
  };

  const bodhisattvas = [
    { 
      id: '觀音' as Bodhisattva, 
      name: { zh: '觀音菩薩', en: 'Avalokitesvara', jp: '観音菩薩', kr: '관세음보살' }[lang],
      icon: Heart, color: 'text-pink-400', 
      desc: { zh: '情緒修復、暖心連線', en: 'Emotional repair & connection', jp: '感情の修復と繋がり', kr: '감정 치유와 연결' }[lang] 
    },
    { 
      id: '文殊' as Bodhisattva, 
      name: { zh: '文殊菩薩', en: 'Manjushri', jp: '文殊菩薩', kr: '문수보살' }[lang],
      icon: Lightbulb, color: 'text-yellow-400', 
      desc: { zh: '邏輯優化、轉念補丁', en: 'Logic optimization & wisdom', jp: '論理の最適化と知恵', kr: '논리 최적화와 지혜' }[lang] 
    },
    { 
      id: '地藏' as Bodhisattva, 
      name: { zh: '地藏菩薩', en: 'Ksitigarbha', jp: '地蔵菩薩', kr: '지장보살' }[lang],
      icon: ShieldCheck, color: 'text-amber-700', 
      desc: { zh: '系統承擔、韌性防火牆', en: 'Systemic responsibility & resilience', jp: '責任感と回復力', kr: '계통적 책임과 회복력' }[lang] 
    },
    { 
      id: '普賢' as Bodhisattva, 
      name: { zh: '普賢菩薩', en: 'Samantabhadra', jp: '普賢菩薩', kr: '보현보살' }[lang],
      icon: Zap, color: 'text-emerald-400', 
      desc: { zh: '執行指令、三好四給', en: 'Action commands & practice', jp: '実行コマンドと実践', kr: '실행 명령과 실천' }[lang] 
    },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'EN' },
    { code: 'jp', label: 'JP' },
    { code: 'kr', label: 'KR' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-white selection:text-black">
      <div className="max-w-2xl mx-auto px-6 py-16 sm:py-24 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="mb-16 text-left relative flex flex-col sm:flex-row justify-between items-start gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-pink-500 text-black mb-6 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
            >
              <Sparkles size={12} strokeWidth={3} />
              <span className="text-[10px] uppercase tracking-widest font-black">Bodhisattva Training Lab</span>
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase leading-none">{t.title}</h1>
            <p className="text-sm text-gray-500 font-mono tracking-wider">{t.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 shrink-0">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-label={`Switch language to ${l.label}`}
                className={`px-4 py-1.5 text-[10px] font-black tracking-widest rounded-lg transition-all uppercase focus-visible:ring-2 focus-visible:ring-white outline-none ${lang === l.code ? 'bg-white text-black' : 'hover:bg-white/10 opacity-50 hover:opacity-100'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </header>

        {/* Action: Life Divination Button */}
        <div className="mb-12 flex justify-start">
          <button
            onClick={handleDrawDivination}
            aria-label={t.drawDivination}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:border-pink-500 transition-all font-black text-xs uppercase tracking-[0.2em] italic focus-visible:ring-2 focus-visible:ring-pink-500 outline-none"
          >
            <BookOpen size={16} className="text-pink-500 group-hover:rotate-12 transition-transform" />
            {t.divination}
          </button>
        </div>

        {/* Content */}
        <main className="flex-grow flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: INPUT */}
            {step === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <textarea
                    autoFocus
                    aria-label="Input spiritual bug description"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t.placeholder}
                    className="relative w-full h-64 bg-black border border-white/20 rounded-2xl p-8 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/10 transition-all text-xl font-medium leading-relaxed"
                  />
                  <div className="absolute bottom-6 right-6 text-[10px] uppercase tracking-widest opacity-30 font-mono flex items-center gap-2">
                    <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                    System IDLE
                  </div>
                </div>
                <button
                  onClick={handleScan}
                  disabled={!userInput.trim() || loading}
                  className="w-full group flex items-center justify-center gap-3 bg-white text-black py-5 rounded-xl font-black text-lg hover:invert transition-all disabled:opacity-50"
                >
                  <Search size={22} strokeWidth={3} />
                  <span className="tracking-tighter uppercase">{t.scanBtn}</span>
                </button>
              </motion.div>
            )}

            {/* STEP: SCANNING / PATCHING */}
            {(step === 'scanning' || step === 'patching') && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-10"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.1, 1] 
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        delay: i * 0.1 
                      }}
                      className="w-6 h-6 bg-white rounded-sm"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                    {step === 'scanning' ? t.scanning : t.patching}
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-[0.3em] font-mono">
                    {t.retrieving}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CHOICE */}
            {step === 'choice' && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Search size={80} />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-pink-500 mb-3">{t.bugReport}</p>
                  <h3 className="text-2xl font-bold tracking-tight leading-tight">{bugSummary}</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500 uppercase tracking-[0.2em] font-mono">{t.chooseTitle}</p>
                  <div className="grid grid-cols-1 gap-4">
                    {bodhisattvas.map((b) => (
                      <div key={b.id} className="relative">
                        <button
                          onClick={() => handleSelectBodhisattva(b.id)}
                          onMouseEnter={() => setHoveredModule(b.id)}
                          onMouseLeave={() => setHoveredModule(null)}
                          aria-label={`Select ${b.name} module`}
                          className="w-full flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white text-left group transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        >
                          <div className={`p-4 rounded-lg bg-black text-white group-hover:bg-black group-hover:text-white transition-colors`}>
                            <b.icon size={28} strokeWidth={2.5} className={b.color} />
                          </div>
                          <div className="flex-grow group-hover:text-black">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xl italic uppercase tracking-tighter">{b.name}</span>
                            </div>
                            <p className="text-xs opacity-60 uppercase font-mono tracking-widest mt-1">{b.desc}</p>
                          </div>
                          <ArrowRight size={20} strokeWidth={3} className="text-black opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                        </button>
                        
                        {/* Tooltip for desktop */}
                        <AnimatePresence>
                          {hoveredModule === b.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute left-1/2 -top-12 -translate-x-1/2 z-50 pointer-events-none hidden md:block"
                            >
                              <div className="px-4 py-2 rounded bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap shadow-2xl">
                                Load {b.name} Module
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RESULT */}
            {step === 'result' && patch && (
              <motion.div 
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-pink-500" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] italic">
                      {bodhisattvas.find(b => b.id === (selectedBodhisattva as any))?.name} {t.ready}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* PATCH CARD */}
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative group"
                  >
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-white opacity-20" />
                    <div className="p-8 bg-white/5 border border-white/10 rounded-r-2xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded text-[9px] font-mono tracking-tighter opacity-70 uppercase">
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                          LIVE
                        </div>
                        <div className="px-2 py-1 bg-white/10 rounded text-[9px] font-mono tracking-tighter opacity-50 uppercase">Type: Patch_Update</div>
                      </div>
                      <div className="space-y-3">
                        {patch.advice.split('\n').map((line, i) => (
                          <p key={i} className="text-xl font-bold leading-tight tracking-tight text-white/90 italic">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* COMMAND CARD */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Zap size={100} strokeWidth={1} />
                    </div>
                    <div className="p-8 bg-emerald-500 text-black rounded-2xl flex flex-col gap-4 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t.command}</span>
                        <Zap size={16} fill="currentColor" />
                      </div>
                      <p className="text-xl font-black uppercase leading-tight italic tracking-tighter shadow-sm">
                        {patch.action}
                      </p>
                      <div className="mt-4 flex gap-1">
                        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-1 flex-grow bg-black/20" />)}
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    onClick={() => setStep('choice')}
                    className="flex-1 flex items-center justify-center gap-3 py-5 rounded-xl bg-white/5 border border-white/20 font-black hover:bg-white/10 transition-all text-xs uppercase tracking-widest italic"
                  >
                    <RefreshCcw size={16} />
                    {t.switchBtn}
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 py-5 rounded-xl bg-white text-black font-black hover:bg-emerald-400 transition-all text-xs uppercase tracking-widest italic"
                  >
                    {t.restartBtn}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-[9px] uppercase tracking-[0.5em] opacity-30 font-mono italic">
            {t.footer}
          </p>
          <div className="flex gap-6 opacity-20">
            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-75" />
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300" />
          </div>
        </footer>

        {/* CHAT INTERFACE */}
        {(selectedBodhisattva || step === 'choice') && (
          <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="w-[90vw] sm:w-[400px] h-[500px] bg-black border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
                >
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded bg-black ${bodhisattvas.find(b => b.id === selectedBodhisattva)?.color || 'text-white'}`}>
                        {(() => {
                          const B = bodhisattvas.find(b => b.id === selectedBodhisattva);
                          return B ? <B.icon size={16} /> : <MessageCircle size={16} />;
                        })()}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest italic">
                          {selectedBodhisattva ? `${t.chatWith}${bodhisattvas.find(b => b.id === selectedBodhisattva)?.name}` : 'Select a Module'}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                          <p className="text-[8px] uppercase tracking-widest opacity-50">Bodhisattva_Channel_v2.0</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} aria-label={t.close} className="p-2 hover:bg-white/10 rounded transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth" role="log" aria-live="polite">
                    {!selectedBodhisattva && (
                      <div className="h-full flex items-center justify-center text-center p-8 opacity-40 italic text-xs uppercase tracking-widest">
                        Please select a Bodhisattva module to begin transmission.
                      </div>
                    )}
                    {chatMessages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${m.role === 'user' ? 'bg-white text-black' : 'bg-pink-500 text-black'}`}>
                            {m.role === 'user' ? <User size={12} /> : (
                              (() => {
                                const B = bodhisattvas.find(b => b.id === (selectedBodhisattva as any));
                                return B ? <B.icon size={12} /> : <MessageCircle size={12} />;
                              })()
                            )}
                          </div>
                          <div className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-white/10 rounded-tr-none text-white' : 'bg-white/5 rounded-tl-none border border-white/10 text-gray-200'}`}>
                            {m.parts[0].text}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl animate-pulse">
                          <div className="flex gap-1" aria-hidden="true">
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    {chatError && (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="flex items-center gap-2 text-red-400 text-[10px] uppercase font-black tracking-widest">
                          <AlertCircle size={12} />
                          {chatError}
                        </div>
                        <button
                          onClick={handleRetryChat}
                          className="flex items-center gap-2 px-3 py-1.5 rounded bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                        >
                          <RotateCcw size={10} />
                          {t.retry}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="relative">
                      <input
                        value={chatInput}
                        aria-label={t.chatPlaceholder}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={!selectedBodhisattva || isChatLoading}
                        placeholder={t.chatPlaceholder}
                        className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-4 pr-12 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors disabled:opacity-20"
                      />
                      <button 
                        onClick={handleSendMessage}
                        aria-label={t.send}
                        disabled={!chatInput.trim() || isChatLoading || !selectedBodhisattva}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white hover:text-emerald-400 transition-colors disabled:opacity-20 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Bubble Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsChatOpen(!isChatOpen)}
              aria-label={isChatOpen ? t.close : t.chatWith}
              className="w-16 h-16 bg-white text-black rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center hover:bg-emerald-400 transition-all pointer-events-auto group overflow-hidden relative focus-visible:ring-4 focus-visible:ring-white/30 outline-none"
            >
              <AnimatePresence mode="wait">
                {isChatOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X size={24} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <MessageCircle size={24} strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        )}

        {/* LIFE DIVINATION MODAL */}
        <AnimatePresence>
          {isDivinationModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl overflow-hidden relative"
              >
                <div className="p-8 pb-12 flex flex-col items-center text-center gap-8">
                  <div className="flex items-center gap-3 py-1 px-3 bg-pink-500 rounded text-black text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={12} strokeWidth={3} />
                    {t.divination}
                  </div>
                  
                  <div className="min-h-[120px] flex items-center justify-center">
                    {isDivinationLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
                        />
                        <p className="text-xs uppercase tracking-widest opacity-50 animate-pulse">{t.divinationLoading}</p>
                      </div>
                    ) : (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl font-black italic uppercase leading-tight tracking-tight text-white"
                      >
                        「{divination}」
                      </motion.p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIsDivinationModalOpen(false)}
                    className="mt-4 px-8 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-pink-500 transition-colors"
                  >
                    {t.close}
                  </button>
                </div>
                
                {/* Decorative Pattern */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-emerald-500 to-pink-500" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

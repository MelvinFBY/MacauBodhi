import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type Bodhisattva = "觀音" | "文殊" | "地藏" | "普賢";
export type Language = 'zh' | 'en' | 'jp' | 'kr';

export interface BugReport {
  summary: string;
}

export interface Patch {
  advice: string;
  action: string;
}

export async function summarizeBug(input: string, lang: Language): Promise<string> {
  const langMap: Record<Language, string> = {
    zh: "繁體中文",
    en: "English",
    jp: "日本語",
    kr: "한국어"
  };
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following spiritual bug in one short, sharp sentence using modern digital metaphors (e.g., lag, cache, offline, crash).\nInput: ${input}\nAnswer in ${langMap[lang]}.`,
    config: {
      systemInstruction: "You are an AI PM at the Bodhisattva Training Lab. Summaries must be direct and helpful for core understanding.",
    },
  });

  return response.text.trim();
}

export async function getPatch(summary: string, bodhisattva: Bodhisattva, lang: Language): Promise<Patch> {
  const langMap: Record<Language, string> = {
    zh: "繁體中文",
    en: "English",
    jp: "日本語",
    kr: "한국어"
  };

  const prompts: Record<Bodhisattva, string> = {
    "觀音": "Avalokitesvara Bodhisattva (Compassion): Emotional repair, connection.",
    "文殊": "Manjushri Bodhisattva (Wisdom): Logic optimization, thought-shifting.",
    "地藏": "Ksitigarbha Bodhisattva (Great Vow): Systemic resilience, responsibility.",
    "普賢": "Samantabhadra Bodhisattva (Action): Execution, the 'Three Good Deeds & Four Givings'.",
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Issue: ${summary}\nModule: ${prompts[bodhisattva]}\nLanguage: ${langMap[lang]}\n\nProvide: \n1. A patch (advice) in short bullet points (max 3 points, start with '• '). \n2. A concrete execution command (action) that can be done immediately.\nEnsure the tone is digital-savvy, sharp, and direct.`,
    config: {
      systemInstruction: "You are an AI PM at the Bodhisattva Training Lab. Responses must be concise, modern, and actionable. Avoid flowery spiritual jargon. Format advice as clear bullet points.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          advice: { type: Type.STRING, description: "Advice in bullet points" },
          action: { type: Type.STRING, description: "One concrete, actionable step" },
        },
        required: ["advice", "action"],
      },
    },
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return {
      advice: "• Connection failed\n• Refresh internal state",
      action: "Take 3 deep breaths and reboot.",
    };
  }
}

export async function chatWithBodhisattva(
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  message: string,
  bodhisattva: Bodhisattva,
  lang: Language
): Promise<string> {
  const langMap: Record<Language, string> = {
    zh: "繁體中文",
    en: "English",
    jp: "日本語",
    kr: "한국어"
  };

  const personalities: Record<Bodhisattva, string> = {
    "觀音": "You are Avalokitesvara Bodhisattva (Compassion). Compassionate, gentle, focused on healing emotional bugs and loneliness. Tone: Warm but direct, like a caring tech support.",
    "文殊": "You are Manjushri Bodhisattva (Wisdom). Sharp, analytical, focused on crushing logical fallacies and ignorance. Tone: Intellectual, slightly witty, high-performance logic.",
    "地藏": "You are Ksitigarbha Bodhisattva (Great Vow). Resilient, responsible, focused on endurance and groundedness in the toughest environments. Tone: Steady, unwavering, reliable like a core server.",
    "普賢": "You are Samantabhadra Bodhisattva (Action). Practical, result-oriented, focused on immediate execution and practice. Tone: Energetic, command-line focused, 'just do it' attitude.",
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(msg => ({
        role: msg.role,
        parts: msg.parts
      })),
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `${personalities[bodhisattva]} \nAnswer in ${langMap[lang]}. Use digital metaphors occasionally (lag, reboot, cache). Keep responses concise (under 3 sentences).`,
    },
  });

  return response.text || "";
}

export async function getLifeDivination(lang: Language): Promise<string> {
  const langMap: Record<Language, string> = {
    zh: "繁體中文",
    en: "English",
    jp: "日本語",
    kr: "한국어"
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Give me one inspirational wisdom quote from Master Hsing Yun's '108 Life Divinations' (人生卜事). Answer in ${langMap[lang]}. Only provide the quote text, direct and powerful.`,
    config: {
      systemInstruction: "You are a wisdom distributor. Provide one short, powerful life divination quote from Master Hsing Yun. No preamble, just the quote.",
    },
  });

  return response.text.trim();
}

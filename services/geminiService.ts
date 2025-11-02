import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { Message, Role, Tone, Language } from "../types";

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || "AIzaSyBvDpyj2jtAuY97p6Vs9XWELlMTHsWGC58"; 
    if (!apiKey) {
      throw new Error("API key not provided or found in environment variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const getTamilSystemInstruction = (tone: Tone): string => {
  const baseInstruction = `You are a friendly and helpful Tamil AI assistant named Anbu (அன்பு).
Your primary function is to converse in the Tamil language.

**Rules:**
1. **ALWAYS respond in Tamil.** No exceptions. Your entire response must be in the Tamil language and script.
2. If the user writes in English or Tanglish (e.g., "vanakkam epdi irukinga"), understand the query but formulate your response purely in proper Tamil script.
3. Keep your responses concise and natural, suitable for voice playback.
4. Your current personality should be: ${tone}.`;

  const toneGuidelines = {
    [Tone.FUNNY]: "Be humorous, witty, and use playful Tamil language. Tell jokes if appropriate.",
    [Tone.ADULT]: "Be mature, respectful, and thoughtful in your responses. Provide deep and meaningful conversation.",
    [Tone.PROFESSIONAL]: "Use formal, polished Tamil suitable for a professional context. Be clear, concise, and helpful.",
    [Tone.POETIC]: "Respond in a rhythmic, lyrical style, using rich and emotional Tamil vocabulary. Evoke feelings and imagery.",
  };

  return `${baseInstruction}\n\n**Tone Guideline:**\n- **${tone}:** ${toneGuidelines[tone]}`;
};

const getEnglishSystemInstruction = (tone: Tone): string => {
  const baseInstruction = `You are a friendly and helpful AI assistant named Anbu.
Your primary function is to converse in English.

**Rules:**
1. **ALWAYS respond in English.** No exceptions.
2. Keep your responses concise and natural, suitable for voice playback.
3. Your current personality should be: ${tone}.`;

  const toneGuidelines = {
    [Tone.FUNNY]: "Be humorous, witty, and use playful language. Tell jokes if appropriate.",
    [Tone.ADULT]: "Be mature, respectful, and thoughtful in your responses. Provide deep and meaningful conversation.",
    [Tone.PROFESSIONAL]: "Use formal, polished English suitable for a professional context. Be clear, concise, and helpful.",
    [Tone.POETIC]: "Respond in a rhythmic, lyrical style, using rich and emotional vocabulary. Evoke feelings and imagery.",
  };

  return `${baseInstruction}\n\n**Tone Guideline:**\n- **${tone}:** ${toneGuidelines[tone]}`;
};

export const generateResponse = async (
  newMessage: string,
  history: Message[],
  tone: Tone,
  language: Language
): Promise<string> => {
  try {
    const aiInstance = getAI();
    const systemInstruction =
      language === Language.TAMIL
        ? getTamilSystemInstruction(tone)
        : getEnglishSystemInstruction(tone);

    const geminiHistory = history
      .filter((m) => m.role !== Role.ERROR)
      .map((m) => ({
        role: m.role === Role.USER ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    chat = aiInstance.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction,
      },
      history: geminiHistory,
    });

    const response = await chat.sendMessage(newMessage);
    return response.text();
  } catch (error) {
    console.error("Error generating response from Gemini API:", error);
    if (error instanceof Error) {
      return language === Language.TAMIL
        ? `மன்னிக்கவும், ஒரு பிழை ஏற்பட்டது: ${error.message}`
        : `Sorry, an error occurred: ${error.message}`;
    }
    return language === Language.TAMIL
      ? "மன்னிக்கவும், ஒரு பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."
      : "Sorry, an error occurred. Please try again.";
  }
};

const voiceNames: Record<Language, string> = {
  [Language.TAMIL]: "Kore",
  [Language.ENGLISH]: "Puck",
};

export const generateSpeech = async (
  text: string,
  language: Language
): Promise<string> => {
  try {
    const aiInstance = getAI();
    const prompt = `Say cheerfully: ${text}`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceNames[language] },
          },
        },
      },
    });

    const base64Audio =
      response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the API.");
    }

    return base64Audio;
  } catch (error) {
    console.error("Error generating speech from Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
};

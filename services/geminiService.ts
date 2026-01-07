
import { GoogleGenAI } from "@google/genai";
import { GameStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMissionCommentary = async (
  score: number,
  level: number,
  status: GameStatus
): Promise<string> => {
  try {
    const prompt = `You are a holographic tactical AI for a spaceship pilot in a neon retro-futuristic war called "Matchin Invaders".
    Status: ${status}. Current Score: ${score}. Level: ${level}.
    Give a short, punchy (max 15 words) tactical message in Portuguese (pt-BR). 
    Keep it cool, cyberpunk, and encouraging if winning, or dramatic if losing.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        topK: 40,
        topP: 0.9,
      }
    });

    return response.text || "Piloto, mantenha o foco na zona de combate!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sistemas táteis ativos. Destrua os invasores!";
  }
};

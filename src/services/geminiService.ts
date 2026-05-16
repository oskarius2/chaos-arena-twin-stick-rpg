import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getTacticalCommentary(context: { 
  score: number, 
  health: number, 
  equips: string[], 
  enemiesDefeated: number 
}) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a tactical AI ship computer in a fast-paced space shooter. 
      Current situation:
      - Score: ${context.score}
      - Health: ${context.health}%
      - Equipped Gear: ${context.equips.join(", ")}
      - Enemies Neutralized: ${context.enemiesDefeated}
      
      Provide a VERY SHORT (max 10 words) tactical update or encouragement. 
      Be cold, professional, and technical. Examples: "Energy signatures rising. Maintain fire.", "Shields critical. Evasive maneuvers recommended.", "Combat performance optimization detected."`,
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Gemini Commentary Error:", error);
    return null;
  }
}

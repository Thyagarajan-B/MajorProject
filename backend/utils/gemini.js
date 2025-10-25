import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateAIResponse = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Extract the text safely
    const explanationText =
      response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (explanationText) return explanationText;
    return "⚠️ Sorry, AI couldn't generate a response right now.";
  } catch (error) {
    console.error("Gemini error:", error);
    return "⚠️ Sorry, AI couldn't generate a response right now.";
  }
};

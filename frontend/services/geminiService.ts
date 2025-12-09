import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY as string | undefined;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

export const enhanceDescription = async (currentDescription: string): Promise<string> => {
  try {
    const ai = getAI();
    if (!ai) return currentDescription;
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert startup copywriter. 
      Rewrite the following project description to be more exciting, clear, and appealing to Gen-Z talent.
      Keep it under 280 characters if possible, or short and punchy.
      Use emojis sparingly but effectively.
      
      Original Description: "${currentDescription}"
      
      Return ONLY the rewritten text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || currentDescription;
  } catch (error) {
    return currentDescription;
  }
};

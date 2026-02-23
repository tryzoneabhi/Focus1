import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getRecommendations(profile: any, history: any[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `Based on the following student profile and watch history, recommend 5 educational topics and search keywords for YouTube.
  Profile: ${JSON.stringify(profile)}
  History: ${JSON.stringify(history)}
  
  Return a JSON object with a list of recommendations, each having a 'topic' and 'keywords'.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                keywords: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function summarizeVideo(title: string, description: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Summarize this educational video:
  Title: ${title}
  Description: ${description}
  
  Provide:
  1. Key Concepts
  2. Important Formulas (if applicable)
  3. 5 Bullet Summary
  4. Quick Revision Notes`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}

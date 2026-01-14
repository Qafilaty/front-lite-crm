
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsights = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على البيانات التالية لمخزون وطلبات المتجر، قدم 3 نصائح سريعة ومختصرة جداً باللغة العربية لتحسين الأداء: ${JSON.stringify(data)}`,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "لا يمكن الحصول على تحليلات حالياً.";
  }
};

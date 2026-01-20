
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client safely
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getSmartInsights = async (data: any) => {
  try {
    if (!ai) {
      console.warn("Google AI API Key is missing");
      return "خدمة الذكاء الاصطناعي غير مفعلة.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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

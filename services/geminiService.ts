import { GoogleGenerativeAI } from "@google/generative-ai";

// Vite đọc biến môi trường từ VITE_...
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const processTask = async (subject: string, agent: string, input: string, image?: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Môn: ${subject}. Vai trò: ${agent}. Nội dung: ${input}`;
    
    if (image) {
      const base64Data = image.split(",")[1];
      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
      ]);
      return result.response.text();
    }
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Lỗi AI:", error);
    return "Có lỗi xảy ra khi gọi AI.";
  }
};

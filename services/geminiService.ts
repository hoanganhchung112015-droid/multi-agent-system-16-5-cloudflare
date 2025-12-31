import { GoogleGenerativeAI } from "@google/generative-ai"; // ĐÚNG

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY); // PHẢI LÀ GoogleGenerativeAI

export const processTask = async (subject: string, agent: string, input: string, image?: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Môn: ${subject}. Nội dung: ${input}`;
    
    const parts: any[] = [{ text: prompt }];
    if (image) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } });
    }

    const result = await model.generateContent(parts);
    return result.response.text();
  } catch (error) {
    return "Lỗi AI";
  }
};

// Các hàm này để trống để App.tsx không bị lỗi gọi hàm
export const generateSimilarQuiz = async () => null;
export const generateSummary = async () => null;
export const fetchTTSAudio = async () => null;
export const playStoredAudio = async () => {};

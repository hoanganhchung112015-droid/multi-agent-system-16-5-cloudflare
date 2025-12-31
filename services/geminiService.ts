import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Dùng VITE_ để Cloudflare nhận diện được Key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// 2. Tên Class ĐÚNG là GoogleGenerativeAI (Không phải GoogleGenAI)
const genAI = new GoogleGenerativeAI(API_KEY);

export const processTask = async (subject: string, agent: string, input: string, image?: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Tạo prompt dựa trên logic JSON bạn muốn
    const prompt = `Bạn là giáo viên môn ${subject}. Chuyên gia ${agent}. 
    Hãy giải quyết: ${input}
    Trả về định dạng JSON: { "finalAnswer": "lời giải", "casioSteps": "hướng dẫn máy tính" }`;

    const parts: any[] = [{ text: prompt }];
    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image.includes(",") ? image.split(",")[1] : image
        }
      });
    }

    const result = await model.generateContent(parts);
    return result.response.text();
  } catch (error) {
    console.error("Lỗi Gemini:", error);
    return JSON.stringify({ finalAnswer: "Lỗi kết nối AI.", casioSteps: "" });
  }
};

// Các hàm phụ để App.tsx không bị lỗi import
export const generateSimilarQuiz = async (content: string) => null;
export const generateSummary = async (content: string) => null;
export const fetchTTSAudio = async (text: string) => null;
export const playStoredAudio = async (aud: string, ref: any) => {};

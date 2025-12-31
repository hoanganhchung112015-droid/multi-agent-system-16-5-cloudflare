import { GoogleGenerativeAI } from "@google/generative-ai";

// Cloudflare/Vite dùng import.meta.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const processTask = async (subject: string, agent: string, input: string, image?: string) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Bạn là giáo viên chuyên nghiệp. Trả về JSON chính xác cấu trúc này: 
    { 
      "speed": { 
        "answer": "đáp án chi tiết dùng LaTeX cho công thức", 
        "similar": { "question": "câu hỏi tương tự", "options": ["A", "B", "C", "D"], "correctIndex": 0 } 
      }, 
      "socratic_hint": "gợi ý dẫn dắt", 
      "core_concept": "khái niệm cốt lõi" 
    }. 
    Môn ${subject}, chuyên gia ${agent}: ${input}`;

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
    return result.response.text(); // Trả về chuỗi JSON
  } catch (error) {
    console.error("Lỗi:", error);
    return JSON.stringify({ error: "Không thể kết nối AI" });
  }
};

// Giữ các hàm trống để App.tsx không bị lỗi crash
export const generateSimilarQuiz = async (c: any) => null;
export const generateSummary = async (c: any) => null;
export const fetchTTSAudio = async (c: any) => null;
export const playStoredAudio = async (a: any, b: any) => {};

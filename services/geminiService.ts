import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Subject, AgentType } from "../types";

// Lấy API Key từ biến môi trường của Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// CẤU HÌNH MODEL
const MODEL_CONFIG = {
  TEXT: 'gemini-1.5-flash', // Hiện tại dùng 1.5 ổn định nhất, 2.0 nếu bạn đã có quyền truy cập
  TTS: 'gemini-1.5-flash',
};

const cache = new Map<string, string>();
const audioCache = new Map<string, string>();

const getCacheKey = (subject: string, agent: string, input: string, imageHash: string = '') => 
  `${subject}|${agent}|${input.trim()}|${imageHash}`;

const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.SPEED]: `Bạn là chuyên gia giải đề thi. Trả về JSON: {"finalAnswer": "...", "casioSteps": "..."}.`,
  [AgentType.SOCRATIC]: `Bạn là giáo sư Socratic. Giải chi tiết, ngắn gọn, dùng LaTeX.`,
  [AgentType.PERPLEXITY]: `Bạn là Perplexity AI. Liệt kê tối đa 2 dạng bài nâng cao.`,
};

async function safeExecute<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.toString().includes('429') ? "Hệ thống quá tải!" : error.message);
  }
}

export const processTask = async (subject: Subject, agent: AgentType, input: string, image?: string) => {
  const cacheKey = getCacheKey(subject, agent, input, image ? 'has_img' : 'no_img');
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  return safeExecute(async () => {
    const model = genAI.getGenerativeModel({ 
        model: MODEL_CONFIG.TEXT,
        // Cấu hình JSON Mode nếu là Agent SPEED
        generationConfig: agent === AgentType.SPEED ? {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    finalAnswer: { type: SchemaType.STRING },
                    casioSteps: { type: SchemaType.STRING }
                },
                required: ["finalAnswer", "casioSteps"]
            }
        } : undefined
    });

    const prompt = `Môn: ${subject}. Chuyên gia: ${agent}. Yêu cầu: ${SYSTEM_PROMPTS[agent]}. \nNội dung: ${input}`;
    
    let result;
    if (image) {
      const imageData = image.split(',')[1];
      result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "image/jpeg", data: imageData } }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const resultText = result.response.text();
    if (resultText) cache.set(cacheKey, resultText);
    return resultText;
  });
};

// --- CÁC HÀM KHÁC (Tóm tắt, Quiz) CŨNG PHẢI DÙNG CHUNG CẤU TRÚC model.generateContent ---

export const generateSummary = async (content: string) => {
    if (!content) return "";
    return safeExecute(async () => {
        const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.TEXT });
        const result = await model.generateContent(`Tóm tắt cực ngắn gọn 1 câu: ${content}`);
        return result.response.text();
    });
};

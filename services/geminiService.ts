import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 1. Khởi tạo chuẩn (Không dùng GoogleGenAI)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// 2. Cấu hình Model
const MODEL_NAME = "gemini-1.5-flash";

// 3. Hàm xử lý chính (khớp với App.tsx)
export const processTask = async (subject: string, agent: string, input: string, image?: string) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  // Prompt nội dung
  let prompt = `Môn: ${subject}. Chuyên gia: ${agent}. Nội dung: ${input}`;
  
  // Nếu là chuyên gia SPEED, yêu cầu JSON (App.tsx cần JSON.parse)
  if (agent === "SPEED") {
    prompt += `\nTrả về JSON: {"finalAnswer": "đáp án và giải thích ngắn", "casioSteps": "các bước bấm máy"}`;
  }

  const parts: any[] = [{ text: prompt }];
  if (image) {
    const base64Data = image.split(",")[1];
    parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
  }

  const result = await model.generateContent(parts);
  return result.response.text();
};

// 4. Các hàm bổ trợ (để App.tsx không bị lỗi import)
export const generateSimilarQuiz = async (content: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(`Tạo 1 câu hỏi trắc nghiệm tương tự: ${content}. Trả về JSON {question, options, answer}`);
    return JSON.parse(result.response.text());
  } catch (e) { return null; }
};

export const generateSummary = async (content: string) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent(`Tóm tắt 1 câu ngắn: ${content}`);
  return result.response.text();
};

export const fetchTTSAudio = async (text: string) => {
  // Tạm thời trả về null nếu bạn chưa có server TTS riêng để tránh lỗi app
  return null; 
};

export const playStoredAudio = async (base64: string, ref: any) => {
  console.log("TTS đang được bảo trì");
};

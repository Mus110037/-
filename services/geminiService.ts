
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Resource } from "../types";

// Note: Initialization should happen inside functions to ensure the latest process.env.API_KEY is used.

export const optimizeSchedule = async (orders: Order[], resources: Resource[]) => {
  // Fix: Create client instance right before the request to ensure API key currency.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    你是一位专业的生产调度优化专家。
    给定一系列待处理订单和可用资源，请创建一个优化的生产计划。
    
    订单数据: ${JSON.stringify(orders)}
    资源数据: ${JSON.stringify(resources)}
    
    规则:
    1. 尽可能遵守截止日期。
    2. 优先级较高的订单应优先安排。
    3. 尽量减少资源的空闲时间。
    4. 以 ISO 格式提供每个订单的开始和结束时间，假设今天的日期从上午 08:00 开始。
    5. 工作时间为 08:00 至 18:00。
    
    返回一份调度分配列表。
  `;

  try {
    // Fix: Using gemini-3-pro-preview for complex reasoning and optimization tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              orderId: { type: Type.STRING },
              resourceId: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            },
            required: ["orderId", "resourceId", "startTime", "endTime"]
          }
        }
      }
    });

    // Fix: Use the .text property directly and handle potential empty responses safely.
    const result = response.text;
    return result ? JSON.parse(result) : [];
  } catch (error) {
    console.error("Gemini 优化失败:", error);
    throw error;
  }
};

export const getSchedulingInsights = async (orders: Order[]) => {
  // Fix: Create client instance right before the request to ensure API key currency.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `分析这份订单列表，并为生产主管提供 3 条关键见解或警告。重点关注瓶颈、可能错过的截止日期或资源分配过度。
  订单数据: ${JSON.stringify(orders)}`;

  try {
    // Fix: Use gemini-3-flash-preview for general text generation and analysis.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "你是一位简洁的工业顾问。每条见解请保持在 30 字以内。"
      }
    });
    // Fix: Access response.text directly (not as a method).
    return response.text || "暂时无法生成见解。";
  } catch (error) {
    return "暂时无法生成见解。";
  }
};

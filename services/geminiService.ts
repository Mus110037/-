
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Resource } from "../types";

export const optimizeSchedule = async (orders: Order[], resources: Resource[]) => {
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
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ text: prompt }], // Corrected to use parts array
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

    const result = response.text;
    return result ? JSON.parse(result) : [];
  } catch (error) {
    console.error("Gemini 优化失败:", error);
    throw error;
  }
};

export const getSchedulingInsights = async (orders: Order[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `分析这份订单列表，并为生产主管提供 3 条关键见解。重点关注瓶颈、可能错过的截止日期。
  订单数据: ${JSON.stringify(orders)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: prompt }], // Corrected to use parts array
      config: {
        systemInstruction: "你是一位简洁的工业顾问。每条见解请保持在 30 字以内。"
      }
    });
    return response.text || "暂时无法生成见解。";
  } catch (error) {
    return "暂时无法生成见解。";
  }
};

/**
 * 新增：获取财务见解
 * @param orders 订单列表
 * @returns 3-5 条关于财务状况的简洁见解
 */
export const getFinancialInsights = async (orders: Order[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `你是一位专业的财务分析师。分析以下订单数据，给出3-5条关于营收、工时利用率、高价值企划类型或潜在财务风险的简洁见解。
  订单数据: ${JSON.stringify(orders)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // 适用于简洁文本任务
      contents: [{ text: prompt }], // Corrected to use parts array
      config: {
        systemInstruction: "你是一位简洁的财务分析顾问。每条见解请保持在 30 字以内。"
      }
    });
    return response.text || "暂时无法生成财务见解。";
  } catch (error) {
    console.error("Gemini 获取财务见解失败:", error);
    return "暂时无法生成财务见解。";
  }
};

/**
 * 新增：获取完整的 AI 分析报告
 * @param orders 订单列表
 * @returns 包含调度、财务、瓶颈和建议的全面报告
 */
export const getFullAIAnalysis = async (orders: Order[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `你是一位经验丰富的业务战略顾问。请根据以下所有订单数据，提供一份详细的综合分析报告。报告应包含以下几个方面：
  1.  **项目组合概览:** 总结当前进行中、已完成、高优先级项目的数量和价值。
  2.  **调度与瓶颈分析:** 识别潜在的排期冲突、即将到期的紧急项目，并给出建议以避免瓶颈。
  3.  **财务健康分析:** 评估总预估收入、实际入账，分析收入来源结构，并识别高利润或高风险的企划类型。
  4.  **工时利用率评估:** 分析已完成项目的实际工时数据，评估工作效率和资源分配。
  5.  **战略性建议:** 基于以上分析，为优化业务运营、提升效率、增加收入和降低风险提供 3-5 条具体且可行的建议。
  
  订单数据: ${JSON.stringify(orders)}
  
  请以 Markdown 格式返回报告，使用清晰的标题和列表，确保报告内容专业且易于理解。报告长度应在 300-500 字之间。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // 适用于复杂推理和报告生成
      contents: [{ text: prompt }], // Corrected to use parts array
      config: {
        maxOutputTokens: 1000, // 确保有足够输出空间
        thinkingConfig: { thinkingBudget: 1000 }, // 允许模型进行更多思考
      }
    });
    return response.text || "暂时无法生成完整的 AI 分析报告。";
  } catch (error) {
    console.error("Gemini 获取完整 AI 分析报告失败:", error);
    return "暂时无法生成完整的 AI 分析报告。";
  }
};

/**
 * 解析米画师截图数据
 * @param base64Image 图片的 base64 字符串
 */
export const parseMihuashiScreenshot = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = "请识别这张米画师(Mihuashi)企划列表截图中的所有企划。提取每个企划的：标题(title)、截稿日期(deadline, 格式YYYY-MM-DD)、稿酬总额(totalPrice, 数字)、当前进度描述(progressDesc，如'草稿 20%')。";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      // Fix: Ensure contents follows the { parts: [...] } structure for multimodal requests
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              deadline: { type: Type.STRING },
              totalPrice: { type: Type.NUMBER },
              progressDesc: { type: Type.STRING }
            },
            required: ["title", "deadline", "totalPrice", "progressDesc"]
          }
        }
      }
    });

    const result = response.text;
    return result ? JSON.parse(result) : [];
  } catch (error) {
    console.error("AI 识别企划失败:", error);
    return [];
  }
};
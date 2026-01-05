
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";
import { calculateSaleMetrics } from "../constants";

export const generateBusinessInsights = async (state: AppState): Promise<string> => {
  if (!process.env.API_KEY) return "API Key is missing.";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const salesSummary = state.sales.map(s => 
    `Date:${s.date},Qty:${s.quantity},Net:${calculateSaleMetrics(s).lucroLiquido}`
  ).join('\n');

  const commissionsSummary = state.commissions.map(c => 
    `Per:${c.month} ${c.year},Op:${c.operator},Val:${c.commissionValue}`
  ).join('\n');

  const prompt = `Analyze Diamond Sales & Commissions. 
  Sales Data:
  ${salesSummary}
  
  Commissions Data:
  ${commissionsSummary}
  
  Provide a sub-200 word professional summary covering: 
  1. Most profitable day. 
  2. Sales trend. 
  3. Operator comparison. 
  4. Actionable recommendation for Net Profit.`;

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt 
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate insights.";
  }
};

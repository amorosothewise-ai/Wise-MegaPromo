
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";
import { calculateSaleMetrics } from "../constants";

export const generateBusinessInsights = async (state: AppState): Promise<string> => {
  if (!process.env.API_KEY) return "API Key is missing.";
  
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare parameters for metric calculation based on current settings
  const calcParams = {
    salePrice: state.settings.defaultSalePrice,
    grossCommission: state.settings.defaultGrossCommission,
    repaymentRate: state.settings.defaultRepaymentRate
  };

  // Fixed: calculateSaleMetrics expects two arguments; passing calcParams as the second one.
  const salesSummary = state.sales.slice(-30).map(s => 
    `Date:${s.date},Qty:${s.quantity},NetProfit:${calculateSaleMetrics(s, calcParams).lucroLiquido}`
  ).join('\n');

  const commissionsSummary = state.commissions.map(c => 
    `Period:${c.month} ${c.year},Op:${c.operator},Value:${c.commissionValue}`
  ).join('\n');

  const expensesSummary = state.expenses.slice(-10).map(e => 
    `Cat:${e.category},Val:${e.value}`
  ).join('\n');

  const prompt = `Act as a specialized business financial analyst for a retail business. 
  
  CONTEXT:
  - Sales (Recent):
  ${salesSummary}
  
  - Commissions (Recent):
  ${commissionsSummary}
  
  - Expenses (Recent):
  ${expensesSummary}
  
  GOAL:
  Provide a concise, expert analysis (max 180 words) in Portuguese. Focus on:
  1. Highlight the single most productive day and why it stands out.
  2. Identify the sales volume trend (Growing, Stable, or Declining).
  3. Compare M-Pesa vs e-Mola efficiency based on recent data.
  4. One high-impact recommendation to optimize Net Profit or reduce operating costs.
  
  Tone: Professional, data-driven, and supportive.`;

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt 
    });
    // Correct usage of .text property as per GenerateContentResponse definition
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Falha ao analisar dados. Por favor, tente novamente mais tarde.";
  }
};

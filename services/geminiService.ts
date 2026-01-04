import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";
import { calculateSaleMetrics } from "../constants";

export const generateBusinessInsights = async (state: AppState): Promise<string> => {
  // Initialize the client strictly within the function scope to ensure env vars are ready
  // and to follow best practices for key handling.
  if (!process.env.API_KEY) {
    return "API Key is missing. Unable to generate insights.";
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare data summary for the model
  const salesSummary = state.sales.map(s => {
    const metrics = calculateSaleMetrics(s);
    return `Date: ${s.date}, Qty: ${s.quantity}, Net Profit: ${metrics.lucroLiquido}`;
  }).join('\n');

  const commissionsSummary = state.commissions.map(c => 
    `Period: ${c.month} ${c.year}, Operator: ${c.operator}, Value: ${c.commissionValue}`
  ).join('\n');

  const prompt = `
    Analyze the following sales data (Diamond Sales) and monthly commissions.
    
    Diamond Sales Data:
    ${salesSummary}

    Monthly Commissions Data:
    ${commissionsSummary}

    Please provide a concise, professional executive summary of the business performance.
    1. Identify the most profitable day for diamond sales.
    2. Analyze the trend of sales.
    3. Compare the performance of operators (M-Pesa vs e-Mola) based on commissions if applicable.
    4. Give one actionable recommendation to increase Net Profit.
    
    Keep the tone professional and the response under 200 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Failed to generate insights. Please try again later.";
  }
};
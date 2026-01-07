
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";
import { calculateSaleMetrics } from "../constants";

export const generateBusinessInsights = async (state: AppState): Promise<string> => {
  // Use the pre-configured API_KEY from the environment
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key is missing or not configured correctly in the environment.";
  
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey });

  // Prepare parameters for metric calculation based on current settings
  const calcParams = {
    salePrice: state.settings.defaultSalePrice,
    grossCommission: state.settings.defaultGrossCommission,
    repaymentRate: state.settings.defaultRepaymentRate
  };

  // Extract relevant financial data for analysis
  const salesSummary = state.sales.slice(-30).map(s => 
    `Data:${s.date},Qtd:${s.quantity},LucroLíq:${calculateSaleMetrics(s, calcParams).lucroLiquido}`
  ).join('\n');

  const commissionsSummary = state.commissions.map(c => 
    `Período:${c.month} ${c.year},Operadora:${c.operator},Valor:${c.commissionValue}`
  ).join('\n');

  const expensesSummary = state.expenses.slice(-10).map(e => 
    `Categoria:${e.category},Valor:${e.value}`
  ).join('\n');

  const prompt = `Age como um analista financeiro sénior especializado no mercado moçambicano. 
  
  CONTEXTO DE DADOS:
  - Vendas Recentes:
  ${salesSummary}
  
  - Comissões Recebidas:
  ${commissionsSummary}
  
  - Despesas Fixas:
  ${expensesSummary}
  
  OBJETIVO:
  Fornece uma análise executiva concisa (máx. 200 palavras) em Português de Moçambique.
  1. Identifica o dia mais produtivo e explica a razão do seu destaque.
  2. Determina se a tendência de volume de vendas está a Crescer, Estável ou a Declinar.
  3. Compara a eficiência do M-Pesa vs e-Mola com base nos ganhos recentes.
  4. Dá UMA recomendação estratégica de alto impacto para maximizar o Lucro Real ou cortar custos desnecessários.
  
  Tom: Profissional, direto ao ponto e baseado em dados.`;

  try {
    // Using gemini-3-pro-preview for complex financial reasoning tasks.
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: prompt 
    });

    // Directly access .text property from GenerateContentResponse
    return response.text || "Não foi possível gerar insights no momento. Tente novamente.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Falha ao analisar dados. Por favor, tente novamente mais tarde.";
  }
};

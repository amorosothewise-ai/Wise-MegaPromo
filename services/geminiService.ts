
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types.ts";
import { calculateSaleMetrics } from "../constants.ts";

export const generateBusinessInsights = async (state: AppState): Promise<string> => {
  // A variável process.env.API_KEY é injetada automaticamente pelo Netlify no ambiente de execução.
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    return "Erro: A chave API (API_KEY) não foi detetada. Certifica-te de que configuraste a variável de ambiente no Netlify.";
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const calcParams = {
    salePrice: state.settings.defaultSalePrice,
    grossCommission: state.settings.defaultGrossCommission,
    repaymentRate: state.settings.defaultRepaymentRate
  };

  const salesSummary = state.sales.slice(-30).map(s => 
    `Data:${s.date},Qtd:${s.quantity},LucroLíq:${calculateSaleMetrics(s, calcParams).lucroLiquido}`
  ).join('\n');

  const commissionsSummary = state.commissions.map(c => 
    `Período:${c.month} ${c.year},Operadora:${c.operator},Valor:${c.commissionValue}`
  ).join('\n');

  const expensesSummary = state.expenses.slice(-10).map(e => 
    `Categoria:${e.category},Valor:${e.value}`
  ).join('\n');

  const prompt = `Age como um analista financeiro sénior moçambicano. 
  
  DADOS:
  - Vendas: ${salesSummary}
  - Comissões: ${commissionsSummary}
  - Despesas: ${expensesSummary}
  
  OBJETIVO:
  Análise concisa (máx 150 palavras) em PT-MZ:
  1. Destaque do período mais produtivo.
  2. Tendência de volume (Crescer/Estável/Declinar).
  3. Eficiência M-Pesa vs e-Mola.
  4. Uma recomendação estratégica de lucro.`;

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: prompt 
    });

    return response.text || "Sem resposta da IA.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro na análise. Verifica se a tua chave API no Netlify é válida para o modelo gemini-3-pro-preview.";
  }
};

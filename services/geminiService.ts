
import { GoogleGenAI } from "@google/genai";
import { AppState, DiamondSale } from "../types.ts";
import { calculateSaleMetrics } from "../constants.ts";

export const generateBusinessInsights = async (state: AppState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const calcParams = {
    grossCommission: state.settings.defaultGrossCommission,
    repaymentRate: state.settings.defaultRepaymentRate
  };

  // Preparamos um resumo conciso para o contexto da IA
  const salesSummary = state.sales.slice(-50).map((s: DiamondSale) => {
    const metrics = calculateSaleMetrics(s, calcParams);
    return `Data:${s.date}, Qtd:${s.quantity}, LucroEst:${metrics.lucroLiquido}`;
  }).join('\n');

  const commissionsSummary = state.commissions.slice(-12).map(c => 
    `Periodo:${c.month}/${c.year}, Op:${c.operator}, Valor:${c.commissionValue}`
  ).join('\n');

  const expensesSummary = state.expenses.slice(-20).map(e => 
    `Cat:${e.category}, Valor:${e.value}, Desc:${e.description}`
  ).join('\n');

  const prompt = `Analise estes dados financeiros de uma operação de revenda em Moçambique:
  
  VENDAS RECENTES (Últimas 50):
  ${salesSummary}
  
  COMISSÕES RECEBIDAS (Últimos 12 meses):
  ${commissionsSummary}
  
  DESPESAS FIXAS (Últimas 20):
  ${expensesSummary}
  
  CONFIGURAÇÕES ATUAIS:
  Comissão Bruta Padrão: ${state.settings.defaultGrossCommission} MT
  Taxa Reinvestimento Padrão: ${state.settings.defaultRepaymentRate} MT
  
  Forneça uma análise estratégica curta (máx 150 palavras) em Português de Moçambique:
  1. Identifique o canal de comissão mais lucrativo ou consistente.
  2. Alerte sobre tendências de queda no volume de vendas ou aumento de despesas.
  3. Sugira uma redução de custo específica baseada na lista de despesas.
  4. Projeção realista de lucro líquido para o próximo ciclo mensal.`;

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: prompt 
    });

    return response.text || "A IA não conseguiu gerar uma resposta no momento.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("API_KEY")) {
      return "Erro: Chave API não configurada ou inválida nas variáveis de ambiente.";
    }
    return "Ocorreu um erro ao processar a análise com a Wise AI. Por favor, tente novamente mais tarde.";
  }
};

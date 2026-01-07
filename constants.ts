
import { DiamondSale, Month, Operator, MonthlyCommission, Expense } from "./types";

export const FACTORS = {
  VALOR_RECEBIDO: 470,
  COMISSAO_BRUTA: 75,
  DEFAULT_DIVIDA_REPOR: 30
};

export const EXPENSE_CATEGORIES = [
  'Transporte',
  'Alimentação',
  'Internet',
  'Crédito/Chamadas',
  'Outros'
];

export const MONTHS = Object.values(Month);
export const OPERATORS = Object.values(Operator);

export const formatMZN = (value: number) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2
  }).format(value || 0);
};

export const isFutureDate = (dateStr: string) => {
  if (!dateStr) return false;
  const inputDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
};

export const escapeCSV = (val: any) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '--/--/----';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const calculateSaleMetrics = (sale: DiamondSale, settings: { salePrice: number, grossCommission: number, repaymentRate: number }) => {
  const qty = Number(sale.quantity || 0);
  const salePrice = Number(sale.salePrice ?? settings.salePrice);
  const grossCommPerUnit = Number(sale.grossCommission ?? settings.grossCommission);
  const ratePerUnit = Number(sale.repaymentRate ?? settings.repaymentRate);

  const totalBruto = qty * salePrice;
  const totalComissao = qty * grossCommPerUnit;
  const totalReposicao = qty * ratePerUnit;
  
  // Função Primária: Lucro Real = (Comissão Bruta * Qtd) - (Taxa Reposição * Qtd)
  const lucroLiquido = totalComissao - totalReposicao;
  
  return {
    valorRecebido: totalBruto,
    comissaoBruta: totalComissao,
    dividaRepor: totalReposicao,
    lucroLiquido,
    usedRate: ratePerUnit,
    usedPrice: salePrice,
    usedGross: grossCommPerUnit
  };
};

const formatDate = (d: number) => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), d).toISOString().split('T')[0];
};

export const INITIAL_SALES: DiamondSale[] = [
  { id: '1', date: formatDate(1), quantity: 25, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
  { id: '2', date: formatDate(2), quantity: 18, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
];

export const INITIAL_COMMISSIONS: MonthlyCommission[] = [ 
  { id: '1', month: MONTHS[new Date().getMonth()] as Month, year: new Date().getFullYear(), operator: Operator.MPesa, commissionValue: 2450 },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: formatDate(2), description: 'Internet Mensal', category: 'Internet', value: 1500 },
];

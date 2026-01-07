
import { DiamondSale, Month, Operator, MonthlyCommission, Expense } from "./types";

export const FACTORS = {
  REINVESTMENT_FEE: 30, // Valor fixo padrão a ser reinvestido por pacote
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

export const isFuturePeriod = (m: Month, y: number) => {
  const now = new Date();
  const targetMonthIdx = MONTHS.indexOf(m);
  if (y > now.getFullYear()) return true;
  if (y === now.getFullYear() && targetMonthIdx > now.getMonth()) return true;
  return false;
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

/**
 * Calcula o valor de reinvestimento baseado na quantidade e taxa.
 * Se a taxa não for fornecida, usa o padrão global.
 */
export const calculateReinvestment = (quantity: number, rate?: number) => {
  const effectiveRate = rate !== undefined ? rate : FACTORS.REINVESTMENT_FEE;
  return (quantity || 0) * effectiveRate;
};

/**
 * Calcula métricas de lucro para uma venda específica.
 * Prioriza taxas gravadas no registro da venda para manter consistência histórica.
 */
export const calculateSaleMetrics = (sale: DiamondSale, defaultParams: { grossCommission: number, repaymentRate: number }) => {
  const qty = sale.quantity || 0;
  const comm = sale.grossCommission !== undefined ? sale.grossCommission : defaultParams.grossCommission;
  const rate = sale.repaymentRate !== undefined ? sale.repaymentRate : defaultParams.repaymentRate;
  
  const profitPerUnit = (comm || 0) - (rate || 0);
  return {
    lucroLiquido: qty * profitPerUnit
  };
};

const formatDate = (d: number) => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), d).toISOString().split('T')[0];
};

export const INITIAL_SALES: DiamondSale[] = [
  { id: '1', date: formatDate(1), quantity: 50, repaymentRate: 30, grossCommission: 75, salePrice: 470 },
  { id: '2', date: formatDate(2), quantity: 30, repaymentRate: 30, grossCommission: 75, salePrice: 470 },
];

export const INITIAL_COMMISSIONS: MonthlyCommission[] = [ 
  { id: '1', month: MONTHS[new Date().getMonth()] as Month, year: new Date().getFullYear(), operator: Operator.MPesa, commissionValue: 5500 },
  { id: '2', month: MONTHS[new Date().getMonth()] as Month, year: new Date().getFullYear(), operator: Operator.EMola, commissionValue: 3200 },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: formatDate(2), description: 'Internet Mensal', category: 'Internet', value: 1500 },
];

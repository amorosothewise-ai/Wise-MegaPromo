
import { DiamondSale, Month, Operator, MonthlyCommission, Expense } from "./types";

export const FACTORS = {
  REINVESTMENT_FEE: 30, // Valor fixo a ser reinvestido por pacote
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

export const calculateReinvestment = (quantity: number) => {
  return (quantity || 0) * FACTORS.REINVESTMENT_FEE;
};

// Fix: Added the missing calculateSaleMetrics function which was causing an import error in geminiService.ts.
// It calculates the estimated net profit for a sale based on quantity, commission, and repayment rate.
export const calculateSaleMetrics = (sale: { quantity: number }, params: { grossCommission: number, repaymentRate: number }) => {
  const qty = sale.quantity || 0;
  const lucroPorUnidade = (params.grossCommission || 0) - (params.repaymentRate || 0);
  return {
    lucroLiquido: qty * lucroPorUnidade
  };
};

const formatDate = (d: number) => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), d).toISOString().split('T')[0];
};

export const INITIAL_SALES: DiamondSale[] = [
  { id: '1', date: formatDate(1), quantity: 50 },
  { id: '2', date: formatDate(2), quantity: 30 },
];

export const INITIAL_COMMISSIONS: MonthlyCommission[] = [ 
  { id: '1', month: MONTHS[new Date().getMonth()] as Month, year: new Date().getFullYear(), operator: Operator.MPesa, commissionValue: 5500 },
  { id: '2', month: MONTHS[new Date().getMonth()] as Month, year: new Date().getFullYear(), operator: Operator.EMola, commissionValue: 3200 },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: formatDate(2), description: 'Internet Mensal', category: 'Internet', value: 1500 },
];

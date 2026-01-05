
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

export const calculateSaleMetrics = (sale: DiamondSale) => {
  const salePrice = sale.salePrice ?? FACTORS.VALOR_RECEBIDO;
  const grossCommission = sale.grossCommission ?? FACTORS.COMISSAO_BRUTA;
  const usedRate = sale.repaymentRate ?? FACTORS.DEFAULT_DIVIDA_REPOR;

  return {
    valorRecebido: sale.quantity * salePrice,
    comissaoBruta: sale.quantity * grossCommission,
    dividaRepor: sale.quantity * usedRate,
    lucroLiquido: (sale.quantity * grossCommission) - (sale.quantity * usedRate),
    usedRate
  };
};

const formatDate = (d: number) => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), d).toISOString().split('T')[0];
};

const currYear = new Date().getFullYear();
const currMonth = MONTHS[new Date().getMonth()];

export const INITIAL_SALES: DiamondSale[] = [
  { id: '1', date: formatDate(1), quantity: 10, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
  { id: '2', date: formatDate(2), quantity: 5, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
  { id: '3', date: formatDate(3), quantity: 12, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
  { id: '4', date: formatDate(4), quantity: 8, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
  { id: '5', date: formatDate(5), quantity: 15, repaymentRate: 30, salePrice: 470, grossCommission: 75 },
];

export const INITIAL_COMMISSIONS: MonthlyCommission[] = [ 
  { id: '1', month: currMonth, year: currYear, operator: Operator.MPesa, commissionValue: 1500 },
  { id: '2', month: currMonth, year: currYear, operator: Operator.EMola, commissionValue: 800 },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: formatDate(2), description: 'Táxi para entrega', category: 'Transporte', value: 200 },
  { id: '2', date: formatDate(4), description: 'Recarga Celular', category: 'Crédito/Chamadas', value: 100 },
];

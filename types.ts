
export enum Month {
  Jan = 'Jan',
  Feb = 'Feb',
  Mar = 'Mar',
  Apr = 'Apr',
  May = 'May',
  Jun = 'Jun',
  Jul = 'Jul',
  Aug = 'Aug',
  Sep = 'Sep',
  Oct = 'Oct',
  Nov = 'Nov',
  Dec = 'Dec'
}

export enum Operator {
  MPesa = 'M-Pesa',
  EMola = 'e-Mola'
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  value: number;
}

export interface DiamondSale {
  id: string;
  date: string;
  quantity: number;
  repaymentRate?: number;
  salePrice?: number;
  grossCommission?: number;
}

export interface MonthlyCommission {
  id: string;
  month: Month;
  year: number;
  operator: Operator;
  commissionValue: number;
}

export interface AppSettings {
  defaultRepaymentRate: number;
  defaultSalePrice: number;
  defaultGrossCommission: number;
  partnerAPercentage: number;
  partnerBPercentage: number;
  partnerAName: string;
  partnerBName: string;
}

export type FilterMode = 'monthly' | 'range';

export interface AppState {
  sales: DiamondSale[];
  commissions: MonthlyCommission[];
  expenses: Expense[];
  settings: AppSettings;
}

export type ViewMode = 'dashboard' | 'sales' | 'commissions' | 'expenses' | 'summary';

export type Language = 'pt' | 'en';

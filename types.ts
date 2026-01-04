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
  Dec = 'Dec',
}

export enum Operator {
  MPesa = 'M-Pesa',
  EMola = 'e-Mola',
}

export interface DiamondSale {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  quantity: number;
  // Calculated fields are derived at runtime
}

export interface MonthlyCommission {
  id: string;
  month: Month;
  year: number; // Field added to track years
  operator: Operator;
  commissionValue: number;
}

export interface AppState {
  sales: DiamondSale[];
  commissions: MonthlyCommission[];
}

export type ViewMode = 'dashboard' | 'sales' | 'commissions';
import { DiamondSale, Month, Operator, MonthlyCommission } from "./types";

export const FACTORS = {
  VALOR_RECEBIDO: 470,
  COMISSAO_BRUTA: 75,
  DIVIDA_REPOR: 30,
};

export const MONTHS = Object.values(Month);
export const OPERATORS = Object.values(Operator);

// Helper to calculate derived fields
export const calculateSaleMetrics = (sale: DiamondSale) => {
  const valorRecebido = sale.quantity * FACTORS.VALOR_RECEBIDO;
  const comissaoBruta = sale.quantity * FACTORS.COMISSAO_BRUTA;
  const dividaRepor = sale.quantity * FACTORS.DIVIDA_REPOR;
  const lucroLiquido = comissaoBruta - dividaRepor;

  return {
    valorRecebido,
    comissaoBruta,
    dividaRepor,
    lucroLiquido
  };
};

// Initial Dummy Data
export const INITIAL_SALES: DiamondSale[] = [
  { id: '1', date: '2023-10-01', quantity: 10 },
  { id: '2', date: '2023-10-02', quantity: 5 },
  { id: '3', date: '2023-10-03', quantity: 12 },
  { id: '4', date: '2023-10-04', quantity: 8 },
  { id: '5', date: '2023-10-05', quantity: 15 },
];

export const INITIAL_COMMISSIONS: MonthlyCommission[] = [ 
  { id: '1', month: Month.Sep, year: 2023, operator: Operator.MPesa, commissionValue: 1500 },
  { id: '2', month: Month.Sep, year: 2023, operator: Operator.EMola, commissionValue: 800 },
  { id: '3', month: Month.Oct, year: 2023, operator: Operator.MPesa, commissionValue: 1200 },
];
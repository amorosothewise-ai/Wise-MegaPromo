import React, { useState } from 'react';
import { DiamondSale } from '../types';
import { calculateSaleMetrics, FACTORS } from '../constants';
import { Plus, Trash2 } from 'lucide-react';

interface SalesTableProps {
  sales: DiamondSale[];
  onAddSale: (sale: Omit<DiamondSale, 'id'>) => void;
  onDeleteSale: (id: string) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onAddSale, onDeleteSale }) => {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newQty, setNewQty] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newQty) return;
    onAddSale({
      date: newDate,
      quantity: Number(newQty),
    });
    setNewQty('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Vendas Diamantes</h2>
          <p className="text-sm text-slate-500">Registro diário de vendas</p>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2 items-end">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
                <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>
            <button 
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-red-200"
            >
                <Plus size={16} /> Add
            </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-50 text-blue-900 font-semibold border-b border-blue-100">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Quantidade</th>
              <th className="px-6 py-3">Valor Recebido <span className="text-xs text-blue-400">(*{FACTORS.VALOR_RECEBIDO})</span></th>
              <th className="px-6 py-3">Comissão Bruta <span className="text-xs text-blue-400">(*{FACTORS.COMISSAO_BRUTA})</span></th>
              <th className="px-6 py-3">Dívida Repor <span className="text-xs text-blue-400">(*{FACTORS.DIVIDA_REPOR})</span></th>
              <th className="px-6 py-3 text-green-700 font-bold">Lucro Líquido</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No sales records found. Add a new sale above.
                    </td>
                </tr>
            ) : (
                sales.map((sale) => {
                const metrics = calculateSaleMetrics(sale);
                return (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-slate-800">{sale.date}</td>
                    <td className="px-6 py-3 font-medium">{sale.quantity}</td>
                    <td className="px-6 py-3 text-slate-600">{metrics.valorRecebido.toLocaleString()} MZN</td>
                    <td className="px-6 py-3 text-slate-600">{metrics.comissaoBruta.toLocaleString()} MZN</td>
                    <td className="px-6 py-3 text-red-500">{metrics.dividaRepor.toLocaleString()} MZN</td>
                    <td className="px-6 py-3 font-bold text-green-700 bg-green-50/30">{metrics.lucroLiquido.toLocaleString()} MZN</td>
                    <td className="px-6 py-3 text-right">
                        <button 
                        onClick={() => onDeleteSale(sale.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                        <Trash2 size={16} />
                        </button>
                    </td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
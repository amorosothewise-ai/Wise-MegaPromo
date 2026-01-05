
import React, { useState, useEffect } from 'react';
import { DiamondSale, AppSettings } from '../types';
import { calculateSaleMetrics } from '../constants';
import { Plus, Trash2, Settings2, Package, Pencil, Check, X, Download } from 'lucide-react';

interface SalesTableProps {
  sales: DiamondSale[];
  onAddSale: (s: Omit<DiamondSale, 'id'>) => void;
  onEditSale: (s: DiamondSale) => void;
  onDeleteSale: (id: string) => void;
  settings: AppSettings;
}

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onAddSale, onEditSale, onDeleteSale, settings }) => {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newQty, setNewQty] = useState('');
  const [customRate, setCustomRate] = useState<string>(settings.defaultRepaymentRate.toString());
  const [showRateInput, setShowRateInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DiamondSale | null>(null);

  useEffect(() => {
    setCustomRate(settings.defaultRepaymentRate.toString());
  }, [settings.defaultRepaymentRate]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newQty) return;
    
    onAddSale({
      date: newDate,
      quantity: Number(newQty),
      repaymentRate: Number(customRate),
      salePrice: settings.defaultSalePrice,
      grossCommission: settings.defaultGrossCommission
    });
    setNewQty('');
  };

  const handleExportCSV = () => {
    const rows = sales.map(s => {
      const m = calculateSaleMetrics(s);
      const [y, mo, d] = s.date.split('-');
      return [
        `${d}/${mo}/${y}`,
        s.quantity,
        s.salePrice ?? settings.defaultSalePrice,
        s.grossCommission ?? settings.defaultGrossCommission,
        m.usedRate,
        m.valorRecebido,
        m.comissaoBruta,
        m.dividaRepor,
        m.lucroLiquido
      ].join(";");
    });
    
    const csvContent = "\uFEFF" + 
      ["Data;Qtd;Preço;Comissão Unit;Taxa;Total Recebido;Total Comiss;Dívida;Lucro"].join(";") + 
      "\n" + 
      rows.join("\n");
      
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const inputClass = "w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1 ml-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">Vendas Diamantes</h2>
            <button onClick={handleExportCSV} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg">
              <Download size={14} />CSV
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">Registro diário de vendas</p>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:flex md:flex-wrap gap-3 items-end">
          <div className="w-full md:w-auto">
            <label className={labelClass}>Data</label>
            <input 
              type="date" 
              required 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)} 
              className={inputClass}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className={labelClass}>Qtd</label>
            <div className="relative">
              <input 
                type="number" 
                min="1" 
                required 
                placeholder="Qtd" 
                value={newQty} 
                onChange={(e) => setNewQty(e.target.value)} 
                className={`${inputClass} md:w-28 pl-9`}
              />
              <Package size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>
          
          <div className={`${showRateInput ? 'block' : 'hidden'} md:block transition-all ${showRateInput ? 'w-full md:w-24 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <label className={labelClass}>Taxa (MZN)</label>
            <input 
              type="number" 
              min="0" 
              required 
              value={customRate} 
              onChange={(e) => setCustomRate(e.target.value)} 
              className={inputClass}
            />
          </div>
          
          <button 
            type="button" 
            onClick={() => setShowRateInput(!showRateInput)} 
            className={`hidden md:block p-2 rounded-lg border mb-[1px] h-[38px] transition-colors ${showRateInput ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
          >
            <Settings2 size={20} />
          </button>
          
          <button type="submit" className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-bold shadow-sm h-[38px] transition-colors">
            <Plus size={18} />
            <span className="md:hidden">Adicionar Venda</span>
            <span className="hidden md:inline">Add</span>
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Qtd</th>
              <th className="px-6 py-3">Recebido</th>
              <th className="px-6 py-3">Comissão</th>
              <th className="px-6 py-3">Dívida</th>
              <th className="px-6 py-3 text-green-700">Lucro</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma venda registrada.</td></tr>
            ) : (
              sales.map((s) => {
                const m = calculateSaleMetrics(s);
                const isEd = editingId === s.id;
                
                return (
                  <tr key={s.id} className={isEd ? 'bg-yellow-50' : 'hover:bg-slate-50'}>
                    {isEd ? (
                      <>
                        <td className="px-6 py-3">
                          <input type="date" value={editForm?.date || ''} onChange={(e)=>setEditForm(p=>p?{...p,date:e.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-full focus:ring-2 focus:ring-yellow-400 outline-none"/>
                        </td>
                        <td className="px-6 py-3">
                          <input type="number" value={editForm?.quantity || 0} onChange={(e)=>setEditForm(p=>p?{...p,quantity:+e.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-20 focus:ring-2 focus:ring-yellow-400 outline-none"/>
                        </td>
                        <td colSpan={4} className="px-6 py-3 italic text-slate-400 text-xs">Calculado automaticamente</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={()=>{if(editForm){onEditSale(editForm);setEditingId(null)}}} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={18}/></button>
                            <button onClick={()=>{setEditingId(null);setEditForm(null)}} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><X size={18}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3 text-slate-700 font-medium">{s.date.split('-').reverse().join('/')}</td>
                        <td className="px-6 py-3 font-bold text-slate-900 bg-slate-50/50">{s.quantity}</td>
                        <td className="px-6 py-3 text-slate-600">{m.valorRecebido.toLocaleString()}</td>
                        <td className="px-6 py-3 text-slate-600">{m.comissaoBruta.toLocaleString()}</td>
                        <td className="px-6 py-3 text-red-600 font-medium">
                          {m.dividaRepor.toLocaleString()}
                          <span className="text-[10px] block text-slate-400 font-normal">Taxa: {m.usedRate}</span>
                        </td>
                        <td className="px-6 py-3 font-bold text-green-700 bg-green-50/30 border-l border-green-100">{m.lucroLiquido.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={()=>{setEditingId(s.id);setEditForm({...s})}} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors"><Pencil size={16}/></button>
                            <button onClick={()=>onDeleteSale(s.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </>
                    )}
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

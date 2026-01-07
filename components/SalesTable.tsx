
import React, { useState, useMemo, useCallback } from 'react';
import { DiamondSale, AppSettings } from '../types';
import { calculateSaleMetrics, formatMZN, formatDateDisplay, isFutureDate } from '../constants';
import { Trash2, Package, Pencil, Check, X, Search, AlertCircle, Info, Share2, ChevronLeft, ChevronRight, Settings2, ArrowUpDown, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';

interface SalesTableProps {
  sales: DiamondSale[];
  onAddSale: (s: Omit<DiamondSale, 'id'>) => void;
  onEditSale: (s: DiamondSale) => void;
  onDeleteSale: (id: string) => void;
  onDeleteMultipleSales?: (ids: string[]) => void;
  settings: AppSettings;
}

const ITEMS_PER_PAGE = 15;

type SortKey = 'date' | 'quantity' | 'profit';
type SortOrder = 'asc' | 'desc' | null;

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onAddSale, onEditSale, onDeleteSale, onDeleteMultipleSales, settings }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(maxDate);
  const [newQty, setNewQty] = useState('');
  const [customRate, setCustomRate] = useState<string>(settings.defaultRepaymentRate.toFixed(2));
  const [showRateInput, setShowRateInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DiamondSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedSale, setSelectedSale] = useState<DiamondSale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'date', order: 'desc' });

  const metricsParams = {
    salePrice: settings.defaultSalePrice,
    grossCommission: settings.defaultGrossCommission,
    repaymentRate: settings.defaultRepaymentRate
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isFutureDate(newDate)) { 
      setError({ field: 'date', message: "Data futura não permitida." }); 
      return; 
    }
    if (!newQty || Number(newQty) <= 0) { 
      setError({ field: 'qty', message: "A quantidade deve ser maior que zero." }); 
      return; 
    }
    
    onAddSale({
      date: newDate,
      quantity: +newQty,
      repaymentRate: +customRate,
      salePrice: settings.defaultSalePrice,
      grossCommission: settings.defaultGrossCommission
    });
    setNewQty('');
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const shareSale = useCallback(async (s: DiamondSale) => {
    const m = calculateSaleMetrics(s, metricsParams);
    const text = `💎 *Wise Control - Registro de Venda*\n📅 Data: ${formatDateDisplay(s.date)}\n📦 Qtd: ${s.quantity} un.\n💰 Valor Bruto: ${formatMZN(m.valorRecebido)}\n💵 Comissão: ${formatMZN(m.comissaoBruta)}\n♻️ Reposição: ${formatMZN(m.dividaRepor)}\n📈 Lucro Líquido: ${formatMZN(m.lucroLiquido)}`;
    
    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({ title: 'Resumo da Venda', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Copiado para a área de transferência!");
      }
    } catch (err) {
      console.error("Erro ao compartilhar", err);
    }
  }, [settings]);

  const toggleSort = (key: SortKey) => {
    let order: SortOrder = 'desc';
    if (sortConfig.key === key) {
      if (sortConfig.order === 'desc') order = 'asc';
      else if (sortConfig.order === 'asc') order = null;
    }
    setSortConfig({ key, order });
  };

  const filteredAndSortedSales = useMemo(() => {
    const l = searchTerm.toLowerCase();
    let result = sales.filter(s => s.date.includes(l) || s.quantity.toString().includes(l));

    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'date') {
          valA = a.date; valB = b.date;
        } else if (sortConfig.key === 'quantity') {
          valA = a.quantity; valB = b.quantity;
        } else if (sortConfig.key === 'profit') {
          valA = calculateSaleMetrics(a, metricsParams).lucroLiquido;
          valB = calculateSaleMetrics(b, metricsParams).lucroLiquido;
        }
        
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [sales, searchTerm, sortConfig, settings]);

  const totalPages = Math.ceil(filteredAndSortedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedSales, currentPage]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSales.length && paginatedSales.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSales.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onDeleteMultipleSales && selectedIds.size > 0) {
      onDeleteMultipleSales(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideInRow {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-row { animation: slideInRow 0.3s ease-out forwards; }
      `}</style>

      {/* Modal Raio-X */}
      {selectedSale && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-300">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-lg"><Package size={22}/></div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Raio-X da Venda</h2>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-3 rounded-full hover:bg-slate-200 text-slate-600 transition-all border border-slate-200 shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-4 bg-white max-h-[65vh] overflow-y-auto custom-scrollbar">
              {[
                { label: 'Data', value: formatDateDisplay(selectedSale.date) },
                { label: 'Unidades Vendidas', value: `${selectedSale.quantity} un.` },
                { label: 'Preço Unitário', value: formatMZN(selectedSale.salePrice ?? settings.defaultSalePrice) },
                { label: 'Total Bruto', value: formatMZN(calculateSaleMetrics(selectedSale, metricsParams).valorRecebido) },
                { label: 'Comissão Total', value: formatMZN(calculateSaleMetrics(selectedSale, metricsParams).comissaoBruta) },
                { label: 'Reposição (Unit.)', value: formatMZN(selectedSale.repaymentRate ?? settings.defaultRepaymentRate) },
                { label: 'Reposição Total', value: formatMZN(calculateSaleMetrics(selectedSale, metricsParams).dividaRepor) },
                { label: 'LUCRO LÍQUIDO', value: formatMZN(calculateSaleMetrics(selectedSale, metricsParams).lucroLiquido), highlight: true }
              ].map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center p-4 rounded-2xl border-2 ${item.highlight ? 'bg-red-600 text-white border-red-700 shadow-xl shadow-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${item.highlight ? 'text-red-100' : 'text-slate-600'}`}>{item.label}</span>
                  <span className={`font-black text-sm ${item.highlight ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-200 pb-safe">
               <button onClick={() => shareSale(selectedSale)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all shadow-xl min-h-[50px]">
                 <Share2 size={18} /> Compartilhar Detalhes
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Registro */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <div className="bg-red-50 p-2 rounded-lg border border-red-100 shadow-sm"><Package size={18} className="text-red-600"/></div>
            Novo Lançamento
          </h2>
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2 border border-red-200 shadow-sm animate-pulse"><AlertCircle size={18}/>{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-700 ml-1">Data da Venda</label>
              <input 
                type="date" 
                required 
                max={maxDate} 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)} 
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-red-100 focus:border-red-600 outline-none transition-all shadow-sm ${error?.field === 'date' ? 'border-red-500' : 'border-slate-200'}`} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-700 ml-1">Quantidade</label>
              <div className="relative">
                <input 
                  type="number" 
                  required 
                  placeholder="0" 
                  inputMode="numeric"
                  value={newQty} 
                  onChange={e => setNewQty(e.target.value)} 
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-red-100 focus:border-red-600 outline-none transition-all shadow-sm ${error?.field === 'qty' ? 'border-red-500' : 'border-slate-200'}`} 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none uppercase">Unidades</span>
              </div>
            </div>
            {showRateInput && (
              <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <label className="text-[10px] font-black uppercase text-slate-700 ml-1">Taxa de Reposição Unit.</label>
                <div className="relative">
                  <input type="number" step="0.01" value={customRate} onChange={e => setCustomRate(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-red-100 outline-none shadow-sm" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none uppercase">MT/un.</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
               {!showRateInput && <button type="button" onClick={() => setShowRateInput(true)} className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors border-2 border-slate-200 shadow-sm min-w-[48px] min-h-[48px] flex items-center justify-center"><Settings2 size={20} /></button>}
               <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs py-4 shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-widest border border-red-700 min-h-[48px]">Registrar Venda</button>
            </div>
          </form>
        </div>

        {/* Filtro e Paginação */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" placeholder="Pesquisar registros..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm focus:ring-4 focus:ring-red-100 min-h-[48px]" />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-black border border-red-200 animate-in zoom-in duration-200 hover:bg-red-200 active:scale-95 transition-all min-h-[44px]">
                <Trash2 size={16} /> Excluir ({selectedIds.size})
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{currentPage} / {Math.max(1, totalPages)}</span>
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white text-slate-700 disabled:opacity-30 active:scale-90 transition-all shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronLeft size={18}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white text-slate-700 disabled:opacity-30 active:scale-90 transition-all shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronRight size={18}/></button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[9px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 w-10">
                  <button onClick={toggleSelectAll} className="p-2 text-slate-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                    {selectedIds.size === paginatedSales.length && paginatedSales.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}
                  </button>
                </th>
                <th className="px-4 py-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-2">
                    Data
                    {sortConfig.key === 'date' ? (sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-red-600" /> : <ChevronDown size={14} className="text-red-600" />) : <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => toggleSort('quantity')}>
                  <div className="flex items-center gap-2">
                    Quantidade
                    {sortConfig.key === 'quantity' ? (sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-red-600" /> : <ChevronDown size={14} className="text-red-600" />) : <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-8 py-5">Total Bruto</th>
                <th className="px-8 py-5 text-red-700 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => toggleSort('profit')}>
                  <div className="flex items-center gap-2">
                    Lucro Real
                    {sortConfig.key === 'profit' ? (sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-red-600" /> : <ChevronDown size={14} className="text-red-600" />) : <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedSales.map((s, index) => {
                const isEd = editingId === s.id;
                const isSelected = selectedIds.has(s.id);
                const m = calculateSaleMetrics(isEd && editForm ? editForm : s, metricsParams);
                return (
                  <tr key={s.id} 
                      className={`${isEd ? 'bg-amber-50' : isSelected ? 'bg-red-50/40' : 'hover:bg-slate-50'} group transition-colors animate-row`}
                      style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(s.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                        {isSelected ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}
                      </button>
                    </td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4"><input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm(p=>p?{...p,date:e.target.value}:null)} className="px-3 py-2 border-2 border-amber-300 rounded-lg w-full font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 bg-white min-h-[44px]"/></td>
                        <td className="px-8 py-4"><input type="number" value={editForm?.quantity} onChange={e=>setEditForm(p=>p?{...p,quantity:+e.target.value}:null)} className="px-3 py-2 border-2 border-amber-300 rounded-lg w-20 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 bg-white min-h-[44px]"/></td>
                        <td className="px-8 py-4 italic text-slate-500">{formatMZN(m.valorRecebido)}</td>
                        <td className="px-8 py-4"><span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black shadow-sm">{formatMZN(m.lucroLiquido)}</span></td>
                        <td className="px-8 py-4 text-right">
                           <button onClick={()=>{ if(isFutureDate(editForm?.date || '')){ setError({ field: 'date', message: "Data futura!" }); return; } onEditSale(editForm!); setEditingId(null);}} className="p-2.5 bg-emerald-600 text-white rounded-xl mr-2 active:scale-90 shadow-md border border-emerald-700 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"><Check size={20}/></button>
                           <button onClick={()=>{setEditingId(null);setEditForm(null)}} className="p-2.5 bg-slate-200 text-slate-800 rounded-xl active:scale-90 shadow-md border border-slate-300 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"><X size={20}/></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-700">{formatDateDisplay(s.date)}</td>
                        <td className="px-8 py-5">
                          <span className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-md min-w-[60px] inline-flex items-center justify-center border border-slate-700">
                            {s.quantity}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-slate-600 font-bold">{formatMZN(m.valorRecebido)}</td>
                        <td className="px-8 py-5 font-black text-red-700 text-sm">{formatMZN(m.lucroLiquido)}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2.5 transition-all">
                            <button onClick={()=>setSelectedSale(s)} className="p-2.5 bg-white text-slate-700 rounded-xl hover:bg-slate-100 border-2 border-slate-200 shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center" title="Raio-X"><Info size={20}/></button>
                            <button onClick={()=>shareSale(s)} className="p-2.5 bg-white text-slate-700 rounded-xl hover:bg-slate-100 border-2 border-slate-200 shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center" title="Compartilhar"><Share2 size={20}/></button>
                            <button onClick={()=>{setEditingId(s.id); setEditForm({...s})}} className="p-2.5 bg-white text-blue-700 rounded-xl hover:bg-blue-50 border-2 border-blue-100 shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center" title="Editar"><Pencil size={20}/></button>
                            <button onClick={()=>onDeleteSale(s.id)} className="p-2.5 bg-white text-red-700 rounded-xl hover:bg-red-50 border-2 border-red-100 shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center" title="Excluir"><Trash2 size={20}/></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

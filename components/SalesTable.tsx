
import React, { useState, useMemo } from 'react';
import { DiamondSale, AppSettings } from '../types';
import { calculateSaleMetrics, formatMZN, formatDateDisplay, isFutureDate } from '../constants';
import { Trash2, Package, Pencil, Check, X, Search, AlertCircle, Info, Share2, ChevronLeft, ChevronRight, Settings2, ArrowUpDown, CheckSquare, Square, SearchX } from 'lucide-react';

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

  const metricsParams = useMemo(() => ({
    salePrice: settings.defaultSalePrice,
    grossCommission: settings.defaultGrossCommission,
    repaymentRate: settings.defaultRepaymentRate
  }), [settings]);

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
    onAddSale({ date: newDate, quantity: +newQty, repaymentRate: +customRate, salePrice: settings.defaultSalePrice, grossCommission: settings.defaultGrossCommission });
    setNewQty('');
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    setError(null);
    if (isFutureDate(editForm.date)) {
      setError({ message: "Impossível salvar venda em data futura." });
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
      return;
    }
    onEditSale(editForm);
    setEditingId(null);
  };

  const filteredAndSortedSales = useMemo(() => {
    const l = searchTerm.toLowerCase();
    let result = sales.filter(s => 
      s.date.includes(l) || 
      formatDateDisplay(s.date).includes(l) || 
      s.quantity.toString().includes(l) || 
      s.id.toLowerCase().includes(l)
    );
    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'date') { valA = a.date; valB = b.date; }
        else if (sortConfig.key === 'quantity') { valA = a.quantity; valB = b.quantity; }
        else if (sortConfig.key === 'profit') { 
          valA = calculateSaleMetrics(a, metricsParams).lucroLiquido;
          valB = calculateSaleMetrics(b, metricsParams).lucroLiquido;
        }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [sales, searchTerm, sortConfig, metricsParams]);

  const totalPages = Math.ceil(filteredAndSortedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedSales, currentPage]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideInRow { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-row { animation: slideInRow 0.3s ease-out forwards; }
      `}</style>

      {selectedSale && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-300">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-lg"><Package size={22}/></div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Detalhes da Venda</h2>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-3 rounded-full hover:bg-slate-200 text-slate-600 transition-all border border-slate-200 shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center">
                <X size={24}/>
              </button>
            </div>
            <div className="p-8 space-y-4 bg-white max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-slate-100 rounded-xl text-center mb-4 border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Código de Referência</span>
                <span className="font-mono text-slate-900 font-bold">#{selectedSale.id.slice(-6).toUpperCase()}</span>
              </div>
              
              {(() => {
                const m = calculateSaleMetrics(selectedSale, metricsParams);
                return (
                  <div className="space-y-4">
                    {[
                      { label: 'Data do Lançamento', value: formatDateDisplay(selectedSale.date) },
                      { label: 'Quantidade Vendida', value: `${selectedSale.quantity} unidades` },
                      { label: 'Preço de Venda Unit.', value: formatMZN(m.usedPrice) },
                      { label: 'Valor Bruto da Venda', value: formatMZN(m.valorRecebido) },
                      { label: 'Comissão Bruta Total', value: formatMZN(m.comissaoBruta) },
                      { label: 'Total Reposição/Dívida', value: formatMZN(m.dividaRepor) },
                      { label: 'LUCRO LÍQUIDO FINAL', value: formatMZN(m.lucroLiquido), highlight: true }
                    ].map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-4 rounded-2xl border-2 ${item.highlight ? 'bg-red-600 text-white border-red-700 shadow-xl shadow-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.highlight ? 'text-red-100' : 'text-slate-600'}`}>{item.label}</span>
                        <span className={`font-black text-sm ${item.highlight ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-200 pb-safe">
               <button onClick={async () => {
                 const m = calculateSaleMetrics(selectedSale, metricsParams);
                 const text = `💎 WISE CONTROL - RECIBO DE VENDA\nRef: #${selectedSale.id.slice(-6).toUpperCase()}\nData: ${formatDateDisplay(selectedSale.date)}\nQtd: ${selectedSale.quantity}\nLucro Líquido: ${formatMZN(m.lucroLiquido)}`;
                 if(navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); alert("Dados copiados para a área de transferência!"); }
               }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all shadow-xl min-h-[50px] border-b-4 border-red-800">
                 <Share2 size={18} /> Partilhar Detalhes
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><div className="bg-red-50 p-2 rounded-lg border border-red-100 shadow-sm"><Package size={18} className="text-red-600"/></div>Novo Lançamento</h2>
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2 border border-red-200 animate-pulse"><AlertCircle size={18}/>{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-700 ml-1">Data</label><input type="date" max={maxDate} value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-600 transition-all shadow-sm" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-700 ml-1">Quantidade</label><input type="number" inputMode="numeric" value={newQty} onChange={e => setNewQty(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-600 shadow-sm" /></div>
            {showRateInput && <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-700 ml-1">Reposição Unit.</label><input type="number" step="0.01" value={customRate} onChange={e => setCustomRate(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none shadow-sm" /></div>}
            <div className="flex gap-2">
               <button type="button" onClick={() => setShowRateInput(!showRateInput)} className="p-3.5 bg-slate-100 rounded-xl border-2 border-slate-200 min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-slate-200 transition-colors"><Settings2 size={20} className="text-slate-700"/></button>
               <button type="submit" className="flex-1 bg-red-600 text-white rounded-xl font-black text-xs py-4 shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-widest border border-red-700 min-h-[48px] hover:bg-red-700">Registrar</button>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Pesquisar por data ou código..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm focus:border-red-600 min-h-[48px]" />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
            {selectedIds.size > 0 && <button onClick={() => {onDeleteMultipleSales?.(Array.from(selectedIds)); setSelectedIds(new Set());}} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-black border border-red-200 animate-in zoom-in hover:bg-red-200 transition-all min-h-[44px]">Excluir ({selectedIds.size})</button>}
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronLeft size={18} className="text-slate-700"/></button>
              <span className="text-[10px] font-black text-slate-600 uppercase w-12 text-center">{currentPage}/{Math.max(1, totalPages)}</span>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronRight size={18} className="text-slate-700"/></button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {paginatedSales.length > 0 ? (
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px]">
              <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[9px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 w-10"><button onClick={() => setSelectedIds(selectedIds.size === paginatedSales.length ? new Set() : new Set(paginatedSales.map(s => s.id)))} className="min-h-[44px] min-w-[44px] flex items-center justify-center">{selectedIds.size === paginatedSales.length && paginatedSales.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></th>
                  <th className="px-4 py-5">Ref.</th>
                  <th className="px-4 py-5 cursor-pointer hover:bg-slate-100" onClick={() => setSortConfig({ key: 'date', order: sortConfig.order === 'asc' ? 'desc' : 'asc' })}>Data <ArrowUpDown size={10} className="inline ml-1" /></th>
                  <th className="px-8 py-5">Quantidade</th>
                  <th className="px-8 py-5">Lucro Real</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedSales.map((s, idx) => {
                  const isEd = editingId === s.id;
                  const isSelected = selectedIds.has(s.id);
                  const m = calculateSaleMetrics(isEd && editForm ? editForm : s, metricsParams);
                  return (
                    <tr key={s.id} className={`${isEd ? 'bg-amber-50' : isSelected ? 'bg-red-50/40' : 'hover:bg-slate-50'} group animate-row transition-colors`} style={{ animationDelay: `${idx * 30}ms` }}>
                      <td className="px-6 py-4"><button onClick={() => toggleSelect(s.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400">{isSelected ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}</button></td>
                      <td className="px-4 py-5"><span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 group-hover:bg-slate-200 transition-colors">#{s.id.slice(-4).toUpperCase()}</span></td>
                      {isEd ? (
                        <>
                          <td className="px-4 py-4"><input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm(p=>p?{...p,date:e.target.value}:null)} className="px-3 py-2 border-2 border-amber-300 rounded-lg font-bold outline-none bg-white min-h-[44px]"/></td>
                          <td className="px-8 py-4"><input type="number" value={editForm?.quantity} onChange={e=>setEditForm(p=>p?{...p,quantity:+e.target.value}:null)} className="px-3 py-2 border-2 border-amber-300 rounded-lg w-20 font-bold outline-none bg-white min-h-[44px]"/></td>
                          <td className="px-8 py-4 font-black text-red-700">{formatMZN(m.lucroLiquido)}</td>
                          <td className="px-8 py-4 text-right flex justify-end gap-2">
                            <button onClick={handleEditSave} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"><Check size={20}/></button>
                            <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-200 text-slate-700 rounded-xl shadow-lg hover:bg-slate-300 active:scale-95 transition-all"><X size={20}/></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-5 font-black text-slate-700">{formatDateDisplay(s.date)}</td>
                          <td className="px-8 py-5"><span className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-sm border border-slate-700 shadow-sm">{s.quantity}</span></td>
                          <td className="px-8 py-5 font-black text-red-700 text-sm">{formatMZN(m.lucroLiquido)}</td>
                          <td className="px-8 py-5 text-right flex justify-end gap-3">
                            <button 
                              onClick={()=>setSelectedSale(s)} 
                              title="Ver Detalhes" 
                              className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl shadow-sm hover:bg-blue-100 hover:scale-105 active:scale-90 transition-all"
                            >
                              <Info size={20}/>
                            </button>
                            <button 
                              onClick={()=>{setEditingId(s.id); setEditForm({...s});}} 
                              title="Editar" 
                              className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl shadow-sm hover:bg-blue-100 hover:scale-105 active:scale-90 transition-all"
                            >
                              <Pencil size={20}/>
                            </button>
                            <button 
                              onClick={()=>onDeleteSale(s.id)} 
                              title="Excluir" 
                              className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm hover:bg-red-100 hover:scale-105 active:scale-90 transition-all"
                            >
                              <Trash2 size={20}/>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center space-y-4 opacity-50">
              <SearchX size={48} className="mx-auto text-slate-300" />
              <p className="font-black uppercase tracking-widest text-xs">Nenhum registro de venda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

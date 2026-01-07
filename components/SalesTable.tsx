
import React, { useState, useMemo, useCallback } from 'react';
import { DiamondSale, AppSettings } from '../types';
import { calculateReinvestment, formatMZN, formatDateDisplay, isFutureDate, FACTORS } from '../constants';
import { Trash2, Package, Pencil, Check, X, Search, AlertCircle, Info, Share2, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, SearchX, Calendar, Hash } from 'lucide-react';

interface SalesTableProps {
  sales: DiamondSale[];
  onAddSale: (s: Omit<DiamondSale, 'id'>) => void;
  onEditSale: (s: DiamondSale) => void;
  onDeleteSale: (id: string) => void;
  onDeleteMultipleSales?: (ids: string[]) => void;
  settings: AppSettings;
}

const ITEMS_PER_PAGE = 10;
type SortKey = 'date' | 'quantity' | 'debt';
type SortOrder = 'asc' | 'desc' | null;

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onAddSale, onEditSale, onDeleteSale, onDeleteMultipleSales, settings }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(maxDate);
  const [newQty, setNewQty] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DiamondSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedSale, setSelectedSale] = useState<DiamondSale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'date', order: 'desc' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isFutureDate(newDate)) { 
      setError({ field: 'date', message: "Data futura não permitida." }); 
      return; 
    }
    if (!newQty || Number(newQty) <= 0) { 
      setError({ field: 'qty', message: "Informe a quantidade." }); 
      return; 
    }
    onAddSale({ date: newDate, quantity: +newQty });
    setNewQty('');
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    if (isFutureDate(editForm.date)) {
      setError({ message: "Data futura não permitida." });
      return;
    }
    onEditSale(editForm);
    setEditingId(null);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedSales = useMemo(() => {
    const l = searchTerm.toLowerCase().trim();
    let result = sales.filter(s => {
      if (!l) return true;
      const formattedDate = formatDateDisplay(s.date);
      const idCode = s.id.slice(-6).toUpperCase();
      return (
        s.date.includes(l) || 
        formattedDate.includes(l) || 
        s.quantity.toString().includes(l) || 
        idCode.includes(l.toUpperCase())
      );
    });
    
    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'date') { valA = a.date; valB = b.date; }
        else if (sortConfig.key === 'quantity') { valA = a.quantity; valB = b.quantity; }
        else if (sortConfig.key === 'debt') { valA = calculateReinvestment(a.quantity); valB = calculateReinvestment(b.quantity); }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [sales, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedSales, currentPage]);

  const toggleSelect = useCallback((id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown size={14} className={`inline ml-1 transition-colors ${sortConfig.key === col ? 'text-blue-600' : 'text-slate-400'}`} />
  );

  return (
    <div className="space-y-6">
      <style>{`
        .scroll-item { will-change: transform, opacity; transform: translateZ(0); }
        .table-row-active { background-color: rgba(30, 58, 138, 0.05); }
        .btn-action-blue { @apply bg-blue-600 text-white shadow-lg shadow-blue-100 border-2 border-blue-700 hover:bg-blue-700 transition-all active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center; }
        .btn-action-red { @apply bg-red-600 text-white shadow-lg shadow-red-100 border-2 border-red-700 hover:bg-red-700 transition-all active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center; }
        .btn-action-outline-blue { @apply bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center; }
      `}</style>

      {selectedSale && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300 border-x border-t border-slate-200 sm:border-2">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Package size={24}/></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Recibo Wise</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lote #{selectedSale.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90 border-2 border-slate-100 min-h-[48px] min-w-[48px]">
                <X size={24} strokeWidth={3}/>
              </button>
            </div>
            <div className="p-10 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Ativações</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{selectedSale.quantity}</span>
                 </div>
                 <div className="p-6 bg-red-50 rounded-3xl border-2 border-red-100 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-red-500 block mb-2 tracking-widest">Dívida</span>
                    <span className="text-2xl font-black text-red-700 tracking-tighter">{formatMZN(calculateReinvestment(selectedSale.quantity))}</span>
                 </div>
              </div>
              <div className="space-y-4 p-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl">
                 <div className="flex justify-between items-center"><span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Data do Lote</span><span className="font-black text-slate-900 text-sm tracking-tight">{formatDateDisplay(selectedSale.date)}</span></div>
                 <div className="flex justify-between items-center"><span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Taxa Unitária</span><span className="font-black text-slate-900 text-sm tracking-tight">{formatMZN(FACTORS.REINVESTMENT_FEE)}</span></div>
              </div>
              <button onClick={() => {
                const text = `WISE CONTROL - RECIBO\nLote: #${selectedSale.id.slice(-6).toUpperCase()}\nData: ${formatDateDisplay(selectedSale.date)}\nQtd: ${selectedSale.quantity}\nDívida: ${formatMZN(calculateReinvestment(selectedSale.quantity))}`;
                if(navigator.share) navigator.share({ text }); else { navigator.clipboard.writeText(text); alert("Recibo copiado!"); }
              }} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-800">
                <Share2 size={20} strokeWidth={2.5}/> Partilhar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-200 overflow-hidden">
        <div className="p-8 sm:p-10 border-b-2 border-slate-100 bg-slate-50/20">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="bg-red-600 p-2.5 rounded-xl text-white shadow-xl"><Package size={20} strokeWidth={2.5}/></div>
            Registrar Novas Ativações
          </h2>
          {error && <div className="mb-8 p-5 bg-red-50 text-red-700 text-xs font-black rounded-2xl border-2 border-red-100 flex items-center gap-3 animate-in slide-in-from-top-4"><AlertCircle size={18}/>{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Data</label><div className="relative"><Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input type="date" max={maxDate} value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-red-600 outline-none transition-all shadow-sm" /></div></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Quantidade</label><div className="relative"><Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" inputMode="numeric" value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="0" className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-red-600 outline-none transition-all shadow-sm" /></div></div>
            <button type="submit" className="bg-red-600 text-white rounded-2xl font-black text-xs py-5 uppercase tracking-widest shadow-xl border-b-4 border-red-800 active:scale-95 transition-all hover:bg-red-700">Salvar Registro</button>
          </form>
        </div>

        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white">
          <div className="relative w-full max-w-md group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm" />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {selectedIds.size > 0 && <button onClick={() => {onDeleteMultipleSales?.(Array.from(selectedIds)); setSelectedIds(new Set());}} className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black animate-in zoom-in active:scale-90 transition-all shadow-xl border-b-4 border-red-800">ELIMINAR ({selectedIds.size})</button>}
            <div className="flex items-center gap-3">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:bg-slate-50 transition-colors shadow-sm min-h-[48px] min-w-[48px]"><ChevronLeft size={24} className="text-slate-900"/></button>
              <span className="text-[11px] font-black text-slate-900 uppercase w-10 text-center tracking-tighter">{currentPage}/{Math.max(1, totalPages)}</span>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-3 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:bg-slate-50 transition-colors shadow-sm min-h-[48px] min-w-[48px]"><ChevronRight size={24} className="text-slate-900"/></button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-100">
              <tr>
                <th className="px-10 py-6 w-10"><button onClick={() => setSelectedIds(selectedIds.size === paginatedSales.length ? new Set() : new Set(paginatedSales.map(s => s.id)))} className="min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors hover:text-blue-600">{selectedIds.size === paginatedSales.length && paginatedSales.length > 0 ? <CheckSquare size={24} className="text-blue-600"/> : <Square size={24}/>}</button></th>
                <th className="px-4 py-6">Ref.</th>
                <th className="px-4 py-6 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('date')}>Data <SortIcon col="date" /></th>
                <th className="px-8 py-6 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('quantity')}>Unidades <SortIcon col="quantity" /></th>
                <th className="px-8 py-6 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('debt')}>Dívida <SortIcon col="debt" /></th>
                <th className="px-10 py-6 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {paginatedSales.map((s) => {
                const isEd = editingId === s.id;
                const isSelected = selectedIds.has(s.id);
                return (
                  <tr key={s.id} className={`${isEd ? 'bg-amber-50/50' : isSelected ? 'table-row-active' : 'hover:bg-slate-50/30'} group transition-all duration-300 scroll-item`}>
                    <td className="px-10 py-5"><button onClick={() => toggleSelect(s.id)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-200 group-hover:text-slate-400 transition-all">{isSelected ? <CheckSquare size={22} className="text-blue-600"/> : <Square size={22}/>}</button></td>
                    <td className="px-4 py-5 font-mono text-[11px] text-slate-400 font-bold uppercase">#{s.id.slice(-6).toUpperCase()}</td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4"><input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm(p=>p?{...p,date:e.target.value}:null)} className="px-4 py-2 border-2 border-amber-300 rounded-xl font-black outline-none bg-white shadow-sm"/></td>
                        <td className="px-8 py-4"><input type="number" value={editForm?.quantity} onChange={e=>setEditForm(p=>p?{...p,quantity:+e.target.value}:null)} className="px-4 py-2 border-2 border-amber-300 rounded-xl w-32 font-black outline-none bg-white shadow-sm"/></td>
                        <td className="px-8 py-4 font-black text-red-700">{formatMZN(calculateReinvestment(editForm?.quantity || 0))}</td>
                        <td className="px-10 py-4 text-right flex justify-end gap-3"><button onClick={handleEditSave} className="btn-action-blue"><Check size={20} strokeWidth={3}/></button><button onClick={() => setEditingId(null)} className="p-3.5 bg-slate-200 text-slate-600 rounded-xl shadow-lg hover:bg-slate-300 transition-all"><X size={20} strokeWidth={3}/></button></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-900 text-sm tracking-tight">{formatDateDisplay(s.date)}</td>
                        <td className="px-8 py-5"><span className="bg-slate-950 text-white px-5 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-sm">{s.quantity} UN</span></td>
                        <td className="px-8 py-5 font-black text-red-600 text-sm tracking-tight">{formatMZN(calculateReinvestment(s.quantity))}</td>
                        <td className="px-10 py-5 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button onClick={()=>setSelectedSale(s)} className="btn-action-blue" title="Recibo"><Info size={20} strokeWidth={2.5}/></button>
                          <button onClick={()=>{setEditingId(s.id); setEditForm({...s});}} className="btn-action-outline-blue" title="Editar"><Pencil size={20} strokeWidth={2.5}/></button>
                          <button onClick={()=>onDeleteSale(s.id)} className="btn-action-red" title="Eliminar"><Trash2 size={20} strokeWidth={2.5}/></button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-6 space-y-6 bg-slate-50/50 overscroll-contain">
          {paginatedSales.map((s, idx) => {
            const isSelected = selectedIds.has(s.id);
            const debtValue = calculateReinvestment(s.quantity);
            return (
              <div key={s.id} className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all scroll-item shadow-sm animate-in slide-in-from-bottom-4 duration-500 ${isSelected ? 'border-blue-600 ring-[12px] ring-blue-50 shadow-2xl' : 'border-slate-200 shadow-sm'}`} style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      <button onClick={() => toggleSelect(s.id)} className="p-2 -ml-2 active:scale-125 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center">{isSelected ? <CheckSquare size={32} className="text-blue-600"/> : <Square size={32} className="text-slate-200"/>}</button>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Ref: #{s.id.slice(-6).toUpperCase()}</p>
                        <p className="font-black text-slate-900 text-xl tracking-tight leading-none">{formatDateDisplay(s.date)}</p>
                      </div>
                   </div>
                   <div className="bg-slate-950 text-white px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">{s.quantity} UN</div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Unidades</span>
                      <span className="text-2xl font-black text-slate-900">{s.quantity}</span>
                   </div>
                   <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-100 flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">Reinvestir</span>
                      <span className="text-xl font-black text-red-700">{formatMZN(debtValue)}</span>
                   </div>
                </div>
                <div className="flex gap-4 pt-6 border-t-2 border-slate-100">
                   <button onClick={()=>setSelectedSale(s)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-xl border-b-4 border-blue-800 min-h-[56px]">
                      <Info size={18} strokeWidth={2.5}/> Info
                   </button>
                   <button onClick={()=>{setEditingId(s.id); setEditForm({...s});}} className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-sm min-h-[56px]">
                      <Pencil size={18} strokeWidth={2.5}/> Editar
                   </button>
                   <button onClick={()=>onDeleteSale(s.id)} className="p-4 bg-red-600 text-white rounded-2xl border-2 border-red-700 active:scale-95 shadow-lg border-b-4 border-red-800 min-h-[56px] min-w-[56px] flex items-center justify-center">
                      <Trash2 size={24} strokeWidth={2.5}/>
                   </button>
                </div>
              </div>
            );
          })}
          {paginatedSales.length === 0 && (
            <div className="py-24 text-center space-y-4 opacity-40"><SearchX size={64} className="mx-auto text-slate-300"/><p className="font-black uppercase tracking-widest text-xs mt-4">Nenhum registro</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

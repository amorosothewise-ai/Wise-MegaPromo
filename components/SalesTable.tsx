
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { DiamondSale, AppSettings } from '../types.ts';
import { calculateReinvestment, formatMZN, formatDateDisplay, isFutureDate, FACTORS } from '../constants.ts';
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

const SaleRow = memo(({ 
  sale, isEd, isSelected, editForm, setEditForm, onEditSave, onCancelEdit, onSelect, onInfo, onEdit, onDelete 
}: { 
  sale: DiamondSale, isEd: boolean, isSelected: boolean, editForm: any, 
  setEditForm: any, onEditSave: any, onCancelEdit: any, onSelect: any, onInfo: any, onEdit: any, onDelete: any 
}) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const debtRate = sale.repaymentRate !== undefined ? sale.repaymentRate : FACTORS.REINVESTMENT_FEE;
  
  if (isEd) {
    return (
      <tr className="bg-amber-50/50 transition-colors">
        <td className="px-10 py-5"></td>
        <td className="px-4 py-5 font-mono text-[11px] text-slate-400 font-bold uppercase">#{sale.id.slice(-6).toUpperCase()}</td>
        <td className="px-4 py-4">
          <input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm((p:any)=>p?{...p,date:e.target.value}:null)} className="px-4 py-2 border-2 border-amber-300 rounded-xl font-black outline-none bg-white shadow-sm"/>
        </td>
        <td className="px-8 py-4">
          <input type="number" value={editForm?.quantity} onChange={e=>setEditForm((p:any)=>p?{...p,quantity:+e.target.value}:null)} className="px-4 py-2 border-2 border-amber-300 rounded-xl w-32 font-black outline-none bg-white shadow-sm"/>
        </td>
        <td className="px-8 py-4 font-black text-red-700">{formatMZN((editForm?.quantity || 0) * debtRate)}</td>
        <td className="px-10 py-4 text-right flex justify-end gap-3">
          <button onClick={onEditSave} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-transform"><Check size={20} strokeWidth={3}/></button>
          <button onClick={onCancelEdit} className="bg-slate-200 text-slate-600 p-3 rounded-xl shadow-lg active:scale-90 transition-transform"><X size={20} strokeWidth={3}/></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/30'} group transition-all duration-200 will-change-transform transform-gpu`}>
      <td className="px-10 py-5">
        <button onClick={() => onSelect(sale.id)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-200 group-hover:text-slate-400 transition-all active:scale-95">
          {isSelected ? <CheckSquare size={22} className="text-blue-600"/> : <Square size={22}/>}
        </button>
      </td>
      <td className="px-4 py-5 font-mono text-[11px] text-slate-400 font-bold uppercase">#{sale.id.slice(-6).toUpperCase()}</td>
      <td className="px-4 py-5 font-black text-slate-900 text-sm tracking-tight">{formatDateDisplay(sale.date)}</td>
      <td className="px-8 py-5"><span className="bg-slate-950 text-white px-5 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-sm">{sale.quantity} UN</span></td>
      <td className="px-8 py-5 font-black text-red-600 text-sm tracking-tight">{formatMZN(sale.quantity * debtRate)}</td>
      <td className="px-10 py-5 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        <button onClick={() => onInfo(sale)} className="bg-blue-600 text-white p-3 rounded-xl active:scale-90 transition-transform shadow-md"><Info size={20} strokeWidth={2.5}/></button>
        <button onClick={() => onEdit(sale)} className="bg-white text-blue-600 border-2 border-blue-600 p-3 rounded-xl active:scale-90 transition-transform shadow-sm"><Pencil size={20} strokeWidth={2.5}/></button>
        <button onClick={() => onDelete(sale.id)} className="bg-red-600 text-white p-3 rounded-xl active:scale-90 transition-transform shadow-md"><Trash2 size={20} strokeWidth={2.5}/></button>
      </td>
    </tr>
  );
});

const MobileSaleCard = memo(({ 
  sale, isSelected, onSelect, onInfo, onEdit, onDelete 
}: { 
  sale: DiamondSale, isSelected: boolean, onSelect: any, onInfo: any, onEdit: any, onDelete: any 
}) => {
  const debtRate = sale.repaymentRate !== undefined ? sale.repaymentRate : FACTORS.REINVESTMENT_FEE;
  const debtValue = sale.quantity * debtRate;
  return (
    <div 
      className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all shadow-sm active:scale-[0.98] transform-gpu will-change-transform ${isSelected ? 'border-blue-600 ring-[8px] ring-blue-50 shadow-xl' : 'border-slate-200 shadow-sm'}`} 
      style={{ contain: 'content' }}
    >
      <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-4">
            <button onClick={() => onSelect(sale.id)} className="p-2 -ml-2 min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-90">
              {isSelected ? <CheckSquare size={32} className="text-blue-600"/> : <Square size={32} className="text-slate-200"/>}
            </button>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Ref: #{sale.id.slice(-6).toUpperCase()}</p>
              <p className="font-black text-slate-900 text-xl tracking-tight leading-none">{formatDateDisplay(sale.date)}</p>
            </div>
         </div>
         <div className="bg-slate-950 text-white px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">{sale.quantity} UN</div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Unidades</span>
            <span className="text-2xl font-black text-slate-900">{sale.quantity}</span>
         </div>
         <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-100 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">Reinvestir</span>
            <span className="text-xl font-black text-red-700">{formatMZN(debtValue)}</span>
         </div>
      </div>
      <div className="flex gap-4 pt-6 border-t-2 border-slate-100">
         <button onClick={()=>onInfo(sale)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg border-b-4 border-blue-800 min-h-[56px]">
            <Info size={18} strokeWidth={2.5}/> Info
         </button>
         <button onClick={()=>onEdit(sale)} className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-sm min-h-[56px]">
            <Pencil size={18} strokeWidth={2.5}/> Editar
         </button>
         <button onClick={()=>onDelete(sale.id)} className="p-4 bg-red-600 text-white rounded-2xl border-2 border-red-700 active:scale-95 shadow-lg border-b-4 border-red-800 min-h-[56px] min-w-[56px] flex items-center justify-center">
            <Trash2 size={24} strokeWidth={2.5}/>
         </button>
      </div>
    </div>
  );
});

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onAddSale, onEditSale, onDeleteSale, onDeleteMultipleSales, settings }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(maxDate);
  const [newQty, setNewQty] = useState(settings.defaultQuantity.toString());
  
  // Atualiza campo de quantidade quando a configuração mudar
  useEffect(() => {
    setNewQty(settings.defaultQuantity.toString());
  }, [settings.defaultQuantity]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DiamondSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedSale, setSelectedSale] = useState<DiamondSale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'date', order: 'desc' });

  const handleAdd = useCallback((e: React.FormEvent) => {
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
    onAddSale({ 
      date: newDate, 
      quantity: +newQty,
      repaymentRate: settings.defaultRepaymentRate,
      salePrice: settings.defaultSalePrice,
      grossCommission: settings.defaultGrossCommission
    });
    setNewQty(settings.defaultQuantity.toString());
    if ('vibrate' in navigator) navigator.vibrate(12);
  }, [newDate, newQty, onAddSale, settings]);

  const handleEditSave = useCallback(() => {
    if (!editForm) return;
    if (isFutureDate(editForm.date)) {
      setError({ message: "Data futura não permitida." });
      return;
    }
    onEditSale(editForm);
    setEditingId(null);
  }, [editForm, onEditSale]);

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(8);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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
        const rateA = a.repaymentRate !== undefined ? a.repaymentRate : FACTORS.REINVESTMENT_FEE;
        const rateB = b.repaymentRate !== undefined ? b.repaymentRate : FACTORS.REINVESTMENT_FEE;
        if (sortConfig.key === 'date') { valA = a.date; valB = b.date; }
        else if (sortConfig.key === 'quantity') { valA = a.quantity; valB = b.quantity; }
        else if (sortConfig.key === 'debt') { valA = a.quantity * rateA; valB = b.quantity * rateB; }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [sales, searchTerm, sortConfig]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedSales, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedSales.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6" style={{ contain: 'content' }}>
      <style>{`
        .smooth-scroll-container { 
          -webkit-overflow-scrolling: touch; 
          scroll-behavior: smooth; 
          will-change: scroll-position;
          transform: translateZ(0);
        }
      `}</style>

      {selectedSale && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Package size={24}/></div>
                <div><h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Recibo Wise</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lote #{selectedSale.id.slice(-6).toUpperCase()}</p></div>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-3 rounded-2xl border-2 border-slate-100 active:scale-90 transition-transform min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={24} strokeWidth={3}/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 text-center"><span className="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Ativações</span><span className="text-3xl font-black text-slate-900 tracking-tighter">{selectedSale.quantity}</span></div>
                 <div className="p-6 bg-red-50 rounded-3xl border-2 border-red-100 text-center"><span className="text-[10px] font-black uppercase text-red-500 block mb-2 tracking-widest">Dívida</span><span className="text-2xl font-black text-red-700 tracking-tighter">{formatMZN(selectedSale.quantity * (selectedSale.repaymentRate !== undefined ? selectedSale.repaymentRate : FACTORS.REINVESTMENT_FEE))}</span></div>
              </div>
              <button onClick={() => {
                const text = `WISE CONTROL - RECIBO\nLote: #${selectedSale.id.slice(-6).toUpperCase()}\nData: ${formatDateDisplay(selectedSale.date)}\nQtd: ${selectedSale.quantity}\nDívida: ${formatMZN(selectedSale.quantity * (selectedSale.repaymentRate !== undefined ? selectedSale.repaymentRate : FACTORS.REINVESTMENT_FEE))}`;
                if(navigator.share) navigator.share({ text }); else { navigator.clipboard.writeText(text); alert("Copiado!"); }
              }} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-blue-800 active:scale-95 transition-all">Partilhar Recibo</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-200 overflow-hidden transform-gpu">
        <div className="p-8 sm:p-10 border-b-2 border-slate-100 bg-slate-50/20">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="bg-red-600 p-2.5 rounded-xl text-white shadow-xl"><Package size={20} strokeWidth={2.5}/></div> Registrar Novas Ativações
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data</label><input type="date" max={maxDate} value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-red-600" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Quantidade</label><input type="number" inputMode="numeric" value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="0" className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-red-600" /></div>
            <button type="submit" className="bg-red-600 text-white rounded-2xl font-black text-xs py-5 shadow-xl border-b-4 border-red-800 active:scale-95 transition-all h-[64px]">Salvar Registro</button>
          </form>
        </div>

        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-md">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-3">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:scale-90 transition-all shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center"><ChevronLeft size={24}/></button>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-3 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:scale-90 transition-all shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center"><ChevronRight size={24}/></button>
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto smooth-scroll-container min-h-[300px]">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-100">
              <tr>
                <th className="px-10 py-6 w-10"></th>
                <th className="px-4 py-6">Ref.</th>
                <th className="px-4 py-6 cursor-pointer" onClick={() => handleSort('date')}>Data <ArrowUpDown size={12} className="inline ml-1" /></th>
                <th className="px-8 py-6 cursor-pointer" onClick={() => handleSort('quantity')}>Unidades <ArrowUpDown size={12} className="inline ml-1" /></th>
                <th className="px-8 py-6 cursor-pointer" onClick={() => handleSort('debt')}>Dívida <ArrowUpDown size={12} className="inline ml-1" /></th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {paginatedSales.map((s) => (
                <SaleRow 
                  key={s.id} 
                  sale={s} 
                  isSelected={selectedIds.has(s.id)}
                  isEd={editingId === s.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEditSave={handleEditSave}
                  onCancelEdit={() => setEditingId(null)}
                  onSelect={toggleSelect}
                  onInfo={setSelectedSale}
                  onEdit={(sale) => { setEditingId(sale.id); setEditForm({...sale}); }}
                  onDelete={onDeleteSale}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-6 space-y-6 bg-slate-50/50 smooth-scroll-container min-h-[400px]">
          {paginatedSales.map((s) => (
            <MobileSaleCard 
              key={s.id}
              sale={s}
              isSelected={selectedIds.has(s.id)}
              onSelect={toggleSelect}
              onInfo={setSelectedSale}
              onEdit={(sale) => { setEditingId(sale.id); setEditForm({...sale}); }}
              onDelete={onDeleteSale}
            />
          ))}
          {paginatedSales.length === 0 && (
            <div className="py-24 text-center opacity-40"><SearchX size={64} className="mx-auto text-slate-300"/><p className="font-black uppercase tracking-widest text-xs mt-4">Nenhum registro</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

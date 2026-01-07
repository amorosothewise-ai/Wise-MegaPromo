
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { MonthlyCommission, Month, Operator, AppSettings } from '../types.ts';
import { MONTHS, OPERATORS, formatMZN, isFuturePeriod } from '../constants.ts';
import { Trash2, Pencil, Check, X, Wallet, Search, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, SearchX, Filter } from 'lucide-react';

interface CommissionsTableProps {
  commissions: MonthlyCommission[];
  onAddCommission: (c: Omit<MonthlyCommission, 'id'>) => void;
  onEditCommission: (c: MonthlyCommission) => void;
  onDeleteCommission: (id: string) => void;
  onDeleteMultipleCommissions?: (ids: string[]) => void;
  settings: AppSettings;
}

const ITEMS_PER_PAGE = 10;
type SortKey = 'period' | 'operator' | 'value';
type SortOrder = 'asc' | 'desc' | null;

const CommissionRow = memo(({ 
  comm, isEd, isSelected, editForm, setEditForm, onEditSave, onCancelEdit, onSelect, onEdit, onDelete 
}: { 
  comm: MonthlyCommission, isEd: boolean, isSelected: boolean, editForm: any, setEditForm: any, 
  onEditSave: any, onCancelEdit: any, onSelect: any, onEdit: any, onDelete: any 
}) => {
  const currentYear = new Date().getFullYear();
  
  if (isEd) {
    return (
      <tr className="bg-amber-50 transition-colors">
        <td className="px-8 py-5"></td>
        <td className="px-4 py-5 font-mono text-[10px] text-slate-400 font-black uppercase">#{comm.id.slice(-6)}</td>
        <td className="px-4 py-4 flex gap-2">
          <select value={editForm?.month} onChange={e=>setEditForm((p:any)=>p?{...p,month:e.target.value as Month}:null)} className="p-3 border-2 border-amber-300 rounded-xl text-[10px] font-black bg-white">{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select>
          <input type="number" max={currentYear} value={editForm?.year} onChange={e=>setEditForm((p:any)=>p?{...p,year:+e.target.value}:null)} className="p-3 border-2 border-amber-300 rounded-xl w-24 text-[10px] font-black bg-white"/>
        </td>
        <td className="px-8 py-4"><select value={editForm?.operator} onChange={e=>setEditForm((p:any)=>p?{...p,operator:e.target.value as Operator}:null)} className="p-3 border-2 border-amber-300 rounded-xl text-[10px] font-black uppercase bg-white">{OPERATORS.map(op=><option key={op} value={op}>{op}</option>)}</select></td>
        <td className="px-8 py-4"><input type="number" step="0.01" value={editForm?.commissionValue} onChange={e=>setEditForm((p:any)=>p?{...p,commissionValue:+e.target.value}:null)} className="p-3 border-2 border-amber-300 rounded-xl w-32 text-[10px] font-black bg-white"/></td>
        <td className="px-8 py-4 text-right flex justify-end gap-3"><button onClick={onEditSave} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg border-b-4 border-blue-800 active:scale-90 transition-transform min-h-[48px] min-w-[48px] flex items-center justify-center"><Check size={18}/></button><button onClick={onCancelEdit} className="p-3 bg-slate-400 text-white rounded-xl shadow-lg border-b-4 border-slate-600 active:scale-90 transition-transform min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={18}/></button></td>
      </tr>
    );
  }

  return (
    <tr className={`${isSelected?'bg-red-50/30':'hover:bg-slate-50/50'} transition-all group will-change-transform transform-gpu`}>
      <td className="px-8 py-5"><button onClick={()=>onSelect(comm.id)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-300 group-hover:text-slate-400 transition-all active:scale-95">{isSelected ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></td>
      <td className="px-4 py-5 font-mono text-[10px] text-slate-400 font-black uppercase">#{comm.id.slice(-6)}</td>
      <td className="px-4 py-5 font-black text-slate-900 uppercase text-xs tracking-tighter">{comm.month} / {comm.year}</td>
      <td className="px-8 py-5"><span className={`px-5 py-2 rounded-2xl font-black text-[9px] uppercase border-2 shadow-sm ${comm.operator===Operator.MPesa?'bg-red-600 text-white border-red-700':'bg-amber-600 text-white border-amber-700'}`}>{comm.operator}</span></td>
      <td className="px-8 py-5 font-black text-slate-900 text-base tracking-tighter">{formatMZN(comm.commissionValue)}</td>
      <td className="px-8 py-5 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={()=>onEdit(comm)} className="p-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl active:scale-90 shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center transition-transform"><Pencil size={18}/></button>
        <button onClick={()=>onDelete(comm.id)} className="p-3 bg-white border-2 border-red-600 text-red-600 rounded-2xl active:scale-90 shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center transition-transform"><Trash2 size={18}/></button>
      </td>
    </tr>
  );
});

const MobileCommissionCard = memo(({ 
  comm, onEdit, onDelete 
}: { 
  comm: MonthlyCommission, onEdit: any, onDelete: any 
}) => (
  <div 
    className="bg-white rounded-[2rem] p-8 border-2 border-slate-200 shadow-sm space-y-6 active:scale-[0.98] transition-all transform-gpu will-change-transform" 
    style={{ contain: 'content' }}
  >
    <div className="flex justify-between items-start">
       <div className="space-y-1.5">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{comm.month} / {comm.year}</p>
         <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-lg font-black text-[8px] uppercase border shadow-sm ${comm.operator===Operator.MPesa?'bg-red-600 text-white border-red-700':'bg-amber-600 text-white border-amber-700'}`}>{comm.operator}</span>
         </div>
         <p className="font-black text-slate-900 text-2xl tracking-tighter leading-none">{formatMZN(comm.commissionValue)}</p>
       </div>
       <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 border border-blue-100"><Wallet size={24}/></div>
    </div>
    <div className="flex gap-4 pt-6 border-t-2 border-slate-50">
       <button onClick={()=>onEdit(comm)} className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-sm min-h-[52px] transition-transform">
          <Pencil size={18} strokeWidth={2.5}/> Editar
       </button>
       <button onClick={()=>onDelete(comm.id)} className="p-4 bg-red-600 text-white rounded-2xl border-2 border-red-700 active:scale-95 shadow-lg border-b-4 border-red-800 min-h-[52px] min-w-[52px] flex items-center justify-center transition-transform">
          <Trash2 size={24} strokeWidth={2.5}/>
       </button>
    </div>
  </div>
));

export const CommissionsTable: React.FC<CommissionsTableProps> = ({ commissions, onAddCommission, onEditCommission, onDeleteCommission, settings }) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()] as Month);
  const [operator, setOperator] = useState(settings.defaultOperator);
  const [value, setValue] = useState('');

  useEffect(() => {
    setOperator(settings.defaultOperator);
  }, [settings.defaultOperator]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MonthlyCommission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operatorFilter, setOperatorFilter] = useState<Operator | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'period', order: 'desc' });

  const handleAdd = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!value || Number(value) <= 0) return;
    onAddCommission({ year, month, operator, commissionValue: +value });
    setValue('');
    if ('vibrate' in navigator) navigator.vibrate(12);
  }, [year, month, operator, value, onAddCommission]);

  const handleEditSave = useCallback(() => {
    if (!editForm) return;
    onEditCommission(editForm);
    setEditingId(null);
  }, [editForm, onEditCommission]);

  const toggleSelect = useCallback((id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(8);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filteredAndSortedComms = useMemo(() => {
    const l = searchTerm.toLowerCase().trim();
    let result = commissions.filter(c => {
      const matchText = (c.month.toLowerCase().includes(l) || c.operator.toLowerCase().includes(l) || c.year.toString().includes(l));
      const matchOperator = operatorFilter === 'all' || c.operator === operatorFilter;
      return matchText && matchOperator;
    });

    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'period') { valA = a.year * 100 + MONTHS.indexOf(a.month); valB = b.year * 100 + MONTHS.indexOf(b.month); }
        else if (sortConfig.key === 'operator') { valA = a.operator; valB = b.operator; }
        else if (sortConfig.key === 'value') { valA = a.commissionValue; valB = b.commissionValue; }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [commissions, searchTerm, operatorFilter, sortConfig]);

  const paginatedComms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedComms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedComms, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedComms.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6" style={{ contain: 'content' }}>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden transform-gpu">
        <div className="p-6 sm:p-10 border-b-2 border-slate-50 bg-slate-50/20">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg"><Wallet size={16} /></div> Registrar Comissões
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Ano</label><input type="number" value={year} onChange={(e)=>setYear(+e.target.value)} className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl font-black text-sm outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Mês</label><select value={month} onChange={(e)=>setMonth(e.target.value as Month)} className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl font-black text-sm outline-none">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Operadora</label><select value={operator} onChange={(e)=>setOperator(e.target.value as Operator)} className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl font-black text-sm outline-none">{OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Valor Final</label><input type="number" step="0.01" value={value} onChange={(e)=>setValue(e.target.value)} className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl font-black text-sm outline-none" placeholder="0,00 MT" /></div>
            <button type="submit" className="w-full bg-red-600 text-white rounded-xl font-black text-[10px] uppercase py-4 shadow-xl border-b-4 border-red-800 active:scale-95 transition-all h-[52px]">Salvar</button>
          </form>
        </div>

        <div className="px-6 py-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Filtrar lançamentos..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600 transition-colors" />
            </div>
            <div className="relative min-w-[160px]">
              <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={operatorFilter} 
                onChange={(e) => {setOperatorFilter(e.target.value as any); setCurrentPage(1);}} 
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none appearance-none cursor-pointer focus:border-red-600 transition-colors"
              >
                <option value="all">Todas Operadoras</option>
                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2.5 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:scale-90 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center shadow-sm"><ChevronLeft size={20}/></button>
             <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2.5 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:scale-90 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center shadow-sm"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto smooth-scroll-container min-h-[300px]">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 w-10"></th>
                <th className="px-4 py-5">Ref.</th>
                <th className="px-4 py-5">Período</th>
                <th className="px-8 py-5">Operadora</th>
                <th className="px-8 py-5">Comissão</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedComms.map((c) => (
                <CommissionRow 
                  key={c.id} 
                  comm={c} 
                  isSelected={selectedIds.has(c.id)}
                  isEd={editingId === c.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEditSave={handleEditSave}
                  onCancelEdit={() => setEditingId(null)}
                  onSelect={toggleSelect}
                  onEdit={(comm)=> {setEditingId(comm.id); setEditForm({...comm});}}
                  onDelete={onDeleteCommission}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-6 space-y-6 bg-slate-50/50 min-h-[400px]">
          {paginatedComms.map((c) => (
            <MobileCommissionCard 
              key={c.id}
              comm={c}
              onEdit={(comm)=> {setEditingId(comm.id); setEditForm({...comm});}}
              onDelete={onDeleteCommission}
            />
          ))}
          {paginatedComms.length === 0 && (
            <div className="py-20 text-center opacity-40"><SearchX size={56} className="mx-auto text-slate-300"/><p className="font-black uppercase tracking-widest text-[10px] mt-4">Nenhum registro encontrado</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

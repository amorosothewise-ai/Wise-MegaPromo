
import React, { useState } from 'react';
// Fix: Added Coins as ReinvestIcon to the imports from lucide-react to fix the reference error on line 120
import { X, Save, AlertTriangle, Users, Tag, TrendingUp, DollarSign, User, Database, Download, Upload, FileSpreadsheet, Layers, Smartphone, Filter, Coins as ReinvestIcon } from 'lucide-react';
import { AppSettings, Operator } from '../types';
import { EXPENSE_CATEGORIES, OPERATORS } from '../constants';

interface InputRowProps {
  label: string;
  field: keyof AppSettings;
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  suffix?: string;
  icon?: any;
}

const InputRow: React.FC<InputRowProps> = ({ label, field, localSettings, setLocalSettings, suffix = "MT", icon: Icon }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />}
      <input 
        type="number" 
        value={localSettings[field] as number} 
        onChange={(e) => setLocalSettings(prev => ({...prev, [field]: Number(e.target.value)}))} 
        className={`w-full ${Icon ? 'pl-12' : 'px-5'} pr-14 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-black bg-white text-slate-900 outline-none transition-all shadow-sm text-base`}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">{suffix}</span>
    </div>
  </div>
);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onFullBackup: () => void;
  onRestoreBackup: () => void;
  onExportAllCSV: () => void;
  t: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onFullBackup, onRestoreBackup, onExportAllCSV, t }) => {
  const [local, setLocal] = useState<AppSettings>(settings);

  const handlePercentageChange = (partner: 'A' | 'B', value: number) => {
    const val = Math.min(100, Math.max(0, value));
    if (partner === 'A') {
      setLocal(prev => ({ ...prev, partnerAPercentage: val, partnerBPercentage: 100 - val }));
    } else {
      setLocal(prev => ({ ...prev, partnerBPercentage: val, partnerAPercentage: 100 - val }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border-2 border-slate-200 flex flex-col h-full sm:h-auto max-h-[90vh]">
        <div className="p-8 sm:p-10 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.set}</h2>
            <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">Controle de Regras e Padrões</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-200 text-slate-500 transition-all active:scale-90 border-2 border-slate-200 bg-white">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="p-8 sm:p-10 space-y-10 overflow-y-auto custom-scrollbar bg-white flex-1">
          <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 flex gap-4 text-xs text-blue-900 font-bold shadow-sm">
            <AlertTriangle size={24} className="shrink-0 text-blue-600" />
            <p className="leading-relaxed">Defina os valores padrão para preenchimento automático em novos registros.</p>
          </div>

          <div className="space-y-6">
            <h4 className="flex items-center gap-3 font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-50 pb-2">
              <Layers size={16} className="text-blue-600" /> Operação e Fluxo Padrão
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputRow label="Quantidade de Ativação Padrão" field="defaultQuantity" localSettings={local} setLocalSettings={setLocal} suffix="UN" icon={Layers} />
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operadora Padrão</label>
                <div className="relative">
                  <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    value={local.defaultOperator} 
                    onChange={(e) => setLocal(prev => ({...prev, defaultOperator: e.target.value as Operator}))}
                    className="w-full pl-12 pr-5 py-4 border-2 border-slate-200 rounded-2xl font-black bg-white text-slate-900 outline-none appearance-none"
                  >
                    {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria de Custo Padrão</label>
                <div className="relative">
                  <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    value={local.defaultExpenseCategory} 
                    onChange={(e) => setLocal(prev => ({...prev, defaultExpenseCategory: e.target.value}))}
                    className="w-full pl-12 pr-5 py-4 border-2 border-slate-200 rounded-2xl font-black bg-white text-slate-900 outline-none appearance-none"
                  >
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 space-y-6">
            <h4 className="flex items-center gap-3 font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-50 pb-2">
              <DollarSign size={16} className="text-emerald-600" /> Valores Financeiros Padrão
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputRow label="Preço de Venda Sugerido" field="defaultSalePrice" localSettings={local} setLocalSettings={setLocal} icon={Tag} />
              <InputRow label="Comissão Bruta por Pacote" field="defaultGrossCommission" localSettings={local} setLocalSettings={setLocal} icon={TrendingUp} />
              <InputRow label="Taxa de Reinvestimento Fixa" field="defaultRepaymentRate" localSettings={local} setLocalSettings={setLocal} suffix="MT/Un" icon={ReinvestIcon} />
            </div>
          </div>

          <div className="pt-4 space-y-8">
            <h4 className="flex items-center gap-3 font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-50 pb-2">
              <Users size={16} className="text-purple-600" /> Parceiros e Divisão de Lucros
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Sócio A</label>
                 <div className="relative">
                   <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     value={local.partnerAName} 
                     onChange={(e) => setLocal(prev => ({...prev, partnerAName: e.target.value}))}
                     className="w-full pl-12 pr-5 py-4 border-2 border-slate-200 rounded-2xl focus:border-purple-600 font-black text-slate-900 outline-none shadow-sm text-sm"
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Sócio B</label>
                 <div className="relative">
                   <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     value={local.partnerBName} 
                     onChange={(e) => setLocal(prev => ({...prev, partnerBName: e.target.value}))}
                     className="w-full pl-12 pr-5 py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-600 font-black text-slate-900 outline-none shadow-sm text-sm"
                   />
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">% {local.partnerAName || 'Sócio A'}</label>
                <input 
                  type="number" 
                  value={local.partnerAPercentage} 
                  onChange={(e) => handlePercentageChange('A', Number(e.target.value))} 
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:border-purple-600 font-black text-slate-900 outline-none text-center text-lg"
                />
              </div>
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">% {local.partnerBName || 'Sócio B'}</label>
                <input 
                  type="number" 
                  value={local.partnerBPercentage} 
                  onChange={(e) => handlePercentageChange('B', Number(e.target.value))} 
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-600 font-black text-slate-900 outline-none text-center text-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-6">
            <h4 className="flex items-center gap-3 font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-50 pb-2">
              <Database size={16} className="text-red-600" /> {t.dataMgmt}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button 
                 onClick={onFullBackup}
                 className="flex items-center justify-center gap-3 p-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
               >
                 <Download size={18} /> {t.backupFull}
               </button>
               <button 
                 onClick={onRestoreBackup}
                 className="flex items-center justify-center gap-3 p-5 bg-white border-2 border-red-600 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 shadow-sm"
               >
                 <Upload size={18} /> {t.restoreFull}
               </button>
               <button 
                 onClick={onExportAllCSV}
                 className="sm:col-span-2 flex items-center justify-center gap-3 p-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg"
               >
                 <FileSpreadsheet size={18} /> {t.exportAllCsv}
               </button>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 bg-slate-50 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-end gap-4 pb-safe shrink-0">
          <button onClick={onClose} className="px-8 py-4 text-slate-500 hover:text-slate-900 font-black text-xs transition-colors uppercase tracking-widest">
            Cancelar
          </button>
          <button 
            onClick={() => { onSave(local); onClose(); }} 
            className="px-12 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all border-b-4 border-red-800"
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

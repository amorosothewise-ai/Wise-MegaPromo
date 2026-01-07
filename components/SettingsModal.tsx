
import React, { useState } from 'react';
import { X, Save, AlertTriangle, Users } from 'lucide-react';
import { AppSettings } from '../types';

interface InputRowProps {
  label: string;
  field: keyof AppSettings;
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  suffix?: string;
}

const InputRow: React.FC<InputRowProps> = ({ label, field, localSettings, setLocalSettings, suffix = "MZN" }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="flex items-center gap-4">
      <input 
        type="number" 
        value={localSettings[field]} 
        onChange={(e) => setLocalSettings(prev => ({...prev, [field]: Number(e.target.value)}))} 
        className="flex-1 px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-black bg-white text-slate-900 outline-none transition-all shadow-sm text-lg"
      />
      <span className="text-slate-600 font-black text-xs bg-slate-100 px-4 py-4 rounded-2xl border-2 border-slate-200">{suffix}</span>
    </div>
  </div>
);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  t: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, t }) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/85 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-slate-300 ring-8 ring-white/5">
        <div className="p-10 border-b-2 border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.set}</h2>
            <p className="text-[10px] text-slate-600 font-black mt-1.5 uppercase tracking-widest">Ajustes operacionais e fiscais de sócios</p>
          </div>
          <button onClick={onClose} className="p-3.5 rounded-2xl hover:bg-slate-200 text-slate-700 transition-all active:scale-90 border-2 border-slate-200 shadow-sm bg-white">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 flex gap-5 text-sm text-amber-950 font-bold shadow-md">
            <AlertTriangle size={32} className="shrink-0 text-amber-600" />
            <p className="leading-relaxed">Atenção: Alterações nos custos unitários e taxas afetam apenas <strong>novos lançamentos</strong>. A divisão de lucros é recalculada em tempo real sobre o <strong>balanço mensal total</strong>.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <InputRow label="Preço de Venda Padrão" field="defaultSalePrice" localSettings={local} setLocalSettings={setLocal} />
            <InputRow label="Comissão Bruta Padrão" field="defaultGrossCommission" localSettings={local} setLocalSettings={setLocal} />
          </div>

          <div className="pt-10 border-t-2 border-slate-100">
            <h4 className="flex items-center gap-3 font-black text-slate-900 text-base mb-6 uppercase tracking-widest">
              <Users size={22} className="text-purple-600" /> Divisão de Lucros de Sócios
            </h4>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1">Sócio A (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={local.partnerAPercentage} 
                    onChange={(e) => handlePercentageChange('A', Number(e.target.value))} 
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-600 font-black bg-white text-slate-900 outline-none shadow-sm text-lg"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1">Sócio B (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={local.partnerBPercentage} 
                    onChange={(e) => handlePercentageChange('B', Number(e.target.value))} 
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-black bg-white text-slate-900 outline-none shadow-sm text-lg"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
               <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-purple-600 h-full transition-all duration-500" style={{width: `${local.partnerAPercentage}%`}}></div>
                  <div className="bg-blue-600 h-full transition-all duration-500" style={{width: `${local.partnerBPercentage}%`}}></div>
               </div>
               <span className="text-[10px] font-black text-slate-500 uppercase">100% Total</span>
            </div>
          </div>
          
          <div className="pt-10 border-t-2 border-slate-100">
            <InputRow label="Taxa Reposição Padrão" field="defaultRepaymentRate" localSettings={local} setLocalSettings={setLocal} />
            <p className="text-[10px] text-slate-600 mt-4 font-black tracking-widest uppercase leading-tight italic">Este valor é subtraído da comissão bruta para gerar o lucro real por unidade vendida.</p>
          </div>
        </div>

        <div className="p-10 bg-slate-100 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-end gap-4">
          <button onClick={onClose} className="px-8 py-4 text-slate-600 hover:text-slate-900 font-black text-xs transition-colors uppercase tracking-[0.2em] order-2 sm:order-1">
            Cancelar e Sair
          </button>
          <button 
            onClick={() => { onSave(local); onClose(); }} 
            className="px-12 py-4 bg-red-600 text-white rounded-[1.5rem] hover:bg-red-700 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-red-300 transition-all active:scale-95 order-1 sm:order-2 border-b-4 border-red-800"
          >
            <Save size={20} /> Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

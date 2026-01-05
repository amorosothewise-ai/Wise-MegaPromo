
import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../types';

interface InputRowProps {
  label: string;
  field: keyof AppSettings;
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const InputRow: React.FC<InputRowProps> = ({ label, field, localSettings, setLocalSettings }) => (
  <div>
    <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>
    <div className="flex items-center gap-3">
      <input 
        type="number" 
        value={localSettings[field]} 
        onChange={(e) => setLocalSettings(prev => ({...prev, [field]: Number(e.target.value)}))} 
        className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold bg-slate-50"
      />
      <span className="text-slate-700 font-bold">MZN</span>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{t.settingsTitle}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-sm text-amber-900 font-medium">
            <AlertTriangle size={20} className="shrink-0 text-amber-700" />
            <p>Afeta apenas <strong>novas vendas</strong>.</p>
          </div>
          
          <InputRow label="Preço de Venda (Unitário)" field="defaultSalePrice" localSettings={local} setLocalSettings={setLocal} />
          <InputRow label="Comissão Bruta (Unitária)" field="defaultGrossCommission" localSettings={local} setLocalSettings={setLocal} />
          
          <div className="pt-4 border-t border-slate-100">
            <InputRow label={`${t.defaultRateLabel} (Custo)`} field="defaultRepaymentRate" localSettings={local} setLocalSettings={setLocal} />
            <p className="text-xs text-slate-600 mt-2 font-medium">{t.defaultRateDesc}</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:text-slate-900 font-bold text-sm">
            {t.cancel}
          </button>
          <button 
            onClick={() => { onSave(local); onClose(); }} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm flex items-center gap-2"
          >
            <Save size={16} />{t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

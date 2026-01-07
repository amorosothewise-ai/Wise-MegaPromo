
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue" 
}) => {
  const iconStyles: Record<string, string> = {
    blue: "bg-blue-600 text-white shadow-blue-200 border-blue-700",
    green: "bg-emerald-600 text-white shadow-emerald-200 border-emerald-700",
    purple: "bg-purple-600 text-white shadow-purple-200 border-purple-700",
    orange: "bg-orange-600 text-white shadow-orange-200 border-orange-700",
    red: "bg-red-600 text-white shadow-red-200 border-red-700"
  };

  const bgStyles: Record<string, string> = {
    blue: "border-blue-100",
    green: "border-emerald-100",
    purple: "border-purple-100",
    orange: "border-orange-100",
    red: "border-red-100"
  };

  return (
    <div className={`group bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 ${bgStyles[color] || ''} hover:shadow-xl hover:shadow-slate-300/30 hover:-translate-y-1 transition-all duration-500 cursor-default flex flex-col justify-between h-full`}>
      <div className="flex items-start justify-between mb-8 sm:mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-900 transition-colors">{title}</p>
        </div>
        <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110 border ${iconStyles[color] || iconStyles.blue}`}>
          <Icon size={18} strokeWidth={3} className="sm:w-6 sm:h-6" />
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter group-hover:scale-[1.01] origin-left transition-transform truncate">
          {value}
        </h2>
        {trend && (
          <div className="flex items-center gap-1.5">
             <span className="text-[8px] sm:text-[9px] text-emerald-800 font-black bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full uppercase tracking-widest">
               {trend}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

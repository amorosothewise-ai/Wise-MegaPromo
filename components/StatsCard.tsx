
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
    <div className={`group bg-white p-7 rounded-[2.5rem] shadow-sm border-2 ${bgStyles[color] || 'border-slate-200'} hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-2 transition-all duration-500 cursor-default flex flex-col justify-between h-full`}>
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 group-hover:text-slate-900 transition-colors">{title}</p>
        </div>
        <div className={`p-3.5 rounded-2xl shadow-xl transition-all duration-500 group-hover:scale-110 border ${iconStyles[color] || iconStyles.blue}`}>
          <Icon size={24} strokeWidth={3} />
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter group-hover:scale-[1.02] origin-left transition-transform">
          {value}
        </h2>
        {trend && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4 duration-700">
             <span className="text-[10px] text-emerald-800 font-black bg-emerald-100 border-2 border-emerald-200 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
               {trend}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

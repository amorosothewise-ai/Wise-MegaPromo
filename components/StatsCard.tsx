
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
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-600"
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline">
        <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        {trend && (
          <span className="ml-2 text-sm text-green-600 font-medium">{trend}</span>
        )}
      </div>
    </div>
  );
};

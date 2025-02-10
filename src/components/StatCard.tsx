import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
};

export function StatCard({ icon: Icon, title, value, subtitle, className = '' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-6 ${className}`}>
      <div className="flex items-start">
        <div className="p-2 rounded-lg bg-white/60">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
} 
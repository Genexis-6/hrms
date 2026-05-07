import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

const colorMap = {
  blue: 'border-blue-500 text-blue-600 bg-blue-50',
  green: 'border-green-500 text-green-600 bg-green-50',
  yellow: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  purple: 'border-purple-500 text-purple-600 bg-purple-50',
  red: 'border-red-500 text-red-600 bg-red-50',
};

const iconBgMap = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  yellow: 'bg-yellow-100',
  purple: 'bg-purple-100',
  red: 'bg-red-100',
};

export default function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${iconBgMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-white border-l-4 border-emerald-500 text-gray-800 shadow-lg shadow-emerald-100',
  error: 'bg-white border-l-4 border-red-500 text-gray-800 shadow-lg shadow-red-100',
  warning: 'bg-white border-l-4 border-amber-500 text-gray-800 shadow-lg shadow-amber-100',
  info: 'bg-white border-l-4 border-blue-500 text-gray-800 shadow-lg shadow-blue-100',
};

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => setIsExiting(true), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(onClose, 300);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-4 rounded-xl min-w-[320px] max-w-[420px] backdrop-blur-sm transition-all duration-300',
        styles[type],
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', iconColors[type])} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => setIsExiting(true)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
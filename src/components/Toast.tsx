import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface ToastProps {
  toast: ToastInfo | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-[#213145] text-[#eaf1ff] shadow-2xl border border-slate-700/60 max-w-md pointer-events-auto"
        >
          {toast.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#4edea3] shrink-0" />
          )}
          <span className="text-sm font-medium leading-snug">{toast.message}</span>
          <button
            onClick={onClose}
            className="ml-auto text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded transition-colors"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", danger = false }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${danger ? "bg-red-100" : "bg-amber-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle className={`w-8 h-8 ${danger ? "text-red-500" : "text-amber-500"}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

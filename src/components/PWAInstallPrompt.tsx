import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall: () => void;
  isInstalled: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall, isInstalled }) => {
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 glass-modal border border-white/10 rounded-2xl p-4 shadow-2xl animate-bounceIn">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/gb-logo.jpg"
            alt="GB Logo"
            className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md border border-white/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-tight">
              Instalar App Gracie Barra Guarne
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Instala la aplicación en tu pantalla de inicio en Android o iOS para acceso rapido.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onInstall}
          className="flex-1 bg-[#005596] hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-md glow-blue transition flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Agregar a la Pantalla de Inicio</span>
        </button>
      </div>
    </div>
  );
};

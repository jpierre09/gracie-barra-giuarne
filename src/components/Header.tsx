import React from 'react';
import { UserProfile } from '../types';
import { LogOut, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  isPWAInstalled: boolean;
  onInstallPWA: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenLogin,
  isPWAInstalled,
  onInstallPWA,
}) => {
  return (
    <header className="glass border-b border-white/10 sticky top-0 z-40 shadow-2xl backdrop-blur-xl bg-[#050505]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <img
              src="/gb-logo.jpg"
              alt="Gracie Barra Escudo Oficial"
              className="w-10 h-10 rounded-xl object-cover glow-blue border border-white/20 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -inset-1 rounded-xl bg-[#005596]/30 blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base tracking-tighter leading-none uppercase">
                Gracie Barra
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#005596]/20 text-[#005596] border border-[#005596]/40 uppercase tracking-wider">
                Guarne
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
              Escuela de Jiu-Jitsu
            </p>
          </div>
        </div>

        {/* Right Section Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* App Install Button */}
          {!isPWAInstalled && (
            <button
              onClick={onInstallPWA}
              className="hidden sm:flex items-center gap-1.5 bg-[#005596] hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg glow-blue border border-white/10 uppercase tracking-widest transition duration-200"
              title="Instalar como App en Android/iOS"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          )}

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 glass p-1.5 pl-3 rounded-xl border border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">
                  {currentUser.name}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/40'
                        : 'bg-[#005596]/20 text-blue-300 border border-[#005596]/40'
                    }`}
                  >
                    {currentUser.role === 'ADMIN' ? 'Profesor / Admin' : 'Estudiante'}
                  </span>
                </div>
              </div>

              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-white/20 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#005596] flex items-center justify-center font-bold text-white text-xs border border-white/20">
                  {currentUser.name.charAt(0)}
                </div>
              )}

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-[#C8102E] hover:bg-white/5 rounded-lg transition"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="bg-[#C8102E] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-md glow-red border border-white/10 transition uppercase tracking-wider"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

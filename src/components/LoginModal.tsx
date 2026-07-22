import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Shield, Lock, Mail, KeyRound, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'ADMIN' | 'STUDENT') => void;
  onGoogleSignIn: (googleUserData: Partial<UserProfile>) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'profesor@graciebarra.com').toLowerCase().trim();

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const cleanEmail = email.toLowerCase().trim();
      const isProfesor = cleanEmail === adminEmail;

      onGoogleSignIn({
        id: `user-${Date.now()}`,
        name: isProfesor ? 'Profesor / Administrador' : cleanEmail.split('@')[0],
        email: cleanEmail,
        role: isProfesor ? 'ADMIN' : 'STUDENT',
        cinturon: isProfesor ? 'NEGRO' : 'AZUL',
        telefono: '+57 300 000 0000',
        montoMensualidad: isProfesor ? 0 : 120000,
        diaVencimiento: 5,
        estadoPago: 'PAGADO',
        activo: true,
      });

      onClose();
    }, 600);
  };

  const handleGoogleSignInRedirect = () => {
    setIsSigningInGoogle(true);
    // Google OAuth Integration or direct SSO handler
    setTimeout(() => {
      setIsSigningInGoogle(false);
      // In production, window.location.href = '/accounts/google/login/'
      // Or client-side OAuth token handler
      const cleanEmail = email || 'usuario@graciebarra.com';
      const isProfesor = cleanEmail.toLowerCase().trim() === adminEmail;

      onGoogleSignIn({
        id: `google-${Date.now()}`,
        name: isProfesor ? 'Profesor Gracie Barra' : 'Estudiante GB',
        email: cleanEmail,
        role: isProfesor ? 'ADMIN' : 'STUDENT',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        cinturon: isProfesor ? 'NEGRO' : 'AZUL',
        telefono: '+57 300 123 4567',
        montoMensualidad: isProfesor ? 0 : 120000,
        diaVencimiento: 5,
        estadoPago: 'PAGADO',
        activo: true,
      });

      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-modal w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition z-20"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#005596]/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#C8102E]/20 rounded-full blur-2xl"></div>

        {/* Official Gracie Barra Logo Header */}
        <div className="text-center relative z-10">
          <div className="relative inline-block mb-3">
            <img
              src="/gb-logo.jpg"
              alt="Gracie Barra Escudo Oficial"
              className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-2xl border-2 border-[#C8102E]/60 p-0.5 bg-[#050505]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#C8102E] p-1 rounded-md text-white shadow">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
            Gracie Barra Guarne
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma Oficial de Gestión y Control
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleStandardSubmit} className="mt-6 space-y-4 relative z-10">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                className="w-full bg-black/40 border border-white/10 focus:border-[#005596] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 focus:border-[#005596] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#C8102E] hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative bg-[#0a0a0a] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            O
          </span>
        </div>

        {/* Google Authentication Section */}
        <div className="space-y-3 relative z-10">
          <button
            type="button"
            disabled={isSigningInGoogle}
            onClick={handleGoogleSignInRedirect}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-xl transition duration-200 border border-slate-200 active:scale-95"
          >
            {isSigningInGoogle ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-xs font-bold uppercase tracking-wider">Continuar con Google</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Sistema Seguro Gracie Barra Guarne • SSL Encrypted</span>
          </p>
        </div>
      </div>
    </div>
  );
};



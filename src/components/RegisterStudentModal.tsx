import React, { useState } from 'react';
import { UserProfile, BeltRank } from '../types';
import { UserPlus, X } from 'lucide-react';
import { BeltSelect } from './BeltBadge';

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterStudent: (newStudent: Partial<UserProfile>) => void;
}

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onRegisterStudent,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cinturon, setCinturon] = useState<BeltRank>('BLANCO');
  const [diaVencimiento, setDiaVencimiento] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterStudent({
      name,
      email,
      telefono,
      cinturon,
      montoMensualidad: 120000, // Tarifa global asignada automáticamente
      diaVencimiento,
      role: 'STUDENT',
      estadoPago: 'PENDIENTE',
      activo: true,
      fechaRegistro: new Date().toISOString().split('T')[0],
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
    });
    setName('');
    setEmail('');
    setTelefono('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-modal w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#005596] flex items-center justify-center text-white font-bold border border-white/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Registrar Nuevo Estudiante</h3>
            <p className="text-xs text-slate-400">
              Ingresa los datos del miembro para Gracie Barra Guarne
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre Completo del Alumno
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Andrés Felipe Restrepo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#005596] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="andres@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#005596] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="+57 300 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#005596] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cinturón / Grado de Jiu-Jitsu
            </label>
            <BeltSelect value={cinturon} onChange={setCinturon} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Día Límite de Pago
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaVencimiento}
                onChange={(e) => setDiaVencimiento(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#005596] transition"
              />
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Tarifa Mensual Inicial
              </span>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                $120,000 COP
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Asignada automáticamente por defecto.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 uppercase tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-[#C8102E] hover:bg-red-700 text-white text-xs font-bold glow-red border border-white/10 uppercase tracking-widest transition"
            >
              Guardar Estudiante
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

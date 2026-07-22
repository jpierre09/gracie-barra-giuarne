import React, { useState } from 'react';
import { UserProfile, PaymentRecord } from '../types';
import { BeltBadge } from './BeltBadge';
import {
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  CreditCard,
  FileText,
  Calendar,
  Award,
  DollarSign,
} from 'lucide-react';

interface StudentProfileProps {
  currentUser: UserProfile;
  personalPayments: PaymentRecord[];
  onReportPayment: (
    mesAnio: string,
    monto: number,
    metodo: 'NEQUI' | 'BANCOLOMBIA' | 'EFECTIVO' | 'TRANSFERENCIA',
    comprobanteUrl: string
  ) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  currentUser,
  personalPayments,
  onReportPayment,
}) => {
  const [mesAnio, setMesAnio] = useState('Julio 2026');
  const [monto, setMonto] = useState<number>(currentUser.montoMensualidad || 120000);
  const [metodo, setMetodo] = useState<'NEQUI' | 'BANCOLOMBIA' | 'EFECTIVO' | 'TRANSFERENCIA'>(
    'NEQUI'
  );
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setComprobanteUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReportPayment(
      mesAnio,
      monto,
      metodo,
      comprobanteUrl ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
    );
    setIsSubmittedSuccess(true);
    setTimeout(() => setIsSubmittedSuccess(false), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Student Personal Profile Banner */}
      <div className="glass border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#005596]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C8102E]/10 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          <div className="relative">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#005596]/50 shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#005596] flex items-center justify-center font-black text-white text-3xl shadow-xl border-2 border-white/20 italic">
                GB
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-[#050505] p-1.5 rounded-lg border border-white/10 shadow">
              <Shield className="w-4 h-4 text-[#C8102E]" />
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8102E] bg-[#C8102E]/15 px-3 py-1 rounded-full border border-[#C8102E]/30">
              Perfil Privado del Estudiante
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
              {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        {/* Student Personal Info Grid */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
          <div className="glass p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-[#C8102E]" /> Grado / Cinturón
            </span>
            <div className="mt-2">
              <BeltBadge rank={currentUser.cinturon} showLabel={true} size="md" />
            </div>
          </div>

          <div className="glass p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" /> Mensualidad
            </span>
            <p className="text-sm font-extrabold text-emerald-400 mt-1 font-mono">
              ${currentUser.montoMensualidad.toLocaleString('es-CO')} COP
            </p>
          </div>

          <div className="glass p-3.5 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#005596]" /> Día Límite de Pago
            </span>
            <p className="text-sm font-extrabold text-white mt-1">
              Día {currentUser.diaVencimiento} de cada mes
            </p>
          </div>
        </div>
      </div>

      {/* Personal Payment Status Badge Card */}
      <div className="glass border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#C8102E]" />
            <span>Mi Estado de Pago Mensual</span>
          </h3>

          {currentUser.estadoPago === 'PAGADO' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> Al Día (Pagado)
            </span>
          )}

          {currentUser.estadoPago === 'PENDIENTE' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" /> Pago Pendiente
            </span>
          )}

          {currentUser.estadoPago === 'VENCIDO' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/30 animate-pulse">
              <AlertTriangle className="w-4 h-4" /> Pago Vencido
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Para garantizar tu continuidad de entrenamiento en los tatamis de Gracie Barra Guarne, reporta tu transferencia o pago en efectivo a través del siguiente formulario.
        </p>

        {/* Section to Report Monthly Payment */}
        <div className="glass p-5 sm:p-6 rounded-xl border border-white/5 mt-4">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#C8102E]" />
            <span>Reportar Nuevo Pago de Mensualidad</span>
          </h4>

          {isSubmittedSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                ¡Comprobante enviado exitosamente! El profesor verificará tu pago en breve.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mes / Periodo a Cancelar
                </label>
                <input
                  type="text"
                  required
                  value={mesAnio}
                  onChange={(e) => setMesAnio(e.target.value)}
                  placeholder="Ej. Julio 2026"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#005596] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Monto Cancelado ($ COP)
                </label>
                <input
                  type="number"
                  required
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#005596] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Método de Pago
              </label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#005596] transition"
              >
                <option value="NEQUI" className="bg-[#050505]">Nequi</option>
                <option value="BANCOLOMBIA" className="bg-[#050505]">Bancolombia</option>
                <option value="EFECTIVO" className="bg-[#050505]">Efectivo al Profesor</option>
                <option value="TRANSFERENCIA" className="bg-[#050505]">Transferencia Bancaria</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Comprobante de Pago / Captura de Pantalla
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-300 transition">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Subir Captura de Pantalla / Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {(imagePreview || comprobanteUrl) && (
                <div className="mt-2.5 flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-white/10">
                  <img
                    src={imagePreview || comprobanteUrl}
                    alt="Vista previa del comprobante"
                    className="w-12 h-12 object-cover rounded-lg border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[11px] text-emerald-400 font-medium">
                    ✓ Imagen del comprobante lista para enviar
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#C8102E] hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition glow-red border border-white/10 uppercase tracking-wider active:scale-[0.99]"
            >
              Enviar Reporte de Pago
            </button>
          </form>
        </div>
      </div>

      {/* Personal Payment History List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>Historial de Mis Pagos</span>
        </h3>

        <div className="space-y-3">
          {personalPayments.map((pago) => (
            <div
              key={pago.id}
              className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition"
            >
              <div>
                <p className="text-xs font-extrabold text-white">{pago.mesAnio}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {pago.fechaPago} • {pago.metodoPago}
                  {pago.referencia ? ` (Ref: ${pago.referencia})` : ''}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-mono font-bold text-emerald-400">
                  ${pago.monto.toLocaleString('es-CO')} COP
                </p>
                <span
                  className={`text-[10px] font-bold ${
                    pago.estado === 'APROBADO'
                      ? 'text-emerald-400'
                      : pago.estado === 'RECHAZADO'
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  {pago.estado === 'APROBADO'
                    ? 'Aprobado'
                    : pago.estado === 'RECHAZADO'
                    ? 'Rechazado'
                    : 'Pendiente de Revisión'}
                </span>
              </div>
            </div>
          ))}

          {personalPayments.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">
              Aún no registras pagos anteriores en tu cuenta.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

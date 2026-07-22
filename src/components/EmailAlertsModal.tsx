import React from 'react';
import { EmailAlertLog } from '../types';
import { Send, CheckCircle2, X, Mail } from 'lucide-react';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingStudentsCount: number;
  onConfirmSend: () => void;
  alertsHistory: EmailAlertLog[];
}

export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({
  isOpen,
  onClose,
  pendingStudentsCount,
  onConfirmSend,
  alertsHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-modal w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#C8102E] flex items-center justify-center text-white font-bold border border-white/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Sistema de Alertas Automáticas
            </h3>
            <p className="text-xs text-slate-400">
              Recordatorios de cobro vía correo electrónico para Gracie Barra Guarne
            </p>
          </div>
        </div>

        {/* Email Template Preview Card */}
        <div className="glass p-5 rounded-xl border border-white/10 space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
            <span>Plantilla de Correo Automático:</span>
            <span className="text-emerald-400 font-mono font-semibold">Idioma: Español</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Asunto:</span>
            <p className="text-xs font-bold text-white">Recordatorio de Pago - Gracie Barra Guarne</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Mensaje:</span>
            <p className="text-xs text-slate-300 italic bg-white/5 p-3 rounded-xl border border-white/5 mt-1 leading-relaxed">
              "Hola [Nombre del Estudiante], te recordamos cordialmente que tu cuota mensual de Jiu-Jitsu ($120,000 COP) para el equipo Gracie Barra Guarne está próxima a vencer o pendiente. Por favor reporta tu comprobante de pago ingresando a la plataforma oficial."
            </p>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-white/10 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Destinatarios detectados:</p>
            <p className="text-xs text-slate-400">
              {pendingStudentsCount} estudiantes con mensualidad pendiente o por vencer.
            </p>
          </div>
          <button
            onClick={() => {
              onConfirmSend();
              onClose();
            }}
            className="flex items-center gap-2 bg-[#C8102E] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-md glow-red border border-white/10 uppercase tracking-wider transition"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Notificaciones</span>
          </button>
        </div>

        {/* Recent History */}
        <div>
          <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">
            Últimos Correos Emitidos
          </h4>
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {alertsHistory.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="glass p-3 rounded-lg border border-white/5 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">{log.studentName}</span>
                  <span className="text-slate-400 text-[10px] block">{log.studentEmail}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3" /> Enviado
                  </span>
                  <span className="text-[9px] text-slate-500">{log.fechaEnvio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

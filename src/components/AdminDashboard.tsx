import React, { useState } from 'react';
import { UserProfile, PaymentRecord, EmailAlertLog, BeltRank, PaymentStatus } from '../types';
import { BeltBadge } from './BeltBadge';
import {
  ShieldAlert,
  DollarSign,
  AlertTriangle,
  Users,
  Search,
  Filter,
  UserPlus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Settings,
  Edit3,
  X,
  Save,
  Shield,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  students: UserProfile[];
  payments: PaymentRecord[];
  alertsHistory: EmailAlertLog[];
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string) => void;
  onOpenRegisterModal: () => void;
  onSendEmailReminders: () => void;
  onUpdateStudentFee?: (studentId: string, newFee: number) => void;
  onUpdateAllFees?: (newGeneralFee: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  students,
  payments,
  alertsHistory,
  onApprovePayment,
  onRejectPayment,
  onOpenRegisterModal,
  onSendEmailReminders,
  onUpdateStudentFee,
  onUpdateAllFees,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [beltFilter, setBeltFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'PAYMENTS' | 'ALERTS'>('ROSTER');

  // Dynamic Fee Management Modal State (RBAC Protected)
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [generalFeeInput, setGeneralFeeInput] = useState<number>(0);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentFeeInput, setStudentFeeInput] = useState<number>(0);
  const [feeSaveSuccessMsg, setFeeSaveSuccessMsg] = useState<string | null>(null);

  // Security Protection Check (RBAC)
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-red-900/50 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-950 flex items-center justify-center text-red-500 mb-4 border border-red-800">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Acceso Restringido</h2>
        <p className="text-xs text-slate-400 mt-2">
          Esta vista está estrictamente protegida por Control de Acceso basado en Roles (RBAC). Solo los profesores y administradores de Gracie Barra Guarne tienen autorización para acceder a métricas financieras y nóminas de alumnos.
        </p>
      </div>
    );
  }

  // Financial Metrics Calculations (Dynamic Real-Time Calculation)
  const now = new Date();
  const currentMonthNum = now.getMonth(); // 0-11
  const currentYearNum = now.getFullYear();

  // Filter approved payments for current month dynamically
  const approvedPaymentsCurrentMonth = payments.filter((p) => {
    if (p.estado !== 'APROBADO') return false;
    if (p.fechaPago) {
      const pDate = new Date(p.fechaPago);
      if (!isNaN(pDate.getTime())) {
        return pDate.getMonth() === currentMonthNum && pDate.getFullYear() === currentYearNum;
      }
    }
    return true; // Fallback for newly approved payments in active session
  });

  const totalRevenue = approvedPaymentsCurrentMonth.reduce((acc, p) => acc + p.monto, 0);

  // Dynamic Outstanding Balances (sum of monthly fees for active students pending or overdue)
  const pendingStudents = students.filter(
    (s) => s.role === 'STUDENT' && s.activo && (s.estadoPago === 'PENDIENTE' || s.estadoPago === 'VENCIDO')
  );
  const outstandingBalances = pendingStudents.reduce((acc, s) => acc + s.montoMensualidad, 0);

  const totalStudentsCount = students.filter((s) => s.role === 'STUDENT').length;
  const activeStudentsCount = students.filter((s) => s.role === 'STUDENT' && s.activo).length;

  const paidStudentsCount = students.filter(
    (s) => s.role === 'STUDENT' && s.estadoPago === 'PAGADO'
  ).length;

  const collectionPercentage =
    totalStudentsCount > 0 ? Math.round((paidStudentsCount / totalStudentsCount) * 100) : 0;

  // Filtered Students
  const filteredStudents = students.filter((student) => {
    if (student.role !== 'STUDENT') return false;
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.telefono.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || student.estadoPago === statusFilter;
    const matchesBelt = beltFilter === 'ALL' || student.cinturon === beltFilter;

    return matchesSearch && matchesStatus && matchesBelt;
  });

  const getBeltBadgeColor = (belt: BeltRank) => {
    switch (belt) {
      case 'BLANCO':
        return 'bg-slate-100 text-slate-900 font-bold border border-slate-300';
      case 'AZUL':
        return 'bg-blue-900 text-blue-200 font-bold border border-blue-700';
      case 'MORADO':
        return 'bg-purple-950 text-purple-200 font-bold border border-purple-800';
      case 'MARRON':
        return 'bg-amber-950 text-amber-200 font-bold border border-amber-800';
      case 'NEGRO':
        return 'bg-slate-950 text-slate-100 font-bold border border-red-600/80 shadow';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const handleApplyGeneralFee = () => {
    if (onUpdateAllFees && generalFeeInput > 0) {
      onUpdateAllFees(generalFeeInput);
      setFeeSaveSuccessMsg(`¡Tarifa general actualizada a $${generalFeeInput.toLocaleString('es-CO')} COP para todos los estudiantes!`);
      setTimeout(() => setFeeSaveSuccessMsg(null), 3500);
    }
  };

  const handleSaveIndividualFee = (studentId: string) => {
    if (onUpdateStudentFee && studentFeeInput >= 0) {
      onUpdateStudentFee(studentId, studentFeeInput);
      setEditingStudentId(null);
      setFeeSaveSuccessMsg(`¡Cuota modificada correctamente!`);
      setTimeout(() => setFeeSaveSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Panel de Gestión
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gracie Barra Guarne • Resumen financiero y control de academia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsFeeModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-md text-xs transition glow border border-white/10 uppercase tracking-widest active:scale-[0.98]"
            title="Gestión de Tarifas y Cuotas Mensuales (Exclusivo Admin)"
          >
            <DollarSign className="w-4 h-4" />
            <span>Ajustar Tarifas</span>
          </button>

          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-2 bg-[#005596] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-md text-xs transition glow-blue border border-white/10 uppercase tracking-widest active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Estudiante</span>
          </button>

          <button
            onClick={onSendEmailReminders}
            className="flex items-center gap-2 bg-[#C8102E] hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-md text-xs transition glow-red border border-white/10 uppercase tracking-widest active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Nueva Alerta</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ingresos Mensuales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            ${totalRevenue.toLocaleString('es-CO')} <span className="text-xs text-slate-500 font-normal">COP</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{approvedPaymentsCurrentMonth.length} pagos aprobados este mes</span>
          </div>
        </div>

        {/* Outstanding Balances Card */}
        <div className="glass p-6 rounded-2xl border-l-4 border-[#C8102E] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pagos Pendientes</span>
            <div className="w-8 h-8 rounded-lg bg-[#C8102E]/20 flex items-center justify-center text-[#C8102E] border border-[#C8102E]/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#C8102E] mt-2">
            {pendingStudents.length} Estudiantes
          </p>
          <div className="mt-2 text-xs text-slate-400">
            Total adeudado: <span className="font-mono text-slate-200">${outstandingBalances.toLocaleString('es-CO')} COP</span>
          </div>
        </div>

        {/* Active Students Card */}
        <div className="glass p-6 rounded-2xl border-l-4 border-[#005596] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estudiantes Activos</span>
            <div className="w-8 h-8 rounded-lg bg-[#005596]/20 flex items-center justify-center text-[#005596] border border-[#005596]/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            {activeStudentsCount} Miembros
          </p>
          <div className="mt-2 text-xs text-slate-400">
            {totalStudentsCount} inscritos en nómina
          </div>
        </div>

        {/* Collection Percentage Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tasa de Recaudo</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-indigo-300 mt-2 font-mono">
            {collectionPercentage}%
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {paidStudentsCount} de {totalStudentsCount} al día
          </p>
        </div>
      </div>

      {/* Instant Alert Banner for Payments Pending Approval */}
      {payments.filter((p) => p.estado === 'PENDIENTE_VERIFICACION').length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>¡Nuevos Comprobantes Enviados por Estudiantes!</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Hay <strong className="text-white">{payments.filter((p) => p.estado === 'PENDIENTE_VERIFICACION').length} comprobante(s)</strong> pendientes por revisar. Puedes ver la captura y aprobar con un solo clic.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition uppercase tracking-wider shrink-0 shadow-lg active:scale-95"
          >
            Revisar y Aprobar
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-white/10 space-x-6">
        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`pb-3 text-xs font-bold transition uppercase tracking-wider border-b-2 ${
            activeTab === 'ROSTER'
              ? 'border-[#005596] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Roster Estudiantes ({filteredStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`pb-3 text-xs font-bold transition uppercase tracking-wider border-b-2 ${
            activeTab === 'PAYMENTS'
              ? 'border-[#005596] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Control de Pagos ({payments.filter((p) => p.estado === 'PENDIENTE_VERIFICACION').length} pendientes)
        </button>
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 text-xs font-bold transition uppercase tracking-wider border-b-2 ${
            activeTab === 'ALERTS'
              ? 'border-[#005596] text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Automatización ({alertsHistory.length})
        </button>
      </div>

      {/* TAB 1: ROSTER */}
      {activeTab === 'ROSTER' && (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Filters Bar */}
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-bold text-white text-sm">Lista de Miembros Recientes</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#005596] transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-[#005596] transition-all"
              >
                <option value="ALL" className="bg-[#050505]">Todos los Estados</option>
                <option value="PAGADO" className="bg-[#050505]">Pagado</option>
                <option value="PENDIENTE" className="bg-[#050505]">Pendiente</option>
                <option value="VENCIDO" className="bg-[#050505]">Vencido</option>
              </select>

              {/* Belt Filter */}
              <select
                value={beltFilter}
                onChange={(e) => setBeltFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-[#005596] transition-all"
              >
                <option value="ALL" className="bg-[#050505]">Todos los Cinturones</option>
                <option value="BLANCO" className="bg-[#050505]">Blanco</option>
                <option value="AZUL" className="bg-[#050505]">Azul</option>
                <option value="MORADO" className="bg-[#050505]">Morado</option>
                <option value="MARRON" className="bg-[#050505]">Marrón</option>
                <option value="NEGRO" className="bg-[#050505]">Negro</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold border-b border-white/5">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Cinturón</th>
                  <th className="px-6 py-3">Cuota</th>
                  <th className="px-6 py-3">Vencimiento</th>
                  <th className="px-6 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="w-8 h-8 rounded bg-slate-800 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{student.name}</p>
                        <p className="text-[10px] text-slate-500">{student.email}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {student.estadoPago === 'PAGADO' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">
                          AL DÍA
                        </span>
                      )}
                      {student.estadoPago === 'PENDIENTE' && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold uppercase">
                          PENDIENTE
                        </span>
                      )}
                      {student.estadoPago === 'VENCIDO' && (
                        <span className="px-2 py-1 bg-[#C8102E]/20 text-[#C8102E] rounded text-[10px] font-bold uppercase">
                          MORA
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold">
                      <BeltBadge rank={student.cinturon} showLabel={true} size="sm" />
                    </td>

                    <td className="px-6 py-4 text-xs font-mono font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>${student.montoMensualidad.toLocaleString('es-CO')} COP</span>
                        <button
                          onClick={() => {
                            setEditingStudentId(student.id);
                            setStudentFeeInput(student.montoMensualidad);
                            setIsFeeModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition"
                          title="Modificar Cuota de este Estudiante (Solo Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      Día {student.diaVencimiento}
                    </td>

                    <td className="px-6 py-4">
                      <button className="text-[#005596] hover:text-blue-400 text-xs font-bold transition">
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No se encontraron estudiantes con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS VERIFICATION */}
      {activeTab === 'PAYMENTS' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-base font-bold text-white">Comprobantes y Reportes de Pago</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Revisa los soportes subidos por los estudiantes para aprobar o rechazar el registro en sistema.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 uppercase text-[10px] text-slate-500 font-bold border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-6">Estudiante</th>
                  <th className="py-3.5 px-6">Periodo</th>
                  <th className="py-3.5 px-6">Monto</th>
                  <th className="py-3.5 px-6">Método / Ref</th>
                  <th className="py-3.5 px-6">Soporte</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((pago) => (
                  <tr key={pago.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{pago.studentName}</td>
                    <td className="py-3.5 px-6 text-slate-300">{pago.mesAnio}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-400">
                      ${pago.monto.toLocaleString('es-CO')} COP
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      <div>{pago.metodoPago}</div>
                      {pago.referencia && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Ref: {pago.referencia}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {pago.comprobanteUrl ? (
                        <a
                          href={pago.comprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#005596] hover:underline font-semibold"
                        >
                          <span>Ver Comprobante</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Sin imagen</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {pago.estado === 'APROBADO' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">Aprobado</span>
                      )}
                      {pago.estado === 'RECHAZADO' && (
                        <span className="px-2 py-1 bg-[#C8102E]/20 text-[#C8102E] rounded text-[10px] font-bold">Rechazado</span>
                      )}
                      {pago.estado === 'PENDIENTE_VERIFICACION' && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
                          Pendiente Revisión
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {pago.estado === 'PENDIENTE_VERIFICACION' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onApprovePayment(pago.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] shadow transition active:scale-95"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => onRejectPayment(pago.id)}
                            className="bg-[#C8102E] hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-[10px] transition active:scale-95"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Procesado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALERTS HISTORY */}
      {activeTab === 'ALERTS' && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Alertas Automáticas de Correo Enviadas</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Historial de notificaciones transmitidas en idioma Español a los estudiantes.
              </p>
            </div>
            <button
              onClick={onSendEmailReminders}
              className="bg-[#C8102E] hover:bg-red-700 text-white font-bold px-4 py-2 rounded-md text-xs glow-red transition border border-white/10 uppercase tracking-widest"
            >
              Disparar Recordatorios
            </button>
          </div>

          <div className="space-y-3">
            {alertsHistory.map((alert) => (
              <div
                key={alert.id}
                className="glass p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{alert.studentName}</span>
                    <span className="text-[10px] text-slate-400">({alert.studentEmail})</span>
                  </div>
                  <p className="text-xs font-semibold text-[#C8102E] mt-0.5">{alert.asunto}</p>
                  <p className="text-xs text-slate-300 mt-1 italic">"{alert.mensaje}"</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">{alert.fechaEnvio}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Enviado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee Management Modal (RBAC Protected - Only Admin) */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0c0f17] border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">
                    Gestión Dinámica de Tarifas (RBAC)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Exclusivo Administrador. Modifica las tarifas generales o cuotas individuales de los alumnos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsFeeModalOpen(false);
                  setEditingStudentId(null);
                }}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feeSaveSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feeSaveSuccessMsg}</span>
              </div>
            )}

            {/* Section A: Individual Student Fee Edit */}
            {editingStudentId ? (
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Cuota de Estudiante Específico</span>
                </h4>
                {(() => {
                  const targetStudent = students.find((s) => s.id === editingStudentId);
                  if (!targetStudent) return null;
                  return (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-300">
                        Estudiante: <span className="font-bold text-white">{targetStudent.name}</span> ({targetStudent.email})
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nuevo Monto de Mensualidad ($ COP):
                        </label>
                        <input
                          type="number"
                          value={studentFeeInput}
                          onChange={(e) => setStudentFeeInput(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingStudentId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveIndividualFee(targetStudent.id)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Cuota</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : null}

            {/* Section B: Global General Fee Application */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-[#005596]" />
                <span>Establecer Tarifa Base General</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Aplica un valor estandarizado de mensualidad para todos los miembros registrados en la nómina.
              </p>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={generalFeeInput}
                  onChange={(e) => setGeneralFeeInput(Number(e.target.value))}
                  placeholder="Ej. 120000"
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#005596]"
                />
                <button
                  type="button"
                  onClick={handleApplyGeneralFee}
                  className="shrink-0 bg-[#005596] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition uppercase tracking-wider"
                >
                  Aplicar a Todos
                </button>
              </div>
            </div>

            {/* Section C: Student List Quick Edit Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cuotas Actuales de Estudiantes ({students.filter((s) => s.role === 'STUDENT').length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5">
                {students
                  .filter((s) => s.role === 'STUDENT')
                  .map((st) => (
                    <div key={st.id} className="flex items-center justify-between pt-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{st.name}</span>
                        <BeltBadge rank={st.cinturon} showLabel={false} size="sm" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold">
                          ${st.montoMensualidad.toLocaleString('es-CO')} COP
                        </span>
                        <button
                          onClick={() => {
                            setEditingStudentId(st.id);
                            setStudentFeeInput(st.montoMensualidad);
                          }}
                          className="text-xs text-[#005596] hover:underline font-bold"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-right">
              <button
                onClick={() => {
                  setIsFeeModalOpen(false);
                  setEditingStudentId(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

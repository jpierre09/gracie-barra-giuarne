import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentRecord, EmailAlertLog } from './types';
import { INITIAL_STUDENTS, INITIAL_PAYMENTS, INITIAL_ALERT_LOGS } from './data/initialData';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentProfile } from './components/StudentProfile';
import { LoginModal } from './components/LoginModal';
import { RegisterStudentModal } from './components/RegisterStudentModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

export default function App() {
  // State Initialization with localStorage Persistence
  const [students, setStudents] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('gb_guarne_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('gb_guarne_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [alertsHistory, setAlertsHistory] = useState<EmailAlertLog[]>(() => {
    const saved = localStorage.getItem('gb_guarne_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERT_LOGS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gb_guarne_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // UI Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEmailAlertsOpen, setIsEmailAlertsOpen] = useState(false);

  // PWA & Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Sync initial configuration & state from Django REST API
  useEffect(() => {
    fetch('/api/config/')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.tarifa_mensual_base === 'number') {
          const globalFee = data.tarifa_mensual_base;
          setStudents((prev) =>
            prev.map((s) => (s.role === 'STUDENT' ? { ...s, montoMensualidad: globalFee } : s))
          );
          setCurrentUser((prev) =>
            prev && prev.role === 'STUDENT' ? { ...prev, montoMensualidad: globalFee } : prev
          );
        }
      })
      .catch(() => {});

    fetch('/api/me/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('gb_guarne_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('gb_guarne_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('gb_guarne_alerts', JSON.stringify(alertsHistory));
  }, [alertsHistory]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gb_guarne_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gb_guarne_current_user');
    }
  }, [currentUser]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle PWA Install Action
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPWAInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Para instalar Gracie Barra Guarne en iOS o Android, pulsa el botón "Compartir" en tu navegador y selecciona "Agregar a la Pantalla de Inicio".'
      );
    }
  };

  // Google Sign-In or Role Selector
  const handleGoogleSignIn = (googleUserData: Partial<UserProfile>) => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'profesor@graciebarra.com').toLowerCase().trim();
    const userEmail = (googleUserData.email || '').toLowerCase().trim();
    const assignedRole = userEmail === adminEmail ? 'ADMIN' : (googleUserData.role || 'STUDENT');

    const existing = students.find((s) => s.email.toLowerCase() === userEmail);
    if (existing) {
      const updatedUser = { ...existing, role: assignedRole };
      setCurrentUser(updatedUser);
      setStudents((prev) => prev.map((s) => (s.id === existing.id ? updatedUser : s)));
    } else {
      const newUser: UserProfile = {
        id: googleUserData.id || `user-${Date.now()}`,
        name: googleUserData.name || 'Nuevo Miembro',
        email: googleUserData.email || 'estudiante@graciebarra.com',
        avatarUrl:
          googleUserData.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        role: assignedRole,
        cinturon: googleUserData.cinturon || 'BLANCO',
        telefono: googleUserData.telefono || '+57 300 000 0000',
        montoMensualidad: googleUserData.montoMensualidad ?? 120000,
        diaVencimiento: googleUserData.diaVencimiento ?? 5,
        estadoPago: googleUserData.estadoPago || 'PENDIENTE',
        activo: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
      };
      setStudents((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
    }
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginOpen(true);
  };

  // Student Payment Reporting Action
  const handleStudentReportPayment = (
    mesAnio: string,
    monto: number,
    metodo: 'NEQUI' | 'BANCOLOMBIA' | 'EFECTIVO' | 'TRANSFERENCIA',
    comprobanteUrl: string
  ) => {
    if (!currentUser) return;

    const now = new Date();
    const formattedDateTime = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      mesAnio,
      monto,
      estado: 'PENDIENTE_VERIFICACION',
      fechaPago: formattedDateTime,
      metodoPago: metodo,
      referencia: `COMP-${Math.floor(Math.random() * 899999 + 100000)}`,
      comprobanteUrl,
      notas: 'Comprobante registrado por el alumno. Pendiente de aprobación por el Profesor.',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Send payment report to Django REST API
    fetch('/api/payments/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentUser.id,
        mesAnio,
        monto,
        metodoPago: metodo,
        comprobanteUrl,
      }),
    }).catch(() => {});

    // Update current student state to PENDIENTE (En revisión por aprobar)
    const updatedUser = { ...currentUser, estadoPago: 'PENDIENTE' as const };
    setCurrentUser(updatedUser);
    setStudents((prev) => prev.map((s) => (s.id === currentUser.id ? updatedUser : s)));
  };

  // Admin Payment Approval / Rejection Action
  const handleApprovePayment = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, estado: 'APROBADO' as const } : p))
    );

    // Update student payment status to PAGADO
    setStudents((prev) =>
      prev.map((s) => (s.id === payment.studentId ? { ...s, estadoPago: 'PAGADO' as const } : s))
    );

    if (currentUser?.id === payment.studentId) {
      setCurrentUser((prev) => (prev ? { ...prev, estadoPago: 'PAGADO' as const } : null));
    }
  };

  // Admin Fee Management Actions (RBAC Restricted)
  const handleUpdateStudentFee = (studentId: string, newFee: number) => {
    if (currentUser?.role !== 'ADMIN') return;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, montoMensualidad: newFee } : s))
    );
    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => (prev ? { ...prev, montoMensualidad: newFee } : null));
    }
  };

  const handleUpdateAllFees = (newGeneralFee: number) => {
    if (currentUser?.role !== 'ADMIN') return;
    setStudents((prev) =>
      prev.map((s) => (s.role === 'STUDENT' ? { ...s, montoMensualidad: newGeneralFee } : s))
    );
    fetch('/api/config/update-fee/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: newGeneralFee }),
    }).catch(() => {});
  };

  const handleRejectPayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, estado: 'RECHAZADO' as const } : p))
    );
  };

  // Admin Register Student Action
  const handleRegisterStudent = (newStudentData: Partial<UserProfile>) => {
    const newStudent: UserProfile = {
      id: `user-${Date.now()}`,
      name: newStudentData.name || 'Nuevo Alumno',
      email: newStudentData.email || 'alumno@graciebarra.com',
      avatarUrl: newStudentData.avatarUrl,
      role: 'STUDENT',
      cinturon: newStudentData.cinturon || 'BLANCO',
      telefono: newStudentData.telefono || '+57 300 000 0000',
      montoMensualidad: newStudentData.montoMensualidad || 120000,
      diaVencimiento: newStudentData.diaVencimiento || 5,
      estadoPago: 'PENDIENTE',
      activo: true,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    setStudents((prev) => [newStudent, ...prev]);
  };

  // Admin Trigger Automated Email Reminders
  const handleConfirmSendEmailReminders = () => {
    const pendingStudents = students.filter(
      (s) => s.role === 'STUDENT' && (s.estadoPago === 'PENDIENTE' || s.estadoPago === 'VENCIDO')
    );

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLogs: EmailAlertLog[] = pendingStudents.map((student) => ({
      id: `alert-${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      tipoAlerta: 'RECORDATORIO_VENCIMIENTO',
      asunto: 'Recordatorio de Pago - Gracie Barra Guarne',
      mensaje: `Hola ${student.name}, te recordamos que tu cuota mensual de Jiu-Jitsu ($${student.montoMensualidad.toLocaleString(
        'es-CO'
      )} COP) en Gracie Barra Guarne se encuentra pendiente. Ingresa a la PWA para adjuntar tu comprobante.`,
      fechaEnvio: formattedDate,
      exitoso: true,
    }));

    setAlertsHistory((prev) => [...newLogs, ...prev]);
  };

  const personalPayments = currentUser
    ? payments.filter((p) => p.studentId === currentUser.id)
    : [];

  const pendingStudentsCount = students.filter(
    (s) => s.role === 'STUDENT' && (s.estadoPago === 'PENDIENTE' || s.estadoPago === 'VENCIDO')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        isPWAInstalled={isPWAInstalled}
        onInstallPWA={handleInstallPWA}
        isOnline={isOnline}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentUser ? (
          <div className="max-w-md mx-auto my-12 glass-modal border border-white/10 rounded-2xl p-8 text-center shadow-2xl space-y-6">
            <img
              src="/gb-logo.jpg"
              alt="Gracie Barra Escudo Oficial"
              className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-2xl border-2 border-[#C8102E]/60 p-0.5 bg-[#050505]"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                Gracie Barra Guarne
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Bienvenido al portal oficial PWA de la escuela de Jiu-Jitsu. Por favor inicia sesión con tu cuenta de Google.
              </p>
            </div>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="w-full bg-[#C8102E] hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-xl glow-red border border-white/10 transition text-xs uppercase tracking-widest"
            >
              Ingresar con Google Auth
            </button>
          </div>
        ) : currentUser.role === 'ADMIN' ? (
          /* Admin View */
          <AdminDashboard
            currentUser={currentUser}
            students={students}
            payments={payments}
            alertsHistory={alertsHistory}
            onApprovePayment={handleApprovePayment}
            onRejectPayment={handleRejectPayment}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
            onSendEmailReminders={() => setIsEmailAlertsOpen(true)}
            onUpdateStudentFee={handleUpdateStudentFee}
            onUpdateAllFees={handleUpdateAllFees}
          />
        ) : (
          /* Student Private Profile View */
          <StudentProfile
            currentUser={currentUser}
            personalPayments={personalPayments}
            onReportPayment={handleStudentReportPayment}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-400">
            © 2026 Gracie Barra Guarne. Organizado para la Excelencia en Jiu-Jitsu.
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Aplicación PWA Instalable para Android & iOS • Google Authentication • Control RBAC
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSelectRole={(role) => {
          const matched = students.find((s) => s.role === role);
          if (matched) setCurrentUser(matched);
          setIsLoginOpen(false);
        }}
        onGoogleSignIn={handleGoogleSignIn}
      />

      <RegisterStudentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterStudent={handleRegisterStudent}
      />

      <EmailAlertsModal
        isOpen={isEmailAlertsOpen}
        onClose={() => setIsEmailAlertsOpen(false)}
        pendingStudentsCount={pendingStudentsCount}
        onConfirmSend={handleConfirmSendEmailReminders}
        alertsHistory={alertsHistory}
      />

      {/* PWA Floating Banner */}
      <PWAInstallPrompt onInstall={handleInstallPWA} isInstalled={isPWAInstalled} />
    </div>
  );
}

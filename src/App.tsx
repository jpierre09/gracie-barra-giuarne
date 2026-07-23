import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, PaymentRecord, EmailAlertLog, PaymentMethod } from './types';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentProfile } from './components/StudentProfile';
import { LoginModal } from './components/LoginModal';
import { RegisterStudentModal } from './components/RegisterStudentModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

async function fetchStudents(): Promise<{ students: UserProfile[]; globalFee: number }> {
  const res = await fetch('/api/students/');
  const data = await res.json();
  return {
    students: Array.isArray(data.students) ? data.students : [],
    globalFee: typeof data.globalFee === 'number' ? data.globalFee : 0,
  };
}

async function fetchPayments(): Promise<PaymentRecord[]> {
  const res = await fetch('/api/payments/');
  const data = await res.json();
  return Array.isArray(data.payments) ? data.payments : [];
}

async function fetchAlerts(): Promise<EmailAlertLog[]> {
  const res = await fetch('/api/alerts/');
  const data = await res.json();
  return Array.isArray(data.alerts) ? data.alerts : [];
}

export default function App() {
  // Roster / payments / alerts state is a mirror of PostgreSQL — no seed data, no localStorage cache.
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [alertsHistory, setAlertsHistory] = useState<EmailAlertLog[]>([]);
  const [globalFee, setGlobalFee] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Session identity only — who is logged in survives a refresh, but their data (fee, status, etc.)
  // is always re-read from the DB below, never trusted from this cached copy.
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

  // Single source of truth: re-pull the roster, payments and alert log straight from the
  // Django REST API (backed by PostgreSQL). Every button in the Admin panel calls this
  // right after its mutation so the screen updates instantly, without an F5.
  const refreshDashboardData = useCallback(async () => {
    const [studentsResult, paymentsResult, alertsResult] = await Promise.all([
      fetchStudents(),
      fetchPayments(),
      fetchAlerts(),
    ]);

    setStudents(studentsResult.students);
    setGlobalFee(studentsResult.globalFee);
    setPayments(paymentsResult);
    setAlertsHistory(alertsResult);

    setCurrentUser((prev) => {
      if (!prev || prev.role !== 'STUDENT') return prev;
      const fresh = studentsResult.students.find((s) => s.id === prev.id);
      return fresh ? { ...prev, ...fresh } : prev;
    });
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoadingData(true);
      await refreshDashboardData();
      setIsLoadingData(false);

      try {
        const res = await fetch('/api/me/');
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      } catch {
        // No hay sesión real de Django/allauth activa; se conserva la sesión local, si existe.
      }
    })();
  }, [refreshDashboardData]);

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

  // Login / Google Sign-In. Para ADMIN solo se asigna el rol de sesión (no tiene fila en
  // /api/students/, que solo lista STUDENT). Para STUDENT se usa el mismo endpoint de
  // registro para obtener-o-crear el perfil REAL en PostgreSQL, de modo que el id del
  // usuario en pantalla sea siempre un id real de la base de datos.
  const handleGoogleSignIn = async (googleUserData: Partial<UserProfile>) => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'profesor@graciebarra.com').toLowerCase().trim();
    const userEmail = (googleUserData.email || '').toLowerCase().trim();
    const assignedRole = userEmail === adminEmail ? 'ADMIN' : 'STUDENT';

    if (assignedRole === 'ADMIN') {
      setCurrentUser({
        id: `admin-${userEmail}`,
        name: googleUserData.name || 'Profesor / Administrador',
        email: userEmail,
        avatarUrl: googleUserData.avatarUrl,
        role: 'ADMIN',
        cinturon: googleUserData.cinturon || 'NEGRO',
        telefono: googleUserData.telefono || '+57 300 000 0000',
        montoMensualidad: 0,
        diaVencimiento: 1,
        estadoPago: 'PAGADO',
        activo: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
      });
      setIsLoginOpen(false);
      return;
    }

    try {
      const res = await fetch('/api/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: googleUserData.name || userEmail.split('@')[0],
          email: userEmail,
          telefono: googleUserData.telefono || '+57 300 000 0000',
          cinturon: googleUserData.cinturon || 'BLANCO',
        }),
      });
      const data = await res.json();
      if (data.success && data.student) {
        setCurrentUser({ ...data.student, avatarUrl: googleUserData.avatarUrl } as UserProfile);
        await refreshDashboardData();
      }
    } catch {
      // Backend no disponible: no se crea un estudiante local falso como respaldo.
    }

    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginOpen(true);
  };

  // Reporte de pago del estudiante: crea el registro real en PostgreSQL y refresca todo el panel.
  const handleStudentReportPayment = async (
    mesAnio: string,
    monto: number,
    metodo: PaymentMethod,
    comprobanteUrl: string
  ) => {
    if (!currentUser) return;

    await fetch('/api/payments/', {
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

    await refreshDashboardData();
  };

  // Aprobar / Rechazar comprobantes: pega al endpoint real de Django y refresca en caliente.
  const handleApprovePayment = async (paymentId: string) => {
    await fetch(`/api/payments/${paymentId}/approve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'aprobar' }),
    }).catch(() => {});
    await refreshDashboardData();
  };

  const handleRejectPayment = async (paymentId: string) => {
    await fetch(`/api/payments/${paymentId}/approve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'rechazar' }),
    }).catch(() => {});
    await refreshDashboardData();
  };

  // Gestión de tarifas (RBAC Admin): individual y general, ambas contra PostgreSQL.
  const handleUpdateStudentFee = async (studentId: string, newFee: number) => {
    if (currentUser?.role !== 'ADMIN') return;
    await fetch(`/api/students/${studentId}/update-fee/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: newFee }),
    }).catch(() => {});
    await refreshDashboardData();
  };

  const handleUpdateAllFees = async (newGeneralFee: number) => {
    if (currentUser?.role !== 'ADMIN') return;
    await fetch('/api/config/update-fee/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: newGeneralFee }),
    }).catch(() => {});
    await refreshDashboardData();
  };

  // Registro de nuevo estudiante (Admin): crea la fila real en PostgreSQL y refresca el roster.
  const handleRegisterStudent = async (newStudentData: Partial<UserProfile>) => {
    await fetch('/api/students/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newStudentData.name,
        email: newStudentData.email,
        telefono: newStudentData.telefono,
        cinturon: newStudentData.cinturon,
        diaVencimiento: newStudentData.diaVencimiento,
      }),
    }).catch(() => {});
    await refreshDashboardData();
  };

  // Disparo de recordatorios automáticos (Admin): crea las alertas reales en PostgreSQL.
  const handleConfirmSendEmailReminders = async () => {
    await fetch('/api/send-reminders/', { method: 'POST' }).catch(() => {});
    await refreshDashboardData();
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
            isLoadingData={isLoadingData}
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
        onSelectRole={() => {}}
        onGoogleSignIn={handleGoogleSignIn}
      />

      <RegisterStudentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterStudent={handleRegisterStudent}
        globalFee={globalFee}
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

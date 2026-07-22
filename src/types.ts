export type Role = 'ADMIN' | 'STUDENT';

export type BeltRank = 'BLANCO' | 'AZUL' | 'MORADO' | 'MARRON' | 'NEGRO';

export type PaymentStatus = 'PAGADO' | 'PENDIENTE' | 'VENCIDO';

export type VerificationStatus = 'APROBADO' | 'PENDIENTE_VERIFICACION' | 'RECHAZADO';

export type PaymentMethod = 'NEQUI' | 'BANCOLOMBIA' | 'EFECTIVO' | 'TRANSFERENCIA';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  cinturon: BeltRank;
  telefono: string;
  montoMensualidad: number; // in COP
  diaVencimiento: number; // Day of month 1-31
  estadoPago: PaymentStatus;
  activo: boolean;
  fechaRegistro: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  mesAnio: string; // e.g. "Julio 2026"
  monto: number;
  estado: VerificationStatus;
  fechaPago: string;
  metodoPago: PaymentMethod;
  referencia: string;
  comprobanteUrl?: string;
  notas?: string;
}

export interface EmailAlertLog {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  tipoAlerta: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
  exitoso: boolean;
}

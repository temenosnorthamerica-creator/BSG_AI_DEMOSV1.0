/**
 * TypeScript types for loan operations
 */

// Enums
export type LoanPurpose =
  | 'DEBT_CONSOLIDATION'
  | 'HOME_IMPROVEMENT'
  | 'MEDICAL_EXPENSES'
  | 'EDUCATION'
  | 'TRAVEL'
  | 'WEDDING'
  | 'EMERGENCY'
  | 'OTHER';

export type EmploymentType =
  | 'SALARIED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS_OWNER'
  | 'RETIRED'
  | 'OTHER';

export type VehicleType = 'NEW' | 'USED';

export type LoanStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'CLOSED';

export type LoanType = 'PERSONAL' | 'AUTO';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';

export type DocumentType = 'INE' | 'PASSPORT' | 'CURP' | 'OTHER';

// Address
export interface Address {
  street: string;
  exterior_number: string;
  interior_number?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Product Summary
export interface ProductSummary {
  product_id: string;
  product_type: string;
  product_name: string;
  status: string;
  balance?: number;
  currency: string;
}

// Customer
export interface Customer {
  id: string;
  document_type: DocumentType;
  document_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  full_name: string;
  birth_date: string;
  email: string;
  phone: string;
  address: Address;
  credit_score?: number;
  active_products: ProductSummary[];
  created_at: string;
  updated_at?: string;
}

export interface CustomerSearchQuery {
  document_number?: string;
  name?: string;
  account_number?: string;
  phone?: string;
}

export interface CustomerCreate {
  document_type: DocumentType;
  document_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  birth_date: string;
  email: string;
  phone: string;
  address: Address;
}

// Vehicle Info
export interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  vin?: string;
}

// Loan Requests
export interface PersonalLoanRequest {
  customer_id: string;
  amount: number;
  term_months: number;
  purpose: LoanPurpose;
  monthly_income: number;
  employment_type: EmploymentType;
  employment_months: number;
}

export interface AutoLoanRequest {
  customer_id: string;
  vehicle_price: number;
  down_payment: number;
  term_months: number;
  vehicle_info: VehicleInfo;
  monthly_income: number;
}

// Loan Simulation
export interface LoanSimulationRequest {
  loan_type: LoanType;
  amount: number;
  term_months: number;
  vehicle_type?: VehicleType;
}

export interface LoanSimulationResponse {
  loan_type: LoanType;
  amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  currency: string;
}

// Loan Response
export interface LoanResponse {
  loan_id: string;
  arrangement_id: string;
  customer_id: string;
  loan_type: LoanType;
  status: LoanStatus;
  amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_payment: number;
  currency: string;
  created_at: string;
  disbursement_date?: string;
}

export interface LoanSummary {
  loan_id: string;
  loan_type: LoanType;
  status: LoanStatus;
  amount: number;
  remaining_balance: number;
  monthly_payment: number;
  next_payment_date?: string;
  currency: string;
}

export interface LoanDetail extends LoanResponse {
  remaining_balance: number;
  total_interest: number;
  payments_made: number;
  payments_remaining: number;
  next_payment_date?: string;
  vehicle_info?: VehicleInfo;
}

// Payment Schedule
export interface Payment {
  payment_number: number;
  due_date: string;
  principal: number;
  interest: number;
  tax: number;
  total_payment: number;
  remaining_balance: number;
  status: PaymentStatus;
  paid_date?: string;
  paid_amount?: number;
}

export interface ScheduleSummary {
  total_payments: number;
  payments_made: number;
  payments_pending: number;
  payments_overdue: number;
  total_principal: number;
  total_interest: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  next_payment_date?: string;
  next_payment_amount?: number;
}

export interface PaymentSchedule {
  loan_id: string;
  arrangement_id: string;
  customer_id: string;
  currency: string;
  payments: Payment[];
  summary: ScheduleSummary;
  generated_at: string;
}

// Validation
export interface ValidationResult {
  eligible: boolean;
  errors: string[];
  warnings: string[];
}

// UI Helpers
export const LOAN_PURPOSE_LABELS: Record<LoanPurpose, string> = {
  DEBT_CONSOLIDATION: 'Consolidación de deudas',
  HOME_IMPROVEMENT: 'Mejoras del hogar',
  MEDICAL_EXPENSES: 'Gastos médicos',
  EDUCATION: 'Educación',
  TRAVEL: 'Viaje',
  WEDDING: 'Boda',
  EMERGENCY: 'Emergencia',
  OTHER: 'Otro',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  SALARIED: 'Asalariado',
  SELF_EMPLOYED: 'Independiente',
  BUSINESS_OWNER: 'Dueño de negocio',
  RETIRED: 'Jubilado',
  OTHER: 'Otro',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  NEW: 'Nuevo',
  USED: 'Seminuevo',
};

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  DISBURSED: 'Desembolsado',
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  PARTIALLY_PAID: 'Pago parcial',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INE: 'INE',
  PASSPORT: 'Pasaporte',
  CURP: 'CURP',
  OTHER: 'Otro',
};

export const PERSONAL_LOAN_TERMS = [6, 12, 18, 24, 36, 48, 60];
export const AUTO_LOAN_TERMS = [12, 24, 36, 48, 60, 72];

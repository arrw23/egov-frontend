export type Role = 'applicant' | 'hospital_staff' | 'agency_evaluator';

export type Screen =
  | 'login'
  | 'verify'
  | 'dashboard'
  | 'apply'
  | 'documents'
  | 'catalog'
  | 'submit'
  | 'hospital'
  | 'hospital_detail'
  | 'agency'
  | 'agency_review'
  | 'guarantee'
  | 'validate'
  | 'egov_hub'
  | 'builder';

export interface User {
  id: number;
  sub: string;
  name: string;
  email: string | null;
  role: Role;
  organization?: {
    id: number;
    name: string;
    code: string;
    type: 'hospital' | 'agency';
  } | null;
  verified_identity: boolean;
  avatar_url?: string;
  applicant_profile?: ApplicantProfile | null;
}

export interface ApplicantProfile {
  id: number;
  user_id: number;
  philsys_id: string;
  full_name: string;
  birth_date: string;
  consent_given: boolean;
  consent_timestamp: string;
  verification_reference: string;
  status: string;
}

export interface Financials {
  verified_bill: number;
  total_approved_assistance: number;
  total_utilized: number;
  remaining_uncovered_balance: number;
}

export interface MedicalCase {
  id: number;
  case_number: string;
  patient_name: string;
  applicant_name?: string;
  relationship: string;
  provider_id: number;
  provider?: Organization;
  condition_category: string;
  verified_bill: number;
  treatment_date?: string;
  status: string;
  financials?: Financials;
  documents?: CaseDocument[];
  hospital_requests?: HospitalRequest[];
  agency_applications?: AgencyApplication[];
  guarantee_letters?: GuaranteeLetter[];
  audit_events?: AuditEvent[];
  ai_summary?: AISummary;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  type: 'hospital' | 'agency';
  address?: string;
  contact_email?: string;
}

export interface CaseDocument {
  id: number;
  medical_case_id: number;
  document_type: string;
  title: string;
  storage_path: string;
  file_size: number;
  status: 'uploaded' | 'processing' | 'certified' | 'verified' | 'rejected';
  sha256_hash?: string;
  verification_reference?: string;
  extracted_json?: any;
}

export interface HospitalRequest {
  id: number;
  medical_case_id: number;
  hospital_id: number;
  hospital?: Organization;
  requested_document_types: string[];
  status: 'pending' | 'processing' | 'certified';
  medical_case?: MedicalCase;
}

export interface AgencyProgram {
  id: number;
  agency_id: number;
  agency?: Organization;
  name: string;
  code: string;
  description: string;
  max_assistance_amount: number;
  criteria_summary: string;
}

export interface AgencyApplication {
  id: number;
  medical_case_id: number;
  agency_program_id: number;
  medical_case?: MedicalCase;
  agency_program?: AgencyProgram;
  requested_amount: number;
  approved_amount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'partially_approved' | 'denied' | 'needs_info';
  decision_reason?: string;
  remarks?: string;
  validity_days: number;
  guarantee_letter?: GuaranteeLetter;
}

export interface GuaranteeLetter {
  id: number;
  gl_number: string;
  agency_application_id: number;
  medical_case_id: number;
  patient_name: string;
  applicant_name: string;
  hospital_name: string;
  approved_amount: number;
  covered_service: string;
  issue_date: string;
  expiration_date: string;
  digital_signatory_name: string;
  digital_signatory_role: string;
  qr_payload: string;
  chain_reference: string;
  status: 'valid' | 'partially_utilized' | 'fully_utilized' | 'expired' | 'cancelled';
  utilizations?: GuaranteeUtilization[];
}

export interface GuaranteeUtilization {
  id: number;
  guarantee_letter_id: number;
  hospital_id: number;
  utilized_amount: number;
  utilization_date: string;
  billing_reference: string;
  status: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read_at: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  medical_case_id?: number;
  actor_name: string;
  action: string;
  description: string;
  chain_hash: string;
  created_at: string;
}

export interface AISummary {
  summary: string;
  missing_requirements: string[];
  completeness_score: number;
  disclaimer: string;
}

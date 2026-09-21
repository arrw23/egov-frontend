import { AgencyApplication, AgencyProgram, AuditEvent, CaseDocument, Financials, GuaranteeLetter, HospitalRequest, MedicalCase, NotificationItem, Organization, User } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
const API_ROOT = process.env.NEXT_PUBLIC_API_ROOT || 'http://localhost:8000';

/**
 * Bearer token for the Laravel Sanctum session.
 *
 * Every API route sits behind `auth:sanctum`, so requests without this token
 * are answered 401 and wrong-role requests 403. The token lives in
 * localStorage so a reload keeps the session; it is never a shared secret.
 */
const TOKEN_STORAGE_KEY = 'gabaymed_token';

let AUTH_TOKEN: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export function setAuthToken(token: string | null): void {
  AUTH_TOKEN = token;
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage may be unavailable (private mode); the in-memory token still works.
  }
}

export function getAuthToken(): string | null {
  return AUTH_TOKEN;
}

/** Authorization header for the current session, when there is one. */
const authHeaders = (): Record<string, string> =>
  AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

/** An HTTP failure returned by the GabayMed backend (never a network failure). */
export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;

/** Pulls a human-readable message out of a Laravel error body. */
function errorMessage(body: any, status: number): string {
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message) return body.message;
    if (body.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors as Record<string, unknown[]>)
        .flat()
        .find((v) => typeof v === 'string');
      if (typeof first === 'string') return first;
    }
  }
  return `API error (${status})`;
}

/**
 * Marks a canned sandbox payload so the UI can label it honestly. Only
 * Integration Hub demo calls still fall back; core workflow calls never do.
 */
const SANDBOX_MARKER = '__gabaymedSandbox';

function markSandbox<T>(value: T, endpoint: string): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    try {
      Object.defineProperty(value as object, SANDBOX_MARKER, {
        value: {
          endpoint,
          note: 'sandbox response — backend unreachable, canned demo payload',
        },
        enumerable: false,
        configurable: true,
      });
    } catch {
      // Frozen payloads simply cannot carry the marker; the Hub shows its own badge.
    }
  }
  return value;
}

export const isSandboxResponse = (value: unknown): boolean =>
  !!(value && typeof value === 'object' && (value as any)[SANDBOX_MARKER]);

export const sandboxResponseInfo = (value: unknown): { endpoint: string; note: string } | null =>
  (value && typeof value === 'object' && ((value as any)[SANDBOX_MARKER] || null)) || null;

/**
 * Single HTTP entry point.
 *
 * Real HTTP errors (4xx/5xx) are always surfaced as ApiError so screens can
 * show them — they are never silently replaced by canned data. A fallback is
 * only consulted when the request could not reach the backend at all, and only
 * the Integration Hub demo calls pass one.
 */
async function request<T>(endpoint: string, options: RequestInit = {}, useRoot: boolean = false, fallbackSupplier?: () => T): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };

  const baseUrl = useRoot ? API_ROOT : API_BASE;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    if (fallbackSupplier) {
      console.warn(`[sandbox] ${baseUrl}${endpoint} unreachable; returning canned Integration Hub payload.`, networkErr);
      return markSandbox(fallbackSupplier(), endpoint);
    }
    throw new Error(`Could not reach the GabayMed API at ${baseUrl}${endpoint}. Check that the backend is running.`);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorMessage(errorData, res.status), res.status, errorData);
  }

  return await res.json();
}

export const api = {
  // --- 1. eGov SSO ---
  // Partner credentials are held server-side only (config/services.php).
  // Sending them from the browser published them to every visitor.
  async ssoToken(exchangeCode: string): Promise<{ access_token: string }> {
    return request<{ access_token: string }>('/api/token', {
      method: 'POST',
      body: JSON.stringify({ exchange_code: exchangeCode }),
    }, true, () => ({
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3N0Zy1zdXBlcmFwcC1zc28ub3VlZy5pbmZvIiwiaWF0IjoxNzgzMzk3NDEyLCJzY29wZSI6IlNTT19BVVRIRU5USUNBVElPTiIsInBjIjoiSEFDS0FUSE9OX1NTTyIsInRraSI6NjgsImp0aSI6Ik1WUENCRVVWQ0dQWlIiLCJleHAiOjE3ODM0MDEwMTJ9.zr4dq-hwNpVctc-Vm6j5cyVn98W0FOQS3fxY4UwNcE",
    }));
  },

  async ssoAuthentication(accessToken: string): Promise<any> {
    return request<any>('/api/partner/sso_authentication', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }, true, () => ({
      status: 200,
      message: 'OK',
      data: {
        uniqid: 'MVPCBEUVCGPZR',
        email: 'josie@yopmail.com',
        birth_date: '1990-01-01',
        first_name: 'JOSIE',
        middle_name: 'SANTOS',
        last_name: 'DELA CRUZ',
        suffix: null,
        gender: 'female',
        nationality: 'Filipino',
        photo: 'https://staging-files.oueg.info/staging/9e2be7f8-9853-43a2-8b8b-a216a3585951.png',
        mobile: '+639090000000',
        address: '1123 RIZAL ST., POBLACION, CITY OF ALAMINOS, PANGASINAN, PHILIPPINES',
        street: '1123 RIZAL ST.',
        barangay: 'POBLACION',
        municipality: 'CITY OF ALAMINOS',
        region: 'REGION I (ILOCOS REGION)',
        province: 'PANGASINAN',
        country: 'Philippines',
        country_alpha_2_code: 'PH',
        country_alpha_3_code: 'PHL',
        postal: '2404',
        address_line_2: null,
        barangay_code: '0105503021',
        province_code: '0105500000',
        municipality_code: '0105503000',
        region_code: '0100000000',
        country_id: 175,
        foreign_address: null,
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        signature_url: 'https://egov-stg.s3.ap-southeast-1.amazonaws.com/tmp/signatures/zgy3rLuiH6JlUYJI.png',
        additional_information: {
          health_data: { weight: '55', height: '168', eyes_color: 'Black', complexion: 'WHITE' },
          birth_place: { birth_country: 'Philippines', birth_province: 'PANGASINAN', birth_municipality: 'CITY OF ALAMINOS' },
          other_personal_information: { marital_status: 'Single', religion: 'N/A' },
          mother_details: { mother_maiden_lastname: 'SANTOS', mother_maiden_firstname: 'MARIE', mother_maiden_middlename: 'GARCIA', mother_birthdate: '1968-03-18' },
          father_details: { father_lastname: 'DELA CRUZ', father_firstname: 'RAMON', father_birthdate: '1965-10-09' },
          emergency_information: { emergency_name: 'MARK DELA CRUZ', emergency_contact: '+63 9090000010', emergency_relationship: 'Parent' },
          industry: { industry: 'Professional, Scientific and Technical Activities' },
          occupation: { occupation: 'Software And Applications Developers And Analyst Not Elsewhere Classified' },
          expected_salary: { expected_salary: '130,001-180,000' },
          educational_attainment: [{ level: 'Master', school: 'AMA Computer College-Pangasinan', from: '2008', educational_background: 'INFORMATION TECHNOLOGY', to: '2012' }],
        },
        passport: { first_name: 'Josie', middle_name: 'SANTOS', last_name: 'Dela Cruz', suffix: null, gender: 'female', birth_date: '1990-01-01', passport_number: 'PN1234567', place_issued: 'Philippines', issued_date: '2023-08-29', expiry_date: '2030-08-29' },
        national_id: { code: 'XXX001', pcn: '9639954762664080', face_url: 'https://egov-cdn-stg.oueg.info/uploads/profile_merchants/7c0976e2-a60f-46eb-a97a-999e60e0a1eb', signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' },
        tin_id: '123-456-789-000',
      },
    }));
  },

  // --- 2. eVerify ---
  // Client credentials are held server-side only. The backend ignores any
  // client-supplied values, so these were pure exposure.
  async eVerifyAuth(): Promise<any> {
    return request<any>('/api/auth', {
      method: 'POST',
    }, true);
  },

  async eVerifyQuery(data: any, token: string = ''): Promise<any> {
    return request<any>('/api/query', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }, true);
  },

  async eVerifyQrCheck(value: string, token: string = ''): Promise<any> {
    return request<any>('/api/query/qr/check', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ value }),
    }, true);
  },

  async eVerifyQrVerify(value: string, faceLivenessSessionId: string, token: string = ''): Promise<any> {
    return request<any>('/api/query/qr', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ value, face_liveness_session_id: faceLivenessSessionId }),
    }, true);
  },

  // --- 3. Face Liveness ---
  // x-api-key is injected server-side; it must never reach the browser bundle.
  // No canned fallback: a fabricated "SUCCEEDED · 98.71%" would fake a
  // biometric match that never happened.
  async createLivenessSession(action: string = 'redirect', callbackUrl: string = 'https://your-app.com/callback', delay: number = 3000): Promise<{ token: string; url: string }> {
    return request<{ token: string; url: string }>('/v1/liveness/session', {
      method: 'POST',
      body: JSON.stringify({ action, callback_url: callbackUrl, delay }),
    }, true);
  },

  async getLivenessResult(sessionToken: string): Promise<{ status: string; confidence_score: number; reference_image_url: string }> {
    return request<{ status: string; confidence_score: number; reference_image_url: string }>(`/v1/liveness/result/${sessionToken}`, {
      method: 'GET',
    }, true);
  },

  // --- 4. eGov AI ---
  // The access code is server-side configuration only.
  async aiToken(): Promise<{ access_token: string; expires_in_seconds: number }> {
    return request<{ access_token: string; expires_in_seconds: number }>('/api/v1/egov/integration/token', {
      method: 'POST',
    }, true, () => ({
      access_token: "bebaddec-de7e-4d4e-91b1-ae3a73544b22",
      expires_in_seconds: 28800,
    }));
  },

  /**
   * Credit balance for the server-side AI credential. It takes no bearer: the
   * backend authenticates to eGov with its own access code, and putting the AI
   * token in Authorization here displaced the Sanctum session header and made
   * the auth-protected route answer 401.
   */
  async getAiCredits(): Promise<{ credits_total: number; credits_used: number; credits_remaining: number; expires_at: string; simulated?: boolean }> {
    return request<{ credits_total: number; credits_used: number; credits_remaining: number; expires_at: string; simulated?: boolean }>('/api/v1/egov/integration/credits', {
      method: 'GET',
    }, true, () => ({
      credits_total: 200,
      credits_used: 1,
      credits_remaining: 199,
      expires_at: new Date(Date.now() + 172800000).toISOString(),
    }));
  },

  async generateAiAssistant(prompt: string, category: string = 'PH', token: string = ''): Promise<{ data: string; session_id: string }> {
    return request<{ data: string; session_id: string }>('/api/v1/egov/integration/ai_assistant/generate', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, category }),
    }, true, () => ({
      data: `To obtain your digital Taxpayer Identification Number (TIN) ID through the eGovPH app, ensure you have a Digital TIN registered in the BIR ORUS system. Prompt processed: "${prompt}". You can also file unified medical guarantee letters directly through GabayMed.`,
      session_id: "b67017a4-da57-40ab-96c9-ca0ccb530ec7",
    }));
  },

  async generateSpeechMaker(prompt: string, category: string = 'PH', token: string = ''): Promise<{ data: string; session_id: string }> {
    return request<{ data: string; session_id: string }>('/api/v1/egov/integration/speech_maker/generate', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, category }),
    }, true, () => ({
      data: `Magandang araw po sa inyong lahat! Isang karangalan po ang tumayo sa inyong harapan upang talakayin ang topic na: "${prompt}". Ang ating bansa ay patuloy na umuunlad sa pamamagitan ng digitalisasyon at eGov services.`,
      session_id: "d6b5c2be-11ff-41f1-ac92-fdba3bcc75ca",
    }));
  },

  async generateTourism(prompt: string, category: string = 'PH', token: string = ''): Promise<{ data: string; session_id: string }> {
    return request<{ data: string; session_id: string }>('/api/v1/egov/integration/tourism/generate', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, category }),
    }, true, () => ({
      data: `Boracay Island, located in Aklan province in Western Visayas, is renowned globally for its pristine white sand beaches...\n\n**Day 1: Arrival and White Beach Exploration**\nCheck into your resort and enjoy sunset views at Station 1. Prompt query: "${prompt}".`,
      session_id: "525d4e90-245c-4415-91a3-9cc1f1dd4497",
    }));
  },

  async generateLawsAndRegulations(prompt: string, category: string = 'PH', token: string = ''): Promise<{ data: string; session_id: string }> {
    return request<{ data: string; session_id: string }>('/api/v1/egov/integration/laws_and_regulations/generate', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, category }),
    }, true, () => ({
      data: `Ako ay isang eGovPH AI Assistant na nilikha upang tulungan ang mga mamamayang Pilipino sa mga batas at regulasyon.\n\nKatanungan: "${prompt}". Sa ilalim ng RA 11032 (Ease of Doing Business) at RA 10173 (Data Privacy Act), ang digital public assistance ay protektado ng batas.`,
      session_id: "6220bc87-0ba9-4fd9-9fda-d5c44b31a061",
    }));
  },

  async translateText(prompt: string, sourceLang: string = 'en', targetLang: string = 'fil', token: string = ''): Promise<any> {
    return request<any>('/api/v1/egov/integration/translator/generate', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, source_lang: sourceLang, target_lang: targetLang }),
    }, true, () => ({
      original_prompt: prompt,
      source_lang: sourceLang,
      target_lang: targetLang,
      translate_from: { code: sourceLang, label: "English" },
      translated_prompt: "Paano dapat umangkop ang sistema ng edukasyon upang ihanda ang mga susunod na henerasyon sa AI collaboration?",
      transliterated_prompt: "Paano dapat umangkop ang sistema ng edukasyon...",
    }));
  },

  /**
   * Integration Hub demo call: falls back to a canned sandbox extraction when
   * the eGov AI endpoint is unreachable (the Hub labels the result).
   */
  async extractDocument(formData: FormData, token: string = ''): Promise<{ data: string }> {
    let res: Response;
    try {
      res = await fetch(`${API_ROOT}/api/v1/egov/integration/document_extractor/generate`, {
        method: 'POST',
        headers: { ...authHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
    } catch {
      return markSandbox(
        {
          data: "Here's the information extracted from the document:<br><br><b>Document Type:</b> Philippine Driver's License / Official Medical Abstract<br><b>Issuing Authority:</b> REPUBLIC OF THE PHILIPPINES<br><b>License Number:</b> N01-18-928491<br><b>Full Name:</b> JOSIE SANTOS DELA CRUZ<br><b>Expiry Date:</b> 2030-08-29",
        },
        '/api/v1/egov/integration/document_extractor/generate'
      );
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(errorMessage(body, res.status), res.status, body);
    }
    return body;
  },

  // --- 5. eGovChain (JSON-RPC over the configured ledger; simulated unless a contract address is set) ---
  async besuJsonRpc(method: string, params: any[] = []): Promise<any> {
    return request<any>('/egovchain/rpc', {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    }, false, () => ({
      jsonrpc: "2.0",
      id: 1,
      anchored: false,
      simulated: true,
      result: {
        status: "0x1",
        transactionHash: "0xd8f2910c5d12a8f9104b2819c5b201f8",
        blockNumber: "0x1c37b1",
        gasUsed: "0x0",
        chain_name: "Simulated ledger (no chain submission)",
        consensus: "none (simulated)",
      },
    }));
  },

  async besuAnchorRecord(recordId: string, hash: string): Promise<any> {
    return request<any>('/egovchain/anchor', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, hash }),
    }, false, () => ({
      jsonrpc: "2.0",
      id: 1,
      anchored: false,
      simulated: true,
      result: {
        status: "0x1",
        transactionHash: `0x${hash.replace('0x', '')}`,
        blockHash: "0x7b2f91a08e4c19d205f3189a04b12c5e",
        blockNumber: "0x1c37b1",
        from: "0x0000000000000000000000000000000000000000",
        to: null,
        gasUsed: "0x0",
        chain_name: "Simulated ledger (no chain submission)",
        consensus: "none (simulated)",
      },
    }));
  },

  // --- 6. eGovPay ---
  async payCreateTransaction(payload: any): Promise<any> {
    return request<any>('/api/v1/transaction', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true, () => ({
      data: {
        uuid: "a23977c3-f2f2-4e5c-bf53-94bcff48e49c",
        url: "https://egovpay-pgi-dev.oueg.info/a23977c3-f2f2-4e5c-bf53-94bcff48e49c",
        channel: {
          refno: "0IOKUXQ5XX",
        },
      },
    }));
  },

  async payGetTransaction(uuid: string): Promise<any> {
    return request<any>(`/api/v1/transaction/${uuid}`, {
      method: 'GET',
    }, true, () => ({
      data: {
        uuid,
        refno: "0IOKUXQ5XX",
        txnid: "TESTREF123",
        environment_type: "TEST",
        amount: "1000.0000",
        currency: "PHP",
        payment_status: "INITIAL",
      },
    }));
  },

  async payVoidTransaction(uuid: string): Promise<any> {
    return request<any>(`/api/v1/transaction/${uuid}/void`, {
      method: 'PUT',
    }, true, () => ({
      data: {
        message: "You have successfully voided this transaction.",
      },
    }));
  },

  async paySettle(glNumber: string, amount: number, payeeOrganization: string): Promise<any> {
    return request<any>('/pay/settle', {
      method: 'POST',
      body: JSON.stringify({ gl_number: glNumber, amount, payee_organization: payeeOrganization }),
    }, false, () => ({
      status: "initiated",
      transaction_ref: "PAY-2026-A24D-9981A2",
      gl_number: glNumber,
      amount: amount,
      payee_organization: payeeOrganization,
      gateway: "eGovPay Direct Settlement Gateway (Landbank / Treasury)",
    }));
  },

  // --- 7. eMessage ---
  async pushSms(number: string, message: string): Promise<any> {
    return request<any>('/messaging/v1/sms/push', {
      method: 'POST',
      body: JSON.stringify({ number, message }),
    }, true, () => ({
      data: {
        message: "SMS was successfully created."
      }
    }));
  },

  async sendEMessage(title: string, message: string): Promise<any> {
    return request<any>('/emessage/send', {
      method: 'POST',
      body: JSON.stringify({ title, message }),
    }, false, () => ({
      status: "success",
      notification: { title, message, type: "info", created_at: new Date().toISOString() },
    }));
  },

  // --- 8. eReport ---
  // The access code is server-side configuration only.
  async ereportToken(): Promise<{ access_token: string; expires_at: string }> {
    return request<{ access_token: string; expires_at: string }>('/api/integration/token', {
      method: 'POST',
    }, true, () => ({
      access_token: 'mock-ereport-integration-token',
      expires_at: new Date(Date.now() + 172800000).toISOString(),
    }));
  },
  async ereportReportTypes(token: string = ''): Promise<any> {
    return request<any>('/api/integration/datasets/report_types', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }, true, () => ({
      jsonapi: { version: '1.0' },
      data: [
        { type: 'report_types', id: '0ef6d51a-75be-4ff5-9259-e7f080504f48', attributes: { code: 'crime', name: 'Crime', sequence: 1 } },
        { type: 'report_types', id: 'faa2eb76-db67-4c17-9bc6-6c65e87a0ea1', attributes: { code: 'red_tape', name: 'Red Tape', sequence: 2 } },
        { type: 'report_types', id: '488172b8-9ede-4aa7-bcbb-f8f9b3777b02', attributes: { code: 'scam', name: 'Scam', sequence: 3 } },
      ],
    }));
  },
  async ereportRegions(token: string = ''): Promise<any> {
    return request<any>('/api/integration/datasets/regions', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }, true, () => ({
      jsonapi: { version: '1.0' },
      data: [
        { type: 'regions', id: '010000000', attributes: { name: 'REGION I (ILOCOS REGION)' } },
        { type: 'regions', id: '040000000', attributes: { name: 'REGION IV-A (CALABARZON)' } },
        { type: 'regions', id: '130000000', attributes: { name: 'NATIONAL CAPITAL REGION (NCR)' } },
      ],
    }));
  },
  async ereportProvinces(regionCode: string = '040000000', token: string = ''): Promise<any> {
    return request<any>(`/api/integration/datasets/provinces?region_code=${encodeURIComponent(regionCode)}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }, true, () => ({
      jsonapi: { version: '1.0' },
      data: [
        { type: 'provinces', id: '042100000', attributes: { region_code: regionCode, name: 'CAVITE' } },
        { type: 'provinces', id: '043400000', attributes: { region_code: regionCode, name: 'LAGUNA' } },
      ],
    }));
  },
  async ereportMunicipalities(provinceCode: string = '042100000', token: string = ''): Promise<any> {
    return request<any>(`/api/integration/datasets/municipalities?province_code=${encodeURIComponent(provinceCode)}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }, true, () => ({
      jsonapi: { version: '1.0' },
      data: [
        { type: 'municipalities', id: '042111000', attributes: { region_code: '040000000', province_code: provinceCode, name: 'KAWIT' } },
        { type: 'municipalities', id: '042103000', attributes: { region_code: '040000000', province_code: provinceCode, name: 'BACOOR CITY' } },
      ],
    }));
  },
  async ereportBarangays(municipalityCode: string = '042111000', token: string = ''): Promise<any> {
    return request<any>(`/api/integration/datasets/barangays?municipality_code=${encodeURIComponent(municipalityCode)}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }, true, () => ({
      jsonapi: { version: '1.0' },
      data: [
        { type: 'barangays', id: '042111011', attributes: { municipality_code: municipalityCode, name: 'Toclong' } },
        { type: 'barangays', id: '042111006', attributes: { municipality_code: municipalityCode, name: 'Poblacion' } },
      ],
    }));
  },
  async ereportSubmitComplaint(payload: any, token: string = ''): Promise<{ code: number; message: string; case_number: string }> {
    return request<{ code: number; message: string; case_number: string }>('/api/integration/submit_complaint', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(payload),
    }, true, () => ({
      code: 200,
      message: "We received your report. We'll get back to you.",
      case_number: 'PFM-090326-1489',
    }));
  },
  async ereportRequestOtp(email: string, token: string = ''): Promise<{ code: number; already_verified: boolean; message: string }> {
    return request<{ code: number; already_verified: boolean; message: string }>('/api/integration/verify/request', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ email }),
    }, true, () => ({
      code: 200,
      already_verified: false,
      message: `A 6-digit verification code has been sent to ${email}. It expires in 5 minutes.`,
    }));
  },
  async ereportConfirmOtp(email: string, otp: string = '000000', token: string = ''): Promise<{ code: number; report_view_token: string; expires_at: string }> {
    return request<{ code: number; report_view_token: string; expires_at: string }>('/api/integration/verify/confirm', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ email, otp }),
    }, true, () => ({
      code: 200,
      report_view_token: 'mock-report-view-token-99a1',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }));
  },
  async ereportGetReports(viewToken: string, params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/integration/reports${qs ? '?' + qs : ''}`, {
      method: 'GET',
      headers: { 'X-EReport-View-Token': viewToken },
    }, true, () => ({
      jsonapi: { version: '1.0' },
      meta: { pagination: { total: 1, per_page: 25, current_page: 1, total_pages: 1 } },
      data: [{
        type: 'reports',
        id: '00000000-0000-0000-0000-000000000000',
        attributes: {
          case_number: 'PFM-090326-1489',
          complainant: { first_name: 'Josie', last_name: 'Dela Cruz', fullname: 'Josie Dela Cruz', phone_number: '639090000000', gender: 'Female', email: 'josie@yopmail.com' },
          report_type: { id: 'faa2eb76-db67-4c17-9bc6-6c65e87a0ea1', code: 'red_tape', name: 'Red Tape' },
          subject: 'Delayed Medical Clearance Evaluation',
          message: 'Hospital social work assessment processing exceeded standard processing time.',
          status: 'PENDING',
          formatted_status: 'Pending',
          created_at: new Date().toISOString(),
        }
      }],
    }));
  },
  async ereportGetReport(caseNumber: string, viewToken: string): Promise<any> {
    return request<any>(`/api/integration/reports/${encodeURIComponent(caseNumber)}`, {
      method: 'GET',
      headers: { 'X-EReport-View-Token': viewToken },
    }, true, () => ({
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        case_number: caseNumber,
        complainant: { first_name: 'Josie', last_name: 'Dela Cruz', fullname: 'Josie Dela Cruz', phone_number: '639090000000', gender: 'Female', email: 'josie@yopmail.com' },
        report_type: { id: 'faa2eb76-db67-4c17-9bc6-6c65e87a0ea1', code: 'red_tape', name: 'Red Tape' },
        subject: 'Delayed Medical Clearance Evaluation',
        message: 'Hospital social work assessment processing exceeded standard processing time.',
        status: 'PENDING',
        formatted_status: 'Pending',
        history: [{ status: 'PENDING', formatted_status: 'Pending', created_at: new Date().toISOString() }],
        created_at: new Date().toISOString(),
      }
    }));
  },
  async submitEReport(action: string, payload: any): Promise<any> {
    return request<any>('/ereport/submit', {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    }, false, () => ({
      status: "logged",
      report_id: "EREPORT-99A1C482",
      action: action,
      timestamp: new Date().toISOString(),
    }));
  },  // --- 9. Compass DBM Budget ---
  // No fallback: the agency screens show "—" when the live budget feed is
  // unavailable rather than a fabricated allocation figure.
  async getCompassBudget(programCode: string = 'DSWD-AICS'): Promise<any> {
    return request<any>(`/compass/budget?program_code=${encodeURIComponent(programCode)}`);
  },
  async getCompassSaaodb(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/v1/records/saaodb${qs ? `?${qs}` : ''}`, {}, true, () => ({
      data: [{
        id: 1,
        fileVersionId: "FV-2026-001",
        sourceRow: 12,
        sheetScope: params.sheetScope || "summary",
        reportYear: params.reportYear || 2026,
        period: params.period || "FY",
        entityName: params.entityName || "Department of Agriculture",
        class: params.class || "PS",
        appropriations: 20000000000.00,
        allotments: 18000000000.00,
        obligations: 12000000000.00,
        disbursements: 9500000000.00,
        unobligatedAllotments: 6000000000.00,
      }],
      total: 1,
      page: params.page || 1,
      limit: params.limit || 100,
    }));
  },
  async getCompassSaaodbDashboard(reportYear: number = 2026, sheetScope: string = 'summary'): Promise<any> {
    return request<any>(`/api/v1/records/saaodb/dashboard?reportYear=${reportYear}&sheetScope=${encodeURIComponent(sheetScope)}`, {}, true, () => ({
      reportYear,
      sheetScope,
      cascade: {
        appropriations: 7446956425179.78,
        adjustments: 67295855521.86,
        totalAvailable: 7514252280701.64,
        allotments: 5264033425281.64,
        obligations: 1523309434959.98,
        unobligated: 3740723990321.66,
        disbursements: 1211496810098.76,
        unreleased: 2250218855420,
      },
      rates: {
        obligationRate: 0.28938065,
        disbRateOblig: 0.79530579,
        disbRateAppro: 0.16122652858091654,
      },
      classBreakdown: [
        { class: "PS", amount: 396271169433.72 },
        { class: "MOOE", amount: 755239194473.85 },
        { class: "FINEX", amount: 273157681762.55 },
        { class: "CO", amount: 98641389289.86 },
      ],
      appropriationSplit: {
        currentYear: 6793162000000,
        continuing: 653794425179.78,
        hasSplit: true,
      },
      topEntities: [],
    }));
  },
  async getCompassSaaodbEntities(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/v1/records/saaodb/entities${qs ? `?${qs}` : ''}`, {}, true, () => ({
      reportYear: params.reportYear || 2026,
      sheetScope: params.sheetScope || "agency",
      entities: [
        {
          name: params.expandParent || "Department of Finance",
          agencies: [
            { name: "Bureau of Internal Revenue", code: "110020000000" },
            { name: "Bureau of Customs", code: "110030000000" },
          ],
        },
      ],
    }));
  },
  async getCompassNca(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/v1/records/nca${qs ? `?${qs}` : ''}`, {}, true, () => ({
      data: [{
        ncaNo: "NCA-BMB-A-26-0000100",
        budgetYear: params.budgetYear || 2026,
        deptCode: params.deptCode || "010000000000",
        agencyCode: params.agencyCode || "010010000000",
        amount: 500000000.00,
        dateIssued: new Date().toISOString(),
      }],
      total: 1,
      page: params.page || 1,
      limit: params.limit || 100,
    }));
  },
  async getCompassSaro(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/v1/records/saro${qs ? `?${qs}` : ''}`, {}, true, () => ({
      data: [{
        saroNo: params.saroNo || "SARO-BMB-A-26-0000001",
        deptCode: params.deptCode || "010000000000",
        agencyCode: params.agencyCode || "010010000000",
        expenseClass: params.expenseClass || "5020000000",
        amount: 75000000.00,
        dateIssued: new Date().toISOString(),
      }],
      total: 1,
      page: params.page || 1,
      limit: params.limit || 100,
    }));
  },
  async getCompassLgsf(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/v1/records/lgsf${qs ? `?${qs}` : ''}`, {}, true, () => ({
      data: [{
        id: "LGSF-2026-FALGU-001",
        fiscalYear: params.fiscalYear || 2026,
        programCode: params.programCode || "FALGU",
        regionCode: params.regionCode || "PH030000000",
        province: params.province || "Bulacan",
        cityMunicipality: params.cityMunicipality || "Malolos",
        amount: 25000000.00,
      }],
      total: 1,
      page: params.page || 1,
      limit: params.limit || 100,
    }));
  },
  async getCompassLgsfDashboard(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/v1/records/lgsf/dashboard${qs ? `?${qs}` : ''}`, {}, true, () => ({
      programCode: params.programCode || "FALGU",
      reportYear: params.reportYear || 2026,
      kpis: {
        totalReleased: 1500000000.00,
        projectCount: 120,
        lguCount: 45,
        barangayCount: 180,
        regionCount: 17,
        provinceCount: 82,
        fiscalYearCount: 1,
      },
      trend: [],
      projects: {
        rows: [{
          projectId: "PRJ-2026-001",
          title: "Healthcare Access Facility Support",
          allocatedAmount: 15000000.00,
          lgu: params.municipality || "Malolos",
        }],
        total: 1,
        page: params.page || 1,
        pageSize: params.limit || 25,
      },
    }));  },

  // --- Core GabayMed Auth & Session ---
  /**
   * Redeems a single-use eGov SSO exchange code and signs in as the real
   * citizen. No mock fallback on purpose: fabricating a successful SSO login
   * would silently authenticate someone as the wrong person.
   */
  async exchangeEgovCode(exchangeCode: string): Promise<{ status: string; token?: string; user: User; profile: any }> {
    const res = await request<{ status: string; token?: string; user: User; profile: any }>('/auth/egov/exchange', {
      method: 'POST',
      body: JSON.stringify({ exchange_code: exchangeCode }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async getMe(): Promise<{ status: string; user: User }> {
    return request<{ status: string; user: User }>('/me');
  },

  async mockLogin(role: 'applicant' | 'hospital' | 'agency'): Promise<{ status: string; token?: string; user: User }> {
    const res = await request<{ status: string; token?: string; user: User }>('/auth/mock/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  /**
   * Restores the session on app start. An expired/revoked token is cleared and
   * a demo applicant session is opened so the app is usable without a login wall.
   */
  async restoreSession(): Promise<{ status: string; token?: string; user: User } | null> {
    if (!AUTH_TOKEN) return null;
    try {
      const res = await api.getMe();
      return { status: res.status, user: res.user };
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        setAuthToken(null);
        return api.mockLogin('applicant').catch(() => null);
      }
      throw err;
    }
  },

  /** Revokes the server-side token, then clears it locally. */
  async logout(): Promise<{ status: string; message?: string }> {
    try {
      return await request<{ status: string; message?: string }>('/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  /**
   * Public (non-secret) partner configuration: SSO partner code/host and the
   * liveness SDK public key. Served from backend config so rotating a value is
   * a one-place change instead of editing copied literals in the frontend.
   */
  async getPublicConfig(): Promise<{
    sso: { partner_code: string | null; host: string | null };
    liveness: { pubkey: string | null; sdk_src: string | null; origin: string | null };
  }> {
    return request('/egov/public-config');
  },

  async verifyIdentity(
    consent: boolean,
    demographics: { first_name?: string; middle_name?: string; last_name?: string; birth_date?: string } = {}
  ): Promise<any> {
    return request<any>('/identity/verify', {
      method: 'POST',
      body: JSON.stringify({ consent, ...demographics }),
    });
  },

  // Cases & Applications
  async getCases(): Promise<{ status: string; cases: MedicalCase[] }> {
    return request<{ status: string; cases: MedicalCase[] }>('/cases');
  },

  async createCase(data: {
    patient_name: string;
    relationship: string;
    provider_id: number;
    condition_category: string;
    estimated_bill: number;
    treatment_date?: string;
  }): Promise<{ status: string; message: string; case: MedicalCase }> {
    return request<{ status: string; message: string; case: MedicalCase }>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCase(id: number): Promise<{ status: string; case: MedicalCase }> {
    return request<{ status: string; case: MedicalCase }>(`/cases/${id}`);
  },

  /**
   * Uploads a real file to the case. The backend requires a file
   * (`required|file|mimes:pdf,jpg,jpeg,png|max:10240`), so there is no
   * metadata-only path and no fabricated document on failure.
   */
  async uploadDocument(caseId: number, docType: string, title: string, file: File): Promise<{ status: string; message?: string; document: CaseDocument }> {
    if (!file) {
      throw new Error("A document file is required — select a PDF, JPG or PNG (max 10 MB) before uploading.");
    }

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('title', title);
    formData.append('file', file);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/cases/${caseId}/documents`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...authHeaders() },
        body: formData,
      });
    } catch {
      throw new Error(`Could not reach the GabayMed API at ${API_BASE}/cases/${caseId}/documents. Check that the backend is running.`);
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(errorMessage(body, res.status), res.status, body);
    }
    return body;
  },

  async certifyDocument(docId: number): Promise<{ status: string; message: string; document: CaseDocument }> {
    return request<{ status: string; message: string; document: CaseDocument }>(`/documents/${docId}/certify`, {
      method: 'POST',
    });
  },

  async uploadHospitalDocument(caseId: number, docType: string, title: string, file: File | undefined, docReqId?: number): Promise<{ status: string; message?: string; document: CaseDocument }> {
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('title', title);
    if (file) formData.append('file', file);
    if (docReqId) formData.append('doc_request_id', String(docReqId));

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/hospital/cases/${caseId}/documents`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...authHeaders() },
        body: formData,
      });
    } catch {
      throw new Error(`Could not reach the GabayMed API at ${API_BASE}/hospital/cases/${caseId}/documents. Check that the backend is running.`);
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(errorMessage(body, res.status), res.status, body);
    }
    return body;
  },

  async verifyDocumentBlockchain(docId: number): Promise<{ status: string; document: any; blockchain: any }> {
    return request<{ status: string; document: any; blockchain: any }>(`/documents/${docId}/verify-blockchain`, {});
  },

  async requestHospitalDocuments(caseId: number): Promise<{ status: string; request: HospitalRequest }> {
    return request<{ status: string; request: HospitalRequest }>(`/cases/${caseId}/hospital-request`, {
      method: 'POST',
    });
  },

  async getProviders(): Promise<{ status: string; providers: Organization[] }> {
    return request<{ status: string; providers: Organization[] }>('/providers');
  },

  async getAgencyPrograms(): Promise<{ status: string; programs: AgencyProgram[] }> {
    return request<{ status: string; programs: AgencyProgram[] }>('/agency-programs');
  },

  async submitAgencyApplication(
    caseId: number,
    agencyProgramId: number,
    requestedAmount: number,
    consentSharing: boolean = true
  ): Promise<{ status: string; message?: string; application: AgencyApplication }> {
    return request<{ status: string; message?: string; application: AgencyApplication }>(`/cases/${caseId}/agency-applications`, {
      method: 'POST',
      body: JSON.stringify({
        agency_program_id: agencyProgramId,
        requested_amount: requestedAmount,
        consent_sharing: consentSharing,
      }),
    });
  },

  // Hospital Portal
  async getHospitalRequests(): Promise<{ status: string; requests: HospitalRequest[] }> {
    return request<{ status: string; requests: HospitalRequest[] }>('/hospital/requests');
  },

  /** Full request detail: case documents plus the AI extraction summary. */
  async getHospitalRequest(
    requestId: number
  ): Promise<{ status: string; request: HospitalRequest; ai_extraction?: any }> {
    return request<{ status: string; request: HospitalRequest; ai_extraction?: any }>(`/hospital/requests/${requestId}`);
  },

  async submitHospitalDocuments(reqId: number): Promise<{
    status: string;
    message?: string;
    documents: CaseDocument[];
    missing?: string[];
    case_status?: string;
  }> {
    return request<{
      status: string;
      message?: string;
      documents: CaseDocument[];
      missing?: string[];
      case_status?: string;
    }>(`/hospital/requests/${reqId}/documents`, {
      method: 'POST',
    });
  },

  async validateGuarantee(glNumber: string): Promise<{ status: string; badge: string; guarantee: any }> {
    return request<{ status: string; badge: string; guarantee: any }>('/guarantees/validate', {
      method: 'POST',
      body: JSON.stringify({ gl_number: glNumber }),
    });
  },

  async recordUtilization(
    guaranteeId: number,
    amount: number,
    billingRef: string
  ): Promise<{
    status: string;
    message?: string;
    utilization?: any;
    guarantee?: { approved_amount: number; utilized_amount: number; remaining_value: number };
    settlement?: any;
    guarantee_status: string;
    case_status?: string;
  }> {
    return request<{
      status: string;
      message?: string;
      utilization?: any;
      guarantee?: { approved_amount: number; utilized_amount: number; remaining_value: number };
      settlement?: any;
      guarantee_status: string;
      case_status?: string;
    }>(`/guarantees/${guaranteeId}/utilizations`, {
      method: 'POST',
      body: JSON.stringify({
        utilized_amount: amount,
        billing_reference: billingRef,
      }),
    });
  },

  // Agency Portal
  async getAgencyApplications(): Promise<{ status: string; applications: any[] }> {
    return request<{ status: string; applications: any[] }>('/agency/applications');
  },

  async getAgencyApplication(appId: number): Promise<{ status: string; application: any }> {
    return request<{ status: string; application: any }>(`/agency/applications/${appId}`);
  },

  /**
   * Records an agency decision. The backend returns the issued
   * `guarantee_letter` and, when the applicant has a mobile number, the real
   * `sms` dispatch receipt `{number, message, status}` — the frontend no longer
   * sends an SMS of its own.
   */
  async submitDecision(
    appId: number,
    action: string,
    approvedAmount: number,
    reason: string
  ): Promise<{
    status: string;
    message?: string;
    application?: any;
    guarantee_letter?: GuaranteeLetter;
    sms?: { number: string; message: string; status: string | null } | null;
    max_approvable?: number;
  }> {
    return request<{
      status: string;
      message?: string;
      application?: any;
      guarantee_letter?: GuaranteeLetter;
      sms?: { number: string; message: string; status: string | null } | null;
      max_approvable?: number;
    }>(`/agency/applications/${appId}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        approved_amount: approvedAmount,
        reason,
        validity_days: 30,
      }),
    });
  },

  async getGuarantee(id: number): Promise<{ status: string; guarantee: any }> {
    return request<{ status: string; guarantee: any }>(`/guarantees/${id}`);
  },

  // Notifications
  async getNotifications(): Promise<{ status: string; notifications: NotificationItem[]; unread_count: number }> {
    return request<{ status: string; notifications: NotificationItem[]; unread_count: number }>('/notifications');
  },

  async markNotificationRead(id: number): Promise<{ status: string; message?: string }> {
    return request<{ status: string; message?: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * The case's audit timeline. The backend serves GET /cases/{case}/timeline.
   */
  async getCaseTimeline(caseId: number): Promise<{ status: string; timeline: AuditEvent[] }> {
    return request<{ status: string; timeline: AuditEvent[] }>(`/cases/${caseId}/timeline`);
  },

  /**
   * Recomputes the case's audit hash chain server-side.
   *
   * GET /cases/{case}/timeline/verify answers HTTP 409 when the chain is
   * broken, so the 409 payload is returned rather than thrown — the caller
   * decides what to display. Never claim tamper-evidence without this result.
   */
  async verifyCaseTimeline(caseId: number): Promise<{
    status: string;
    case_id?: number;
    case_number?: string;
    verification: {
      verified: boolean;
      checked?: number;
      head_hash?: string;
      broken_at_event_id?: number | null;
      broken_action?: string;
      unverifiable_event_ids?: number[];
      ledger_simulated?: boolean;
    };
  }> {
    try {
      return await request(`/cases/${caseId}/timeline/verify`);
    } catch (err) {
      if (isApiError(err) && err.status === 409 && err.payload?.verification) {
        return err.payload;
      }
      throw err;
    }
  },
};

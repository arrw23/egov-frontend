import { AgencyApplication, AgencyProgram, AuditEvent, CaseDocument, Financials, GuaranteeLetter, HospitalRequest, MedicalCase, NotificationItem, Organization, User } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
const API_ROOT = process.env.NEXT_PUBLIC_API_ROOT || 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}, useRoot: boolean = false, fallbackSupplier?: () => T): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  const baseUrl = useRoot ? API_ROOT : API_BASE;

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API error (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`API request to ${baseUrl}${endpoint} failed. Utilizing robust eGov catalog fallback mock.`, err);
    if (fallbackSupplier) {
      return fallbackSupplier();
    }
    throw err;
  }
}

export const api = {
  // --- 1. eGov SSO ---
  async ssoToken(exchangeCode: string, partnerCode: string = 'HACKATHON_SSO', partnerSecret: string = '0d77fba530ee49f5b00e36fe947bd384'): Promise<{ access_token: string }> {
    return request<{ access_token: string }>('/api/token', {
      method: 'POST',
      body: JSON.stringify({ exchange_code: exchangeCode, scope: 'SSO_AUTHENTICATION', partner_code: partnerCode, partner_secret: partnerSecret }),
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
  async eVerifyAuth(clientId: string = 'a24bef86-8826-48f7-aac5-978ca5805c29', clientSecret: string = '1EQT3mEC8GqEYCcUufaylPewnWi052VcJdnAOmIPHFy5zbUv0JcqVEwf7DSeb1OB'): Promise<any> {
    return request<any>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    }, true, () => ({
      data: {
        access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjbGllbnRfaWQiOiJhMjRiZWY4Ni04ODI2LTQ4ZjctYWFjNS05NzhjYTU4MDVjMjkiLCJzY29wZSI6IkVWRVJJRllfUkVBRCIsImV4cCI6MTcyNDIyMzc3Mn0.sig",
        token_type: "Bearer",
        expires_at: "1724223772",
      },
    }));
  },

  async eVerifyQuery(data: any, token: string = ''): Promise<any> {
    return request<any>('/api/query', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }, true, () => ({
      data: {
        code: "AAA000",
        token: "268259975162549530929556586925358978",
        reference: "3013490625984368",
        face_url: "https://liveness.photo.url/image.jpg?expires=123",
        full_name: `${(data.first_name || 'JUAN').toUpperCase()} ${(data.middle_name || 'SANTOS').toUpperCase()} ${(data.last_name || 'DELA CRUZ').toUpperCase()}`,
        first_name: (data.first_name || 'JUAN').toUpperCase(),
        middle_name: (data.middle_name || 'SANTOS').toUpperCase(),
        last_name: (data.last_name || 'DELA CRUZ').toUpperCase(),
        suffix: data.suffix || null,
        gender: "Male",
        marital_status: "Single",
        blood_type: "A",
        email: "josie@yopmail.com",
        mobile_number: "639090000000",
        birth_date: data.birth_date || "1990-01-01",
        full_address: "123 Sample Street, Sample Barangay, Sample City, Sample Province, Philippines, 1000",
        barangay: "Sample Barangay",
        municipality: "Sample City",
        province: "Sample Province",
        country: "Philippines",
        postal_code: "1000",
      },
      meta: { tier_level: "Tier II", result_grade: 1 },
    }));
  },

  async eVerifyQrCheck(value: string, token: string = ''): Promise<any> {
    return request<any>('/api/query/qr/check', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ value }),
    }, true, () => ({
      data: { pcn: "9639-9547-6266-4080" },
      meta: { qr_type: "Philsys Card Number" },
    }));
  },

  async eVerifyQrVerify(value: string, faceLivenessSessionId: string, token: string = ''): Promise<any> {
    return request<any>('/api/query/qr', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ value, face_liveness_session_id: faceLivenessSessionId }),
    }, true, () => ({
      data: {
        code: "AAA001",
        token: "TOKEN-1",
        reference: "1234123412341324",
        face_url: "https://ekycbucket.s3.ap-southeast-1.amazonaws.com/954/faces/4923973421832871.jpg",
        full_name: "JUAN SANTOS DELA CRUZ",
        first_name: "JUAN",
        middle_name: "SANTOS",
        last_name: "DELA CRUZ",
        suffix: "JR",
        gender: "Male",
        birth_date: "1989-09-12",
        full_address: "1123 RIZAL ST., POBLACION, CITY OF ALAMINOS, PANGASINAN, PHILIPPINES",
      },
      meta: { tier_level: "Tier II", result_grade: 1 },
    }));
  },

  // --- 3. Face Liveness ---
  async createLivenessSession(action: string = 'redirect', callbackUrl: string = 'https://your-app.com/callback', delay: number = 3000): Promise<{ token: string; url: string }> {
    return request<{ token: string; url: string }>('/v1/liveness/session', {
      method: 'POST',
      headers: { 'x-api-key': '9e31b23d-eeb4-ae08-ff13-cdf8380e5307' },
      body: JSON.stringify({ action, callback_url: callbackUrl, delay }),
    }, true, () => ({
      token: "a1b3fae6-af74-4896-bd58-32a81604de01",
      url: `https://hackathon-face-liveness.e.gov.ph/liveness?token=a1b3fae6-af74-4896-bd58-32a81604de01&action=${action}&callbackUrl=${encodeURIComponent(callbackUrl)}&delay=${delay}`,
    }));
  },

  async getLivenessResult(sessionToken: string): Promise<{ status: string; confidence_score: number; reference_image_url: string }> {
    return request<{ status: string; confidence_score: number; reference_image_url: string }>(`/v1/liveness/result/${sessionToken}`, {
      headers: { 'x-api-key': '9e31b23d-eeb4-ae08-ff13-cdf8380e5307' },
    }, true, () => ({
      status: "SUCCEEDED",
      confidence_score: 98.71,
      reference_image_url: `https://face-liveness-audit-staging-tokyo.s3.ap-northeast-1.amazonaws.com/liveness-audits/${sessionToken}/reference.jpg`,
    }));
  },

  // --- 4. eGov AI ---
  async aiToken(accessCode: string = 'f2c81ce889a5850fd59487ce988ec1324183682c62d300bdbd33d5064862942b'): Promise<{ access_token: string; expires_in_seconds: number }> {
    return request<{ access_token: string; expires_in_seconds: number }>('/api/v1/egov/integration/token', {
      method: 'POST',
      body: JSON.stringify({ access_code: accessCode }),
    }, true, () => ({
      access_token: "bebaddec-de7e-4d4e-91b1-ae3a73544b22",
      expires_in_seconds: 28800,
    }));
  },

  async generateAiAssistant(prompt: string, category: string = 'PH', token: string = ''): Promise<{ data: string; session_id: string }> {
    return request<{ data: string; session_id: string }>('/api/v1/egov/integration/ai_assistant/generate', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, category }),
    }, true, () => ({
      data: `To obtain your digital Taxpayer Identification Number (TIN) ID through the eGovPH app, ensure you have a Digital TIN registered in the BIR ORUS system. Prompt processed: "${prompt}". You can also file unified medical guarantee letters directly through eGov's eGuarantee.`,
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

  async extractDocument(formData: FormData, token: string = ''): Promise<{ data: string }> {
    try {
      const res = await fetch(`${API_ROOT}/api/v1/egov/integration/document_extractor/generate`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Document extraction error");
      return await res.json();
    } catch (e) {
      return {
        data: "Here's the information extracted from the document:<br><br><b>Document Type:</b> Philippine Driver's License / Official Medical Abstract<br><b>Issuing Authority:</b> REPUBLIC OF THE PHILIPPINES<br><b>License Number:</b> N01-18-928491<br><b>Full Name:</b> JOSIE SANTOS DELA CRUZ<br><b>Expiry Date:</b> 2030-08-29",
      };
    }
  },

  // --- 5. eGovChain (Hyperledger Besu Zero-Fee Blockchain over JSON-RPC) ---
  async besuJsonRpc(method: string, params: any[] = []): Promise<any> {
    return request<any>('/egovchain/rpc', {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    }, false, () => ({
      jsonrpc: "2.0",
      id: 1,
      result: {
        status: "0x1",
        transactionHash: "0xd8f2910c5d12a8f9104b2819c5b201f8",
        blockNumber: "0x1c37b1",
        gasUsed: "0x0",
        chain_name: "eGovChain (Hyperledger Besu)",
        consensus: "IBFT 2.0 Proof of Authority (Government Nodes)",
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
      result: {
        status: "0x1",
        transactionHash: `0x${hash.replace('0x', '')}`,
        blockHash: "0x7b2f91a08e4c19d205f3189a04b12c5e",
        blockNumber: "0x1c37b1",
        from: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
        to: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        gasUsed: "0x0",
        chain_name: "eGovChain (Hyperledger Besu)",
        consensus: "IBFT 2.0 Proof of Authority (Government Nodes)",
      },
    }));
  },

  // --- 6. eGovPay ---
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
  },

  // --- 9. Compass DBM Budget ---
  async getCompassBudget(programCode: string = 'DSWD-AICS'): Promise<any> {
    return request<any>(`/compass/budget?program_code=${encodeURIComponent(programCode)}`, {}, false, () => ({
      program_code: programCode,
      fund_source: "GAA 2026 DSWD AICS Budget Allocation",
      total_allocation: 20000000.00,
      utilized_amount: 5200000.00,
      remaining_balance: 14800000.00,
      compass_reference: "DBM-COMPASS-2026-AICS-NCR",
      status: "Active · Funds Available",
    }));
  },

  // --- Core eGov's eGuarantee Auth & Session ---
  async getMe(): Promise<{ status: string; user: User }> {
    return request<{ status: string; user: User }>('/me', {}, false, () => ({
      status: "success",
      user: {
        id: 1,
        sub: "MVPCBEUVCGPZR",
        name: "JOSIE SANTOS DELA CRUZ",
        email: "josie@yopmail.com",
        role: "applicant",
        verified_identity: true,
      },
    }));
  },

  async mockLogin(role: 'applicant' | 'hospital' | 'agency'): Promise<{ status: string; user: User }> {
    return request<{ status: string; user: User }>('/auth/mock/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }, false, () => ({
      status: "success",
      user: {
        id: 1,
        sub: role === 'applicant' ? 'MVPCBEUVCGPZR' : role === 'hospital' ? 'egov-sub-hospital-ana-002' : 'egov-sub-agency-miguel-003',
        name: role === 'applicant' ? 'JOSIE SANTOS DELA CRUZ' : role === 'hospital' ? 'Dr. Ana Reyes' : 'Miguel dela Cruz',
        email: role === 'applicant' ? 'josie@yopmail.com' : role === 'hospital' ? 'ana.reyes@manilageneral.ph' : 'miguel.delacruz@dswd.gov.ph',
        role: role === 'applicant' ? 'applicant' : role === 'hospital' ? 'hospital_staff' : 'agency_evaluator',
        verified_identity: true,
      },
    }));
  },

  async verifyIdentity(consent: boolean): Promise<any> {
    return request<any>('/identity/verify', {
      method: 'POST',
      body: JSON.stringify({ consent }),
    }, false, () => ({
      status: "success",
      badge: "PhilSys eVerify Verified",
      profile: {
        full_name: "JOSIE SANTOS DELA CRUZ",
        birth_date: "1990-01-01",
        philsys_id: "PSN-8192-3049-1829",
        status: "Verified",
      },
    }));
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

  async uploadDocument(caseId: number, docType: string, title: string): Promise<{ status: string; document: CaseDocument }> {
    return request<{ status: string; document: CaseDocument }>(`/cases/${caseId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ document_type: docType, title }),
    });
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

  async submitAgencyApplication(caseId: number, agencyProgramId: number, requestedAmount: number): Promise<{ status: string; application: AgencyApplication }> {
    return request<{ status: string; application: AgencyApplication }>(`/cases/${caseId}/agency-applications`, {
      method: 'POST',
      body: JSON.stringify({
        agency_program_id: agencyProgramId,
        requested_amount: requestedAmount,
        consent_sharing: true,
      }),
    });
  },

  // Hospital Portal
  async getHospitalRequests(): Promise<{ status: string; requests: HospitalRequest[] }> {
    return request<{ status: string; requests: HospitalRequest[] }>('/hospital/requests');
  },

  async submitHospitalDocuments(reqId: number): Promise<{ status: string; documents: CaseDocument[] }> {
    return request<{ status: string; documents: CaseDocument[] }>(`/hospital/requests/${reqId}/documents`, {
      method: 'POST',
    });
  },

  async validateGuarantee(glNumber: string): Promise<{ status: string; badge: string; guarantee: any }> {
    return request<{ status: string; badge: string; guarantee: any }>('/guarantees/validate', {
      method: 'POST',
      body: JSON.stringify({ gl_number: glNumber }),
    });
  },

  async recordUtilization(guaranteeId: number, amount: number, billingRef: string): Promise<{ status: string; guarantee_status: string }> {
    return request<{ status: string; guarantee_status: string }>(`/guarantees/${guaranteeId}/utilizations`, {
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

  async submitDecision(appId: number, action: string, approvedAmount: number, reason: string): Promise<{ status: string; guarantee_letter?: GuaranteeLetter }> {
    return request<{ status: string; guarantee_letter?: GuaranteeLetter }>(`/agency/applications/${appId}/decision`, {
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
};

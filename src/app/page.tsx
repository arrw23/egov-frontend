"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { MedicalCase, Role, Screen } from "@/types";
import { MobileDrawer, MobileNav, Nav, Top } from "@/components/layout/Navbar";
import { LoginView } from "@/components/screens/LoginView";
import { VerifyView } from "@/components/screens/VerifyView";
import { DashboardView } from "@/components/screens/DashboardView";
import { ApplyWizardView } from "@/components/screens/ApplyWizardView";
import { DocumentUploadView, SubmitSelectionView } from "@/components/screens/DocumentUploadView";
import { HospitalQueueView, HospitalDetailView } from "@/components/screens/HospitalQueueView";
import { AgencyInboxView, AgencyReviewView } from "@/components/screens/AgencyInboxView";
import { GuaranteeView, ValidateView } from "@/components/screens/GuaranteeView";
import { VerifiedCatalogView } from "@/components/screens/VerifiedCatalogView";
import { EGovIntegrationHub } from "@/components/screens/EGovIntegrationHub";
import { RequirementBuilderView } from "@/components/screens/RequirementBuilderView";
import { AuditLogsView } from "@/components/screens/AuditLogsView";
import { ChatbotWidget } from "@/components/screens/ChatbotWidget";

const DEMO_APPLICANT_NAME = "JOSIE SANTOS DELA CRUZ";
const DEMO_APPLICANT_MOBILE = "+639090000000";

// The signed-in citizen is whoever eGovPH SSO returned; the backend's seeded applicant is not shown
const readSignedInProfile = () => {
  try {
    const stored = localStorage.getItem("egov_user_info");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        name: parsed.name ? String(parsed.name) : DEMO_APPLICANT_NAME,
        mobile: parsed.mobile ? String(parsed.mobile) : DEMO_APPLICANT_MOBILE,
      };
    }
  } catch { }
  return { name: DEMO_APPLICANT_NAME, mobile: DEMO_APPLICANT_MOBILE };
};

export default function Home() {
  const [role, setRole] = useState<Role>("applicant");
  const [screen, setScreen] = useState<Screen>("login");
  const [verified, setVerified] = useState(false);
  const [approved, setApproved] = useState(true);
  const [used, setUsed] = useState(0);
  const [toast, setToast] = useState("");
  const [activeCase, setActiveCase] = useState<MedicalCase | null>(null);
  const [applicantName, setApplicantName] = useState(DEMO_APPLICANT_NAME);
  const [applicantMobile, setApplicantMobile] = useState(DEMO_APPLICANT_MOBILE);

  const loadSignedInProfile = () => {
    const profile = readSignedInProfile();
    setApplicantName(profile.name);
    setApplicantMobile(profile.mobile);
  };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const roleSyncRef = useRef<Promise<unknown>>(Promise.resolve());
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    api.getCases()
      .then((res) => {
        if (res.cases && res.cases.length > 0) {
          setActiveCase(res.cases[0]);
        }
      })
      .catch(() => { });

    if (typeof window !== "undefined" && window.location.search.includes("sso=authenticated")) {
      // Drop the SSO query params so a refresh doesn't replay the sign-in
      window.history.replaceState(null, "", window.location.pathname);

      // SSO only authenticates; PhilSys eVerify + face liveness still has to run before the case page
      const toVerify = () => {
        loadSignedInProfile();
        setRole("applicant");
        setVerified(false);
        setScreen("verify");
      };
      api.mockLogin("applicant").then(toVerify).catch(toVerify);
    }
  }, []);

  const go = (s: Screen, r = role) => {
    setRole(r);
    setScreen(s);
    if (s === "login") setVerified(false);
    setIsDrawerOpen(false);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // Restart the hide timer on every toast so an older toast's timer can't clear a newer message early
  const notify = (s: string) => {
    setToast(s);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 3200);
  };

  const backendRole = (r: Role) => (r === "applicant" ? "applicant" : r === "hospital_staff" ? "hospital" : "agency");

  // Sidebar role switcher used between demo-script segments; keeps verification, GL and utilization state.
  // Navigate immediately and sync the backend session in the background (queued so rapid switches land in
  // order); awaiting it first let a slow/offline backend yank the view away after the user had moved on.
  const switchRole = (r: Role) => {
    if (r === role) return;
    roleSyncRef.current = roleSyncRef.current.then(() => api.mockLogin(backendRole(r)).catch(() => undefined));
    go(r === "applicant" ? (verified ? "dashboard" : "verify") : r === "hospital_staff" ? "hospital" : "agency", r);
  };

  if (screen === "login")
    return (
      <LoginView
        onLogin={async (r) => {
          try {
            await api.mockLogin(backendRole(r));
          } catch (e) { }
          // Agency and hospital screens show the same citizen's case, so resolve the name for every role
          loadSignedInProfile();
          go(r === "applicant" ? "verify" : r === "hospital_staff" ? "hospital" : "agency", r);
        }}
      />
    );

  if (screen === "verify")
    return (
      <VerifyView
        verified={verified}
        onVerify={() => setVerified(true)}
        onContinue={() => go("dashboard")}
      />
    );

  // Applied at render so it can't be lost if getCases() resolves after sign-in
  const signedInCase = activeCase ? { ...activeCase, applicant_name: applicantName } : null;

  return (
    <div className="shell">
      <Nav role={role} screen={screen} go={go} applicantName={applicantName} onSwitchRole={switchRole} />
      <main>
        <Top role={role} verified={verified} applicantName={applicantName} onOpenDrawer={() => setIsDrawerOpen(true)} onLogout={() => go("login")} />
        <div className="content">
          {screen === "dashboard" && <DashboardView go={go} approved={approved} used={used} activeCase={signedInCase} />}
          {screen === "builder" && <RequirementBuilderView go={go} notify={notify} />}
          {screen === "apply" && <ApplyWizardView go={go} notify={notify} />}
          {screen === "documents" && <DocumentUploadView go={go} notify={notify} />}
          {screen === "catalog" && <VerifiedCatalogView go={go} />}
          {screen === "submit" && <SubmitSelectionView go={go} notify={notify} />}
          {screen === "hospital" && <HospitalQueueView go={go} notify={notify} applicantName={applicantName} />}
          {screen === "hospital_detail" && <HospitalDetailView go={go} notify={notify} />}
          {screen === "agency" && <AgencyInboxView go={go} notify={notify} applicantName={applicantName} />}
          {screen === "agency_review" && (
            <AgencyReviewView
              go={go}
              applicantName={applicantName}
              applicantMobile={applicantMobile}
              approve={async (amount) => {
                try {
                  await api.submitDecision(1, "approve", amount, "Eligible medical assistance");
                } catch (e) { }
                setApproved(true);
                notify("Guarantee letter GL-DSWD-2026-04821 generated and issued!");
              }}
            />
          )}
          {screen === "guarantee" && <GuaranteeView go={go} used={used} applicantName={applicantName} />}
          {screen === "validate" && (
            <ValidateView
              utilize={async (amount, billingRef) => {
                try {
                  await api.recordUtilization(1, amount, billingRef);
                } catch (e) { }
                setUsed((prev) => prev + amount);
                notify(`₱${amount.toLocaleString("en-PH")} utilization recorded; citizen and DSWD NCR notified!`);
              }}
              used={used}
              applicantName={applicantName}
            />
          )}
          {screen === "egov_hub" && <EGovIntegrationHub />}
          {screen === "audit_logs" && <AuditLogsView go={go} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav role={role} screen={screen} go={go} />

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <MobileDrawer role={role} screen={screen} go={go} onClose={() => setIsDrawerOpen(false)} applicantName={applicantName} onSwitchRole={switchRole} />
      )}

      {role && <ChatbotWidget role={role} activeCase={signedInCase} />}

      {toast && (
        <div className="toast">
          <CheckCircle2 color="#fef08a" size={20} /> {toast}
        </div>
      )}
    </div>
  );
}
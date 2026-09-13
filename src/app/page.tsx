"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Role, Screen, Selection } from "@/types";
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

export default function Home() {
  const [role, setRole] = useState<Role>("applicant");
  const [screen, setScreen] = useState<Screen>("login");
  const [verified, setVerified] = useState(false);
  const [toast, setToast] = useState("");
  /**
   * Which case / agency application / hospital request / guarantee letter the
   * signed-in user is currently working on. Screens read and extend this
   * instead of hard-coding id 1.
   */
  const [selection, setSelection] = useState<Selection>({});
  const [applicantName, setApplicantName] = useState("");
  const [applicantMobile, setApplicantMobile] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const roleSyncRef = useRef<Promise<unknown>>(Promise.resolve());
  const toastTimerRef = useRef<number | null>(null);

  /** Merges new selection ids; passing `undefined` clears that one. */
  const select = useCallback((patch: Partial<Selection>) => {
    setSelection((prev) => {
      const next: Selection = { ...prev };
      (Object.keys(patch) as (keyof Selection)[]).forEach((key) => {
        const value = patch[key];
        if (value === undefined) delete next[key];
        else next[key] = value as never;
      });
      return next;
    });
  }, []);

  // The signed-in citizen comes from the backend session, not from localStorage
  // with a hard-coded default.
  const loadSignedInProfile = useCallback(async () => {
    try {
      const res = await api.getMe();
      const user = res?.user;
      if (user) {
        if (user.name) setApplicantName(user.name);
        if (user.mobile) setApplicantMobile(user.mobile);
      }
    } catch {
      // Leave the name empty rather than inventing a citizen; screens show their own errors.
    }
  }, []);

  // Any case the applicant's account already owns becomes the working case, so
  // the id travels with the session instead of defaulting to 1.
  const loadApplicantCases = useCallback(async () => {
    try {
      const res = await api.getCases();
      if (res.cases && res.cases.length > 0) {
        setSelection((prev) => (prev.caseId ? prev : { ...prev, caseId: res.cases[0].id }));
      }
    } catch {
      // Dashboard/upload screens render their own "select a case" empty state.
    }
  }, []);

  useEffect(() => {
    // Every route is behind Sanctum, so restore (or open) a session before any
    // screen fires its own requests.
    api
      .restoreSession()
      .then(() => Promise.all([loadSignedInProfile(), loadApplicantCases()]))
      .catch(() => undefined);

    if (typeof window !== "undefined" && window.location.search.includes("sso=authenticated")) {
      // Drop the SSO query params so a refresh doesn't replay the sign-in
      window.history.replaceState(null, "", window.location.pathname);

      // SSO only authenticates; PhilSys eVerify + face liveness still has to run before the case page
      const toVerify = () => {
        setRole("applicant");
        setVerified(false);
        setScreen("verify");
      };
      api
        .mockLogin("applicant")
        .catch(() => undefined)
        .then(async () => {
          await loadSignedInProfile();
          await loadApplicantCases();
        })
        .finally(toVerify);
    }
  }, [loadSignedInProfile, loadApplicantCases]);

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

  // Sidebar role switcher used between demo-script segments; keeps verification and selection state.
  // Navigate immediately and sync the backend session in the background (queued so rapid switches land in
  // order); awaiting it first let a slow/offline backend yank the view away after the user had moved on.
  const switchRole = (r: Role) => {
    if (r === role) return;
    // Each role has its own scoped routes, so the Sanctum token must be swapped too.
    roleSyncRef.current = roleSyncRef.current.then(() => api.mockLogin(backendRole(r)).catch(() => undefined));
    go(r === "applicant" ? (verified ? "dashboard" : "verify") : r === "hospital_staff" ? "hospital" : "agency", r);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // The local token is cleared inside logout() regardless.
    }
    setApplicantName("");
    setApplicantMobile("");
    setSelection({});
    setVerified(false);
    go("login");
  };

  if (screen === "login")
    return (
      <LoginView
        onLogin={async (r) => {
          try {
            await api.mockLogin(backendRole(r));
          } catch (e) { }
          // Agency and hospital screens show the same citizen's case, so resolve the profile for every role
          await loadSignedInProfile();
          await loadApplicantCases();
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

  return (
    <div className="shell">
      <Nav role={role} screen={screen} go={go} applicantName={applicantName} onSwitchRole={switchRole} onLogout={handleLogout} />
      <main>
        <Top role={role} verified={verified} applicantName={applicantName} onOpenDrawer={() => setIsDrawerOpen(true)} onLogout={handleLogout} />
        <div className="content">
          {screen === "dashboard" && <DashboardView go={go} selection={selection} />}
          {screen === "builder" && <RequirementBuilderView go={go} notify={notify} />}
          {screen === "apply" && <ApplyWizardView go={go} notify={notify} select={select} />}
          {screen === "documents" && <DocumentUploadView go={go} notify={notify} selection={selection} />}
          {screen === "catalog" && <VerifiedCatalogView go={go} selection={selection} />}
          {screen === "submit" && <SubmitSelectionView go={go} notify={notify} selection={selection} />}
          {screen === "hospital" && <HospitalQueueView go={go} select={select} />}
          {screen === "hospital_detail" && (
            <HospitalDetailView go={go} notify={notify} selection={selection} />
          )}
          {screen === "agency" && <AgencyInboxView go={go} notify={notify} select={select} />}
          {screen === "agency_review" && (
            <AgencyReviewView
              go={go}
              selection={selection}
              notify={notify}
              approve={async (amount, reason) => {
                if (!selection.applicationId) {
                  notify("Open an application from the inbox before issuing a guarantee letter.");
                  return null;
                }
                try {
                  const res = await api.submitDecision(selection.applicationId, "approve", amount, reason);
                  const gl = res.guarantee_letter;
                  if (gl) {
                    select({ guaranteeId: gl.id });
                    notify(res.message || `Guarantee letter ${gl.gl_number} issued.`);
                  } else {
                    notify(res.message || "Decision recorded.");
                  }
                  return res;
                } catch (err: any) {
                  notify(err?.message || "The agency decision could not be recorded.");
                  return null;
                }
              }}
            />
          )}
          {screen === "guarantee" && <GuaranteeView go={go} selection={selection} select={select} />}
          {screen === "validate" && <ValidateView selection={selection} notify={notify} />}
          {screen === "egov_hub" && <EGovIntegrationHub />}
          {screen === "audit_logs" && <AuditLogsView go={go} selection={selection} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav role={role} screen={screen} go={go} />

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <MobileDrawer role={role} screen={screen} go={go} onClose={() => setIsDrawerOpen(false)} applicantName={applicantName} onSwitchRole={switchRole} onLogout={handleLogout} />
      )}

      {role && <ChatbotWidget role={role} activeCase={null} />}

      {toast && (
        <div className="toast">
          <CheckCircle2 color="#fef08a" size={20} /> {toast}
        </div>
      )}
    </div>
  );
}

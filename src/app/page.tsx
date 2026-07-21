"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [role, setRole] = useState<Role>("applicant");
  const [screen, setScreen] = useState<Screen>("login");
  const [verified, setVerified] = useState(true);
  const [approved, setApproved] = useState(true);
  const [used, setUsed] = useState(0);
  const [toast, setToast] = useState("");
  const [activeCase, setActiveCase] = useState<MedicalCase | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    api.getCases()
      .then((res) => {
        if (res.cases && res.cases.length > 0) {
          setActiveCase(res.cases[0]);
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined" && window.location.search.includes("sso=authenticated")) {
      let customName = "JOSIE SANTOS DELA CRUZ";
      try {
        const stored = localStorage.getItem("egov_user_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name) customName = parsed.name;
        }
      } catch (e) {}

      api.mockLogin("applicant")
        .then(() => {
          setRole("applicant");
          setVerified(true);
          setScreen("dashboard");
          setActiveCase((prev) => prev ? { ...prev, applicant_name: customName } : prev);
          notify(`Welcome back, ${customName}! Authenticated via eGovPH SSO.`);
        })
        .catch(() => {
          setRole("applicant");
          setVerified(true);
          setScreen("dashboard");
          setActiveCase((prev) => prev ? { ...prev, applicant_name: customName } : prev);
          notify(`Welcome back, ${customName}! Authenticated via eGovPH SSO.`);
        });
    }
  }, []);

  const go = (s: Screen, r = role) => {
    setRole(r);
    setScreen(s);
    setIsDrawerOpen(false);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 3200);
  };

  if (screen === "login")
    return (
      <LoginView
        onLogin={async (r) => {
          try {
            await api.mockLogin(r === "applicant" ? "applicant" : r === "hospital_staff" ? "hospital" : "agency");
          } catch (e) {}
          go(r === "applicant" ? "verify" : r === "hospital_staff" ? "hospital" : "agency", r);
        }}
      />
    );

  if (screen === "verify")
    return (
      <VerifyView
        verified={verified}
        onVerify={async () => {
          try {
            await api.verifyIdentity(true);
          } catch (e) {}
          setVerified(true);
        }}
        onContinue={() => go("dashboard")}
      />
    );

  return (
    <div className="shell">
      <Nav role={role} screen={screen} go={go} />
      <main>
        <Top role={role} onOpenDrawer={() => setIsDrawerOpen(true)} onLogout={() => go("login")} />
        <div className="content">
          {screen === "dashboard" && <DashboardView go={go} approved={approved} used={used} activeCase={activeCase} />}
          {screen === "builder" && <RequirementBuilderView go={go} notify={notify} />}
          {screen === "apply" && <ApplyWizardView go={go} notify={notify} />}
          {screen === "documents" && <DocumentUploadView go={go} notify={notify} />}
          {screen === "catalog" && <VerifiedCatalogView go={go} />}
          {screen === "submit" && <SubmitSelectionView go={go} notify={notify} />}
          {screen === "hospital" && <HospitalQueueView go={go} notify={notify} />}
          {screen === "hospital_detail" && <HospitalDetailView go={go} notify={notify} />}
          {screen === "agency" && <AgencyInboxView go={go} notify={notify} />}
          {screen === "agency_review" && (
            <AgencyReviewView
              go={go}
              approve={async (amount) => {
                try {
                  await api.submitDecision(1, "approve", amount, "Eligible medical assistance");
                } catch (e) {}
                setApproved(true);
                notify("Guarantee letter GL-DSWD-2026-04821 generated and issued!");
              }}
            />
          )}
          {screen === "guarantee" && <GuaranteeView go={go} used={used} />}
          {screen === "validate" && (
            <ValidateView
              utilize={async () => {
                try {
                  await api.recordUtilization(1, 50000, "INV-2026-9901");
                } catch (e) {}
                setUsed(50000);
                notify("₱50,000 utilization recorded; citizen and DSWD NCR notified!");
              }}
              used={used}
            />
          )}
          {screen === "egov_hub" && <EGovIntegrationHub />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav role={role} screen={screen} go={go} />

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <MobileDrawer role={role} screen={screen} go={go} onClose={() => setIsDrawerOpen(false)} />
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 color="#fef08a" size={20} /> {toast}
        </div>
      )}
    </div>
  );
}
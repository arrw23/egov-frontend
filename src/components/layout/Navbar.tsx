import React from "react";
import {
  BadgeCheck,
  Boxes,
  Building2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  Users,
  WalletCards,
  Layers,
  X,
} from "lucide-react";
import { Role, Screen } from "@/types";
import { toDisplayName, toInitials } from "@/lib/names";
import { Brand } from "../common/Brand";

export const navItems: Record<Role, [Screen, string, any][]> = {
  applicant: [
    ["dashboard", "Overview", LayoutDashboard],
    ["apply", "New Application", FileText],
    ["documents", "Upload Documents", UploadCloud],
    ["catalog", "Verified Inventory", BadgeCheck],
    ["submit", "Provider & Agency", Building2],
    ["guarantee", "Digital Guarantee", WalletCards],
    ["audit_logs", "eReport Audit Logs", Layers],
    ["egov_hub", "System Testing Hub", Network],
  ],
  hospital_staff: [
    ["hospital", "Pending Requests", Users],
    ["hospital_detail", "Submit & Certify", FileCheck2],
    ["catalog", "Verified Inventory", BadgeCheck],
    ["validate", "Validate Guarantee", ScanLine],
    ["audit_logs", "eReport Audit Logs", Layers],
    ["egov_hub", "System Testing Hub", Network],
  ],
  agency_evaluator: [
    ["agency", "Pending Inbox", LayoutDashboard],
    ["builder", "Requirement Builder", Boxes],
    ["agency_review", "Case Review", ShieldCheck],
    ["catalog", "Verified Inventory", BadgeCheck],
    ["guarantee", "Issued Guarantee", WalletCards],
    ["audit_logs", "eReport Audit Logs", Layers],
    ["egov_hub", "System Testing Hub", Network],
  ],
};

// Role switcher the demo script uses between segments (option labels match the script wording)
export function RoleSwitcher({
  role,
  applicantName,
  onSwitchRole,
}: {
  role: Role;
  applicantName: string;
  onSwitchRole: (r: Role) => void;
}) {
  return (
    <div className="roleSwitch">
      <span>Switch demo role</span>
      <select value={role} onChange={(e) => onSwitchRole(e.target.value as Role)} aria-label="Switch demo role">
        <option value="applicant">Applicant ({toDisplayName(applicantName)})</option>
        <option value="hospital_staff">Hospital Staff (Dr. Ana Reyes)</option>
        <option value="agency_evaluator">Agency Evaluator (Miguel Dela Cruz - DSWD)</option>
      </select>
    </div>
  );
}

export function Nav({
  role,
  screen,
  go,
  applicantName,
  onSwitchRole,
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
  applicantName: string;
  onSwitchRole: (r: Role) => void;
}) {
  return (
    <aside className="nav">
      <Brand />
      <RoleSwitcher role={role} applicantName={applicantName} onSwitchRole={onSwitchRole} />
      <label>{role.replace("_", " ")} Portal</label>
      {navItems[role].map(([s, t, Icon]) => (
        <button className={s === screen ? "active" : ""} onClick={() => go(s)} key={s}>
          <Icon size={20} /> {t}
        </button>
      ))}
      <div className="navFoot">
        <span>
          <i style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /> eGovPH Portal Connected
        </span>
        <button onClick={() => go("login")} style={{ color: "#e11d48" }}>
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({
  role,
  screen,
  go,
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
}) {
  return (
    <nav className="mobileNav">
      {navItems[role].slice(0, 4).map(([s, t, Icon]) => (
        <button className={s === screen ? "active" : ""} onClick={() => go(s)} key={s}>
          <Icon size={22} />
          <span>{t.split(" ")[0]}</span>
        </button>
      ))}
    </nav>
  );
}

export function MobileDrawer({
  role,
  screen,
  go,
  onClose,
  applicantName,
  onSwitchRole,
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
  onClose: () => void;
  applicantName: string;
  onSwitchRole: (r: Role) => void;
}) {
  return (
    <div className="mobileDrawerOverlay" onClick={onClose}>
      <div className="mobileDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="mobileDrawerHeader">
          <Brand />
          <button className="closeDrawerBtn" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <RoleSwitcher role={role} applicantName={applicantName} onSwitchRole={onSwitchRole} />

        <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {role.replace("_", " ")} Navigation
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {navItems[role].map(([s, t, Icon]) => (
            <button
              key={s}
              className={`outline ${s === screen ? "active" : ""}`}
              style={{
                justifyContent: "flex-start",
                padding: "0.8rem 1.1rem",
                borderRadius: "16px",
                background: s === screen ? "#1e1b4b" : "#ffffff",
                color: s === screen ? "#ffffff" : "#1e1b4b",
                border: "2.5px solid #1e1b4b",
                boxShadow: s === screen ? "0 4px 0 #1e1b4b" : "none",
                fontWeight: 800,
                fontSize: "0.95rem",
              }}
              onClick={() => go(s)}
            >
              <Icon size={20} /> {t}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem", borderTop: "2px solid #e0e7ff" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "0.6rem 1rem", borderRadius: "9999px", border: "1.5px solid #a7f3d0", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /> eGovPH Portal Connected
          </div>
          <button className="outline wide" style={{ color: "#e11d48", borderColor: "#e11d48" }} onClick={() => go("login")}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function Top({
  role,
  verified = false,
  applicantName = "JOSIE SANTOS DELA CRUZ",
  onOpenDrawer,
  onLogout,
}: {
  role: Role;
  verified?: boolean;
  applicantName?: string;
  onOpenDrawer: () => void;
  onLogout: () => void;
}) {
  const profile =
    role === "applicant"
      ? [toInitials(applicantName), toDisplayName(applicantName), "Applicant Representative"]
      : role === "hospital_staff"
      ? ["AR", "Dr. Ana Reyes", "Medical Records Officer"]
      : ["MC", "Miguel dela Cruz", "DSWD Evaluator"];

  return (
    <header className="top">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="hamburgerBtn" onClick={onOpenDrawer} aria-label="Open Navigation Menu">
          <Menu size={22} />
        </button>
        <span className="ssoBadge">
          <BadgeCheck color="#1e1b4b" size={18} /> eGovPH SSO Authenticated
        </span>
        {/* Once PhilSys eVerify passes it supersedes the SSO profile badge (two badges fit the 72px bar) */}
        {role === "applicant" && verified ? (
          <span className="ssoBadge" style={{ background: "#dcfce7", color: "#14532d", borderColor: "#166534" }} title="PhilSys eVerify Tier II · Face liveness 98.71% · PCN 9639-9547-6266-4080">
            <ShieldCheck color="#166534" size={18} /> PhilSys Verified
          </span>
        ) : (
          <span className="ssoBadge" style={{ background: "#ecfdf5", color: "#166534", borderColor: "#a7f3d0" }} title="Profile verified via eGovPH SSO">
            🔒 Profile Verified via eGovPH SSO
          </span>
        )}
      </div>

      <div className="userBadge">
        <div className="avatarCircle">{profile[0]}</div>
        <div className="userText">
          <b className="userName">{profile[1]}</b>
          <small className="userRole">{profile[2]}</small>
        </div>
      </div>
    </header>
  );
}

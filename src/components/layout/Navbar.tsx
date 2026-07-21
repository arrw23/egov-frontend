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
  X,
} from "lucide-react";
import { Role, Screen } from "@/types";
import { Brand } from "../common/Brand";

export const navItems: Record<Role, [Screen, string, any][]> = {
  applicant: [
    ["dashboard", "Overview", LayoutDashboard],
    ["apply", "New application", FileText],
    ["documents", "Upload documents", UploadCloud],
    ["catalog", "Verified Catalog", BadgeCheck],
    ["submit", "Provider & Agency", Building2],
    ["guarantee", "Digital Guarantee", WalletCards],
    ["egov_hub", "eGov API Hub", Network],
  ],
  hospital_staff: [
    ["hospital", "Pending requests", Users],
    ["hospital_detail", "Submit & certify", FileCheck2],
    ["catalog", "Verified Catalog", BadgeCheck],
    ["validate", "Validate guarantee", ScanLine],
    ["egov_hub", "eGov API Hub", Network],
  ],
  agency_evaluator: [
    ["agency", "Pending Inbox (Sorted)", LayoutDashboard],
    ["builder", "Requirement Builder", Boxes],
    ["agency_review", "Unified case review", ShieldCheck],
    ["catalog", "Verified Catalog", BadgeCheck],
    ["guarantee", "Issued guarantee", WalletCards],
    ["egov_hub", "eGov API Hub", Network],
  ],
};

export function Nav({
  role,
  screen,
  go,
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
}) {
  return (
    <aside className="nav">
      <Brand />
      <label>{role.replace("_", " ")} Portal</label>
      {navItems[role].map(([s, t, Icon]) => (
        <button className={s === screen ? "active" : ""} onClick={() => go(s)} key={s}>
          <Icon size={20} /> {t}
        </button>
      ))}
      <div className="navFoot">
        <span>
          <i style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /> eGovPH API Live Connected
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
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
  onClose: () => void;
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
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /> eGovPH API Live Connected
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
  onOpenDrawer,
  onLogout,
}: {
  role: Role;
  onOpenDrawer: () => void;
  onLogout: () => void;
}) {
  const profile =
    role === "applicant"
      ? ["MS", "Maria Santos", "Applicant Representative"]
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
        <span className="ssoBadge" style={{ background: "#ecfdf5", color: "#166534", borderColor: "#a7f3d0" }} title="Profile updates occur exclusively through eGovPH SSO">
          🔒 Profile Managed via eGovPH SSO (Read-Only)
        </span>
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

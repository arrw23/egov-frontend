import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  Check,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  Users,
  WalletCards,
  Layers,
  X,
} from "lucide-react";
import { NotificationItem, Role, Screen } from "@/types";
import { toDisplayName, toInitials } from "@/lib/names";
import { api } from "@/lib/api";
import { Brand } from "../common/Brand";

export const navItems: Record<Role, [Screen, string, any][]> = {
  applicant: [
    ["dashboard", "Overview", LayoutDashboard],
    ["apply", "New Application", FileText],
    ["documents", "Upload Documents", UploadCloud],
    ["catalog", "Verified Inventory", BadgeCheck],
    ["submit", "Provider & Agency", Building2],
    ["guarantee", "Digital Guarantee", WalletCards],
    ["audit_logs", "Audit Trail", Layers],
    ["egov_hub", "System Testing Hub", Network],
  ],
  hospital_staff: [
    ["hospital", "Pending Requests", Users],
    ["hospital_detail", "Submit & Certify", FileCheck2],
    ["catalog", "Verified Inventory", BadgeCheck],
    ["validate", "Validate Guarantee", ScanLine],
    ["audit_logs", "Audit Trail", Layers],
    ["egov_hub", "System Testing Hub", Network],
  ],
  agency_evaluator: [
    ["agency", "Pending Inbox", LayoutDashboard],
    ["builder", "Requirement Builder", Boxes],
    ["agency_review", "Case Review", ShieldCheck],
    ["catalog", "Verified Inventory", BadgeCheck],
    ["guarantee", "Issued Guarantee", WalletCards],
    ["audit_logs", "Audit Trail", Layers],
    ["egov_hub", "System Testing Hub", Network],
  ],
};

const NOTIFICATION_POLL_MS = 15000;

/**
 * Notification bell: polls the backend every 15 seconds, shows the unread
 * count and marks a notification read on click.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setItems(res.notifications || []);
      setUnread(res.unread_count ?? (res.notifications || []).filter((n) => !n.read_at).length);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, NOTIFICATION_POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Close the panel when clicking outside it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = async (item: NotificationItem) => {
    if (item.read_at) return;
    try {
      await api.markNotificationRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err?.message || "That notification could not be marked read.");
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        style={{
          position: "relative",
          background: "#ffffff",
          border: "2.5px solid #1e1b4b",
          borderRadius: "50%",
          width: 42,
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 3px 0 #1e1b4b",
          color: "#1e1b4b",
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 20,
              height: 20,
              padding: "0 5px",
              background: "#e11d48",
              color: "#ffffff",
              borderRadius: 9999,
              fontSize: "0.7rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ffffff",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: 52,
            right: 0,
            width: 340,
            maxHeight: 420,
            overflowY: "auto",
            background: "#ffffff",
            border: "2.5px solid #1e1b4b",
            borderRadius: 20,
            boxShadow: "0 6px 0 #1e1b4b",
            padding: "1rem",
            zIndex: 60,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <b style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1e1b4b" }}>Notifications</b>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <button className="outline" onClick={load} disabled={loading} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
              <button className="outline" onClick={() => setOpen(false)} aria-label="Close notifications" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                <X size={12} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 12, padding: "0.5rem 0.7rem", marginBottom: "0.6rem", color: "#991b1b", fontWeight: 800, fontSize: "0.75rem" }}>
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#4338ca" }}>
              {loading ? "Loading notifications..." : "No notifications yet."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => markRead(item)}
                  style={{
                    textAlign: "left",
                    background: item.read_at ? "#ffffff" : "#e0e7ff",
                    border: "2px solid #1e1b4b",
                    borderRadius: 14,
                    padding: "0.6rem 0.75rem",
                    cursor: item.read_at ? "default" : "pointer",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ marginTop: 2, color: item.read_at ? "#94a3b8" : "#059669" }}>
                    <Check size={14} />
                  </span>
                  <span style={{ flex: 1 }}>
                    <b style={{ display: "block", fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b" }}>{item.title}</b>
                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#4338ca" }}>{item.message}</span>
                    <small style={{ display: "block", marginTop: "0.2rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b" }}>
                      {new Date(item.created_at).toLocaleString("en-PH")}
                      {item.read_at ? " · read" : " · unread"}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        <option value="applicant">Applicant ({applicantName ? toDisplayName(applicantName) : "no profile"})</option>
        <option value="hospital_staff">Hospital Staff</option>
        <option value="agency_evaluator">Agency Evaluator</option>
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
  onLogout,
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
  applicantName: string;
  onSwitchRole: (r: Role) => void;
  onLogout?: () => void;
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
        <button onClick={onLogout || (() => go("login"))} style={{ color: "#e11d48" }}>
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
  onLogout,
}: {
  role: Role;
  screen: Screen;
  go: (s: Screen, r?: Role) => void;
  onClose: () => void;
  applicantName: string;
  onSwitchRole: (r: Role) => void;
  onLogout?: () => void;
}) {
  return (
    <div className="mobileDrawerOverlay" onClick={onClose}>
      <div className="mobileDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="mobileDrawerHeader">
          <Brand />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <NotificationBell />
            <button className="closeDrawerBtn" onClick={onClose} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
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
          <button className="outline wide" style={{ color: "#e11d48", borderColor: "#e11d48" }} onClick={onLogout || (() => go("login"))}>
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
  applicantName = "",
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
      ? [toInitials(applicantName), toDisplayName(applicantName) || "Signed-in citizen", "Applicant Representative"]
      : role === "hospital_staff"
      ? ["HS", "Hospital Staff", "Medical Records Officer"]
      : ["AE", "Agency Evaluator", "Assistance Evaluator"];

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
          <span className="ssoBadge" style={{ background: "#dcfce7", color: "#14532d", borderColor: "#166534" }}>
            <ShieldCheck color="#166534" size={18} /> PhilSys Verified
          </span>
        ) : (
          <span className="ssoBadge" style={{ background: "#ecfdf5", color: "#166534", borderColor: "#a7f3d0" }} title="Profile verified via eGovPH SSO">
            🔒 Profile Verified via eGovPH SSO
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
        <NotificationBell />
        <div className="userBadge">
          <div className="avatarCircle">{profile[0]}</div>
          <div className="userText">
            <b className="userName">{profile[1]}</b>
            <small className="userRole">{profile[2]}</small>
          </div>
        </div>
        <button
          onClick={onLogout}
          aria-label="Sign out"
          style={{ background: "#ffffff", border: "2.5px solid #e11d48", borderRadius: 12, padding: "0.45rem 0.7rem", color: "#e11d48", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem" }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </header>
  );
}

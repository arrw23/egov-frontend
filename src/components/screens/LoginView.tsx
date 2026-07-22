import React from "react";
import { Activity, ArrowRight, Building2, Check, FileCheck2, Hospital, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Role } from "@/types";
import { Brand } from "../common/Brand";

export function LoginView({ onLogin }: { onLogin: (r: Role) => void }) {
  return (
    <div className="login">
      <header>
        <Brand />
        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e1b4b", display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <LockKeyhole size={16} /> Secured by eGovPH Single Sign-On
        </span>
      </header>
      <div className="loginGrid">
        <section>
          <div style={{ background: "#fef08a", color: "#1e1b4b", padding: "0.4rem 1rem", borderRadius: "9999px", border: "2px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "1rem" }}>
            REPUBLIC OF THE PHILIPPINES · UNIFIED E-GUARANTEE
          </div>
          <h1>
            Medical assistance,
            <br />
            <em>made simpler 👋</em>
          </h1>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#4338ca", lineHeight: 1.5 }}>
            One unified digital case connecting Filipino citizens, healthcare providers, and government assistance agencies.
          </p>

          <div style={{ marginTop: "1.5rem", background: "#ffffff", padding: "1.25rem", borderRadius: 20, border: "2.5px solid #1e1b4b", boxShadow: "0 4px 0 #1e1b4b" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>
              SYSTEM CAPABILITIES & SECURITY
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem", fontSize: "0.85rem", fontWeight: 800 }}>
              <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "0.35rem" }}><Check size={14} /> Instant PhilSys Verification</span>
              <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "0.35rem" }}><Check size={14} /> Direct Hospital Records</span>
              <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "0.35rem" }}><Check size={14} /> Digital Guarantee Letter</span>
              <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "0.35rem" }}><Check size={14} /> Real-Time Status Tracking</span>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e0e7ff", border: "2px solid #1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldCheck color="#1e1b4b" size={20} />
              </div>
              <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: "0.95rem" }}>Verified Identity <small style={{ display: "block", color: "#4338ca", fontWeight: 600 }}>Cross-referenced with PhilSys Registry</small></span>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dcfce7", border: "2px solid #1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileCheck2 color="#1e1b4b" size={20} />
              </div>
              <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: "0.95rem" }}>Certified Records <small style={{ display: "block", color: "#4338ca", fontWeight: 600 }}>Directly issued by healthcare providers</small></span>
            </div>
          </div>
        </section>

        <aside>
          <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            REPUBLIC OF THE PHILIPPINES
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.25rem" }}>Sign in with eGovPH SSO</h2>
          <p style={{ color: "#4338ca", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.5rem" }}>Authenticate automatically via eGovPH Single Sign-On.</p>

          <button
            onClick={() => onLogin("applicant")}
            className="primary wide"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", textDecoration: "none", marginBottom: "1.5rem", padding: "0.9rem 1.25rem", borderRadius: "9999px", width: "100%" }}
          >
            <ShieldCheck size={22} /> Authenticate via eGovPH SSO <ArrowRight size={20} />
          </button>

          <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#6366f1", fontWeight: 800, marginBottom: "1rem" }}>
            — SELECT PORTAL DEMO ROLE —
          </div>

          {([
            ["applicant", UserRound, "Citizen / Applicant Portal", "Josie Santos Dela Cruz", "#e0e7ff"],
            ["hospital_staff", Hospital, "Hospital Staff Portal", "Dr. Ana Reyes (Manila General)", "#dcfce7"],
            ["agency_evaluator", Building2, "Agency Evaluator Portal", "Miguel dela Cruz (DSWD NCR)", "#fef08a"],
          ] as const).map(([r, Icon, title, name, bg]) => (
            <button className="role" key={r} onClick={() => onLogin(r)} style={{ padding: "0.85rem 1rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, border: "2px solid #1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color="#1e1b4b" />
              </div>
              <span>
                <b style={{ fontSize: "0.95rem" }}>{title}</b>
                <small style={{ fontSize: "0.78rem" }}>{name}</small>
              </span>
              <ArrowRight size={18} color="#1e1b4b" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}

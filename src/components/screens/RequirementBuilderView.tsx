import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Hospital,
  IdCard,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  Building,
} from "lucide-react";
import { Screen } from "@/types";

export interface RequirementPaperBlock {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  iconName: string;
  alreadyInWallet: boolean;
  isRequired: boolean;
}

export const AVAILABLE_PAPER_BLOCKS: RequirementPaperBlock[] = [
  {
    id: "philsys_id",
    title: "Valid Government ID",
    subtitle: "issued by PhilSys",
    color: "#3b82f6",
    iconName: "id",
    alreadyInWallet: true,
    isRequired: true,
  },
  {
    id: "brgy_indigency",
    title: "Barangay Indigency",
    subtitle: "issued by your barangay",
    color: "#22c55e",
    iconName: "map",
    alreadyInWallet: true,
    isRequired: true,
  },
  {
    id: "medical_abstract",
    title: "Medical Abstract",
    subtitle: "issued by the hospital",
    color: "#f43f5e",
    iconName: "hospital",
    alreadyInWallet: false,
    isRequired: true,
  },
  {
    id: "hospital_bill",
    title: "Hospital Bill",
    subtitle: "issued by billing office",
    color: "#f59e0b",
    iconName: "bill",
    alreadyInWallet: false,
    isRequired: true,
  },
  {
    id: "proof_authorization",
    title: "Proof you can file for someone",
    subtitle: "issued by authorization",
    color: "#8b5cf6",
    iconName: "user",
    alreadyInWallet: false,
    isRequired: false,
  },
  {
    id: "social_case_study",
    title: "Social Case Study",
    subtitle: "issued by social worker",
    color: "#14b8a6",
    iconName: "file",
    alreadyInWallet: false,
    isRequired: true,
  },
  {
    id: "proof_address",
    title: "Proof of Address",
    subtitle: "issued by utility / LGU",
    color: "#0284c7",
    iconName: "map",
    alreadyInWallet: true,
    isRequired: false,
  },
  {
    id: "business_reg",
    title: "Business Registration",
    subtitle: "issued by DTI / SEC",
    color: "#d946ef",
    iconName: "building",
    alreadyInWallet: false,
    isRequired: false,
  },
];

const PRESETS = [
  {
    name: "Hospital Assistance (DSWD)",
    agency: "DSWD",
    blocks: ["philsys_id", "brgy_indigency", "medical_abstract", "hospital_bill", "social_case_study"],
  },
  {
    name: "Medical Financial Aid (PCSO)",
    agency: "PCSO",
    blocks: ["philsys_id", "brgy_indigency", "medical_abstract", "hospital_bill"],
  },
  {
    name: "LGU Barangay Medical Relief",
    agency: "LGU Manila",
    blocks: ["philsys_id", "brgy_indigency", "proof_address", "hospital_bill"],
  },
];

import { getSavedRequirementRule, saveRequirementRule } from "@/lib/requirementStore";

export function RequirementBuilderView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify?: (s: string) => void;
}) {
  const initialRule = getSavedRequirementRule();
  const [serviceTitle, setServiceTitle] = useState(initialRule.serviceTitle);
  const [agencyName, setAgencyName] = useState(initialRule.agencyName);
  const [activeBlocks, setActiveBlocks] = useState<RequirementPaperBlock[]>(initialRule.blocks);

  const renderIcon = (iconName: string, size = 18) => {
    switch (iconName) {
      case "id":
        return <IdCard size={size} />;
      case "map":
        return <MapPin size={size} />;
      case "hospital":
        return <Hospital size={size} />;
      case "bill":
        return <FileSpreadsheet size={size} />;
      case "user":
        return <UserCheck size={size} />;
      case "building":
        return <Building size={size} />;
      default:
        return <FileText size={size} />;
    }
  };

  const addBlock = (block: RequirementPaperBlock) => {
    setActiveBlocks((prev) => [...prev, { ...block, id: `${block.id}_${Date.now()}` }]);
    if (notify) notify(`Added "${block.title}" block to build!`);
  };

  const removeBlock = (index: number) => {
    setActiveBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeBlocks.length) return;
    const newBlocks = [...activeBlocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setActiveBlocks(newBlocks);
  };

  const clearCanvas = () => {
    setActiveBlocks([]);
    if (notify) notify("Canvas cleared. Drag or tap blocks to build!");
  };

  const loadPreset = (preset: (typeof PRESETS)[0]) => {
    setServiceTitle(preset.name.split(" (")[0]);
    setAgencyName(preset.agency);
    const selected = preset.blocks
      .map((id) => AVAILABLE_PAPER_BLOCKS.find((b) => b.id === id))
      .filter(Boolean) as RequirementPaperBlock[];
    setActiveBlocks(selected.map((b) => ({ ...b, id: `${b.id}_${Date.now()}` })));
    if (notify) notify(`Loaded "${preset.name}" rule template!`);
  };

  const handleSave = () => {
    saveRequirementRule({
      serviceTitle,
      agencyName,
      blocks: activeBlocks,
      savedAt: new Date().toISOString(),
    });
    if (notify) {
      notify(`Saved "${serviceTitle}" requirement rule (${activeBlocks.length} blocks)! Citizen checklist dynamically synced.`);
    }
    go("agency");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Bar Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "#ffffff",
          padding: "1.25rem 1.5rem",
          borderRadius: 24,
          border: "2.5px solid #1e1b4b",
          boxShadow: "0 6px 0 #1e1b4b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#1e1b4b",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.2rem",
              border: "2px solid #1e1b4b",
              boxShadow: "0 3px 0 #6366f1",
            }}
          >
            R
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0, color: "#1e1b4b" }}>
              Requirement Builder
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#6366f1", margin: 0, fontWeight: 700 }}>
              Snap blocks together to build a service... like building with LEGO
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className="outline"
                style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem", fontWeight: 800 }}
                onClick={() => loadPreset(p)}
              >
                Preset: {p.agency}
              </button>
            ))}
          </div>
          <button
            className="outline"
            onClick={clearCanvas}
            style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem", gap: "0.4rem" }}
          >
            <RotateCcw size={16} /> Clear
          </button>
          <button
            className="primary"
            onClick={handleSave}
            style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem", gap: "0.5rem" }}
          >
            <Save size={16} /> Save service
          </button>
        </div>
      </div>

      {/* Main 3-Column Builder Layout */}
      <div className="builderGrid">
        {/* Left Column: Available Blocks Palette */}
        <div
          className="card"
          style={{
            background: "#ffffff",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 900,
              color: "#6366f1",
              letterSpacing: "0.08em",
              marginBottom: "0.25rem",
            }}
          >
            DRAG A PAPER INTO THE BUILD →
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {AVAILABLE_PAPER_BLOCKS.map((block) => (
              <div
                key={block.id}
                className="legoPaletteBlock"
                style={{ background: block.color }}
                onClick={() => addBlock(block)}
                title="Click or drag to add to builder"
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {renderIcon(block.iconName, 18)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: "0.88rem", display: "block", lineHeight: 1.2, fontWeight: 900 }}>
                    {block.title}
                  </b>
                  <small style={{ fontSize: "0.72rem", opacity: 0.9, fontWeight: 600 }}>
                    {block.subtitle}
                  </small>
                </div>
                <Plus size={18} style={{ opacity: 0.9, flexShrink: 0 }} />

                {/* LEGO Interlocking Notch on right edge */}
                <div className="legoTabRight" />
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Dotted Canvas & Interlocking Stack */}
        <div className="builderCanvas">
          {/* Canvas Header Block (Dark Navy Container) */}
          <div
            style={{
              background: "#1e2030",
              color: "#ffffff",
              borderRadius: activeBlocks.length > 0 ? "20px 20px 0 0" : 20,
              padding: "1.5rem",
              border: "2.5px solid #1e1b4b",
              boxShadow: "0 4px 0 #1e1b4b",
              position: "relative",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 900,
                color: "#94a3b8",
                letterSpacing: "0.12em",
                display: "block",
                marginBottom: "0.4rem",
              }}
            >
              WHEN A CITIZEN REQUESTS
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px dashed #475569",
                  color: "#ffffff",
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  padding: "0.2rem 0",
                  outline: "none",
                  width: "calc(100% - 100px)",
                  minWidth: 200,
                }}
              />
              <input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                style={{
                  background: "#334155",
                  color: "#93c5fd",
                  border: "1.5px solid #64748b",
                  borderRadius: 12,
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  width: 90,
                  textAlign: "center",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "#cbd5e1",
                letterSpacing: "0.1em",
                borderTop: "1px dashed #334155",
                paddingTop: "0.85rem",
              }}
            >
              ...THEY MUST PROVIDE:
            </div>
          </div>

          {/* Stacked Interlocking Blocks Slot */}
          <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
            {activeBlocks.length === 0 ? (
              <div
                style={{
                  padding: "3.5rem 1.5rem",
                  textAlign: "center",
                  border: "2.5px dashed #cbd5e1",
                  borderRadius: "0 0 20px 20px",
                  background: "rgba(255, 255, 255, 0.7)",
                  marginTop: -2,
                }}
              >
                <Sparkles size={36} color="#6366f1" style={{ marginBottom: "0.5rem" }} />
                <h4 style={{ margin: "0.2rem 0", fontSize: "1.1rem", fontWeight: 900, color: "#1e1b4b" }}>
                  Canvas is empty!
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>
                  Click any paper block from the left panel to snap it here into the requirement chain.
                </p>
              </div>
            ) : (
              activeBlocks.map((block, index) => {
                const isFirst = index === 0;
                const isLast = index === activeBlocks.length - 1;
                const isSingle = activeBlocks.length === 1;

                let blockClass = "canvasStackBlock ";
                if (isSingle) blockClass += "singleBlock";
                else if (isFirst) blockClass += "firstBlock";
                else if (isLast) blockClass += "lastBlock";
                else blockClass += "middleBlock";

                return (
                  <div
                    key={block.id || index}
                    className={blockClass}
                    style={{
                      background: block.color,
                      marginTop: isFirst ? -2 : -4,
                      zIndex: activeBlocks.length - index,
                    }}
                  >
                    {/* Top Notch Socket if not first */}
                    {!isFirst && <div className="legoNotchTop" />}

                    {/* Left Icon & Text */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background: "rgba(255, 255, 255, 0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {renderIcon(block.iconName, 20)}
                      </div>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 900, lineHeight: 1.2 }}>
                          {block.title}
                        </div>
                        <small style={{ fontSize: "0.76rem", opacity: 0.9, fontWeight: 700 }}>
                          {block.subtitle}
                        </small>
                      </div>
                    </div>

                    {/* Right Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {block.alreadyInWallet && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            background: "rgba(255,255,255,0.25)",
                            padding: "0.2rem 0.6rem",
                            borderRadius: 9999,
                            fontWeight: 800,
                          }}
                        >
                          ✓ eGov Wallet Auto-Verified
                        </span>
                      )}
                      <button
                        onClick={() => moveBlock(index, "up")}
                        disabled={isFirst}
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "none",
                          color: "white",
                          borderRadius: 8,
                          width: 28,
                          height: 28,
                          cursor: isFirst ? "default" : "pointer",
                          opacity: isFirst ? 0.3 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveBlock(index, "down")}
                        disabled={isLast}
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "none",
                          color: "white",
                          borderRadius: 8,
                          width: 28,
                          height: 28,
                          cursor: isLast ? "default" : "pointer",
                          opacity: isLast ? 0.3 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => removeBlock(index)}
                        style={{
                          background: "rgba(239, 68, 68, 0.85)",
                          border: "none",
                          color: "white",
                          borderRadius: 8,
                          width: 28,
                          height: 28,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Bottom Tab Notch if not last */}
                    {!isLast && <div className="legoTabBottom" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Citizen Preview */}
        <div className="builderPreviewCol">
          <div
            className="card"
            style={{
              background: "#ffffff",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "#6366f1",
                letterSpacing: "0.08em",
              }}
            >
              WHAT THE CITIZEN WILL SEE
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {activeBlocks.length === 0 ? (
                <div
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  Add blocks to preview citizen requirement checklist
                </div>
              ) : (
                activeBlocks.map((block) => (
                  <div
                    key={block.id}
                    style={{
                      background: block.alreadyInWallet ? "#f0fdf4" : "#fafafa",
                      border: block.alreadyInWallet ? "2px solid #86efac" : "2px solid #e2e8f0",
                      borderRadius: 16,
                      padding: "0.85rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: block.alreadyInWallet ? "#dcfce7" : "#f1f5f9",
                        color: block.alreadyInWallet ? "#166534" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {renderIcon(block.iconName, 18)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: "0.9rem", color: "#1e1b4b", display: "block", lineHeight: 1.2 }}>
                        {block.title}
                      </b>
                      {block.alreadyInWallet ? (
                        <small style={{ color: "#166534", fontWeight: 800, fontSize: "0.72rem" }}>
                          ✓ already in wallet
                        </small>
                      ) : (
                        <small style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.72rem" }}>
                          to provide
                        </small>
                      )}
                    </div>
                    {block.alreadyInWallet && <CheckCircle2 size={18} color="#16a34a" />}
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                fontSize: "0.76rem",
                color: "#64748b",
                fontWeight: 700,
                lineHeight: 1.4,
                marginTop: "0.5rem",
                paddingTop: "0.75rem",
                borderTop: "2px dashed #e2e8f0",
              }}
            >
              Already-verified papers auto-cross-off. The rest becomes the citizen's checklist.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

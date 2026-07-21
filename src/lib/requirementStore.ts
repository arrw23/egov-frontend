import { RequirementPaperBlock, AVAILABLE_PAPER_BLOCKS } from "@/components/screens/RequirementBuilderView";

export interface SavedServiceRule {
  serviceTitle: string;
  agencyName: string;
  blocks: RequirementPaperBlock[];
  savedAt: string;
}

export const DEFAULT_SERVICE_RULE: SavedServiceRule = {
  serviceTitle: "Hospital Assistance",
  agencyName: "DSWD",
  blocks: [
    AVAILABLE_PAPER_BLOCKS[0], // Valid Govt ID (PhilSys) - in wallet
    AVAILABLE_PAPER_BLOCKS[1], // Barangay Indigency - in wallet
    AVAILABLE_PAPER_BLOCKS[2], // Medical Abstract
    AVAILABLE_PAPER_BLOCKS[3], // Hospital Bill
    AVAILABLE_PAPER_BLOCKS[5], // Social Case Study
  ],
  savedAt: new Date().toISOString(),
};

export function getSavedRequirementRule(): SavedServiceRule {
  if (typeof window === "undefined") return DEFAULT_SERVICE_RULE;
  try {
    const raw = localStorage.getItem("egov_saved_service_rule");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return DEFAULT_SERVICE_RULE;
}

export function saveRequirementRule(rule: SavedServiceRule): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("egov_saved_service_rule", JSON.stringify(rule));
    window.dispatchEvent(new Event("egov_rule_updated"));
  } catch (e) {}
}

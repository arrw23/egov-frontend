import React from "react";
import { HeartPulse } from "lucide-react";

export function Brand() {
  return (
    <div className="brand">
      <i>
        <HeartPulse size={24} />
      </i>
      <span>
        <b>eGov's eGuarantee</b>
        <small>Requirement & Guarantee System</small>
      </span>
    </div>
  );
}

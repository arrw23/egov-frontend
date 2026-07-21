import React from "react";
import { HeartPulse } from "lucide-react";

export function Brand() {
  return (
    <div className="brand">
      <i>
        <HeartPulse size={24} />
      </i>
      <span>
        <b>GabayMed</b>
        <small>Medical Assistance</small>
      </span>
    </div>
  );
}

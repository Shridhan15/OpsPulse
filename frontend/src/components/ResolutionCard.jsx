import React, { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function ResolutionCard({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data) {
    return (
      <div className="h-full min-h-[400px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
        <Terminal size={32} className="text-slate-600 mb-2 stroke-[1.5]" />
        <p className="text-sm text-slate-400 font-medium">
          Awaiting Execution Trigger
        </p>
        <p className="text-xs text-slate-600 max-w-xs mt-1">
          Select an active infrastructure outage target and initialize the
          autonomous recovery pipeline.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(data.automated_recovery_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic threat level indicators
  const getSeverityStyles = (sev) => {
    const s = sev?.toUpperCase();
    if (s === "CRITICAL")
      return {
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        icon: AlertTriangle,
      };
    if (s === "WARNING")
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: AlertTriangle,
      };
    return {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
      icon: Info,
    };
  };

  const badge = getSeverityStyles(data.severity);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-fadeIn">
      {/* Header Info Block */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-200">
            Autonomous Diagnosis
          </h3>
          <p className="text-xs text-slate-500">
            Synthesized execution metrics from Groq engine
          </p>
        </div>
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wider uppercase ${badge.bg} ${badge.border} ${badge.text}`}
        >
          <BadgeIcon size={12} />
          <span>{data.severity}</span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
          Root Cause Summary
        </span>
        <p className="text-xs font-medium text-slate-300 leading-relaxed">
          {data.root_cause_summary}
        </p>
      </div>

      {/* Structured Resolution Steps */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Remediation Steps (Runbook Alignment: {data.matched_runbook_id})
          </span>
        </div>
        <div className="text-xs text-slate-300 leading-relaxed space-y-1.5 bg-slate-950/20 p-4 rounded-xl border border-slate-900">
          {data.steps_to_resolve.split("\n").map((step, idx) => (
            <p key={idx} className="pl-2 border-l border-slate-800 py-0.5">
              {step}
            </p>
          ))}
        </div>
      </div>

      {/* Terminal Playbook Code Block */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
          Automated Remediation Script
        </span>
        <div className="relative group rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
          {/* Mock Terminal Top Ribbon bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 bg-slate-900/30">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
            <button
              onClick={handleCopy}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200 flex items-center space-x-1"
            >
              {copied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
              <span className="text-[10px] font-medium">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
          {/* Inner Code script text */}
          <pre className="p-4 text-xs font-mono text-emerald-400 bg-slate-950 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            <code>{data.automated_recovery_script}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { ShieldCheck, Search, Cpu, CheckCircle2 } from "lucide-react";

export default function LiveExecutionStream({ currentStatus }) {
  // Map out the explicit LangGraph step progression
  const STEPS = [
    {
      id: "parsing",
      label: "Log Extraction Loop",
      desc: "Isolating anomalies and timestamps via Groq...",
      icon: Cpu,
    },
    {
      id: "rag",
      label: "Knowledge Base Retrieval",
      desc: "Scanning company runbooks for historical solutions...",
      icon: Search,
    },
    {
      id: "resolution",
      label: "Resolution Synthesis",
      desc: "Compiling safe recovery instructions and bash scripts...",
      icon: ShieldCheck,
    },
  ];

  // Helper logic to find out which visual state a step is in
  const getStepState = (stepId) => {
    if (!currentStatus) return "PENDING";

    const order = ["parsing", "rag", "resolution", "COMPLETED"];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepId);

    if (currentIdx > stepIdx) return "SUCCESS";
    if (currentIdx === stepIdx) return "ACTIVE";
    return "PENDING";
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          LangGraph Workflow Monitor
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time state machine execution trace
        </p>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const state = getStepState(step.id);

          return (
            <div key={step.id} className="relative transition-all duration-300">
              {/* Dot Icon Indicator */}
              <div
                className={`absolute -left-[21px] top-0.5 p-1 rounded-full border transition-all duration-300 ${
                  state === "SUCCESS"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : state === "ACTIVE"
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-400 animate-pulse"
                      : "bg-slate-950 border-slate-800 text-slate-600"
                }`}
              >
                {state === "SUCCESS" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Icon size={14} />
                )}
              </div>

              {/* Text Description */}
              <div
                className={`transition-opacity duration-300 ${state === "PENDING" ? "opacity-40" : "opacity-100"}`}
              >
                <h4
                  className={`text-xs font-medium ${state === "ACTIVE" ? "text-blue-400" : "text-slate-200"}`}
                >
                  {step.label}
                </h4>
                {state === "ACTIVE" && (
                  <p className="text-[11px] text-slate-400 mt-0.5 animate-pulse">
                    {step.desc}
                  </p>
                )}
                {state === "SUCCESS" && (
                  <p className="text-[11px] text-emerald-500/70 mt-0.5">
                    Node execution verified. State updated.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

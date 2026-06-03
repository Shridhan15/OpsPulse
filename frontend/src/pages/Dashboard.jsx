import React, { useState } from "react";
import { Terminal, Activity, Cpu, AlertCircle } from "lucide-react";
import IncidentSelector from "../components/IncidentSelector";
import LiveExecutionStream from "../components/LiveExecutionStream";
import ResolutionCard from "../components/ResolutionCard";

export default function Dashboard() {
  // Application UI States
  const [activeIncidentId, setActiveIncidentId] = useState("postgres");
  const [selectedLogs, setSelectedLogs] = useState(
    `2026-06-02T14:22:01.489Z [INFO] Gateway: Incoming request POST /api/v1/checkout from IP 192.168.1.45\n2026-06-02T14:22:02.110Z [WARN] Pool: Connection checkout latency exceeded threshold: 1500ms\n2026-06-02T14:22:03.002Z [ERROR] Pool: Failed to acquire connection from pool within 5000ms timeout\n2026-06-02T14:22:03.003Z [FATAL] PostgreSQL Server Error: postgresql-cluster-01\nSTDERR: 2026-06-02 14:22:03 UTC FATAL: remaining connection slots are reserved for non-replication superuser connections`,
  );

  const [executionStatus, setExecutionStatus] = useState(null); // parsing, rag, resolution, COMPLETED
  const [resolutionData, setResolutionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Triggered when clicking a dropdown selector button
  const handleIncidentChange = (id, logs) => {
    if (loading) return; // Freeze switching while agent runs
    setActiveIncidentId(id);
    setSelectedLogs(logs);
    setResolutionData(null);
    setExecutionStatus(null);
    setErrorMessage(null);
  };

  // Coordinates simulated visual pipeline states + makes live API request
  const runAutonomousPipeline = async () => {
    if (loading || !selectedLogs.trim()) return;
    console.log(
      "Initiating autonomous recovery workflow with logs:",
      selectedLogs,
    );

    setLoading(true);
    setErrorMessage(null);
    setResolutionData(null);

    try {
      // Step A: Simulate Log Parsing node activation UI update
      setExecutionStatus("parsing");
      await new Promise((res) => setTimeout(res, 800)); // Short pause for visual demo tracking

      // Step B: Simulate Runbook matching node activation UI update
      setExecutionStatus("rag");
      await new Promise((res) => setTimeout(res, 800));

      // Step C: Trigger Synthesis node and execute true backend API call
      setExecutionStatus("resolution");

      const response = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_logs: selectedLogs }),
      });

      if (!response.ok) {
        throw new Error(`Server execution failure: ${response.statusText}`);
      }

      const data = await response.json();

      // Step D: Finish workflow lifecycle successfully
      setResolutionData(data);
      setExecutionStatus("COMPLETED");
    } catch (err) {
      setErrorMessage(
        err.message ||
          "Failed to establish a network interface with the agent backend.",
      );
      setExecutionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* 1. Header Navigation Bar */}
      <header className="border-b border-slate-900 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-2 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Activity className="text-slate-950 stroke-[2.5]" size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-100">
                OpsPulse AI
              </h1>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-medium">
                v1.0-SRE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Autonomous Incident Mitigation System
            </p>
          </div>
        </div>

        {/* Local Host Pipeline Health Indicators */}
        <div className="flex items-center space-x-4 text-xs font-medium text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400 font-mono text-[11px]">
              Core Agent: Online
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Layout Shell */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN PANEL: Incident Triggering and Source Code Inputs */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          {/* Dropdown Incident picker */}
          <IncidentSelector
            onSelectIncident={handleIncidentChange}
            activeId={activeIncidentId}
          />

          {/* Raw Input Text Area Box */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Log Payload
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Raw unstructured telemetry stream stack trace
              </p>
            </div>

            <div className="relative flex-1 min-h-[220px] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs text-slate-400 p-4">
              <textarea
                value={selectedLogs}
                onChange={(e) => setSelectedLogs(e.target.value)}
                disabled={loading}
                className="w-full h-full bg-transparent border-0 outline-none resize-none font-mono text-slate-300 focus:ring-0 leading-relaxed overflow-y-auto"
                placeholder="Paste telemetry logs or select a simulation target model above..."
              />
            </div>

            {/* Main Action Trigger Call-To-Action Button */}
            <button
              onClick={runAutonomousPipeline}
              disabled={loading || !selectedLogs.trim()}
              className={`w-full py-3 px-4 rounded-xl font-medium text-xs tracking-wide uppercase transition-all duration-300 flex items-center justify-center space-x-2 border shadow-lg ${
                loading
                  ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-emerald-400/20 shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99]"
              }`}
            >
              <Cpu size={14} className={loading ? "animate-spin" : ""} />
              <span>
                {loading
                  ? "Orchestrating Workflow..."
                  : "Run Autonomous Recovery"}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN PANEL: LangGraph Flow Monitoring and Structured Solutions */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Workflow Ticker Step Box */}
          <div className="md:col-span-5">
            <LiveExecutionStream currentStatus={executionStatus} />

            {/* Error Message Box Fallback Display */}
            {errorMessage && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed font-medium">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Final Resolution Structured Data Output View Card */}
          <div className="md:col-span-7 h-full">
            <ResolutionCard data={resolutionData} />
          </div>
        </div>
      </main>
    </div>
  );
}

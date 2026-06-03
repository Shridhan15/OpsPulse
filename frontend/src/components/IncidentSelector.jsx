import React from "react";
import { Terminal, Database, ShieldAlert, Cpu } from "lucide-react";

// Static client-side copies of our mock data logs for immediate local deployment
const MOCK_INCIDENTS = [
  {
    id: "postgres",
    title: "PostgreSQL Connection Leak",
    type: "Database Cluster",
    icon: Database,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    logs: `2026-06-02T14:22:01.489Z [INFO] Gateway: Incoming request POST /api/v1/checkout from IP 192.168.1.45\n2026-06-02T14:22:02.110Z [WARN] Pool: Connection checkout latency exceeded threshold: 1500ms\n2026-06-02T14:22:03.002Z [ERROR] Pool: Failed to acquire connection from pool within 5000ms timeout\n2026-06-02T14:22:03.003Z [FATAL] PostgreSQL Server Error: postgresql-cluster-01\nSTDERR: 2026-06-02 14:22:03 UTC FATAL: remaining connection slots are reserved for non-replication superuser connections`,
  },
  {
    id: "redis",
    title: "Redis Persistence Timeout",
    type: "Caching Layer",
    icon: ShieldAlert,
    color: "text-rose-400",
    borderColor: "border-rose-500/20",
    logs: `[2026-06-02 14:25:00] [INFO] Cache ping heartbeat active...\n[2026-06-02 14:25:05] [ERROR] Redis client write operation rejected. Internal stack response follows:\nReplyError: MISCONF Redis is configured to save RDB snapshots on disk, but it is currently not able to persist on disk. Commands that may modify the data set are disabled because this instance is configured to report errors during writes if RDB snapshotting fails.\n[2026-06-02 14:25:06] [WARN] Session tokens cannot be saved. Users experiencing sudden logouts.`,
  },
  {
    id: "auth",
    title: "Auth Microservice Heap OOM",
    type: "Node.js Container",
    icon: Cpu,
    color: "text-purple-400",
    borderColor: "border-purple-500/20",
    logs: `[PM2] Spawning process 0 (auth-service)\n[0] 2026-06-02 14:29:15: Processing batch validation token requests... (Volume: 14,000 req/sec)\n[0] <--- Last few GCs --->\n[0] [4021:0x560f71c20]    45122 ms: Mark-sweep 2041.2 (2082.4) -> 2038.1 (2085.4) MB, 1204.5 / 0.0 ms\n[0] FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`,
  },
];

export default function IncidentSelector({ onSelectIncident, activeId }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
        Simulate Active Outage Target
      </label>
      <div className="grid grid-cols-1 gap-2">
        {MOCK_INCIDENTS.map((incident) => {
          const Icon = incident.icon;
          const isSelected = activeId === incident.id;

          return (
            <button
              key={incident.id}
              onClick={() => onSelectIncident(incident.id, incident.logs)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                isSelected
                  ? "bg-slate-800/80 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className={`p-2 rounded-lg bg-slate-950/60 ${incident.color}`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-200">
                    {incident.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {incident.type}
                  </p>
                </div>
              </div>
              {isSelected && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

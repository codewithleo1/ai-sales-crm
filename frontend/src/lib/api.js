import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function apiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const fmtMoney = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

export const STAGES = [
  { key: "lead", label: "Lead", color: "#6366F1" },
  { key: "contacted", label: "Contacted", color: "#3B82F6" },
  { key: "proposal", label: "Proposal", color: "#8B5CF6" },
  { key: "negotiation", label: "Negotiation", color: "#F59E0B" },
  { key: "closed_won", label: "Closed Won", color: "#10B981" },
  { key: "closed_lost", label: "Closed Lost", color: "#EF4444" },
];

export default api;

/**
 * src/utils/formatters.js
 * Centralized formatting helpers for clinical metrics, percentages, and scores.
 * Prevents floating point display overflows (e.g. 91.18100175322534%).
 */

/**
 * Format any number or decimal into a clean percentage string.
 * Automatically detects whether the value is a decimal (<= 1.0) or already a percent (<= 100).
 *
 * @param {number|string|null|undefined} value
 * @param {number} [decimals=1]
 * @returns {string} E.g. "94.2%", "8.8%", "0%"
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || value === "") return "0.0%";
  let num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.0%";

  // If between 0 and 1 (exclusive), it's a decimal ratio like 0.08818
  if (num > 0 && num <= 1.0) {
    num = num * 100;
  }

  // Clamp within 0 - 100
  num = Math.max(0, Math.min(100, num));
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format a number as a raw percentage float/number without the '%' symbol.
 *
 * @param {number|string|null|undefined} value
 * @param {number} [decimals=1]
 * @returns {number} E.g. 94.2
 */
export function getPercentNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === "") return 0;
  let num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return 0;

  if (num > 0 && num <= 1.0) {
    num = num * 100;
  }

  num = Math.max(0, Math.min(100, num));
  return Number(num.toFixed(decimals));
}

/**
 * Format clinical scores (e.g. pain score 8/10, or urgency 85).
 *
 * @param {number|string|null|undefined} value
 * @param {number} [max=10]
 * @returns {string} E.g. "8/10" or "8.5"
 */
export function formatScore(value, max = null) {
  if (value === null || value === undefined || value === "") return max ? `0/${max}` : "0";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return max ? `0/${max}` : "0";

  const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
  return max ? `${formatted}/${max}` : formatted;
}

/**
 * Safely normalize patient data from either database rows or sample mock objects.
 * Prevents undefined access and floating point overflows.
 */
export function normalizePatient(p) {
  if (!p) return null;

  const rawProb = p.uveitis_prob ?? p.uveitisProbability ?? 0;
  const uveitisProbability = getPercentNumber(rawProb, 1);

  const rawUrgency = p.urgency_index ?? p.urgencyIndex ?? 0;
  const urgencyIndex = Math.round(getPercentNumber(rawUrgency, 0));

  return {
    ...p,
    id: p.id || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
    name: p.name || "Anonymous Patient",
    age: Number(p.age) || 0,
    sex: p.sex || "Other",
    affectedEye: p.affected_eye || p.affectedEye || "Left Eye",
    symptomStart: p.symptom_start || p.symptomStart || "Recent",
    onset: p.onset_type || p.onset || "Gradual",
    riskTier: p.risk_tier || p.riskTier || "Low",
    uveitisProbability,
    urgencyIndex,
    severityClass: p.severity_class || p.severityClass || "Standard Screening Profile",
    slitlampStatus: p.slitlamp_status || p.slitlampStatus || "Awaiting Photo",
    submittedAt: p.submitted_at
      ? new Date(p.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : (p.submittedAt || "Recent"),
    primarySymptoms: p.primarySymptoms || (p.symptoms_json ? JSON.parse(p.symptoms_json) : []),
  };
}

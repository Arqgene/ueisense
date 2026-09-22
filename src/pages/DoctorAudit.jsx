import { useState, useEffect } from "react";
import { statsApi } from "../api/client.js";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Database,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import DoctorNavbar from "../components/DoctorNavbar.jsx";
import "../styles/doctor.css";

const MOCK_AUDIT_LOGS = [
  {
    id: 101,
    entity_type: "diagnosis",
    entity_id: "PT-8942",
    action: "senior_ratified",
    performed_by: "DR-AG-01 (Dr. Soundari S., Senior Consultant)",
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    details_json: JSON.stringify({
      final_diagnosis: "Acute Non-Granulomatous Anterior Uveitis",
      severity_grade: "Severe Grade 3",
      consensus_score: 96,
      topical_steroid: "Prednisolone Acetate 1% q1h",
      cycloplegic: "Cyclopentolate 1% TID",
      supervisory_signoff: "Ratified by Senior Specialist — Protocol Approved",
    }),
  },
  {
    id: 102,
    entity_type: "imaging",
    entity_id: "PT-8942",
    action: "cnn_revealed",
    performed_by: "system_multimodal",
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    details_json: JSON.stringify({
      image_type: "slitlamp",
      ac_cells: "+3 Grade (28 cells/field)",
      flare: "Moderate (+2)",
      cnn_confidence: 96.4,
    }),
  },
  {
    id: 103,
    entity_type: "assessment",
    entity_id: "PT-8942",
    action: "junior_feature_extracted",
    performed_by: "DR-AG-04 (Dr. Anand Parthasarathy, Junior Specialist)",
    created_at: new Date(Date.now() - 32 * 60000).toISOString(),
    details_json: JSON.stringify({
      provisional_diagnosis: "Acute Anterior Uveitis Suspicion",
      confidence: "High",
      agrees_with_ai: 1,
      ac_cell_grade: "3+",
      flare_grade: "2+",
      kp_type: "fine",
      escalated_to: "DR-AG-01 (Dr. Soundari S.)",
    }),
  },
  {
    id: 104,
    entity_type: "patient",
    entity_id: "PT-8942",
    action: "created",
    performed_by: "patient_intake",
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    details_json: JSON.stringify({
      risk_tier: "High",
      uveitis_prob: 94.2,
      urgency_index: 88,
      chief_complaint: "Sudden onset photophobia and deep eye pain",
      routed_to_doctor_id: "DR-AG-01",
      hospital_branch: "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)",
    }),
  },
  {
    id: 105,
    entity_type: "doctor",
    entity_id: "DR-AG-01",
    action: "login",
    performed_by: "DR-AG-01 (Dr. Soundari S.)",
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    details_json: JSON.stringify({
      clinic: "Dr. Agarwal's Eye Hospital - Cathedral Road",
      ip_address: "127.0.0.1",
      session_mode: "EMR Clinical Station",
      role: "senior",
    }),
  },
];

export default function DoctorAudit() {
  const [logs, setLogs] = useState(MOCK_AUDIT_LOGS);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    statsApi
      .audit()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLogs(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    return matchesSearch && log.entity_type === filterType;
  });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical_audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="doctor-page-wrapper">
      <DoctorNavbar />

      <main className="doctor-main-container">
        {/* Header */}
        <div className="doctor-page-header">
          <div>
            <div className="doctor-breadcrumb">
              <span>Doctor Portal</span> / <span>Compliance & Audit Trail</span>
            </div>
            <h1 className="doctor-heading">Clinical Audit Trail & Verification Logs</h1>
            <p className="doctor-subheading">
              Immutable clinical audit logs recording doctor review decisions, image reveal events, AI inferences, and treatment plan approvals.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchLogs}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={exportJSON}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Download size={14} />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="audit-filter-bar">
          <div className="table-search-box" style={{ maxWidth: "340px", flex: 1 }}>
            <Search size={16} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by Patient ID, Doctor, or Action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="audit-pill-filters">
            {[
              { key: "all", label: "All Logs" },
              { key: "patient", label: "Patient Intake" },
              { key: "assessment", label: "Doctor Assessments" },
              { key: "imaging", label: "Imaging & CNN" },
              { key: "diagnosis", label: "Final Diagnoses" },
              { key: "doctor", label: "Auth & Sessions" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`audit-filter-pill ${filterType === f.key ? "active" : ""}`}
                onClick={() => setFilterType(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="clinical-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Entity / Subject</th>
                <th>Action Performed</th>
                <th>Operator / Performed By</th>
                <th>Security & Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                let parsedDetails = null;
                try {
                  parsedDetails = log.details_json ? JSON.parse(log.details_json) : null;
                } catch {
                  parsedDetails = log.details_json;
                }

                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap", color: "#475569", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={13} style={{ color: "#94a3b8" }} />
                        <span>
                          {new Date(log.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="entity-type-badge">{log.entity_type}</span>
                      <strong style={{ marginLeft: "8px", color: "#0f172a" }}>{log.entity_id}</strong>
                    </td>
                    <td>
                      <span className={`action-badge ${log.action}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: "#334155", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={13} style={{ color: "#64748b" }} />
                        <span>{log.performed_by}</span>
                      </div>
                    </td>
                    <td>
                      {parsedDetails ? (
                        <div>
                          <button
                            type="button"
                            className="audit-expand-btn"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          >
                            <span>{isExpanded ? "Hide Details" : "View Payload"}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          {isExpanded && (
                            <pre className="audit-payload-json">
                              {JSON.stringify(parsedDetails, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

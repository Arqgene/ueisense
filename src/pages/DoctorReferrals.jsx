import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { referralsApi, patientsApi } from "../api/client.js";
import {
  Building2,
  Phone,
  MapPin,
  Stethoscope,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Filter,
} from "lucide-react";
import DoctorNavbar from "../components/DoctorNavbar.jsx";
import "../styles/doctor.css";

const SPECIALIST_CENTERS = [
  {
    id: "CTR-01",
    name: "Metropolitan Ocular Immunology & Uveitis Center",
    director: "Dr. Marcus Vance, MD, PhD",
    specialty: "Severe Uveitis, Biologic Therapies & Scleritis",
    address: "742 Evergreen Medical Park, Suite 400, Metro City",
    phone: "+1 (555) 234-8901",
    status: "Accepting Urgent Referrals",
    capacity: "Immediate (< 24 hrs)",
    tier: "Tertiary Referral Hub",
  },
  {
    id: "CTR-02",
    name: "Vision & Retina Specialists Institute",
    director: "Dr. Elena Rostova, MD",
    specialty: "Retinal Vasculitis, Posterior Chorioretinitis & Vitritis",
    address: "108 Health Boulevard, 2nd Floor, Westside",
    phone: "+1 (555) 987-6543",
    status: "Accepting Referrals",
    capacity: "Urgent (< 48 hrs)",
    tier: "Retina Specialty Center",
  },
  {
    id: "CTR-03",
    name: "University Cornea & Anterior Segment Research Clinic",
    director: "Dr. Priya Patel, MD, FRCOphth",
    specialty: "Anterior Uveitis, Keratouveitis & Ocular Hypertension",
    address: "University Hospital Medical Tower, Level 6",
    phone: "+1 (555) 456-7890",
    status: "Active Queue",
    capacity: "Routine (< 5 days)",
    tier: "Academic Research Clinic",
  },
  {
    id: "CTR-04",
    name: "Autoimmune & Systemic Rheumatology Care Center",
    director: "Dr. Arthur Campbell, FACR",
    specialty: "Systemic Lupus, Ankylosing Spondylitis, Sarcoidosis Workup",
    address: "500 Allied Health Center Way, East Wing",
    phone: "+1 (555) 789-0123",
    status: "Co-Management Hub",
    capacity: "Within 1 week",
    tier: "Systemic Immunology",
  },
];

const INITIAL_REFERRALS = [
  {
    id: 1,
    patient_id: "PT-8942",
    patient_name: "Sarah Jenkins",
    specialist_name: "Dr. Marcus Vance",
    clinic_name: "Metropolitan Ocular Immunology & Uveitis Center",
    specialty: "Severe Uveitis & Biologic Therapies",
    referral_priority: "High",
    referral_reason: "Acute severe anterior uveitis with 8/10 ciliary flush pain and systemic methotrexate co-therapy.",
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    status: "Dispatched",
  },
  {
    id: 2,
    patient_id: "PT-8945",
    patient_name: "Robert Vance",
    specialist_name: "Dr. Elena Rostova",
    clinic_name: "Vision & Retina Specialists Institute",
    specialty: "Retinal Vasculitis & Posterior Chorioretinitis",
    referral_priority: "High",
    referral_reason: "Posterior vasculitis with dense vitritis floaters and prior recurrence.",
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    status: "Accepted",
  },
  {
    id: 3,
    patient_id: "PT-8939",
    patient_name: "Amanda Chen",
    specialist_name: "Dr. Priya Patel",
    clinic_name: "University Cornea & Anterior Segment Research Clinic",
    specialty: "Recurrent Anterior Uveitis",
    referral_priority: "Medium",
    referral_reason: "Recurrent mild-to-moderate anterior uveitis flare workup.",
    created_at: new Date(Date.now() - 360 * 60000).toISOString(),
    status: "Scheduled",
  },
];

export default function DoctorReferrals() {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState(INITIAL_REFERRALS);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formPatient, setFormPatient] = useState("");
  const [formCenter, setFormCenter] = useState(SPECIALIST_CENTERS[0].name);
  const [formPriority, setFormPriority] = useState("High");
  const [formReason, setFormReason] = useState("");

  useEffect(() => {
    // Load existing referrals from server
    referralsApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReferrals(data);
        }
      })
      .catch(() => {});

    // Load patients for the referral select
    patientsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) setPatients(data);
      })
      .catch(() => {});
  }, []);

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!formPatient || !formReason) return;

    const center = SPECIALIST_CENTERS.find((c) => c.name === formCenter) || SPECIALIST_CENTERS[0];
    const selectedPatient = patients.find((p) => p.id === formPatient);

    const payload = {
      patient_id: formPatient,
      specialist_name: center.director,
      clinic_name: center.name,
      specialty: center.specialty,
      address: center.address,
      phone: center.phone,
      referral_priority: formPriority,
      referral_reason: formReason,
    };

    try {
      await referralsApi.create(payload);
    } catch {}

    const newEntry = {
      id: Date.now(),
      ...payload,
      patient_name: selectedPatient ? selectedPatient.name : formPatient,
      created_at: new Date().toISOString(),
      status: "Dispatched",
    };

    setReferrals([newEntry, ...referrals]);
    setShowModal(false);
    setFormReason("");
  };

  const filteredReferrals = referrals.filter(
    (r) =>
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_priority?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="doctor-page-wrapper">
      <DoctorNavbar />

      <main className="doctor-main-container">
        {/* Header */}
        <div className="doctor-page-header">
          <div>
            <div className="doctor-breadcrumb">
              <span>Doctor Portal</span> / <span>Specialist Referral Network</span>
            </div>
            <h1 className="doctor-heading">Specialist Referral Network & Directory</h1>
            <p className="doctor-subheading">
              Layer 3 Clinical Coordination — Direct ophthalmic and rheumatologic center referrals with priority dispatching.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} />
            <span>Create Specialist Referral</span>
          </button>
        </div>

        {/* Directory Cards */}
        <h2 className="section-title">Verified Ophthalmic Specialist Centers</h2>
        <div className="centers-grid">
          {SPECIALIST_CENTERS.map((center) => (
            <div key={center.id} className="center-card">
              <div className="center-card-top">
                <div className="center-badge">{center.tier}</div>
                <div className="center-capacity">{center.capacity}</div>
              </div>

              <h3 className="center-title">{center.name}</h3>
              <div className="center-director">
                <Stethoscope size={14} style={{ color: "#0284c7" }} />
                <span>{center.director}</span>
              </div>
              <div className="center-specialty">{center.specialty}</div>

              <div className="center-contact-block">
                <div className="center-contact-row">
                  <MapPin size={14} />
                  <span>{center.address}</span>
                </div>
                <div className="center-contact-row">
                  <Phone size={14} />
                  <span>{center.phone}</span>
                </div>
              </div>

              <div className="center-footer">
                <span className="center-status-pill">
                  <CheckCircle2 size={12} /> {center.status}
                </span>
                <button
                  type="button"
                  className="center-refer-btn"
                  onClick={() => {
                    setFormCenter(center.name);
                    setShowModal(true);
                  }}
                >
                  Refer Patient <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Outbound Referrals */}
        <div style={{ marginTop: "40px" }}>
          <div className="referrals-table-header">
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Active Patient Referrals Log</h2>
              <p className="section-subtitle" style={{ margin: "4px 0 0" }}>
                Tracks outbound patient dispatches, priority triage level, and destination clinics.
              </p>
            </div>

            <div className="table-search-box">
              <Search size={16} style={{ color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search patient or clinic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="clinical-table-wrapper">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Destination Specialist Center</th>
                  <th>Priority</th>
                  <th>Clinical Referral Reason</th>
                  <th>Dispatched</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id}>
                    <td>
                      <div className="table-patient-cell">
                        <strong className="patient-name">{ref.patient_name || ref.patient_id}</strong>
                        <span className="patient-id-tag">{ref.patient_id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-clinic-cell">
                        <strong>{ref.clinic_name}</strong>
                        <span>{ref.specialist_name} • {ref.specialty}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge ${ref.referral_priority?.toLowerCase()}`}>
                        {ref.referral_priority === "High" && <AlertTriangle size={12} />}
                        {ref.referral_priority}
                      </span>
                    </td>
                    <td>
                      <div className="referral-reason-text">{ref.referral_reason}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: "0.85rem" }}>
                      {new Date(ref.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </td>
                    <td>
                      <span className="status-pill-dispatched">
                        <CheckCircle2 size={12} /> {ref.status || "Dispatched"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => navigate(`/doctor/patient/${ref.patient_id}/dashboard`)}
                        title="Open patient workspace"
                      >
                        Open Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Referral Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Specialist Referral</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="modal-form">
              <div className="form-group">
                <label>Select Patient</label>
                <select
                  value={formPatient}
                  onChange={(e) => setFormPatient(e.target.value)}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) — {p.risk_tier} Risk
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Destination Specialist Center</label>
                <select
                  value={formCenter}
                  onChange={(e) => setFormCenter(e.target.value)}
                >
                  {SPECIALIST_CENTERS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.director})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Referral Priority Tier</label>
                <div className="priority-select-group">
                  {["High", "Medium", "Routine"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={`priority-select-btn ${tier.toLowerCase()} ${formPriority === tier ? "active" : ""}`}
                      onClick={() => setFormPriority(tier)}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Clinical Referral Reason & Specific Diagnostic Findings</label>
                <textarea
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Detail ocular inflammation, IOP elevations, anterior chamber cells, or systemic autoimmune history..."
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={15} style={{ marginRight: "6px" }} />
                  Dispatch Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

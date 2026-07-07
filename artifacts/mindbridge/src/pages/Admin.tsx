import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  CreditCard, Plug, Settings, ChevronRight, Search,
  Plus, Edit2, Trash2, CheckCircle, XCircle, Clock,
  TrendingUp, UserCheck, DollarSign, Video, Phone,
  Mail, Globe, Menu, X, LogOut, AlertCircle, Star,
  Activity, Wifi, WifiOff, ChevronDown, Save, Eye,
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const api = (path: string) => `${BASE_URL}/api${path}`;

type Section = "dashboard" | "patients" | "appointments" | "providers" | "payments" | "integrations" | "settings";

interface Provider {
  id: number; name: string; title: string; specialty: string; bio: string;
  rating: number; reviewCount: number; yearsExperience: number; imageUrl: string;
  available: boolean; sessionPrice: number; languages: string[] | null;
  acceptsInsurance: boolean; nextAvailable: string | null;
  email: string | null; phone: string | null;
  qualifications: string[] | null; doxyLink: string | null;
}

interface Appointment {
  id: number; patientName: string; patientEmail: string; patientPhone: string | null;
  providerId: number; providerName: string; date: string; time: string;
  type: string; status: string; notes: string | null; paymentMethod: string | null;
  createdAt: string;
}

interface Payment {
  id: number; appointmentId: number | null; patientName: string; patientPhone: string | null;
  patientEmail: string | null; providerName: string; providerId: number | null;
  amount: number; currency: string; method: string; status: string;
  reference: string | null; notes: string | null; createdAt: string;
}

interface AdminStats {
  totalProviders: number; totalAppointments: number; totalPayments: number;
  totalRevenue: number; todayAppointments: number;
  confirmedAppointments: number; pendingAppointments: number;
  recentAppointments: Appointment[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  failed:    "bg-red-100 text-red-800",
  refunded:  "bg-purple-100 text-purple-800",
};

const METHOD_LABELS: Record<string, string> = {
  credit: "💳 Card", cliq: "🏦 CliQ", zain: "📱 Zain", orange: "🟠 Orange",
};

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color ?? "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch(api("/admin/stats")).then(r => r.json()),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview & recent activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value={stats.totalAppointments} sub="Unique bookings" color="bg-blue-500" />
        <StatCard icon={CalendarDays} label="Today" value={stats.todayAppointments} sub="Appointments" color="bg-emerald-600" />
        <StatCard icon={DollarSign} label="Revenue" value={`${(stats.totalRevenue / 100).toFixed(0)} JOD`} sub="Completed payments" color="bg-violet-500" />
        <StatCard icon={Stethoscope} label="Providers" value={stats.totalProviders} sub="Active on platform" color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-bold text-gray-900">{stats.pendingAppointments}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-xs text-gray-500">Confirmed</p>
            <p className="text-lg font-bold text-gray-900">{stats.confirmedAppointments}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Payments</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalPayments}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Patient","Provider","Date","Time","Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentAppointments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.patientName}</td>
                  <td className="px-4 py-3 text-gray-600">{a.providerName}</td>
                  <td className="px-4 py-3 text-gray-600">{a.date}</td>
                  <td className="px-4 py-3 text-gray-600">{a.time}</td>
                  <td className="px-4 py-3">
                    <Badge label={a.status} color={STATUS_COLORS[a.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Patients() {
  const [search, setSearch] = useState("");
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => fetch(api("/appointments")).then(r => r.json()),
  });

  const patients = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string; sessions: number; last: string; provider: string }>();
    for (const a of appointments) {
      const key = a.patientEmail || a.patientName;
      const existing = map.get(key);
      if (!existing || a.createdAt > existing.last) {
        map.set(key, { name: a.patientName, email: a.patientEmail, phone: a.patientPhone || "—",
          sessions: (existing?.sessions ?? 0) + 1, last: a.date, provider: a.providerName });
      } else {
        map.set(key, { ...existing, sessions: existing.sessions + 1 });
      }
    }
    return Array.from(map.values());
  }, [appointments]);

  const filtered = patients.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Patients</h2>
          <p className="text-sm text-gray-500">{patients.length} unique patients registered</p>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Patient","Email","Phone","Sessions","Last Visit","Provider"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {p.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.email || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                <td className="px-4 py-3"><Badge label={`${p.sessions} session${p.sessions !== 1 ? "s" : ""}`} color="bg-blue-50 text-blue-700" /></td>
                <td className="px-4 py-3 text-gray-600">{p.last}</td>
                <td className="px-4 py-3 text-gray-600">{p.provider}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Appointments() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => fetch(api("/appointments")).then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(api(`/appointments/${id}`), {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const filtered = appointments.filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search && !a.patientName.toLowerCase().includes(search.toLowerCase()) &&
        !a.providerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tabs = ["all","pending","confirmed","cancelled"];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Appointments</h2>
          <p className="text-sm text-gray-500">{appointments.length} total bookings</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or provider…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white text-sm">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-2 capitalize transition-colors ${filter === t ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["#","Patient","Provider","Date","Time","Type","Payment","Status","Actions"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-400 text-xs">#{a.id}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{a.patientName}</p>
                    <p className="text-xs text-gray-500">{a.patientEmail}</p>
                    {a.patientPhone && <p className="text-xs text-gray-400">{a.patientPhone}</p>}
                  </td>
                  <td className="px-3 py-3 text-gray-700">{a.providerName}</td>
                  <td className="px-3 py-3 text-gray-600">{a.date}</td>
                  <td className="px-3 py-3 text-gray-600">{a.time}</td>
                  <td className="px-3 py-3 text-gray-600 capitalize">{a.type}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{a.paymentMethod ? METHOD_LABELS[a.paymentMethod] ?? a.paymentMethod : "—"}</td>
                  <td className="px-3 py-3">
                    <Badge label={a.status} color={STATUS_COLORS[a.status]} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {a.status === "pending" && (
                        <button onClick={() => updateStatus.mutate({ id: a.id, status: "confirmed" })}
                          title="Confirm" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {a.status !== "cancelled" && (
                        <button onClick={() => updateStatus.mutate({ id: a.id, status: "cancelled" })}
                          title="Cancel" className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No appointments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const EMPTY_PROVIDER: Partial<Provider> = {
  name: "", title: "", specialty: "", bio: "", email: "", phone: "",
  yearsExperience: 1, imageUrl: "", sessionPrice: 60, available: true,
  acceptsInsurance: false, languages: ["English"], qualifications: [], doxyLink: "",
};

function ProviderModal({ provider, onClose }: { provider: Partial<Provider> | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Provider>>(provider ?? EMPTY_PROVIDER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const isEdit = !!(provider as Provider)?.id;

  const save = async () => {
    if (!form.name || !form.title || !form.specialty || !form.bio) {
      setError("Name, title, specialty and bio are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? api(`/providers/${(provider as Provider).id}`) : api("/providers");
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...form,
        yearsExperience: Number(form.yearsExperience) || 1,
        sessionPrice: Number(form.sessionPrice) || 60,
        languages: typeof form.languages === "string"
          ? (form.languages as unknown as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : form.languages,
        qualifications: typeof form.qualifications === "string"
          ? (form.qualifications as unknown as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : form.qualifications,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      await qc.invalidateQueries({ queryKey: ["providers"] });
      onClose();
    } catch (e) {
      setError(String(e));
    }
    setSaving(false);
  };

  const f = (key: keyof Provider, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Provider" : "Add New Provider"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input value={form.name ?? ""} onChange={e => f("name", e.target.value)} className={inp} placeholder="Dr. Sarah Ahmed" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Professional Title *</label>
              <input value={form.title ?? ""} onChange={e => f("title", e.target.value)} className={inp} placeholder="Licensed Psychiatrist" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Specialty *</label>
              <input value={form.specialty ?? ""} onChange={e => f("specialty", e.target.value)} className={inp} placeholder="Anxiety & Depression" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Years of Experience *</label>
              <input type="number" min={0} value={form.yearsExperience ?? 1} onChange={e => f("yearsExperience", e.target.value)} className={inp} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bio / Description *</label>
            <textarea rows={3} value={form.bio ?? ""} onChange={e => f("bio", e.target.value)} className={inp} placeholder="Professional background and approach…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
              <input type="email" value={form.email ?? ""} onChange={e => f("email", e.target.value)} className={inp} placeholder="doctor@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone / WhatsApp</label>
              <input value={form.phone ?? ""} onChange={e => f("phone", e.target.value)} className={inp} placeholder="+962 7X XXX XXXX" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Session Price (USD) *</label>
              <input type="number" min={0} value={form.sessionPrice ?? 60} onChange={e => f("sessionPrice", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Next Available Date</label>
              <input value={form.nextAvailable ?? ""} onChange={e => f("nextAvailable", e.target.value)} className={inp} placeholder="YYYY-MM-DD" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Profile Photo URL</label>
            <input value={form.imageUrl ?? ""} onChange={e => f("imageUrl", e.target.value)} className={inp} placeholder="https://…/photo.jpg" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Doxy.me Session Link</label>
            <input value={form.doxyLink ?? ""} onChange={e => f("doxyLink", e.target.value)} className={inp} placeholder="https://doxy.me/drname" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Languages (comma-separated)</label>
              <input value={Array.isArray(form.languages) ? form.languages.join(", ") : form.languages ?? ""}
                onChange={e => f("languages", e.target.value)} className={inp} placeholder="English, Arabic" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Qualifications (comma-separated)</label>
              <input value={Array.isArray(form.qualifications) ? form.qualifications.join(", ") : form.qualifications ?? ""}
                onChange={e => f("qualifications", e.target.value)} className={inp} placeholder="MD, FRCPC, CBT Certified" />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.available} onChange={e => f("available", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded" />
              <span className="text-sm text-gray-700">Available for bookings</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.acceptsInsurance} onChange={e => f("acceptsInsurance", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded" />
              <span className="text-sm text-gray-700">Accepts insurance</span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : <><Save className="w-4 h-4" />{isEdit ? "Save Changes" : "Add Provider"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Providers() {
  const [modal, setModal] = useState<Partial<Provider> | null | false>(false);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: providers = [], isLoading } = useQuery<Provider[]>({
    queryKey: ["providers"],
    queryFn: () => fetch(api("/providers")).then(r => r.json()),
  });

  const deleteProvider = useMutation({
    mutationFn: (id: number) => fetch(api(`/providers/${id}`), { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });

  const filtered = providers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      {modal !== false && (
        <ProviderModal provider={modal} onClose={() => setModal(false)} />
      )}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Providers</h2>
            <p className="text-sm text-gray-500">{providers.length} healthcare providers</p>
          </div>
          <button onClick={() => setModal(EMPTY_PROVIDER)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Provider
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialty…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <img src={p.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=d1fae5&color=065f46`}
                    alt={p.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-emerald-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-gray-700">{p.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({p.reviewCount})</span>
                    </div>
                  </div>
                  <Badge label={p.available ? "Active" : "Inactive"} color={p.available ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"} />
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Activity className="w-3.5 h-3.5 text-gray-400" />
                    <span>{p.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span>${p.sessionPrice} USD / session</span>
                  </div>
                  {p.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.doxyLink && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Video className="w-3.5 h-3.5 text-gray-400" />
                      <a href={p.doxyLink} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline truncate">{p.doxyLink}</a>
                    </div>
                  )}
                  {p.languages?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.languages.map(l => <Badge key={l} label={l} color="bg-blue-50 text-blue-700" />)}
                    </div>
                  ) : null}
                  {p.qualifications?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.qualifications.map(q => <Badge key={q} label={q} color="bg-violet-50 text-violet-700" />)}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-gray-100 px-4 py-2.5 flex gap-2 bg-gray-50/50">
                <button onClick={() => setModal(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProvider.mutate(p.id); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No providers found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Payments() {
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["admin-payments"],
    queryFn: () => fetch(api("/admin/payments")).then(r => r.json()),
  });

  const updatePayment = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(api(`/admin/payments/${id}`), {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payments"] }),
  });

  const filtered = payments.filter(p => filter === "all" || p.status === filter);
  const totalRevenue = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);

  const tabs = ["all","pending","completed","refunded","failed"];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payments</h2>
          <p className="text-sm text-gray-500">Total revenue: <strong>{totalRevenue.toFixed(2)} JOD</strong></p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {showAdd && <AddPaymentForm onClose={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ["admin-payments"] }); }} />}

      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white text-sm w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-2 capitalize transition-colors ${filter === t ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["#","Patient","Provider","Amount","Method","Reference","Status","Date","Action"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-400 text-xs">#{p.id}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{p.patientName}</p>
                    {p.patientPhone && <p className="text-xs text-gray-500">{p.patientPhone}</p>}
                  </td>
                  <td className="px-3 py-3 text-gray-700">{p.providerName}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900">{(p.amount / 100).toFixed(2)} {p.currency}</td>
                  <td className="px-3 py-3 text-xs">{METHOD_LABELS[p.method] ?? p.method}</td>
                  <td className="px-3 py-3 text-xs text-gray-500 font-mono">{p.reference || "—"}</td>
                  <td className="px-3 py-3"><Badge label={p.status} color={STATUS_COLORS[p.status]} /></td>
                  <td className="px-3 py-3 text-xs text-gray-500">{p.createdAt.split("T")[0]}</td>
                  <td className="px-3 py-3">
                    {p.status === "pending" && (
                      <button onClick={() => updatePayment.mutate({ id: p.id, status: "completed" })}
                        className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No payment records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddPaymentForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ patientName: "", patientPhone: "", patientEmail: "", providerName: "", amount: "", currency: "JOD", method: "cliq", status: "completed", reference: "" });
  const [saving, setSaving] = useState(false);
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

  const save = async () => {
    if (!form.patientName || !form.providerName || !form.amount) return;
    setSaving(true);
    await fetch(api("/admin/payments"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Math.round(parseFloat(form.amount) * 100) }),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Record New Payment</h3>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-gray-500 mb-1">Patient Name *</label><input value={form.patientName} onChange={e => setForm(f => ({...f, patientName: e.target.value}))} className={inp} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Provider Name *</label><input value={form.providerName} onChange={e => setForm(f => ({...f, providerName: e.target.value}))} className={inp} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Patient Phone</label><input value={form.patientPhone} onChange={e => setForm(f => ({...f, patientPhone: e.target.value}))} className={inp} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Patient Email</label><input value={form.patientEmail} onChange={e => setForm(f => ({...f, patientEmail: e.target.value}))} className={inp} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Amount (JOD) *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className={inp} placeholder="25.00" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Method</label>
          <select value={form.method} onChange={e => setForm(f => ({...f, method: e.target.value}))} className={inp}>
            <option value="cliq">CliQ</option><option value="credit">Credit Card</option><option value="zain">Zain Cash</option><option value="orange">Orange Money</option>
          </select>
        </div>
        <div><label className="block text-xs text-gray-500 mb-1">Reference No.</label><input value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))} className={inp} placeholder="TXN-XXXXXX" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inp}>
            <option value="completed">Completed</option><option value="pending">Pending</option><option value="refunded">Refunded</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Payment"}
        </button>
      </div>
    </div>
  );
}

interface IntegrationCard { name: string; icon: string; description: string; status: "connected" | "setup" | "coming"; config?: Record<string, string>; }

const INTEGRATIONS: IntegrationCard[] = [
  { name: "Doxy.me", icon: "🎥", description: "HIPAA-compliant video sessions. Set the base URL and each provider's room link.", status: "connected", config: { "Base URL": "https://doxy.me", "Room Format": "doxy.me/{provider-slug}" } },
  { name: "WhatsApp Business", icon: "💬", description: "Admin notifications and patient WhatsApp confirmations via the configured number.", status: "connected", config: { "Admin Number": "+962 77 040 3270", "Provider": "WhatsApp Direct" } },
  { name: "CliQ — JoPACC", icon: "🏦", description: "Instant bank transfers via the Jordanian Payment Circuit. All Jordanian banks supported.", status: "connected", config: { "Network": "JoPACC", "Supported": "All JO Banks", "Format": "IBAN or Mobile Alias" } },
  { name: "Zain Cash", icon: "📱", description: "Mobile wallet payments for Zain subscribers in Jordan.", status: "connected", config: { "USSD": "*777#", "Currency": "JOD" } },
  { name: "Orange Money", icon: "🟠", description: "Mobile wallet payments for Orange subscribers in Jordan.", status: "connected", config: { "Provider": "Orange Jordan", "Currency": "JOD" } },
  { name: "Twilio SMS", icon: "📨", description: "SMS appointment reminders and OTP verification.", status: "setup", config: { "Status": "Configure API key to enable" } },
  { name: "Stripe", icon: "💳", description: "International credit/debit card processing for global patients.", status: "setup", config: { "Status": "Add Stripe secret key to enable" } },
  { name: "Email (SMTP)", icon: "📧", description: "Automated booking confirmation and reminder emails.", status: "setup", config: { "Admin Email": "jamal_alqhaiwi@yahoo.com" } },
];

function Integrations() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500">Service providers and third-party connections</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map(intg => (
          <div key={intg.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl">{intg.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{intg.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{intg.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {intg.status === "connected" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <Wifi className="w-3 h-3" /> Connected
                    </span>
                  ) : intg.status === "setup" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Setup Required
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      <WifiOff className="w-3 h-3" /> Coming Soon
                    </span>
                  )}
                  <button onClick={() => setExpanded(expanded === intg.name ? null : intg.name)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expanded === intg.name ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {expanded === intg.name && intg.config && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {Object.entries(intg.config).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-gray-800 font-mono bg-gray-50 px-2 py-0.5 rounded">{v}</span>
                    </div>
                  ))}
                  {intg.status === "setup" && (
                    <div className="mt-3">
                      <input placeholder={`Enter ${intg.name} API key…`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                      <button className="mt-2 w-full py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                        Save & Connect
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformSettings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platformName: "Clearhead", tagline: "Expert mental health care, anywhere in the world.",
    adminEmail: "jamal_alqhaiwi@yahoo.com", adminWhatsApp: "+962770403270",
    sessionDuration: "50", currency: "JOD", timezone: "Asia/Amman",
    bookingWindow: "30", cancellationHours: "24",
  });
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Platform Settings</h2>
        <p className="text-sm text-gray-500">Global configuration for the Clearhead platform</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100">
          <CheckCircle className="w-4 h-4" /> Settings saved successfully
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">Branding</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">Platform Name</label>
            <input value={form.platformName} onChange={e => f("platformName", e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Default Currency</label>
            <select value={form.currency} onChange={e => f("currency", e.target.value)} className={inp}>
              <option>JOD</option><option>USD</option><option>EUR</option><option>SAR</option><option>AED</option>
            </select>
          </div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Tagline</label>
            <input value={form.tagline} onChange={e => f("tagline", e.target.value)} className={inp} /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">Admin Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">Admin Email</label>
            <input type="email" value={form.adminEmail} onChange={e => f("adminEmail", e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Admin WhatsApp</label>
            <input value={form.adminWhatsApp} onChange={e => f("adminWhatsApp", e.target.value)} className={inp} /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">Booking Rules</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">Session Duration (min)</label>
            <input type="number" value={form.sessionDuration} onChange={e => f("sessionDuration", e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Booking Window (days)</label>
            <input type="number" value={form.bookingWindow} onChange={e => f("bookingWindow", e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Cancellation (hours)</label>
            <input type="number" value={form.cancellationHours} onChange={e => f("cancellationHours", e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Timezone</label>
            <select value={form.timezone} onChange={e => f("timezone", e.target.value)} className={inp}>
              <option>Asia/Amman</option><option>Asia/Riyadh</option><option>Asia/Dubai</option><option>Europe/London</option><option>UTC</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={save}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
        <Save className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<{className?:string}> }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "patients",     label: "Patients",     icon: Users },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "providers",    label: "Providers",    icon: Stethoscope },
  { id: "payments",     label: "Payments",     icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "settings",     label: "Settings",     icon: Settings },
];

export default function Admin() {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (section) {
      case "dashboard":    return <Dashboard />;
      case "patients":     return <Patients />;
      case "appointments": return <Appointments />;
      case "providers":    return <Providers />;
      case "payments":     return <Payments />;
      case "integrations": return <Integrations />;
      case "settings":     return <PlatformSettings />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-gray-900 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">Clearhead Admin</p>
            <p className="text-white/40 text-xs">Management Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                section === item.id ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {section === item.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <a href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" /> Back to Site
          </a>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 capitalize">{section}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

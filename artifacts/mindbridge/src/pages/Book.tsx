import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useListProviders, useCreateAppointment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAppointmentsQueryKey } from "@workspace/api-client-react";

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
const sessionTypes = ["video", "phone", "messaging"];

export default function Book() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preSelectedProvider = params.get("provider") || "";

  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: providers } = useListProviders({});
  const createAppointment = useCreateAppointment();

  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    providerId: preSelectedProvider,
    date: "",
    time: "",
    type: "video",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.patientName || !form.patientEmail || !form.providerId || !form.date || !form.time) {
      setError("Please fill in all required fields.");
      return;
    }
    createAppointment.mutate(
      {
        data: {
          patientName: form.patientName,
          patientEmail: form.patientEmail,
          providerId: parseInt(form.providerId),
          date: form.date,
          time: form.time,
          type: form.type,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          setSubmitted(true);
        },
        onError: () => setError("Something went wrong. Please try again."),
      }
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Session booked!</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your appointment has been confirmed. You'll receive a confirmation email at {form.patientEmail}. We look forward to seeing you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/appointments")}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              View my appointments
            </button>
            <button
              onClick={() => { setSubmitted(false); setForm({ patientName: "", patientEmail: "", providerId: "", date: "", time: "", type: "video", notes: "" }); }}
              className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
            >
              Book another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Book a Session</h1>
          <p className="text-muted-foreground text-lg mb-10">Schedule time with a licensed mental health provider.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Info */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Your information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full name <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email address <span className="text-destructive">*</span></label>
                  <input
                    type="email"
                    name="patientEmail"
                    value={form.patientEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Provider & Session */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Session details</h2>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Provider <span className="text-destructive">*</span></label>
                <select
                  name="providerId"
                  value={form.providerId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a provider...</option>
                  {providers?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.specialty} (${p.sessionPrice}/session)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date <span className="text-destructive">*</span></label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Time <span className="text-destructive">*</span></label>
                  <select
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a time...</option>
                    {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Session type <span className="text-destructive">*</span></label>
                <div className="flex gap-3">
                  {sessionTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border capitalize transition-all ${
                        form.type === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes <span className="text-muted-foreground">(optional)</span></label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Share anything that would help your provider prepare for your session..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={createAppointment.isPending}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
            >
              {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              By booking, you agree to our Terms of Service. Sessions are HIPAA-compliant and fully confidential.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

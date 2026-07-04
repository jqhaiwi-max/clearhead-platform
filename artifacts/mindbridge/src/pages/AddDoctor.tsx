import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, User, Stethoscope, Globe, DollarSign, FileText, Camera, Phone, Mail, Shield, ChevronRight, ChevronLeft } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { COUNTRY_LIST } from "@/lib/pricing";

const SPECIALTIES = [
  "Anxiety & Stress", "Depression", "PTSD & Trauma", "ADHD", "Bipolar Disorder",
  "OCD", "Grief & Loss", "Addiction & Recovery", "Couples & Relationships",
  "Child & Adolescent", "Psychiatry", "Eating Disorders", "Personality Disorders",
  "Psychosis & Schizophrenia", "Sleep Disorders", "Occupational & Burnout",
  "LGBTQ+ Affirmative", "Feminist Therapy", "Neurodiversity", "Other",
];

const LANGUAGES_LIST = [
  "Arabic", "English", "French", "German", "Turkish", "Spanish", "Italian",
  "Portuguese", "Urdu", "Hindi", "Persian", "Hebrew", "Mandarin", "Japanese",
  "Korean", "Bengali", "Swahili", "Russian", "Dutch", "Polish",
];

type Step = "personal" | "professional" | "pricing" | "contact" | "review";

const STEPS: Step[] = ["personal", "professional", "pricing", "contact", "review"];

const STEP_META: Record<Step, { label: string; icon: React.ElementType }> = {
  personal:     { label: "Personal Info",   icon: User },
  professional: { label: "Credentials",    icon: Stethoscope },
  pricing:      { label: "Rates & Langs",  icon: DollarSign },
  contact:      { label: "Contact",        icon: Phone },
  review:       { label: "Review",         icon: FileText },
};

type FormData = {
  fullName: string;
  title: string;
  nationality: string;
  imageUrl: string;
  licenseNumber: string;
  specialty: string;
  otherSpecialty: string;
  bio: string;
  credentials: string;
  yearsExperience: string;
  languages: string[];
  sessionPrice: string;
  acceptsInsurance: boolean;
  email: string;
  phone: string;
  whatsapp: string;
  agreeTerms: boolean;
};

const INITIAL: FormData = {
  fullName: "", title: "", nationality: "", imageUrl: "", licenseNumber: "",
  specialty: "", otherSpecialty: "", bio: "", credentials: "", yearsExperience: "",
  languages: [], sessionPrice: "", acceptsInsurance: false,
  email: "", phone: "", whatsapp: "", agreeTerms: false,
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50" />
  );
}

export default function AddDoctor() {
  const { t } = useLang();
  const [step, setStep] = useState<Step>("personal");
  const [data, setData] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const stepIdx = STEPS.indexOf(step);
  const set = (k: keyof FormData, v: any) => setData((d) => ({ ...d, [k]: v }));

  const toggleLang = (l: string) => {
    set("languages", data.languages.includes(l)
      ? data.languages.filter((x) => x !== l)
      : [...data.languages, l]);
  };

  const next = () => stepIdx < STEPS.length - 1 && setStep(STEPS[stepIdx + 1]);
  const back = () => stepIdx > 0 && setStep(STEPS[stepIdx - 1]);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3">{t.addDoctor.success}</h2>
          <p className="text-muted-foreground">Our team will review your credentials and contact you at <strong>{data.email}</strong> within 48 hours.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Stethoscope className="w-4 h-4" /> For Mental Health Professionals
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">{t.addDoctor.title}</h1>
            <p className="text-muted-foreground text-lg">{t.addDoctor.subtitle}</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-between mb-10 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-0" />
            {STEPS.map((s, i) => {
              const Icon = STEP_META[s].icon;
              const done = i < stepIdx;
              const active = s === step;
              return (
                <button key={s} onClick={() => i < stepIdx && setStep(s)} className="relative flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                    done ? "border-primary bg-primary" : active ? "border-primary bg-white shadow-md" : "border-border bg-white"
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {STEP_META[s].label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Step card */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-8 mb-6">

              {step === "personal" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Personal Information</h2>
                  <FieldGroup label={t.addDoctor.fullName}>
                    <Input value={data.fullName} onChange={(v) => set("fullName", v)} placeholder="Dr. Amina Al-Hassan" />
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.title2}>
                    <Input value={data.title} onChange={(v) => set("title", v)} placeholder="Clinical Psychologist, MD" />
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.nationality}>
                    <select value={data.nationality} onChange={(e) => set("nationality", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select country / nationality</option>
                      {COUNTRY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.imageUrl}>
                    <Input value={data.imageUrl} onChange={(v) => set("imageUrl", v)} placeholder="https://... (professional headshot)" />
                    {data.imageUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={data.imageUrl} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-border" onError={(e) => e.currentTarget.classList.add("hidden")} />
                        <span className="text-xs text-muted-foreground">Preview</span>
                      </div>
                    )}
                  </FieldGroup>
                </div>
              )}

              {step === "professional" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Professional Credentials</h2>
                  <FieldGroup label="License / Registration Number">
                    <Input value={data.licenseNumber} onChange={(v) => set("licenseNumber", v)} placeholder="e.g. JPA-2019-001234" />
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.specialty}>
                    <select value={data.specialty} onChange={(e) => set("specialty", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select primary specialty</option>
                      {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FieldGroup>
                  {data.specialty === "Other" && (
                    <FieldGroup label="Describe your specialty">
                      <Input value={data.otherSpecialty} onChange={(v) => set("otherSpecialty", v)} placeholder="Describe your area of practice" />
                    </FieldGroup>
                  )}
                  <FieldGroup label={t.addDoctor.credentials}>
                    <Input value={data.credentials} onChange={(v) => set("credentials", v)} placeholder="PhD, CBT Certified, EMDR Level 2…" />
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.experience}>
                    <Input type="number" value={data.yearsExperience} onChange={(v) => set("yearsExperience", v)} placeholder="Years of clinical experience" />
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.bio}>
                    <textarea value={data.bio} onChange={(e) => set("bio", e.target.value)} rows={4} placeholder={t.addDoctor.bioPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                  </FieldGroup>
                </div>
              )}

              {step === "pricing" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Rates & Languages</h2>
                  <FieldGroup label={t.addDoctor.price}>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                      <Input value={data.sessionPrice} onChange={(v) => set("sessionPrice", v)} placeholder="e.g. 60" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Enter the price for a 45-minute session in USD. Longer sessions are automatically priced proportionally.</p>
                    {data.sessionPrice && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                        {[{m:45,x:1},{m:60,x:1.3},{m:90,x:1.8}].map(({m,x}) => (
                          <div key={m} className="bg-muted rounded-xl p-2.5">
                            <div className="font-semibold text-foreground">{m} min</div>
                            <div className="text-primary font-bold">${Math.round(Number(data.sessionPrice) * x)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FieldGroup>
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div onClick={() => set("acceptsInsurance", !data.acceptsInsurance)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${data.acceptsInsurance ? "border-primary bg-primary" : "border-input group-hover:border-primary/50"}`}>
                        {data.acceptsInsurance && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-foreground">{t.addDoctor.acceptsInsurance}</span>
                    </label>
                  </div>
                  <FieldGroup label={t.addDoctor.languages}>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {LANGUAGES_LIST.map((l) => (
                        <button key={l} onClick={() => toggleLang(l)} type="button"
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                            data.languages.includes(l) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                          }`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </FieldGroup>
                </div>
              )}

              {step === "contact" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Contact Information</h2>
                  <FieldGroup label={t.addDoctor.email}>
                    <Input type="email" value={data.email} onChange={(v) => set("email", v)} placeholder="dr.amina@example.com" />
                  </FieldGroup>
                  <FieldGroup label={t.addDoctor.phone}>
                    <Input type="tel" value={data.phone} onChange={(v) => set("phone", v)} placeholder="+962 7x xxx xxxx" />
                  </FieldGroup>
                  <FieldGroup label="WhatsApp number">
                    <Input type="tel" value={data.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="+962 7x xxx xxxx (if different)" />
                  </FieldGroup>
                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex gap-3">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">Your contact details are used only for application review and onboarding. They are never shared publicly without your consent.</p>
                  </div>
                </div>
              )}

              {step === "review" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Review & Submit</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Name", value: data.fullName },
                      { label: "Title", value: data.title },
                      { label: "Nationality", value: COUNTRY_LIST.find(c => c.code === data.nationality)?.name || data.nationality },
                      { label: "Specialty", value: data.specialty === "Other" ? data.otherSpecialty : data.specialty },
                      { label: "Experience", value: data.yearsExperience ? `${data.yearsExperience} years` : "—" },
                      { label: "Session price", value: data.sessionPrice ? `$${data.sessionPrice} / 45 min` : "—" },
                      { label: "Languages", value: data.languages.join(", ") || "—" },
                      { label: "Email", value: data.email },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2.5 border-b border-border last:border-0 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground max-w-[60%] text-right truncate">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group mt-4">
                    <div onClick={() => set("agreeTerms", !data.agreeTerms)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${data.agreeTerms ? "border-primary bg-primary" : "border-input group-hover:border-primary/50"}`}>
                      {data.agreeTerms && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-foreground/80 leading-relaxed">
                      I confirm that all information provided is accurate and I agree to Clearhead's Provider Terms of Service, Code of Conduct, and Privacy Policy.
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {stepIdx > 0 && (
              <button onClick={back} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <div className="flex-1" />
            {step !== "review" ? (
              <button onClick={next} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!data.agreeTerms || loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  data.agreeTerms ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> {t.addDoctor.submit}</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

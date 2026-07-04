import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, X, Leaf, Sparkles, Search, Shield, AlertTriangle, Lock } from "lucide-react";
import { useCountry } from "@/context/CountryContext";
import { useLang } from "@/context/LanguageContext";
import { COUNTRY_LIST, SESSION_DURATIONS, getSessionPrice, type CountryPricing } from "@/lib/pricing";

/* ─── CONDITIONS ───────────────────────────────────────────── */
const CONDITIONS = [
  { id: "anxiety", label: "Anxiety & Panic Attacks", emoji: "💭" },
  { id: "depression", label: "Depression & Low Mood", emoji: "🌧️" },
  { id: "ocd", label: "OCD & Intrusive Thoughts", emoji: "🔄" },
  { id: "trauma", label: "PTSD & Trauma", emoji: "💔" },
  { id: "adhd", label: "ADHD & Attention Issues", emoji: "⚡" },
  { id: "bipolar", label: "Bipolar Disorder", emoji: "🌊" },
  { id: "relationships", label: "Relationship Difficulties", emoji: "🤝" },
  { id: "grief", label: "Grief & Loss", emoji: "🕊️" },
  { id: "stress", label: "Stress & Burnout", emoji: "🔥" },
  { id: "sleep", label: "Sleep Problems", emoji: "😴" },
  { id: "eating", label: "Eating Disorders", emoji: "🍃" },
  { id: "addiction", label: "Addiction & Substance Use", emoji: "🔗" },
  { id: "phobias", label: "Phobias & Fears", emoji: "😰" },
  { id: "self_esteem", label: "Low Self-Esteem", emoji: "🪞" },
  { id: "identity", label: "Gender & Identity", emoji: "🌈" },
  { id: "transitions", label: "Life Transitions", emoji: "🦋" },
  { id: "explore", label: "General mental wellness", emoji: "🌱" },
  { id: "other", label: "Other / Something else", emoji: "✨" },
];

const SYMPTOM_MAP: Record<string, string[]> = {
  anxiety: ["Repeated nervousness & outbursts", "Sleep problems", "Racing thoughts", "Physical tension"],
  depression: ["Persistent sadness", "Loss of enjoyment", "Chronic fatigue", "Crying spells", "Social withdrawal"],
  trauma: ["Flashbacks or intrusive thoughts", "Hypervigilance", "Avoidance", "Emotional numbness"],
  stress: ["Chronic fatigue", "Irritability", "Difficulty concentrating", "Physical symptoms"],
  grief: ["Persistent sadness", "Crying spells", "Social withdrawal", "Difficulty accepting loss"],
  addiction: ["Substance or alcohol dependence", "Loss of control", "Withdrawal symptoms"],
  relationships: ["Communication difficulties", "Recurring conflicts", "Trust issues", "Social withdrawal"],
  adhd: ["Difficulty concentrating", "Impulsivity", "Hyperactivity", "Disorganisation"],
  sleep: ["Insomnia", "Excessive daytime sleepiness", "Nightmares or night terrors"],
  ocd: ["Repeated rituals or compulsions", "Intrusive thoughts", "Difficulty controlling thoughts"],
  bipolar: ["Mood swings", "Periods of high energy followed by low mood", "Impulsivity"],
};

const ALL_SYMPTOMS = [
  "Sleep problems", "Repeated nervousness & outbursts", "Crying spells", "Persistent sadness",
  "Social withdrawal", "Appetite changes", "Chronic fatigue", "Loss of enjoyment",
  "Substance or alcohol dependence", "Communication difficulties", "Racing thoughts",
  "Flashbacks or intrusive thoughts", "Irritability", "Difficulty concentrating",
  "Physical tension", "Avoidance", "Emotional numbness", "None of the above",
];

const HOW_HEARD = [
  { id: "facebook", label: "Facebook", emoji: "👤" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "influencer", label: "A creator I follow", emoji: "🎯" },
  { id: "friend", label: "Friend or family", emoji: "💙" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
  { id: "google", label: "Google search", emoji: "🔍" },
  { id: "employer", label: "Institution / employer", emoji: "🏢" },
  { id: "other", label: "Other", emoji: "✨" },
];

const SERVICE_TYPES = [
  { id: "individual", title: "Individual Therapy", subtitle: "Personal sessions for adults 18+", emoji: "🌱" },
  { id: "couples", title: "Couples Counseling", subtitle: "Together or alone — your pace", emoji: "🌿" },
  { id: "children", title: "Children & Teens", subtitle: "Specialised support under 18", emoji: "🦋" },
  { id: "psychiatric", title: "Psychiatric Consultation", subtitle: "Diagnosis, medication & management", emoji: "🧬" },
];

type Answers = {
  serviceType: string;
  conditions: string[];
  conditionOther: string;
  symptoms: string[];
  previousTherapy: string;
  age: string;
  gender: string;
  country: string;
  preferredTherapistGender: string;
  religious: string;
  sessionFormat: string;
  sessionDuration: number;
  contactMethod: string;
  contactDetail: string;
  howHeard: string;
  acceptedTerms: boolean;
};

const initial: Answers = {
  serviceType: "", conditions: [], conditionOther: "", symptoms: [],
  previousTherapy: "", age: "", gender: "", country: "",
  preferredTherapistGender: "", religious: "", sessionFormat: "",
  sessionDuration: 45, contactMethod: "", contactDetail: "", howHeard: "", acceptedTerms: false,
};

function getAutoSymptoms(conditions: string[]): string[] {
  const auto = new Set<string>();
  conditions.forEach((c) => { (SYMPTOM_MAP[c] ?? []).forEach((s) => auto.add(s)); });
  return [...auto];
}

function buildSteps(a: Answers): string[] {
  const steps = [
    "serviceType", "conditions", "symptoms", "previousTherapy",
    "age", "gender", "country", "preferredTherapistGender", "religious",
    "sessionFormat", "sessionDuration", "contactMethod",
  ];
  if (a.contactMethod === "WhatsApp" || a.contactMethod === "Phone call") steps.push("contactDetail");
  if (a.contactMethod === "Email") steps.push("contactEmail");
  steps.push("howHeard", "terms");
  return steps;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
      <motion.div className="h-1.5 rounded-full bg-white/70" style={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
    </div>
  );
}

/* Condition dropdown with search + multi-select + "Other" text */
function ConditionSelector({ selected, onChange, otherText, onOtherChange }: {
  selected: string[]; onChange: (v: string[]) => void;
  otherText: string; onOtherChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = CONDITIONS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  const selectedLabels = CONDITIONS.filter((c) => selected.includes(c.id)).map((c) => c.label);
  const hasOther = selected.includes("other");

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div ref={ref} className="space-y-3">
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-sm text-white">
          <span className={selected.length ? "text-white" : "text-white/40"}>
            {selected.length === 0 ? "Select your concerns..." : `${selected.length} selected: ${selectedLabels.slice(0, 2).join(", ")}${selected.length > 2 ? "…" : ""}`}
          </span>
          <ChevronDown className={`w-4 h-4 text-white/50 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-[hsl(158,55%,10%)] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-white/10 flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conditions..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none py-1.5" />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors ${selected.includes(c.id) ? "text-white" : "text-white/70"}`}>
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected.includes(c.id) ? "border-white bg-white" : "border-white/30"}`}>
                    {selected.includes(c.id) && <Check className="w-2.5 h-2.5 text-[hsl(158,55%,18%)]" />}
                  </div>
                  <span className="text-base">{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pills for selected */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.filter((c) => selected.includes(c.id)).map((c) => (
            <span key={c.id} onClick={() => toggle(c.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs cursor-pointer hover:bg-white/25 transition-colors">
              {c.emoji} {c.label} <X className="w-3 h-3 ml-0.5 opacity-60" />
            </span>
          ))}
        </div>
      )}

      {/* Other textarea */}
      {hasOther && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <textarea value={otherText} onChange={(e) => onOtherChange(e.target.value)} rows={3}
            placeholder="Tell us more about what you're going through. Anything you share helps us find the right match..."
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm resize-none placeholder:text-white/30 focus:outline-none focus:border-white/40" />
        </motion.div>
      )}
    </div>
  );
}

function MultiChip({ options, selected, onChange, autoSelected = [] }: {
  options: { id?: string; label: string; emoji?: string }[];
  selected: string[]; onChange: (v: string[]) => void;
  autoSelected?: string[];
}) {
  const toggle = (id: string) => {
    if (id === "None of the above") { onChange(selected.includes(id) ? [] : [id]); return; }
    const f = selected.filter((s) => s !== "None of the above");
    onChange(f.includes(id) ? f.filter((s) => s !== id) : [...f, id]);
  };
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map((opt) => {
        const id = opt.id ?? opt.label;
        const active = selected.includes(id);
        const auto = autoSelected.includes(id);
        return (
          <button key={id} onClick={() => toggle(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
              active ? "border-white/60 bg-white text-[hsl(158,55%,18%)]" : auto ? "border-white/40 bg-white/12 text-white" : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
            }`}>
            <span className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${active ? "border-[hsl(158,55%,26%)] bg-[hsl(158,55%,26%)]" : "border-white/30"}`}>
              {active && <Check className="w-3 h-3 text-white" />}
            </span>
            {opt.emoji && <span className="text-base">{opt.emoji}</span>}
            <span className="flex-1">{opt.label}</span>
            {auto && !active && <span className="text-xs text-white/40 italic">suggested</span>}
          </button>
        );
      })}
    </div>
  );
}

function SingleChoice({ options, value, onChange }: {
  options: { id?: string; label: string; emoji?: string; note?: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const id = opt.id ?? opt.label;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`px-5 py-3.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-3 ${
              value === id ? "border-white bg-white text-[hsl(158,55%,18%)]" : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
            }`}>
            {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
            <div>
              <div>{opt.label}</div>
              {opt.note && <div className="text-xs opacity-60 font-normal">{opt.note}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CountryDropdown({ value, onChange }: { value: string; onChange: (code: string, c: CountryPricing) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const selected = COUNTRY_LIST.find((c) => c.code === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-sm flex items-center justify-between text-white hover:bg-white/15 transition-colors">
        <span className={value ? "text-white" : "text-white/40"}>{selected ? `${selected.flag} ${selected.name}` : "Select your country..."}</span>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[hsl(158,55%,12%)] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search country..."
              className="w-full px-3 py-2 text-sm bg-white/10 rounded-lg outline-none text-white placeholder:text-white/40" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button key={c.code} onClick={() => { onChange(c.code, c); setOpen(false); setQuery(""); }}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-white/10 transition-colors ${value === c.code ? "text-white font-semibold" : "text-white/70"}`}>
                <span>{c.flag}</span><span>{c.name}</span>
                <span className="text-white/30 text-xs ml-auto">{c.symbol} {c.currency}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TermsStep({ accepted, onChange, country }: { accepted: boolean; onChange: (v: boolean) => void; country: CountryPricing }) {
  const clauses = [
    {
      icon: AlertTriangle,
      title: "Not a medical service",
      body: "Clearhead connects you with therapists and psychologists for cognitive and therapeutic support. This is NOT a medical service, does not constitute psychiatric diagnosis, and cannot replace emergency care. If you are in crisis, call your local emergency services immediately.",
      color: "text-amber-400",
    },
    {
      icon: Shield,
      title: "Informed consent & voluntary use",
      body: "You are voluntarily seeking mental health support. Sessions are for therapeutic, educational, and wellness purposes. You retain the right to end sessions at any time.",
      color: "text-sky-400",
    },
    {
      icon: Lock,
      title: "Confidentiality & privacy",
      body: `All sessions are private and encrypted. Under ${country.legalSystem}, disclosure occurs only when there is an imminent risk of harm to yourself or others, as required by law in ${country.name}. Governed by ${country.legalFramework}.`,
      color: "text-emerald-400",
    },
    {
      icon: Shield,
      title: "Communication & recording",
      body: "Sessions may be recorded for quality assurance and clinical supervision with your prior knowledge and consent. Recordings are stored securely and never shared externally.",
      color: "text-violet-400",
    },
    {
      icon: Check,
      title: "Age & eligibility",
      body: "You confirm you are 18 years of age or older, or have parental / guardian consent if under 18. Services are available only in regions where Clearhead is licensed to operate.",
      color: "text-emerald-400",
    },
  ];

  return (
    <div>
      <h2 className="text-white font-serif text-xl font-bold mb-1.5">Almost there — review & accept</h2>
      <p className="text-white/50 text-sm mb-5 leading-relaxed">Please read these important terms before we match you with a provider.</p>
      <div className="space-y-3 mb-5">
        {clauses.map((c) => (
          <div key={c.title} className="flex gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <c.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.color}`} />
            <div>
              <div className="text-white text-xs font-semibold mb-0.5">{c.title}</div>
              <div className="text-white/50 text-xs leading-relaxed">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onChange(!accepted)}
        className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all ${accepted ? "border-white bg-white text-[hsl(158,55%,18%)]" : "border-white/20 bg-white/5 text-white hover:border-white/40"}`}>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${accepted ? "border-[hsl(158,55%,26%)] bg-[hsl(158,55%,26%)]" : "border-white/40"}`}>
          {accepted && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className="text-sm font-medium leading-snug text-left">I have read, understood, and accept all terms above. I confirm I am using this service voluntarily.</span>
      </button>
    </div>
  );
}

function StepSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-serif text-xl font-bold mb-1.5 leading-snug">{title}</h2>
      {subtitle && <p className="text-white/50 text-sm mb-5 leading-relaxed">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  );
}

export default function Intake() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preType = params.get("type") || "";
  const { setCountry, country } = useCountry();
  const { t } = useLang();

  const [answers, setAnswers] = useState<Answers>({ ...initial, serviceType: preType });
  const [stepIdx, setStepIdx] = useState(preType ? 1 : 0);
  const [dir, setDir] = useState(1);

  const steps = buildSteps(answers);
  const currentStep = steps[stepIdx];
  const totalSteps = steps.length;
  const pct = ((stepIdx + 1) / totalSteps) * 100;

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setAnswers((a) => ({ ...a, [k]: v }));

  useEffect(() => {
    if (currentStep === "symptoms") {
      const auto = getAutoSymptoms(answers.conditions);
      if (auto.length > 0) set("symptoms", auto);
    }
  }, [stepIdx]);

  const canNext = (): boolean => {
    switch (currentStep) {
      case "serviceType": return !!answers.serviceType;
      case "conditions": return answers.conditions.length > 0;
      case "symptoms": return answers.symptoms.length > 0;
      case "previousTherapy": return !!answers.previousTherapy;
      case "age": return !!answers.age && Number(answers.age) >= 5 && Number(answers.age) <= 100;
      case "gender": return !!answers.gender;
      case "country": return !!answers.country;
      case "preferredTherapistGender": return !!answers.preferredTherapistGender;
      case "religious": return !!answers.religious;
      case "sessionFormat": return !!answers.sessionFormat;
      case "sessionDuration": return answers.sessionDuration > 0;
      case "contactMethod": return !!answers.contactMethod;
      case "contactDetail": return answers.contactDetail.length >= 7;
      case "contactEmail": return true;
      case "howHeard": return !!answers.howHeard;
      case "terms": return answers.acceptedTerms;
      default: return false;
    }
  };

  const next = () => {
    if (stepIdx < totalSteps - 1) { setDir(1); setStepIdx((i) => i + 1); }
    else finish();
  };
  const back = () => { setDir(-1); setStepIdx((i) => i - 1); };

  const finish = () => {
    const q = new URLSearchParams();
    if (answers.preferredTherapistGender && answers.preferredTherapistGender !== "no_pref") {
      q.set("gender", answers.preferredTherapistGender);
    }
    q.set("duration", String(answers.sessionDuration));
    const specialtyMap: Record<string, string> = {
      depression: "Depression", anxiety: "Anxiety & Stress", trauma: "PTSD & Trauma",
      addiction: "Addiction & Recovery", grief: "Grief & Loss", adhd: "ADHD", ocd: "OCD",
      bipolar: "Bipolar Disorder", relationships: "Couples & Relationships",
    };
    const mainCond = answers.conditions[0];
    if (mainCond && specialtyMap[mainCond]) q.set("specialty", specialtyMap[mainCond]);
    navigate(`/providers?${q.toString()}`);
  };

  const autoSymptoms = getAutoSymptoms(answers.conditions);
  const currentCountry = COUNTRY_LIST.find((c) => c.code === answers.country) ?? country;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(158,55%,10%)] via-[hsl(158,48%,16%)] to-[hsl(165,42%,20%)] flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[hsl(158,60%,30%)] opacity-10 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[hsl(200,60%,50%)] opacity-8 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-2">
        {stepIdx > 0 ? (
          <button onClick={back} className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
          <Leaf className="w-3.5 h-3.5" />
          <span>Step {stepIdx + 1} of {totalSteps}</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="relative flex-1 flex flex-col px-4 pb-8">
        <div className="max-w-lg w-full mx-auto flex-1 flex flex-col">
          <ProgressBar pct={pct} />

          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={currentStep} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto pr-0.5 space-y-1">

                  {currentStep === "serviceType" && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="w-5 h-5 text-white/60" />
                        <span className="text-white/50 text-sm">{t.intake.yourJourney}</span>
                      </div>
                      <h2 className="text-white font-serif text-2xl font-bold mb-1.5 leading-snug">{t.intake.whatSupport}</h2>
                      <p className="text-white/50 text-sm mb-6">{t.intake.chooseRight}</p>
                      <div className="flex flex-col gap-3">
                        {SERVICE_TYPES.map((svc) => (
                          <button key={svc.id} onClick={() => { set("serviceType", svc.id); setDir(1); setTimeout(() => setStepIdx(1), 180); }}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                              answers.serviceType === svc.id ? "border-white/80 bg-white shadow-lg" : "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30"
                            }`}>
                            <span className="text-3xl">{svc.emoji}</span>
                            <div className="flex-1">
                              <div className={`font-semibold text-base ${answers.serviceType === svc.id ? "text-[hsl(158,55%,18%)]" : "text-white"}`}>{svc.title}</div>
                              <div className={`text-xs mt-0.5 ${answers.serviceType === svc.id ? "text-[hsl(158,30%,40%)]" : "text-white/45"}`}>{svc.subtitle}</div>
                            </div>
                            {answers.serviceType === svc.id && (
                              <div className="w-6 h-6 rounded-full bg-[hsl(158,55%,26%)] flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === "conditions" && (
                    <StepSection title={t.intake.condition} subtitle={t.intake.conditionSubtitle}>
                      <ConditionSelector
                        selected={answers.conditions}
                        onChange={(v) => set("conditions", v)}
                        otherText={answers.conditionOther}
                        onOtherChange={(v) => set("conditionOther", v)}
                      />
                    </StepSection>
                  )}

                  {currentStep === "symptoms" && (
                    <StepSection title={t.intake.anySymptoms} subtitle={answers.conditions.length > 0 ? t.intake.preselected : undefined}>
                      <MultiChip
                        options={ALL_SYMPTOMS.map((s) => ({ label: s }))}
                        selected={answers.symptoms}
                        onChange={(v) => set("symptoms", v)}
                        autoSelected={autoSymptoms}
                      />
                    </StepSection>
                  )}

                  {currentStep === "previousTherapy" && (
                    <StepSection title={t.intake.previousTherapy}>
                      <SingleChoice value={answers.previousTherapy} onChange={(v) => set("previousTherapy", v)}
                        options={[
                          { id: "yes_helpful", label: "Yes — and it helped", emoji: "✅" },
                          { id: "yes_mixed", label: "Yes — mixed experience", emoji: "🔄" },
                          { id: "yes_stopped", label: "Yes — I stopped", emoji: "⏸️" },
                          { id: "no", label: "No — this is new for me", emoji: "🌱" },
                        ]} />
                    </StepSection>
                  )}

                  {currentStep === "age" && (
                    <StepSection title={t.intake.age} subtitle={t.intake.ageSubtitle}>
                      <div className="text-center py-4">
                        <input type="number" min={5} max={100} value={answers.age} onChange={(e) => set("age", e.target.value)}
                          placeholder="—"
                          className="text-center text-6xl font-bold w-full bg-transparent text-white border-b-2 border-white/20 focus:border-white/50 outline-none pb-3 placeholder:text-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                        <p className="text-white/40 text-sm mt-4">{t.intake.yearsOld}</p>
                      </div>
                    </StepSection>
                  )}

                  {currentStep === "gender" && (
                    <StepSection title={t.intake.gender}>
                      <SingleChoice value={answers.gender} onChange={(v) => set("gender", v)}
                        options={[
                          { id: "male", label: "Male", emoji: "🧑" },
                          { id: "female", label: "Female", emoji: "👩" },
                          { id: "nonbinary", label: "Non-binary / Gender-diverse", emoji: "🌈" },
                          { id: "prefer_not", label: "Prefer not to say", emoji: "🤐" },
                        ]} />
                    </StepSection>
                  )}

                  {currentStep === "country" && (
                    <StepSection title={t.intake.country} subtitle={t.intake.countrySubtitle}>
                      <CountryDropdown value={answers.country} onChange={(code, c) => { set("country", code); setCountry(c); }} />
                      {answers.country && (() => {
                        const c = COUNTRY_LIST.find((x) => x.code === answers.country);
                        return c ? (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-xs text-white/60 leading-relaxed">
                            <span className="text-white/80 font-medium">{c.flag} {c.name}</span> · {c.culturalNote} · {c.legalSystem}
                          </motion.div>
                        ) : null;
                      })()}
                    </StepSection>
                  )}

                  {currentStep === "preferredTherapistGender" && (
                    <StepSection title={t.intake.therapistGender} subtitle="All our providers are equally qualified — this is about your comfort.">
                      <SingleChoice value={answers.preferredTherapistGender} onChange={(v) => set("preferredTherapistGender", v)}
                        options={[
                          { id: "no_pref", label: t.intake.noPreference, emoji: "⚖️" },
                          { id: "male", label: t.intake.maleTherapis, emoji: "🧑‍⚕️" },
                          { id: "female", label: t.intake.femaleTherapis, emoji: "👩‍⚕️" },
                        ]} />
                    </StepSection>
                  )}

                  {currentStep === "religious" && (
                    <StepSection title={t.intake.religious} subtitle="We ask to help find a provider who resonates with your values.">
                      <SingleChoice value={answers.religious} onChange={(v) => set("religious", v)}
                        options={[
                          { id: "yes_religious", label: "Yes, faith is important to me", emoji: "🕊️" },
                          { id: "spiritual", label: "Spiritual but not religious", emoji: "✨" },
                          { id: "no", label: "Not particularly", emoji: "🌿" },
                          { id: "prefer_not", label: "Prefer not to say", emoji: "🤐" },
                        ]} />
                    </StepSection>
                  )}

                  {currentStep === "sessionFormat" && (
                    <StepSection title={t.intake.sessionFormat} subtitle="You can change this anytime.">
                      <SingleChoice value={answers.sessionFormat} onChange={(v) => set("sessionFormat", v)}
                        options={[
                          { id: "video", label: "Video call", emoji: "📹", note: "Face-to-face, wherever you are" },
                          { id: "phone", label: "Phone call", emoji: "📞", note: "Voice only — no camera needed" },
                          { id: "messaging", label: "Text messaging", emoji: "💬", note: "Async — reply at your own pace" },
                        ]} />
                    </StepSection>
                  )}

                  {currentStep === "sessionDuration" && (
                    <StepSection title={t.intake.sessionDuration} subtitle={t.intake.durationSubtitle}>
                      <div className="flex flex-col gap-3">
                        {SESSION_DURATIONS.map((d) => {
                          const active = answers.sessionDuration === d.minutes;
                          const priceInfo = answers.country
                            ? (() => {
                                const c = COUNTRY_LIST.find((x) => x.code === answers.country);
                                if (!c) return null;
                                return null; // price shown dynamically on checkout
                              })()
                            : null;
                          return (
                            <button key={d.minutes} onClick={() => set("sessionDuration", d.minutes)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${active ? "border-white bg-white shadow-lg" : "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30"}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${active ? "bg-[hsl(158,55%,26%)] text-white" : "bg-white/10 text-white"}`}>
                                {d.minutes}
                              </div>
                              <div className="flex-1">
                                <div className={`font-semibold text-base ${active ? "text-[hsl(158,55%,18%)]" : "text-white"}`}>{d.label} session</div>
                                <div className={`text-xs mt-0.5 ${active ? "text-[hsl(158,30%,40%)]" : "text-white/45"}`}>
                                  {d.minutes === 45 ? "Standard session — perfect for focused work" :
                                   d.minutes === 60 ? "Extended session — more depth and closure" :
                                   "Deep dive — intensive therapeutic work"}
                                </div>
                              </div>
                              {d.multiplier > 1 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-white/10 text-white/60"}`}>
                                  ×{d.multiplier}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </StepSection>
                  )}

                  {currentStep === "contactMethod" && (
                    <StepSection title={t.intake.contactMethod} subtitle="Your details are private and encrypted.">
                      <SingleChoice value={answers.contactMethod} onChange={(v) => { set("contactMethod", v); set("contactDetail", ""); }}
                        options={[
                          { id: "WhatsApp", label: "WhatsApp", emoji: "💚", note: "We'll send your match via WhatsApp" },
                          { id: "Email", label: "Email", emoji: "📧", note: "Match details sent to your inbox" },
                          { id: "Phone call", label: "Phone call", emoji: "📞", note: "Our team will call you to confirm" },
                        ]} />
                    </StepSection>
                  )}

                  {currentStep === "contactDetail" && (
                    <StepSection title={answers.contactMethod === "WhatsApp" ? t.intake.whatsappNumber : t.intake.phoneNumber}
                      subtitle="We'll only use this to send your match details. No marketing.">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">+</span>
                        <input type="tel" value={answers.contactDetail} onChange={(e) => set("contactDetail", e.target.value.replace(/\D/g, ""))}
                          placeholder="Country code + number (e.g. 9627xxxxxxx)"
                          className="w-full pl-8 pr-4 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15" />
                      </div>
                      <p className="text-xs text-white/30 mt-2">Format: country code followed by number. No spaces or dashes needed.</p>
                    </StepSection>
                  )}

                  {currentStep === "contactEmail" && (
                    <StepSection title={t.intake.emailAddress} subtitle="Optional — skip if you'd prefer not to share.">
                      <input type="email" value={answers.contactDetail} onChange={(e) => set("contactDetail", e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15" />
                    </StepSection>
                  )}

                  {currentStep === "howHeard" && (
                    <StepSection title={t.intake.howHeard} subtitle="Helps us reach more people who need support.">
                      <div className="grid grid-cols-2 gap-2">
                        {HOW_HEARD.map((opt) => (
                          <button key={opt.id} onClick={() => set("howHeard", opt.id)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${answers.howHeard === opt.id ? "border-white bg-white text-[hsl(158,55%,18%)]" : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25"}`}>
                            <span className="text-base">{opt.emoji}</span>
                            <span className="text-xs">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </StepSection>
                  )}

                  {currentStep === "terms" && (
                    <TermsStep accepted={answers.acceptedTerms} onChange={(v) => set("acceptedTerms", v)} country={currentCountry} />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next button */}
          {currentStep !== "serviceType" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-2">
              <button onClick={next} disabled={!canNext()}
                className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                  canNext() ? "bg-white text-[hsl(158,55%,18%)] hover:bg-white/95 hover:-translate-y-0.5 shadow-xl" : "bg-white/10 text-white/25 cursor-not-allowed"
                }`}>
                {stepIdx === totalSteps - 1 ? (
                  <><Sparkles className="w-4 h-4" /> {t.intake.findTherapist}</>
                ) : (
                  <>{t.intake.continueBtn} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              {currentStep === "contactEmail" && (
                <button onClick={next} className="w-full py-2.5 rounded-xl text-white/40 text-sm hover:text-white/60 transition-colors">
                  Skip this step
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

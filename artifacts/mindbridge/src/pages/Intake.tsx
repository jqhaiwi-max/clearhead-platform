import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, X } from "lucide-react";

const TOTAL_STEPS = 14;

const SERVICE_TYPES = [
  {
    id: "individual",
    title: "Individual Therapy",
    subtitle: "For adults 18 and above",
    emoji: "🧠",
    color: "bg-rose-50 border-rose-200 hover:border-rose-400",
    accent: "text-rose-600",
  },
  {
    id: "couples",
    title: "Couples Counseling",
    subtitle: "For you alone or with a partner",
    emoji: "💑",
    color: "bg-sky-50 border-sky-200 hover:border-sky-400",
    accent: "text-sky-600",
  },
  {
    id: "children",
    title: "Children & Teens",
    subtitle: "For children under 18",
    emoji: "🧒",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    accent: "text-amber-600",
  },
];

const REASONS = [
  "Depression",
  "Anxiety & Fear",
  "Psychological Stress",
  "Low Self-Esteem & Self-Confidence",
  "I want to improve my mental health but don't know where to start",
  "Searching for meaning and purpose in life",
  "I was referred to therapy",
  "I experienced a specific trauma",
  "Relationship & social difficulties",
  "Addiction",
  "Sexual concerns",
  "Gender identity issues",
  "Borderline Personality Disorder",
  "Sexual harassment / assault",
  "Other",
];

const SYMPTOMS = [
  "Sleep problems",
  "Repeated nervousness & emotional outbursts",
  "Crying continuously",
  "Persistent sadness & low mood",
  "Desire for isolation",
  "Appetite changes (eating more or less than usual)",
  "Chronic fatigue & exhaustion",
  "Loss of enjoyment in anything",
  "Substance or alcohol dependence",
  "Social relationship difficulties",
  "None of the above",
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Saudi Arabia",
  "United Arab Emirates", "Jordan", "Egypt", "Qatar", "Kuwait", "Bahrain", "Oman", "Lebanon",
  "Morocco", "Tunisia", "Algeria", "Libya", "Sudan", "Syria", "Iraq", "Palestine", "Yemen",
  "Turkey", "India", "Pakistan", "Indonesia", "Malaysia", "Singapore", "Nigeria", "South Africa",
  "Brazil", "Mexico", "Argentina", "Spain", "Italy", "Netherlands", "Sweden", "Norway",
  "Denmark", "Switzerland", "Austria", "Belgium", "Portugal", "Poland", "Russia", "Japan",
  "South Korea", "China", "Other",
];

const HOW_HEARD = [
  "Facebook",
  "Instagram",
  "An influencer",
  "A friend or family member",
  "YouTube",
  "Google search",
  "Public posters / ads",
  "My institution / employer",
  "Other",
];

type Answers = {
  serviceType: string;
  reasons: string[];
  symptoms: string[];
  previousTherapy: string;
  age: string;
  gender: string;
  nationality: string;
  preferredTherapistGender: string;
  religious: string;
  familyHistory: string;
  currentMedication: string;
  sessionFormat: string;
  contactMethod: string;
  howHeard: string;
};

const initial: Answers = {
  serviceType: "",
  reasons: [],
  symptoms: [],
  previousTherapy: "",
  age: "",
  gender: "",
  nationality: "",
  preferredTherapistGender: "",
  religious: "",
  familyHistory: "",
  currentMedication: "",
  sessionFormat: "",
  contactMethod: "",
  howHeard: "",
};

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full bg-muted/60 rounded-full h-1.5 mb-8">
      <motion.div
        className="h-1.5 rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}

function StepLabel({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium text-muted-foreground tracking-wide">
        {step} / {TOTAL_STEPS}
      </span>
    </div>
  );
}

function MultiSelectGrid({
  options,
  selected,
  onChange,
  columns = 1,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  columns?: number;
}) {
  const toggle = (opt: string) => {
    if (opt === "None of the above") {
      onChange(selected.includes(opt) ? [] : [opt]);
      return;
    }
    const filtered = selected.filter((s) => s !== "None of the above");
    if (filtered.includes(opt)) {
      onChange(filtered.filter((s) => s !== opt));
    } else {
      onChange([...filtered, opt]);
    }
  };

  return (
    <div className={`grid gap-2.5 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${
              active
                ? "border-primary bg-primary/8 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span
              className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                active ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}
            >
              {active && <Check className="w-3 h-3 text-white" />}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SingleSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-sm flex items-center justify-between text-foreground hover:border-primary/40 transition-colors"
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {value || "Search for your country..."}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm bg-muted/40 rounded-lg outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                className={`w-full px-4 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors ${
                  value === c ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function Intake() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preType = params.get("type") || "";

  const [step, setStep] = useState(preType ? 2 : 1);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Answers>({ ...initial, serviceType: preType });

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setAnswers((a) => ({ ...a, [k]: v }));

  const canNext = () => {
    switch (step) {
      case 1: return !!answers.serviceType;
      case 2: return answers.reasons.length > 0;
      case 3: return answers.symptoms.length > 0;
      case 4: return !!answers.previousTherapy;
      case 5: return !!answers.age && Number(answers.age) > 0;
      case 6: return !!answers.gender;
      case 7: return !!answers.nationality;
      case 8: return !!answers.preferredTherapistGender;
      case 9: return !!answers.religious;
      case 10: return !!answers.familyHistory;
      case 11: return !!answers.currentMedication;
      case 12: return !!answers.sessionFormat;
      case 13: return !!answers.contactMethod;
      case 14: return !!answers.howHeard;
      default: return false;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS) { setDir(1); setStep((s) => s + 1); }
    else finish();
  };
  const back = () => { setDir(-1); setStep((s) => s - 1); };

  const finish = () => {
    const q = new URLSearchParams();
    if (answers.preferredTherapistGender && answers.preferredTherapistGender !== "Doesn't matter") {
      q.set("gender", answers.preferredTherapistGender);
    }
    setLocation(`/providers?${q.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(188,73%,8%)] to-[hsl(188,60%,14%)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        {step > 1 ? (
          <button onClick={back} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setLocation("/")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        <span className="text-white/50 text-xs font-medium">Find the right therapist for you</span>
        <div className="w-9" />
      </div>

      {/* Main card */}
      <div className="flex-1 flex flex-col px-4 pb-8">
        <div className="max-w-lg w-full mx-auto flex-1 flex flex-col">
          <StepLabel step={step} />
          <ProgressBar step={step} />

          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full flex flex-col"
              >
                {step === 1 && (
                  <StepServiceType value={answers.serviceType} onChange={(v) => { set("serviceType", v); setDir(1); setTimeout(() => setStep(2), 200); }} />
                )}
                {step === 2 && (
                  <StepMulti
                    title="What brings you here?"
                    options={REASONS}
                    selected={answers.reasons}
                    onChange={(v) => set("reasons", v)}
                  />
                )}
                {step === 3 && (
                  <StepMulti
                    title="Are you currently experiencing any of these symptoms repeatedly?"
                    options={SYMPTOMS}
                    selected={answers.symptoms}
                    onChange={(v) => set("symptoms", v)}
                  />
                )}
                {step === 4 && (
                  <StepSingle
                    title="Have you received therapy before?"
                    options={["Yes", "No"]}
                    value={answers.previousTherapy}
                    onChange={(v) => set("previousTherapy", v)}
                  />
                )}
                {step === 5 && (
                  <StepAge value={answers.age} onChange={(v) => set("age", v)} />
                )}
                {step === 6 && (
                  <StepSingle
                    title="What is your gender?"
                    options={["Male", "Female", "Prefer not to say"]}
                    value={answers.gender}
                    onChange={(v) => set("gender", v)}
                  />
                )}
                {step === 7 && (
                  <StepCountry value={answers.nationality} onChange={(v) => set("nationality", v)} />
                )}
                {step === 8 && (
                  <StepSingle
                    title="Do you have a preferred gender for your therapist?"
                    options={["Doesn't matter", "Male", "Female"]}
                    value={answers.preferredTherapistGender}
                    onChange={(v) => set("preferredTherapistGender", v)}
                  />
                )}
                {step === 9 && (
                  <StepSingleWithNote
                    title="Do you consider yourself religious?"
                    options={["Yes", "No", "Prefer not to say"]}
                    value={answers.religious}
                    onChange={(v) => set("religious", v)}
                    note="We ask this to help match you with a therapist who understands your background and values."
                  />
                )}
                {step === 10 && (
                  <StepSingle
                    title="Is there a family history of any mental health conditions?"
                    options={["Yes", "No"]}
                    value={answers.familyHistory}
                    onChange={(v) => set("familyHistory", v)}
                  />
                )}
                {step === 11 && (
                  <StepSingleWithNote
                    title="Are you currently taking any psychiatric medication?"
                    options={["Yes", "No", "Prefer not to say"]}
                    value={answers.currentMedication}
                    onChange={(v) => set("currentMedication", v)}
                    note="This helps us ensure your therapist can coordinate care effectively."
                  />
                )}
                {step === 12 && (
                  <StepSingle
                    title="What session format do you prefer?"
                    options={["Video call", "Phone call", "Text messaging"]}
                    value={answers.sessionFormat}
                    onChange={(v) => set("sessionFormat", v)}
                  />
                )}
                {step === 13 && (
                  <StepSingle
                    title="How would you prefer our team to contact you?"
                    options={["WhatsApp", "Email"]}
                    value={answers.contactMethod}
                    onChange={(v) => set("contactMethod", v)}
                  />
                )}
                {step === 14 && (
                  <StepSingle
                    title="How did you hear about MindBridge?"
                    options={HOW_HEARD}
                    value={answers.howHeard}
                    onChange={(v) => set("howHeard", v)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {step > 1 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={next}
              disabled={!canNext()}
              className={`mt-4 w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                canNext()
                  ? "bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              {step === TOTAL_STEPS ? "Find my therapist" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepServiceType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-white font-serif text-2xl font-bold mb-2 leading-snug">
        Talk to a therapist online,<br />anytime, anywhere
      </h2>
      <p className="text-white/60 text-sm mb-6">Choose the type of therapy you're looking for</p>
      <div className="flex flex-col gap-3">
        {SERVICE_TYPES.map((svc) => (
          <button
            key={svc.id}
            onClick={() => onChange(svc.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
              value === svc.id
                ? "border-white bg-white shadow-lg"
                : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40"
            }`}
          >
            <span className="text-3xl">{svc.emoji}</span>
            <div>
              <div className={`font-semibold text-base ${value === svc.id ? "text-foreground" : "text-white"}`}>
                {svc.title}
              </div>
              <div className={`text-xs mt-0.5 ${value === svc.id ? "text-muted-foreground" : "text-white/50"}`}>
                {svc.subtitle}
              </div>
            </div>
            {value === svc.id && (
              <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepMulti({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (opt === "None of the above") {
      onChange(selected.includes(opt) ? [] : [opt]);
      return;
    }
    const filtered = selected.filter((s) => s !== "None of the above");
    if (filtered.includes(opt)) onChange(filtered.filter((s) => s !== opt));
    else onChange([...filtered, opt]);
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-white font-serif text-xl font-bold mb-5 leading-snug">{title}</h2>
      <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${
                active
                  ? "border-white/60 bg-white text-foreground"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
              }`}
            >
              <span
                className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                  active ? "border-primary bg-primary" : "border-white/30"
                }`}
              >
                {active && <Check className="w-3 h-3 text-white" />}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSingle({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-white font-serif text-xl font-bold mb-5 leading-snug">{title}</h2>
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
              value === opt
                ? "border-white bg-white text-foreground"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSingleWithNote({
  title,
  options,
  value,
  onChange,
  note,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  note: string;
}) {
  return (
    <div>
      <h2 className="text-white font-serif text-xl font-bold mb-5 leading-snug">{title}</h2>
      <div className="flex flex-col gap-2.5 mb-4">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
              value === opt
                ? "border-white bg-white text-foreground"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 p-3.5 rounded-xl bg-primary/20 border border-primary/30">
        <span className="text-primary mt-0.5 flex-shrink-0">ℹ️</span>
        <p className="text-white/70 text-xs leading-relaxed">{note}</p>
      </div>
    </div>
  );
}

function StepAge({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-white font-serif text-xl font-bold mb-2 leading-snug">What is your age?</h2>
      <p className="text-white/50 text-sm mb-6">This helps us match you with the right specialist.</p>
      <input
        type="number"
        min={5}
        max={120}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your age"
        className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-medium placeholder:text-white/30 outline-none focus:border-white/60 transition-colors"
      />
    </div>
  );
}

function StepCountry({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-white font-serif text-xl font-bold mb-5 leading-snug">What is your nationality?</h2>
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/30 mb-1">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search here..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          />
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        {value && !open && (
          <div className="px-4 py-2 text-white text-sm font-medium">{value}</div>
        )}
        {open && (
          <div className="max-h-52 overflow-y-auto rounded-xl bg-white/10 border border-white/20 mt-1">
            {filtered.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                className={`w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors ${
                  value === c ? "font-semibold text-white" : "text-white/80"
                }`}
              >
                {c}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-white/40">No results found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

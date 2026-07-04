import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, X, Leaf, Sparkles } from "lucide-react";
import { useCountry } from "@/context/CountryContext";
import { COUNTRY_LIST, type CountryPricing } from "@/lib/pricing";

const SERVICE_TYPES = [
  { id: "individual", title: "Individual Therapy", subtitle: "Personal sessions for adults 18+", emoji: "🌱", color: "border-emerald-300 hover:border-emerald-500", selected: "border-emerald-500 bg-emerald-50" },
  { id: "couples", title: "Couples Counseling", subtitle: "Together or alone — your pace", emoji: "🌿", color: "border-sky-300 hover:border-sky-500", selected: "border-sky-500 bg-sky-50" },
  { id: "children", title: "Children & Teens", subtitle: "Specialised support under 18", emoji: "🦋", color: "border-amber-300 hover:border-amber-500", selected: "border-amber-500 bg-amber-50" },
  { id: "psychiatric", title: "Psychiatric Consultation", subtitle: "Diagnosis, medication & management", emoji: "🧬", color: "border-violet-300 hover:border-violet-500", selected: "border-violet-500 bg-violet-50" },
];

const REASONS = [
  { id: "depression", label: "Depression", emoji: "🌧️" },
  { id: "anxiety", label: "Anxiety & Fear", emoji: "💭" },
  { id: "stress", label: "Psychological Stress", emoji: "⚡" },
  { id: "self_esteem", label: "Low Self-Esteem", emoji: "🪞" },
  { id: "explore", label: "I want to improve my mental health", emoji: "🌱" },
  { id: "meaning", label: "Searching for meaning & purpose", emoji: "🔍" },
  { id: "referred", label: "I was referred to therapy", emoji: "📋" },
  { id: "trauma", label: "Trauma & Past experiences", emoji: "💔" },
  { id: "relationships", label: "Relationship difficulties", emoji: "🤝" },
  { id: "addiction", label: "Addiction & substance use", emoji: "🔗" },
  { id: "sexual", label: "Sexual or intimacy concerns", emoji: "🌸" },
  { id: "identity", label: "Gender or identity questions", emoji: "🏳️‍🌈" },
  { id: "grief", label: "Grief & loss", emoji: "🕊️" },
  { id: "other", label: "Something else", emoji: "✨" },
];

const SYMPTOM_MAP: Record<string, string[]> = {
  depression: ["Persistent sadness & low mood", "Loss of enjoyment in anything", "Chronic fatigue & exhaustion", "Crying continuously", "Desire for isolation", "Appetite changes"],
  anxiety: ["Repeated nervousness & emotional outbursts", "Sleep problems", "Racing thoughts"],
  stress: ["Chronic fatigue & exhaustion", "Sleep problems", "Repeated nervousness & emotional outbursts", "Irritability"],
  trauma: ["Sleep problems", "Repeated nervousness & emotional outbursts", "Flashbacks or intrusive thoughts", "Desire for isolation"],
  addiction: ["Substance or alcohol dependence", "Chronic fatigue & exhaustion"],
  relationships: ["Social relationship difficulties", "Desire for isolation"],
  grief: ["Persistent sadness & low mood", "Loss of enjoyment in anything", "Desire for isolation"],
};

const ALL_SYMPTOMS = [
  "Sleep problems", "Repeated nervousness & emotional outbursts", "Crying continuously",
  "Persistent sadness & low mood", "Desire for isolation", "Appetite changes",
  "Chronic fatigue & exhaustion", "Loss of enjoyment in anything", "Substance or alcohol dependence",
  "Social relationship difficulties", "Racing thoughts", "Flashbacks or intrusive thoughts",
  "Irritability", "Difficulty concentrating", "None of the above",
];

const HOW_HEARD = [
  { id: "facebook", label: "Facebook", emoji: "👤" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "influencer", label: "A creator I follow", emoji: "🎯" },
  { id: "friend", label: "Friend or family", emoji: "💙" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
  { id: "google", label: "Google search", emoji: "🔍" },
  { id: "employer", label: "My institution / employer", emoji: "🏢" },
  { id: "other", label: "Other", emoji: "✨" },
];

type Answers = {
  serviceType: string;
  reasons: string[];
  symptoms: string[];
  previousTherapy: string;
  age: string;
  gender: string;
  country: string;
  preferredTherapistGender: string;
  religious: string;
  sessionFormat: string;
  contactMethod: string;
  contactDetail: string;
  howHeard: string;
};

const initial: Answers = {
  serviceType: "", reasons: [], symptoms: [], previousTherapy: "",
  age: "", gender: "", country: "", preferredTherapistGender: "",
  religious: "", sessionFormat: "", contactMethod: "", contactDetail: "", howHeard: "",
};

function getAutoSymptoms(reasons: string[]): string[] {
  const auto = new Set<string>();
  reasons.forEach((r) => { (SYMPTOM_MAP[r] ?? []).forEach((s) => auto.add(s)); });
  return [...auto];
}

function buildSteps(a: Answers): string[] {
  const steps = ["serviceType", "reasons", "symptoms", "previousTherapy", "age", "gender", "country", "preferredTherapistGender", "religious", "sessionFormat", "contactMethod"];
  if (a.contactMethod === "WhatsApp" || a.contactMethod === "Phone call") steps.push("contactDetail");
  if (a.contactMethod === "Email") steps.push("contactEmail");
  steps.push("howHeard");
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

function MultiChip({ options, selected, onChange, autoSelected = [] }: {
  options: { id?: string; label: string; emoji?: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  autoSelected?: string[];
}) {
  const toggle = (id: string) => {
    if (id === "None of the above" || id === "none") {
      onChange(selected.includes(id) ? [] : [id]);
      return;
    }
    const filtered = selected.filter((s) => s !== "None of the above" && s !== "none");
    if (filtered.includes(id)) onChange(filtered.filter((s) => s !== id));
    else onChange([...filtered, id]);
  };
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map((opt) => {
        const id = opt.id ?? opt.label;
        const active = selected.includes(id);
        const auto = autoSelected.includes(id);
        return (
          <button key={id} onClick={() => toggle(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${
              active ? "border-white/60 bg-white text-[hsl(158,55%,18%)]" :
              auto ? "border-white/40 bg-white/15 text-white" :
              "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
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
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const id = opt.id ?? opt.label;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left flex items-center gap-3 ${
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
        <span className={value ? "text-white" : "text-white/40"}>
          {selected ? `${selected.flag} ${selected.name}` : "Select your country..."}
        </span>
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

export default function Intake() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preType = params.get("type") || "";
  const { setCountry } = useCountry();

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
      const auto = getAutoSymptoms(answers.reasons);
      set("symptoms", auto);
    }
  }, [stepIdx]);

  const canNext = (): boolean => {
    switch (currentStep) {
      case "serviceType": return !!answers.serviceType;
      case "reasons": return answers.reasons.length > 0;
      case "symptoms": return answers.symptoms.length > 0;
      case "previousTherapy": return !!answers.previousTherapy;
      case "age": return !!answers.age && Number(answers.age) >= 5 && Number(answers.age) <= 100;
      case "gender": return !!answers.gender;
      case "country": return !!answers.country;
      case "preferredTherapistGender": return !!answers.preferredTherapistGender;
      case "religious": return !!answers.religious;
      case "sessionFormat": return !!answers.sessionFormat;
      case "contactMethod": return !!answers.contactMethod;
      case "contactDetail": return answers.contactDetail.length >= 7;
      case "contactEmail": return true;
      case "howHeard": return !!answers.howHeard;
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
    if (answers.preferredTherapistGender && answers.preferredTherapistGender !== "Doesn't matter") {
      q.set("gender", answers.preferredTherapistGender);
    }
    const mainReason = answers.reasons[0];
    const specialtyMap: Record<string, string> = {
      depression: "Depression", anxiety: "Anxiety & Stress", trauma: "PTSD & Trauma",
      addiction: "Addiction & Recovery", grief: "Grief & Loss",
    };
    if (mainReason && specialtyMap[mainReason]) q.set("specialty", specialtyMap[mainReason]);
    navigate(`/providers?${q.toString()}`);
  };

  const autoSymptoms = getAutoSymptoms(answers.reasons);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(158,55%,10%)] via-[hsl(158,48%,16%)] to-[hsl(165,42%,20%)] flex flex-col">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[hsl(158,60%,30%)] opacity-10 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[hsl(200,60%,50%)] opacity-8 blur-3xl" />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full bg-[hsl(38,85%,60%)] opacity-5 blur-3xl" />
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

      {/* Card */}
      <div className="relative flex-1 flex flex-col px-4 pb-8">
        <div className="max-w-lg w-full mx-auto flex-1 flex flex-col">
          <ProgressBar pct={pct} />

          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={currentStep} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto pr-0.5 space-y-1">
                  {currentStep === "serviceType" && <StepServiceType value={answers.serviceType} onChange={(v) => { set("serviceType", v); setDir(1); setTimeout(() => setStepIdx(1), 180); }} />}
                  {currentStep === "reasons" && (
                    <StepSection title="What brings you here?" subtitle="Choose all that apply — we'll tailor your match.">
                      <MultiChip options={REASONS} selected={answers.reasons} onChange={(v) => set("reasons", v)} />
                    </StepSection>
                  )}
                  {currentStep === "symptoms" && (
                    <StepSection title="Any of these feel familiar?" subtitle={answers.reasons.length > 0 ? "We've pre-selected based on what you shared. Remove or add as needed." : "Select all that apply."}>
                      <MultiChip
                        options={ALL_SYMPTOMS.map((s) => ({ label: s }))}
                        selected={answers.symptoms}
                        onChange={(v) => set("symptoms", v)}
                        autoSelected={autoSymptoms}
                      />
                    </StepSection>
                  )}
                  {currentStep === "previousTherapy" && (
                    <StepSection title="Have you been in therapy before?">
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
                    <StepSection title="How old are you?" subtitle="Helps us match you with a provider experienced with your age group.">
                      <AgeInput value={answers.age} onChange={(v) => set("age", v)} />
                    </StepSection>
                  )}
                  {currentStep === "gender" && (
                    <StepSection title="How do you identify?">
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
                    <StepSection title="Where are you based?" subtitle="We'll match providers in your region and show prices in your local currency.">
                      <CountryDropdown value={answers.country} onChange={(code, c) => { set("country", code); setCountry(c); }} />
                      {answers.country && (() => {
                        const c = COUNTRY_LIST.find((x) => x.code === answers.country);
                        return c ? (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-xs text-white/60 leading-relaxed">
                            <span className="text-white/80 font-medium">{c.flag} {c.name}</span> · Sessions priced in {c.symbol} {c.currency} · {c.culturalNote}
                          </motion.div>
                        ) : null;
                      })()}
                    </StepSection>
                  )}
                  {currentStep === "preferredTherapistGender" && (
                    <StepSection title="Any preference for your therapist's gender?" subtitle="All our providers are equally qualified — this is about your comfort.">
                      <SingleChoice value={answers.preferredTherapistGender} onChange={(v) => set("preferredTherapistGender", v)}
                        options={[
                          { id: "no_pref", label: "No preference", emoji: "⚖️" },
                          { id: "male", label: "Male therapist", emoji: "🧑‍⚕️" },
                          { id: "female", label: "Female therapist", emoji: "👩‍⚕️" },
                        ]} />
                    </StepSection>
                  )}
                  {currentStep === "religious" && (
                    <StepSection title="Do you consider yourself religious or spiritual?" subtitle="We ask to help find a provider who resonates with your values and background.">
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
                    <StepSection title="How would you like to meet?" subtitle="You can change this anytime.">
                      <SingleChoice value={answers.sessionFormat} onChange={(v) => set("sessionFormat", v)}
                        options={[
                          { id: "video", label: "Video call", emoji: "📹", note: "Face-to-face, wherever you are" },
                          { id: "phone", label: "Phone call", emoji: "📞", note: "Voice only — no camera needed" },
                          { id: "messaging", label: "Text messaging", emoji: "💬", note: "Async — reply at your own pace" },
                        ]} />
                    </StepSection>
                  )}
                  {currentStep === "contactMethod" && (
                    <StepSection title="How should we reach you?" subtitle="Your details are private and encrypted.">
                      <SingleChoice value={answers.contactMethod} onChange={(v) => { set("contactMethod", v); set("contactDetail", ""); }}
                        options={[
                          { id: "WhatsApp", label: "WhatsApp", emoji: "💚", note: "We'll send your match via WhatsApp" },
                          { id: "Email", label: "Email", emoji: "📧", note: "Match details sent to your inbox" },
                          { id: "Phone call", label: "Phone call", emoji: "📞", note: "Our team will call you to confirm" },
                        ]} />
                    </StepSection>
                  )}
                  {currentStep === "contactDetail" && (
                    <StepSection title={answers.contactMethod === "WhatsApp" ? "Your WhatsApp number" : "Your phone number"}
                      subtitle="We'll only use this to send your match details. No marketing.">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">+</span>
                        <input type="tel" value={answers.contactDetail} onChange={(e) => set("contactDetail", e.target.value.replace(/\D/g, ""))}
                          placeholder="Country code + number (e.g. 9627xxxxxxx)"
                          className="w-full pl-8 pr-4 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15" />
                      </div>
                      <p className="text-xs text-white/30 mt-2">Format: country code followed by number. No spaces or dashes.</p>
                    </StepSection>
                  )}
                  {currentStep === "contactEmail" && (
                    <StepSection title="Your email address" subtitle="Optional — skip if you'd prefer not to share.">
                      <input type="email" value={answers.contactDetail} onChange={(e) => set("contactDetail", e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15" />
                      <p className="text-xs text-white/30 mt-2">We'll send your therapist match and booking link here. You can skip this.</p>
                    </StepSection>
                  )}
                  {currentStep === "howHeard" && (
                    <StepSection title="One last thing — how did you find us?" subtitle="Helps us reach more people who need support.">
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
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next button (not for step 0 = serviceType) */}
          {currentStep !== "serviceType" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-2">
              <button onClick={next} disabled={!canNext()}
                className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                  canNext() ? "bg-white text-[hsl(158,55%,18%)] hover:bg-white/95 hover:-translate-y-0.5 shadow-xl" : "bg-white/10 text-white/25 cursor-not-allowed"
                }`}>
                {stepIdx === totalSteps - 1 ? (
                  <><Sparkles className="w-4 h-4" /> Find my therapist</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
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

function StepServiceType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="w-5 h-5 text-white/60" />
        <span className="text-white/50 text-sm">Your journey starts here</span>
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-1.5 leading-snug">What kind of support<br />are you looking for?</h2>
      <p className="text-white/50 text-sm mb-6">Choose what feels right — you can always adjust later.</p>
      <div className="flex flex-col gap-3">
        {SERVICE_TYPES.map((svc) => (
          <button key={svc.id} onClick={() => onChange(svc.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
              value === svc.id ? "border-white/80 bg-white shadow-lg" : "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30"
            }`}>
            <span className="text-3xl">{svc.emoji}</span>
            <div className="flex-1">
              <div className={`font-semibold text-base ${value === svc.id ? "text-[hsl(158,55%,18%)]" : "text-white"}`}>{svc.title}</div>
              <div className={`text-xs mt-0.5 ${value === svc.id ? "text-[hsl(158,30%,40%)]" : "text-white/45"}`}>{svc.subtitle}</div>
            </div>
            {value === svc.id && (
              <div className="w-6 h-6 rounded-full bg-[hsl(158,55%,26%)] flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="text-center py-4">
      <input type="number" min={5} max={100} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="text-center text-6xl font-bold w-full bg-transparent text-white border-b-2 border-white/20 focus:border-white/50 outline-none pb-3 placeholder:text-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <p className="text-white/40 text-sm mt-4">years old</p>
    </div>
  );
}

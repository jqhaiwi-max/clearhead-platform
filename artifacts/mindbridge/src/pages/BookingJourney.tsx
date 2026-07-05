import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, X, Star, Clock, Calendar,
  ChevronLeft, ChevronRight, User, Mail, Tag, MessageCircle,
  Copy, Shield, CheckCircle, Search, AlertCircle, Leaf, Sparkles,
} from "lucide-react";
import { useListProviders } from "@workspace/api-client-react";
import {
  COUNTRY_LIST, SESSION_DURATIONS, getSessionPrice,
  PROMO_CODES, formatPrice, type CountryPricing,
} from "@/lib/pricing";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/* ─── Services ─────────────────────────────────────────────── */
const SERVICES = [
  { id: "individual",  label: "Individual Therapy",        sub: "Personal sessions for adults 18+",        emoji: "🌱", color: "emerald" },
  { id: "couples",     label: "Couples Counselling",       sub: "Together or alone — your pace",           emoji: "🌿", color: "teal"    },
  { id: "children",   label: "Children & Teens",           sub: "Specialised support under 18",            emoji: "🦋", color: "violet"  },
  { id: "psychiatric", label: "Psychiatric Consultation",  sub: "Diagnosis, medication & management",      emoji: "🧬", color: "blue"    },
];

/* ─── Conditions per service ────────────────────────────────── */
const CONDITIONS_BY_SERVICE: Record<string, { id: string; label: string; emoji: string }[]> = {
  individual: [
    { id: "anxiety",      label: "Anxiety & Panic Attacks", emoji: "💭" },
    { id: "depression",   label: "Depression",              emoji: "🌧️" },
    { id: "trauma",       label: "PTSD & Trauma",           emoji: "💔" },
    { id: "ocd",          label: "OCD",                     emoji: "🔄" },
    { id: "adhd",         label: "ADHD",                    emoji: "⚡" },
    { id: "bipolar",      label: "Bipolar Disorder",        emoji: "🌊" },
    { id: "grief",        label: "Grief & Loss",            emoji: "🕊️" },
    { id: "stress",       label: "Stress & Burnout",        emoji: "🔥" },
    { id: "sleep",        label: "Sleep Problems",          emoji: "😴" },
    { id: "eating",       label: "Eating Disorders",        emoji: "🍃" },
    { id: "addiction",    label: "Addiction",               emoji: "🔗" },
    { id: "self_esteem",  label: "Self-Esteem",             emoji: "🪞" },
    { id: "life",         label: "Life Transitions",        emoji: "🦋" },
    { id: "identity",     label: "Identity & Purpose",      emoji: "🌈" },
    { id: "general",      label: "General Wellness",        emoji: "🌱" },
    { id: "other",        label: "Something else",          emoji: "✨" },
  ],
  couples: [
    { id: "communication",   label: "Communication breakdown",      emoji: "💬" },
    { id: "conflict",        label: "Recurring conflict",           emoji: "⚡" },
    { id: "trust",           label: "Trust & infidelity",           emoji: "💔" },
    { id: "intimacy",        label: "Intimacy & connection",        emoji: "❤️" },
    { id: "parenting",       label: "Parenting disagreements",      emoji: "👨‍👩‍👧" },
    { id: "finances",        label: "Financial stress",             emoji: "💸" },
    { id: "separation",      label: "Separation or divorce",        emoji: "🔓" },
    { id: "blended",         label: "Blended family issues",        emoji: "🏡" },
    { id: "cultural",        label: "Cultural differences",         emoji: "🌍" },
    { id: "premarital",      label: "Pre-marital counselling",      emoji: "💍" },
    { id: "grief_shared",    label: "Shared grief or loss",         emoji: "🕊️" },
    { id: "sexual",          label: "Sexual health & intimacy",     emoji: "🌸" },
    { id: "long_distance",   label: "Long distance relationship",   emoji: "✈️" },
    { id: "other",           label: "Something else",               emoji: "✨" },
  ],
  children: [
    { id: "school_anxiety",  label: "School anxiety & refusal",     emoji: "🏫" },
    { id: "adhd_child",      label: "ADHD & attention difficulties", emoji: "⚡" },
    { id: "autism",          label: "Autism spectrum support",      emoji: "🧩" },
    { id: "bullying",        label: "Bullying & social exclusion",  emoji: "🛡️" },
    { id: "learning",        label: "Learning difficulties",        emoji: "📚" },
    { id: "emotional_reg",   label: "Emotional regulation",         emoji: "🌊" },
    { id: "depression_teen", label: "Teen depression & low mood",   emoji: "🌧️" },
    { id: "anxiety_child",   label: "Anxiety & phobias",            emoji: "💭" },
    { id: "trauma_child",    label: "Trauma & abuse",               emoji: "💔" },
    { id: "family_change",   label: "Family changes (divorce etc.)", emoji: "🏡" },
    { id: "self_harm",       label: "Self-harm & safety concerns",  emoji: "🆘" },
    { id: "eating_teen",     label: "Eating & body image",          emoji: "🍃" },
    { id: "identity_teen",   label: "Identity & sexuality",         emoji: "🌈" },
    { id: "social",          label: "Social skills & friendships",  emoji: "🤝" },
    { id: "other",           label: "Something else",               emoji: "✨" },
  ],
  psychiatric: [
    { id: "depression_dx",   label: "Depression",                   emoji: "🌧️" },
    { id: "anxiety_dx",      label: "Anxiety disorders",            emoji: "💭" },
    { id: "bipolar_dx",      label: "Bipolar disorder",             emoji: "🌊" },
    { id: "schizophrenia",   label: "Schizophrenia & psychosis",    emoji: "🔮" },
    { id: "ocd_dx",          label: "OCD",                          emoji: "🔄" },
    { id: "ptsd_dx",         label: "PTSD & trauma",                emoji: "💔" },
    { id: "adhd_dx",         label: "ADHD (diagnosis & medication)", emoji: "⚡" },
    { id: "eating_dx",       label: "Eating disorders",             emoji: "🍃" },
    { id: "personality",     label: "Personality disorders",        emoji: "🎭" },
    { id: "insomnia_dx",     label: "Chronic insomnia",             emoji: "😴" },
    { id: "addiction_dx",    label: "Addiction & substance use",    emoji: "🔗" },
    { id: "second_opinion",  label: "Second opinion / review",      emoji: "🔍" },
    { id: "medication",      label: "Medication management",        emoji: "💊" },
    { id: "other",           label: "Something else",               emoji: "✨" },
  ],
};

/* ─── Condition → specialty keyword mapping for provider matching ─ */
const CONDITION_KEYWORDS: Record<string, string[]> = {
  anxiety: ["anxiety","cbt","cognitive"],
  anxiety_dx: ["anxiety","psychiatr","cbt"],
  depression: ["depression","mood","cbt"],
  depression_dx: ["depression","psychiatr","mood"],
  trauma: ["trauma","ptsd","emdr"],
  ptsd_dx: ["trauma","ptsd","emdr"],
  ocd: ["ocd","anxiety","cbt"],
  ocd_dx: ["ocd","psychiatr"],
  adhd: ["adhd","attention","neurodevelopment"],
  adhd_child: ["adhd","child","neurodevelopment"],
  adhd_dx: ["adhd","psychiatr"],
  bipolar: ["bipolar","mood","psychiatr"],
  bipolar_dx: ["bipolar","psychiatr"],
  schizophrenia: ["psychiatr","psychosis","schizophrenia"],
  eating: ["eating","nutrition"],
  eating_teen: ["eating","adolescent","child"],
  eating_dx: ["eating","psychiatr"],
  addiction: ["addiction","substance"],
  addiction_dx: ["addiction","psychiatr"],
  sleep: ["sleep","insomnia","cbt"],
  insomnia_dx: ["sleep","insomnia","psychiatr"],
  grief: ["grief","bereavement"],
  grief_shared: ["grief","couples","bereavement"],
  stress: ["stress","burnout","anxiety"],
  relationships: ["couples","relationship","family"],
  communication: ["couples","relationship","communication"],
  conflict: ["couples","conflict","family"],
  trust: ["couples","relationship","trauma"],
  intimacy: ["couples","sex","intimacy"],
  parenting: ["family","couples","parenting"],
  premarital: ["couples","premarital","relationship"],
  separation: ["couples","divorce","family"],
  blended: ["family","couples","blended"],
  school_anxiety: ["child","adolescent","anxiety","school"],
  bullying: ["child","adolescent","social"],
  learning: ["child","adhd","learning"],
  emotional_reg: ["child","adolescent","dbt"],
  depression_teen: ["child","adolescent","depression"],
  anxiety_child: ["child","adolescent","anxiety"],
  trauma_child: ["child","adolescent","trauma"],
  family_change: ["child","family","divorce"],
  self_harm: ["child","adolescent","dbt","self"],
  social: ["child","adolescent","social","autism"],
  autism: ["autism","neurodevelopment","child"],
  identity: ["identity","lgbtq","existential"],
  identity_teen: ["child","adolescent","identity","lgbtq"],
  life: ["existential","life","transition"],
  self_esteem: ["self","confidence","cbt"],
  general: ["wellness","mindfulness","therapy"],
  other: [],
};

/* ─── Specialty filter by service type ───────────────────────── */
const SPECIALTY_FILTER: Record<string, string> = {
  couples: "Couples",
  children: "Child",
  psychiatric: "Psychiatr",
};

const STEPS = [
  { id: "service",  label: "Service",  icon: "🎯" },
  { id: "focus",    label: "Focus",    icon: "💡" },
  { id: "country",  label: "Country",  icon: "🌍" },
  { id: "provider", label: "Provider", icon: "👤" },
  { id: "duration", label: "Duration", icon: "⏱️" },
  { id: "date",     label: "Date",     icon: "📅" },
  { id: "time",     label: "Time",     icon: "🕐" },
  { id: "details",  label: "Details",  icon: "✏️" },
  { id: "review",   label: "Review",   icon: "✅" },
];

type Provider = {
  id: number; name: string; title: string; specialty: string;
  bio: string; rating: number; reviewCount: number; yearsExperience: number;
  imageUrl: string; available: boolean; sessionPrice: number;
  languages?: string[] | null; acceptsInsurance: boolean; nextAvailable?: string | null;
};

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TIME_SLOTS  = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","19:00",
];

/* ─── Calendar component ─────────────────────────────────────── */
function CalendarGrid({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());
  const firstDay    = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm+1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2,"0");
  const toVal = (d: number) => `${vy}-${pad(vm+1)}-${pad(d)}`;
  const maxDate = new Date(today); maxDate.setDate(today.getDate()+60);
  const isPast  = (d: number) => new Date(vy,vm,d) < today;
  const isFar   = (d: number) => new Date(vy,vm,d) > maxDate;
  const isToday = (d: number) => new Date(vy,vm,d).getTime() === today.getTime();
  const prev = () => { if (vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); };
  const next = () => { if (vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="font-semibold text-sm">{MONTH_NAMES[vm]} {vy}</span>
        <button onClick={next} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({length: firstDay}, (_,i) => <div key={`e${i}`}/>)}
        {Array.from({length: daysInMonth}, (_,i) => {
          const day = i+1, v = toVal(day);
          const dis = isPast(day)||isFar(day), sel = v===selected, tod = isToday(day);
          return (
            <button key={day} disabled={dis} onClick={() => !dis && onSelect(v)}
              className={`mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${sel ? "bg-primary text-white shadow-md" : ""}
                ${!sel && tod ? "border-2 border-primary text-primary" : ""}
                ${!sel && !dis && !tod ? "hover:bg-primary/10 text-foreground" : ""}
                ${dis ? "text-muted-foreground/30 cursor-not-allowed" : ""}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
async function fetchSlots(pid: number, date: string): Promise<string[]> {
  try {
    const r = await fetch(`${BASE}/api/appointments/slots?providerId=${pid}&date=${date}`);
    return r.ok ? (await r.json()).bookedSlots ?? [] : [];
  } catch { return []; }
}

async function bookAppointment(body: object) {
  const r = await fetch(`${BASE}/api/appointments`, {
    method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Booking failed"); }
  return r.json();
}

function formatDateLong(str: string) {
  if (!str) return "";
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
}

function scoreProvider(p: Provider, conditions: string[]): number {
  if (conditions.length === 0) return 0;
  const specLower = (p.specialty + " " + p.title + " " + p.bio).toLowerCase();
  let score = 0;
  for (const cid of conditions) {
    const keywords = CONDITION_KEYWORDS[cid] ?? [];
    for (const kw of keywords) {
      if (specLower.includes(kw)) score++;
    }
  }
  return score;
}

/* ─── Provider card (grid) ───────────────────────────────────── */
function ProviderCard({
  p, selected, onSelect, country, isMatch,
}: {
  p: Provider; selected: boolean; onSelect: () => void;
  country: CountryPricing; isMatch: boolean;
}) {
  const px = getSessionPrice(p.sessionPrice, 60, country);
  return (
    <button onClick={onSelect}
      className={`relative flex flex-col rounded-2xl border-2 text-left overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg
        ${selected ? "border-primary shadow-lg shadow-primary/10" : "border-border bg-white hover:border-primary/40"}`}>
      {/* Photo */}
      <div className="relative">
        <img src={p.imageUrl} alt={p.name}
          className="w-full h-36 object-cover object-top bg-muted"/>
        {isMatch && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold shadow">
            <Sparkles className="w-2.5 h-2.5"/> Best match
          </div>
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Check className="w-3.5 h-3.5 text-white"/>
          </div>
        )}
        {p.acceptsInsurance && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px] font-semibold">
            Insurance
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`flex-1 flex flex-col p-3 ${selected ? "bg-primary/5" : "bg-white"}`}>
        <div className={`font-semibold text-sm leading-tight ${selected ? "text-primary" : "text-foreground"}`}>{p.name}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 mb-2 leading-tight line-clamp-1">{p.title}</div>

        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>
          <span className="text-xs font-semibold">{p.rating}</span>
          <span className="text-[10px] text-muted-foreground">({p.reviewCount})</span>
          <span className="text-muted-foreground mx-0.5">·</span>
          <span className="text-[10px] text-muted-foreground">{p.yearsExperience}y</span>
        </div>

        <div className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{p.specialty}</div>

        {p.languages && p.languages.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {p.languages.slice(0,2).map(l => (
              <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{l}</span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-border/60">
          <div className={`font-bold text-sm ${selected ? "text-primary" : "text-foreground"}`}>
            {formatPrice(px.local, country)}<span className="text-[10px] font-normal text-muted-foreground">/hr</span>
          </div>
          {country.code !== "US" && (
            <div className="text-[10px] text-muted-foreground">≈ ${px.usd}</div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Step shell ─────────────────────────────────────────────── */
function StepShell({ title, subtitle, children, wide = false }: {
  title: string; subtitle: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className={wide ? "w-full" : ""}>
      <div className="mb-5">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-1.5 leading-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, className="" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${className || "text-foreground"}`}>{value}</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function BookingJourney() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const preloadProviderId = parseInt(urlParams.get("provider") || "0") || null;

  const [step, setStep]           = useState(0);
  const [dir,  setDir ]           = useState(1);
  const [service,    setService  ] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [country,    setCountry  ] = useState<CountryPricing>(COUNTRY_LIST.find(c=>c.code==="US")!);
  const [provider,   setProvider ] = useState<Provider|null>(null);
  const [duration,   setDuration ] = useState(60);
  const [date,       setDate     ] = useState("");
  const [time,       setTime     ] = useState("");
  const [name,       setName     ] = useState("");
  const [email,      setEmail    ] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo,      setPromo    ] = useState<{code:string;pct:number}|null>(null);
  const [promoErr,   setPromoErr ] = useState("");
  const [acceptTerms,setAcceptTerms] = useState(false);
  const [bookedSlots,setBookedSlots] = useState<string[]>([]);
  const [slotsLoading,setSlotsLoading] = useState(false);
  const [loading,    setLoading  ] = useState(false);
  const [bookErr,    setBookErr  ] = useState("");
  const [done,       setDone     ] = useState(false);
  const [copied,     setCopied   ] = useState(false);
  const [provSearch, setProvSearch] = useState("");
  const [countryQ,   setCountryQ ] = useState("");

  /* conditions list adapts to service */
  const conditionList = CONDITIONS_BY_SERVICE[service] ?? CONDITIONS_BY_SERVICE.individual;

  /* provider fetch — filter by specialty keyword for couples/children/psychiatric */
  const specFilter = SPECIALTY_FILTER[service] || undefined;
  const { data: allProviders = [] } = useListProviders(
    { available: true },
    { query: { staleTime: 60000 } }
  );

  /* client-side filtering + scoring */
  const providerPool = (allProviders as Provider[]).filter(p => {
    if (specFilter) {
      const specLower = p.specialty.toLowerCase();
      return specLower.includes(specFilter.toLowerCase());
    }
    return true;
  });

  const scored = providerPool
    .map(p => ({ p, score: scoreProvider(p, conditions) }))
    .filter(({ p }) => !provSearch ||
      p.name.toLowerCase().includes(provSearch.toLowerCase()) ||
      p.specialty.toLowerCase().includes(provSearch.toLowerCase())
    )
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);

  const recommended = scored.filter(x => x.score > 0);
  const others      = scored.filter(x => x.score === 0);

  /* pricing */
  const baseUSD = provider?.sessionPrice ?? 50;
  const { usd, local } = getSessionPrice(baseUSD, duration, country);
  const discAmt = promo ? Math.round(local * promo.pct) : 0;
  const total   = local - discAmt;

  /* slot fetch when date changes */
  useEffect(() => {
    if (!date || !provider) return;
    setSlotsLoading(true); setTime("");
    fetchSlots(provider.id, date).then(s => { setBookedSlots(s); setSlotsLoading(false); });
  }, [date, provider]);

  /* pre-load provider from URL param */
  useEffect(() => {
    if (!preloadProviderId || (allProviders as Provider[]).length === 0) return;
    const found = (allProviders as Provider[]).find(p => p.id === preloadProviderId);
    if (found) { setProvider(found); setService("individual"); setStep(4); }
  }, [preloadProviderId, allProviders]);

  /* reset conditions when service changes */
  useEffect(() => { setConditions([]); }, [service]);

  const go = (delta: number) => {
    const next = step + delta;
    if (next < 0 || next >= STEPS.length) return;
    setDir(delta); setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canContinue = () => {
    if (step===0) return !!service;
    if (step===1) return conditions.length > 0;
    if (step===2) return !!country;
    if (step===3) return !!provider;
    if (step===4) return !!duration;
    if (step===5) return !!date;
    if (step===6) return !!time;
    if (step===7) return name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (step===8) return acceptTerms;
    return true;
  };

  const applyPromo = () => {
    const up = promoInput.trim().toUpperCase();
    const pct = PROMO_CODES[up];
    if (pct) { setPromo({code:up,pct}); setPromoErr(""); }
    else { setPromo(null); setPromoErr("Invalid promo code"); }
  };

  const handleBook = async () => {
    if (!provider||!date||!time) return;
    setLoading(true); setBookErr("");
    try {
      const r = await bookAppointment({
        patientName: name.trim(), patientEmail: email.trim(),
        providerId: provider.id, date, time, type: "video",
        notes: promo ? `Promo: ${promo.code}` : undefined,
      });
      setDone(true);
    } catch(e:any) { setBookErr(e.message); }
    finally { setLoading(false); }
  };

  const waLink = () => {
    if (!provider) return "#";
    const msg = `I just booked a ${duration}-min session with ${provider.name} on ${formatDateLong(date)} at ${time}.\n\nBook yours at Clearhead:\nhttps://clearhead.app/get-started`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const filteredCountries = COUNTRY_LIST.filter(c =>
    !countryQ || c.name.toLowerCase().includes(countryQ.toLowerCase()) ||
    c.currency.toLowerCase().includes(countryQ.toLowerCase())
  );

  const progress  = (step / (STEPS.length - 1)) * 100;
  const isWide    = step === 3; /* provider grid needs more width */
  const maxW      = isWide ? "max-w-3xl" : "max-w-2xl";

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  /* ── Success screen ─────────────────────────────────────────── */
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex items-center justify-center px-4">
        <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.1}}
              className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-600"/>
            </motion.div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-1">You're booked!</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Confirmation sent to <span className="font-medium">{email}</span>
            </p>
            <div className="bg-muted/40 rounded-2xl p-4 text-left space-y-2 text-sm mb-6">
              <Row label="Provider" value={provider?.name ?? ""}/>
              <Row label="Date"     value={formatDateLong(date)}/>
              <Row label="Time"     value={time}/>
              <Row label="Duration" value={`${duration} min`}/>
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <span>Total paid</span>
                <span className="text-primary">{formatPrice(total, country)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <a href={waLink()} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold hover:brightness-105 transition-all shadow">
                <MessageCircle className="w-5 h-5"/> Share via WhatsApp
              </a>
              <button onClick={() => { navigator.clipboard.writeText("https://clearhead.app/get-started"); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border-2 border-border font-semibold text-foreground hover:border-primary/40 transition-all">
                {copied ? <Check className="w-4 h-4 text-emerald-600"/> : <Copy className="w-4 h-4"/>}
                {copied ? "Copied!" : "Copy Booking Link"}
              </button>
              <button onClick={() => navigate("/appointments")}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                View My Sessions
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Journey ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex flex-col">

      {/* Top bar */}
      <div className="flex-shrink-0">
        <div className="h-1 bg-border/40 relative">
          <motion.div className="absolute inset-y-0 left-0 bg-primary rounded-r-full"
            animate={{width:`${progress}%`}} transition={{duration:0.4}}/>
        </div>
        <div className={`${maxW} mx-auto px-4 py-4 flex items-center justify-between transition-all duration-300`}>
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white"/>
            </div>
            Clearhead
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">
              {STEPS[step].label}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {step+1} / {STEPS.length}
            </span>
            <div className="flex gap-1">
              {STEPS.map((_,i) => (
                <div key={i} className={`rounded-full transition-all duration-300
                  ${i===step?"w-5 h-2 bg-primary":i<step?"w-2 h-2 bg-primary/50":"w-2 h-2 bg-border"}`}/>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className={`flex-1 flex flex-col ${maxW} mx-auto w-full px-4 pb-8 transition-all duration-300`}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{duration:0.25, ease:"easeOut"}}
            className="flex-1 flex flex-col">

            <div className="flex-1 flex flex-col mt-4">

              {/* ── Step 0: Service ───────────────────────────── */}
              {step===0 && (
                <StepShell title="What kind of care are you looking for?" subtitle="Select a care type to begin — your journey is personalised from here.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map(s => (
                      <button key={s.id} onClick={() => setService(s.id)}
                        className={`group flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                          ${service===s.id ? "border-primary bg-primary/5 shadow-md" : "border-border bg-white hover:border-primary/40"}`}>
                        <span className="text-3xl">{s.emoji}</span>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${service===s.id ? "text-primary" : "text-foreground"}`}>{s.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                        </div>
                        {service===s.id && <Check className="w-5 h-5 text-primary flex-shrink-0"/>}
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {/* ── Step 1: Focus (service-specific) ─────────── */}
              {step===1 && (
                <StepShell
                  title={
                    service==="couples" ? "What's bringing you both here?" :
                    service==="children" ? "What is your child experiencing?" :
                    service==="psychiatric" ? "What would you like help with?" :
                    "What brings you here?"
                  }
                  subtitle={
                    service==="couples" ? "Select the areas you'd like to work on as a couple." :
                    service==="children" ? "Select any concerns — this helps us match the right specialist." :
                    "Select all that apply — we'll use this to match you with the right providers."
                  }>
                  <div className="flex flex-wrap gap-2">
                    {conditionList.map(c => {
                      const on = conditions.includes(c.id);
                      return (
                        <button key={c.id}
                          onClick={() => setConditions(prev => on ? prev.filter(x=>x!==c.id) : [...prev, c.id])}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all
                            ${on ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary/40 text-foreground"}`}>
                          <span>{c.emoji}</span>{c.label}
                          {on && <X className="w-3 h-3 ml-0.5 opacity-70"/>}
                        </button>
                      );
                    })}
                  </div>
                  {conditions.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-4">
                      {conditions.length} selected · These help us rank providers for you
                    </p>
                  )}
                </StepShell>
              )}

              {/* ── Step 2: Country ───────────────────────────── */}
              {step===2 && (
                <StepShell title="Where are you based?" subtitle="Pricing adapts to your local currency and legal framework.">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <input value={countryQ} onChange={e=>setCountryQ(e.target.value)} placeholder="Search country…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {filteredCountries.map(c => (
                      <button key={c.code} onClick={() => { setCountry(c); setCountryQ(""); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                          ${country.code===c.code ? "border-primary bg-primary/5" : "border-transparent bg-white hover:border-primary/30"}`}>
                        <span className="text-2xl">{c.flag}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.currency} · {c.region}</div>
                        </div>
                        {country.code===c.code && <Check className="w-4 h-4 text-primary flex-shrink-0"/>}
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {/* ── Step 3: Provider GRID ────────────────────── */}
              {step===3 && (
                <StepShell wide title="Choose your provider" subtitle={
                  recommended.length > 0
                    ? `${recommended.length} provider${recommended.length>1?"s":""} match your selected concerns — shown first.`
                    : "All licensed & verified providers available for your selection."
                }>
                  {/* Search */}
                  <div className="relative mb-5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <input value={provSearch} onChange={e=>setProvSearch(e.target.value)}
                      placeholder="Search by name or specialty…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>

                  <div className="max-h-[520px] overflow-y-auto space-y-5 pr-0.5">
                    {scored.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground text-sm">
                        No providers found. Try clearing your search.
                      </div>
                    )}

                    {/* Recommended section */}
                    {recommended.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-amber-500"/>
                          <span className="text-sm font-semibold text-foreground">Recommended for you</span>
                          <span className="text-xs text-muted-foreground">based on your selections</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {recommended.map(({p}) => (
                            <ProviderCard key={p.id} p={p} selected={provider?.id===p.id}
                              onSelect={() => setProvider(p)} country={country} isMatch/>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All other providers */}
                    {others.length > 0 && (
                      <div>
                        {recommended.length > 0 && (
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-px bg-border"/>
                            <span className="text-xs text-muted-foreground font-medium">All providers</span>
                            <div className="flex-1 h-px bg-border"/>
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {others.map(({p}) => (
                            <ProviderCard key={p.id} p={p} selected={provider?.id===p.id}
                              onSelect={() => setProvider(p)} country={country} isMatch={false}/>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {provider && (
                    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                      className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                      <img src={provider.imageUrl} alt={provider.name} className="w-8 h-8 rounded-lg object-cover"/>
                      <span className="text-sm font-semibold text-primary">{provider.name} selected</span>
                      <Check className="w-4 h-4 text-primary ml-auto"/>
                    </motion.div>
                  )}
                </StepShell>
              )}

              {/* ── Step 4: Duration ─────────────────────────── */}
              {step===4 && (
                <StepShell title="How long would you like your session?" subtitle="Prices shown in your selected currency.">
                  <div className="grid grid-cols-3 gap-4">
                    {SESSION_DURATIONS.map(d => {
                      const px = getSessionPrice(baseUSD, d.minutes, country);
                      const sel = duration===d.minutes;
                      return (
                        <button key={d.minutes} onClick={() => setDuration(d.minutes)}
                          className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md
                            ${sel ? "border-primary bg-primary/5 shadow-md" : "border-border bg-white hover:border-primary/30"}`}>
                          <div className={`text-4xl font-bold mb-1 ${sel?"text-primary":"text-foreground"}`}>{d.minutes}</div>
                          <div className="text-xs text-muted-foreground mb-3">minutes</div>
                          <div className={`font-semibold text-sm ${sel?"text-primary":"text-foreground"}`}>{formatPrice(px.local,country)}</div>
                          {country.code!=="US" && <div className="text-[10px] text-muted-foreground">≈${px.usd}</div>}
                          {d.minutes===90 && <div className="text-[10px] text-emerald-600 font-semibold mt-1.5">Best value</div>}
                          {sel && <Check className="w-4 h-4 text-primary mt-2"/>}
                        </button>
                      );
                    })}
                  </div>
                </StepShell>
              )}

              {/* ── Step 5: Date ─────────────────────────────── */}
              {step===5 && (
                <StepShell title="Pick a date" subtitle="Availability shown for the next 60 days.">
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <CalendarGrid selected={date} onSelect={d => setDate(d)}/>
                  </div>
                  {date && (
                    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                      className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                      <Calendar className="w-4 h-4 text-primary"/>
                      <span className="text-sm font-medium text-primary">{formatDateLong(date)}</span>
                    </motion.div>
                  )}
                </StepShell>
              )}

              {/* ── Step 6: Time ─────────────────────────────── */}
              {step===6 && (
                <StepShell
                  title="Select a time"
                  subtitle={date ? `Available slots for ${formatDateLong(date)}` : "Select a date first"}>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground text-sm">
                      <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
                      Checking live availability…
                    </div>
                  ) : (
                    <>
                      {bookedSlots.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <div className="w-3 h-3 rounded border border-red-200 bg-red-50 flex items-center justify-center">
                            <X className="w-2 h-2 text-red-400"/>
                          </div>
                          {bookedSlots.length} slot{bookedSlots.length>1?"s":""} already booked
                        </div>
                      )}
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {TIME_SLOTS.map(slot => {
                          const booked = bookedSlots.includes(slot), sel = time===slot;
                          return (
                            <button key={slot} disabled={booked} onClick={() => !booked && setTime(slot)}
                              className={`relative py-3 rounded-xl border-2 text-sm font-medium transition-all
                                ${sel   ? "border-primary bg-primary text-white shadow-md" : ""}
                                ${booked? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed" : ""}
                                ${!booked&&!sel ? "border-border bg-white hover:border-primary/40 text-foreground" : ""}`}>
                              {booked
                                ? <span className="flex flex-col items-center gap-0.5">
                                    <X className="w-3.5 h-3.5 text-red-400"/>
                                    <span className="text-[9px] line-through">{slot}</span>
                                  </span>
                                : slot}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </StepShell>
              )}

              {/* ── Step 7: Details ──────────────────────────── */}
              {step===7 && (
                <StepShell title="Your information" subtitle="To confirm and send your booking details.">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5"/> Full name *
                      </label>
                      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5"/> Email *
                      </label>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5"/> Promo code <span className="font-normal">(optional)</span>
                      </label>
                      <div className="flex gap-2">
                        <input value={promoInput} onChange={e=>{setPromoInput(e.target.value.toUpperCase());setPromoErr("");}}
                          placeholder="e.g. CLEAR20"
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-input bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
                        <button onClick={applyPromo}
                          className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">
                          Apply
                        </button>
                      </div>
                      {promoErr && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{promoErr}</p>}
                      {promo && <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1"><Check className="w-3.5 h-3.5"/><b>{promo.code}</b> — {Math.round(promo.pct*100)}% discount applied</p>}
                    </div>
                  </div>
                </StepShell>
              )}

              {/* ── Step 8: Review & Book ────────────────────── */}
              {step===8 && (
                <StepShell title="Review & confirm" subtitle="Check everything looks right before locking in your session.">
                  <div className="space-y-4">
                    {provider && (
                      <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
                        <img src={provider.imageUrl} alt={provider.name} className="w-12 h-12 rounded-xl object-cover bg-muted"/>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">{provider.title}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400"/> {provider.rating}
                        </div>
                      </div>
                    )}
                    <div className="bg-white border border-border rounded-2xl p-4 space-y-2.5 text-sm">
                      <Row label="Service"  value={SERVICES.find(s=>s.id===service)?.label ?? ""}/>
                      <Row label="Date"     value={formatDateLong(date)}/>
                      <Row label="Time"     value={time}/>
                      <Row label="Duration" value={`${duration} minutes`}/>
                      <Row label="Format"   value="Video call"/>
                      <Row label="Country"  value={`${country.flag} ${country.name}`}/>
                      <div className="border-t border-border pt-2.5">
                        <Row label="Session fee" value={formatPrice(local, country)}/>
                        {promo && <Row label={`Promo (${promo.code})`} value={`−${formatPrice(discAmt,country)}`} className="text-emerald-600"/>}
                        <div className="flex justify-between font-bold mt-1">
                          <span>Total</span>
                          <span className="text-primary text-base">{formatPrice(total,country)}</span>
                        </div>
                        {country.code!=="US" && <p className="text-right text-xs text-muted-foreground mt-0.5">≈ ${usd} USD</p>}
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div onClick={() => setAcceptTerms(v=>!v)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                          ${acceptTerms ? "border-primary bg-primary" : "border-input group-hover:border-primary/50"}`}>
                        {acceptTerms && <Check className="w-3 h-3 text-white"/>}
                      </div>
                      <span className="text-xs text-foreground/70 leading-relaxed">
                        I accept the{" "}
                        <a href="/contracts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>
                        {" & "}
                        <a href="/contracts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
                        I understand Clearhead is not a crisis service.
                      </span>
                    </label>
                    {bookErr && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0"/> {bookErr}
                      </div>
                    )}
                    <button onClick={handleBook} disabled={!acceptTerms||loading}
                      className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all
                        ${acceptTerms ? "bg-primary text-white hover:opacity-90 hover:-translate-y-0.5 shadow-lg" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                      {loading
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            Confirming…
                          </span>
                        : "Confirm & Book Session →"}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-primary"/>
                      HIPAA-compliant · End-to-end encrypted · Free cancellation up to 24h
                    </div>
                  </div>
                </StepShell>
              )}

            </div>

            {/* Navigation */}
            {step < 8 && (
              <div className="flex items-center gap-3 mt-6 pb-2">
                {step > 0
                  ? <button onClick={() => go(-1)}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all">
                      <ArrowLeft className="w-4 h-4"/> Back
                    </button>
                  : <Link href="/" className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all">
                      <ArrowLeft className="w-4 h-4"/> Home
                    </Link>
                }
                <button onClick={() => go(1)} disabled={!canContinue()}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                    ${canContinue() ? "bg-primary text-white hover:opacity-90 hover:-translate-y-0.5 shadow-md" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                  {step===7 ? "Review booking" : "Continue"}
                  {canContinue() && <ArrowRight className="w-4 h-4"/>}
                </button>
              </div>
            )}
            {step===8 && (
              <button onClick={() => go(-1)}
                className="flex items-center gap-2 mt-4 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all self-start">
                <ArrowLeft className="w-4 h-4"/> Edit details
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

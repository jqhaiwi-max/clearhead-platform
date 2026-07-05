/**
 * Clearhead – Full Clinical Intake + Booking Journey
 * Phase 1: Screening   (K10 distress · PHQ-9 depression · GAD-7 anxiety)
 * Phase 2: Profile     (demographics · medical background · emergency contact)
 * Phase 3: Preferences (format · timing · contact)
 * Phase 4: Booking     (matched providers · session · date/time · confirm)
 */
import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, X, Star, Calendar, ChevronLeft,
  ChevronRight, User, Mail, Tag, MessageCircle, Copy, Shield,
  CheckCircle, Search, AlertCircle, Leaf, Sparkles, Phone,
  Heart, Brain, Users, Baby, Clock, Video, MessageSquare,
} from "lucide-react";
import { useListProviders } from "@workspace/api-client-react";
import {
  COUNTRY_LIST, SESSION_DURATIONS, getSessionPrice,
  PROMO_CODES, formatPrice, type CountryPricing,
} from "@/lib/pricing";
import { useCountry } from "@/context/CountryContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/* ═══════════════════════════════════════════════════════════════
   DATA – Questionnaires
═══════════════════════════════════════════════════════════════ */
const K10_SCALE = [
  { val: 1, label: "None of\nthe time" },
  { val: 2, label: "A little\nof the time" },
  { val: 3, label: "Some of\nthe time" },
  { val: 4, label: "Most of\nthe time" },
  { val: 5, label: "All of\nthe time" },
];
const PHQ_SCALE = [
  { val: 0, label: "Not\nat all" },
  { val: 1, label: "Several\ndays" },
  { val: 2, label: "More than\nhalf the days" },
  { val: 3, label: "Nearly\nevery day" },
];

const K10_QS = [
  "About how often did you feel tired out for no good reason?",
  "About how often did you feel nervous?",
  "About how often did you feel so nervous that nothing could calm you down?",
  "About how often did you feel hopeless about the future?",
  "About how often did you feel restless or fidgety?",
  "About how often did you feel so restless you could not sit still?",
  "About how often did you feel depressed or down?",
  "About how often did you feel that everything was an effort?",
  "About how often did you feel so sad that nothing could cheer you up?",
  "About how often did you feel worthless?",
];

const PHQ9_QS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, like reading or watching TV",
  "Moving or speaking so slowly that other people could notice — or being so fidgety that you moved around more than usual",
  "Thoughts that you would be better off dead, or thoughts of hurting yourself in some way",
];

const GAD7_QS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

/* ═══════════════════════════════════════════════════════════════
   SCORING
═══════════════════════════════════════════════════════════════ */
type Scores = { k10: number; phq9: number; gad7: number; hasRisk: boolean };
type Recommendation = { specialty: string; label: string; reason: string; urgent: boolean; color: string };

function computeScores(k10: Record<number,number>, phq9: Record<number,number>, gad7: Record<number,number>): Scores {
  const k10Total  = Object.values(k10).reduce((a,b)=>a+b,0);
  const phq9Total = Object.values(phq9).reduce((a,b)=>a+b,0);
  const gad7Total = Object.values(gad7).reduce((a,b)=>a+b,0);
  return { k10: k10Total, phq9: phq9Total, gad7: gad7Total, hasRisk: (phq9[8] ?? 0) >= 1 };
}

function scoreLabel(val: number, max: number, thresholds: number[]): { label: string; color: string; fill: number } {
  const fill = Math.round((val / max) * 100);
  if (val < thresholds[0]) return { label: "Minimal",           color: "bg-emerald-500", fill };
  if (val < thresholds[1]) return { label: "Mild",              color: "bg-yellow-400",  fill };
  if (val < thresholds[2]) return { label: "Moderate",          color: "bg-orange-400",  fill };
  return                          { label: "Moderately Severe",  color: "bg-red-500",     fill };
}

function getRecommendation(scores: Scores, careType: string): Recommendation {
  if (careType === "couples") return { specialty: "Couples", label: "Couples Therapist", reason: "Specialists in relationship dynamics, communication and conflict resolution.", urgent: false, color: "teal" };
  if (careType === "children") return { specialty: "Child",  label: "Child & Adolescent Specialist", reason: "Trained to work with younger minds in a safe, age-appropriate environment.", urgent: false, color: "violet" };
  const { k10, phq9, gad7, hasRisk } = scores;
  if (hasRisk || phq9 >= 15 || k10 >= 30) return { specialty: "Psychiatr", label: "Psychiatrist", reason: "Your results indicate symptoms that benefit most from medical evaluation and comprehensive psychiatric care.", urgent: hasRisk, color: "red" };
  if (phq9 >= 10 && gad7 >= 10) return { specialty: "Psychiatr", label: "Psychiatrist", reason: "Combined moderate depression and anxiety often respond well to an integrated psychiatric approach.", urgent: false, color: "orange" };
  if (phq9 >= 10) return { specialty: "", label: "Therapist — Depression Focus", reason: "Your PHQ-9 score suggests a structured therapy approach like CBT would be most beneficial.", urgent: false, color: "amber" };
  if (gad7 >= 10) return { specialty: "", label: "Therapist — Anxiety & CBT", reason: "Your GAD-7 score points to anxiety that responds very well to cognitive behavioural therapy.", urgent: false, color: "amber" };
  return { specialty: "", label: "Therapist / Counsellor", reason: "Your results suggest mild to moderate stress. A supportive therapist will help you build resilience and coping skills.", urgent: false, color: "emerald" };
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */

/** Animated slide between steps */
const slideV = {
  enter:  (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};

/** 4-phase indicator at top */
function PhaseHeader({ phase }: { phase: number }) {
  const phases = [
    { label: "Screening",   icon: Brain },
    { label: "Your Profile", icon: User  },
    { label: "Preferences", icon: Heart },
    { label: "Book",        icon: Calendar },
  ];
  return (
    <div className="flex items-center gap-0 max-w-xl mx-auto">
      {phases.map((p, i) => {
        const Icon = p.icon;
        const done = i < phase, active = i === phase;
        return (
          <div key={i} className="flex-1 flex items-center">
            <div className={`flex flex-col items-center flex-shrink-0 transition-all duration-300`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
                ${done   ? "bg-primary border-primary text-white" : ""}
                ${active ? "bg-white border-primary text-primary shadow-md shadow-primary/20" : ""}
                ${!done&&!active ? "bg-transparent border-border text-muted-foreground" : ""}`}>
                {done ? <Check className="w-3.5 h-3.5"/> : <Icon className="w-3.5 h-3.5"/>}
              </div>
              <span className={`text-[10px] mt-1 font-semibold hidden sm:block transition-colors
                ${active?"text-primary":done?"text-primary/70":"text-muted-foreground"}`}>{p.label}</span>
            </div>
            {i < phases.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${i < phase?"bg-primary":"bg-border"}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Question card shell */
function QCard({ children, qNum, qTotal, intro = false }: { children: React.ReactNode; qNum?: number; qTotal?: number; intro?: boolean }) {
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-border/60 overflow-hidden ${intro ? "p-8" : "p-6 sm:p-8"}`}>
      {qNum !== undefined && qTotal !== undefined && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1 rounded-full bg-border/40 overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(qNum/qTotal)*100}%` }} transition={{ duration: 0.4 }}/>
          </div>
          <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{qNum} / {qTotal}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/** Likert button row */
function LikertRow({ scale, selected, onSelect, cols = 5 }: {
  scale: { val: number; label: string }[];
  selected?: number;
  onSelect: (v: number) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2 mt-6`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {scale.map(o => {
        const sel = selected === o.val;
        return (
          <button key={o.val} onClick={() => onSelect(o.val)}
            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 text-center transition-all
              ${sel ? "border-primary bg-primary text-white shadow-md scale-105" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 text-foreground"}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${sel ? "border-white bg-white/20" : "border-border/60"}`}>
              {sel && <div className="w-2 h-2 rounded-full bg-white"/>}
            </div>
            <span className="text-[10px] sm:text-xs font-medium leading-tight whitespace-pre-line">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Score bar row for results */
function ScoreBar({ label, val, max, thresholds }: { label: string; val: number; max: number; thresholds: number[] }) {
  const { label: lvl, color, fill } = scoreLabel(val, max, thresholds);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          color === "bg-emerald-500" ? "bg-emerald-100 text-emerald-700" :
          color === "bg-yellow-400"  ? "bg-yellow-100 text-yellow-700"  :
          color === "bg-orange-400"  ? "bg-orange-100 text-orange-700"  :
          "bg-red-100 text-red-700"
        }`}>{lvl} · {val}/{max}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.7, ease: "easeOut" }}/>
      </div>
    </div>
  );
}

/** Calendar grid (reused from old journey) */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarGrid({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());
  const firstDay = new Date(vy,vm,1).getDay(), days = new Date(vy,vm+1,0).getDate();
  const pad = (n: number) => String(n).padStart(2,"0");
  const toVal = (d: number) => `${vy}-${pad(vm+1)}-${pad(d)}`;
  const max = new Date(today); max.setDate(today.getDate()+60);
  const isPast  = (d: number) => new Date(vy,vm,d) < today;
  const isFar   = (d: number) => new Date(vy,vm,d) > max;
  const isToday = (d: number) => new Date(vy,vm,d).getTime() === today.getTime();
  const prev = () => vm===0?( setVm(11),setVy(y=>y-1)):setVm(m=>m-1);
  const next = () => vm===11?(setVm(0), setVy(y=>y+1)):setVm(m=>m+1);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft className="w-4 h-4"/></button>
        <span className="font-semibold text-sm">{MONTH_NAMES[vm]} {vy}</span>
        <button onClick={next} className="p-2 rounded-xl hover:bg-muted"><ChevronRight className="w-4 h-4"/></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({length: firstDay}, (_,i) => <div key={`e${i}`}/>)}
        {Array.from({length: days}, (_,i) => {
          const day=i+1, v=toVal(day), dis=isPast(day)||isFar(day), sel=v===selected, tod=isToday(day);
          return (
            <button key={day} disabled={dis} onClick={()=>!dis&&onSelect(v)}
              className={`mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${sel?"bg-primary text-white shadow-md":""}
                ${!sel&&tod?"border-2 border-primary text-primary":""}
                ${!sel&&!dis&&!tod?"hover:bg-primary/10 text-foreground":""}
                ${dis?"text-muted-foreground/30 cursor-not-allowed":""}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Provider = {
  id: number; name: string; title: string; specialty: string;
  bio: string; rating: number; reviewCount: number; yearsExperience: number;
  imageUrl: string; available: boolean; sessionPrice: number;
  languages?: string[] | null; acceptsInsurance: boolean; nextAvailable?: string | null;
};

/** Provider card (grid) */
function ProviderCard({ p, selected, onSelect, country, recommended }: {
  p: Provider; selected: boolean; onSelect: () => void; country: CountryPricing; recommended: boolean;
}) {
  const px = getSessionPrice(p.sessionPrice, 60, country);
  return (
    <button onClick={onSelect}
      className={`relative flex flex-col rounded-2xl border-2 text-left overflow-hidden transition-all duration-200
        hover:-translate-y-1 hover:shadow-xl
        ${selected ? "border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20" : "border-border bg-white hover:border-primary/40"}`}>
      <div className="relative">
        <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover object-top bg-muted"/>
        {recommended && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold shadow">
            <Sparkles className="w-2.5 h-2.5"/> Best match
          </div>
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary shadow-md flex items-center justify-center">
            <Check className="w-4 h-4 text-white"/>
          </div>
        )}
        {p.acceptsInsurance && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px] font-semibold">Insurance</span>
        )}
      </div>
      <div className={`flex-1 flex flex-col p-3.5 ${selected?"bg-primary/5":"bg-white"}`}>
        <div className={`font-semibold text-sm ${selected?"text-primary":"text-foreground"}`}>{p.name}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 mb-2 line-clamp-1">{p.title}</div>
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>
          <span className="text-xs font-semibold">{p.rating}</span>
          <span className="text-[10px] text-muted-foreground">({p.reviewCount})</span>
          <span className="mx-0.5 text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">{p.yearsExperience}y exp</span>
        </div>
        <div className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{p.specialty}</div>
        {p.languages && p.languages.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {p.languages.slice(0,2).map(l => (
              <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{l}</span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-2 border-t border-border/50">
          <span className={`font-bold text-sm ${selected?"text-primary":"text-foreground"}`}>{formatPrice(px.local,country)}</span>
          <span className="text-[10px] text-muted-foreground">/hr</span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SELECT / DROPDOWN helpers
═══════════════════════════════════════════════════════════════ */
function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary appearance-none cursor-pointer">
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
    </div>
  );
}

function CheckGroup({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (s: string[]) => void;
}) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x=>x!==v) : [...selected, v]);
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const on = selected.includes(o);
          return (
            <button key={o} onClick={() => toggle(o)} type="button"
              className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all
                ${on ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary/40 text-foreground"}`}>
              {on && <Check className="w-2.5 h-2.5 inline mr-1"/>}{o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OPTION DATA
═══════════════════════════════════════════════════════════════ */
const GENDER_OPTS     = [{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"nonbinary",label:"Non-binary"},{value:"prefer_not",label:"Prefer not to say"}];
const MARITAL_OPTS    = [{value:"single",label:"Single"},{value:"married",label:"Married"},{value:"partnered",label:"In a relationship"},{value:"divorced",label:"Divorced / Separated"},{value:"widowed",label:"Widowed"}];
const EDUCATION_OPTS  = [{value:"high_school",label:"High school"},{value:"bachelors",label:"Bachelor's degree"},{value:"masters",label:"Master's degree"},{value:"phd",label:"PhD / Doctorate"},{value:"vocational",label:"Vocational / Trade"},{value:"other",label:"Other"}];
const THERAPY_OPTS    = [{value:"yes_helpful",label:"Yes — it was helpful"},{value:"yes_not_helpful",label:"Yes — but it wasn't helpful"},{value:"no",label:"No, this is my first time"},{value:"unsure",label:"Not sure"}];
const PREVIOUS_DX     = ["Depression","Anxiety disorder","Bipolar disorder","ADHD","PTSD","OCD","Eating disorder","Personality disorder","Schizophrenia","None of the above"];
const FAMILY_DX       = ["Depression","Anxiety","Bipolar","Schizophrenia","Addiction","None that I know of"];
const MEDICATION_OPTS = [{value:"no",label:"No"},{value:"yes_psych",label:"Yes — psychiatric medications"},{value:"yes_other",label:"Yes — other medications"},{value:"unsure",label:"Unsure"}];
const FORMAT_OPTS     = [{value:"video",label:"Video call",icon:"📹"},{value:"phone",label:"Phone call",icon:"📞"},{value:"messaging",label:"Messaging",icon:"💬"}];
const PREF_GENDER_OPTS= [{value:"any",label:"No preference"},{value:"male",label:"Male provider"},{value:"female",label:"Female provider"}];
const TIME_OPTS       = [{value:"any",label:"Flexible"},{value:"morning",label:"Mornings (before noon)"},{value:"afternoon",label:"Afternoons"},{value:"evening",label:"Evenings (after 5pm)"}];
const CONTACT_OPTS    = [{value:"email",label:"Email",icon:"✉️"},{value:"whatsapp",label:"WhatsApp",icon:"💬"}];
const TIME_SLOTS      = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","19:00"];

function formatDateLong(str: string) {
  if (!str) return "";
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
}

async function fetchSlots(pid: number, date: string): Promise<string[]> {
  try {
    const r = await fetch(`${BASE}/api/appointments/slots?providerId=${pid}&date=${date}`);
    return r.ok ? (await r.json()).bookedSlots ?? [] : [];
  } catch { return []; }
}
async function bookAppointment(body: object) {
  const r = await fetch(`${BASE}/api/appointments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if (!r.ok){const e=await r.json();throw new Error(e.error||"Booking failed");}
  return r.json();
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BookingJourney() {
  const [,navigate] = useLocation();
  const { country: globalCountry, setCountry: setGlobalCountry } = useCountry();

  /* Phase & step */
  const [phase, setPhase]   = useState(0); // 0=screening 1=profile 2=prefs 3=booking
  const [step,  setStep ]   = useState(0); // within phase
  const [dir,   setDir  ]   = useState(1);

  /* Care type */
  const [careType, setCareType] = useState<string>("");

  /* Screening answers */
  const [k10,  setK10 ] = useState<Record<number,number>>({});
  const [phq9, setPhq9] = useState<Record<number,number>>({});
  const [gad7, setGad7] = useState<Record<number,number>>({});

  /* Profile */
  const [firstName,       setFirstName      ] = useState("");
  const [lastName,        setLastName       ] = useState("");
  const [dob,             setDob            ] = useState("");
  const [gender,          setGender         ] = useState("");
  const [nationality,     setNationality    ] = useState(globalCountry.code);
  const [maritalStatus,   setMaritalStatus  ] = useState("");
  const [occupation,      setOccupation     ] = useState("");
  const [education,       setEducation      ] = useState("");
  const [prevTherapy,     setPrevTherapy    ] = useState("");
  const [prevDx,          setPrevDx         ] = useState<string[]>([]);
  const [familyDx,        setFamilyDx       ] = useState<string[]>([]);
  const [medications,     setMedications    ] = useState("");
  const [emergencyName,   setEmergencyName  ] = useState("");
  const [emergencyPhone,  setEmergencyPhone ] = useState("");
  const [emergencyRel,    setEmergencyRel   ] = useState("");

  /* Preferences */
  const [sessionFormat,   setSessionFormat  ] = useState("video");
  const [providerGender,  setProviderGender ] = useState("any");
  const [timePref,        setTimePref       ] = useState("any");
  const [contactMethod,   setContactMethod  ] = useState("email");
  const [contactDetail,   setContactDetail  ] = useState("");

  /* Booking */
  const [country,         setCountry        ] = useState<CountryPricing>(globalCountry);
  const [provider,        setProvider       ] = useState<Provider|null>(null);
  const [duration,        setDuration       ] = useState(60);
  const [date,            setDate           ] = useState("");
  const [time,            setTime           ] = useState("");
  const [promoInput,      setPromoInput     ] = useState("");
  const [promo,           setPromo          ] = useState<{code:string;pct:number}|null>(null);
  const [promoErr,        setPromoErr       ] = useState("");
  const [acceptTerms,     setAcceptTerms    ] = useState(false);
  const [bookedSlots,     setBookedSlots    ] = useState<string[]>([]);
  const [slotsLoading,    setSlotsLoading   ] = useState(false);
  const [loading,         setLoading        ] = useState(false);
  const [bookErr,         setBookErr        ] = useState("");
  const [done,            setDone           ] = useState(false);
  const [copied,          setCopied         ] = useState(false);
  const [provSearch,      setProvSearch     ] = useState("");

  /* Derived */
  const scores = computeScores(k10, phq9, gad7);
  const recommendation = getRecommendation(scores, careType);
  const nationalityCountry = COUNTRY_LIST.find(c=>c.code===nationality) ?? globalCountry;

  /* Provider data */
  const { data: allProviders = [] } = useListProviders({ available: true }, { query: { staleTime: 60000 } });
  const filteredProviders = (allProviders as Provider[]).filter(p => {
    const spec = p.specialty.toLowerCase() + " " + p.title.toLowerCase();
    const matchesSpec = recommendation.specialty ? spec.includes(recommendation.specialty.toLowerCase()) : true;
    const matchesSearch = !provSearch || p.name.toLowerCase().includes(provSearch.toLowerCase()) || spec.includes(provSearch.toLowerCase());
    return matchesSpec && matchesSearch;
  });
  const otherProviders = provSearch ? [] : (allProviders as Provider[]).filter(p => {
    const spec = p.specialty.toLowerCase() + " " + p.title.toLowerCase();
    return recommendation.specialty ? !spec.includes(recommendation.specialty.toLowerCase()) : false;
  }).filter(p => !provSearch || p.name.toLowerCase().includes(provSearch.toLowerCase()));

  /* Pricing */
  const baseUSD = provider?.sessionPrice ?? 50;
  const { local } = getSessionPrice(baseUSD, duration, country);
  const discAmt   = promo ? Math.round(local * promo.pct) : 0;
  const total     = local - discAmt;

  /* Slot fetch */
  useEffect(() => {
    if (!date || !provider) return;
    setSlotsLoading(true); setTime("");
    fetchSlots(provider.id, date).then(s => { setBookedSlots(s); setSlotsLoading(false); });
  }, [date, provider]);

  /* Sync country from nationality selection */
  useEffect(() => {
    const c = COUNTRY_LIST.find(x=>x.code===nationality);
    if (c) { setCountry(c); setGlobalCountry(c); }
  }, [nationality]);

  /* Navigation */
  const go = useCallback((delta: number) => {
    setDir(delta);
    setStep(s => {
      const n = s + delta;
      return n;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const nextPhase = useCallback(() => {
    setDir(1); setPhase(p => p + 1); setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const prevPhase = useCallback(() => {
    setDir(-1); setPhase(p => p - 1); setStep(999);
  }, []);

  /* Auto-advance for questionnaire questions */
  const answerK10 = useCallback((qi: number, val: number) => {
    setK10(prev => ({ ...prev, [qi]: val }));
    setTimeout(() => {
      setDir(1);
      setStep(qi < 9 ? 2 + qi + 1 : 12);  // steps 2–11 = K10 qs, 12 = PHQ-9 intro
    }, 380);
  }, []);

  const answerPhq9 = useCallback((qi: number, val: number) => {
    setPhq9(prev => ({ ...prev, [qi]: val }));
    setTimeout(() => {
      setDir(1);
      setStep(qi < 8 ? 13 + qi + 1 : 22); // steps 13–21 = PHQ-9 qs, 22 = GAD-7 intro
    }, 380);
  }, []);

  const answerGad7 = useCallback((qi: number, val: number) => {
    setGad7(prev => ({ ...prev, [qi]: val }));
    setTimeout(() => {
      setDir(1);
      setStep(qi < 6 ? 23 + qi + 1 : 30); // steps 23–29 = GAD-7 qs, 30 = results
    }, 380);
  }, []);

  /* Booking */
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
      await bookAppointment({
        patientName: `${firstName} ${lastName}`.trim(),
        patientEmail: contactDetail || `${firstName.toLowerCase()}@example.com`,
        providerId: provider.id, date, time, type: sessionFormat,
        notes: [promo?`Promo: ${promo.code}`:"", careType, prevDx.join(", ")].filter(Boolean).join(" | "),
      });
      setDone(true);
    } catch(e:any) { setBookErr(e.message); }
    finally { setLoading(false); }
  };

  /* ── Screening Phase steps ─────────────────────────────────────
     0  = Care type intro
     1  = K10 intro
     2–11 = K10 questions (qi = step-2)
     12 = PHQ-9 intro
     13–21 = PHQ-9 questions (qi = step-13)
     22 = GAD-7 intro
     23–29 = GAD-7 questions (qi = step-23)
     30 = Results
  ──────────────────────────────────────────────────────────────── */

  /* Phase 2 steps: 0=demographics 1=medical 2=emergency */
  /* Phase 3 steps: 0=preferences */
  /* Phase 4 steps: 0=providers 1=duration 2=date 3=time 4=review */

  /* ═══════ SUCCESS ═══════ */
  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex items-center justify-center px-4">
      <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.1}}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-600"/>
          </motion.div>
          <h2 className="font-serif text-2xl font-bold mb-1">You're all set!</h2>
          <p className="text-muted-foreground text-sm mb-5">Session confirmed with <span className="font-semibold">{provider?.name}</span></p>
          <div className="bg-muted/40 rounded-2xl p-4 text-left space-y-2 text-sm mb-6">
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formatDateLong(date)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{time}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{duration} min</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>Total</span><span className="text-primary">{formatPrice(total, country)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <a href={`https://wa.me/?text=${encodeURIComponent(`I just booked a ${duration}-min session with ${provider?.name} on ${formatDateLong(date)} at ${time}. Book yours at Clearhead: https://clearhead.app/get-started`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold hover:brightness-105 shadow">
              <MessageCircle className="w-5 h-5"/> Share via WhatsApp
            </a>
            <button onClick={()=>{navigator.clipboard.writeText("https://clearhead.app/get-started");setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-border font-semibold hover:border-primary/40">
              {copied?<Check className="w-4 h-4 text-emerald-600"/>:<Copy className="w-4 h-4"/>}
              {copied?"Copied!":"Copy Booking Link"}
            </button>
            <button onClick={()=>navigate("/")}
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold hover:opacity-90">
              Back to Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  /* ═══════ MAIN LAYOUT ═══════ */
  const isWide = phase === 3 && step === 0; // provider grid needs more width
  const maxW   = isWide ? "max-w-3xl" : "max-w-xl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-base tracking-tight flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white"/>
            </div>
            <span className="hidden sm:block">Clearhead</span>
          </Link>
          <div className="flex-1 max-w-sm">
            <PhaseHeader phase={phase}/>
          </div>
          <Link href="/providers" className="text-xs text-muted-foreground hover:text-primary transition-colors hidden sm:block">
            Browse providers
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col ${maxW} mx-auto w-full px-4 py-8 pb-24 transition-all duration-300`}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={`${phase}-${step}`} custom={dir} variants={slideV}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.24, ease: "easeOut" }}>

            {/* ════════════════════════════════════════════════
                PHASE 0 — SCREENING
            ════════════════════════════════════════════════ */}
            {phase === 0 && (
              <>
                {/* Step 0: Care type */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Phase 1 · Screening</p>
                      <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Who is this for?</h2>
                      <p className="text-muted-foreground">Your answer tailors the screening and provider match that follows.</p>
                    </div>
                    <div className="grid gap-3">
                      {[
                        { id:"individual", icon: Brain,  label:"For myself",       sub: "Adult individual therapy or psychiatric consultation" },
                        { id:"couples",    icon: Users,  label:"For us as a couple", sub: "Relationship counselling, communication, trust" },
                        { id:"children",   icon: Baby,   label:"For my child or teen", sub: "Specialist support for under 18s" },
                      ].map(o => {
                        const Icon = o.icon, sel = careType===o.id;
                        return (
                          <button key={o.id} onClick={()=>setCareType(o.id)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                              ${sel?"border-primary bg-primary/5 shadow-md":"border-border bg-white hover:border-primary/40"}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                              ${sel?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
                              <Icon className="w-6 h-6"/>
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold ${sel?"text-primary":"text-foreground"}`}>{o.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
                            </div>
                            {sel && <Check className="w-5 h-5 text-primary flex-shrink-0"/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 1: K10 intro */}
                {step === 1 && (
                  <QCard intro>
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-5">
                      <Brain className="w-6 h-6 text-violet-600"/>
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-3">Psychological distress check</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      The next 10 questions are from the <strong>Kessler Psychological Distress Scale (K10)</strong> — a clinically validated tool used worldwide.
                      Think about how you've felt <strong>over the past 4 weeks</strong>.
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary"/>
                      Your responses are private and reviewed only by your chosen provider.
                    </div>
                  </QCard>
                )}

                {/* Steps 2–11: K10 questions */}
                {step >= 2 && step <= 11 && (() => {
                  const qi = step - 2;
                  return (
                    <QCard qNum={qi+1} qTotal={10}>
                      <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">K10 · Distress</p>
                      <p className="font-serif text-xl font-semibold text-foreground leading-snug">{K10_QS[qi]}</p>
                      <LikertRow scale={K10_SCALE} selected={k10[qi]} onSelect={v => answerK10(qi, v)} cols={5}/>
                    </QCard>
                  );
                })()}

                {/* Step 12: PHQ-9 intro */}
                {step === 12 && (
                  <QCard intro>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">
                      <Heart className="w-6 h-6 text-blue-600"/>
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-3">Depression screening</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      The next 9 questions come from the <strong>Patient Health Questionnaire (PHQ-9)</strong>.
                      Think about how often you've experienced each over the <strong>past 2 weeks</strong>.
                    </p>
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                      This is a screening tool only. Results are shared with your provider, not used to diagnose.
                    </div>
                  </QCard>
                )}

                {/* Steps 13–21: PHQ-9 */}
                {step >= 13 && step <= 21 && (() => {
                  const qi = step - 13;
                  return (
                    <QCard qNum={qi+1} qTotal={9}>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">PHQ-9 · Depression</p>
                      <p className="text-sm text-muted-foreground mb-1">Over the last 2 weeks, how often have you been bothered by…</p>
                      <p className="font-serif text-xl font-semibold text-foreground leading-snug">{PHQ9_QS[qi]}</p>
                      {qi === 8 && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                          If you are in crisis, please call your local emergency line or a mental health helpline immediately.
                        </div>
                      )}
                      <LikertRow scale={PHQ_SCALE} selected={phq9[qi]} onSelect={v => answerPhq9(qi, v)} cols={4}/>
                    </QCard>
                  );
                })()}

                {/* Step 22: GAD-7 intro */}
                {step === 22 && (
                  <QCard intro>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
                      <AlertCircle className="w-6 h-6 text-amber-600"/>
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-3">Anxiety screening</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Almost done with Phase 1. These 7 questions use the <strong>Generalized Anxiety Disorder scale (GAD-7)</strong>.
                      Again, think about the <strong>past 2 weeks</strong>.
                    </p>
                  </QCard>
                )}

                {/* Steps 23–29: GAD-7 */}
                {step >= 23 && step <= 29 && (() => {
                  const qi = step - 23;
                  return (
                    <QCard qNum={qi+1} qTotal={7}>
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">GAD-7 · Anxiety</p>
                      <p className="text-sm text-muted-foreground mb-1">Over the last 2 weeks, how often have you been bothered by…</p>
                      <p className="font-serif text-xl font-semibold text-foreground leading-snug">{GAD7_QS[qi]}</p>
                      <LikertRow scale={PHQ_SCALE} selected={gad7[qi]} onSelect={v => answerGad7(qi, v)} cols={4}/>
                    </QCard>
                  );
                })()}

                {/* Step 30: Results */}
                {step === 30 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Screening complete</p>
                      <h2 className="font-serif text-2xl font-bold text-foreground mb-1">Your results</h2>
                      <p className="text-sm text-muted-foreground">These are screening scores — not a diagnosis. A licensed provider will review them with you.</p>
                    </div>

                    {scores.hasRisk && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
                        <div>
                          <p className="text-sm font-semibold text-red-700">One of your responses needs attention</p>
                          <p className="text-xs text-red-600 mt-0.5">You indicated thoughts of self-harm. A clinician will review your case and reach out within 24 hours. If you are in immediate danger, please call emergency services.</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                      <ScoreBar label="Overall Distress (K10)"   val={scores.k10}  max={50} thresholds={[20,25,30]}/>
                      <ScoreBar label="Depression (PHQ-9)"       val={scores.phq9} max={27} thresholds={[5,10,15]}/>
                      <ScoreBar label="Anxiety (GAD-7)"          val={scores.gad7} max={21} thresholds={[5,10,15]}/>
                    </div>

                    <div className={`rounded-2xl p-5 border-2 ${
                      recommendation.urgent ? "border-red-200 bg-red-50" :
                      recommendation.color==="orange" ? "border-orange-200 bg-orange-50" :
                      recommendation.color==="amber"  ? "border-amber-200 bg-amber-50"  :
                      "border-emerald-200 bg-emerald-50"
                    }`}>
                      <div className="flex items-start gap-3">
                        <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          recommendation.urgent?"text-red-500":
                          recommendation.color==="orange"?"text-orange-500":
                          recommendation.color==="amber" ?"text-amber-500":"text-emerald-600"
                        }`}/>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommended</p>
                          <p className="font-semibold text-foreground">{recommendation.label}</p>
                          <p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      This report is a screening summary only and is not a medical diagnosis.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ════════════════════════════════════════════════
                PHASE 1 — PROFILE
            ════════════════════════════════════════════════ */}
            {phase === 1 && (
              <>
                {/* Step 0: Demographics */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Phase 2 · Your Profile</p>
                      <h2 className="font-serif text-2xl font-bold mb-1">Tell us about yourself</h2>
                      <p className="text-muted-foreground text-sm">This helps your provider understand your background and provide better care.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <TextField label="First name" value={firstName} onChange={setFirstName} placeholder="Jane" required/>
                        <TextField label="Last name"  value={lastName}  onChange={setLastName}  placeholder="Smith" required/>
                      </div>
                      <TextField label="Date of birth" value={dob} onChange={setDob} type="date"/>
                      <SelectField label="Gender" value={gender} onChange={setGender} options={GENDER_OPTS} placeholder="Select…"/>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nationality / Country of residence</label>
                        <select value={nationality} onChange={e=>setNationality(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                          {COUNTRY_LIST.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>)}
                        </select>
                      </div>
                      <SelectField label="Marital status"  value={maritalStatus} onChange={setMaritalStatus} options={MARITAL_OPTS} placeholder="Select…"/>
                      <TextField  label="Occupation"       value={occupation}    onChange={setOccupation}    placeholder="e.g. Teacher, Engineer, Student…"/>
                      <SelectField label="Education level" value={education}     onChange={setEducation}     options={EDUCATION_OPTS} placeholder="Select…"/>
                    </div>
                  </div>
                )}

                {/* Step 1: Medical background */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Medical & mental health background</h2>
                      <p className="text-muted-foreground text-sm">All information is confidential and shared only with your provider.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-border p-5 space-y-5">
                      <SelectField label="Have you been in therapy or counselling before?" value={prevTherapy} onChange={setPrevTherapy} options={THERAPY_OPTS} placeholder="Select…"/>
                      <CheckGroup label="Any previous diagnoses? (select all that apply)" options={PREVIOUS_DX} selected={prevDx} onChange={setPrevDx}/>
                      <CheckGroup label="Family history of mental health conditions?" options={FAMILY_DX} selected={familyDx} onChange={setFamilyDx}/>
                      <SelectField label="Are you currently taking any medications?" value={medications} onChange={setMedications} options={MEDICATION_OPTS} placeholder="Select…"/>
                    </div>
                  </div>
                )}

                {/* Step 2: Emergency contact */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Emergency contact</h2>
                      <p className="text-muted-foreground text-sm">Someone we can reach in case of a clinical emergency. This is optional but recommended.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                      <TextField label="Contact name"         value={emergencyName}  onChange={setEmergencyName}  placeholder="Full name"/>
                      <TextField label="Relationship"         value={emergencyRel}   onChange={setEmergencyRel}   placeholder="e.g. Partner, Parent, Friend"/>
                      <TextField label="Phone number"         value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+1 555 000 0000" type="tel"/>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">This information is only used in genuine clinical emergencies.</p>
                  </div>
                )}
              </>
            )}

            {/* ════════════════════════════════════════════════
                PHASE 2 — PREFERENCES
            ════════════════════════════════════════════════ */}
            {phase === 2 && step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Phase 3 · Preferences</p>
                  <h2 className="font-serif text-2xl font-bold mb-1">How would you like to connect?</h2>
                  <p className="text-muted-foreground text-sm">Set your session preferences — you can always change these later.</p>
                </div>

                {/* Session format */}
                <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Session format</p>
                  <div className="grid grid-cols-3 gap-3">
                    {FORMAT_OPTS.map(o=>{
                      const sel=sessionFormat===o.value;
                      return (
                        <button key={o.value} onClick={()=>setSessionFormat(o.value)}
                          className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5
                            ${sel?"border-primary bg-primary/5":"border-border bg-white hover:border-primary/30"}`}>
                          <span className="text-2xl">{o.icon}</span>
                          <span className={`text-xs font-semibold ${sel?"text-primary":"text-foreground"}`}>{o.label}</span>
                          {sel&&<Check className="w-3.5 h-3.5 text-primary"/>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Provider gender + time */}
                <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                  <SelectField label="Provider gender preference" value={providerGender} onChange={setProviderGender} options={PREF_GENDER_OPTS}/>
                  <SelectField label="Preferred session time" value={timePref} onChange={setTimePref} options={TIME_OPTS}/>
                </div>

                {/* Contact method */}
                <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">How should we contact you?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CONTACT_OPTS.map(o=>{
                      const sel=contactMethod===o.value;
                      return (
                        <button key={o.value} onClick={()=>setContactMethod(o.value)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                            ${sel?"border-primary bg-primary/5":"border-border bg-white hover:border-primary/30"}`}>
                          <span className="text-xl">{o.icon}</span>
                          <span className={`text-sm font-semibold ${sel?"text-primary":"text-foreground"}`}>{o.label}</span>
                          {sel&&<Check className="w-4 h-4 text-primary ml-auto"/>}
                        </button>
                      );
                    })}
                  </div>
                  <TextField
                    label={contactMethod==="whatsapp"?"WhatsApp number":"Email address"}
                    value={contactDetail} onChange={setContactDetail}
                    placeholder={contactMethod==="whatsapp"?"+1 555 000 0000":"you@example.com"}
                    type={contactMethod==="email"?"email":"tel"} required
                  />
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                PHASE 3 — BOOKING
            ════════════════════════════════════════════════ */}
            {phase === 3 && (
              <>
                {/* Step 0: Provider grid */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Phase 4 · Book your session</p>
                      <h2 className="font-serif text-2xl font-bold mb-1">Your matched providers</h2>
                      <p className="text-sm text-muted-foreground">
                        Based on your screening, we recommend a <span className="font-semibold text-foreground">{recommendation.label}</span>.
                        {nationalityCountry && <> Prices shown in <span className="font-semibold">{nationalityCountry.currency}</span>.</>}
                      </p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                      <input value={provSearch} onChange={e=>setProvSearch(e.target.value)} placeholder="Search by name or specialty…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                    </div>

                    <div className="max-h-[560px] overflow-y-auto space-y-5 pr-0.5">
                      {/* Recommended providers */}
                      {filteredProviders.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-amber-500"/>
                            <span className="text-sm font-semibold">Recommended for you</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filteredProviders.map(p=>(
                              <ProviderCard key={p.id} p={p} selected={provider?.id===p.id}
                                onSelect={()=>setProvider(p)} country={nationalityCountry} recommended/>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other providers */}
                      {otherProviders.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-px bg-border"/>
                            <span className="text-xs text-muted-foreground font-medium">Other providers</span>
                            <div className="flex-1 h-px bg-border"/>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {otherProviders.map(p=>(
                              <ProviderCard key={p.id} p={p} selected={provider?.id===p.id}
                                onSelect={()=>setProvider(p)} country={nationalityCountry} recommended={false}/>
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredProviders.length===0 && otherProviders.length===0 && (
                        <div className="text-center py-16 text-muted-foreground text-sm">No providers found. Try clearing your search.</div>
                      )}
                    </div>

                    {provider && (
                      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                        <img src={provider.imageUrl} alt={provider.name} className="w-8 h-8 rounded-lg object-cover"/>
                        <span className="text-sm font-semibold text-primary">{provider.name} selected</span>
                        <Check className="w-4 h-4 text-primary ml-auto"/>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 1: Duration */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Session duration</h2>
                      <p className="text-muted-foreground text-sm">Prices shown in {nationalityCountry.currency} based on your nationality.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {SESSION_DURATIONS.map(d=>{
                        const px=getSessionPrice(baseUSD,d.minutes,nationalityCountry);
                        const sel=duration===d.minutes;
                        return (
                          <button key={d.minutes} onClick={()=>setDuration(d.minutes)}
                            className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md
                              ${sel?"border-primary bg-primary/5 shadow-md":"border-border bg-white hover:border-primary/30"}`}>
                            <div className={`text-4xl font-bold mb-1 ${sel?"text-primary":"text-foreground"}`}>{d.minutes}</div>
                            <div className="text-xs text-muted-foreground mb-3">minutes</div>
                            <div className={`font-semibold text-sm ${sel?"text-primary":"text-foreground"}`}>{formatPrice(px.local,nationalityCountry)}</div>
                            {nationalityCountry.code!=="US"&&<div className="text-[10px] text-muted-foreground">≈${px.usd}</div>}
                            {d.minutes===90&&<div className="text-[10px] text-emerald-600 font-semibold mt-1">Best value</div>}
                            {sel&&<Check className="w-4 h-4 text-primary mt-2"/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Date */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Choose a date</h2>
                      <p className="text-muted-foreground text-sm">Sessions available within the next 60 days.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <CalendarGrid selected={date} onSelect={d=>setDate(d)}/>
                    </div>
                    {date&&(
                      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                        <Calendar className="w-4 h-4 text-primary"/>
                        <span className="text-sm font-medium text-primary">{formatDateLong(date)}</span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 3: Time */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Pick a time</h2>
                      <p className="text-muted-foreground text-sm">{date?`Available slots for ${formatDateLong(date)}`:"Select a date first."}</p>
                    </div>
                    {slotsLoading?(
                      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground text-sm">
                        <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
                        Checking availability…
                      </div>
                    ):(
                      <>
                        {bookedSlots.length>0&&(
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <X className="w-3 h-3 text-red-400"/> {bookedSlots.length} slot{bookedSlots.length>1?"s":""} already booked
                          </div>
                        )}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {TIME_SLOTS.map(slot=>{
                            const booked=bookedSlots.includes(slot), sel=time===slot;
                            return (
                              <button key={slot} disabled={booked} onClick={()=>!booked&&setTime(slot)}
                                className={`py-3 rounded-xl border-2 text-sm font-medium transition-all
                                  ${sel?"border-primary bg-primary text-white shadow-md":""}
                                  ${booked?"border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed":""}
                                  ${!booked&&!sel?"border-border bg-white hover:border-primary/40 text-foreground":""}`}>
                                {booked
                                  ? <span className="flex flex-col items-center gap-0.5"><X className="w-3.5 h-3.5 text-red-400"/><span className="text-[9px] line-through">{slot}</span></span>
                                  : slot}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 4: Review & Book */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Review & confirm</h2>
                      <p className="text-muted-foreground text-sm">Everything look right? Lock in your session.</p>
                    </div>

                    {/* Provider card */}
                    {provider&&(
                      <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
                        <img src={provider.imageUrl} alt={provider.name} className="w-14 h-14 rounded-xl object-cover bg-muted"/>
                        <div className="flex-1">
                          <div className="font-semibold">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">{provider.title}</div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-medium">
                            <Star className="w-3 h-3 fill-amber-400"/> {provider.rating}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary">{formatPrice(getSessionPrice(baseUSD,duration,nationalityCountry).local,nationalityCountry)}</div>
                          <div className="text-xs text-muted-foreground">{duration} min</div>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-white border border-border rounded-2xl p-4 space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{firstName} {lastName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formatDateLong(date)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{time}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium capitalize">{sessionFormat}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-medium">{nationalityCountry.flag} {nationalityCountry.name}</span></div>
                      <div className="border-t border-border pt-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <Tag className="w-3 h-3"/> Promo code <span className="font-normal">(optional)</span>
                          </label>
                          <div className="flex gap-2">
                            <input value={promoInput} onChange={e=>{setPromoInput(e.target.value.toUpperCase());setPromoErr("");}}
                              placeholder="e.g. CLEAR20" className="flex-1 px-3 py-2 rounded-xl border-2 border-input bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
                            <button onClick={applyPromo} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">Apply</button>
                          </div>
                          {promoErr&&<p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{promoErr}</p>}
                          {promo&&<p className="text-emerald-600 text-xs mt-1 flex items-center gap-1"><Check className="w-3 h-3"/><b>{promo.code}</b> — {Math.round(promo.pct*100)}% applied</p>}
                        </div>
                        <div className="flex justify-between mt-3"><span className="text-muted-foreground">Session fee</span><span className="font-medium">{formatPrice(local,nationalityCountry)}</span></div>
                        {promo&&<div className="flex justify-between text-emerald-600"><span>Discount ({promo.code})</span><span>−{formatPrice(discAmt,nationalityCountry)}</span></div>}
                        <div className="flex justify-between font-bold mt-1 text-base"><span>Total</span><span className="text-primary">{formatPrice(total,nationalityCountry)}</span></div>
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div onClick={()=>setAcceptTerms(v=>!v)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                          ${acceptTerms?"border-primary bg-primary":"border-input group-hover:border-primary/50"}`}>
                        {acceptTerms&&<Check className="w-3 h-3 text-white"/>}
                      </div>
                      <span className="text-xs text-foreground/70 leading-relaxed">
                        I accept the <a href="/contracts" target="_blank" className="text-primary hover:underline">Terms of Service</a> & <a href="/contracts" target="_blank" className="text-primary hover:underline">Privacy Policy</a>. I understand Clearhead is a screening and therapy platform, not an emergency service.
                      </span>
                    </label>

                    {bookErr&&(
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0"/> {bookErr}
                      </div>
                    )}

                    <button onClick={handleBook} disabled={!acceptTerms||loading}
                      className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all
                        ${acceptTerms?"bg-primary text-white hover:opacity-90 hover:-translate-y-0.5 shadow-lg":"bg-muted text-muted-foreground cursor-not-allowed"}`}>
                      {loading?<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Confirming…</span>:"Confirm & Book Session →"}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-primary"/> HIPAA-compliant · End-to-end encrypted · Free cancellation up to 24h
                    </div>
                  </div>
                )}
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Fixed bottom navigation ─────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-border/60 px-4 py-3 z-10">
        <div className={`${maxW} mx-auto flex items-center gap-3`}>
          {/* Back */}
          {(phase > 0 || step > 0) ? (
            <button onClick={() => {
              if (step > 0) { setDir(-1); setStep(s=>s-1); }
              else prevPhase();
            }} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all flex-shrink-0">
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all flex-shrink-0">
              <ArrowLeft className="w-4 h-4"/> Home
            </Link>
          )}

          {/* Continue / Next phase */}
          {(() => {
            /* Screening: auto-advance; show continue only on intro/results steps */
            const isScreeningQ = phase===0 && step>=2 && step<=29;
            if (isScreeningQ) return <div className="flex-1 text-center text-xs text-muted-foreground">Tap an answer to continue</div>;

            const canContinue = (() => {
              if (phase===0 && step===0) return !!careType;
              if (phase===0 && step===30) return true;
              if (phase===0) return true; // intro screens
              if (phase===1 && step===0) return firstName.trim().length>=1 && lastName.trim().length>=1;
              if (phase===1 && step===1) return true;
              if (phase===1 && step===2) return true;
              if (phase===2 && step===0) return contactDetail.trim().length>=3;
              if (phase===3 && step===0) return !!provider;
              if (phase===3 && step===1) return !!duration;
              if (phase===3 && step===2) return !!date;
              if (phase===3 && step===3) return !!time;
              return true;
            })();

            /* Determine next step */
            const isLastStepInPhase = (() => {
              if (phase===0) return step===30;
              if (phase===1) return step===2;
              if (phase===2) return step===0;
              return false;
            })();

            const label = (() => {
              if (phase===0 && step===0) return "Start screening";
              if (phase===0 && step===30) return "Continue to profile";
              if (phase===1 && step===2) return "Continue to preferences";
              if (phase===2 && step===0) return "Find my provider";
              if (phase===3 && step===3) return "Review booking";
              return "Continue";
            })();

            return (
              <button onClick={() => {
                if (isLastStepInPhase) nextPhase();
                else { setDir(1); setStep(s=>s+1); window.scrollTo({top:0,behavior:"smooth"}); }
              }} disabled={!canContinue}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                  ${canContinue?"bg-primary text-white hover:opacity-90 hover:-translate-y-0.5 shadow-md":"bg-muted text-muted-foreground cursor-not-allowed"}`}>
                {label} {canContinue&&<ArrowRight className="w-4 h-4"/>}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/**
 * Clearhead – Full Clinical Intake + Booking Journey (fully localised)
 * Phase 1: Screening · Phase 2: Profile · Phase 3: Preferences · Phase 4: Book
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, X, Star, Calendar, ChevronLeft,
  ChevronRight, ChevronDown, User, Tag, MessageCircle, Copy, Shield,
  CheckCircle, Search, AlertCircle, Leaf, Sparkles,
  Heart, Brain, Users, Baby, Hash, Video,
} from "lucide-react";
import { useListProviders } from "@workspace/api-client-react";
import {
  COUNTRY_LIST, SESSION_DURATIONS, getSessionPrice,
  PROMO_CODES, formatPrice, type CountryPricing,
} from "@/lib/pricing";
import { useCountry } from "@/context/CountryContext";
import { useLang } from "@/context/LanguageContext";

function generatePatientId(): string {
  return `CLR-${Math.floor(100000 + Math.random() * 900000)}`;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/* ═══════════════════════════════════════════════════════════════
   SCORING
═══════════════════════════════════════════════════════════════ */
type Scores  = { phq9: number; hasRisk: boolean };
type RecKey  = "couples"|"children"|"psychiatrist"|"therapistDepression"|"counselor";
type RecMeta = { key: RecKey; specialty: string; urgent: boolean; color: string };

function computeScores(phq9: Record<number,number>): Scores {
  return {
    phq9:    Object.values(phq9).reduce((a,b)=>a+b,0),
    hasRisk: (phq9[8]??0) >= 1,
  };
}

function getRecMeta(scores: Scores, careType: string): RecMeta {
  if (careType === "couples")  return { key:"couples",  specialty:"Couples",  urgent:false, color:"teal" };
  if (careType === "children") return { key:"children", specialty:"Child",    urgent:false, color:"violet" };
  const { phq9, hasRisk } = scores;
  if (hasRisk || phq9 >= 15) return { key:"psychiatrist",        specialty:"Psychiatr", urgent:hasRisk, color:"red" };
  if (phq9 >= 10)             return { key:"therapistDepression", specialty:"",          urgent:false,   color:"amber" };
  return                             { key:"counselor",           specialty:"",          urgent:false,   color:"emerald" };
}

function phq9Severity(score: number): string {
  if (score >= 20) return "Severe";
  if (score >= 15) return "Moderately Severe";
  if (score >= 10) return "Moderate";
  if (score >= 5)  return "Mild";
  return "Minimal";
}

function buildDiagnosisSummary(opts: {
  scores: Scores; rec: RecMeta; careType: string;
  prevDx: string[]; familyDx: string[]; prevTherapy: string; medications: string;
}): string {
  const { scores, rec, careType, prevDx, familyDx, prevTherapy, medications } = opts;
  const lines = [
    `Care Type: ${careType || "—"}`,
    `PHQ-9 Score: ${scores.phq9}/27 (${phq9Severity(scores.phq9)})`,
    scores.hasRisk ? `⚠️ Risk flag: patient endorsed self-harm/suicidal ideation item — prioritize review.` : "",
    `Recommended Care: ${rec.key}${rec.urgent ? " (URGENT)" : ""}`,
    prevDx.length ? `Previous Diagnoses: ${prevDx.join(", ")}` : "",
    familyDx.length ? `Family History: ${familyDx.join(", ")}` : "",
    prevTherapy ? `Previous Therapy: ${prevTherapy}` : "",
    medications ? `Current Medications: ${medications}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function scoreLevelIndex(val: number, thresholds: number[]): number {
  if (val < thresholds[0]) return 0;
  if (val < thresholds[1]) return 1;
  if (val < thresholds[2]) return 2;
  return 3;
}
const SCORE_COLORS = ["bg-emerald-500","bg-yellow-400","bg-orange-400","bg-red-500"];
const SCORE_BADGE  = ["bg-emerald-100 text-emerald-700","bg-yellow-100 text-yellow-700","bg-orange-100 text-orange-700","bg-red-100 text-red-700"];

/* ═══════════════════════════════════════════════════════════════
   SLIDE ANIMATION
═══════════════════════════════════════════════════════════════ */
const slideV = {
  enter:  (d: number) => ({ x: d>0? 48:-48, opacity:0 }),
  center: { x:0, opacity:1 },
  exit:   (d: number) => ({ x: d>0?-48: 48, opacity:0 }),
};

/* ═══════════════════════════════════════════════════════════════
   PHASE HEADER
═══════════════════════════════════════════════════════════════ */
const PHASE_ICONS = [Brain, User, Heart, Calendar];
function PhaseHeader({ phase }: { phase: number }) {
  const { t } = useLang();
  const labels = t.journey.phases;
  return (
    <div className="flex items-center gap-0 max-w-xl mx-auto">
      {labels.map((label, i) => {
        const Icon = PHASE_ICONS[i], done = i<phase, active = i===phase;
        return (
          <div key={i} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                ${done   ?"bg-primary border-primary text-white":""}
                ${active ?"bg-white border-primary text-primary shadow-md shadow-primary/20":""}
                ${!done&&!active?"bg-transparent border-border text-muted-foreground":""}`}>
                {done?<Check className="w-3.5 h-3.5"/>:<Icon className="w-3.5 h-3.5"/>}
              </div>
              <span className={`text-[10px] mt-1 font-semibold hidden sm:block transition-colors
                ${active?"text-primary":done?"text-primary/70":"text-muted-foreground"}`}>{label}</span>
            </div>
            {i<labels.length-1&&<div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${i<phase?"bg-primary":"bg-border"}`}/>}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUESTION CARD SHELL
═══════════════════════════════════════════════════════════════ */
function QCard({ children, qNum, qTotal, intro=false }: {
  children: React.ReactNode; qNum?:number; qTotal?:number; intro?:boolean;
}) {
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-border/60 overflow-hidden ${intro?"p-8":"p-6 sm:p-8"}`}>
      {qNum!==undefined&&qTotal!==undefined&&(
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1 rounded-full bg-border/40 overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{width:`${(qNum/qTotal)*100}%`}} transition={{duration:0.4}}/>
          </div>
          <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{qNum} / {qTotal}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIKERT ROW
═══════════════════════════════════════════════════════════════ */
function LikertRow({ scale, selected, onSelect, cols=5 }: {
  scale:{val:number;label:string}[]; selected?:number; onSelect:(v:number)=>void; cols?:number;
}) {
  return (
    <div className="grid gap-2 mt-6" style={{gridTemplateColumns:`repeat(${cols},1fr)`}}>
      {scale.map(o => {
        const sel = selected===o.val;
        return (
          <button key={o.val} onClick={()=>onSelect(o.val)}
            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 text-center transition-all
              ${sel?"border-primary bg-primary text-white shadow-md scale-105":"border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 text-foreground"}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel?"border-white bg-white/20":"border-border/60"}`}>
              {sel&&<div className="w-2 h-2 rounded-full bg-white"/>}
            </div>
            <span className="text-[10px] sm:text-xs font-medium leading-tight whitespace-pre-line">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCORE BAR
═══════════════════════════════════════════════════════════════ */
function ScoreBar({ label, val, max, thresholds, levels }: {
  label:string; val:number; max:number; thresholds:number[]; levels:string[];
}) {
  const idx  = scoreLevelIndex(val, thresholds);
  const fill = Math.round((val/max)*100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SCORE_BADGE[idx]}`}>{levels[idx]} · {val}/{max}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div className={`h-full rounded-full ${SCORE_COLORS[idx]}`} initial={{width:0}} animate={{width:`${fill}%`}} transition={{duration:0.7,ease:"easeOut"}}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR GRID
═══════════════════════════════════════════════════════════════ */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarGrid({ selected, onSelect }: { selected:string; onSelect:(d:string)=>void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [vy,setVy] = useState(today.getFullYear());
  const [vm,setVm] = useState(today.getMonth());
  const firstDay = new Date(vy,vm,1).getDay(), days = new Date(vy,vm+1,0).getDate();
  const pad = (n:number)=>String(n).padStart(2,"0");
  const toVal = (d:number)=>`${vy}-${pad(vm+1)}-${pad(d)}`;
  const max = new Date(today); max.setDate(today.getDate()+60);
  const isPast  = (d:number)=>new Date(vy,vm,d)<today;
  const isFar   = (d:number)=>new Date(vy,vm,d)>max;
  const isToday = (d:number)=>new Date(vy,vm,d).getTime()===today.getTime();
  const prev = ()=>vm===0?(setVm(11),setVy(y=>y-1)):setVm(m=>m-1);
  const next = ()=>vm===11?(setVm(0), setVy(y=>y+1)):setVm(m=>m+1);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft className="w-4 h-4"/></button>
        <span className="font-semibold text-sm">{MONTH_NAMES[vm]} {vy}</span>
        <button onClick={next} className="p-2 rounded-xl hover:bg-muted"><ChevronRight className="w-4 h-4"/></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d=><div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({length:firstDay},(_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:days},(_,i)=>{
          const day=i+1,v=toVal(day),dis=isPast(day)||isFar(day),sel=v===selected,tod=isToday(day);
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

/* ═══════════════════════════════════════════════════════════════
   PROVIDER CARD
═══════════════════════════════════════════════════════════════ */
type Provider = {
  id:number; name:string; title:string; specialty:string; bio:string;
  rating:number; reviewCount:number; yearsExperience:number; imageUrl:string;
  available:boolean; sessionPrice:number; languages?:string[]|null;
  acceptsInsurance:boolean; nextAvailable?:string|null;
};

function ProviderCard({ p, selected, onSelect, country, recommended }: {
  p:Provider; selected:boolean; onSelect:()=>void; country:CountryPricing; recommended:boolean;
}) {
  const { t } = useLang();
  const j = t.journey;
  const px = getSessionPrice(p.sessionPrice, 60, country);
  return (
    <button onClick={onSelect}
      className={`relative flex flex-col rounded-2xl border-2 text-left overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl
        ${selected?"border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20":"border-border bg-white hover:border-primary/40"}`}>
      <div className="relative">
        <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover object-top bg-muted"/>
        {recommended&&(
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold shadow">
            <Sparkles className="w-2.5 h-2.5"/> Best match
          </div>
        )}
        {selected&&<div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary shadow-md flex items-center justify-center"><Check className="w-4 h-4 text-white"/></div>}
        {p.acceptsInsurance&&<span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px] font-semibold">{j.insuranceLabel}</span>}
      </div>
      <div className={`flex-1 flex flex-col p-3.5 ${selected?"bg-primary/5":"bg-white"}`}>
        <div className={`font-semibold text-sm ${selected?"text-primary":"text-foreground"}`}>{p.name}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 mb-2 line-clamp-1">{p.title}</div>
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>
          <span className="text-xs font-semibold">{p.rating}</span>
          <span className="text-[10px] text-muted-foreground">({p.reviewCount})</span>
          <span className="mx-0.5 text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">{p.yearsExperience} {j.expLabel}</span>
        </div>
        <div className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{p.specialty}</div>
        {p.languages&&p.languages.length>0&&(
          <div className="flex gap-1 flex-wrap mb-2">
            {p.languages.slice(0,2).map(l=><span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{l}</span>)}
          </div>
        )}
        <div className="mt-auto pt-2 border-t border-border/50">
          <span className={`font-bold text-sm ${selected?"text-primary":"text-foreground"}`}>{formatPrice(px.local,country)}</span>
          <span className="text-[10px] text-muted-foreground">{j.minLabel}</span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM HELPERS
═══════════════════════════════════════════════════════════════ */
function SelectField({ label, value, onChange, options, placeholder }: {
  label:string; value:string; onChange:(v:string)=>void;
  options:{value:string;label:string}[]; placeholder?:string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary appearance-none cursor-pointer">
        {placeholder&&<option value="" disabled>{placeholder}</option>}
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type="text", required=false, error="" }: {
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; type?:string; required?:boolean; error?:string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
        {label}{required&&<span className="text-red-400 ms-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
          ${error?"border-red-400 focus:ring-red-300":"border-input"}`}/>
      {error&&<p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
    </div>
  );
}

function DOBPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  // Internal state — prevents each partial selection from resetting the others
  const init = value ? value.split("-") : ["", "", ""];
  const [month, setMonth] = useState(init[1] ?? "");
  const [day,   setDay  ] = useState(init[2] ?? "");
  const [year,  setYear ] = useState(init[0] ?? "");

  const emit = (y: string, m: string, d: string) => {
    if (y && m && d) onChange(`${y}-${m}-${d}`);
    else onChange("");
  };

  const months   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const days     = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const thisYear = new Date().getFullYear();
  const years    = Array.from({ length: 100 }, (_, i) => String(thisYear - 5 - i));

  const selCls = "w-full appearance-none px-3 py-3 rounded-xl border-2 border-input bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary cursor-pointer";

  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}<span className="text-red-400 ms-0.5">*</span></label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select value={month} onChange={e => { setMonth(e.target.value); emit(year, e.target.value, day); }} className={selCls}>
            <option value="" disabled>MM</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select value={day} onChange={e => { setDay(e.target.value); emit(year, month, e.target.value); }} className={selCls}>
            <option value="" disabled>DD</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative flex-[1.5]">
          <select value={year} onChange={e => { setYear(e.target.value); emit(e.target.value, month, day); }} className={selCls}>
            <option value="" disabled>YYYY</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function CheckGroup({ label, options, selected, onChange }: {
  label:string; options:string[]; selected:string[]; onChange:(s:string[])=>void;
}) {
  const toggle = (v:string) => onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o=>{
          const on=selected.includes(o);
          return (
            <button key={o} onClick={()=>toggle(o)} type="button"
              className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all
                ${on?"border-primary bg-primary text-white":"border-border bg-white hover:border-primary/40 text-foreground"}`}>
              {on&&<Check className="w-2.5 h-2.5 inline mr-1"/>}{o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","19:00"];
const SLOT_BY_PREF: Record<string,string[]> = {
  morning:   TIME_SLOTS.filter(s=>parseInt(s)<12),
  afternoon: TIME_SLOTS.filter(s=>{ const h=parseInt(s); return h>=12&&h<17; }),
  evening:   TIME_SLOTS.filter(s=>parseInt(s)>=17),
  any:       TIME_SLOTS,
};

function addMins(t: string, m: number) {
  const [h,min]=t.split(":").map(Number), tot=h*60+min+m;
  return `${String(Math.floor(tot/60)%24).padStart(2,"0")}:${String(tot%60).padStart(2,"0")}`;
}
function slotRange(start: string, dur: number){ return `${start}–${addMins(start,dur)}`; }

function formatDateLong(str:string) {
  if (!str) return "";
  const [y,m,d]=str.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
}
async function fetchSlots(pid:number,date:string):Promise<string[]> {
  try { const r=await fetch(`${BASE}/api/appointments/slots?providerId=${pid}&date=${date}`); return r.ok?(await r.json()).bookedSlots??[]:[];} catch{return [];}
}
async function bookAppointment(body:object) {
  const r=await fetch(`${BASE}/api/appointments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){const e=await r.json();throw new Error(e.error||"Booking failed");}
  return r.json();
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BookingJourney() {
  const [,navigate]  = useLocation();
  const { t, dir, lang } = useLang();
  const j            = t.journey;
  const { country: globalCountry, setCountry: setGlobalCountry } = useCountry();

  /* Phase & step */
  const [phase, setPhase] = useState(0);
  const [step,  setStep ] = useState(0);
  const [stepDir, setStepDir] = useState(1);

  /* Care type */
  const [careType, setCareType] = useState("");

  /* Screening answers — PHQ-9 only */
  const [phq9, setPhq9] = useState<Record<number,number>>({});

  /* Profile */
  const [firstName,      setFirstName     ] = useState("");
  const [lastName,       setLastName      ] = useState("");
  const [dob,            setDob           ] = useState("");
  const [gender,         setGender        ] = useState("");
  const [nationality,    setNationality   ] = useState(globalCountry.code);
  const [maritalStatus,  setMaritalStatus ] = useState("");
  const [occupation,     setOccupation    ] = useState("");
  const [education,      setEducation     ] = useState("");
  const [prevTherapy,    setPrevTherapy   ] = useState("");
  const [prevDx,         setPrevDx        ] = useState<string[]>([]);
  const [familyDx,       setFamilyDx      ] = useState<string[]>([]);
  const [medications,    setMedications   ] = useState("");
  const [emergencyName,  setEmergencyName ] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel,   setEmergencyRel  ] = useState("");

  /* Preferences */
  const [sessionFormat,  setSessionFormat ] = useState("video");
  const [providerGender, setProviderGender] = useState("any");
  const [timePref,       setTimePref      ] = useState("any");
  const [contactMethod,  setContactMethod ] = useState("email");
  const [contactDetail,  setContactDetail ] = useState("");

  /* Validation */
  const [showNameErrors,    setShowNameErrors   ] = useState(false);
  const [showProfileErrors, setShowProfileErrors] = useState(false);

  /* Booking */
  const [country,        setCountry       ] = useState<CountryPricing>(globalCountry);
  const [provider,       setProvider      ] = useState<Provider|null>(null);
  const [duration,       setDuration      ] = useState(60);
  const [date,           setDate          ] = useState("");
  const [time,           setTime          ] = useState("");
  const [promoInput,     setPromoInput    ] = useState("");
  const [promo,          setPromo         ] = useState<{code:string;pct:number}|null>(null);
  const [promoErr,       setPromoErr      ] = useState("");
  const [acceptTerms,    setAcceptTerms   ] = useState(false);
  const [bookedSlots,    setBookedSlots   ] = useState<string[]>([]);
  const [slotsLoading,   setSlotsLoading  ] = useState(false);
  const [loading,        setLoading       ] = useState(false);
  const [bookErr,        setBookErr       ] = useState("");
  const [done,           setDone          ] = useState(false);
  const [copied,         setCopied        ] = useState(false);
  const [provSearch,     setProvSearch    ] = useState("");
  const patientIdRef = useRef(generatePatientId());
  const patientId    = patientIdRef.current;

  /* Derived */
  const scores = computeScores(phq9);
  const rec    = getRecMeta(scores, careType);
  const recText = j.recommendations[rec.key];
  const nationalityCountry = COUNTRY_LIST.find(c=>c.code===nationality) ?? globalCountry;

  /* Provider data */
  const { data: allProviders=[], isLoading: providersLoading } = useListProviders({ available:true });
  const filteredProviders = (allProviders as Provider[]).filter(p => {
    const spec = p.specialty.toLowerCase()+" "+p.title.toLowerCase();
    return (rec.specialty ? spec.includes(rec.specialty.toLowerCase()) : true)
      && (!provSearch || p.name.toLowerCase().includes(provSearch.toLowerCase()) || spec.includes(provSearch.toLowerCase()));
  });
  const otherProviders = provSearch ? [] : (allProviders as Provider[]).filter(p => {
    const spec = p.specialty.toLowerCase()+" "+p.title.toLowerCase();
    return rec.specialty ? !spec.includes(rec.specialty.toLowerCase()) : false;
  });

  /* Pricing */
  const baseUSD  = provider?.sessionPrice ?? 50;
  const { local } = getSessionPrice(baseUSD, duration, country);
  const discAmt  = promo ? Math.round(local*promo.pct) : 0;
  const total    = local - discAmt;

  /* Slot fetch */
  useEffect(()=>{
    if(!date||!provider)return;
    setSlotsLoading(true); setTime("");
    fetchSlots(provider.id,date).then(s=>{setBookedSlots(s);setSlotsLoading(false);});
  },[date,provider]);

  /* Auto-select first available slot matching timePref */
  useEffect(()=>{
    if(slotsLoading||!date||!provider||time)return;
    const preferred = SLOT_BY_PREF[timePref]??TIME_SLOTS;
    const firstAvail = preferred.find(s=>!bookedSlots.includes(s));
    if(firstAvail) setTime(firstAvail);
  },[slotsLoading,bookedSlots,timePref,date,provider]);

  /* Sync nationality → country */
  useEffect(()=>{
    const c=COUNTRY_LIST.find(x=>x.code===nationality);
    if(c){setCountry(c);setGlobalCountry(c);}
  },[nationality]);

  /* Navigation helpers */
  const go = useCallback((d:number) => {
    setStepDir(d); setStep(s=>s+d);
    window.scrollTo({top:0,behavior:"smooth"});
  },[]);
  const nextPhase = useCallback(()=>{
    setStepDir(1); setPhase(p=>p+1); setStep(0);
    window.scrollTo({top:0,behavior:"smooth"});
  },[]);
  const prevPhase = useCallback(()=>{
    setStepDir(-1); setPhase(p=>p-1); setStep(999);
  },[]);

  /* Questionnaire auto-advance — PHQ-9 only (steps 2–10, then 11=results) */
  const answerPhq9 = useCallback((qi:number,val:number)=>{
    setPhq9(prev=>({...prev,[qi]:val}));
    setTimeout(()=>{
      setStepDir(1);
      if(qi<8) setStep(2+qi+1);
      else { setPhase(p=>p+1); setStep(0); }
    },380);
  },[]);

  /* Promo */
  const applyPromo = () => {
    const up=promoInput.trim().toUpperCase();
    const pct=PROMO_CODES[up];
    if(pct){setPromo({code:up,pct});setPromoErr("");}
    else{setPromo(null);setPromoErr(j.invalidPromo);}
  };

  const ADMIN_WA = "962770403270";

  /* Go to Checkout with all collected journey data pre-filled */
  const goToCheckout = useCallback(() => {
    if (!provider || !date || !time) return;
    const diagnosis = buildDiagnosisSummary({ scores, rec, careType, prevDx, familyDx, prevTherapy, medications });
    const p = new URLSearchParams({
      provider: String(provider.id),
      date,
      time,
      duration: String(duration),
      name: `${firstName} ${lastName}`.trim(),
      phone: contactMethod === "whatsapp" ? contactDetail : "",
      email: contactMethod === "email" ? contactDetail : "",
      country: nationality,
      pid: patientId,
      careType,
      diagnosis,
      ...(promo ? { promo: promo.code } : {}),
    });
    navigate(`/checkout?${p.toString()}`);
  }, [provider, date, time, duration, firstName, lastName, contactMethod, contactDetail, nationality, patientId, careType, promo, navigate, scores, rec, prevDx, familyDx, prevTherapy, medications]);

  /* handleBook kept for legacy/direct use (no longer called from the journey UI) */
  const handleBook = async () => {
    if(!provider||!date||!time)return;
    setLoading(true); setBookErr("");
    try {
      await bookAppointment({
        patientName:  patientId,
        patientEmail: contactMethod==="email" ? contactDetail : `patient+${patientId.toLowerCase()}@clearhead.app`,
        providerId: provider.id, date, time, type: sessionFormat,
        notes:[
          `PatientID:${patientId}`,
          `Name:${firstName} ${lastName}`,
          `Contact:${contactDetail}`,
          promo?`Promo:${promo.code}`:"",
          careType, prevDx.join(", "),
        ].filter(Boolean).join(" | "),
      });
      setDone(true);
    } catch(e:any){setBookErr(e.message);}
    finally{setLoading(false);}
  };

  /* ─── SUCCESS ─── */
  const adminMsg = provider ? [
    `🏥 *New Clearhead Booking — Pending Approval*`,
    `Patient ID: *${patientId}*`,
    `Provider: *${provider.name}*`,
    `Date: ${formatDateLong(date)} at ${time}`,
    `Duration: ${duration} min`,
    `Care type: ${careType}`,
    ``,
    `Reply APPROVE or REJECT.`,
  ].join("\n") : "";

  if (done) return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex items-center justify-center px-4">
      <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.1}}
            className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-amber-600"/>
          </motion.div>
          <h2 className="font-serif text-2xl font-bold mb-1">{j.successTitle}</h2>
          <p className="text-muted-foreground text-sm mb-3">{j.successSub} <span className="font-semibold">{provider?.name}</span></p>

          {/* Patient ID badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Hash className="w-4 h-4 text-primary"/>
            <span className="font-mono font-bold text-primary tracking-wider">{patientId}</span>
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 text-start space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Patient ID</span><span className="font-mono font-bold text-primary">{patientId}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{j.successDateLabel}</span><span className="font-medium">{formatDateLong(date)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{j.successTimeLabel}</span><span className="font-medium">{slotRange(time,duration)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{j.successDurationLabel}</span><span className="font-medium">{duration} {j.minuteLabel}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Video call</span><span className="font-medium flex items-center gap-1"><Video className="w-3.5 h-3.5 text-primary"/>Video session</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>{j.successTotalLabel}</span><span className="text-primary">{formatPrice(total,country)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(adminMsg)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold hover:brightness-105 shadow">
              <MessageCircle className="w-5 h-5"/> Notify admin for approval
            </a>
            <button onClick={()=>navigate("/")} className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold hover:opacity-90">
              {j.homeBtn}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  /* ─── MAIN LAYOUT ─── */
  const isWide = phase===3&&step===0;
  const maxW   = isWide?"max-w-3xl":"max-w-xl";

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex flex-col">

      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-base tracking-tight flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white"/>
            </div>
            <span className="hidden sm:block">Clearhead</span>
          </Link>
          <div className="flex-1 max-w-sm"><PhaseHeader phase={phase}/></div>
          <Link href="/providers" className="text-xs text-muted-foreground hover:text-primary transition-colors hidden sm:block">
            {j.browseProviders}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col ${maxW} mx-auto w-full px-4 py-8 pb-24 transition-all duration-300`}>
        <AnimatePresence mode="wait" custom={stepDir}>
          <motion.div key={`${phase}-${step}`} custom={stepDir} variants={slideV}
            initial="enter" animate="center" exit="exit"
            transition={{duration:0.24,ease:"easeOut"}}>

            {/* ══════════════════════════════════════════
                PHASE 0 — SCREENING
            ══════════════════════════════════════════ */}
            {phase===0&&(
              <>
                {/* Step 0: Care type */}
                {step===0&&(
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{j.careTypePhase}</p>
                      <h2 className="font-serif text-3xl font-bold text-foreground mb-2">{j.careTypeTitle}</h2>
                      <p className="text-muted-foreground">{j.careTypeSubtitle}</p>
                    </div>
                    <div className="grid gap-3">
                      {j.careTypes.map(o=>{
                        const icons:Record<string,React.ElementType> = {individual:Brain,couples:Users,children:Baby};
                        const Icon = icons[o.id]||Brain;
                        const sel = careType===o.id;
                        return (
                          <button key={o.id} onClick={()=>setCareType(o.id)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                              ${sel?"border-primary bg-primary/5 shadow-md":"border-border bg-white hover:border-primary/40"}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${sel?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
                              <Icon className="w-6 h-6"/>
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold ${sel?"text-primary":"text-foreground"}`}>{o.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
                            </div>
                            {sel&&<Check className="w-5 h-5 text-primary flex-shrink-0"/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Steps 2–10: PHQ-9 questions */}
                {step>=2&&step<=10&&(()=>{
                  const qi=step-2;
                  return (
                    <QCard qNum={qi+1} qTotal={9}>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">{j.phq9Badge}</p>
                      <p className="text-sm text-muted-foreground mb-1">{j.phq9Header}</p>
                      <p className="font-serif text-xl font-semibold text-foreground leading-snug">{j.phq9Qs[qi]}</p>
                      {qi===8&&(
                        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">{j.phq9CrisisNote}</div>
                      )}
                      <LikertRow scale={j.phqScale} selected={phq9[qi]} onSelect={v=>answerPhq9(qi,v)} cols={4}/>
                    </QCard>
                  );
                })()}

              </>
            )}

            {/* ══════════════════════════════════════════
                PHASE 1 — PROFILE
            ══════════════════════════════════════════ */}
            {phase===1&&(
              <>
                {step===0&&(
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{j.profilePhase}</p>
                      <h2 className="font-serif text-2xl font-bold mb-1">{j.profileTitle}</h2>
                      <p className="text-muted-foreground text-sm">{j.profileSubtitle}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField label={j.firstNameLabel} value={firstName} onChange={v=>{setFirstName(v);if(v.trim())setShowNameErrors(false);}} placeholder={j.firstNamePH} required
                          error={showNameErrors&&!firstName.trim()?j.nameRequired??"Required":""}/>
                        <TextField label={j.lastNameLabel}  value={lastName}  onChange={v=>{setLastName(v);if(v.trim())setShowNameErrors(false);}}  placeholder={j.lastNamePH}  required
                          error={showNameErrors&&!lastName.trim()?j.nameRequired??"Required":""}/>
                      </div>
                      <div>
                        <DOBPicker label={j.dobLabel} value={dob} onChange={v=>{setDob(v);if(v)setShowProfileErrors(false);}}/>
                        {showProfileErrors&&!dob&&<p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Required</p>}
                      </div>
                      <div>
                        <SelectField label={j.genderLabel} value={gender} onChange={v=>{setGender(v);if(v)setShowProfileErrors(false);}} options={j.genderOpts} placeholder="—"/>
                        {showProfileErrors&&!gender&&<p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Required</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{j.nationalityLabel}</label>
                        <select value={nationality} onChange={e=>setNationality(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                          {COUNTRY_LIST.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>)}
                        </select>
                      </div>
                      <div>
                        <SelectField label={j.maritalLabel} value={maritalStatus} onChange={v=>{setMaritalStatus(v);if(v)setShowProfileErrors(false);}} options={j.maritalOpts} placeholder="—"/>
                        {showProfileErrors&&!maritalStatus&&<p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Required</p>}
                      </div>
                      <div>
                        <TextField label={j.occupationLabel} value={occupation} onChange={v=>{setOccupation(v);if(v.trim())setShowProfileErrors(false);}} placeholder={j.occupationPH} required
                          error={showProfileErrors&&!occupation.trim()?"Required":""}/>
                      </div>
                      <div>
                        <SelectField label={j.educationLabel} value={education} onChange={v=>{setEducation(v);if(v)setShowProfileErrors(false);}} options={j.educationOpts} placeholder="—"/>
                        {showProfileErrors&&!education&&<p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Required</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step===1&&(
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">{j.medTitle}</h2>
                      <p className="text-muted-foreground text-sm">{j.medSubtitle}</p>
                    </div>

                    {/* Therapy history — single select grid */}
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4 text-primary"/>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{j.prevTherapyLabel}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {j.therapyOpts.map(o=>{
                          const sel=prevTherapy===o.value;
                          return (
                            <button key={o.value} type="button" onClick={()=>setPrevTherapy(o.value)}
                              className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left text-xs font-medium transition-all leading-snug
                                ${sel?"border-primary bg-primary/5 text-primary":"border-border bg-white hover:border-primary/30 text-foreground"}`}>
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                                ${sel?"border-primary bg-primary":"border-muted-foreground/40"}`}>
                                {sel&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                              </div>
                              <span>{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Previous diagnoses — multi-select chips */}
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-blue-500"/>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{j.prevDxLabel}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {j.prevDxOptions.map(o=>{
                          const on=prevDx.includes(o);
                          return (
                            <button key={o} type="button"
                              onClick={()=>setPrevDx(prev=>on?prev.filter(x=>x!==o):[...prev,o])}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 text-xs font-medium transition-all
                                ${on?"border-primary bg-primary text-white":"border-border bg-white hover:border-primary/40 text-foreground"}`}>
                              {on&&<Check className="w-3 h-3 flex-shrink-0"/>}{o}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Family history — multi-select chips */}
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-amber-500"/>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{j.familyDxLabel}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {j.familyDxOptions.map(o=>{
                          const on=familyDx.includes(o);
                          return (
                            <button key={o} type="button"
                              onClick={()=>setFamilyDx(prev=>on?prev.filter(x=>x!==o):[...prev,o])}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 text-xs font-medium transition-all
                                ${on?"border-primary bg-primary text-white":"border-border bg-white hover:border-primary/40 text-foreground"}`}>
                              {on&&<Check className="w-3 h-3 flex-shrink-0"/>}{o}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Medications — single select grid */}
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Leaf className="w-4 h-4 text-emerald-600"/>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{j.medsLabel}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {j.medicationOpts.map(o=>{
                          const sel=medications===o.value;
                          return (
                            <button key={o.value} type="button" onClick={()=>setMedications(o.value)}
                              className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left text-xs font-medium transition-all leading-snug
                                ${sel?"border-primary bg-primary/5 text-primary":"border-border bg-white hover:border-primary/30 text-foreground"}`}>
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                                ${sel?"border-primary bg-primary":"border-muted-foreground/40"}`}>
                                {sel&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                              </div>
                              <span>{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </>
            )}

            {/* ══════════════════════════════════════════
                PHASE 2 — PREFERENCES
            ══════════════════════════════════════════ */}
            {phase===2&&step===0&&(
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{j.prefsPhase}</p>
                  <h2 className="font-serif text-2xl font-bold mb-1">{j.prefsTitle}</h2>
                  <p className="text-muted-foreground text-sm">{j.prefsSubtitle}</p>
                </div>
                <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{j.formatLabel}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {j.formatOpts.map(o=>{
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
                <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                  <SelectField label={j.providerGenderLabel} value={providerGender} onChange={setProviderGender} options={j.providerGenderOpts}/>
                  <SelectField label={j.timePrefLabel}       value={timePref}       onChange={setTimePref}       options={j.timeOpts}/>
                </div>
                <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{j.contactLabel}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {j.contactOpts.map(o=>{
                      const sel=contactMethod===o.value;
                      return (
                        <button key={o.value} onClick={()=>setContactMethod(o.value)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                            ${sel?"border-primary bg-primary/5":"border-border bg-white hover:border-primary/30"}`}>
                          <span className="text-xl">{o.icon}</span>
                          <span className={`text-sm font-semibold ${sel?"text-primary":"text-foreground"}`}>{o.label}</span>
                          {sel&&<Check className="w-4 h-4 text-primary ms-auto"/>}
                        </button>
                      );
                    })}
                  </div>
                  {contactMethod==="whatsapp"?(
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        {j.whatsappInputLabel}<span className="text-red-400 ms-0.5">*</span>
                      </label>
                      <div className="flex gap-2 items-stretch">
                        <div className="flex items-center gap-1.5 px-3 rounded-xl border-2 border-input bg-muted text-sm font-mono flex-shrink-0 select-none">
                          <span>{nationalityCountry.flag}</span>
                          <span className="text-muted-foreground font-semibold">{nationalityCountry.dialCode}</span>
                        </div>
                        <input type="tel" value={contactDetail}
                          onChange={e=>setContactDetail(e.target.value.replace(/\D/g,""))}
                          placeholder={j.whatsappPH}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
                            ${contactDetail.trim()&&contactDetail.replace(/\D/g,"").length<7?"border-red-400 bg-red-50":"border-input"}`}/>
                      </div>
                      {contactDetail.trim()&&contactDetail.replace(/\D/g,"").length<7&&(
                        <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Enter a valid phone number (digits only)</p>
                      )}
                      {!contactDetail.trim()&&(
                        <p className="text-[11px] text-muted-foreground mt-1">{nationalityCountry.dialCode} + {j.localNumberHint??"local number"}</p>
                      )}
                    </div>
                  ):(
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        {j.emailInputLabel}
                        <span className="text-muted-foreground font-normal ms-1">({lang==="ar"?"اختياري":"optional"})</span>
                      </label>
                      <input type="email" value={contactDetail} onChange={e=>setContactDetail(e.target.value)}
                        placeholder={j.emailPH}
                        className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
                          ${contactDetail.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetail.trim())?"border-amber-400 bg-amber-50":"border-input"}`}/>
                      {contactDetail.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetail.trim())&&(
                        <p className="text-amber-600 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Use a valid format: name@domain.com</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                PHASE 3 — BOOKING
            ══════════════════════════════════════════ */}
            {phase===3&&(
              <>
                {/* Step 0: Provider grid */}
                {step===0&&(
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{j.bookingPhase}</p>
                      <h2 className="font-serif text-2xl font-bold mb-1">{j.bookingTitle}</h2>
                      {recText&&(
                        <p className="text-sm text-muted-foreground">
                          {j.bookingSubtitleBase} <span className="font-semibold text-foreground">{recText.label}</span>.
                          {nationalityCountry&&<> {j.bookingSubtitleCurrency} <span className="font-semibold">{nationalityCountry.currency}</span>.</>}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                      <input value={provSearch} onChange={e=>setProvSearch(e.target.value)} placeholder={j.searchPH}
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                    </div>

                    {/* Loading skeleton */}
                    {providersLoading&&(
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[1,2,3,4,5,6].map(i=>(
                          <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden animate-pulse">
                            <div className="w-full h-40 bg-muted"/>
                            <div className="p-3.5 space-y-2">
                              <div className="h-3 bg-muted rounded w-3/4"/>
                              <div className="h-2.5 bg-muted rounded w-1/2"/>
                              <div className="h-2.5 bg-muted rounded w-2/3"/>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Provider lists */}
                    {!providersLoading&&(
                      <div className="space-y-5">
                        {filteredProviders.length>0&&(
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-amber-500"/>
                              <span className="text-sm font-semibold">{j.recommendedSection}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {filteredProviders.map(p=>(
                                <ProviderCard key={p.id} p={p} selected={provider?.id===p.id} onSelect={()=>setProvider(p)} country={nationalityCountry} recommended/>
                              ))}
                            </div>
                          </div>
                        )}
                        {otherProviders.length>0&&(
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1 h-px bg-border"/>
                              <span className="text-xs text-muted-foreground font-medium">{j.otherSection}</span>
                              <div className="flex-1 h-px bg-border"/>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {otherProviders.map(p=>(
                                <ProviderCard key={p.id} p={p} selected={provider?.id===p.id} onSelect={()=>setProvider(p)} country={nationalityCountry} recommended={false}/>
                              ))}
                            </div>
                          </div>
                        )}
                        {(allProviders as Provider[]).length>0&&filteredProviders.length===0&&otherProviders.length===0&&(
                          <div className="text-center py-16 text-muted-foreground text-sm">{j.noProviders}</div>
                        )}
                        {(allProviders as Provider[]).length===0&&!providersLoading&&(
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                              <Search className="w-5 h-5 text-muted-foreground/60"/>
                            </div>
                            <p>{j.noProviders}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {provider&&(
                      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                        <img src={provider.imageUrl} alt={provider.name} className="w-8 h-8 rounded-lg object-cover"/>
                        <span className="text-sm font-semibold text-primary">{provider.name} {j.selectedSuffix}</span>
                        <Check className="w-4 h-4 text-primary ms-auto"/>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 1: Duration */}
                {step===1&&(
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">{j.durationTitle}</h2>
                      <p className="text-muted-foreground text-sm">{j.durationSubtitleBase} {nationalityCountry.currency} {j.durationSubtitleNationality}</p>
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
                            <div className="text-xs text-muted-foreground mb-3">{j.minuteLabel}</div>
                            <div className={`font-semibold text-sm ${sel?"text-primary":"text-foreground"}`}>{formatPrice(px.local,nationalityCountry)}</div>
                            {nationalityCountry.code!=="US"&&<div className="text-[10px] text-muted-foreground">≈${px.usd}</div>}
                            {d.minutes===90&&<div className="text-[10px] text-emerald-600 font-semibold mt-1">{j.bestValue}</div>}
                            {sel&&<Check className="w-4 h-4 text-primary mt-2"/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Date */}
                {step===2&&(
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">{j.dateTitle}</h2>
                      <p className="text-muted-foreground text-sm">{j.dateSubtitle}</p>
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
                {step===3&&(()=>{
                  const prefSlots  = timePref==="any"?[]:SLOT_BY_PREF[timePref]??[];
                  const otherSlots = TIME_SLOTS.filter(s=>!prefSlots.includes(s));
                  const prefLabel  = j.timeOpts?.find((o:{value:string;label:string})=>o.value===timePref)?.label ?? "";
                  const SlotBtn = ({slot}:{slot:string})=>{
                    const booked=bookedSlots.includes(slot),sel=time===slot;
                    const range=slotRange(slot,duration);
                    return (
                      <button key={slot} disabled={booked} onClick={()=>!booked&&setTime(slot)}
                        className={`py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all leading-tight text-center
                          ${sel?"border-primary bg-primary text-white shadow-md":""}
                          ${booked?"border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed":""}
                          ${!booked&&!sel?"border-border bg-white hover:border-primary/40 hover:-translate-y-0.5 text-foreground":""}`}>
                        {booked
                          ?<span className="flex flex-col items-center gap-0.5"><X className="w-3.5 h-3.5 text-red-400"/><span className="text-[9px] line-through">{slot}</span></span>
                          :range}
                      </button>
                    );
                  };
                  return (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-serif text-2xl font-bold mb-1">{j.timePickTitle}</h2>
                        <p className="text-muted-foreground text-sm">{date?`${j.timePickSubtitleBase} ${formatDateLong(date)}`:j.timePickDateFirst}</p>
                      </div>
                      {slotsLoading?(
                        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground text-sm">
                          <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
                          {j.checkingSlots}
                        </div>
                      ):(
                        <div className="space-y-4">
                          {bookedSlots.length>0&&(
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <X className="w-3 h-3 text-red-400"/>
                              {bookedSlots.length} {bookedSlots.length>1?j.bookedSlotsPluralNote:j.bookedSlotsNote}
                            </div>
                          )}

                          {/* Preferred slots section */}
                          {prefSlots.length>0&&(
                            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/15 space-y-2">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm">⭐</span>
                                <span className="text-xs font-semibold text-primary uppercase tracking-widest">{j.preferredTimesLabel??"Your preferred time"} · {prefLabel}</span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {prefSlots.map(slot=><SlotBtn key={slot} slot={slot}/>)}
                              </div>
                            </div>
                          )}

                          {/* Other slots */}
                          {(timePref==="any"?TIME_SLOTS:otherSlots).length>0&&(
                            <div className="space-y-2">
                              {timePref!=="any"&&(
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-px bg-border"/>
                                  <span className="text-xs text-muted-foreground font-medium">{j.otherTimesLabel??"Other times"}</span>
                                  <div className="flex-1 h-px bg-border"/>
                                </div>
                              )}
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {(timePref==="any"?TIME_SLOTS:otherSlots).map(slot=><SlotBtn key={slot} slot={slot}/>)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {time&&(
                        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                          <Calendar className="w-4 h-4 text-primary"/>
                          <span className="text-sm font-medium text-primary">{slotRange(time,duration)}</span>
                          <Check className="w-4 h-4 text-primary ms-auto"/>
                        </motion.div>
                      )}
                    </div>
                  );
                })()}

                {/* Step 4: Review */}
                {step===4&&(
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold mb-1">{j.reviewTitle}</h2>
                      <p className="text-muted-foreground text-sm">{j.reviewSubtitle}</p>
                    </div>
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
                        <div className="text-end">
                          <div className="text-sm font-bold text-primary">{formatPrice(getSessionPrice(baseUSD,duration,nationalityCountry).local,nationalityCountry)}</div>
                          <div className="text-xs text-muted-foreground">{duration} {j.minuteLabel}</div>
                        </div>
                      </div>
                    )}
                    <div className="bg-white border border-border rounded-2xl p-4 space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">{j.patientLabel}</span><span className="font-medium">{firstName} {lastName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{j.reviewDateLabel}</span><span className="font-medium">{formatDateLong(date)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{j.reviewTimeLabel}</span><span className="font-medium">{slotRange(time,duration)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{j.reviewFormatLabel}</span><span className="font-medium capitalize">{sessionFormat}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{j.reviewCountryLabel}</span><span className="font-medium">{nationalityCountry.flag} {nationalityCountry.name}</span></div>
                      <div className="border-t border-border pt-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <Tag className="w-3 h-3"/> {j.promoLabel} <span className="font-normal">({j.promoOptional})</span>
                          </label>
                          <div className="flex gap-2">
                            <input value={promoInput} onChange={e=>{setPromoInput(e.target.value.toUpperCase());setPromoErr("");}}
                              placeholder={j.promoPH}
                              className="flex-1 px-3 py-2 rounded-xl border-2 border-input bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
                            <button onClick={applyPromo} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">{j.applyBtn}</button>
                          </div>
                          {promoErr&&<p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{promoErr}</p>}
                          {promo&&<p className="text-emerald-600 text-xs mt-1 flex items-center gap-1"><Check className="w-3 h-3"/><b>{promo.code}</b> — {Math.round(promo.pct*100)}% {j.invalidPromo==="Invalid promo code"?"applied":"مطبّق"}</p>}
                        </div>
                        <div className="flex justify-between mt-3"><span className="text-muted-foreground">{j.sessionFee}</span><span className="font-medium">{formatPrice(local,nationalityCountry)}</span></div>
                        {promo&&<div className="flex justify-between text-emerald-600"><span>{j.discountLabel} ({promo.code})</span><span>−{formatPrice(discAmt,nationalityCountry)}</span></div>}
                        <div className="flex justify-between font-bold mt-1 text-base"><span>{j.totalLabel}</span><span className="text-primary">{formatPrice(total,nationalityCountry)}</span></div>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div onClick={()=>setAcceptTerms(v=>!v)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                          ${acceptTerms?"border-primary bg-primary":"border-input group-hover:border-primary/50"}`}>
                        {acceptTerms&&<Check className="w-3 h-3 text-white"/>}
                      </div>
                      <span className="text-xs text-foreground/70 leading-relaxed">{j.termsText}</span>
                    </label>
                    {bookErr&&(
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0"/> {bookErr}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-primary"/> {j.securityNote}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Fixed bottom navigation ──────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-border/60 px-4 py-3 z-10">
        <div className={`${maxW} mx-auto flex items-center gap-3`}>
          {(phase>0||step>0)?(
            <button onClick={()=>{ if(step>0){setStepDir(-1); const prev=phase===0&&step===2?0:step-1; setStep(prev);}else prevPhase();}}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all flex-shrink-0">
              <ArrowLeft className="w-4 h-4"/> {j.backBtn}
            </button>
          ):(
            <Link href="/" className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border bg-white text-foreground font-semibold text-sm hover:border-primary/40 transition-all flex-shrink-0">
              <ArrowLeft className="w-4 h-4"/> {j.homeNavBtn}
            </Link>
          )}

          {(()=>{
            const isScreeningQ = phase===0&&(step>=2&&step<=10);
            if(isScreeningQ) return <div className="flex-1 text-center text-xs text-muted-foreground">{j.tapToAnswer}</div>;

            const canContinue = (()=>{
              if(phase===0&&step===0)  return !!careType;
              if(phase===0)            return true;
              if(phase===1&&step===0)  return !!(firstName.trim()&&lastName.trim()&&dob&&gender&&maritalStatus&&occupation.trim()&&education);
              if(phase===1)            return true;
              if(phase===2) {
                if(contactMethod==="whatsapp") return contactDetail.replace(/\D/g,"").length>=7;
                return !contactDetail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetail.trim());
              }
              if(phase===3&&step===0)  return !!provider && !providersLoading;
              if(phase===3&&step===1)  return !!duration;
              if(phase===3&&step===2)  return !!date;
              if(phase===3&&step===3)  return !!time;
              if(phase===3&&step===4)  return acceptTerms;
              return false;
            })();

            const isLastInPhase = (phase===1&&step===1)||(phase===2&&step===0);
            const isBookStep    = phase===3&&step===4;

            const label = (()=>{
              if(phase===0&&step===0)  return j.careTypeStart;
              if(phase===1&&step===1)  return j.continueToPrefs;
              if(phase===2&&step===0)  return j.findProvider;
              if(phase===3&&step===3)  return j.reviewBookingBtn;
              if(isBookStep)           return (j as unknown as Record<string, unknown>)["proceedToPayment"] as string ?? "Proceed to Payment →";
              return j.continueBtn;
            })();

            return (
              <button
                onClick={()=>{
                  if(isBookStep){ goToCheckout(); return; }
                  if(phase===1&&step===0){
                    const profileOk = firstName.trim()&&lastName.trim()&&dob&&gender&&maritalStatus&&occupation.trim()&&education;
                    if(!profileOk){ setShowNameErrors(true); setShowProfileErrors(true); window.scrollTo({top:0,behavior:"smooth"}); return; }
                    setShowNameErrors(false); setShowProfileErrors(false);
                  }
                  if(isLastInPhase) nextPhase();
                  else{
                    setStepDir(1);
                    /* Skip the removed PHQ-9 intro step (step 1) */
                    const next = phase===0&&step===0 ? 2 : step+1;
                    setStep(next);
                    window.scrollTo({top:0,behavior:"smooth"});
                  }
                }}
                disabled={!canContinue}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                  ${canContinue?"bg-primary text-white hover:opacity-90 hover:-translate-y-0.5 shadow-md":"bg-muted text-muted-foreground cursor-not-allowed"}`}>
                {null}
                {label} {canContinue&&!isBookStep&&<ArrowRight className="w-4 h-4"/>}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

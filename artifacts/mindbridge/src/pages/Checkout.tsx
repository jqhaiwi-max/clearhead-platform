import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Tag, Clock, Calendar, ChevronLeft, ChevronRight,
  Star, Shield, Zap, AlertCircle, X, MessageCircle, Mail, Copy,
  Check, CreditCard, Smartphone, Video, User, Hash,
} from "lucide-react";
import { useGetProvider } from "@workspace/api-client-react";
import { useCountry } from "@/context/CountryContext";
import { useLang } from "@/context/LanguageContext";
import { SESSION_DURATIONS, PROMO_CODES, getSessionPrice } from "@/lib/pricing";

/* ─── Helpers ─────────────────────────────────────── */
function generatePatientId(): string {
  const prefix = "CLR";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${num}`;
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function formatSlotRange(start: string, durationMins: number): string {
  return `${start} – ${addMinutes(start, durationMins)}`;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "19:00",
];

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const ADMIN_WHATSAPP = "00962770403270";
const ADMIN_EMAIL    = "jamal_alqhaiwi@yahoo.com";

type PayMethod = "credit" | "zain" | "orange" | "clickpay";

/* ─── Calendar ─────────────────────────────────────── */
function CalendarGrid({ selectedDate, onSelect }: { selectedDate: string; onSelect: (d: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };
  const pad = (n: number) => String(n).padStart(2,"0");
  const toValue = (day: number) => `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`;
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth= new Date(viewYear, viewMonth+1, 0).getDate();
  const isPast     = (d: number) => new Date(viewYear,viewMonth,d) < today;
  const isTooFar   = (d: number) => { const max=new Date(today); max.setDate(today.getDate()+60); return new Date(viewYear,viewMonth,d)>max; };
  const isToday    = (d: number) => new Date(viewYear,viewMonth,d).getTime()===today.getTime();

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4"/></button>
        <span className="font-semibold text-foreground">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4"/></button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d=><div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({length:firstDay},(_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:daysInMonth},(_,i)=>{
          const day=i+1, value=toValue(day);
          const disabled=isPast(day)||isTooFar(day);
          const selected=value===selectedDate;
          const todayMark=isToday(day);
          return (
            <button key={day} disabled={disabled} onClick={()=>!disabled&&onSelect(value)}
              className={`mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${selected?"bg-primary text-primary-foreground shadow-md":""}
                ${!selected&&todayMark?"border-2 border-primary text-primary":""}
                ${!selected&&!disabled&&!todayMark?"hover:bg-primary/10 text-foreground":""}
                ${disabled?"text-muted-foreground/40 cursor-not-allowed":"cursor-pointer"}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── API helpers ───────────────────────────────────── */
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function fetchBookedSlots(providerId: number, date: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/appointments/slots?providerId=${providerId}&date=${date}`);
    if (!res.ok) return [];
    return (await res.json()).bookedSlots ?? [];
  } catch { return []; }
}

async function createAppointment(body: object): Promise<{id:number}|null> {
  const res = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Booking failed"); }
  return res.json();
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const [y,m,d] = dateStr.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}

/* ─── Payment section ──────────────────────────────── */
function PaymentSection({ method, setMethod, cardNum, setCardNum, cardExp, setCardExp, cardCvv, setCardCvv, cardName, setCardName, walletNum, setWalletNum, tc }: {
  method: PayMethod; setMethod: (m: PayMethod) => void;
  cardNum: string; setCardNum: (v: string) => void;
  cardExp: string; setCardExp: (v: string) => void;
  cardCvv: string; setCardCvv: (v: string) => void;
  cardName: string; setCardName: (v: string) => void;
  walletNum: string; setWalletNum: (v: string) => void;
  tc: ReturnType<typeof useLang>["t"]["checkout"];
}) {
  const methods: {id: PayMethod; label: string; icon: React.ReactNode; color: string}[] = [
    { id: "credit",   label: tc.payCredit,   icon: <CreditCard className="w-5 h-5"/>, color: "text-blue-600" },
    { id: "clickpay", label: tc.payClickPay, icon: <span className="text-base font-bold">🇯🇴</span>,        color: "text-green-700" },
    { id: "zain",     label: tc.payZain,     icon: <Smartphone className="w-5 h-5"/>,  color: "text-violet-600" },
    { id: "orange",   label: tc.payOrange,   icon: <Smartphone className="w-5 h-5"/>,  color: "text-orange-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {methods.map(m=>(
          <button key={m.id} onClick={()=>setMethod(m.id)}
            className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all
              ${method===m.id?"border-primary bg-primary/5":"border-border hover:border-primary/30 bg-card"}`}>
            <span className={method===m.id?"text-primary":m.color}>{m.icon}</span>
            <span className={method===m.id?"text-primary":"text-foreground"}>{m.label}</span>
            {method===m.id&&<Check className="w-4 h-4 text-primary ms-auto"/>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {(method==="credit"||method==="clickpay") && (
          <motion.div key="card" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{method==="clickpay"?"ClickPay · Jordan":"Secure Card Payment"}</span>
              <div className="flex gap-2">
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">VISA</span>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">MC</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">{tc.cardNumber}</label>
              <input value={cardNum} onChange={e=>setCardNum(e.target.value.replace(/\D/g,"").slice(0,16))}
                placeholder="•••• •••• •••• ••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:border-white/50 tracking-widest"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">{tc.cardExpiry}</label>
                <input value={cardExp} onChange={e=>setCardExp(e.target.value)} placeholder="MM / YY"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/50"/>
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1.5">{tc.cardCvv}</label>
                <input value={cardCvv} onChange={e=>setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/50"/>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">{tc.cardName}</label>
              <input value={cardName} onChange={e=>setCardName(e.target.value)} placeholder="Full name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/50"/>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Shield className="w-3.5 h-3.5 text-white/40"/>
              <span className="text-xs text-white/40">256-bit SSL encrypted · PCI-DSS compliant</span>
            </div>
          </motion.div>
        )}

        {(method==="zain"||method==="orange") && (
          <motion.div key="wallet" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className={`rounded-2xl p-5 space-y-3 border-2 ${method==="zain"?"border-violet-200 bg-violet-50":"border-orange-200 bg-orange-50"}`}>
            <div className="flex items-center gap-2">
              <Smartphone className={`w-5 h-5 ${method==="zain"?"text-violet-600":"text-orange-500"}`}/>
              <span className={`font-semibold text-sm ${method==="zain"?"text-violet-700":"text-orange-700"}`}>
                {method==="zain"?"Zain Cash — Jordan":"Orange Money — Jordan"}
              </span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">{tc.walletNumber}</label>
              <input value={walletNum} onChange={e=>setWalletNum(e.target.value)} placeholder="+962 7X XXX XXXX" type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
            </div>
            <p className="text-xs text-muted-foreground">
              {method==="zain"
                ? "You'll receive a USSD prompt on your Zain line to approve the payment."
                : "You'll receive a confirmation SMS on your Orange line to approve the payment."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */
export default function Checkout() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const providerId      = parseInt(params.get("provider") || "1");
  const initialDuration = parseInt(params.get("duration") || "60");

  const { country } = useCountry();
  const { t, dir }  = useLang();
  const tc          = t.checkout;
  const { data: provider } = useGetProvider(providerId, { query: { enabled: !!providerId } });

  /* Stable patient ID for this session */
  const patientIdRef = useRef(generatePatientId());
  const patientId    = patientIdRef.current;

  const [duration,      setDuration]      = useState(initialDuration);
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("");
  const [bookedSlots,   setBookedSlots]   = useState<string[]>([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);

  const [patientName,   setPatientName]   = useState("");
  const [patientEmail,  setPatientEmail]  = useState("");
  const [patientPhone,  setPatientPhone]  = useState("");

  const [promoInput,    setPromoInput]    = useState("");
  const [appliedCode,   setAppliedCode]   = useState<{code:string;discount:number}|null>(null);
  const [promoError,    setPromoError]    = useState("");
  const [acceptTerms,   setAcceptTerms]   = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [bookingResult, setBookingResult] = useState<{id:number;date:string;time:string}|null>(null);
  const [loading,       setLoading]       = useState(false);
  const [bookingError,  setBookingError]  = useState("");
  const [copied,        setCopied]        = useState(false);

  /* Payment */
  const [payMethod,  setPayMethod]  = useState<PayMethod>("credit");
  const [cardNum,    setCardNum]    = useState("");
  const [cardExp,    setCardExp]    = useState("");
  const [cardCvv,    setCardCvv]    = useState("");
  const [cardName,   setCardName]   = useState("");
  const [walletNum,  setWalletNum]  = useState("");

  const basePrice  = provider?.sessionPrice ?? 50;
  const { usd, local } = getSessionPrice(basePrice, duration, country);
  const discountAmt = appliedCode ? Math.round(local * appliedCode.discount) : 0;
  const total       = local - discountAmt;

  useEffect(()=>{
    if (!date || !providerId) return;
    setSlotsLoading(true); setTime("");
    fetchBookedSlots(providerId, date).then(slots=>{
      setBookedSlots(slots); setSlotsLoading(false);
    });
  }, [date, providerId]);

  const applyPromo = () => {
    const upper = promoInput.trim().toUpperCase();
    const disc  = PROMO_CODES[upper];
    if (disc) { setAppliedCode({code:upper,discount:disc}); setPromoError(""); }
    else       { setAppliedCode(null); setPromoError(tc.invalidCode); }
  };

  const isPaymentFilled = () => {
    if (payMethod==="credit"||payMethod==="clickpay") return cardNum.length>=15&&cardExp.length>=4&&cardCvv.length>=3&&cardName.trim().length>=2;
    return walletNum.trim().length>=8;
  };

  const canBook =
    date && time && acceptTerms && !!provider &&
    patientName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail) &&
    isPaymentFilled();

  const buildAdminMsg = (id: number) => {
    const dateStr = formatDateDisplay(date);
    return [
      `🏥 *New Clearhead Booking — Pending Approval*`,
      `Patient ID: *${patientId}*`,
      `Provider: *${provider?.name}*`,
      `Date: ${dateStr} at ${time}`,
      `Duration: ${duration} min`,
      `Payment: ${payMethod.toUpperCase()} · ${country.symbol}${total.toLocaleString()}`,
      `Booking #${id}`,
      ``,
      `Reply to this message to approve or reject.`,
    ].join("\n");
  };

  const handleBook = async () => {
    if (!canBook) return;
    setLoading(true); setBookingError("");
    try {
      const result = await createAppointment({
        patientName:  patientId,
        patientEmail: patientEmail.trim(),
        providerId,
        date,
        time,
        type: "video",
        notes: [
          `PatientID:${patientId}`,
          `Name:${patientName.trim()}`,
          `Phone:${patientPhone}`,
          `Payment:${payMethod}`,
          appliedCode ? `Promo:${appliedCode.code}` : "",
        ].filter(Boolean).join(" | "),
      });
      setBookingResult({id: result!.id, date, time});
      setSubmitted(true);
    } catch (e: any) {
      setBookingError(e.message ?? "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const adminWhatsAppLink = bookingResult
    ? `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(buildAdminMsg(bookingResult.id))}`
    : "#";

  const shareMsg = bookingResult && provider
    ? encodeURIComponent(`I just booked a ${duration}-min session with ${provider.name} on ${formatDateDisplay(bookingResult.date)} at ${time}.\n\nBook your own on Clearhead: ${window.location.origin}/checkout?provider=${providerId}`)
    : "";

  /* ── Success screen ── */
  if (submitted && bookingResult) {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="text-center max-w-md w-full">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.1}}
            className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600"/>
          </motion.div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">{tc.successTitle}</h2>
          <p className="text-muted-foreground mb-2">{tc.successSub}</p>

          {/* Patient ID */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Hash className="w-4 h-4 text-primary"/>
            <span className="text-sm font-mono font-bold text-primary">{patientId}</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 text-start mb-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tc.patientId}</span>
              <span className="font-mono font-bold text-primary">{patientId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tc.provider}</span>
              <span className="font-medium">{provider?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{formatDateDisplay(bookingResult.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{formatSlotRange(bookingResult.time, duration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tc.duration}</span>
              <span className="font-medium">{duration} {tc.min}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tc.callPlatform}</span>
              <span className="font-medium flex items-center gap-1"><Video className="w-3.5 h-3.5 text-primary"/> Doxy.me</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
              <span>{tc.total}</span>
              <span className="text-primary">{country.symbol}{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Doxy.me note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs text-start mb-5">
            <Video className="w-4 h-4 flex-shrink-0 mt-0.5"/>
            {tc.doxyNote}
          </div>

          {/* No cancellation */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs text-start mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
            {tc.noCancelNote}
          </div>

          <div className="space-y-3 mb-6">
            <a href={adminWhatsAppLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#1ebe5c] transition-all hover:-translate-y-0.5 shadow-md">
              <MessageCircle className="w-5 h-5"/>
              Notify admin via WhatsApp
            </a>
            <a href={`https://wa.me/?text=${shareMsg}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-[#25D366] text-[#25D366] font-semibold hover:bg-[#25D366]/10 transition-all">
              <MessageCircle className="w-5 h-5"/>
              Share booking via WhatsApp
            </a>
            <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/checkout?provider=${providerId}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-border bg-card text-foreground font-semibold hover:border-primary/40 transition-all">
              {copied?<Check className="w-5 h-5 text-emerald-600"/>:<Copy className="w-5 h-5"/>}
              {copied ? "Copied!" : "Copy booking link"}
            </button>
          </div>

          <button onClick={()=>navigate("/appointments")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            View my appointments
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            Confirmation sent to <span className="font-medium">{patientEmail}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div dir={dir} className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
          <button onClick={()=>navigate(-1 as any)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4"/> {tc.backBtn}
          </button>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-1">{tc.title}</h1>
          <p className="text-muted-foreground mb-8">{tc.subtitle}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Provider summary */}
              {provider && (
                <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <img src={provider.imageUrl} alt={provider.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">{provider.title}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>
                      <span className="text-sm font-medium">{provider.rating}</span>
                      <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div className="text-xs text-muted-foreground">{tc.specialty}</div>
                    <div className="text-sm font-medium text-primary">{provider.specialty}</div>
                  </div>
                </motion.div>
              )}

              {/* Patient ID display */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.02}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary"/> {tc.patientId}
                </h3>
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="font-mono font-bold text-primary text-lg tracking-wider">{patientId}</span>
                  <span className="text-xs text-muted-foreground">Assigned to your session</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Your name is kept confidential — all communications use this ID.</p>
              </motion.div>

              {/* Patient details */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.04}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary"/> Your Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full name *</label>
                    <input value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Your full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3"/> Email *
                    </label>
                    <input type="email" value={patientEmail} onChange={e=>setPatientEmail(e.target.value)} placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">WhatsApp / Phone (optional)</label>
                    <input type="tel" value={patientPhone} onChange={e=>setPatientPhone(e.target.value)} placeholder="+962 7X XXX XXXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                </div>
              </motion.div>

              {/* Duration */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.06}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary"/> {tc.duration}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {SESSION_DURATIONS.map(d=>{
                    const p = getSessionPrice(basePrice, d.minutes, country);
                    return (
                      <button key={d.minutes} onClick={()=>setDuration(d.minutes)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${duration===d.minutes?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}>
                        <div className="font-bold text-foreground text-lg">{d.minutes}</div>
                        <div className="text-xs text-muted-foreground mb-1.5">{tc.min}</div>
                        <div className="font-semibold text-primary text-sm">{country.symbol}{p.local.toLocaleString()}</div>
                        {d.minutes===90&&<div className="text-xs text-emerald-600 mt-0.5">Best value</div>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Calendar */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary"/> {tc.selectDate}
                </h3>
                <CalendarGrid selectedDate={date} onSelect={d=>setDate(d)}/>
                {date && <div className="mt-3 text-sm text-center text-primary font-medium">{formatDateDisplay(date)}</div>}
              </motion.div>

              {/* Time slots */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.14}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary"/> {tc.selectTime}
                  {date&&!slotsLoading&&(
                    <span className="text-xs text-muted-foreground font-normal ms-auto">
                      {bookedSlots.length>0
                        ?`${bookedSlots.length} slot${bookedSlots.length>1?"s":""} taken`
                        :"All slots available"}
                    </span>
                  )}
                </h3>
                {!date ? (
                  <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-xl">Select a date above to see available times</div>
                ) : slotsLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
                    Checking availability…
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map(slot=>{
                      const isBooked   = bookedSlots.includes(slot);
                      const isSelected = time===slot;
                      const rangeLabel = formatSlotRange(slot, duration);
                      return (
                        <button key={slot} disabled={isBooked} onClick={()=>!isBooked&&setTime(slot)}
                          className={`relative py-2.5 px-2 rounded-xl border-2 text-xs font-medium text-center transition-all leading-tight
                            ${isSelected?"border-primary bg-primary text-primary-foreground shadow-md":""}
                            ${isBooked?"border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed":""}
                            ${!isBooked&&!isSelected?"border-border hover:border-primary/40 text-foreground":""}`}>
                          {isBooked ? (
                            <span className="flex flex-col items-center gap-0.5">
                              <X className="w-3.5 h-3.5 text-red-400"/>
                              <span className="text-[9px] line-through">{slot}</span>
                            </span>
                          ) : rangeLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Payment */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.18}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary"/> {tc.paymentMethod}
                </h3>
                <PaymentSection
                  method={payMethod} setMethod={setPayMethod}
                  cardNum={cardNum} setCardNum={setCardNum}
                  cardExp={cardExp} setCardExp={setCardExp}
                  cardCvv={cardCvv} setCardCvv={setCardCvv}
                  cardName={cardName} setCardName={setCardName}
                  walletNum={walletNum} setWalletNum={setWalletNum}
                  tc={tc}
                />
              </motion.div>

              {/* Doxy.me call info */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
                <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <div className="font-semibold text-blue-700 text-sm mb-1 flex items-center gap-2">
                    <span>Doxy.me · Video Sessions</span>
                  </div>
                  <p className="text-xs text-blue-600 leading-relaxed">{tc.doxyNote}</p>
                  <a href="https://doxy.me" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-700 font-semibold hover:underline mt-1 inline-block">
                    Learn more about Doxy.me →
                  </a>
                </div>
              </motion.div>

              {/* Promo */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.22}}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary"/> {tc.promoCode}
                </h3>
                <div className="flex gap-2 mb-3">
                  <input value={promoInput} onChange={e=>{setPromoInput(e.target.value.toUpperCase());setPromoError("");}}
                    placeholder={tc.promoPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"/>
                  <button onClick={applyPromo} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                    {tc.apply}
                  </button>
                </div>
                {promoError&&<div className="flex items-center gap-2 text-red-500 text-sm"><AlertCircle className="w-4 h-4"/> {promoError}</div>}
                {appliedCode&&<div className="flex items-center gap-2 text-emerald-600 text-sm font-medium"><CheckCircle className="w-4 h-4"/><span className="font-mono font-bold">{appliedCode.code}</span> — {Math.round(appliedCode.discount*100)}% {tc.codeApplied}</div>}
              </motion.div>

              {/* T&C + no-cancel notice */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.26}} className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div onClick={()=>setAcceptTerms(!acceptTerms)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${acceptTerms?"border-primary bg-primary":"border-input group-hover:border-primary/50"}`}>
                    {acceptTerms&&<CheckCircle className="w-3 h-3 text-white"/>}
                  </div>
                  <span className="text-sm text-foreground/80 leading-relaxed">
                    {tc.acceptTerms} —{" "}
                    <a href="/contracts" target="_blank" className="text-primary hover:underline">Terms</a> &amp;{" "}
                    <a href="/contracts" target="_blank" className="text-primary hover:underline">Privacy</a>
                  </span>
                </label>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                  {tc.noCancelNote}
                </div>
              </motion.div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:0.1}}
                  className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-5">{tc.orderSummary}</h3>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{tc.session} ({duration} {tc.min})</span>
                      <span className="font-medium text-foreground">{country.symbol}{local.toLocaleString()}</span>
                    </div>
                    {appliedCode&&(
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Promo ({appliedCode.code})</span>
                        <span>−{country.symbol}{discountAmt.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                      <span>{tc.total}</span>
                      <span className="text-primary text-lg">{country.symbol}{total.toLocaleString()}</span>
                    </div>
                    {country.code!=="US"&&<div className="text-xs text-muted-foreground text-end">≈ ${usd} USD</div>}
                  </div>

                  {/* Summary preview */}
                  {(date||time||patientName) && (
                    <div className="bg-muted/40 rounded-xl p-3 mb-4 text-sm space-y-1.5">
                      {patientName&&<div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-bold text-primary text-xs">{patientId}</span></div>}
                      {date&&<div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-xs">{date.split("-").reverse().join(".")}</span></div>}
                      {time&&<div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{formatSlotRange(time, duration)}</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium flex items-center gap-1"><Video className="w-3 h-3 text-primary"/>Doxy.me</span></div>
                    </div>
                  )}

                  {bookingError&&(
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs mb-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/> {bookingError}
                    </div>
                  )}

                  <button onClick={handleBook} disabled={!canBook||loading}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${canBook?"bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 shadow-lg":"bg-muted text-muted-foreground cursor-not-allowed"}`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Processing…
                      </span>
                    ) : tc.confirmBook}
                  </button>

                  <div className="mt-2 text-xs text-muted-foreground text-center space-y-0.5">
                    {!patientName.trim()&&<p>Enter your name</p>}
                    {patientName.trim()&&!patientEmail.trim()&&<p>Enter your email</p>}
                    {patientName.trim()&&patientEmail.trim()&&!date&&<p>Select a date</p>}
                    {patientName.trim()&&patientEmail.trim()&&date&&!time&&<p>Select a time slot</p>}
                    {patientName.trim()&&patientEmail.trim()&&date&&time&&!isPaymentFilled()&&<p>Complete payment details</p>}
                    {patientName.trim()&&patientEmail.trim()&&date&&time&&isPaymentFilled()&&!acceptTerms&&<p>Accept the terms</p>}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"/>
                    <p className="text-xs text-muted-foreground">Fully encrypted & HIPAA-compliant. Bookings are non-refundable.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

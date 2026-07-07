import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Tag, Clock, ChevronLeft, ChevronRight,
  Star, Shield, AlertCircle, MessageCircle, Copy,
  Check, CreditCard, Smartphone, Video, User, Hash, MapPin,
} from "lucide-react";
import { useGetProvider } from "@workspace/api-client-react";
import { useCountry } from "@/context/CountryContext";
import { useLang } from "@/context/LanguageContext";
import { COUNTRY_LIST, PROMO_CODES, getSessionPrice } from "@/lib/pricing";

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

const ADMIN_WHATSAPP = "962770403270";
const ADMIN_EMAIL    = "jamal_alqhaiwi@yahoo.com";

type PayMethod = "credit" | "zain" | "orange" | "cliq";

/* ─── API helpers ───────────────────────────────────── */
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

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

/* ─── Payment section (Talabat-style radio list) ─────── */
function PaymentSection({ method, setMethod, cardNum, setCardNum, cardExp, setCardExp, cardCvv, setCardCvv, cardName, setCardName, walletNum, setWalletNum, cliqAlias, setCliqAlias, tc }: {
  method: PayMethod; setMethod: (m: PayMethod) => void;
  cardNum: string; setCardNum: (v: string) => void;
  cardExp: string; setCardExp: (v: string) => void;
  cardCvv: string; setCardCvv: (v: string) => void;
  cardName: string; setCardName: (v: string) => void;
  walletNum: string; setWalletNum: (v: string) => void;
  cliqAlias: string; setCliqAlias: (v: string) => void;
  tc: ReturnType<typeof useLang>["t"]["checkout"];
}) {
  const methods: {id: PayMethod; label: string; icon: React.ReactNode; badge?: React.ReactNode}[] = [
    {
      id: "credit", label: tc.payCredit,
      icon: <CreditCard className="w-5 h-5 text-slate-600"/>,
      badge: <div className="flex gap-1.5"><span className="bg-[#1A1F71] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">VISA</span><span className="bg-[#EB001B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MC</span></div>,
    },
    { id: "cliq", label: "CliQ", icon: <span className="text-xl leading-none">🏦</span>, badge: <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">JoPACC</span> },
    { id: "zain", label: tc.payZain, icon: <Smartphone className="w-5 h-5 text-violet-600"/>, badge: <span className="text-[10px] text-violet-700 font-medium bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">Wallet</span> },
    { id: "orange", label: tc.payOrange, icon: <Smartphone className="w-5 h-5 text-orange-500"/>, badge: <span className="text-[10px] text-orange-700 font-medium bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">Wallet</span> },
  ];

  return (
    <div className="space-y-0 divide-y divide-border">
      {methods.map(m=>(
        <div key={m.id}>
          <button onClick={()=>setMethod(m.id)}
            className="w-full flex items-center gap-4 py-4 text-start hover:bg-muted/30 transition-colors first:pt-0 last:pb-0">
            <span className="w-8 flex items-center justify-center flex-shrink-0">{m.icon}</span>
            <span className="flex-1 font-medium text-sm text-foreground">{m.label}</span>
            {m.badge && <span>{m.badge}</span>}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${method===m.id?"border-primary":"border-border"}`}>
              {method===m.id&&<div className="w-2.5 h-2.5 rounded-full bg-primary"/>}
            </div>
          </button>

          <AnimatePresence>
            {method===m.id && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                className="overflow-hidden">
                <div className="pb-4">
                  {m.id==="credit" && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Secure Card Entry</span>
                        <div className="flex gap-1.5">
                          <span className="bg-[#1A1F71] text-white text-[10px] font-bold px-2 py-0.5 rounded">VISA</span>
                          <span className="bg-[#EB001B] text-white text-[10px] font-bold px-2 py-0.5 rounded">MC</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 block mb-1.5">{tc.cardNumber}</label>
                        <input value={cardNum} onChange={e=>setCardNum(e.target.value.replace(/\D/g,"").slice(0,16))}
                          placeholder="•••• •••• •••• ••••"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:border-white/50 tracking-widest"/>
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
                        <input value={cardName} onChange={e=>setCardName(e.target.value)} placeholder="Full name on card"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/50"/>
                      </div>
                    </div>
                  )}
                  {m.id==="cliq" && (
                    <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50 space-y-3">
                      <p className="text-xs text-emerald-700">Powered by JoPACC · Supported by all Jordanian banks</p>
                      <div>
                        <label className="text-xs font-medium text-emerald-800 block mb-1.5">CliQ Alias <span className="font-normal">(IBAN or registered mobile)</span></label>
                        <input value={cliqAlias} onChange={e=>setCliqAlias(e.target.value)} type="text"
                          placeholder="JO94CBJO… or 07XXXXXXXX"
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                      </div>
                    </div>
                  )}
                  {(m.id==="zain"||m.id==="orange") && (
                    <div className={`rounded-2xl p-4 border space-y-3 ${m.id==="zain"?"border-violet-200 bg-violet-50":"border-orange-200 bg-orange-50"}`}>
                      <p className={`text-xs ${m.id==="zain"?"text-violet-700":"text-orange-700"}`}>
                        {m.id==="zain"?"You'll receive a USSD prompt on your Zain line to approve payment.":"You'll receive a confirmation SMS on your Orange line to approve payment."}
                      </p>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">{tc.walletNumber} <span className="text-red-500">*</span></label>
                        <input value={walletNum} onChange={e=>setWalletNum(e.target.value.replace(/\D/g,""))} placeholder="07XXXXXXXX" type="tel"
                          className="w-full px-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */
export default function Checkout() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);

  /* URL params — populated by BookingJourney when navigating here */
  const providerId      = parseInt(params.get("provider") || "1");
  const initialDuration = parseInt(params.get("duration") || "60");
  const initialDate     = params.get("date")  || "";
  const initialTime     = params.get("time")  || "";
  const initialName     = params.get("name")  || "";
  const initialPhone    = params.get("phone") || "";
  const initialEmail    = params.get("email") || "";
  const initialPromo    = params.get("promo") || "";
  const initialPid      = params.get("pid")   || "";

  const { country, setCountry } = useCountry();
  const { t, dir }  = useLang();
  const tc          = t.checkout;
  const { data: provider } = useGetProvider(providerId, { query: { enabled: !!providerId } });

  /* Stable patient ID — reuse journey ID if provided */
  const patientIdRef = useRef(initialPid || generatePatientId());
  const patientId    = patientIdRef.current;

  const [duration]      = useState(initialDuration);
  const [date]          = useState(initialDate);
  const [time]          = useState(initialTime);

  /* Pre-fill patient details from journey */
  const [patientName,   setPatientName]   = useState(initialName);
  const [patientEmail,  setPatientEmail]  = useState(initialEmail);
  const [patientPhone,  setPatientPhone]  = useState(initialPhone);

  const [promoInput,    setPromoInput]    = useState(initialPromo);
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
  const [cliqAlias,  setCliqAlias]  = useState("");

  /* Validation */
  const [showErrors, setShowErrors] = useState(false);

  /* Auto-apply promo from journey */
  useEffect(() => {
    if (!initialPromo) return;
    const disc = PROMO_CODES[initialPromo.toUpperCase()];
    if (disc) setAppliedCode({ code: initialPromo.toUpperCase(), discount: disc });
  }, []);

  /* Enforce country from journey URL param */
  useEffect(() => {
    const urlCountry = params.get("country");
    if (urlCountry) {
      const match = COUNTRY_LIST.find(c => c.code === urlCountry);
      if (match) setCountry(match);
    }
  }, []);

  const basePrice  = provider?.sessionPrice ?? 50;
  const { usd, local } = getSessionPrice(basePrice, duration, country);
  const discountAmt = appliedCode ? Math.round(local * appliedCode.discount) : 0;
  const total       = local - discountAmt;

  useEffect(()=>{
    /* intentionally empty — no slot fetching needed, date/time come from journey */
  }, [date, providerId]);

  const applyPromo = () => {
    const upper = promoInput.trim().toUpperCase();
    const disc  = PROMO_CODES[upper];
    if (disc) { setAppliedCode({code:upper,discount:disc}); setPromoError(""); }
    else       { setAppliedCode(null); setPromoError(tc.invalidCode); }
  };

  const emailValid = !patientEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim());
  const phoneDigits = patientPhone.replace(/\D/g, "");

  const isPaymentFilled = () => {
    if (payMethod==="credit") return cardNum.length>=15&&cardExp.length>=4&&cardCvv.length>=3&&cardName.trim().length>=2;
    if (payMethod==="cliq")   return cliqAlias.trim().length>=10;
    return walletNum.replace(/\D/g,"").length>=8;
  };

  const canBook =
    date && time && acceptTerms && !!provider &&
    patientName.trim().length >= 2 &&
    phoneDigits.length >= 8 &&
    emailValid &&
    isPaymentFilled();

  const payMethodLabel = { credit: "Credit/Debit Card", cliq: "CliQ (Jordan Bank Transfer)", zain: "Zain Cash", orange: "Orange Money" }[payMethod];

  const buildAdminMsg = (id: number) => {
    const dateStr = formatDateDisplay(date);
    const endTime = (() => { const [h,m]=time.split(":").map(Number); const t=h*60+m+duration; return `${String(Math.floor(t/60)%24).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; })();
    const lines = [
      `🏥 *CLEARHEAD — BOOKING CONFIRMATION*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `📋 *PATIENT DETAILS*`,
      `Patient ID:  *${patientId}*`,
      `Full Name:   ${patientName}`,
      `Phone:       ${patientPhone || "—"}`,
      patientEmail ? `Email:       ${patientEmail}` : null,
      ``,
      `👨‍⚕️ *SESSION DETAILS*`,
      `Provider:    *${provider?.name}*`,
      `Specialty:   ${provider?.specialty ?? "—"}`,
      `Date:        ${dateStr}`,
      `Time:        ${time} – ${endTime} (${duration} min)`,
      `Format:      🎥 Video — Doxy.me`,
      ``,
      `💳 *PAYMENT BREAKDOWN*`,
      `Session Fee: ${country.symbol}${local.toLocaleString()}`,
      appliedCode ? `Promo (${appliedCode.code}):  −${country.symbol}${discountAmt.toLocaleString()}` : null,
      `─────────────────────`,
      `Total Paid:  *${country.symbol}${total.toLocaleString()}*${country.code!=="US" ? ` (≈ $${usd} USD)` : ""}`,
      `Method:      ${payMethodLabel}`,
      `Booking #:   ${id}`,
      ``,
      `🔗 *COMMUNICATION*`,
      `Session Link: https://doxy.me`,
      `WhatsApp Admin: wa.me/${ADMIN_WHATSAPP}`,
      ``,
      `⚠️ _Please approve or contact patient directly._`,
    ].filter((l): l is string => l !== null);
    return lines.join("\n");
  };

  const handleBook = async () => {
    if (!canBook) { setShowErrors(true); return; }
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
    ? encodeURIComponent([
        `📋 *CLEARHEAD — SESSION SUMMARY*`,
        `━━━━━━━━━━━━━━━━━━━`,
        `Provider: *${provider.name}*`,
        `Date: ${formatDateDisplay(bookingResult.date)}`,
        `Time: ${formatSlotRange(bookingResult.time, duration)}`,
        `Format: 🎥 Video (Doxy.me)`,
        `Session Link: https://doxy.me`,
        ``,
        `Need mental health support? Book on Clearhead:`,
        `${window.location.origin}/checkout?provider=${providerId}`,
        ``,
        `🔗 Contact us via WhatsApp: wa.me/${ADMIN_WHATSAPP}`,
      ].join("\n"))
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

          {/* ── Invoice breakdown ── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden text-start mb-5">
            <div className="bg-muted/50 px-5 py-3 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">BOOKING INVOICE</p>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Patient</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient ID</span>
                <span className="font-mono font-bold text-primary text-xs">{patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{patientName}</span>
              </div>
              {patientPhone&&<div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{patientPhone}</span></div>}
              {patientEmail&&<div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-xs">{patientEmail}</span></div>}

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Session</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">{tc.provider}</span><span className="font-medium">{provider?.name}</span></div>
                  {provider?.specialty&&<div className="flex justify-between"><span className="text-muted-foreground">Specialty</span><span className="font-medium">{provider.specialty}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formatDateDisplay(bookingResult.date)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{formatSlotRange(bookingResult.time, duration)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tc.duration}</span><span className="font-medium">{duration} {tc.min}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-primary"/> Video — Doxy.me</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Session Link</span><a href="https://doxy.me" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-medium">doxy.me</a></div>
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Payment</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Session fee ({duration} min)</span><span className="font-medium">{country.symbol}{local.toLocaleString()}</span></div>
                  {appliedCode&&<div className="flex justify-between text-emerald-600"><span>Promo — {appliedCode.code} ({Math.round(appliedCode.discount*100)}%)</span><span>−{country.symbol}{discountAmt.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-xs text-muted-foreground"><span>VAT / Tax</span><span>Included</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between font-bold text-foreground text-base">
                  <span>{tc.total}</span>
                  <div className="text-end">
                    <div className="text-primary">{country.symbol}{total.toLocaleString()}</div>
                    {country.code!=="US"&&<div className="text-xs font-normal text-muted-foreground">≈ ${usd} USD</div>}
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Payment Method</span><span className="font-medium">{payMethodLabel}</span></div>
              </div>
            </div>
          </div>

          {/* Doxy.me + no-cancel notices */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs text-start">
              <Video className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <span>{tc.doxyNote}</span>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs text-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <span>{tc.noCancelNote}</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <a href={adminWhatsAppLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#1ebe5c] transition-all hover:-translate-y-0.5 shadow-md">
              <MessageCircle className="w-5 h-5"/>
              Send Invoice to Admin via WhatsApp
            </a>
            <a href={`https://wa.me/?text=${shareMsg}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-[#25D366] text-[#25D366] font-semibold hover:bg-[#25D366]/10 transition-all">
              <MessageCircle className="w-5 h-5"/>
              Share Session Summary via WhatsApp
            </a>
            <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/checkout?provider=${providerId}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-border bg-card text-foreground font-semibold hover:border-primary/40 transition-all">
              {copied?<Check className="w-5 h-5 text-emerald-600"/>:<Copy className="w-5 h-5"/>}
              {copied ? "Copied!" : "Copy Booking Link"}
            </button>
          </div>

          <button onClick={()=>navigate("/appointments")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            View My Appointments
          </button>
          {patientEmail&&<p className="text-xs text-muted-foreground mt-4">Confirmation sent to <span className="font-medium">{patientEmail}</span></p>}
        </motion.div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div dir={dir} className="min-h-screen bg-[#f5f6f8]">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={()=>navigate(-1 as any)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground"/>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground text-base leading-tight">Checkout</h1>
            {provider && <p className="text-xs text-muted-foreground truncate">{provider.name}</p>}
          </div>
          {/* Country badge — enforced from IP, read-only */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 text-xs font-medium text-foreground">
            <MapPin className="w-3 h-3 text-primary"/>
            <span>{country.flag}</span>
            <span>{country.currency}</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
        className="max-w-lg mx-auto px-4 pt-4 pb-36 space-y-3">

        {/* ─── 1. Booking summary card ─── */}
        {provider && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-5 pt-5 pb-4 flex items-start gap-4">
              <img src={provider.imageUrl} alt={provider.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-2 ring-border"/>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{provider.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{provider.title}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>
                  <span className="text-xs font-semibold text-foreground">{provider.rating}</span>
                  <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="text-end flex-shrink-0">
                <div className="text-lg font-bold text-primary">{country.symbol}{local.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{duration} min session</div>
              </div>
            </div>
            {/* Session details strip */}
            <div className="border-t border-border bg-muted/25 px-5 py-3 grid grid-cols-3 divide-x divide-border text-center text-xs">
              <div className="pr-3">
                <div className="text-muted-foreground mb-0.5">Date</div>
                <div className="font-medium text-foreground leading-snug">
                  {date ? formatDateDisplay(date).split(",")[0] : "—"}
                </div>
              </div>
              <div className="px-3">
                <div className="text-muted-foreground mb-0.5">Time</div>
                <div className="font-medium text-foreground">{time ? formatSlotRange(time, duration) : "—"}</div>
              </div>
              <div className="pl-3">
                <div className="text-muted-foreground mb-0.5">Format</div>
                <div className="font-medium text-primary flex items-center justify-center gap-1">
                  <Video className="w-3 h-3"/> Video
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2. Your details ─── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary"/> Your Details
          </h3>

          {/* Confidential patient ID */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/15 mb-4">
            <Hash className="w-3.5 h-3.5 text-primary flex-shrink-0"/>
            <span className="text-xs text-muted-foreground flex-1">Patient ID (confidential)</span>
            <span className="font-mono font-bold text-primary text-sm tracking-wide">{patientId}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Your full name"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                  ${showErrors&&patientName.trim().length<2?"border-red-400 bg-red-50/50":"border-input"}`}/>
              {showErrors&&patientName.trim().length<2&&(
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Full name is required</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                WhatsApp / Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" value={patientPhone}
                onChange={e=>setPatientPhone(e.target.value.replace(/[^\d+\s()-]/g,""))}
                placeholder="+962 7X XXX XXXX"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                  ${showErrors&&phoneDigits.length<8?"border-red-400 bg-red-50/50":"border-input"}`}/>
              {showErrors&&phoneDigits.length<8&&(
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Valid phone required</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input type="email" value={patientEmail} onChange={e=>setPatientEmail(e.target.value)}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                  ${patientEmail.trim()&&!emailValid?"border-amber-400 bg-amber-50/50":"border-input"}`}/>
              {patientEmail.trim()&&!emailValid&&(
                <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Invalid email format</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. Pay with ─── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-foreground mb-1">Pay with</h3>
          <PaymentSection
            method={payMethod} setMethod={setPayMethod}
            cardNum={cardNum} setCardNum={setCardNum}
            cardExp={cardExp} setCardExp={setCardExp}
            cardCvv={cardCvv} setCardCvv={setCardCvv}
            cardName={cardName} setCardName={setCardName}
            walletNum={walletNum} setWalletNum={setWalletNum}
            cliqAlias={cliqAlias} setCliqAlias={setCliqAlias}
            tc={tc}
          />
          {/* PCI security note */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Shield className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"/>
            <span className="text-[11px] text-muted-foreground">Protected by PCI Data Security Standard</span>
          </div>
        </div>

        {/* ─── 4. Save on your session ─── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary"/> Save on your session
          </h3>
          <div className="flex gap-2">
            <input value={promoInput}
              onChange={e=>{setPromoInput(e.target.value.toUpperCase());setPromoError("");}}
              placeholder="Enter voucher code"
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring uppercase"/>
            <button onClick={applyPromo}
              className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
              Apply
            </button>
          </div>
          {promoError&&(
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> {promoError}</p>
          )}
          {appliedCode&&(
            <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5"/>
              <span className="font-mono font-bold">{appliedCode.code}</span>
              — {Math.round(appliedCode.discount*100)}% discount applied!
            </p>
          )}
        </div>

        {/* ─── 5. Payment summary ─── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-foreground mb-4">Payment summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (incl. VAT)</span>
              <span className="font-medium">{country.symbol}{local.toLocaleString()}</span>
            </div>
            {appliedCode && (
              <div className="flex justify-between text-emerald-600">
                <span className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Discount
                  </span>
                  {appliedCode.code} ({Math.round(appliedCode.discount*100)}%)
                </span>
                <span className="font-semibold">−{country.symbol}{discountAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Service fee</span>
              <span className="bg-muted/60 text-foreground text-[10px] font-medium px-2 py-0.5 rounded">Included</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-end">
              <span className="font-bold text-foreground text-base">Total amount</span>
              <div className="text-end">
                <div className="font-bold text-primary text-xl">{country.symbol}{total.toLocaleString()}</div>
                {country.code!=="US"&&<div className="text-xs text-muted-foreground">≈ ${usd} USD</div>}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. Terms ─── */}
        <div className="space-y-2.5">
          <label className="flex items-start gap-3 cursor-pointer bg-white rounded-2xl border border-border p-4 shadow-sm">
            <button type="button" onClick={()=>setAcceptTerms(!acceptTerms)}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${acceptTerms?"border-primary bg-primary":"border-border hover:border-primary/50"}`}>
              {acceptTerms&&<Check className="w-3 h-3 text-white"/>}
            </button>
            <span className="text-xs text-foreground/80 leading-relaxed">
              By placing this order, I confirm that I have read and agreed with the{" "}
              <a href="/contracts" target="_blank" className="text-primary hover:underline font-medium">Terms & Conditions</a>
            </span>
          </label>
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
            {tc.noCancelNote}
          </div>
        </div>

        {/* Error */}
        {bookingError&&(
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/> {bookingError}
          </div>
        )}
      </motion.div>

      {/* ── Fixed bottom CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-6">
          {/* Payment method indicator */}
          <div className="flex items-center gap-2 mb-2.5 text-xs text-muted-foreground">
            <CreditCard className="w-3.5 h-3.5 flex-shrink-0"/>
            <span className="flex-1 truncate">{payMethodLabel}</span>
            <ChevronRight className="w-3 h-3"/>
            <span className="font-semibold text-foreground">{country.symbol}{total.toLocaleString()}</span>
          </div>
          <button onClick={handleBook} disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${canBook&&!loading?"bg-primary text-white hover:opacity-90 active:scale-[0.99] shadow-lg shadow-primary/25":"bg-muted text-muted-foreground cursor-not-allowed"}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Processing…
              </span>
            ) : (
              `Confirm & Pay · ${country.symbol}${total.toLocaleString()}`
            )}
          </button>
          {/* Inline validation hints */}
          {!canBook && !loading && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {!patientName.trim() ? "Enter your full name to continue" :
               phoneDigits.length<8 ? "Enter a valid phone number" :
               patientEmail.trim()&&!emailValid ? "Fix the email format" :
               !isPaymentFilled() ? "Complete your payment details" :
               !acceptTerms ? "Accept the terms to confirm" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

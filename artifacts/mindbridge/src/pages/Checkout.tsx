import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Tag, Clock, Calendar, ChevronLeft, ChevronRight,
  Star, Shield, Zap, AlertCircle, X, MessageCircle, User, Mail, Copy, Check
} from "lucide-react";
import { useGetProvider } from "@workspace/api-client-react";
import { useCountry } from "@/context/CountryContext";
import { useLang } from "@/context/LanguageContext";
import { SESSION_DURATIONS, PROMO_CODES, getSessionPrice } from "@/lib/pricing";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "19:00",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarGrid({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (d: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const pad = (n: number) => String(n).padStart(2, "0");
  const toValue = (day: number) => `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;

  const isPast = (day: number) => new Date(viewYear, viewMonth, day) < today;
  const isTooFar = (day: number) => {
    const max = new Date(today);
    max.setDate(today.getDate() + 60);
    return new Date(viewYear, viewMonth, day) > max;
  };
  const isToday = (day: number) => new Date(viewYear, viewMonth, day).getTime() === today.getTime();

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-foreground">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const value = toValue(day);
          const disabled = isPast(day) || isTooFar(day);
          const selected = value === selectedDate;
          const todayMark = isToday(day);

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && onSelect(value)}
              className={`
                mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${selected ? "bg-primary text-primary-foreground shadow-md" : ""}
                ${!selected && todayMark ? "border-2 border-primary text-primary" : ""}
                ${!selected && !disabled && !todayMark ? "hover:bg-primary/10 text-foreground" : ""}
                ${disabled ? "text-muted-foreground/40 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function fetchBookedSlots(providerId: number, date: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/appointments/slots?providerId=${providerId}&date=${date}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.bookedSlots ?? [];
  } catch {
    return [];
  }
}

async function createAppointment(body: {
  patientName: string;
  patientEmail: string;
  providerId: number;
  date: string;
  time: string;
  type: string;
  notes?: string;
}): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Booking failed");
    }
    return res.json();
  } catch (e) {
    throw e;
  }
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function Checkout() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const providerId = parseInt(params.get("provider") || "1");
  const initialDuration = parseInt(params.get("duration") || "45");

  const { country } = useCountry();
  const { t } = useLang();
  const { data: provider } = useGetProvider(providerId, { query: { enabled: !!providerId } });

  const [duration, setDuration] = useState(initialDuration);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [referralCode, setReferralCode] = useState(params.get("ref") || "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ id: number; date: string; time: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [copied, setCopied] = useState(false);

  const basePrice = provider?.sessionPrice ?? 50;
  const { usd, local } = getSessionPrice(basePrice, duration, country);
  const discountAmt = appliedCode ? Math.round(local * appliedCode.discount) : 0;
  const total = local - discountAmt;

  useEffect(() => {
    if (!date || !providerId) return;
    setSlotsLoading(true);
    setTime("");
    fetchBookedSlots(providerId, date).then((slots) => {
      setBookedSlots(slots);
      setSlotsLoading(false);
    });
  }, [date, providerId]);

  const applyPromo = () => {
    const upper = promoInput.trim().toUpperCase();
    const disc = PROMO_CODES[upper];
    if (disc) {
      setAppliedCode({ code: upper, discount: disc });
      setPromoError("");
    } else {
      setAppliedCode(null);
      setPromoError(t.checkout.invalidCode);
    }
  };

  const canBook =
    date && time && acceptTerms && !!provider &&
    patientName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail);

  const handleBook = async () => {
    if (!canBook) return;
    setLoading(true);
    setBookingError("");
    try {
      const result = await createAppointment({
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        providerId,
        date,
        time,
        type: "video",
        notes: referralCode ? `Referral: ${referralCode}` : undefined,
      });
      setBookingResult({ id: result!.id, date, time });
      setSubmitted(true);
    } catch (e: any) {
      setBookingError(e.message ?? "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppMessage = () => {
    if (!bookingResult || !provider) return "";
    const dateStr = formatDateDisplay(bookingResult.date);
    const msg = `Hi! I've just booked a ${duration}-min session with ${provider.name} on ${dateStr} at ${bookingResult.time}.\n\nBook your own session on Clearhead:\nhttps://clearhead.app/checkout?provider=${providerId}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const bookingLink = `${window.location.origin}/checkout?provider=${providerId}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted && bookingResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">{t.checkout.successTitle}</h2>
          <p className="text-muted-foreground mb-6">{t.checkout.successSub}</p>

          <div className="bg-card border border-border rounded-2xl p-5 text-left mb-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.checkout.provider}</span>
              <span className="font-medium">{provider?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{formatDateDisplay(bookingResult.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{bookingResult.time}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.checkout.duration}</span>
              <span className="font-medium">{duration} {t.checkout.min}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
              <span>{t.checkout.total}</span>
              <span className="text-primary">{country.symbol}{total.toLocaleString()}</span>
            </div>
            {country.code !== "US" && (
              <div className="text-xs text-muted-foreground text-right">≈ ${usd} USD</div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <a
              href={buildWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#1ebe5c] transition-all hover:-translate-y-0.5 shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Share via WhatsApp
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-border bg-card text-foreground font-semibold hover:border-primary/40 transition-all"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              {copied ? "Link Copied!" : "Copy Booking Link"}
            </button>
          </div>

          <button
            onClick={() => navigate("/appointments")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            View My Appointments
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            A confirmation email has been sent to <span className="font-medium">{patientEmail}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <button
            onClick={() => navigate(-1 as any)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">{t.checkout.title}</h1>
          <p className="text-muted-foreground mb-10">{t.checkout.subtitle}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">

              {/* Provider summary */}
              {provider && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <img src={provider.imageUrl} alt={provider.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">{provider.title}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{provider.rating}</span>
                      <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground">{t.checkout.specialty}</div>
                    <div className="text-sm font-medium text-primary">{provider.specialty}</div>
                  </div>
                </motion.div>
              )}

              {/* Patient details */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Your Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full name *</label>
                    <input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email *
                    </label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Duration */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> {t.checkout.duration}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {SESSION_DURATIONS.map((d) => {
                    const p = getSessionPrice(basePrice, d.minutes, country);
                    return (
                      <button key={d.minutes} onClick={() => setDuration(d.minutes)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${duration === d.minutes ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <div className="font-bold text-foreground text-lg">{d.minutes}</div>
                        <div className="text-xs text-muted-foreground mb-1.5">min</div>
                        <div className="font-semibold text-primary text-sm">{country.symbol}{p.local.toLocaleString()}</div>
                        {d.minutes === 90 && <div className="text-xs text-emerald-600 mt-0.5">Best value</div>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Calendar */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> {t.checkout.selectDate}
                </h3>
                <CalendarGrid selectedDate={date} onSelect={(d) => setDate(d)} />
                {date && (
                  <div className="mt-3 text-sm text-center text-primary font-medium">
                    {formatDateDisplay(date)}
                  </div>
                )}
              </motion.div>

              {/* Time slots */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> {t.checkout.selectTime}
                  {date && !slotsLoading && (
                    <span className="text-xs text-muted-foreground font-normal ml-auto">
                      {bookedSlots.length > 0
                        ? `${bookedSlots.length} slot${bookedSlots.length > 1 ? "s" : ""} unavailable`
                        : "All slots available"}
                    </span>
                  )}
                </h3>

                {!date ? (
                  <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-xl">
                    Select a date above to see available times
                  </div>
                ) : slotsLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Checking availability…
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = time === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => !isBooked && setTime(slot)}
                          className={`
                            relative py-2.5 px-2 rounded-lg border text-sm font-medium text-center transition-all
                            ${isSelected ? "border-primary bg-primary text-primary-foreground shadow-md" : ""}
                            ${isBooked ? "border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed" : ""}
                            ${!isBooked && !isSelected ? "border-border hover:border-primary/40 text-foreground" : ""}
                          `}
                        >
                          {isBooked ? (
                            <span className="flex flex-col items-center gap-0.5">
                              <X className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-[10px] line-through">{slot}</span>
                            </span>
                          ) : slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Promo / Referral */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> {t.checkout.promoCode}
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    placeholder={t.checkout.promoPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                  <button onClick={applyPromo}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                    {t.checkout.apply}
                  </button>
                </div>
                {promoError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" /> {promoError}
                  </div>
                )}
                {appliedCode && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-mono font-bold">{appliedCode.code}</span> — {Math.round(appliedCode.discount * 100)}% {t.checkout.codeApplied}
                  </div>
                )}
                <div className="mt-4">
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Referral code (optional)</label>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Friend's referral code"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
              </motion.div>

              {/* T&C */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div onClick={() => setAcceptTerms(!acceptTerms)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${acceptTerms ? "border-primary bg-primary" : "border-input group-hover:border-primary/50"}`}>
                    {acceptTerms && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-foreground/80 leading-relaxed">
                    {t.checkout.acceptTerms} —{" "}
                    <a href="/contracts" target="_blank" className="text-primary hover:underline">Terms of Service</a>{" "}
                    &amp;{" "}
                    <a href="/contracts" target="_blank" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </motion.div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-5">{t.checkout.orderSummary}</h3>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.checkout.session} ({duration} min)</span>
                      <span className="font-medium text-foreground">{country.symbol}{local.toLocaleString()}</span>
                    </div>
                    {appliedCode && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Promo ({appliedCode.code})</span>
                        <span>−{country.symbol}{discountAmt.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                      <span>{t.checkout.total}</span>
                      <span className="text-primary text-lg">{country.symbol}{total.toLocaleString()}</span>
                    </div>
                    {country.code !== "US" && (
                      <div className="text-xs text-muted-foreground text-right">≈ ${usd} USD</div>
                    )}
                  </div>

                  {/* Booking summary */}
                  {(date || time || patientName) && (
                    <div className="bg-muted/40 rounded-xl p-3 mb-4 text-sm space-y-1.5">
                      {patientName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Patient</span>
                          <span className="font-medium truncate max-w-32">{patientName}</span>
                        </div>
                      )}
                      {date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium">{formatDateDisplay(date).split(",")[0]}, {date.split("-")[2]} {MONTH_NAMES[parseInt(date.split("-")[1]) - 1]?.slice(0, 3)}</span>
                        </div>
                      )}
                      {time && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-medium">{time}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-medium">Video call</span>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs mb-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {bookingError}
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={!canBook || loading}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                      canBook
                        ? "bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Booking…
                      </span>
                    ) : t.checkout.confirmBook}
                  </button>

                  <div className="mt-2 text-xs text-muted-foreground text-center space-y-0.5">
                    {!patientName.trim() && <p>Enter your name to continue</p>}
                    {patientName.trim() && !patientEmail.trim() && <p>Enter your email to continue</p>}
                    {patientName.trim() && patientEmail.trim() && !date && <p>Select a date</p>}
                    {patientName.trim() && patientEmail.trim() && date && !time && <p>Select a time slot</p>}
                    {patientName.trim() && patientEmail.trim() && date && time && !acceptTerms && <p>Please accept the terms</p>}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Fully encrypted & HIPAA-compliant. Cancel up to 24h before for a full refund.
                    </p>
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

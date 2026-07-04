import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Tag, Clock, Calendar, ChevronLeft, Star, Shield, Zap, AlertCircle } from "lucide-react";
import { useGetProvider } from "@workspace/api-client-react";
import { useCountry } from "@/context/CountryContext";
import { useLang } from "@/context/LanguageContext";
import { SESSION_DURATIONS, PROMO_CODES, getSessionPrice } from "@/lib/pricing";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "19:00",
];

function getNextDays(n: number): { label: string; value: string; day: string }[] {
  const days: { label: string; value: string; day: string }[] = [];
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 1; i <= n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      day: dayNames[d.getDay()],
      label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      value: d.toISOString().split("T")[0],
    });
  }
  return days;
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
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [referralCode, setReferralCode] = useState(params.get("ref") || "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const days = getNextDays(14);
  const basePrice = provider?.sessionPrice ?? 50;
  const { usd, local } = getSessionPrice(basePrice, duration, country);
  const discountAmt = appliedCode ? Math.round(local * appliedCode.discount) : 0;
  const total = local - discountAmt;

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

  const canBook = date && time && acceptTerms && !!provider;

  const handleBook = async () => {
    if (!canBook) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
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
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3">{t.checkout.successTitle}</h2>
          <p className="text-muted-foreground text-lg mb-2">{provider?.name}</p>
          <p className="text-muted-foreground mb-2">{date} · {time} · {duration} min</p>
          <p className="text-sm text-muted-foreground mb-8">{t.checkout.successSub}</p>
          <div className="bg-card border border-border rounded-2xl p-5 text-left mb-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.checkout.provider}</span>
              <span className="font-medium">{provider?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.checkout.duration}</span>
              <span className="font-medium">{duration} {t.checkout.min}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-3">
              <span>{t.checkout.total}</span>
              <span className="text-primary">{country.symbol}{total.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={() => navigate("/appointments")} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            View My Appointments
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <button onClick={() => navigate(-1 as any)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">{t.checkout.title}</h1>
          <p className="text-muted-foreground mb-10">{t.checkout.subtitle}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Provider summary */}
              {provider && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
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

              {/* Duration */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-5">
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
                        <div className="text-xs text-muted-foreground mb-2">min</div>
                        <div className="font-semibold text-primary text-sm">{country.symbol}{p.local.toLocaleString()}</div>
                        {d.multiplier > 1 && <div className="text-xs text-emerald-600 mt-0.5">Best value</div>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Date */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> {t.checkout.selectDate}
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((d) => (
                    <button key={d.value} onClick={() => setDate(d.value)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 text-center transition-all min-w-16 ${date === d.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <div className="text-xs text-muted-foreground">{d.day}</div>
                      <div className="font-semibold text-foreground text-sm">{d.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Time */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> {t.checkout.selectTime}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button key={slot} onClick={() => setTime(slot)}
                      className={`py-2.5 px-2 rounded-lg border text-sm font-medium text-center transition-all ${time === slot ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40 text-foreground"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Promo / Referral */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> {t.checkout.promoCode}
                </h3>
                <div className="flex gap-2 mb-3">
                  <input value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    placeholder={t.checkout.promoPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                  <button onClick={applyPromo} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
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
                  <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Friend's referral code"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                </div>
              </motion.div>

              {/* T&C */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
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

                  {date && time && (
                    <div className="bg-muted/40 rounded-xl p-3 mb-4 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{duration} min</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={!canBook || loading}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                      canBook ? "bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 shadow-lg" : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : t.checkout.confirmBook}
                  </button>

                  {!date && <p className="text-xs text-muted-foreground text-center mt-2">Select date & time to continue</p>}
                  {date && !time && <p className="text-xs text-muted-foreground text-center mt-2">Select a time slot</p>}
                  {date && time && !acceptTerms && <p className="text-xs text-muted-foreground text-center mt-2">Please accept the terms</p>}

                  <div className="mt-5 pt-4 border-t border-border flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Fully encrypted & HIPAA-compliant. Cancel up to 24h before for a full refund.</p>
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

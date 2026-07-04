import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Users, Building2, ChevronDown, Info } from "lucide-react";
import { COUNTRY_LIST, COUNTRIES, formatPrice, toUSD, type CountryPricing } from "@/lib/pricing";
import { AnimatePresence } from "framer-motion";
import { Link } from "wouter";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, color = "bg-primary", format = (v: number) => `${v}%` }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; color?: string; format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="text-sm font-bold text-primary tabular-nums">{format(value)}</span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
          style={{ background: `linear-gradient(to right, hsl(188,73%,19%) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function CountrySelect({ value, onChange }: { value: CountryPricing; onChange: (c: CountryPricing) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-left">
        <span className="flex items-center gap-2 font-semibold text-foreground text-sm">
          <span className="text-xl">{value.flag}</span> {value.name} ({value.currency})
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 text-sm bg-muted/40 rounded-lg outline-none" />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.code} onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors text-left ${value.code === c.code ? "font-bold text-primary" : "text-foreground"}`}>
                  <span>{c.flag}</span> {c.name}
                  <span className="ml-auto text-xs text-muted-foreground">{c.currency}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DonutChart({ slices }: { slices: { pct: number; color: string; label: string }[] }) {
  let cumulative = 0;
  const r = 60; const cx = 80; const cy = 80; const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40">
      {slices.map((s, i) => {
        const offset = circumference - (s.pct / 100) * circumference;
        const rotation = (cumulative / 100) * 360 - 90;
        cumulative += s.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
            transform={`rotate(${rotation} ${cx} ${cy})`} className="transition-all duration-500" />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground font-bold text-sm" style={{ fontSize: 11 }}>Revenue</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>split</text>
    </svg>
  );
}

export default function Simulator() {
  const [country, setCountry] = useState<CountryPricing>(COUNTRIES.JO);
  const [tierIndex, setTierIndex] = useState(1);
  const [platformFee, setPlatformFee] = useState(20);
  const [intermediaryFee, setIntermediaryFee] = useState(10);
  const [sessionsPerMonth, setSessionsPerMonth] = useState(60);
  const [hasIntermediary, setHasIntermediary] = useState(true);

  const tier = country.tiers[tierIndex];
  const localPrice = tier.localPrice;
  const usdPrice = toUSD(localPrice, country);

  const effectiveIntermediary = hasIntermediary ? intermediaryFee : 0;
  const providerPct = Math.max(0, 100 - platformFee - effectiveIntermediary);

  const platformLocal = Math.round(localPrice * platformFee / 100);
  const intermediaryLocal = Math.round(localPrice * effectiveIntermediary / 100);
  const providerLocal = localPrice - platformLocal - intermediaryLocal;

  const platformUSD = toUSD(platformLocal, country);
  const intermediaryUSD = toUSD(intermediaryLocal, country);
  const providerUSD = toUSD(providerLocal, country);

  const monthlyPlatform = Math.round(platformLocal * sessionsPerMonth);
  const monthlyIntermediary = Math.round(intermediaryLocal * sessionsPerMonth);
  const monthlyProvider = Math.round(providerLocal * sessionsPerMonth);
  const monthlyTotal = Math.round(localPrice * sessionsPerMonth);

  const annualPlatform = monthlyPlatform * 12;
  const annualTotal = monthlyTotal * 12;

  const donutSlices = [
    { pct: platformFee, color: "hsl(188,73%,19%)", label: "Platform" },
    { pct: effectiveIntermediary, color: "hsl(40,80%,55%)", label: "Intermediary" },
    { pct: providerPct, color: "hsl(152,60%,40%)", label: "Provider" },
  ].filter((s) => s.pct > 0);

  const projections = useMemo(() => [
    { sessions: 30, label: "Solo practice (30 sessions/mo)" },
    { sessions: 60, label: "Small clinic (60/mo)" },
    { sessions: 150, label: "Mid-scale platform (150/mo)" },
    { sessions: 500, label: "Enterprise (500/mo)" },
  ], []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <TrendingUp className="w-4 h-4" /> Revenue Simulator
          </span>
          <h1 className="font-serif text-5xl font-bold text-foreground mb-4">Model your earnings</h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Adjust platform fees, intermediary commissions, and session volume to see real-time revenue projections in any country's currency.</p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Controls */}
          <FadeIn className="lg:col-span-2">
            <div className="bg-card border border-border rounded-3xl p-7 space-y-7 sticky top-28">
              <div>
                <h2 className="font-semibold text-foreground text-sm mb-3 uppercase tracking-wide">Market</h2>
                <CountrySelect value={country} onChange={setCountry} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm mb-3 uppercase tracking-wide">Session Tier</h2>
                <div className="flex gap-2">
                  {country.tiers.map((t, i) => (
                    <button key={t.name} onClick={() => setTierIndex(i)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${tierIndex === i ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary/40"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatPrice(localPrice, country)} / session · ≈${usdPrice} USD
                </div>
              </div>
              <div className="space-y-5">
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Fee Structure</h2>
                <Slider label="Platform Fee" value={platformFee} min={5} max={40} onChange={setPlatformFee} />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Intermediary / Referral</span>
                    <button onClick={() => setHasIntermediary(!hasIntermediary)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${hasIntermediary ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${hasIntermediary ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {hasIntermediary && (
                    <Slider label="Intermediary Commission" value={intermediaryFee} min={0} max={30} onChange={setIntermediaryFee} />
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Provider receives</span>
                  <span className={`text-lg font-bold ${providerPct < 40 ? "text-red-500" : providerPct < 60 ? "text-amber-500" : "text-green-600"}`}>{providerPct}%</span>
                </div>
              </div>
              <div>
                <Slider label="Monthly Sessions (platform-wide)" value={sessionsPerMonth} min={10} max={1000} step={10} onChange={setSessionsPerMonth} format={(v) => v.toLocaleString()} />
              </div>
            </div>
          </FadeIn>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Per-session split */}
            <FadeIn delay={0.1}>
              <div className="bg-card border border-border rounded-3xl p-7">
                <h2 className="font-semibold text-foreground mb-6">Per Session Revenue Split</h2>
                <div className="flex items-center gap-8 mb-6">
                  <DonutChart slices={donutSlices} />
                  <div className="flex-1 space-y-3">
                    {[
                      { label: "MindBridge Platform", pct: platformFee, local: platformLocal, usd: platformUSD, color: "bg-primary", icon: Building2 },
                      ...(hasIntermediary ? [{ label: "Intermediary / Referral", pct: effectiveIntermediary, local: intermediaryLocal, usd: intermediaryUSD, color: "bg-amber-400", icon: Users }] : []),
                      { label: "Provider Earnings", pct: providerPct, local: providerLocal, usd: providerUSD, color: "bg-green-500", icon: Users },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.pct}% of session</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground text-sm">{formatPrice(item.local, country)}</div>
                          {country.currency !== "USD" && <div className="text-xs text-muted-foreground">≈${item.usd}</div>}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Session total</span>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{formatPrice(localPrice, country)}</span>
                        {country.currency !== "USD" && <div className="text-xs text-muted-foreground">≈${usdPrice}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax note */}
                {country.taxRate > 0 && (
                  <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{country.taxNote} — displayed prices are pre-tax. Add {Math.round(country.taxRate * 100)}% when invoicing.</span>
                  </div>
                )}
              </div>
            </FadeIn>

            {/* Monthly projection */}
            <FadeIn delay={0.15}>
              <div className="bg-card border border-border rounded-3xl p-7">
                <h2 className="font-semibold text-foreground mb-1">Monthly Projection</h2>
                <p className="text-xs text-muted-foreground mb-6">{sessionsPerMonth} sessions × {formatPrice(localPrice, country)}/session</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Platform Revenue", val: monthlyPlatform, icon: Building2, color: "text-primary bg-primary/10" },
                    ...(hasIntermediary ? [{ label: "Intermediary Cut", val: monthlyIntermediary, icon: Users, color: "text-amber-600 bg-amber-50" }] : []),
                    { label: "Provider Payout", val: monthlyProvider, icon: DollarSign, color: "text-green-600 bg-green-50" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl p-5 ${item.color.split(" ")[1]}`}>
                      <div className={`text-xs font-semibold mb-2 ${item.color.split(" ")[0]}`}>{item.label}</div>
                      <div className="font-serif text-2xl font-bold text-foreground">{formatPrice(item.val, country)}</div>
                      {country.currency !== "USD" && (
                        <div className="text-xs text-muted-foreground mt-0.5">≈${toUSD(item.val, country).toLocaleString()} USD</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">Total GMV (monthly)</span>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatPrice(monthlyTotal, country)}</div>
                    {country.currency !== "USD" && <div className="text-xs text-muted-foreground">≈${toUSD(monthlyTotal, country).toLocaleString()}</div>}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Scale projections */}
            <FadeIn delay={0.2}>
              <div className="bg-card border border-border rounded-3xl p-7">
                <h2 className="font-semibold text-foreground mb-5">Scale Projections — Platform Revenue ({country.flag})</h2>
                <div className="space-y-3">
                  {projections.map((p) => {
                    const rev = Math.round(localPrice * p.sessions * platformFee / 100);
                    const annualRev = rev * 12;
                    const barW = Math.min(100, (p.sessions / 500) * 100);
                    return (
                      <div key={p.sessions} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-foreground">{formatPrice(rev, country)}/mo</span>
                            <span className="text-xs text-muted-foreground ml-2">({formatPrice(annualRev, country)}/yr)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${barW}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>

            {/* Annual headline */}
            <FadeIn delay={0.25}>
              <div className="rounded-3xl bg-gradient-to-br from-[hsl(188,73%,8%)] to-[hsl(188,55%,18%)] p-7 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white/60 text-sm font-medium mb-1">Projected Annual Platform Revenue</div>
                    <div className="font-serif text-4xl font-bold">{formatPrice(annualPlatform, country)}</div>
                    {country.currency !== "USD" && <div className="text-white/50 text-sm mt-1">≈ ${toUSD(annualPlatform, country).toLocaleString()} USD</div>}
                  </div>
                  <TrendingUp className="w-10 h-10 text-primary/60" />
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                  <div><div className="text-white/50">Sessions/yr</div><div className="font-bold">{(sessionsPerMonth * 12).toLocaleString()}</div></div>
                  <div><div className="text-white/50">Total GMV/yr</div><div className="font-bold">{formatPrice(annualTotal, country)}</div></div>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} className="text-center">
              <Link href="/contracts" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
                View legal contracts & terms for {country.name} →
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}

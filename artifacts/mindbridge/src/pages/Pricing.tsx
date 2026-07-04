import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Globe, Info, Star, Zap } from "lucide-react";
import { COUNTRY_LIST, COUNTRIES, formatPrice, toUSD, type CountryPricing } from "@/lib/pricing";
import { Link } from "wouter";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

function CountrySelector({ value, onChange }: { value: CountryPricing; onChange: (c: CountryPricing) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-primary/30 bg-card hover:border-primary/60 transition-all font-semibold text-foreground shadow-sm">
        <span className="text-2xl">{value.flag}</span>
        <div className="text-left">
          <div className="text-sm font-bold">{value.name}</div>
          <div className="text-xs text-muted-foreground">{value.currency}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-72 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-border">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search country..." className="w-full px-3 py-2 text-sm bg-muted/40 rounded-xl outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.code} onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left ${value.code === c.code ? "bg-primary/5 font-semibold text-primary" : "text-foreground"}`}>
                  <span className="text-lg">{c.flag}</span>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.currency} · {c.region}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TierCard({ tier, country, isAnnual }: { tier: CountryPricing["tiers"][0]; country: CountryPricing; isAnnual: boolean }) {
  const basePrice = isAnnual ? Math.round(tier.localPrice * 0.80) : tier.localPrice;
  const withTax = country.taxRate > 0 ? Math.round(basePrice * (1 + country.taxRate)) : basePrice;
  const usdEquiv = toUSD(basePrice, country);

  return (
    <motion.div layout className={`relative flex flex-col rounded-3xl border-2 p-7 transition-all duration-300 ${tier.recommended ? "border-primary bg-primary shadow-2xl shadow-primary/20 text-primary-foreground" : "border-border bg-card hover:border-primary/30 hover:shadow-xl"}`}>
      {tier.recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 text-amber-900 text-xs font-bold shadow-lg whitespace-nowrap">
          <Star className="w-3.5 h-3.5 fill-current" /> Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className={`font-serif text-xl font-bold mb-1 ${tier.recommended ? "text-white" : "text-foreground"}`}>{tier.label}</h3>
        <p className={`text-sm ${tier.recommended ? "text-white/70" : "text-muted-foreground"}`}>{tier.minutesPerSession} min · {tier.sessionsPerMonth} sessions/mo</p>
      </div>
      <div className="mb-6">
        <div className={`font-serif text-4xl font-bold ${tier.recommended ? "text-white" : "text-foreground"}`}>
          {formatPrice(basePrice, country)}
          <span className={`text-base font-normal ml-1 ${tier.recommended ? "text-white/60" : "text-muted-foreground"}`}>/session</span>
        </div>
        {country.currency !== "USD" && (
          <div className={`text-sm mt-1 ${tier.recommended ? "text-white/60" : "text-muted-foreground"}`}>≈ ${usdEquiv} USD</div>
        )}
        {false && (
          <div className={`text-xs mt-0.5 ${tier.recommended ? "text-white/50" : "text-muted-foreground/70"}`}>
            {formatPrice(withTax, country)} incl. tax
          </div>
        )}
        {isAnnual && (
          <span className={`inline-flex mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${tier.recommended ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>
            20% annual discount applied
          </span>
        )}
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {tier.features.map((f) => (
          <li key={f} className={`flex items-start gap-2.5 text-sm ${tier.recommended ? "text-white/90" : "text-foreground/80"}`}>
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.recommended ? "text-white" : "text-primary"}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/get-started"
        className={`w-full text-center py-3.5 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${tier.recommended ? "bg-white text-primary hover:bg-white/95" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
        Get started
      </Link>
    </motion.div>
  );
}

export default function Pricing() {
  const [country, setCountry] = useState<CountryPricing>(COUNTRIES.JO);
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Globe className="w-4 h-4" /> Pricing adapts to your country
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Fair pricing, <span className="text-primary">everywhere</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Rates are calibrated to each country's economy so care is accessible at home and abroad.
          </p>
        </FadeIn>

        {/* Country + billing selector */}
        <FadeIn delay={0.1} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <CountrySelector value={country} onChange={setCountry} />
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted border border-border">
            <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!isAnnual ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Monthly</button>
            <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${isAnnual ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Annual <span className="text-xs text-green-600 font-bold">-20%</span>
            </button>
          </div>
        </FadeIn>

        {/* Cultural / legal note */}
        <AnimatePresence mode="wait">
          <motion.div key={country.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900 text-sm mb-0.5">{country.flag} {country.name} — Cultural Context</div>
                <div className="text-blue-700 text-xs leading-relaxed">{country.culturalNote}</div>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900 text-sm mb-0.5">Tax & Legal Note</div>
                <div className="text-amber-700 text-xs leading-relaxed">{country.taxNote}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tier cards */}
        <AnimatePresence mode="wait">
          <motion.div key={country.code + isAnnual} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {country.tiers.map((tier) => (
              <TierCard key={tier.name} tier={tier} country={country} isAnnual={isAnnual} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Compare all countries table */}
        <FadeIn className="mb-10">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-8">Standard session price by country</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-5 py-3 font-semibold text-foreground">Country</th>
                  <th className="text-left px-5 py-3 font-semibold text-foreground">Currency</th>
                  <th className="text-right px-5 py-3 font-semibold text-foreground">Essential</th>
                  <th className="text-right px-5 py-3 font-semibold text-foreground">Standard</th>
                  <th className="text-right px-5 py-3 font-semibold text-foreground">Premium</th>
                  <th className="text-right px-5 py-3 font-semibold text-foreground">Tax</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRY_LIST.map((c, i) => (
                  <tr key={c.code} className={`border-b border-border last:border-0 cursor-pointer hover:bg-primary/4 transition-colors ${country.code === c.code ? "bg-primary/5" : i % 2 === 0 ? "bg-white" : "bg-muted/20"}`}
                    onClick={() => setCountry(c)}>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        {c.flag} {c.name}
                        {country.code === c.code && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white font-medium">Selected</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.currency}</td>
                    {c.tiers.map((t) => (
                      <td key={t.name} className="px-5 py-3 text-right font-mono text-foreground">{c.symbol}{t.localPrice.toLocaleString()}</td>
                    ))}
                    <td className="px-5 py-3 text-right text-muted-foreground">{c.taxRate > 0 ? `${Math.round(c.taxRate * 100)}%` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        {/* Revenue simulator CTA */}
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center p-8 rounded-3xl bg-gradient-to-br from-[hsl(188,73%,8%)] to-[hsl(188,60%,18%)] text-white">
            <Zap className="w-10 h-10 mx-auto mb-4 text-amber-400" />
            <h3 className="font-serif text-2xl font-bold mb-2">See how revenue is split</h3>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">Use our revenue simulator to model platform fees, provider earnings, and intermediary commissions — for any country.</p>
            <Link href="/simulator" className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white text-foreground font-semibold hover:bg-white/95 transition-all hover:-translate-y-0.5 shadow-lg">
              Open Revenue Simulator
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

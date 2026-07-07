import { useState } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Search, Star, Filter, CheckCircle, Globe, ChevronDown } from "lucide-react";
import { useListProviders } from "@workspace/api-client-react";
import { useCountry } from "@/context/CountryContext";
import { COUNTRY_LIST, type CountryPricing } from "@/lib/pricing";
import { useLang } from "@/context/LanguageContext";

function CurrencyTag({ price, country }: { price: number; country: CountryPricing }) {
  const local = Math.round(price * country.usdRate);
  return (
    <div className="text-end">
      <div className="font-bold text-foreground">
        {country.symbol}{local.toLocaleString()}
        <span className="text-xs font-normal text-muted-foreground ms-0.5">/{country.currency}</span>
      </div>
      {country.code !== "US" && <div className="text-xs text-muted-foreground">≈ ${price} USD</div>}
    </div>
  );
}

function CountryPicker({ value, onChange }: { value: CountryPricing; onChange: (c: CountryPricing) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const filtered = COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-input bg-background text-sm hover:border-primary/40 transition-colors">
        <Globe className="w-4 h-4 text-primary"/>
        <span className="font-medium text-foreground">{value.flag} {value.name}</span>
        <span className="text-muted-foreground text-xs">{value.symbol}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open?"rotate-180":""}`}/>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t.providerPage.searchCountry}
              className="w-full px-3 py-2 text-sm bg-muted/40 rounded-lg outline-none"/>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button key={c.code} onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-start hover:bg-muted/50 transition-colors ${value.code===c.code?"text-primary font-semibold":"text-foreground"}`}>
                <span>{c.flag}</span><span>{c.name}</span>
                <span className="ms-auto text-muted-foreground text-xs">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Providers() {
  const { t, dir }  = useLang();
  const p           = t.providerPage;
  const search      = useSearch();
  const params      = new URLSearchParams(search);
  const initialSpec = params.get("specialty") || "";
  const initialGender = params.get("gender") || "";

  const { country, setCountry } = useCountry();
  const [searchTerm, setSearchTerm]     = useState("");
  const [specialty, setSpecialty]       = useState(initialSpec);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState(initialGender);

  const queryParams = {
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(specialty ? { specialty } : {}),
    ...(availableOnly ? { available: true } : {}),
  };

  const { data: providers, isLoading } = useListProviders(queryParams);

  const filtered = (providers ?? []).filter((item) =>
    genderFilter ? item.title?.toLowerCase().includes(genderFilter.toLowerCase()) : true
  );

  return (
    <div dir={dir} className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">{p.title}</h1>
              <p className="text-muted-foreground text-lg">{p.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2.5">
              <Globe className="w-4 h-4 text-primary"/>
              <span className="text-sm text-muted-foreground">{p.pricesIn}</span>
              <CountryPicker value={country} onChange={setCountry}/>
            </div>
          </div>

          {initialSpec && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle className="w-4 h-4"/>
              {p.showingSpecialty} <strong>{initialSpec}</strong>
            </motion.div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <input type="search" placeholder={p.searchName} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
          </div>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring md:w-52">
            {p.specialtyOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring md:w-44">
            <option value="">{p.anyGender}</option>
            <option value="male">{p.maleProviders}</option>
            <option value="female">{p.femaleProviders}</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="rounded border-input"/>
            {p.availableNow}
          </label>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
            <h3 className="font-semibold text-foreground text-lg mb-2">{p.noFound}</h3>
            <p className="text-muted-foreground">{p.tryAdjust}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {filtered.length} {p.availableNow} · {p.pricesIn} {country.flag} {country.currency}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}>
                  <Link href={`/providers/${item.id}`} className="group block h-full">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                      <div className="relative h-52 overflow-hidden bg-muted">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        {item.available ? (
                          <div className="absolute top-3 end-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> {p.available}
                          </div>
                        ) : (
                          <div className="absolute top-3 end-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">{p.waitlisted}</div>
                        )}
                        {item.acceptsInsurance && (
                          <div className="absolute bottom-3 start-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-foreground text-xs font-medium">
                            <CheckCircle className="w-3 h-3 text-emerald-600"/> {p.insurance}
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg leading-tight">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.title}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 flex-shrink-0 ms-2">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>
                            <span className="text-sm font-semibold">{item.rating}</span>
                            <span className="text-xs text-muted-foreground">({item.reviewCount})</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">{item.specialty}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{item.yearsExperience}{p.exp}</span>
                          {item.languages && item.languages.length > 1 && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{item.languages.join(", ")}</span>
                          )}
                        </div>
                        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                          <CurrencyTag price={item.sessionPrice} country={country}/>
                          {item.nextAvailable && <span className="text-xs text-muted-foreground">{p.nextAvail} {item.nextAvailable}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

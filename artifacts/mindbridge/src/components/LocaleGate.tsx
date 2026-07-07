import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, ChevronRight, Globe, Leaf } from "lucide-react";
import { useLocation } from "wouter";
import { useLang, type Lang } from "@/context/LanguageContext";
import { useCountry } from "@/context/CountryContext";
import { COUNTRY_LIST } from "@/lib/pricing";

const STORAGE_KEY  = "clearhead_locale_set";      // localStorage — first-ever visit
const SESSION_KEY  = "clearhead_locale_session";   // sessionStorage — general first-in-session
const JOURNEY_KEY  = "clearhead_locale_journey";   // sessionStorage — /get-started per-session

/* ─── Available languages ────────────────────────────────────── */
const LANGUAGES: {
  code: Lang | string;
  label: string;
  native: string;
  flag: string;
  available: boolean;
  dir: "ltr" | "rtl";
}[] = [
  { code: "en", label: "English",    native: "English",    flag: "🇬🇧", available: true,  dir: "ltr" },
  { code: "ar", label: "Arabic",     native: "العربية",    flag: "🇸🇦", available: true,  dir: "rtl" },
  { code: "fr", label: "French",     native: "Français",   flag: "🇫🇷", available: false, dir: "ltr" },
  { code: "es", label: "Spanish",    native: "Español",    flag: "🇪🇸", available: false, dir: "ltr" },
  { code: "de", label: "German",     native: "Deutsch",    flag: "🇩🇪", available: false, dir: "ltr" },
  { code: "tr", label: "Turkish",    native: "Türkçe",     flag: "🇹🇷", available: false, dir: "ltr" },
  { code: "hi", label: "Hindi",      native: "हिन्दी",     flag: "🇮🇳", available: false, dir: "ltr" },
  { code: "ur", label: "Urdu",       native: "اردو",       flag: "🇵🇰", available: false, dir: "rtl" },
];

/* ─── Copy per language ──────────────────────────────────────── */
const COPY: Record<string, { welcome: string; sub: string; langTitle: string; countryTitle: string; countrySub: string; search: string; done: string; soon: string; skip: string }> = {
  en: {
    welcome: "Welcome to Clearhead",
    sub: "Expert mental health care, anywhere in the world.",
    langTitle: "Choose your language",
    countryTitle: "Where are you based?",
    countrySub: "We'll show prices in your local currency and match nearby providers.",
    search: "Search country…",
    done: "Get started",
    soon: "Soon",
    skip: "Skip for now",
  },
  ar: {
    welcome: "مرحباً بك في كليرهيد",
    sub: "رعاية نفسية متخصصة، في أي مكان في العالم.",
    langTitle: "اختر لغتك",
    countryTitle: "أين تقيم؟",
    countrySub: "سنعرض الأسعار بعملتك المحلية ونطابقك مع مزودين قريبين.",
    search: "ابحث عن دولة…",
    done: "ابدأ الآن",
    soon: "قريباً",
    skip: "تخطّ الآن",
  },
};

function getCopy(lang: string) {
  return COPY[lang] ?? COPY.en;
}

/* ─── Component ──────────────────────────────────────────────── */
export default function LocaleGate() {
  const { lang, setLang } = useLang();
  const { country, setCountry } = useCountry();
  const [location] = useLocation();

  const [visible, setVisible]     = useState(false);
  const [page, setPage]           = useState<"lang" | "country">("lang");
  const [selectedLang, setSelectedLang] = useState<string>(lang);
  const [countryQ, setCountryQ]   = useState("");
  const [selectedCountry, setSelectedCountry] = useState(country);

  /* Show on first-ever visit globally; also once per session when entering /get-started */
  useEffect(() => {
    const isJourney = location.startsWith("/get-started") || location.startsWith("/book-now");
    if (isJourney) {
      const journeyDone = sessionStorage.getItem(JOURNEY_KEY);
      if (!journeyDone) { setVisible(true); return; }
    } else {
      const globalDone = localStorage.getItem(STORAGE_KEY);
      const sessionDone = sessionStorage.getItem(SESSION_KEY);
      if (!globalDone && !sessionDone) setVisible(true);
    }
  }, [location]);

  const c = getCopy(selectedLang);
  const isRtl = LANGUAGES.find(l => l.code === selectedLang)?.dir === "rtl";
  const isJourney = location.startsWith("/get-started") || location.startsWith("/book-now");

  const filteredCountries = COUNTRY_LIST.filter(ct =>
    !countryQ ||
    ct.name.toLowerCase().includes(countryQ.toLowerCase()) ||
    ct.currency.toLowerCase().includes(countryQ.toLowerCase())
  );

  const finish = () => {
    if (LANGUAGES.find(l => l.code === selectedLang)?.available) {
      setLang(selectedLang as Lang);
    }
    setCountry(selectedCountry);
    localStorage.setItem(STORAGE_KEY, "1");
    sessionStorage.setItem(SESSION_KEY, "1");
    if (isJourney) sessionStorage.setItem(JOURNEY_KEY, "1");
    setVisible(false);
  };

  const skip = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    sessionStorage.setItem(SESSION_KEY, "1");
    if (isJourney) sessionStorage.setItem(JOURNEY_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(10,30,20,0.70)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            dir={isRtl ? "rtl" : "ltr"}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[hsl(158,55%,22%)] to-[hsl(168,50%,30%)] px-8 pt-8 pb-6 text-white text-center relative overflow-hidden">
              {/* Decorative rings */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5"/>
              <div className="absolute -bottom-4 -left-6 w-24 h-24 rounded-full bg-white/5"/>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Leaf className="w-7 h-7 text-white"/>
                </div>
                <h1 className="font-serif text-2xl font-bold mb-1">{c.welcome}</h1>
                <p className="text-white/70 text-sm">{c.sub}</p>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${page==="lang" ? "w-8 bg-white" : "w-4 bg-white/40"}`}/>
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${page==="country" ? "w-8 bg-white" : "w-4 bg-white/40"}`}/>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <AnimatePresence mode="wait">

                {/* ── Page 1: Language ── */}
                {page === "lang" && (
                  <motion.div key="lang"
                    initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.22 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-4 h-4 text-primary"/>
                      <span className="font-semibold text-sm text-foreground">{c.langTitle}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {LANGUAGES.map(l => {
                        const sel = selectedLang === l.code;
                        return (
                          <button key={l.code}
                            onClick={() => l.available && setSelectedLang(l.code)}
                            disabled={!l.available}
                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all
                              ${sel ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white"}
                              ${l.available ? "hover:border-primary/40 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                            <span className="text-2xl">{l.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-sm ${sel ? "text-primary" : "text-foreground"}`}
                                dir={l.dir}>{l.native}</div>
                              <div className="text-[11px] text-muted-foreground">{l.label}</div>
                            </div>
                            {sel && <Check className="w-4 h-4 text-primary flex-shrink-0"/>}
                            {!l.available && (
                              <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {c.soon}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      <button onClick={skip}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                        {c.skip}
                      </button>
                      <button onClick={() => setPage("country")}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-md">
                        {isRtl ? <><ChevronRight className="w-4 h-4 rotate-180"/> {c.done.split(" ")[0] ?? "Next"}</> : <>Next <ChevronRight className="w-4 h-4"/></>}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Page 2: Country ── */}
                {page === "country" && (
                  <motion.div key="country"
                    initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.22 }}>
                    <div className="mb-4">
                      <div className="font-semibold text-sm text-foreground mb-0.5">{c.countryTitle}</div>
                      <div className="text-xs text-muted-foreground">{c.countrySub}</div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-3">
                      <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}/>
                      <input
                        value={countryQ}
                        onChange={e => setCountryQ(e.target.value)}
                        placeholder={c.search}
                        className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                      />
                    </div>

                    {/* Country list */}
                    <div className="max-h-52 overflow-y-auto space-y-1 mb-5">
                      {filteredCountries.map(ct => {
                        const sel = selectedCountry.code === ct.code;
                        return (
                          <button key={ct.code} onClick={() => setSelectedCountry(ct)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all
                              ${sel ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:border-primary/30 hover:bg-white"}`}>
                            <span className="text-xl">{ct.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-foreground">{ct.name}</div>
                              <div className="text-[11px] text-muted-foreground">{ct.currency} · {ct.region}</div>
                            </div>
                            {sel && <Check className="w-4 h-4 text-primary flex-shrink-0"/>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={() => setPage("lang")}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-border text-sm font-semibold text-foreground hover:border-primary/40 transition-all">
                        {isRtl ? <><ChevronRight className="w-4 h-4"/></> : <><ChevronRight className="w-4 h-4 rotate-180"/></>}
                      </button>
                      <button onClick={finish}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-md">
                        {c.done} <ChevronRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`}/>
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, TrendingUp, Scale, Globe, Layers, UserPlus, Languages } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [location] = useLocation();
  const { t, lang, setLang } = useLang();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/providers", label: t.nav.providers },
    { href: "/specialties", label: t.nav.specialties },
    { href: "/appointments", label: t.nav.mySessions },
  ];

  const platformLinks = [
    { href: "/pricing", label: t.nav.pricing, icon: Globe, desc: lang === "ar" ? "أسعار تكيّفية حسب الدولة" : "Country-adaptive rates" },
    { href: "/simulator", label: t.nav.simulator, icon: TrendingUp, desc: lang === "ar" ? "نموذج الرسوم والأرباح" : "Fee & earnings model" },
    { href: "/contracts", label: t.nav.legal, icon: Scale, desc: lang === "ar" ? "شروط خاصة بالولاية القضائية" : "Jurisdiction-specific terms" },
    { href: "/add-doctor", label: t.nav.addDoctor, icon: UserPlus, desc: lang === "ar" ? "سجّل ممارستك" : "Register your practice" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setPlatformOpen(false); }, [location]);

  const isPlatformActive = platformLinks.some((l) => location.startsWith(l.href));

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
                <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.14-7-7 3.14-7 7-7z" fill="currentColor" opacity="0.35"/>
                <path d="M12 7.5v1.8M16 9.2l-1.3 1.3M17.5 12H15.7M16 14.8l-1.3-1.3M12 16.5v-1.8M8 14.8l1.3-1.3M6.5 12h1.8M8 9.2l1.3 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors">
              Clearhead
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location === link.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`}>
                {link.label}
              </Link>
            ))}

            {/* Platform dropdown */}
            <div className="relative" onMouseEnter={() => setPlatformOpen(true)} onMouseLeave={() => setPlatformOpen(false)}>
              <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isPlatformActive ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}>
                <Layers className="w-3.5 h-3.5" />
                {t.nav.platform}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${platformOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {platformOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-68 bg-white border border-border rounded-2xl shadow-xl overflow-hidden p-2"
                  >
                    {platformLinks.map((item) => (
                      <Link key={item.href} href={item.href}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors ${location === item.href ? "bg-primary/5" : ""}`}>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right: Lang toggle + CTA */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
              title="Toggle language"
            >
              <Languages className="w-4 h-4" />
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <Link href="/get-started"
              className="hidden md:inline-flex items-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              {t.nav.getStarted}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-foreground/70 hover:bg-muted transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-white/98 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location === link.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}>
                  {link.label}
                </Link>
              ))}
              <div className="mt-1 pt-2 border-t border-border">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.nav.platform}</div>
                {platformLinks.map((item) => (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location === item.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    }`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground/70 hover:bg-muted">
                  <Languages className="w-4 h-4" />
                  {lang === "en" ? "عربي" : "English"}
                </button>
                <Link href="/get-started" className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold text-center">
                  {t.nav.getStarted}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

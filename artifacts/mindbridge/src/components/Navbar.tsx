import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, TrendingUp, Scale, Globe, Layers } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/providers", label: "Providers" },
  { href: "/specialties", label: "Specialties" },
  { href: "/appointments", label: "My Sessions" },
];

const platformLinks = [
  { href: "/pricing", label: "Pricing", icon: Globe, desc: "Country-adaptive rates" },
  { href: "/simulator", label: "Revenue Simulator", icon: TrendingUp, desc: "Fee & earnings model" },
  { href: "/contracts", label: "Legal Contracts", icon: Scale, desc: "Jurisdiction-specific terms" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [location] = useLocation();

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
                <path d="M12 4C9.5 4 7.5 5.8 7 8.2C5.3 8.7 4 10.2 4 12C4 14.2 5.8 16 8 16H16C18.2 16 20 14.2 20 12C20 10.2 18.7 8.7 17 8.2C16.5 5.8 14.5 4 12 4Z" fill="currentColor" opacity="0.3"/>
                <path d="M9 12.5C9 11.1 10.1 10 11.5 10C12.9 10 14 11.1 14 12.5C14 13.9 12.9 15 11.5 15C10.1 15 9 13.9 9 12.5Z" fill="currentColor"/>
                <path d="M12 8V10M15 9.8L13.5 11.3M17 12.5H15M15 15.2L13.5 13.7M12 17V15M9 15.2L10.5 13.7M7 12.5H9M9 9.8L10.5 11.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors">
              MindBridge
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
              <button
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isPlatformActive ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Platform
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${platformOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {platformOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-2xl shadow-xl overflow-hidden p-2"
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

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <Link href="/get-started"
              className="hidden md:inline-flex items-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Get Started
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
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Platform</div>
                {platformLinks.map((item) => (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location === item.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    }`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                  </Link>
                ))}
              </div>
              <Link href="/get-started" className="mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold text-center">
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

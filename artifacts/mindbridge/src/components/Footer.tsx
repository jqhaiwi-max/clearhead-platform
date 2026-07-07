import { Link } from "wouter";
import { useLang } from "@/context/LanguageContext";

export default function Footer() {
  const { t, dir } = useLang();
  const f = t.footer;

  return (
    <footer dir={dir} className="bg-foreground text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4C9.5 4 7.5 5.8 7 8.2C5.3 8.7 4 10.2 4 12C4 14.2 5.8 16 8 16H16C18.2 16 20 14.2 20 12C20 10.2 18.7 8.7 17 8.2C16.5 5.8 14.5 4 12 4Z" fill="currentColor" opacity="0.4"/>
                  <path d="M9 12.5C9 11.1 10.1 10 11.5 10C12.9 10 14 11.1 14 12.5C14 13.9 12.9 15 11.5 15C10.1 15 9 13.9 9 12.5Z" fill="currentColor"/>
                </svg>
              </div>
              <span className="font-serif font-bold text-xl text-white">Clearhead</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">{f.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {f.badges.map((badge) => (
                <span key={badge} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{f.platformTitle}</h4>
            <ul className="space-y-3">
              {f.platformLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{f.specialtiesTitle}</h4>
            <ul className="space-y-3">
              {f.specialties.map((s, i) => (
                <li key={i}>
                  <Link href={`/providers?specialty=${encodeURIComponent(s)}`} className="text-sm text-white/60 hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{f.supportTitle}</h4>
            <ul className="space-y-3">
              {f.supportLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 leading-relaxed">{f.crisisNote}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">{f.copyright}</p>
          <p className="text-sm text-white/40">{f.notEmergency}</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "wouter";

const specialties = ["Anxiety & Stress", "Depression", "PTSD & Trauma", "ADHD", "Bipolar Disorder", "OCD", "Grief & Loss", "Addiction"];

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4C9.5 4 7.5 5.8 7 8.2C5.3 8.7 4 10.2 4 12C4 14.2 5.8 16 8 16H16C18.2 16 20 14.2 20 12C20 10.2 18.7 8.7 17 8.2C16.5 5.8 14.5 4 12 4Z" fill="currentColor" opacity="0.4"/>
                  <path d="M9 12.5C9 11.1 10.1 10 11.5 10C12.9 10 14 11.1 14 12.5C14 13.9 12.9 15 11.5 15C10.1 15 9 13.9 9 12.5Z" fill="currentColor"/>
                </svg>
              </div>
              <span className="font-serif font-bold text-xl text-white">MindBridge</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Board-certified psychiatric care, wherever you are in the world. Compassionate, discreet, and on your schedule.
            </p>
            <div className="flex gap-3">
              {["Verified Providers", "HIPAA Secure", "24/7 Support"].map((badge) => (
                <span key={badge} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: "Find a Provider", href: "/providers" },
                { label: "Book a Session", href: "/book" },
                { label: "My Appointments", href: "/appointments" },
                { label: "Specialties", href: "/specialties" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Specialties</h4>
            <ul className="space-y-3">
              {specialties.slice(0, 6).map((s) => (
                <li key={s}>
                  <Link href={`/providers?specialty=${encodeURIComponent(s)}`} className="text-sm text-white/60 hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              {["Help Center", "Privacy Policy", "Terms of Service", "Crisis Resources", "Contact Us"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 leading-relaxed">
                In crisis? Call or text 988 (Suicide & Crisis Lifeline) for immediate support 24/7.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            2024 MindBridge Health Inc. All rights reserved.
          </p>
          <p className="text-sm text-white/40">
            Not for emergency services. If you are in crisis, call 911 or 988.
          </p>
        </div>
      </div>
    </footer>
  );
}

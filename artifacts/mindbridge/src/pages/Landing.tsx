import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Star, Shield, Globe, Clock, CheckCircle } from "lucide-react";
import {
  useGetFeaturedProviders,
  useListTestimonials,
  useGetPlatformStats,
  useListSpecialties,
} from "@workspace/api-client-react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const steps = [
  { num: "01", title: "Tell us what you need", desc: "Complete a brief intake to help us understand your goals and preferences." },
  { num: "02", title: "Match with a specialist", desc: "Browse board-certified psychiatrists who specialize in your area of focus." },
  { num: "03", title: "Book your session", desc: "Choose a time that fits your schedule — video, phone, or messaging." },
  { num: "04", title: "Start feeling better", desc: "Get evidence-based care from the comfort of your home, on your terms." },
];

const trustItems = [
  { icon: Shield, label: "HIPAA Compliant", desc: "All sessions are fully encrypted and private." },
  { icon: CheckCircle, label: "Board-Certified Only", desc: "Every provider is rigorously credentialed." },
  { icon: Globe, label: "47 Countries Served", desc: "Access care anywhere in the world." },
  { icon: Clock, label: "Flexible Scheduling", desc: "Evening and weekend appointments available." },
];

export default function Landing() {
  const { data: providers } = useGetFeaturedProviders();
  const { data: testimonials } = useListTestimonials();
  const { data: stats } = useGetPlatformStats();
  const { data: specialties } = useListSpecialties();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(158,55%,8%)] via-[hsl(158,48%,14%)] to-[hsl(165,42%,20%)]">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[hsl(158,60%,35%)] blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[hsl(200,60%,45%)] blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-[hsl(38,85%,55%)] blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Providers available now
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
          >
            Expert psychiatric care,
            <br />
            <span className="text-[hsl(188,60%,65%)]">wherever you are</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Connect with board-certified psychiatrists and therapists who truly listen. Evidence-based treatment for anxiety, depression, ADHD, PTSD, and more — from the comfort of home, in your language.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-white/50 text-sm font-medium mb-4 tracking-wide"
          >
            Choose the type of care you're looking for
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto"
          >
            {[
              { id: "individual", emoji: "🧠", title: "Individual Therapy", sub: "Adults 18 and above" },
              { id: "couples", emoji: "💑", title: "Couples Counseling", sub: "For you or with a partner" },
              { id: "children", emoji: "🧒", title: "Children & Teens", sub: "Under 18 years" },
            ].map((svc, i) => (
              <Link
                key={svc.id}
                href={`/get-started?type=${svc.id}`}
                className="group flex-1 flex flex-col items-center gap-2 px-4 py-5 rounded-2xl bg-white/8 border border-white/15 hover:bg-white hover:border-white hover:shadow-2xl transition-all duration-250 hover:-translate-y-1 text-center"
              >
                <span className="text-3xl">{svc.emoji}</span>
                <div>
                  <div className="text-white group-hover:text-foreground font-semibold text-sm transition-colors">{svc.title}</div>
                  <div className="text-white/50 group-hover:text-muted-foreground text-xs mt-0.5 transition-colors">{svc.sub}</div>
                </div>
                <div className="flex items-center gap-1 text-white/40 group-hover:text-primary text-xs font-medium transition-colors mt-1">
                  Get started <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-5"
          >
            <Link
              href="/providers"
              className="text-white/40 hover:text-white/70 text-sm transition-colors underline underline-offset-4"
            >
              Browse all providers instead
            </Link>
          </motion.div>
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {[
                { val: `${stats.totalProviders}+`, label: "Providers" },
                { val: `${Math.round(stats.totalPatients / 1000)}K+`, label: "Patients Served" },
                { val: `${stats.satisfactionRate}%`, label: "Satisfaction Rate" },
                { val: `${stats.countriesServed}`, label: "Countries" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="font-serif text-3xl font-bold text-white">{item.val}</div>
                  <div className="text-sm text-white/50 mt-1">{item.label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2"
          >
            <div className="w-1.5 h-3 rounded-full bg-white/50" />
          </motion.div>
        </div>
      </section>

      {/* Specialties */}
      {specialties && specialties.length > 0 && (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-14">
              <h2 className="font-serif text-4xl font-bold text-foreground mb-4">Conditions we treat</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">Specialized care across the full spectrum of mental health needs.</p>
            </FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specialties.slice(0, 8).map((s, i) => (
                <FadeIn key={s.id} delay={i * 0.05}>
                  <Link
                    href={`/providers?specialty=${encodeURIComponent(s.name)}`}
                    className="group block p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                      <span className="text-primary font-serif font-bold text-lg">{s.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.providerCount} specialists</p>
                  </Link>
                </FadeIn>
              ))}
            </div>
            <FadeIn delay={0.4} className="text-center mt-10">
              <Link href="/specialties" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-200">
                View all specialties <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Featured Providers */}
      {providers && providers.length > 0 && (
        <section className="py-24 bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-4">
              <div>
                <h2 className="font-serif text-4xl font-bold text-foreground mb-3">Meet our specialists</h2>
                <p className="text-muted-foreground text-lg max-w-lg">All providers are board-certified and background-verified before joining Clearhead.</p>
              </div>
              <Link href="/providers" className="inline-flex items-center gap-2 text-primary font-semibold whitespace-nowrap hover:gap-3 transition-all duration-200">
                Browse all <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.slice(0, 6).map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <Link href={`/providers/${p.id}`} className="group block">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                      <div className="relative h-56 overflow-hidden bg-muted">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {p.available && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Available
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{p.name}</h3>
                            <p className="text-sm text-muted-foreground">{p.title}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold">{p.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          <span className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground font-medium">{p.specialty}</span>
                          <span className="text-xs text-muted-foreground">{p.yearsExperience}y exp.</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">${p.sessionPrice}/session</span>
                          <span className="text-sm font-semibold text-primary group-hover:underline">View profile</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">How Clearhead works</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">Getting started takes less than 5 minutes.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border -translate-x-8 z-0" />
                  )}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                      <span className="font-serif font-bold text-primary text-xl">{step.num}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.5} className="text-center mt-12">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              Get started today <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustItems.map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.07}>
                <div className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{item.label}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-14">
              <h2 className="font-serif text-4xl font-bold text-foreground mb-4">What patients are saying</h2>
              <p className="text-muted-foreground text-lg">Real stories from people who found their way forward.</p>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((t, i) => (
                <FadeIn key={t.id} delay={i * 0.07}>
                  <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-4 h-4 ${j < t.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-foreground/80 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">{t.avatarInitials}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{t.patientName}</div>
                        <div className="text-xs text-muted-foreground">{t.condition}</div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-br from-[hsl(188,73%,12%)] to-[hsl(188,60%,20%)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-5">
              You deserve to feel better.
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Take the first step today. Confidential, professional care — on your schedule, in your language.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-foreground font-semibold text-lg hover:bg-white/95 transition-all hover:-translate-y-0.5 shadow-xl"
              >
                Start your assessment <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/providers"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all"
              >
                Browse providers
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

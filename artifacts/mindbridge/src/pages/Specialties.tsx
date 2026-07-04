import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useListSpecialties } from "@workspace/api-client-react";

export default function Specialties() {
  const { data: specialties, isLoading } = useListSpecialties();

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">Conditions we treat</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Our network of specialists covers the full spectrum of mental health conditions. Every provider is rigorously trained in evidence-based approaches for their area of focus.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(specialties ?? []).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
              >
                <Link
                  href={`/providers?specialty=${encodeURIComponent(s.name)}`}
                  className="group block h-full"
                >
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <span className="font-serif font-bold text-primary text-2xl">{s.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{s.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm font-medium text-foreground">{s.providerCount} specialists</span>
                      <span className="flex items-center gap-1 text-sm text-primary font-semibold group-hover:gap-2 transition-all duration-200">
                        Find a provider <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 bg-gradient-to-br from-[hsl(188,73%,12%)] to-[hsl(188,60%,20%)] rounded-3xl p-10 text-center"
        >
          <h2 className="font-serif text-3xl font-bold text-white mb-3">Not sure where to start?</h2>
          <p className="text-white/70 max-w-md mx-auto mb-7">
            Our intake process helps match you with the right specialist based on your specific needs and preferences.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-foreground font-semibold hover:bg-white/95 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Get matched <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

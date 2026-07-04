import { useState } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Search, Star, Filter, CheckCircle } from "lucide-react";
import { useListProviders } from "@workspace/api-client-react";

const specialtyOptions = [
  "All Specialties", "Anxiety & Stress", "Depression", "PTSD & Trauma", "ADHD",
  "Bipolar Disorder", "OCD", "Grief & Loss", "Addiction & Recovery",
];

export default function Providers() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialSpecialty = params.get("specialty") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [insuranceOnly, setInsuranceOnly] = useState(false);

  const queryParams = {
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(specialty && specialty !== "All Specialties" ? { specialty } : {}),
    ...(availableOnly ? { available: true } : {}),
  };

  const { data: providers, isLoading } = useListProviders(queryParams);

  const filtered = (providers ?? []).filter((p) =>
    insuranceOnly ? p.acceptsInsurance : true
  );

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">Find a Provider</h1>
          <p className="text-muted-foreground text-lg">Browse our network of board-certified psychiatrists and therapists.</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring md:w-52"
          >
            {specialtyOptions.map((s) => (
              <option key={s} value={s === "All Specialties" ? "" : s}>{s}</option>
            ))}
          </select>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-input"
              />
              Available now
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={insuranceOnly}
                onChange={(e) => setInsuranceOnly(e.target.checked)}
                className="rounded border-input"
              />
              Accepts insurance
            </label>
          </div>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">No providers found</h3>
            <p className="text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {filtered.length} provider{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link href={`/providers/${p.id}`} className="group block h-full">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                      <div className="relative h-52 overflow-hidden bg-muted">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {p.available ? (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Available
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                            Waitlisted
                          </div>
                        )}
                        {p.acceptsInsurance && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-foreground text-xs font-medium">
                            <CheckCircle className="w-3 h-3 text-green-600" /> Insurance
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg leading-tight">{p.name}</h3>
                            <p className="text-sm text-muted-foreground">{p.title}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 flex-shrink-0 ml-2">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold">{p.rating}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">{p.specialty}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{p.yearsExperience}y exp.</span>
                          {p.languages && p.languages.length > 1 && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{p.languages.length} languages</span>
                          )}
                        </div>
                        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground">${p.sessionPrice}</span>
                            <span className="text-xs text-muted-foreground">/session</span>
                          </div>
                          {p.nextAvailable && (
                            <span className="text-xs text-muted-foreground">Next: {p.nextAvailable}</span>
                          )}
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

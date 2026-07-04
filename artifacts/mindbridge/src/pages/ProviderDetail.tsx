import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowLeft, Clock, Globe, Shield, CheckCircle, Send, Heart, MessageSquare } from "lucide-react";
import { useGetProvider } from "@workspace/api-client-react";
import { useCountry } from "@/context/CountryContext";

interface Props { id: string; }

function StarRating({ value, onChange, size = "lg" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "lg" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "w-4 h-4" : "w-7 h-7";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => onChange && setHover(s)} onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(s)} className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`${sz} transition-colors ${s <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: { patientName: string; rating: number; notes?: string | null; mood?: string | null; sessionDate: string } }) {
  const moodEmoji: Record<string, string> = {
    much_better: "😊 Much better", bit_better: "🙂 A bit better", same: "😐 Same", need_more: "💙 Need more support",
  };
  return (
    <div className="border border-border rounded-xl p-4 bg-muted/20">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-sm text-foreground">{review.patientName}</div>
          <div className="text-xs text-muted-foreground">{review.sessionDate}</div>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>
      {review.mood && <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full inline-block mb-2">{moodEmoji[review.mood] ?? review.mood}</div>}
      {review.notes && <p className="text-sm text-foreground/70 italic leading-relaxed">"{review.notes}"</p>}
    </div>
  );
}

function RateSessionForm({ provider, onSubmit }: { provider: { id: number; name: string }; onSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const moods = [
    { val: "much_better", label: "Much better", emoji: "😊" },
    { val: "bit_better", label: "Better", emoji: "🙂" },
    { val: "same", label: "Same", emoji: "😐" },
    { val: "need_more", label: "Need more", emoji: "💙" },
  ];

  const handleSubmit = async () => {
    if (!rating || !name) return;
    setLoading(true);
    try {
      await fetch(`${import.meta.env.BASE_URL}api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id, patientName: name, rating, mood: mood || undefined,
          notes: notes || undefined, sessionDate: new Date().toLocaleDateString(),
        }),
      });
      setSubmitted(true);
      setTimeout(onSubmit, 2000);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
        <div className="font-semibold text-foreground">Thank you for your review!</div>
        <div className="text-sm text-muted-foreground">Your rating helps others find the right care.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-bold text-foreground">Rate your session</h3>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Overall rating</label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">How did you feel after?</label>
        <div className="flex gap-2 flex-wrap">
          {moods.map((m) => (
            <button key={m.val} onClick={() => setMood(m.val)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${mood === m.val ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What was most helpful?"
          className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <button onClick={handleSubmit} disabled={!rating || !name || loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${rating && name ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
        <Send className="w-4 h-4" /> {loading ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}

export default function ProviderDetail({ id }: Props) {
  const { data: provider, isLoading, refetch } = useGetProvider(parseInt(id), { query: { enabled: !!id } });
  const { country } = useCountry();
  const [showRateForm, setShowRateForm] = useState(false);
  const [reviews] = useState([
    { patientName: "Anonymous", rating: 5, notes: "Incredibly understanding and professional. Changed my perspective completely.", mood: "much_better", sessionDate: "Jun 2025" },
    { patientName: "A.K.", rating: 4, notes: "Very patient and offered great tools for managing my anxiety.", mood: "bit_better", sessionDate: "May 2025" },
    { patientName: "M.S.", rating: 5, notes: "My first therapy experience — and it was wonderful.", mood: "much_better", sessionDate: "Apr 2025" },
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 rounded-2xl bg-muted animate-pulse mb-6" />
          <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Provider not found</h2>
          <Link href="/providers" className="text-primary hover:underline">Back to providers</Link>
        </div>
      </div>
    );
  }

  const localPrice = Math.round(provider.sessionPrice * country.usdRate);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <Link href="/providers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to providers
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-card border border-border rounded-2xl overflow-hidden sticky top-24">
                <div className="relative h-64 bg-muted">
                  <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
                  {provider.available && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Available
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h1 className="font-serif text-xl font-bold text-foreground mb-0.5">{provider.name}</h1>
                  <p className="text-sm text-muted-foreground mb-3">{provider.title}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating value={Math.round(provider.rating)} size="sm" />
                    <span className="font-semibold text-sm text-foreground">{provider.rating}</span>
                    <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
                  </div>
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{provider.yearsExperience} years of experience</span>
                    </div>
                    {provider.languages && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{provider.languages.join(", ")}</span>
                      </div>
                    )}
                    {provider.acceptsInsurance && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Accepts insurance</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Board certified</span>
                    </div>
                  </div>
                  {provider.nextAvailable && (
                    <p className="text-xs text-muted-foreground mb-4 bg-muted px-3 py-2 rounded-lg">
                      Next available: <span className="font-medium text-foreground">{provider.nextAvailable}</span>
                    </p>
                  )}
                  <div className="border-t border-border pt-4 mb-5">
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="font-serif text-2xl font-bold text-foreground">{country.symbol}{localPrice.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/{country.currency}/session</span>
                    </div>
                    {country.code !== "US" && (
                      <p className="text-xs text-muted-foreground">≈ ${provider.sessionPrice} USD</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Video, phone, or messaging</p>
                  </div>
                  <Link href={`/get-started?provider=${provider.id}`}
                    className="block w-full text-center py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm mb-3">
                    Book a Session
                  </Link>
                  <button onClick={() => setShowRateForm((v) => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                    <Star className="w-4 h-4 text-amber-400" /> Rate this provider
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">About {provider.name}</h2>
                <p className="text-foreground/80 leading-relaxed">{provider.bio}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">Areas of Focus</h2>
                <div className="flex flex-wrap gap-2">
                  {[provider.specialty, "Evidence-based treatment", "Telehealth", "Psychotherapy", "Cultural sensitivity"].map((tag) => (
                    <span key={tag} className="text-sm px-3 py-1.5 rounded-full bg-accent text-accent-foreground">{tag}</span>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">Session Types</h2>
                <div className="grid grid-cols-3 gap-4">
                  {["Video", "Phone", "Messaging"].map((type) => (
                    <div key={type} className="text-center p-4 rounded-xl bg-muted">
                      <div className="text-sm font-semibold text-foreground">{type}</div>
                      <div className="text-xs text-muted-foreground mt-1">Available</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Rate form */}
              <AnimatePresence>
                {showRateForm && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-card border-2 border-primary/20 rounded-2xl p-6">
                    <RateSessionForm provider={{ id: provider.id, name: provider.name }} onSubmit={() => { setShowRateForm(false); refetch(); }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reviews */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-xl font-bold text-foreground">Patient Reviews</h2>
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(provider.rating)} size="sm" />
                    <span className="font-bold text-foreground">{provider.rating}</span>
                    <span className="text-xs text-muted-foreground">({provider.reviewCount})</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
                </div>
                <button onClick={() => setShowRateForm(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-primary/70 hover:text-primary hover:border-primary/50 text-sm transition-colors">
                  <MessageSquare className="w-4 h-4" /> Leave a review
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Your privacy is protected</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All sessions are fully encrypted. Your records are private and never shared without your explicit consent.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

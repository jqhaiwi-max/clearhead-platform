import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Calendar, Clock, Video, Phone, MessageSquare, ArrowRight, Play,
  Star, Heart, ChevronDown, Bell, CheckCircle, RotateCcw, Sparkles
} from "lucide-react";
import { useListAppointments } from "@workspace/api-client-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const typeIcons: Record<string, React.ElementType> = {
  video: Video,
  phone: Phone,
  messaging: MessageSquare,
};

const FOLLOW_UP_TIPS = [
  "Try to practice the breathing exercise your provider suggested today.",
  "Keep a mood journal for the next 7 days — small notes make big patterns visible.",
  "Reach out if you feel stuck between sessions; messaging is always open.",
  "Consistency is key. Your next session is your next step forward.",
  "Progress isn't linear — every session counts.",
];

function WellnessCheckin() {
  const [mood, setMood] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const moods = [
    { emoji: "😰", label: "Struggling", val: 1 },
    { emoji: "😞", label: "Low", val: 2 },
    { emoji: "😐", label: "Okay", val: 3 },
    { emoji: "🙂", label: "Good", val: 4 },
    { emoji: "😊", label: "Great", val: 5 },
  ];

  if (submitted) {
    return (
      <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Check-in saved! Your provider will see this before your next session.</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold text-foreground text-sm">Daily Wellness Check-in</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">How are you feeling today? Your provider will see this.</p>
      <div className="flex gap-2 mb-4">
        {moods.map((m) => (
          <button key={m.val} onClick={() => setMood(m.val)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${mood === m.val ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </button>
        ))}
      </div>
      <button onClick={() => mood && setSubmitted(true)} disabled={!mood}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${mood ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
        Submit check-in
      </button>
    </div>
  );
}

function TipCard() {
  const tip = FOLLOW_UP_TIPS[Math.floor(Math.random() * FOLLOW_UP_TIPS.length)];
  return (
    <div className="bg-gradient-to-br from-[hsl(188,73%,8%)] to-[hsl(188,55%,18%)] rounded-2xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Mindfulness Tip</span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed italic">"{tip}"</p>
    </div>
  );
}

function AppointmentCard({ apt, index }: { apt: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = typeIcons[apt.type] ?? Video;
  const statusClass = statusColors[apt.status] ?? "bg-muted text-muted-foreground border-border";
  const isUpcoming = apt.status === "confirmed" || apt.status === "pending";
  const isCompleted = apt.status === "completed";

  const sessionParams = new URLSearchParams({
    provider: apt.providerName,
    type: apt.type,
    duration: "1",
  }).toString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className={`bg-card border rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-md ${isUpcoming ? "border-primary/20" : "border-border"}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isUpcoming ? "bg-primary/10" : "bg-muted"}`}>
              <TypeIcon className={`w-5 h-5 ${isUpcoming ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-foreground">{apt.providerName}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize border ${statusClass}`}>
                  {apt.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {apt.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.time}</span>
                <span className="capitalize">{apt.type} session</span>
              </div>
              {apt.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{apt.notes}"</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="text-sm font-medium text-foreground">{apt.patientName}</p>
            </div>
            <button onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isUpcoming && (
            <Link href={`/session?${sessionParams}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-sm">
              <Play className="w-3.5 h-3.5 fill-current" /> Join Session
            </Link>
          )}
          {isCompleted && (
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 text-xs font-semibold hover:bg-blue-100 transition-colors">
              <Star className="w-3.5 h-3.5" /> Rate this session
            </button>
          )}
          <Link href={`/book?provider=${apt.providerId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Rebook
          </Link>
          {isUpcoming && (
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
              <Bell className="w-3.5 h-3.5" /> Remind me
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-border bg-muted/30 px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground mb-0.5">Session type</div><div className="font-medium capitalize text-foreground">{apt.type}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Status</div><div className="font-medium capitalize text-foreground">{apt.status}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Date</div><div className="font-medium text-foreground">{apt.date}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Time</div><div className="font-medium text-foreground">{apt.time}</div></div>
            </div>
            {apt.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">Session notes</div>
                <div className="text-sm text-foreground italic">"{apt.notes}"</div>
              </div>
            )}
            {isUpcoming && (
              <div className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-xs text-muted-foreground">
                <Bell className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>You'll receive a reminder 24 hours and 1 hour before your session. Ensure your camera and microphone are ready.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Appointments() {
  const { data: appointments, isLoading } = useListAppointments();
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  const filtered = appointments
    ? appointments.filter((a) => {
        if (filter === "upcoming") return a.status === "confirmed" || a.status === "pending";
        if (filter === "completed") return a.status === "completed" || a.status === "cancelled";
        return true;
      }).reverse()
    : [];

  const upcomingCount = appointments?.filter((a) => a.status === "confirmed" || a.status === "pending").length ?? 0;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">My Sessions</h1>
          <p className="text-muted-foreground text-lg">Track, join, and follow up on your care journey.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main list */}
          <div className="lg:col-span-2">
            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6">
              {(["all", "upcoming", "completed"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === f ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center py-20 bg-card border border-border rounded-2xl">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground text-lg mb-2">No appointments yet</h3>
                <p className="text-muted-foreground mb-6">Book your first session with one of our providers.</p>
                <Link href="/get-started" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                  Find a therapist <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filtered.map((apt, i) => (
                  <AppointmentCard key={apt.id} apt={apt} index={i} />
                ))}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="text-center pt-4">
                  <Link href="/get-started" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-200">
                    Book another session <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Upcoming count */}
            {upcomingCount > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Upcoming</span>
                </div>
                <div className="font-serif text-3xl font-bold text-foreground">{upcomingCount}</div>
                <div className="text-xs text-muted-foreground">session{upcomingCount !== 1 ? "s" : ""} scheduled</div>
              </motion.div>
            )}

            {/* Daily check-in */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
              <WellnessCheckin />
            </motion.div>

            {/* Tip */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <TipCard />
            </motion.div>

            {/* Quick links */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">Quick access</h3>
              <div className="space-y-2">
                {[
                  { href: "/get-started", label: "Book a new session", icon: ArrowRight },
                  { href: "/providers", label: "Browse providers", icon: ArrowRight },
                  { href: "/pricing", label: "View plans & pricing", icon: ArrowRight },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                    <span>{item.label}</span>
                    <item.icon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

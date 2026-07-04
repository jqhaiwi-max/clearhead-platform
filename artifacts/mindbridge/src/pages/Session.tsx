import { useState, useEffect, useRef, useCallback } from "react";
import { useSearch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Phone, MessageSquare, Pause, Play, Square, RotateCcw,
  AlertTriangle, CheckCircle, Clock, Heart, Star, Send, ChevronRight
} from "lucide-react";

const DURATIONS = [
  { label: "45 min", seconds: 45 * 60 },
  { label: "55 min", seconds: 55 * 60 },
  { label: "60 min", seconds: 60 * 60 },
];

function formatTime(s: number): string {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  const sign = s < 0 ? "+" : "";
  return `${sign}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function CircularProgress({ pct, size = 240, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
}

function FollowUp({ providerName, onDone }: { providerName: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const moods = [
    { label: "Much better", emoji: "😊", val: "much_better" },
    { label: "A bit better", emoji: "🙂", val: "bit_better" },
    { label: "Same", emoji: "😐", val: "same" },
    { label: "Need more support", emoji: "💙", val: "need_more" },
  ];

  const handleSubmit = async () => {
    try {
      await fetch(`${import.meta.env.BASE_URL}api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: 1,
          patientName: "Anonymous",
          rating,
          mood: mood || undefined,
          notes: notes || undefined,
          sessionDate: new Date().toLocaleDateString(),
        }),
      });
    } catch {}
    setSubmitted(true);
    setTimeout(onDone, 2500);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Thank you!</h3>
        <p className="text-muted-foreground">Your follow-up has been sent to {providerName}.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-1">Session complete!</h3>
        <p className="text-muted-foreground text-sm">How are you feeling after your session with {providerName}?</p>
      </div>

      {/* Mood */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">How do you feel right now?</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {moods.map((m) => (
            <button key={m.val} onClick={() => setMood(m.val)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${mood === m.val ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:border-primary/30 text-foreground"}`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">Rate this session</label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
              <Star className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">Notes for yourself (private)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Key takeaways, homework reminders, things to reflect on..."
          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <button onClick={handleSubmit} disabled={!mood || !rating}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all ${mood && rating ? "bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 shadow-lg" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
        <Send className="w-4 h-4" /> Submit follow-up
      </button>

      <button onClick={onDone} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
        Skip for now
      </button>
    </motion.div>
  );
}

export default function Session() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);

  const providerName = params.get("provider") || "Your Provider";
  const sessionType = (params.get("type") || "video") as "video" | "phone" | "messaging";
  const initialDurIdx = Number(params.get("duration") || "1");

  const [durIdx, setDurIdx] = useState(initialDurIdx);
  const [timeLeft, setTimeLeft] = useState(DURATIONS[durIdx].seconds);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalDur = DURATIONS[durIdx].seconds;

  const warn5 = timeLeft <= 300 && timeLeft > 0;
  const warn10 = timeLeft <= 600 && timeLeft > 300;

  const tick = useCallback(() => {
    setTimeLeft((t) => {
      if (t <= 0) {
        setOvertime(true);
        return t - 1;
      }
      return t - 1;
    });
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const handleStart = () => { setStarted(true); setRunning(true); };
  const handlePause = () => setRunning((r) => !r);
  const handleReset = () => {
    setRunning(false); setStarted(false); setEnded(false);
    setOvertime(false); setTimeLeft(DURATIONS[durIdx].seconds);
  };
  const handleEnd = () => {
    setRunning(false); setEnded(true); setShowFollowUp(true);
  };

  const pct = overtime ? 100 : Math.max(0, (timeLeft / totalDur) * 100);
  const timerColor = warn5 ? "#ef4444" : warn10 ? "#f59e0b" : "hsl(188,73%,19%)";

  const TypeIcon = sessionType === "video" ? Video : sessionType === "phone" ? Phone : MessageSquare;

  if (showFollowUp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(188,73%,8%)] to-[hsl(188,60%,14%)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
          <FollowUp providerName={providerName} onDone={() => navigate("/appointments")} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-1000 ${overtime ? "bg-gradient-to-b from-red-950 to-red-900" : warn5 ? "bg-gradient-to-b from-orange-950 to-red-950" : "bg-gradient-to-b from-[hsl(188,73%,8%)] to-[hsl(188,60%,14%)]"}`}>
      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <TypeIcon className="w-4 h-4" />
          <span className="capitalize">{sessionType} session</span>
        </div>
        <div className="text-white/60 text-sm font-medium">{providerName}</div>
        {started && !ended && (
          <button onClick={handleEnd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors border border-red-500/30">
            <Square className="w-3 h-3" /> End session
          </button>
        )}
      </div>

      {/* Duration selector (before start) */}
      {!started && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-8">
          {DURATIONS.map((d, i) => (
            <button key={d.label} onClick={() => { setDurIdx(i); setTimeLeft(DURATIONS[i].seconds); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${durIdx === i ? "bg-white text-foreground border-white" : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"}`}>
              {d.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Timer circle */}
      <div className="relative mb-8">
        <CircularProgress pct={pct} size={260} color={timerColor} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-mono text-5xl font-bold tabular-nums transition-colors ${overtime ? "text-red-400" : warn5 ? "text-orange-400" : "text-white"}`}>
            {formatTime(timeLeft)}
          </div>
          <div className={`text-sm mt-1 ${overtime ? "text-red-400/70" : "text-white/50"}`}>
            {overtime ? "Overtime" : !started ? "Ready to start" : running ? "In session" : "Paused"}
          </div>
          {started && !overtime && (
            <div className="text-xs text-white/30 mt-1">{DURATIONS[durIdx].label} session</div>
          )}
        </div>
      </div>

      {/* Warning banners */}
      <AnimatePresence>
        {warn5 && !overtime && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" /> 5 minutes remaining — wrap up soon
          </motion.div>
        )}
        {warn10 && !warn5 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-sm font-semibold">
            <Clock className="w-4 h-4" /> 10 minutes remaining
          </motion.div>
        )}
        {overtime && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600/30 border border-red-500/40 text-red-200 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" /> Session time exceeded — consider ending
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!started ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleStart}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-foreground font-bold text-base hover:bg-white/95 transition-all shadow-2xl hover:-translate-y-0.5">
            <Play className="w-5 h-5 fill-current" /> Start Session
          </motion.button>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handlePause}
              className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleReset}
              className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </div>

      {/* Session info cards */}
      {started && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-10 w-full max-w-lg grid grid-cols-3 gap-3">
          {[
            { label: "Elapsed", val: formatTime(totalDur - timeLeft < 0 ? 0 : totalDur - timeLeft) },
            { label: "Duration", val: DURATIONS[durIdx].label },
            { label: "Status", val: running ? "Active" : "Paused" },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-white/40 text-xs mb-0.5">{item.label}</div>
              <div className="text-white font-semibold text-sm">{item.val}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* End early CTA */}
      {started && !ended && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={handleEnd}
          className="mt-6 flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors">
          End session & submit follow-up <ChevronRight className="w-3 h-3" />
        </motion.button>
      )}
    </div>
  );
}

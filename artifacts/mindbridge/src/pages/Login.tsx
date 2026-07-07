import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [, navigate] = useLocation();

  const [mode, setMode]       = useState<"signin" | "signup">("signin");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(158,40%,97%)] to-[hsl(188,30%,95%)] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">

        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <Leaf className="w-7 h-7 text-white" />
          </div>
        </div>

        <h1 className="font-serif text-2xl font-bold text-center text-foreground mb-1">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-7">
          {mode === "signin" ? "Sign in to your Clearhead account" : "Set up your Clearhead account"}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>Don't have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); }}
                className="text-primary font-semibold hover:underline">Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(""); }}
                className="text-primary font-semibold hover:underline">Sign in</button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

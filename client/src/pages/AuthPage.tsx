import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoMark from "../components/LogoMark";
import { btnPrimary, errorBox, field } from "../ui";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="grid w-full max-w-[920px] overflow-hidden rounded-[28px] border border-white/10 bg-[#08141d]/70 shadow-glow backdrop-blur-xl md:grid-cols-[1.05fr_0.95fr]">
        <aside className="flex min-h-[280px] flex-col justify-between gap-7 bg-[linear-gradient(160deg,rgba(46,230,166,0.16),transparent_42%),linear-gradient(220deg,rgba(255,122,69,0.12),transparent_40%),#0b1c27] p-7 md:min-h-[520px] md:p-10">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <LogoMark />
              <div>
                <h1 className="font-display text-xl tracking-tight">TaskFlow</h1>
                <span className="text-xs font-semibold text-fog">Plan. Move. Finish.</span>
              </div>
            </div>
            <h1 className="font-display text-4xl leading-tight tracking-tight">Work that actually flows.</h1>
            <p className="mt-3 max-w-[32ch] leading-relaxed text-[#b7cdd8]">
              A focused board for your day — capture tasks, set priority, and watch them move to done.
            </p>
          </div>
          <ul className="grid gap-3 font-semibold text-[#d5e6ee]">
            <li className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mint shadow-[0_0_12px_rgba(46,230,166,0.8)]" />
              Personal kanban in one glance
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mint shadow-[0_0_12px_rgba(46,230,166,0.8)]" />
              Priorities and due dates, not clutter
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mint shadow-[0_0_12px_rgba(46,230,166,0.8)]" />
              Secure login, your tasks only
            </li>
          </ul>
        </aside>

        <form className="flex flex-col gap-3 p-8 md:p-9" onSubmit={submit}>
          <h2 className="font-display text-3xl tracking-tight">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-fog">
            {isLogin ? "Sign in to pick up where you left off." : "Takes less than a minute to get on the board."}
          </p>
          {error && <div className={errorBox}>{error}</div>}
          {!isLogin && (
            <>
              <label className="-mb-1 text-xs font-bold text-[#b7cdd8]">Name</label>
              <input className={field} placeholder="Your name" value={form.name} required
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </>
          )}
          <label className="-mb-1 text-xs font-bold text-[#b7cdd8]">Email</label>
          <input className={field} type="email" placeholder="you@email.com" value={form.email} required
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="-mb-1 text-xs font-bold text-[#b7cdd8]">Password</label>
          <input className={field} type="password" placeholder="At least 6 characters" value={form.password} required
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className={`${btnPrimary} mt-1.5`} disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Sign in" : "Sign up"}
          </button>
          <p className="text-center text-fog">
            {isLogin ? (
              <>No account? <Link className="font-bold text-mint hover:text-[#7ff3c8]" to="/register">Sign up</Link></>
            ) : (
              <>Have an account? <Link className="font-bold text-mint hover:text-[#7ff3c8]" to="/login">Sign in</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

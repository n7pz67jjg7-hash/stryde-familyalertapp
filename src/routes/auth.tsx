import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import { StrydeLogo } from "@/components/StrydeLogo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

function Field({
  icon: Icon, type, placeholder, value, onChange,
}: {
  icon: typeof Mail; type: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}



export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — STRYDE" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!fullName.trim()) throw new Error("Please enter your full name.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-hero px-6 pt-10 pb-8">
      <Link to="/" className="self-start text-muted-foreground"><ArrowLeft /></Link>
      <div className="mt-6 flex flex-col items-center">
        <StrydeLogo size={72} />
        <h1 className="mt-4 text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Log in to keep your family safe." : "Start protecting what matters most."}
        </p>
      </div>

      <form className="mt-8 flex flex-col gap-3" onSubmit={submit}>
        {mode === "signup" && (
          <Field icon={UserIcon} type="text" placeholder="Full name" value={fullName} onChange={setFullName} />
        )}
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
        <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />

        {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        <button
          disabled={loading}
          className="mt-2 h-14 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>

        <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={google}
          className="h-12 rounded-2xl border border-border bg-surface font-semibold text-foreground"
        >
          Continue with Google
        </button>
      </form>

      <p className="mt-auto text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
          className="font-semibold text-primary"
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}

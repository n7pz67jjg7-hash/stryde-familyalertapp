import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StrydeLogo } from "@/components/StrydeLogo";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — STRYDE" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-hero px-6 pt-10 pb-8">
      <Link to="/" className="self-start text-muted-foreground"><ArrowLeft /></Link>
      <div className="mt-6 flex flex-col items-center">
        <StrydeLogo size={72} />
        <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to keep your family safe.</p>
      </div>

      <form
        className="mt-10 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/dashboard" });
        }}
      >
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
        <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />
        <button className="text-right text-xs text-primary">Forgot password?</button>
        <button
          type="submit"
          className="mt-2 h-14 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow"
        >
          Log in
        </button>
      </form>

      <p className="mt-auto text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary">Sign up</Link>
      </p>
    </div>
  );
}

export function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: typeof Mail;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
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

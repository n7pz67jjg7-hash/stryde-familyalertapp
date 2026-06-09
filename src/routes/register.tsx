import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StrydeLogo } from "@/components/StrydeLogo";
import { Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Field } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Sign up — STRYDE" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-hero px-6 pt-10 pb-8">
      <Link to="/" className="self-start text-muted-foreground"><ArrowLeft /></Link>
      <div className="mt-4 flex flex-col items-center">
        <StrydeLogo size={64} />
        <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start protecting what matters most.</p>
      </div>

      <form
        className="mt-8 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/dashboard" });
        }}
      >
        <Field icon={User} type="text" placeholder="Full name" value={name} onChange={setName} />
        <Field icon={Phone} type="tel" placeholder="Phone number" value={phone} onChange={setPhone} />
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
        <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />

        <button className="mt-4 h-14 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow">
          Create account
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          By signing up you agree to our Terms & Privacy Policy.
        </p>
      </form>

      <p className="mt-auto text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary">Log in</Link>
      </p>
    </div>
  );
}

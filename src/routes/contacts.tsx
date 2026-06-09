import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Plus, Phone } from "lucide-react";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — STRYDE" }] }),
  component: Contacts,
});

const contacts = [
  { name: "Mom", phone: "+20 101 234 5678", color: "oklch(0.65 0.15 30)" },
  { name: "Dad", phone: "+20 102 345 6789", color: "oklch(0.55 0.12 240)" },
  { name: "Sister", phone: "+20 103 456 7890", color: "oklch(0.68 0.18 20)" },
];

function Contacts() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Emergency Contacts</h1>
        <button className="text-foreground"><Plus /></button>
      </header>

      <div className="px-5">
        <ul className="flex flex-col gap-3">
          {contacts.map((c) => (
            <li key={c.name} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-background"
                style={{ background: c.color }}
              >
                {c.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.phone}</div>
              </div>
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground"
              >
                <Phone className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>

        <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
          <Plus className="h-4 w-4" /> Add New Contact
        </button>
      </div>
    </MobileShell>
  );
}

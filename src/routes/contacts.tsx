import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Plus, Phone, Star, Trash2, Pencil, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { loadContacts, saveContacts, type EmergencyContact } from "@/lib/contacts-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — STRYDE" }] }),
  component: Contacts,
});

const AVATAR_TONES = ["bg-primary", "bg-accent", "bg-info", "bg-success", "bg-warning"];

function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setContacts(loadContacts()); }, []);

  const persist = (next: EmergencyContact[]) => {
    setContacts(next);
    saveContacts(next);
  };

  const upsert = (c: EmergencyContact) => {
    const exists = contacts.some((x) => x.id === c.id);
    persist(exists ? contacts.map((x) => x.id === c.id ? c : x) : [...contacts, c]);
    setShowForm(false);
    setEditing(null);
  };

  const remove = (id: string) => persist(contacts.filter((c) => c.id !== id));
  const togglePriority = (id: string) =>
    persist(contacts.map((c) => c.id === id ? { ...c, priority: !c.priority } : c));

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Emergency Contacts</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div className="px-5">
        {contacts.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Add your first contact
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...contacts].sort((a, b) => Number(b.priority) - Number(a.priority)).map((c, idx) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card animate-fade-in">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-primary-foreground ${AVATAR_TONES[idx % AVATAR_TONES.length]}`}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{c.name}</span>
                    {c.priority && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.phone}{c.relation ? ` · ${c.relation}` : ""}</div>
                </div>
                <button onClick={() => togglePriority(c.id)} aria-label="Toggle priority" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Star className={`h-4 w-4 ${c.priority ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
                <button onClick={() => { setEditing(c); setShowForm(true); }} aria-label="Edit" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Pencil className="h-4 w-4 text-foreground" />
                </button>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} aria-label={`Call ${c.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground shadow-card">
                  <Phone className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <ContactForm
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={upsert}
          onDelete={editing ? () => { remove(editing.id); setShowForm(false); setEditing(null); } : undefined}
        />
      )}
    </MobileShell>
  );
}

function ContactForm({
  initial, onCancel, onSave, onDelete,
}: {
  initial: EmergencyContact | null;
  onCancel: () => void;
  onSave: (c: EmergencyContact) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? false);

  const submit = () => {
    if (!name.trim() || !phone.trim()) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim() || undefined,
      priority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-elevated animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit Contact" : "Add Contact"}</h2>
          <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mom" className="w-full rounded-xl bg-input px-3 py-2.5 text-sm outline-none ring-ring/0 focus:ring-2" />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" inputMode="tel" className="w-full rounded-xl bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Relation (optional)">
            <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Family / Doctor" className="w-full rounded-xl bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <label className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Star className={`h-4 w-4 ${priority ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              Priority contact
            </span>
            <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} className="h-5 w-5 accent-primary" />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          {onDelete && (
            <button onClick={onDelete} className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <button onClick={submit} className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow">
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

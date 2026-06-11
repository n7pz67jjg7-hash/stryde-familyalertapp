import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Plus, Phone, Star, Trash2, Pencil, X, Check, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  type EmergencyContact,
} from "@/lib/contacts-store";
import { useAuth, TIER_CONTACT_LIMIT } from "@/hooks/useAuth";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — STRYDE" }] }),
  component: Contacts,
});

const AVATAR_TONES = ["bg-primary", "bg-accent", "bg-info", "bg-success", "bg-warning"];

function Contacts() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tier = profile?.subscription_tier ?? "free";
  const limit = TIER_CONTACT_LIMIT[tier];
  const reachedLimit = contacts.length >= limit;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    listContacts(user.id)
      .then(setContacts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const refresh = async () => { if (user) setContacts(await listContacts(user.id)); };

  const upsert = async (c: { id?: string; name: string; phone: string; relation?: string; priority: boolean }) => {
    if (!user) return;
    try {
      if (c.id) {
        await updateContact(c.id, { name: c.name, phone: c.phone, relation: c.relation ?? null, priority: c.priority });
      } else {
        if (reachedLimit) { setError(`Your plan allows up to ${limit} contacts.`); return; }
        await createContact(user.id, c);
      }
      await refresh();
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: string) => { await deleteContact(id); await refresh(); };
  const togglePriority = async (c: EmergencyContact) => { await updateContact(c.id, { priority: !c.priority }); await refresh(); };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Emergency Contacts</h1>
        <button
          onClick={() => { if (reachedLimit) return; setEditing(null); setShowForm(true); }}
          disabled={reachedLimit}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {reachedLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-5 w-5" />}
        </button>
      </header>

      <div className="px-5">
        <div className="mb-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">
            {contacts.length} / {limit === Infinity ? "∞" : limit} contacts · {tier.toUpperCase()}
          </span>
          {reachedLimit && tier !== "premium" && (
            <button onClick={() => navigate({ to: "/plans" })} className="font-semibold text-primary">Upgrade</button>
          )}
        </div>

        {error && <p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        {loading ? (
          <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground shadow-card">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Add your first contact
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {contacts.map((c, idx) => (
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
                <button onClick={() => togglePriority(c)} aria-label="Toggle priority" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
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
          onDelete={editing ? async () => { await remove(editing.id); setShowForm(false); setEditing(null); } : undefined}
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
  onSave: (c: { id?: string; name: string; phone: string; relation?: string; priority: boolean }) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? false);

  const submit = () => {
    if (!name.trim() || !phone.trim()) return;
    onSave({
      id: initial?.id,
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mom" className="w-full rounded-xl bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" inputMode="tel" className="w-full rounded-xl bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Relation (optional)">
            <input value={relation ?? ""} onChange={(e) => setRelation(e.target.value)} placeholder="Family / Doctor" className="w-full rounded-xl bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
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

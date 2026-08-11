import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, QrCode, Trash2, Users } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "My care circle — STRYDE" },
      { name: "description", content: "See who is watching over you and manage caregiver access." },
      { property: "og:title", content: "My care circle — STRYDE" },
      { property: "og:description", content: "See who is watching over you and manage access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FamilyPage,
});

type Member = { linkId: string; id: string; full_name: string; email: string | null; role: string };

function FamilyPage() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);

  const load = async () => {
    if (!user || !profile) return;
    const other = profile.role === "caregiver" ? "patient_id" : "caregiver_id";
    const { data: links } = await supabase.from("caregiver_patient_links").select("*");
    const rows = (links as unknown as Record<string, string>[]) || [];
    const ids = rows.map((l) => l[other]!).filter(Boolean);
    if (!ids.length) return setMembers([]);
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email, role").in("id", ids);
    const map = new Map(((profs as unknown as Member[]) || []).map((p) => [p.id, p]));
    setMembers(
      rows
        .map((l) => {
          const p = map.get(l[other]!);
          return p ? { ...p, linkId: l.id! } : null;
        })
        .filter(Boolean) as Member[],
    );
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const unlink = async (linkId: string) => {
    await supabase.from("caregiver_patient_links").delete().eq("id", linkId);
    void load();
  };

  return (
    <Screen
      title="Care circle"
      subtitle={profile?.role === "caregiver" ? "Patients you monitor" : "Caregivers watching over you"}
      action={
        <Link
          to="/link"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Add member"
        >
          <QrCode className="h-4 w-4" />
        </Link>
      }
    >
      {members.length === 0 && <Empty text="Nobody linked yet. Use the QR screen to connect." />}
      {members.map((m) => (
        <Card key={m.linkId} className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" /> {m.full_name || "Unnamed"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {m.email} · {m.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/messages" aria-label="Message" className="rounded-full bg-muted p-2">
              <MessageSquare className="h-4 w-4 text-primary" />
            </Link>
            <button onClick={() => unlink(m.linkId)} aria-label="Remove link">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </Card>
      ))}
    </Screen>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Care messages — STRYDE" },
      { name: "description", content: "Private chat between a patient and their linked caregivers." },
      { property: "og:title", content: "Care messages — STRYDE" },
      { property: "og:description", content: "Private chat with your care circle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Messages,
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Peer = { id: string; full_name: string };

function Messages() {
  const { user, profile } = useAuth();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !profile) return;
    void (async () => {
      const col = profile.role === "caregiver" ? "patient_id" : "caregiver_id";
      const { data: links } = await supabase
        .from("caregiver_patient_links")
        .select("caregiver_id, patient_id");
      const ids = ((links as unknown as Record<string, string>[]) || []).map((l) => l[col]!).filter(Boolean);
      if (!ids.length) return setPeers([]);
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const list = (profs as unknown as Peer[]) || [];
      setPeers(list);
      setActive((a) => a ?? list[0]?.id ?? null);
    })();
  }, [user, profile]);

  const load = async (peer: string) => {
    const { data } = await supabase
      .from("care_messages" as never)
      .select("*")
      .or(`sender_id.eq.${peer},recipient_id.eq.${peer}`)
      .order("created_at");
    setMsgs((data as unknown as Msg[]) || []);
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    if (!active) return;
    void load(active);
    const ch = supabase
      .channel(`care_messages_${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "care_messages" }, () => load(active))
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [active]);

  const send = async () => {
    if (!user || !active || !text.trim()) return;
    const { error } = await supabase
      .from("care_messages" as never)
      .insert({ sender_id: user.id, recipient_id: active, body: text.trim() } as never);
    if (error) return toast.error(error.message);
    setText("");
    void load(active);
  };

  return (
    <Screen title="Messages" subtitle="Private care chat">
      {peers.length === 0 && <Empty text="Link with a caregiver or patient first from the Family screen." />}
      {peers.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {peers.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                active === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {p.full_name || "Unnamed"}
            </button>
          ))}
        </div>
      )}

      {active && (
        <>
          <div className="space-y-2">
            {msgs.length === 0 && <Empty text="No messages yet — say hello." />}
            {msgs.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-primary text-primary-foreground" : "bg-surface border border-border"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottom} />
          </div>

          <Card className="flex items-center gap-2 p-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a message"
              className="w-full bg-transparent px-2 text-sm outline-none"
            />
            <button
              onClick={send}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </button>
          </Card>
        </>
      )}
    </Screen>
  );
}

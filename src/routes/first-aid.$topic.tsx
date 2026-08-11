import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Phone } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { FIRST_AID } from "@/lib/first-aid";

export const Route = createFileRoute("/first-aid/$topic")({
  head: () => ({
    meta: [
      { title: "First aid steps — STRYDE" },
      { name: "description", content: "Clear numbered first aid steps for this emergency." },
      { property: "og:title", content: "First aid steps — STRYDE" },
      { property: "og:description", content: "Clear numbered first aid steps for this emergency." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FirstAidTopicPage,
});

function FirstAidTopicPage() {
  const { topic } = Route.useParams();
  const t = FIRST_AID.find((x) => x.slug === topic);

  if (!t)
    return (
      <Screen title="First aid" back="/first-aid">
        <Empty text="Guide not found." />
      </Screen>
    );

  return (
    <Screen title={t.title} subtitle={t.summary} back="/first-aid">
      <ol className="space-y-2">
        {t.steps.map((s, i) => (
          <li key={i}>
            <Card className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm">{s}</p>
            </Card>
          </li>
        ))}
      </ol>
      <Card className="flex gap-2 border-warning/40 bg-warning/10">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        <p className="text-sm">{t.warning}</p>
      </Card>
      <a
        href="tel:123"
        className="flex items-center justify-center gap-2 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground"
      >
        <Phone className="h-4 w-4" /> Call 123
      </a>
    </Screen>
  );
}

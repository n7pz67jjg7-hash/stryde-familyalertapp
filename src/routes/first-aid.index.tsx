import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LifeBuoy } from "lucide-react";
import { Screen, Card } from "@/components/Screen";
import { FIRST_AID } from "@/lib/first-aid";

export const Route = createFileRoute("/first-aid/")({
  head: () => ({
    meta: [
      { title: "First aid guides — STRYDE" },
      { name: "description", content: "Step-by-step first aid for falls, CPR, stroke, choking, bleeding and more." },
      { property: "og:title", content: "First aid guides — STRYDE" },
      { property: "og:description", content: "Step-by-step first aid for the most common emergencies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FirstAidIndex,
});

function FirstAidIndex() {
  return (
    <Screen title="First aid" subtitle="Offline-ready emergency guides">
      <Card className="flex items-center gap-2 text-sm text-muted-foreground">
        <LifeBuoy className="h-4 w-4 text-primary" />
        Guidance only — always call 123 in a real emergency.
      </Card>
      {FIRST_AID.map((t) => (
        <Link key={t.slug} to="/first-aid/$topic" params={{ topic: t.slug }}>
          <Card className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="truncate text-xs text-muted-foreground">{t.summary}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Card>
        </Link>
      ))}
    </Screen>
  );
}

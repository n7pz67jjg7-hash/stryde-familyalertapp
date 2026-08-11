import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Ambulance,
  Building2,
  CalendarDays,
  ChevronRight,
  FlaskConical,
  HeartHandshake,
  LifeBuoy,
  MapPinned,
  MessageSquare,
  Navigation,
  Activity,
  Users,
} from "lucide-react";
import { Screen, Card } from "@/components/Screen";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "All STRYDE tools — STRYDE" },
      { name: "description", content: "Hospitals in Egypt, vitals, appointments, first aid, safe zones and your care circle." },
      { property: "og:title", content: "All STRYDE tools — STRYDE" },
      { property: "og:description", content: "Every STRYDE health and safety tool in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorePage,
});

const GROUPS: { title: string; items: { to: string; label: string; desc: string; icon: typeof Users }[] }[] = [
  {
    title: "Care & clinical",
    items: [
      { to: "/hospitals", label: "Hospitals in Egypt", desc: "Real Google ratings + STRYDE reviews", icon: Building2 },
      { to: "/appointments", label: "Appointments", desc: "Doctor visits and reminders", icon: CalendarDays },
      { to: "/vitals", label: "Vitals", desc: "BP, heart rate, glucose, weight", icon: Activity },
      { to: "/lab-results", label: "Lab results", desc: "Blood tests and reports", icon: FlaskConical },
    ],
  },
  {
    title: "Family & safety",
    items: [
      { to: "/family", label: "Care circle", desc: "Linked caregivers and patients", icon: Users },
      { to: "/messages", label: "Messages", desc: "Private care chat", icon: MessageSquare },
      { to: "/check-ins", label: "Daily check-in", desc: "One-tap reassurance", icon: HeartHandshake },
      { to: "/safe-zones", label: "Safe zones", desc: "Geofences around home and clinic", icon: MapPinned },
    ],
  },
  {
    title: "Emergency",
    items: [
      { to: "/ambulance", label: "Ambulance & hotlines", desc: "123, 122, 180 and your details", icon: Ambulance },
      { to: "/nearest-er", label: "Nearest emergency room", desc: "Closest hospitals to your GPS", icon: Navigation },
      { to: "/first-aid", label: "First aid guides", desc: "Falls, CPR, stroke, choking", icon: LifeBuoy },
    ],
  },
];

function MorePage() {
  return (
    <Screen title="All tools" subtitle="Everything STRYDE can do">
      {GROUPS.map((g) => (
        <section key={g.title} className="space-y-2">
          <h2 className="text-sm font-semibold">{g.title}</h2>
          {g.items.map(({ to, label, desc, icon: Icon }) => (
            <Link key={to} to={to}>
              <Card className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </section>
      ))}
    </Screen>
  );
}

import { createServerFn } from "@tanstack/react-start";

export type Hospital = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  phone: string | null;
  website: string | null;
  openNow: boolean | null;
  mapsUri: string | null;
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.currentOpeningHours.openNow,places.googleMapsUri";

function headers(extra: Record<string, string> = {}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps connector is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
    ...extra,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPlace(p: any): Hospital {
  return {
    id: p.id,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? "",
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    rating: typeof p.rating === "number" ? p.rating : null,
    userRatingCount: p.userRatingCount ?? null,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    openNow: p.currentOpeningHours?.openNow ?? null,
    mapsUri: p.googleMapsUri ?? null,
  };
}

async function denied(res: Response) {
  const body = await res.text();
  if (res.status === 403) {
    throw new Error(`Google Maps request was denied (403). ${body.slice(0, 200)}`);
  }
  throw new Error(`Google Maps request failed [${res.status}]: ${body.slice(0, 300)}`);
}

export const searchHospitals = createServerFn({ method: "POST" })
  .inputValidator((input: { query?: string; city?: string; kind?: string }) => ({
    query: (input.query ?? "").slice(0, 120),
    city: (input.city ?? "Egypt").slice(0, 60),
    kind: (input.kind ?? "hospital").slice(0, 40),
  }))
  .handler(async ({ data }) => {
    const textQuery = data.query
      ? `${data.query} ${data.kind} in ${data.city}`
      : `${data.kind}s in ${data.city}`;
    const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
      method: "POST",
      headers: headers({ "X-Goog-FieldMask": FIELD_MASK }),
      body: JSON.stringify({ textQuery, pageSize: 20, regionCode: "EG", languageCode: "en" }),
    });
    if (!res.ok) await denied(res);
    const json: any = await res.json();
    return { hospitals: ((json.places ?? []) as any[]).map(mapPlace) };
  });

export const nearbyHospitals = createServerFn({ method: "POST" })
  .inputValidator((input: { lat: number; lng: number; radius?: number }) => ({
    lat: Number(input.lat),
    lng: Number(input.lng),
    radius: Math.min(Math.max(Number(input.radius ?? 8000), 500), 50000),
  }))
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: headers({ "X-Goog-FieldMask": FIELD_MASK }),
      body: JSON.stringify({
        includedTypes: ["hospital"],
        maxResultCount: 15,
        rankPreference: "DISTANCE",
        languageCode: "en",
        locationRestriction: {
          circle: {
            center: { latitude: data.lat, longitude: data.lng },
            radius: data.radius,
          },
        },
      }),
    });
    if (!res.ok) await denied(res);
    const json: any = await res.json();
    return { hospitals: ((json.places ?? []) as any[]).map(mapPlace) };
  });

export const getHospital = createServerFn({ method: "POST" })
  .inputValidator((input: { placeId: string }) => ({ placeId: String(input.placeId).slice(0, 200) }))
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/places/v1/places/${encodeURIComponent(data.placeId)}`, {
      headers: headers({
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,rating,userRatingCount,nationalPhoneNumber,websiteUri,currentOpeningHours.openNow,googleMapsUri,reviews",
      }),
    });
    if (!res.ok) await denied(res);
    const json: any = await res.json();
    return {
      hospital: mapPlace(json),
      googleReviews: ((json.reviews ?? []) as any[]).slice(0, 5).map((r) => ({
        author: r.authorAttribution?.displayName ?? "Google user",
        rating: r.rating ?? 0,
        text: r.text?.text ?? r.originalText?.text ?? "",
        when: r.relativePublishTimeDescription ?? "",
      })),
    };
  });

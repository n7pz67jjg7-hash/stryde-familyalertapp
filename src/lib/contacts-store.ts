export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
  priority: boolean;
}

const KEY = "stryde.contacts.v1";

export function loadContacts(): EmergencyContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as EmergencyContact[];
  } catch {
    return seed();
  }
}

export function saveContacts(list: EmergencyContact[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

function seed(): EmergencyContact[] {
  const defaults: EmergencyContact[] = [
    { id: crypto.randomUUID(), name: "Mom", phone: "+201012345678", relation: "Family", priority: true },
  ];
  saveContacts(defaults);
  return defaults;
}

"use client";
import { useEffect, useState } from "react";

export interface KolProfileSummary {
  id: string;
  name: string;
  voiceStyle: string;
  language: string;
}

export function useKolProfiles() {
  const [profiles, setProfiles] = useState<KolProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kol-profiles", { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((d) => setProfiles(d.kolProfiles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { profiles, loading };
}

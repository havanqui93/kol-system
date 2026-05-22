"use client";
import { useEffect, useState } from "react";

export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
}

export function useProducts() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products", { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { products, loading };
}

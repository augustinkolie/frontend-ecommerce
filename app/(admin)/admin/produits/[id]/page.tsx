"use client";

import { use } from "react";
import { QueryState } from "@/components/admin/page";
import { ProductEditor } from "@/components/admin/product-editor";
import { useApi } from "@/lib/admin/hooks";
import type { AdminProduct } from "@/lib/admin/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useApi<AdminProduct>(`/admin/products/${id}`);
  return <QueryState query={query}>{(p) => <ProductEditor key={p.id} product={p} />}</QueryState>;
}

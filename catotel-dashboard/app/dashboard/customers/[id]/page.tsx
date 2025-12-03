"use client";

import { useParams } from "next/navigation";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  return <UnderConstruction label={`Müşteri detayı (${customerId ?? "?"}) yakında`} />;
}

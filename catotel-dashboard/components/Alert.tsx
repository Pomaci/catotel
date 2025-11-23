import { ReactNode } from "react";
import clsx from "clsx";

type AlertType = "info" | "error" | "success";

export function Alert({
  type = "info",
  children,
}: {
  type?: AlertType;
  children: ReactNode;
}) {
  const base = "rounded-2xl border px-4 py-3 text-sm";
  const styles: Record<AlertType, string> = {
    info: "border-lagoon-200 bg-lagoon-100/60 text-lagoon-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-600",
  };

  return <div className={clsx(base, styles[type])}>{children}</div>;
}

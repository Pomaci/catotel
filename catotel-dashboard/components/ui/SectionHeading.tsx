"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
};

export function SectionHeading({ title, action }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-xl font-semibold text-cocoa-700">{title}</h3>
      {action ? (
        <div className="text-sm font-medium text-lagoon-600">{action}</div>
      ) : null}
    </div>
  );
}

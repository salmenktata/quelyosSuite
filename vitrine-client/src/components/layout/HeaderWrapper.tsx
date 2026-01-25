"use client";

import dynamic from "next/dynamic";

const Header = dynamic(
  () => import("@/components/layout/Header").then((mod) => mod.Header),
  { ssr: false }
);

export function HeaderWrapper() {
  return <Header />;
}

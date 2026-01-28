"use client";

import dynamic from "next/dynamic";

// Dynamic import avec ssr: false doit être dans un Client Component
const AnimatedSections = dynamic(
  () => import("./AnimatedSections.client"),
  { ssr: false, loading: () => null }
);

export default function AnimatedSectionsLoader() {
  return <AnimatedSections />;
}

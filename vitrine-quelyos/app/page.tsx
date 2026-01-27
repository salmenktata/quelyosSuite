import HomePageContentServer from "./components/HomePageContent.server";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load animations (non-bloquant)
const AnimatedSections = dynamic(
  () => import("./components/AnimatedSections.client"),
  { ssr: false, loading: () => null }
);

export default function HomePage() {
  return (
    <>
      <HomePageContentServer />
      <Suspense fallback={null}>
        <AnimatedSections />
      </Suspense>
    </>
  );
}

import HomePageContentServer from "./components/HomePageContent.server";

// Force SSG (Static Site Generation) pour performance optimale
export const dynamic = 'force-static';

export default function HomePage() {
  return <HomePageContentServer />;
}

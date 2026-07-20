import Nav from '@/components/site/Nav';
import SearchHero from '@/components/site/SearchHero';

export default function HomePage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <SearchHero />
    </main>
  );
}

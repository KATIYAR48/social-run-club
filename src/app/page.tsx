import Header from '@/components/Header';
import Hero from '@/components/Hero';
import UpcomingEvents from '@/components/UpcomingEvents';
import Footer from '@/components/Footer';
import JsonLd, { organizationSchema } from '@/components/JsonLd';
import MerchPageClient from '@/components/MerchPageClient';
import CityScapeSection from '@/components/CityScapeSection';
import FAQ from '@/components/FAQ';

export default function Home() {
  // Website schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CLOKA',
    url: 'https://cloka.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cloka.in/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <Header />
      <Hero />
      <CityScapeSection />
      <UpcomingEvents />
      <MerchPageClient />
      <FAQ />
      <Footer />
    </main>
  );
}

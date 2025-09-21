import Header from '@/components/Header';
import Hero from '@/components/Hero';
// import HomePageBanner from '@/components/HomePageBanner';
import UpcomingEventsSection from '@/components/UpcomingEventsSection';
import Footer from '@/components/Footer';
import JsonLd, { organizationSchema } from '@/components/JsonLd';
import JoinWaitlistSection from '@/components/JoinWaitlistSection';
import CityScapeSection from '@/components/CityScapeSection';
import FAQ from '@/components/FAQ';
import StravaClubPromotion from '@/components/StravaClubPromotion';

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
      {/* <HomePageBanner /> */}
      <JoinWaitlistSection />
      <UpcomingEventsSection />
      <StravaClubPromotion />
      <CityScapeSection />
      <FAQ />
      <Footer />
    </main>
  );
}

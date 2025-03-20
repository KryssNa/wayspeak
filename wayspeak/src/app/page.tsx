import { HeroSection } from '@/components/features/hero-section';
import { FeaturesSection } from '@/components/features/features-section';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  return (
    <>
     <Navbar />
      <HeroSection />
      <FeaturesSection />
      {/* Add more sections as needed */}
      <Footer />
    </>
  );
}

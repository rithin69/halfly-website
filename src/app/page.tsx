import { CallToAction, Footer, WorksWith } from "@/components/Closing";
import { Faq } from "@/components/Faq";
import { ForYou } from "@/components/ForYou";
import { Hero } from "@/components/hero/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Nav } from "@/components/Nav";
import { Pricing } from "@/components/Pricing";
import { QualitySection } from "@/components/quality/QualitySection";
import { Results } from "@/components/results/Results";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <div id="top" />
        <Hero />
        <WorksWith />
        <ForYou />
        <HowItWorks />
        <QualitySection />
        <Results />
        <Pricing />
        <Faq />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}

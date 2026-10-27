import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Closing";
import { Nav } from "@/components/Nav";
import { Claim, Loading } from "@/components/welcome/Claim";
import { SITE } from "@/lib/data";

// Stripe sends buyers here after checkout: /welcome?session_id=cs_...
// Everything happens in the browser (the site is a static export): Claim reads session_id and asks
// GET /api/licence/claim for the licence key (see ../docs/licensing.md).
export const metadata: Metadata = {
  title: `Welcome | ${SITE.name}`,
  description: "Your Halfly licence key.",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <>
      <Nav />
      <main id="main" className="bg-wash">
        <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:pb-28 sm:pt-40">
          {/* useSearchParams needs a Suspense boundary in a static export; the fallback is the loading state. */}
          <Suspense fallback={<Loading />}>
            <Claim />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

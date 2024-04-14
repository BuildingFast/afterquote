import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { type Experiment, type Result } from "@growthbook/growthbook";
import { useEffect } from "react";
import { Toaster } from "~/components/ui/toaster";
import { api } from "~/utils/api";
import { ThemeProvider } from "~/components/theme-provider";
import { Inter } from "next/font/google";
import Head from "next/head";

import "~/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
});
// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    // Enable debug mode in development
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  });
}

const onExperimentViewed = (
  experiment: Experiment<any>,
  result: Result<any>
) => {
  const experimentId = experiment.key;
  const variationId = result.key;

  console.log("Viewed Experiment", {
    experimentId,
    variationId,
  });
};

// Create a client-side GrowthBook instance
const gb = new GrowthBook({
  apiHost: process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST,
  clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  decryptionKey: process.env.NEXT_PUBLIC_GROWTHBOOK_DECRYPTION_KEY,
  // Enable easier debugging of feature flags during development
  enableDevMode: true,
  trackingCallback: onExperimentViewed,
});

// Let the GrowthBook instance know when the URL changes so the active
// experiments can update accordingly
function updateGrowthBookURL() {
  gb.setURL(window.location.href);
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const userOrganization = api.organization.getOrganizationName.useQuery();

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (session) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        gb.loadFeatures({ autoRefresh: true });
        gb.setAttributes({
          id: session?.user.email ? session?.user.email : "",
        });
        gb.setAttributes({
          company: userOrganization.data?.id ? userOrganization.data?.id : "",
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        gb.loadFeatures({ autoRefresh: true });
        gb.setAttributes({ id: "" });
        gb.setAttributes({ company: "" });
      }
    };
    // https://devtrium.com/posts/async-functions-useeffect
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchSession();
    // Subscribe to route change events and update GrowthBook
    router.events.on("routeChangeComplete", updateGrowthBookURL);
    return () => router.events.off("routeChangeComplete", updateGrowthBookURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOrganization.isLoading]);

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <main className={inter.className}>
        <SessionProvider session={session}>
          <PostHogProvider client={posthog}>
            <GrowthBookProvider growthbook={gb}>
              <ThemeProvider
                attribute="class"
                enableSystem
                disableTransitionOnChange
                themes={[
                  "rose",
                  "orange",
                  "blue",
                  "blue-dark",
                  "light",
                  "dark",
                ]}
              >
                <Component {...pageProps} />
                <Toaster />
              </ThemeProvider>
            </GrowthBookProvider>
          </PostHogProvider>
        </SessionProvider>
      </main>
    </>
  );
};

export default api.withTRPC(MyApp);

import { ChevronRight } from "lucide-react";
import { type NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  const posthog = usePostHog();
  let optimisticUpdate = null;
  const [orgName, setOrgName] = useState("");
  const currentUserOrganization = api.user?.getUserOrganization.useQuery();
  const createOrganization = api.organization?.createOrganization.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.user.getUserOrganization.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.user.getUserOrganization.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.user.getUserOrganization.setData(undefined, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.user.getUserOrganization.invalidate();
    },
    onSuccess: () => {
      void router.push("/quotes");
    },
  });

  function createOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createOrganization.mutate({ organization_name: orgName });
  }
  if (
    sessionData?.user?.id &&
    currentUserOrganization?.data?.organizationId &&
    currentUserOrganization?.data.isCustomer
  ) {
    void router.push("/customer_portal/dashboard/");
  } else if (
    sessionData?.user?.id &&
    currentUserOrganization?.data?.organizationId
  ) {
    void router.push("/quotes");
  }
  if (sessionData && currentUserOrganization?.isLoading) {
    return <Spinner />;
  }
  return (
    <>
      <Head>
        <title>Afterquote</title>
        <meta name="description" content="Supercharge your workflow." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {sessionData?.user?.id &&
      !currentUserOrganization?.data?.organizationId ? (
        <main className="grid min-h-screen bg-muted/40">
          <div className="container flex flex-col items-center justify-center gap-12">
            <h1 className="text-3xl font-bold">Welcome to Afterquote</h1>
            <Card>
              <form onSubmit={(e) => createOrg(e)}>
                <CardHeader>
                  <CardTitle>Enter your Company name</CardTitle>
                  <CardDescription>
                    Enter the name of your company or organization. Keep it
                    short.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="createOrg-input"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    placeholder="Google Inc."
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    id="createOrg-button"
                    type="submit"
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      posthog.capture("Organization Create Clicked", {
                        createdBy: sessionData
                          ? sessionData?.user?.email
                          : "could not get email",
                      });
                    }}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
      ) : (
        <main className="relative flex h-screen w-screen items-center justify-center">
          <div className="relative flex flex-col gap-8 rounded-lg p-8">
            <Button size="lg" id="signin" onClick={() => void signIn()}>
              {sessionData ? "Sign out" : "Sign in"}
            </Button>
          </div>
        </main>
      )}
    </>
  );
};

export default Home;

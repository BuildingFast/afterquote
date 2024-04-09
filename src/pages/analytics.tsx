import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import HeaderNav from "~/components/HeaderNav";
import { Spinner } from "~/components/ui/spinner";

const Analytics: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();

  // If no session exists, redirect to login page
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Analytics • Afterquote</title>
        </Head>
        <HeaderNav currentPage={"analytics"} />
        <main className="flex flex-row justify-center ">
          <div className="mt-8 gap-12 sm:container sm:mx-10 sm:max-w-7xl">
            User is authenticated
          </div>
        </main>
      </>
    );
  }

  return <Spinner />;
};

export default Analytics;

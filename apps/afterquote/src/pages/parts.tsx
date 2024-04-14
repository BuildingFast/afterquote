/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "~/components/Layout";
import PrimaryDataNav from "~/components/PrimaryDataNav";
import { Spinner } from "~/components/ui/spinner";

const Reports: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout
        headerTitle={"Primary Data • Afterquote"}
        currentPage="primary_data"
      >
        <PrimaryDataNav currentPage="parts" />
      </Layout>
    );
  }

  return <Spinner />;
};

export default Reports;

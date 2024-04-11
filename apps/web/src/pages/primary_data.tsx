/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import PrimaryDataNav from "~/components/PrimaryDataNav";
import Layout from "~/components/Layout";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";

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
        <div className="container relative gap-12 ">
          <PrimaryDataNav currentPage="operations" />
          <div className="mt-8"></div>
        </div>
      </Layout>
    );
  }

  return <Spinner />;
};

export default Reports;

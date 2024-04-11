/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import HeaderNav from "~/components/HeaderNav";
import STLModelViewer from "~/components/STLModelViewer";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";
const STPModelViewer = dynamic(() => import("~/components/STPModelViewer"), {
  ssr: false,
});

const ThreeDViewer: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const fileUid = String(uid);
  const currentFile = api.files?.getS3UrlForFile.useQuery(
    { fileId: fileUid },
    { cacheTime: 100 }
  );

  if (currentFile.isLoading) {
    return <Spinner />;
  }
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>3D Viewer • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col dark:bg-slate-900">
          <HeaderNav currentPage={"3d_viewer"} />
          <main className="flex min-h-screen w-screen flex-row justify-center bg-slate-50 dark:bg-slate-700">
            <div className="container mx-16 max-w-7xl gap-12 ">
              <div className="container h-full py-4">
                {currentFile.data?.s3Url.toLowerCase().includes(".stl") ? (
                  <STLModelViewer modelUrl={currentFile.data?.s3Url} />
                ) : currentFile.data?.s3Url.toLowerCase().includes(".stp") ||
                  currentFile.data?.s3Url.toLowerCase().includes(".step") ? (
                  <STPModelViewer s3Url={currentFile.data?.s3Url ?? ""} />
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default ThreeDViewer;

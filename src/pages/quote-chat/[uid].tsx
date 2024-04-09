import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { Spinner } from "~/components/ui/spinner";
import { useRouter } from "next/router";
import QuoteCommentSection from "~/components/QuoteCommentSection";
import HeaderNav from "~/components/HeaderNav";
import QuoteNav from "~/components/QuoteNav";

const RfqChat: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const rfqUid = String(uid);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <div className="flex h-max w-screen flex-col bg-muted">
          <HeaderNav currentPage={"quotes"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="container relative gap-12 ">
              <QuoteNav currentPage="quote-chat" currentRfqId={rfqUid} />
              <div className="mt-8">
                <QuoteCommentSection />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default RfqChat;

import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { Spinner } from "~/components/ui/spinner";
import { useRouter } from "next/router";
import OrderCommentSection from "~/components/OrderCommentSection";
import HeaderNav from "~/components/HeaderNav";
import OrderNav from "~/components/OrderNav";

const OrderChat: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const salesOrderUid = String(uid);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <div className="flex h-max w-screen flex-col ">
          <HeaderNav currentPage={"orders"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="container relative gap-12 ">
              <OrderNav
                currentPage="order_chat"
                currentOrderId={salesOrderUid}
              />
              <div className="mt-8">
                <OrderCommentSection />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default OrderChat;

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import OrderComment from "./OrderComment";
import clsx from "clsx";
import { type User } from "@prisma/client";

type WithChildren<T> = T & {
  children: Array<WithChildren<T>>;
};

type CommentWithChildren = WithChildren<{
  body: string;
  authorIsOP: boolean;
  id: string;
  userId: string | null;
  salesOrderId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User | null;
  salesOrder: {
    userId: string;
    customerId: string;
  } | null;
}>;

type Props = { comments?: Array<CommentWithChildren>; collapsed?: boolean };

const OrderComments: React.FC<Props> = ({ comments, collapsed }) => {
  const [parentRef] = useAutoAnimate();

  return (
    <div
      ref={parentRef}
      className={clsx(
        "w-full flex-col gap-4 sm:gap-6",
        collapsed ? "hidden" : "flex"
      )}
    >
      {comments?.map((comment) => {
        return <OrderComment identifiable key={comment.id} comment={comment} />;
      })}
    </div>
  );
};

export default OrderComments;

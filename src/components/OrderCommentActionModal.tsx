/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type User } from "@prisma/client";
import { type Dispatch, type SetStateAction } from "react";
import OrderComment from "./OrderComment";
import OrderCommentField from "./OrderCommentField";
import { Modal } from "./Modal";
import { XCircle } from "lucide-react";

type WithChildren<T> = T & {
  children: Array<WithChildren<T>>;
};

type Props = {
  parentComment?: WithChildren<{
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
  editing?: boolean;
  openState: [boolean, Dispatch<SetStateAction<boolean>>];
};

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-0 top-0 z-[3] rounded-full bg-blue-500 p-2 dark:bg-teal-900"
  >
    <XCircle className="h-4 w-4" />
  </button>
);

const OrderCommentActionModal: React.FC<Props> = ({
  openState,
  parentComment,
}) => {
  const [, setOpen] = openState;

  const closeModal = () => setOpen(false);

  return (
    <Modal openState={openState} alwaysCentered>
      <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 shadow-xl dark:bg-neutral-900 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
        <CloseButton onClick={closeModal} />

        <OrderComment comment={parentComment} compact hideReplies hideActions />

        <div className="mt-5 w-full">
          <OrderCommentField
            parentId={parentComment?.id}
            onCommented={closeModal}
          />

          {/* <ShouldRender if={editing}>
            <EditCommentForm comment={parentComment} onFinish={closeModal} />
          </ShouldRender> */}
        </div>
      </div>
    </Modal>
  );
};

export default OrderCommentActionModal;

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type User } from "@prisma/client";
import clsx from "clsx";
import { MoreVertical } from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCallback,
  useState,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactFragment,
  type ReactPortal,
} from "react";
import ReactHtmlParser, { convertNodeToElement } from "react-html-parser";
import useGetDate from "~/hooks/useGetDate";
import useMediaQuery from "~/hooks/useMediaQuery";
import { api } from "~/utils/api";
import getUserDisplayName from "~/utils/getUserDisplayName";
import ListComments from "./Comments";
import ShouldRender from "./ShouldRender";
import Skeleton from "./Skeleton";

const ConfirmationModal = dynamic(
  () => import("~/components/ConfirmationModal"),
  {
    ssr: false,
  }
);

const CommentField = dynamic(() => import("~/components/CommentField"), {
  ssr: false,
  loading: () => (
    <Skeleton parentClass="h-[200px] mt-2" width="w-full" heading lines={5} />
  ),
});

const CommentActionModal = dynamic(
  () => import("~/components/CommentActionModal"),
  {
    ssr: false,
  }
);

type Variant = "outlined" | "primary";

// const VARIANT_CLASSES = {
//   outlined:
//     "bg-white dark:border-zinc-700/90 dark:bg-zinc-800 shadow-md border-2 border-zinc-300",
//   primary: "bg-gray-100 dark:bg-zinc-800",
// };

type WithChildren<T> = T & {
  children: Array<WithChildren<T>>;
};

type CommentProps = {
  comment?: WithChildren<{
    body: string;
    authorIsOP: boolean;
    id: string;
    userId: string | null;
    rfqId: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: User | null;
    rfq: {
      userId: string;
      customerId: string;
    } | null;
  }>;
  /**
   * Make the comment component dimensions smaller.
   */
  compact?: boolean;
  /**
   * Turn comment footer into link to the post.
   */
  linkToPost?: boolean;
  /**
   * Comment id will be the <div>'s id.
   */
  identifiable?: boolean;
  /**
   * Hides comment replies.
   */
  hideReplies?: boolean;
  hideActions?: boolean;
  loading?: boolean;
  variant?: Variant;
};

const getCommentClasses = (
  hasParent: boolean,
  hasChildren: boolean,
  compact: boolean
) => {
  const commentWithParentClasses =
    hasParent && "border-r-0 border-b-0 rounded-tr-none";

  const childrenlessCommentClasses =
    !hasChildren && (compact ? "pb-4" : "pb-6");

  return clsx(commentWithParentClasses, childrenlessCommentClasses);
};

const Comment: React.FC<CommentProps> = ({
  comment,
  compact = false,
  identifiable = false,
  variant = "primary",
  loading,
  hideReplies = false,
  hideActions = false,
  linkToPost = false,
}) => {
  const replyState = useState(false);
  const [replying, setReplying] = replyState;

  const [collapsed, setCollapsed] = useState(false);
  const shouldRenderModals = useMediaQuery("(max-width: 768px)");

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const canCollapseComment = !!comment?.children?.length && !hideReplies;

  const onCommented = () => {
    if (collapsed) setCollapsed(false);
  };

  const { data: session } = useSession();
  const utils = api.useContext();

  const commentClasses = getCommentClasses(
    !!comment?.parentId,
    !!comment?.children?.length,
    compact
  );
  const router = useRouter();
  const { uid } = router.query;
  const rfqId = String(uid);

  const { date, toggleDateType } = useGetDate(comment?.createdAt);

  const toggleReplying = useCallback(
    () => setReplying((previousState) => !previousState),
    [setReplying]
  );

  const transform = (
    node: {
      type: string;
      name: string;
      attribs: { href: string | undefined };
      children: {
        data:
          | string
          | number
          | boolean
          | ReactElement<any, string | JSXElementConstructor<any>>
          | ReactFragment
          | ReactPortal
          | null
          | undefined;
      }[];
    },
    index: Key | null | undefined
  ) => {
    // Check if the node is an anchor tag
    if (node.type === "tag" && node.name === "a") {
      // Check if the href attribute starts with 'user:'
      if (node.attribs.href && node.attribs.href.startsWith("user:") && index) {
        return convertNodeToElement(
          { ...node, attribs: { ...node.attribs, class: "text-blue-500" } },
          Number(index),
          transform
        );
      }
    }
  };

  return (
    <div
      className={clsx(
        // VARIANT_CLASSES[variant],
        `relative flex w-full flex-col rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-700/90`,
        compact ? "gap-2 pl-2 sm:pl-4" : "gap-5 pl-3 sm:pl-6",
        !hideReplies && commentClasses
      )}
      id={identifiable ? comment?.id : undefined}
    >
      <ShouldRender if={canCollapseComment}>
        <button
          type="button"
          aria-label={
            collapsed ? "Uncollapse comments" : "Collapse all child comments"
          }
          onClick={toggleCollapsed}
          className={clsx(
            "absolute left-0 top-0 h-full rounded-l-lg bg-inherit hover:brightness-[98%] dark:hover:brightness-125",
            compact ? "w-2 gap-2 sm:w-4" : "w-3 gap-5 sm:w-6"
          )}
        />

        {collapsed && <MoreVertical />}
      </ShouldRender>
      <div
        className={clsx(
          "relative flex w-full flex-col gap-2 pl-2",
          compact ? "p-4" : "p-6",
          !hideReplies && !collapsed && "pb-0",
          hideReplies && (compact ? "pb-4" : "pb-6")
        )}
      >
        <div
          className={clsx(
            "flex w-full justify-between gap-10 sm:gap-0",
            compact && "text-sm"
          )}
        >
          <ShouldRender if={loading}>
            <Skeleton width="w-full max-w-[250px]" height="h-4" />
          </ShouldRender>
          <div className="flex items-center gap-1">
            <span
              className={clsx(
                "flex items-center font-medium",
                compact && "text-base"
              )}
            >
              <Link
                href={`/users/${comment?.userId}`}
                title="Visit user profile"
                className="line-clamp-1 text-ellipsis hover:underline"
              >
                {getUserDisplayName(comment?.user)}
              </Link>
              <ShouldRender
                if={comment?.userId === session?.user.id && !!session?.user.id}
              >
                <span className="ml-1 text-xs text-blue-500 xl:text-base">
                  {" "}
                  (You)
                </span>
              </ShouldRender>
              <ShouldRender if={comment?.authorIsOP}>
                <span
                  className="ml-1 select-none bg-blue-500 p-[2px] px-1 text-xs font-bold text-white shadow-sm dark:bg-blue-600"
                  title="Post author"
                >
                  OP
                </span>
              </ShouldRender>
            </span>
          </div>

          <ShouldRender if={!compact}>
            <p
              className="hidden cursor-pointer select-none xl:block"
              onClick={toggleDateType}
            >
              {date}
            </p>
          </ShouldRender>
        </div>

        {ReactHtmlParser(comment?.body ?? "", { transform })}

        <ShouldRender if={loading}>
          <Skeleton width="w-full" lines={3} />
        </ShouldRender>

        <div className="relative flex w-full items-center justify-between">
          <ShouldRender if={!linkToPost && !loading && !hideActions}>
            <button
              onClick={toggleReplying}
              className="w-auto text-sm text-blue-500 underline xl:text-base"
            >
              {replying ? "Stop replying" : "Reply"}
            </button>
          </ShouldRender>
          <ShouldRender if={linkToPost && !loading}>
            <p
              className={clsx(
                "line-clamp-2 w-full text-ellipsis border-t border-zinc-300 pt-4 font-bold dark:border-zinc-700",
                compact ? "text-xs sm:text-sm" : "text-sm xl:text-base"
              )}
            >
              <span>commented on</span>{" "}
              <Link
                className="w-auto text-blue-500 underline"
                href={`/posts/${comment?.rfqId}?highlightedComment=${comment?.id}`}
                as={`/posts/${comment?.rfqId}`}
              >
                {/*comment?.rfq?.companyName*/}
              </Link>
            </p>
          </ShouldRender>

          <ShouldRender
            if={
              !linkToPost &&
              session?.user?.id === comment?.userId &&
              !hideActions
            }
          >
            {/* <div className="absolute -bottom-3 -right-2 flex gap-2 items-center">
              <ActionButton
                action={isEditing ? "close" : "edit"}
                onClick={toggleIsEditing}
              />

            </div> */}
          </ShouldRender>
        </div>

        {replying && !shouldRenderModals && (
          <CommentField parentId={comment?.id} onCommented={onCommented} />
        )}
      </div>

      {comment?.children && comment?.children.length > 0 && !hideReplies && (
        <ListComments comments={comment?.children} collapsed={collapsed} />
      )}

      <ShouldRender if={shouldRenderModals}>
        <CommentActionModal parentComment={comment} openState={replyState} />
      </ShouldRender>
    </div>
  );
};

export default Comment;

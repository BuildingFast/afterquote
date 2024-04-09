import { api } from "~/utils/api";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import CommentField from "./CommentField";
import Comments from "./Comments";
import ShouldRender from "./ShouldRender";

const QuoteCommentSection: React.FC = () => {
  const router = useRouter();
  const { uid } = router.query;
  const rfqId = String(uid);

  const { data: comments } = api.comments.getCommentsForRfq.useQuery(
    { rfqId: rfqId },
    {
      refetchOnWindowFocus: false,
      // Disabling ssr here as the main focus of the
      // page is the post itself, the comments can load afterwards.
      trpc: {
        ssr: false,
      },
    }
  );

  // Scroll down to highlighted comment if query parameter exists.
  const highlightedComment = router.query.highlightedComment as string;
  const commentElement = document.getElementById(highlightedComment);

  useEffect(() => {
    if (!!commentElement) {
      commentElement?.scrollIntoView({ behavior: "smooth" });
      const ringClasses = "ring ring-gray-400 dark:ring-white";

      commentElement.className = `${commentElement.className} ${ringClasses}`;

      // Remove highlight after 4 seconds.
      setTimeout(() => {
        commentElement.className = commentElement.className.replace(
          ringClasses,
          ""
        );
      }, 4000);
    }
  }, [commentElement]);

  return (
    <div className="w-full">
      <CommentField />
      <ShouldRender if={comments}>
        <div className="xs:mt-10 mt-4 w-full">
          <Comments comments={comments} />
        </div>
      </ShouldRender>
    </div>
  );
};

export default QuoteCommentSection;

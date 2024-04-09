/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React, { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { MentionsInput, Mention } from "react-mentions";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

type Props = {
  parentId?: string;
  onCommented?: () => void;
};

const CommentField: React.FC<Props> = ({ parentId, onCommented }) => {
  const router = useRouter();
  const { uid } = router.query;
  const rfqId = String(uid);
  const [mdValue, setMdValue] = useState("");
  const { data } = api.user.getUsersFromOrganization.useQuery();

  const { status: sessionStatus } = useSession();
  const utils = api.useContext();

  const isReply = parentId;

  const { mutate, error: createCommentError } =
    api.comments.createCommentForRfq.useMutation({
      onSuccess: () => {
        // Reset markdown editor content.
        setMdValue("");

        if (onCommented) onCommented();
        // This will refetch the comments.
        utils.comments.getCommentsForRfq.invalidate();
      },
    });

  const createNotification =
    api.notification.createNotificationForChat.useMutation();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sessionStatus !== "authenticated") {
      return toast.info("Please login to comment");
    }

    if (sessionStatus === "authenticated") {
      const payload = {
        body: mdValue,
        rfqId,
        parentId,
      };

      mutate(payload);
      const regex = /@\[(.*?)\]\(user:(.*?)\)/g;
      let match;
      while ((match = regex.exec(mdValue)) !== null) {
        //const name = match[1];
        const id = match[2];
        //sendNotificationToUser(name, id);
        sendNotificationToUser(id);
      }
    }
  };

  function sendNotificationToUser(id: string | undefined) {
    if (id) {
      createNotification.mutate({
        message: "Tagged in Chat Message on RFQ",
        notificationFor: id,
        rfqId: rfqId,
      });
    }
    // Do something with name and id
    //console.log(`Name: ${name}, ID: ${id}`);
  }

  useEffect(() => {
    if (createCommentError) toast.error(createCommentError?.message);
  }, [createCommentError]);

  const style = {
    control: {
      backgroundColor: "#fff",
      fontSize: 14,
      fontWeight: "normal",
    },

    "&multiLine": {
      control: {
        fontFamily: "monospace",
        minHeight: 63,
      },
      highlighter: {
        padding: 9,
        border: "1px solid transparent",
      },
      input: {
        padding: 9,
        border: "1px solid silver",
        borderRadius: 12,
      },
    },

    "&singleLine": {
      display: "inline-block",
      width: 180,

      highlighter: {
        padding: 1,
        border: "2px inset transparent",
      },
      input: {
        padding: 1,
        border: "2px inset",
        color: "black",
      },
    },

    suggestions: {
      list: {
        backgroundColor: "white",
        color: "black",
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 14,
      },
      item: {
        padding: "5px 15px",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        "&focused": {
          backgroundColor: "#dbdbdb",
        },
      },
    },
    input: {
      overflow: "auto",
      height: 70,
      color: "black",
    },
    highlighter: {
      boxSizing: "border-box",
      overflow: "hidden",
      height: 70,
    },
  };

  return (
    <form className="mt-1" onSubmit={(e) => onSubmit(e)}>
      <MentionsInput
        style={style}
        value={mdValue}
        onChange={(e) => setMdValue(e.target.value)}
        placeholder={isReply ? "Send reply" : "Send message"}
        a11ySuggestionsListLabel={"Suggested mentions"}
      >
        <Mention
          markup="@[__display__](user:__id__)"
          trigger="@"
          data={
            data
              ? data.map((item) => {
                  return {
                    id: item.id,
                    display: item.name || "",
                  };
                })
              : []
          }
          renderSuggestion={(suggestion, search, highlightedDisplay) => (
            <div className="user">{highlightedDisplay}</div>
          )}
          style={{ backgroundColor: "#dbdbdb" }}
        />
      </MentionsInput>
      <div className="flex w-full items-end justify-end">
        <Button className="mt-2" size="sm" type="submit">
          {isReply ? "Send reply" : "Send message"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default CommentField;

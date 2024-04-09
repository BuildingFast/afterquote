// /* eslint-disable @typescript-eslint/no-misused-promises */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { useCallback, useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import {
//   UpdateCommentInput,
//   updateCommentSchema,
// } from "~/schema/comment.schema";
// import { api } from "~/utils/api";
// import { toast } from "react-toastify";
// import { useRouter } from "next/router";
// import { zodResolver } from "@hookform/resolvers/zod";
// import MarkdownEditor from "./MarkdownEditor";
// import Field from "./Field";
// import Button from "./Button";
// import { User } from "@prisma/client";
// import { MentionsInput, Mention } from "react-mentions";

// type WithChildren<T> = T & {
//     children: Array<WithChildren<T>>;
// };

// interface CommentType {
//   body: string;
//   authorIsOP: boolean;
//   id: string;
//   userId: string | null;
//   rfqId: string | null;
//   parentId: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   user: User | null;
//   rfq: {
//       userId: string;
//       customerId: string;
//   } | null;
// }

// type Props = {
//   comment?:  WithChildren<CommentType>
//   onFinish: () => void;
// };

// const EditCommentForm: React.FC<Props> = ({ comment, onFinish }) => {
//   const utils = api.useContext();

//   const router = useRouter();
//   const { uid } = router.query;
//   const rfqId = String(uid);
//   const [mdValue, setMdValue] = useState(comment?.body ? comment?.body : "");

//   const { handleSubmit, control, formState } = useForm<UpdateCommentInput>({
//     resolver: zodResolver(updateCommentSchema),
//     shouldFocusError: false,
//     defaultValues: {
//       body: comment?.body,
//       commentId: comment?.id,
//     },
//   });

//   const { errors } = formState;

//   const {
//     mutate: update,
//     isLoading: updating,
//     error: updateError,
//   } = api.comments.updateComment.useMutation({
//     onSuccess: () => {
//       void utils.comments.getCommentsForRfq.invalidate();
//     },
//   });

//   const onSubmit = () => {
//       update({
//         commentId: comment?.id as string,
//         body: mdValue,
//       });

//       onFinish();
//     }

//   useEffect(() => {
//     if (updateError) {
//       toast.error(updateError?.message);
//     }
//   }, [updateError]);

//   const style = {
//     control: {
//       backgroundColor: '#fff',
//       fontSize: 14,
//       fontWeight: 'normal',
//     },

//     '&multiLine': {
//       control: {
//         fontFamily: 'monospace',
//         minHeight: 63,
//       },
//       highlighter: {
//         padding: 9,
//         border: '1px solid transparent',
//       },
//       input: {
//         padding: 9,
//         border: '1px solid silver',
//       },
//     },

//     '&singleLine': {
//       display: 'inline-block',
//       width: 180,

//       highlighter: {
//         padding: 1,
//         border: '2px inset transparent',
//       },
//       input: {
//         padding: 1,
//         border: '2px inset',
//       },
//     },

//     suggestions: {
//       list: {
//         backgroundColor: 'white',
//         border: '1px solid rgba(0,0,0,0.15)',
//         fontSize: 14,
//       },
//       item: {
//         padding: '5px 15px',
//         borderBottom: '1px solid rgba(0,0,0,0.15)',
//         '&focused': {
//           backgroundColor: '#cee4e5',
//         },
//       },
//     },
//     input: {
//       overflow: 'auto',
//       height: 70,
//     },
//     highlighter: {
//       boxSizing: 'border-box',
//       overflow: 'hidden',
//       height: 70,
//     },
//   }

//   return (
//     <form onSubmit={onSubmit}>
//       <MentionsInput
//         value={mdValue}
//         className="dark:md-dark-mode"
//         onChange={(e) => setMdValue(e.target.value)}
//         style={style}
//         placeholder={"Type your reply"}
//         a11ySuggestionsListLabel={"Suggested mentions"}
//       >
//         <Mention
//           markup="@[__display__](user:__id__)"
//           trigger="@"
//           data={[{id: "hi", display: "hi"}, {id:"hmm", display: "hmm"}]}
//           renderSuggestion={(suggestion, search, highlightedDisplay) => (
//             <div className="user">{highlightedDisplay}</div>
//           )}
//           style={{backgroundColor: '#cee4e5'}}
//         />
//       </MentionsInput>

//       <Button
//         className="mt-2 px-6 md:w-auto flex justify-center w-full rounded-md"
//         variant="secondary"
//         type="submit"
//         loading={updating}
//       >
//         Update
//       </Button>
//     </form>
//   );
// };

// export default EditCommentForm;

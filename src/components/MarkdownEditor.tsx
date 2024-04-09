/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { marked } from "marked";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Controller } from "react-hook-form";
import "react-markdown-editor-lite/lib/index.css";
import { api } from "~/utils/api";
import { type FieldType } from "../utils/types";
import ShouldRender from "./ShouldRender";
import { AlertCircle } from "lucide-react";

const convertToMegabytes = (value: number) => {
  return value / (1024 * 1024);
};

const UPLOAD_MAX_FILE_SIZE = 10485760; // 10MB

type Variants = "condensed" | "regular";

type Props = {
  name: string;
  control: any;
  variant?: Variants;
  defaultValue?: string;
  placeholder?: string;
  imageUploadTip?: boolean;
  withImageUploads?: boolean;
};

const enabledPlugins = [
  "header",
  "font-bold",
  "font-italic",
  "font-strikethrough",
  "image",
  "list-unordered",
  "list-ordered",
  "block-quote",
  "block-wrap",
  "block-code-inline",
  "block-code-block",
  "table",
  "link",
  "clear",
  "logger",
  "mode-toggle",
  "full-screen",
];

const MdEditor = dynamic(() => import("react-markdown-editor-lite"), {
  ssr: false,
});

const MarkdownEditor: React.FC<Props> = ({
  name,
  control,
  variant = "regular",
  placeholder,
  defaultValue,
  imageUploadTip,
  withImageUploads = true,
}) => {
  const { data } = useSession();
  const userId = data?.user?.id as string;
  const maxSizeInMB = convertToMegabytes(UPLOAD_MAX_FILE_SIZE);
  const [showDropdown, setShowDropdown] = useState(false); // dropdown visibility
  const usersQuery = api.user.getUsersFromOrganization.useQuery();
  const handleEditorKeyDown = (event: any) => {
    if (event.key === "@" && !showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleEditorKeyUp = (event: any) => {
    if ((event.key === "Escape" || event.key === "Space") && showDropdown) {
      setShowDropdown(false);
    }
  };
  /*const { mutateAsync: createPresignedUrl } = api.useMutation(
    "attachments.create-presigned-post-body-url"
  );

  const onImageUpload = async (file: File) => {
    const randomKey = uuid();
    const image = file;

    const isImage = image.type.includes("image");

    if (!isImage)
      return toast.error(
        "Only images are available for uploading. Please select an image."
      );

    if (image.size > UPLOAD_MAX_FILE_SIZE)
      return toast.error(`Limit of ${maxSizeInMB}MB per file`);

    const { url, fields } = await createPresignedUrl({ userId, randomKey });

    const formData = new FormData();

    Object.keys(fields).forEach((key) => {
      formData.append(key, fields[key]);
    });

    formData.append("Content-Type", image.type);
    formData.append("file", image);

    await fetch(url, {
      method: "POST",
      body: formData,
    });

    const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_POST_BODY_BUCKET_NAME}.s3.amazonaws.com/${userId}-${randomKey}`;
    
    return imageUrl;
  };*/

  const mdParser = marked.setOptions({
    smartypants: true,
    langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    renderer: new marked.Renderer(),
    // purify html
    sanitizer(html) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return DOMPurify.sanitize(html);
    },
    highlight: function (code, lang) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
      return hljs.highlight(code, { language }).value;
    },
  });

  const handleChange = useCallback(
    (field: FieldType) =>
      ({ text }: { text: string; html: string }) => {
        if (typeof text === "string") {
          return field.onChange(text);
        }
      },
    []
  );

  const handleUserClick = () => {
    /*const { start, end } = editor.getCursor();
    const textBeforeCursor = markdown.slice(0, start);
    const textAfterCursor = markdown.slice(end);
    setMarkdown(`${textBeforeCursor}@${username}${textAfterCursor}`);
    setShowDropdown(false);
    editor.setCursor({ line: editor.getCursor().line, ch: start + username.length + 1 });
    editor.focus();*/
    console.log("hi");
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div
          contentEditable
          onKeyDown={handleEditorKeyDown}
          onKeyUp={handleEditorKeyUp}
          className="relative w-full"
        >
          <MdEditor
            plugins={enabledPlugins}
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="dark:md-dark-mode"
            shortcuts
            htmlClass="html-section"
            onImageUpload={
              withImageUploads ? /*onImageUpload*/ undefined : undefined
            }
            renderHTML={(text) => mdParser.parse(text)}
            {...field}
            onChange={handleChange(field)}
          />
          {showDropdown && usersQuery && usersQuery.data && (
            <div className="dropdown">
              {usersQuery.data.map((user: any) => (
                <div
                  key={user.id}
                  className="dropdown-item"
                  onClick={() => handleUserClick}
                >
                  @{user.name}
                </div>
              ))}
            </div>
          )}

          <ShouldRender if={imageUploadTip}>
            <div className="flex w-full select-none gap-1 border-[1px] border-t-0 border-zinc-300 bg-white px-1 py-2 dark:border-neutral-800 dark:bg-neutral-900 sm:items-center">
              <AlertCircle />
              <span className="text-xs text-neutral-700 dark:text-neutral-400 sm:text-sm">
                Drag n&apos; drop images or click the image icon on the menu to
                upload your own images to the text.
              </span>
            </div>
          </ShouldRender>
        </div>
      )}
    />
  );
};

export default MarkdownEditor;

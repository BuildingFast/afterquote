/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Box,
  Download,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Sheet,
  Upload,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import FileViewer from "~/components/FileView";
import HeaderNav from "~/components/HeaderNav";
import QuoteNav from "~/components/QuoteNav";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const RfqFiles: NextPage = () => {
  const [viewerUrl, setViewerUrl] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { uid, fileId } = router.query;
  const rfqUid = String(uid);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputFile = useRef<any>(null);
  const userRole = api.user?.getUserRole.useQuery();
  const isAdminOrHigher =
    userRole.data?.role === "ADMIN" || userRole.data?.role === "OWNER"
      ? true
      : false;

  const rfqFilesS3Urls = api.files.getS3UrlsForRfq.useQuery({
    rfqId: rfqUid,
  });
  const aws_files_s3_file_uploader =
    api.files?.getPresignedUrlForRfqFile.useMutation();
  const acceptedExtensions = [
    "pdf",
    "xls",
    "xlsx",
    "doc",
    "docx",
    "stl",
    "stp",
    "step",
    "jpeg",
    "jpg",
    "png",
  ];
  function getAfterLastDot(str: string): string {
    const lastDotIndex = str.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No dot found in the string
      return "";
    }
    return str.substring(lastDotIndex + 1);
  }
  const utils = api.useContext();
  const put_aws_file_s3_url_in_db = api.files?.putRfqFileInDb.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.files.getS3UrlsForRfq.cancel();
      // Snapshot the previous value
      const optimisticUpdate = utils.files.getS3UrlsForRfq.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.files.getS3UrlsForRfq.setData({ rfqId: "" }, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.files.getS3UrlsForRfq.invalidate();
    },
  });
  const updateFileVisibility = api.files?.updateFileVisibility.useMutation({
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.files.getS3UrlsForRfq.cancel();
      // Snapshot the previous value
      const optimisticUpdate = utils.files.getS3UrlsForRfq.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.files.getS3UrlsForRfq.setData({ rfqId: "" }, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.files.getS3UrlsForRfq.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "Updated file visibility",
      });
    },
  });
  const updateVisbility = (fileId: string, visibility: boolean) => {
    updateFileVisibility.mutate({
      fileId,
      visibility,
    });
  };
  const uploadFile = (selectedFile: File) => {
    setIsUploading(true);
    const progressInterval = startSimulatedProgress();
    aws_files_s3_file_uploader.mutate(
      {
        rfqId: rfqUid,
        fileExtension: getAfterLastDot(selectedFile.name),
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSuccess: async (data) => {
          if (data) {
            const response = await fetch(data.s3Url, {
              method: "PUT",
              body: selectedFile,
              headers: {
                "Content-Type": selectedFile.type,
              },
            });
            if (response.ok) {
              put_aws_file_s3_url_in_db.mutate({
                rfqId: rfqUid,
                fileKey: data.fileKey,
                humanFileName: selectedFile.name,
              });
              clearInterval(progressInterval);
              setIsUploading(false);
              setUploadProgress(100);
              toast({
                title: "File Upload Successful",
                description: "Your file has been successfully uploaded.",
              });
            }
          }
        },
      }
    );
    if (inputFile.current) {
      inputFile.current.value = "";
    }
  };
  function getPresignedUrlForFileId(fileId: string): string {
    if (!rfqFilesS3Urls.data) {
      return "";
    }
    for (const obj of rfqFilesS3Urls.data) {
      if (obj.fileId === fileId) {
        return obj.s3Url;
      }
    }
    return ""; // Return null if id is not found
  }
  useEffect(() => {
    if (fileId && typeof fileId === "string") {
      setViewerUrl(getPresignedUrlForFileId(fileId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqFilesS3Urls.isLoading]);

  const startSimulatedProgress = () => {
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 500);

    return interval;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDrop = useCallback((acceptedFiles: any) => {
    const ext = getAfterLastDot(acceptedFiles[0].name).toLowerCase();
    if (!acceptedExtensions.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid file type",
      });
      return;
    }
    uploadFile(acceptedFiles[0]);
    posthog.capture("File Uploaded", {
      createdBy: session ? session.user.email : "could not get email",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { isDragActive, getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>RFQ Files</title>
        </Head>
        <div className="flex h-max w-screen flex-col ">
          <HeaderNav currentPage={"quotes"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="mx-16 w-screen gap-12 ">
              <QuoteNav currentPage="rfq_files" currentRfqId={rfqUid} />
              <div className="mt-4 grid h-5/6 w-full grid-cols-4 gap-2">
                <div className="col-span-1 w-full rounded-lg border shadow-sm ">
                  <section className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-background p-4 hover:bg-background/90 ">
                    <div
                      {...getRootProps()}
                      className={`flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 hover:bg-foreground/5  ${
                        isDragActive ? "border-blue-500" : ""
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="mb-2 text-sm text-zinc-700">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      {isUploading ? (
                        <div className="mx-auto mt-4 w-full max-w-xs">
                          <Progress
                            value={uploadProgress}
                            className="h-1 w-full bg-zinc-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  </section>
                  <Table className="mt-2 max-h-[200px] w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>File name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqFilesS3Urls.data
                        ? rfqFilesS3Urls.data?.map((s3UrlObject: any) => {
                            return (
                              <TableRow key={s3UrlObject.s3FileKey}>
                                <TableCell
                                  className="flex gap-1"
                                  onClick={() => {
                                    setViewerUrl(s3UrlObject.s3Url);
                                  }}
                                >
                                  {getAfterLastDot(
                                    s3UrlObject.humanFileName
                                  ) === "pdf" ? (
                                    // <FileIcon className="h-4 w-4" />
                                    <svg
                                      width="16px"
                                      height="16px"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V11C19 11.5523 19.4477 12 20 12C20.5523 12 21 11.5523 21 11V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM10.3078 23.5628C10.4657 23.7575 10.6952 23.9172 10.9846 23.9762C11.2556 24.0316 11.4923 23.981 11.6563 23.9212C11.9581 23.8111 12.1956 23.6035 12.3505 23.4506C12.5941 23.2105 12.8491 22.8848 13.1029 22.5169C14.2122 22.1342 15.7711 21.782 17.287 21.5602C18.1297 21.4368 18.9165 21.3603 19.5789 21.3343C19.8413 21.6432 20.08 21.9094 20.2788 22.1105C20.4032 22.2363 20.5415 22.3671 20.6768 22.4671C20.7378 22.5122 20.8519 22.592 20.999 22.6493C21.0755 22.6791 21.5781 22.871 22.0424 22.4969C22.3156 22.2768 22.5685 22.0304 22.7444 21.7525C22.9212 21.4733 23.0879 21.0471 22.9491 20.5625C22.8131 20.0881 22.4588 19.8221 22.198 19.6848C21.9319 19.5448 21.6329 19.4668 21.3586 19.4187C21.11 19.3751 20.8288 19.3478 20.5233 19.3344C19.9042 18.5615 19.1805 17.6002 18.493 16.6198C17.89 15.76 17.3278 14.904 16.891 14.1587C16.9359 13.9664 16.9734 13.7816 17.0025 13.606C17.0523 13.3052 17.0824 13.004 17.0758 12.7211C17.0695 12.4497 17.0284 12.1229 16.88 11.8177C16.7154 11.4795 16.416 11.1716 15.9682 11.051C15.5664 10.9428 15.1833 11.0239 14.8894 11.1326C14.4359 11.3004 14.1873 11.6726 14.1014 12.0361C14.0288 12.3437 14.0681 12.6407 14.1136 12.8529C14.2076 13.2915 14.4269 13.7956 14.6795 14.2893C14.702 14.3332 14.7251 14.3777 14.7487 14.4225C14.5103 15.2072 14.1578 16.1328 13.7392 17.0899C13.1256 18.4929 12.4055 19.8836 11.7853 20.878C11.3619 21.0554 10.9712 21.2584 10.6746 21.4916C10.4726 21.6505 10.2019 21.909 10.0724 22.2868C9.9132 22.7514 10.0261 23.2154 10.3078 23.5628ZM11.8757 23.0947C11.8755 23.0946 11.8775 23.0923 11.8824 23.0877C11.8783 23.0924 11.8759 23.0947 11.8757 23.0947ZM16.9974 19.5812C16.1835 19.7003 15.3445 19.8566 14.5498 20.0392C14.9041 19.3523 15.2529 18.6201 15.5716 17.8914C15.7526 17.4775 15.9269 17.0581 16.0885 16.6431C16.336 17.0175 16.5942 17.3956 16.8555 17.7681C17.2581 18.3421 17.6734 18.911 18.0759 19.4437C17.7186 19.4822 17.3567 19.5287 16.9974 19.5812ZM16.0609 12.3842C16.0608 12.3829 16.0607 12.3823 16.0606 12.3823C16.0606 12.3822 16.0607 12.3838 16.061 12.3872C16.061 12.386 16.0609 12.385 16.0609 12.3842Z"
                                        fill="#000000"
                                      />
                                    </svg>
                                  ) : getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "xls" ||
                                    getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "xlsx" ? (
                                    <Sheet className="h-4 w-4" />
                                  ) : getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "stp" ||
                                    getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "step" ? (
                                    <Box className="h-4 w-4" />
                                  ) : getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "stl" ? (
                                    <Box className="h-4 w-4" />
                                  ) : getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "doc" ||
                                    getAfterLastDot(
                                      s3UrlObject.humanFileName
                                    ) === "docx" ? (
                                    <FileText className="h-4 w-4" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4" />
                                  )}
                                  <div className="block">
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="mb-1 line-clamp-2">
                                            {s3UrlObject.humanFileName.substr(
                                              0,
                                              21
                                            )}
                                          </span>
                                        </TooltipTrigger>
                                        {s3UrlObject.humanFileName.length >
                                          20 && (
                                          <TooltipContent>
                                            <p>{s3UrlObject.humanFileName}</p>
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {s3UrlObject.quoteLineItemName && (
                                            <span className="rounded-lg bg-blue-300 p-1 text-xs">
                                              {s3UrlObject.quoteLineItemName}
                                            </span>
                                          )}
                                        </TooltipTrigger>
                                        <TooltipContent side={"bottom"}>
                                          <p>
                                            {s3UrlObject.quoteLineItemName} is
                                            the linked quote line item
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-[300px]"
                                    >
                                      <DropdownMenuItem>
                                        <Link
                                          href={s3UrlObject.s3Url}
                                          className="flex items-center"
                                        >
                                          <Download className="mr-2 h-4 w-4" />
                                          <span>Download</span>
                                        </Link>
                                      </DropdownMenuItem>
                                      {/*isAdminOrHigher && (
                                        <DropdownMenuItem className="flex justify-between">
                                          <div className="flex items-center">
                                            <Eye className="mr-2 h-4 w-4" />
                                            <span>
                                              Display on customer portal
                                            </span>
                                          </div>
                                          <Switch
                                            onCheckedChange={(visibility) => {
                                              updateVisbility(
                                                s3UrlObject.fileId,
                                                visibility
                                              );
                                            }}
                                            checked={
                                              s3UrlObject.visibleToCustomer
                                            }
                                          />
                                        </DropdownMenuItem>
                                      )*/}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : null}
                    </TableBody>
                  </Table>
                </div>
                <div className="col-span-3 h-full w-full rounded-lg border p-2 shadow-sm">
                  {viewerUrl ? (
                    <FileViewer viewerUrl={viewerUrl} />
                  ) : (
                    <div className="flex w-full flex-col items-center justify-center"></div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default RfqFiles;

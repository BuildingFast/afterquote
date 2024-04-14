/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { format } from "date-fns";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import JSZipUtils from "jszip-utils";
import {
  ArrowLeft,
  ChevronsUpDown,
  Download,
  ExternalLink,
} from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CustomerPortalNav from "~/components/CustomerPortalNav";
import FileViewer from "~/components/FileView";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import SecondaryText from "~/pages/design";
import { api } from "~/utils/api";

export default function Dashboard() {
  const [viewerUrl, setViewerUrl] = useState("");
  const [, setViewerFileId] = useState("");
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const salesOrderUid = String(uid);
  const salesOrder = api.salesOrder?.getOneCustomerPortal.useQuery(
    salesOrderUid,
    {
      cacheTime: 100,
    }
  );
  const salesOrderFilesS3Urls =
    api.orderFiles.getS3UrlForCustomerPortal.useQuery({
      salesOrderId: salesOrderUid,
    });
  const createNotificationForSalesOrderFileClick =
    api.notification.createNotificationForCustomerPortalFileClick.useMutation();
  const [lastUpdatedName, setLastUpdatedName] = useState(
    salesOrder.data?.updatedById
  );
  const [createdName, setCreatedName] = useState(salesOrder.data?.userId);
  const LastUpdatedName =
    api.user?.getUserNameById.useQuery({ id: lastUpdatedName ?? "" }).data
      ?.name ?? "";
  const CreatedName =
    api.user?.getUserNameById.useQuery({ id: createdName ?? "" }).data?.name ??
    "";
  const orderCustomFieldSchema =
    api.organization?.getCustomerPortalOrderCustomSchema.useQuery();
  const [customFields, setCustomFields] = useState(
    salesOrder.data?.customFields
  );

  function urlToPromise(url: string) {
    return new Promise(function (resolve, reject) {
      JSZipUtils.getBinaryContent(url, (err: any, data: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async function handleDownloadAll() {
    setViewerUrl("");
    setViewerFileId("");
    const zip = JSZip();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const addFilesToZip = salesOrderFilesS3Urls.data?.map(
      async (s3UrlObject: any) => {
        const data: any = await urlToPromise(s3UrlObject.s3Url);
        zip.file(s3UrlObject.humanFileName, data, {
          binary: true,
        });
      }
    );

    // Wait for all files to be added
    if (addFilesToZip) {
      await Promise.all(addFilesToZip);
    }

    void zip.generateAsync({ type: "blob" }).then((blob) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      saveAs(blob, `sales-order-files-${salesOrder.data?.poNumber}.zip`);
    });
  }

  useEffect(() => {
    let newJson = undefined;
    if (orderCustomFieldSchema.data?.orderCustomFieldSchema) {
      newJson = Object.keys(
        orderCustomFieldSchema.data?.orderCustomFieldSchema
      ).reduce((obj: { [key: string]: string }, key) => {
        obj[key] = "";
        return obj;
      }, {});
    }
    setCustomFields(salesOrder.data?.customFields ?? newJson);
    setLastUpdatedName(salesOrder.data?.updatedById);
    setCreatedName(salesOrder.data?.userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    salesOrder.data?.customFields,
    salesOrder.isLoading,
    orderCustomFieldSchema.data?.orderCustomFieldSchema,
    orderCustomFieldSchema.isLoading,
  ]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.back();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]);
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (salesOrder.isLoading && orderCustomFieldSchema.isLoading) {
    return <Spinner />;
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Customer Order • Afterquote</title>
        </Head>
        <div className="flex h-screen w-screen flex-col">
          <CustomerPortalNav />
          <main className="flex h-full w-screen flex-row justify-center ">
            <div className="container mx-10 mt-8 gap-12 sm:max-w-7xl">
              <div className="sm:px-none h-full w-full">
                {/* Header */}
                <div className="flex flex-col">
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void router.push("/customer_portal/dashboard")
                      }
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div>
                      <h1 className="scroll-m-20 text-2xl tracking-tight">
                        {salesOrder.data?.poNumber
                          ? `Order number ${salesOrder.data.poNumber}`
                          : "Order"}
                      </h1>
                      {salesOrder.data?.visibleToCustomer && (
                        <p className="my-4 text-sm text-muted-foreground">
                          Last Modified by{" "}
                          {salesOrder.data?.updatedById
                            ? LastUpdatedName
                            : CreatedName}{" "}
                          on{" "}
                          {format(
                            salesOrder.data?.updatedAt ?? new Date(),
                            "PPp"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details">
                    {salesOrder.data?.customFields && (
                      <div className="flex flex-col gap-4">
                        {salesOrder.data?.customFields &&
                          typeof salesOrder.data?.customFields === "object" &&
                          orderCustomFieldSchema.data?.orderCustomFieldSchema &&
                          typeof orderCustomFieldSchema.data
                            ?.orderCustomFieldSchema === "object" &&
                          Object.entries(
                            orderCustomFieldSchema.data?.orderCustomFieldSchema
                          ).map(([group, groupFields]) => (
                            <div key={group}>
                              <Separator className="my-8" />
                              <Collapsible defaultOpen={true}>
                                <div className="grid grid-cols-2">
                                  <div className="flex">
                                    <h2 className="text-xl ">{group}</h2>
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-2"
                                      >
                                        <ChevronsUpDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                      </Button>
                                    </CollapsibleTrigger>
                                  </div>
                                  <CollapsibleContent className="col-span-2 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {customFields &&
                                      Object.entries(groupFields as any).map(
                                        ([label, value]) => (
                                          <>
                                            {Array.isArray(value) ? (
                                              <>
                                                {(customFields as any)[
                                                  label
                                                ] !== undefined && (
                                                  <div className="grid">
                                                    <p
                                                      key={label}
                                                      className="text-muted-foreground"
                                                    >
                                                      {label}
                                                    </p>
                                                    {String(
                                                      (customFields as any)[
                                                        label
                                                      ]
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            ) : value === "date" ? (
                                              <>
                                                {(customFields as any)[
                                                  label
                                                ] !== undefined && (
                                                  <div className="grid">
                                                    <p
                                                      key={label}
                                                      className="text-muted-foreground"
                                                    >
                                                      {label}
                                                    </p>
                                                    {String(
                                                      new Date(
                                                        (customFields as any)[
                                                          label
                                                        ]
                                                      ).toLocaleDateString(
                                                        "en-us",
                                                        {
                                                          weekday: "long",
                                                          year: "numeric",
                                                          month: "short",
                                                          day: "numeric",
                                                        }
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            ) : value === "link" ? (
                                              <>
                                                {(customFields as any)[
                                                  label
                                                ] !== undefined && (
                                                  <div className="grid">
                                                    <p
                                                      key={label}
                                                      className="text-muted-foreground"
                                                    >
                                                      {label}
                                                    </p>

                                                    <Link
                                                      href={
                                                        (customFields as any)[
                                                          label
                                                        ]
                                                      }
                                                    >
                                                      {String(
                                                        (customFields as any)[
                                                          label
                                                        ]
                                                      )}
                                                    </Link>
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                {(customFields as any)[
                                                  label
                                                ] !== undefined && (
                                                  <div className="grid">
                                                    <p
                                                      key={label}
                                                      className="text-muted-foreground"
                                                    >
                                                      {label}
                                                    </p>
                                                    {String(
                                                      (customFields as any)[
                                                        label
                                                      ]
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </>
                                        )
                                      )}
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="files">
                    <div className="mb-12">
                      {salesOrderFilesS3Urls?.data?.length === 0 ? (
                        <></>
                      ) : (
                        <>
                          <Separator className="my-4" />
                          <div className="mb-8 ">
                            <div className="flex justify-between">
                              <p className="text-muted-foreground">Files</p>
                              <Button
                                variant="secondary"
                                className="mb-4 "
                                onClick={() => void handleDownloadAll()}
                              >
                                Download all files
                                <Download className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid w-full grid-cols-4 gap-4">
                              <div className="col-span-1 w-full rounded-lg border p-3 shadow-sm ">
                                <Table>
                                  <TableBody>
                                    {salesOrderFilesS3Urls?.data
                                      ? salesOrderFilesS3Urls.data?.map(
                                          (s3UrlObject: any) => {
                                            return (
                                              <TableRow
                                                key={s3UrlObject?.s3FileKey}
                                              >
                                                <TableCell
                                                  onClick={() => {
                                                    setViewerUrl(
                                                      s3UrlObject?.s3Url
                                                    );
                                                    setViewerFileId(
                                                      s3UrlObject?.fileId
                                                    );
                                                    createNotificationForSalesOrderFileClick.mutate(
                                                      {
                                                        salesOrderId:
                                                          salesOrderUid,
                                                        fileName:
                                                          s3UrlObject?.humanFileName,
                                                      }
                                                    );
                                                  }}
                                                >
                                                  {s3UrlObject?.humanFileName.substr(
                                                    0,
                                                    25
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  <Button
                                                    size="icon"
                                                    variant="outline"
                                                  >
                                                    <Link
                                                      href={s3UrlObject?.s3Url}
                                                      target="_blank"
                                                    >
                                                      <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          }
                                        )
                                      : null}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="col-span-3 min-h-[500px] w-full rounded-lg border p-2 shadow-sm">
                                {viewerUrl ? (
                                  <FileViewer viewerUrl={viewerUrl} />
                                ) : (
                                  <div className="flex w-full flex-col items-center justify-center"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
}

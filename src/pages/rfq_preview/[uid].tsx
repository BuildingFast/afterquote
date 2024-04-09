/* eslint-disable @typescript-eslint/no-unsafe-assignment */ /* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ChevronsUpDown, Download } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
import { api } from "~/utils/api";

const RfqPreview: NextPage = () => {
  const [viewerUrl, setViewerUrl] = useState("");
  const [, setViewerFileId] = useState("");
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const rfqUid = String(uid);
  const Rfq = api.rfq?.getOne.useQuery(rfqUid, { cacheTime: 100 });
  const [customFields, setCustomFields] = useState(Rfq.data?.customFields);
  const rfqCustomFieldSchema =
    api.organization?.getOrganizationRfqFieldSchema.useQuery();
  const rfqFilesS3Urls = api.files.getS3UrlsForRfq.useQuery({
    rfqId: rfqUid,
  });

  useEffect(() => {
    let newJson = undefined;
    if (rfqCustomFieldSchema.data?.rfqCustomFieldSchema) {
      newJson = Object.keys(
        rfqCustomFieldSchema.data?.rfqCustomFieldSchema
      ).reduce((obj: { [key: string]: string }, key) => {
        obj[key] = "";
        return obj;
      }, {});
    }
    setCustomFields(Rfq.data?.customFields ?? newJson);
  }, [
    Rfq.data?.customFields,
    Rfq.isLoading,
    rfqCustomFieldSchema.data?.rfqCustomFieldSchema,
    rfqCustomFieldSchema.isLoading,
  ]);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (Rfq.isLoading) {
    return <Spinner />;
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Quote Details • Afterquote</title>
        </Head>
        <main className="flex h-full w-screen flex-row justify-center ">
          <div className="container mx-10 gap-12 sm:max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl ">
                  {Rfq.data?.rfqNumber
                    ? `Order number ${Rfq.data.rfqNumber}`
                    : "Order"}
                </h1>
              </div>
              <Button className="mt-4" variant="outline">
                Print PDF
              </Button>
            </div>
            <Tabs defaultValue="details">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                {customFields &&
                  typeof customFields === "object" &&
                  rfqCustomFieldSchema.data?.rfqCustomFieldSchema &&
                  typeof rfqCustomFieldSchema.data?.rfqCustomFieldSchema ===
                    "object" &&
                  Object.entries(
                    rfqCustomFieldSchema.data?.rfqCustomFieldSchema
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
                            {Object.entries(groupFields as any).map(
                              ([label, value]) => (
                                <>
                                  {Array.isArray(value) ? (
                                    <>
                                      {(customFields as any)[label] !==
                                        undefined && (
                                        <div className="grid">
                                          <p
                                            key={label}
                                            className="text-muted-foreground"
                                          >
                                            {label}
                                          </p>
                                          {String((customFields as any)[label])}
                                        </div>
                                      )}
                                    </>
                                  ) : value === "date" ? (
                                    <>
                                      {(customFields as any)[label] !==
                                        undefined && (
                                        <div className="grid">
                                          <p
                                            key={label}
                                            className="text-muted-foreground"
                                          >
                                            {label}
                                          </p>
                                          {String(
                                            new Date(
                                              (customFields as any)[label]
                                            ).toLocaleDateString("en-us", {
                                              weekday: "long",
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })
                                          )}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {(customFields as any)[label] !==
                                        undefined && (
                                        <div className="grid">
                                          <p
                                            key={label}
                                            className="text-muted-foreground"
                                          >
                                            {label}
                                          </p>
                                          {String((customFields as any)[label])}
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
              </TabsContent>
              <TabsContent value="files">
                <div className="mb-12">
                  {rfqFilesS3Urls?.data?.length === 0 ? (
                    <></>
                  ) : (
                    <>
                      <Separator className="my-4" />
                      <div className="mb-8">
                        <h3 className="text-xl font-medium tracking-tight">
                          Files
                        </h3>
                        <div className="grid w-full grid-cols-4 gap-4">
                          <div className="col-span-1 w-full rounded-lg border p-3 shadow-sm ">
                            <Table>
                              <TableBody>
                                {rfqFilesS3Urls?.data
                                  ? rfqFilesS3Urls.data?.map(
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
                                              }}
                                            >
                                              {s3UrlObject?.humanFileName.substr(
                                                0,
                                                25
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <Link
                                                href={s3UrlObject?.s3Url}
                                                target="_blank"
                                              >
                                                <Download className="h-4 w-4" />
                                              </Link>
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
        </main>
      </>
    );
  }
  return <Spinner />;
};

export default RfqPreview;

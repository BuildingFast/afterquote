/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type QuoteLineItem } from "@prisma/client";
import {
  ChevronRight,
  FileSymlink,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SelectOption from "react-select";
import HeaderNav from "~/components/HeaderNav";
import QuoteNav from "~/components/QuoteNav";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import { getCurrencySymbol } from "~/utils/getCurrency";

type ProcessType = {
  value: string;
  label: string;
};

const RfqQuote: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const quoteUid = String(uid);
  const currentRfq = api.rfq?.getOne.useQuery(quoteUid, { cacheTime: 100 });
  const [customerId, setCustomerId] = useState(currentRfq.data?.customerId);
  let optimisticUpdate = null;
  let optimisticUpdate2 = null;
  const utils = api.useContext();
  const quoteLineItems = api.quote.getQuoteLineItems.useQuery({ id: quoteUid });
  const [selectedLineItem, setSelectedLineItem] =
    useState<QuoteLineItem | null>(null);
  const [processType, setProcessType] = useState<ProcessType | null>(null);
  const { data: processes } = api.processCatalog.getOrgProcesses.useQuery();
  const createQuoteLineItem = api.quote.createQuoteLineItem.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.quote.getQuoteLineItems.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.quote.getQuoteLineItems.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.quote.getQuoteLineItems.setData(
          { id: quoteUid },
          optimisticUpdate
        );
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.quote.getQuoteLineItems.invalidate();
      setPartName("");
      setPartNumber("");
      setPartQuantity(0);
    },
  });
  const linkFileToQuoteLineItem =
    api.quote.linkQuoteItemToQuoteFile.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.quote.getQuoteLineItems.cancel();
        void utils.files.getFilesForRfqWithoutS3Urls.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.quote.getQuoteLineItems.getData();
        optimisticUpdate2 = utils.files.getFilesForRfqWithoutS3Urls.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.quote.getQuoteLineItems.setData(
            { id: quoteUid },
            optimisticUpdate
          );
        }
        if (optimisticUpdate2) {
          utils.files.getFilesForRfqWithoutS3Urls.setData(
            { rfqId: quoteUid },
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.quote.getQuoteLineItems.invalidate();
        void utils.files.getFilesForRfqWithoutS3Urls.invalidate();
        setPartName("");
        setPartNumber("");
        setPartQuantity(0);
      },
    });
  const updateQuoteLineItemName = api.quote.updateQuoteLineItemName.useMutation(
    {
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.quote.getQuoteLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.quote.getQuoteLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.quote.getQuoteLineItems.setData(
            { id: quoteUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.quote.getQuoteLineItems.invalidate();
        setPartName("");
        setPartNumber("");
        setPartQuantity(0);
      },
    }
  );
  const updateQuoteLineItemDetails =
    api.quote.updateQuoteLineItemDetails.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.quote.getQuoteLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.quote.getQuoteLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.quote.getQuoteLineItems.setData(
            { id: quoteUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.quote.getQuoteLineItems.invalidate();
        setPartName("");
        setPartDetails("");
        setPartNumber("");
        setPartQuantity(0);
      },
    });
  const updateQuoteLineItemQuantity =
    api.quote.updateQuoteLineItemQuantity.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.quote.getQuoteLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.quote.getQuoteLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.quote.getQuoteLineItems.setData(
            { id: quoteUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.quote.getQuoteLineItems.invalidate();
        setPartName("");
        setPartDetails("");
        setPartNumber("");
        setPartQuantity(0);
        setPartCost(0);
      },
    });
  const updateQuoteLineItemCost = api.quote.updateQuoteLineItemCost.useMutation(
    {
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.quote.getQuoteLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.quote.getQuoteLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.quote.getQuoteLineItems.setData(
            { id: quoteUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.quote.getQuoteLineItems.invalidate();
        setPartName("");
        setPartDetails("");
        setPartNumber("");
        setPartQuantity(0);
      },
    }
  );
  const deleteQuoteLineItem = api.quote.deleteQuoteLineItem.useMutation({
    onMutate: () => {
      void utils.quote.getQuoteLineItems.cancel();
      void utils.files.getFilesForRfqWithoutS3Urls.cancel();
      optimisticUpdate = utils.quote.getQuoteLineItems.getData();
      optimisticUpdate2 = utils.files.getFilesForRfqWithoutS3Urls.getData();
      if (optimisticUpdate) {
        utils.quote.getQuoteLineItems.setData(
          { id: quoteUid },
          optimisticUpdate
        );
      }
      if (optimisticUpdate2) {
        utils.files.getFilesForRfqWithoutS3Urls.setData(
          { rfqId: quoteUid },
          optimisticUpdate2
        );
      }
    },
    onSettled: () => {
      void utils.quote.getQuoteLineItems.invalidate();
      void utils.files.getFilesForRfqWithoutS3Urls.invalidate();
    },
  });
  const rfqFiles = api.files.getFilesForRfqWithoutS3Urls.useQuery({
    rfqId: quoteUid,
  });
  function getHumanFileNameById(id: string): string | null {
    if (!rfqFiles.data) {
      return null;
    }
    for (const obj of rfqFiles.data) {
      if (obj.id === id) {
        return obj.humanFileName;
      }
    }
    return null; // Return null if id is not found
  }
  const [linkedFileId, setLinkedFileId] = useState("");
  const [partName, setPartName] = useState("");
  const [partDetails, setPartDetails] = useState("");
  const [partNumber, setPartNumber] = useState<string | null>(null);
  const [partCost, setPartCost] = useState<number>(0);
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const handleCreateLineItem = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (customerId) {
      createQuoteLineItem.mutate({
        rfqId: quoteUid,
        partName: partName,
        partNumber: partNumber ?? null,
        partQuantity: Number(partQuantity) ?? 1,
        partCost: Number(partCost) ?? 0,
        processId: processType ? processType.value : null,
      });
    }
  };

  const handleProcessChange = (selected: any) => {
    setProcessType(selected as ProcessType);
  };
  const handleLinkQuoteFile = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (linkedFileId && linkedFileId.length > 0 && selectedLineItem) {
      linkFileToQuoteLineItem.mutate({
        rfqId: quoteUid,
        quoteLineItemId: selectedLineItem.id,
        quoteFileId: linkedFileId,
      });
    }
  };
  const Headers = [
    {
      title: "Name",
    },
    {
      title: "Process",
    },
    {
      title: "Quantity",
    },
    {
      title: "Unit Cost",
    },
    {
      title: "Line Total",
    },
  ];

  useEffect(() => {
    setCustomerId(currentRfq.data?.customerId);
    setSelectedLineItem(
      quoteLineItems.data && quoteLineItems.data?.length > 0
        ? quoteLineItems.data[0]
          ? quoteLineItems.data[0]
          : null
        : null
    );
  }, [
    currentRfq.data?.customerId,
    currentRfq.isLoading,
    quoteLineItems.data,
    quoteLineItems.isLoading,
  ]);
  const handleItemInputNameChange = (
    lineItemId: string,
    partName: string | null
  ) => {
    if (lineItemId && partName && partName.length > 0) {
      updateQuoteLineItemName.mutate(
        {
          id: lineItemId,
          partName: partName ?? "",
        },
        {
          onSuccess: () => {
            toast({ title: "Updated name" });
          },
        }
      );
    }
  };
  const handleItemInputDetailsChange = (
    lineItemId: string,
    partName: string | null
  ) => {
    if (lineItemId && partName && partName.length > 0) {
      updateQuoteLineItemDetails.mutate(
        {
          id: lineItemId,
          partDetails: partDetails ?? "",
        },
        {
          onSuccess: () => {
            toast({ title: "Updated item details" });
          },
        }
      );
    }
  };
  const handleItemInputQuantityChange = (
    lineItemId: string,
    partQuantity: number | null
  ) => {
    if (lineItemId && partQuantity) {
      updateQuoteLineItemQuantity.mutate(
        {
          id: lineItemId,
          partQuantity: partQuantity ?? 1,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated quantity" });
          },
        }
      );
    }
  };
  const handleItemInputCostChange = (
    lineItemId: string,
    partCost: number | null
  ) => {
    if (lineItemId && partCost) {
      updateQuoteLineItemCost.mutate(
        {
          id: lineItemId,
          partCost: partCost ?? 0,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated part cost" });
          },
        }
      );
    }
  };
  const handleDelete = (lineItemId: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this item.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteQuoteLineItem.mutate(lineItemId, {
                onSuccess: () => {
                  toast({ title: "Deleted item" });
                },
              });
            }}
          >
            Delete
          </ToastAction>
        </>
      ),
    });
  };

  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const [orgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );

  function getLineTotal(
    partCost: number | null,
    partQuantity: number | null
  ): string {
    if (partCost && partQuantity) {
      return (Number(partCost) * Number(partQuantity)).toFixed(2);
    } else if (partCost && !partQuantity) {
      return Number(partCost).toFixed(2);
    } else {
      return "0.0";
    }
  }
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated" && quoteLineItems.isSuccess) {
    return (
      <>
        <Head>
          <title>Quote • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col bg-muted">
          <HeaderNav currentPage={"quotes"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="container relative gap-12 ">
              <QuoteNav currentPage={"quote"} currentRfqId={quoteUid} />
              <div className="flex flex-col gap-4">
                <div className="mb-5 mt-4 flex h-fit flex-col rounded-md bg-background p-8 shadow ">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Quote</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Add Part
                            <PlusCircle className="ml-2 h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add part</DialogTitle>
                            <DialogDescription>
                              Click confirm to save part.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateLineItem}>
                            <div className="grid gap-4 py-4">
                              <div>
                                <Input
                                  type="text"
                                  placeholder="Part Name"
                                  pattern=".{1,}"
                                  required
                                  value={partName}
                                  onChange={(e) => {
                                    setPartName(e.target.value);
                                  }}
                                />
                              </div>
                              <div>
                                <SelectOption
                                  name="colors"
                                  value={processType}
                                  onChange={handleProcessChange}
                                  options={processes?.map(
                                    (process: {
                                      id: string;
                                      name: string;
                                    }) => ({
                                      value: process.id,
                                      label: process.name,
                                    })
                                  )}
                                  className="basic-multi-select"
                                  classNamePrefix="select"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogTrigger>
                                <Button type="submit">Confirm</Button>
                              </DialogTrigger>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button asChild size="sm">
                        <Link href={`${quoteUid}/quote_pdf`}>
                          Finalize quote
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-4 w-full" />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Headers.map((header, index) => (
                          <TableHead scope="col" key={index}>
                            {header.title}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quoteLineItems.data?.map((lineItem: QuoteLineItem) => (
                        <TableRow
                          key={lineItem.id}
                          onClick={() => setSelectedLineItem(lineItem)}
                          className={
                            selectedLineItem &&
                            selectedLineItem.id === lineItem.id
                              ? ""
                              : ""
                          }
                        >
                          <TableCell className="relative align-top">
                            <Input
                              className="static"
                              defaultValue={lineItem.partName}
                              onChange={(e) => {
                                setPartName(e.target.value);
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== lineItem.partName) {
                                  handleItemInputNameChange(
                                    lineItem.id,
                                    e.target.value
                                  );
                                }
                              }}
                            />
                            <Textarea
                              placeholder="Item description"
                              className="rounded-sm bg-background"
                              defaultValue={lineItem.partDetails ?? ""}
                              onChange={(e) => {
                                setPartDetails(e.target.value);
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== lineItem.partName) {
                                  handleItemInputDetailsChange(
                                    lineItem.id,
                                    e.target.value
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {lineItem.processId &&
                              processes &&
                              processes.find(
                                (process: { id: string; name: string }) =>
                                  process.id === lineItem.processId
                              )?.name}
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              className="max-w-[100px]"
                              defaultValue={String(lineItem?.partQuantity)}
                              onChange={(e) => {
                                setPartQuantity(Number(e.target.value));
                              }}
                              onBlur={(e) => {
                                if (
                                  Number(e.target.value) !==
                                  Number(lineItem.partQuantity)
                                ) {
                                  handleItemInputQuantityChange(
                                    lineItem.id,
                                    Number(e.target.value)
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="flex items-center align-top">
                            {/* {getCurrencySymbol(
                                currentRfq.data?.currency
                                  ? currentRfq.data?.currency
                                  : orgCurrency
                              ) ?? " "} */}
                            <Input
                              className="max-w-[100px]"
                              defaultValue={String(lineItem?.partCost)}
                              onChange={(e) => {
                                setPartCost(Number(e.target.value));
                              }}
                              onBlur={(e) => {
                                if (
                                  Number(e.target.value) !==
                                  Number(lineItem.partQuantity)
                                ) {
                                  handleItemInputCostChange(
                                    lineItem.id,
                                    Number(e.target.value)
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="font-bold">
                              {getCurrencySymbol(
                                currentRfq.data?.currency
                                  ? currentRfq.data?.currency
                                  : orgCurrency
                              )}{" "}
                              {getLineTotal(
                                Number(lineItem?.partCost),
                                Number(lineItem?.partQuantity)
                              ) ?? 0}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-row justify-between">
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={quoteUid + "/costing/" + lineItem.id}
                                >
                                  Costing Details
                                </Link>
                              </Button>
                              <div className="w-10">
                                {lineItem.quotePrimaryFileId ? (
                                  <span> Linked File - </span>
                                ) : null}
                                {lineItem.quotePrimaryFileId ? (
                                  <Link
                                    className="text-blue-600"
                                    href={
                                      "/rfq-files/" +
                                      quoteUid +
                                      "?fileId=" +
                                      lineItem.quotePrimaryFileId
                                    }
                                  >
                                    {getHumanFileNameById(
                                      lineItem.quotePrimaryFileId
                                    )}
                                  </Link>
                                ) : null}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[160px]"
                                >
                                  {!lineItem.quotePrimaryFileId && (
                                    <DropdownMenuSub>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            className="w-full"
                                            variant="ghost"
                                          >
                                            <FileSymlink className="mr-2 h-4 w-4" />
                                            Link File
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="mx-auto w-fit">
                                          <DialogHeader>
                                            <DialogTitle>
                                              Link Design File
                                            </DialogTitle>
                                            <DialogDescription>
                                              Click confirm to link quote part
                                              to design file
                                            </DialogDescription>
                                          </DialogHeader>
                                          <form onSubmit={handleLinkQuoteFile}>
                                            <div className="grid gap-4 py-4">
                                              <Select
                                                onValueChange={setLinkedFileId}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select file from dropdown" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {rfqFiles.data
                                                    ? rfqFiles.data
                                                        ?.filter(
                                                          function (rfqFile) {
                                                            return (
                                                              rfqFile.quoteLineItem ===
                                                                null ||
                                                              rfqFile.quoteLineItem ===
                                                                undefined
                                                            );
                                                          }
                                                        )
                                                        .map(
                                                          (
                                                            s3UrlObject: any
                                                          ) => {
                                                            return (
                                                              <SelectItem
                                                                key={
                                                                  s3UrlObject.id
                                                                }
                                                                value={
                                                                  s3UrlObject.id
                                                                }
                                                              >
                                                                {
                                                                  s3UrlObject.humanFileName
                                                                }
                                                              </SelectItem>
                                                            );
                                                          }
                                                        )
                                                    : null}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <DialogFooter>
                                              <Button type="submit">
                                                Confirm
                                              </Button>
                                            </DialogFooter>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                    </DropdownMenuSub>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={handleDelete(lineItem.id)}
                                  >
                                    Delete item
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {getCurrencySymbol(
                              currentRfq.data?.currency
                                ? currentRfq.data?.currency
                                : orgCurrency
                            )}{" "}
                            {quoteLineItems.data?.reduce(
                              (acc, lineItem) =>
                                acc +
                                Number(
                                  getLineTotal(
                                    Number(lineItem.partCost),
                                    Number(lineItem.partQuantity)
                                  )
                                ),
                              0
                            ) ?? 0}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
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

export default RfqQuote;

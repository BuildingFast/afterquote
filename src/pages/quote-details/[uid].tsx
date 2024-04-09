/* eslint-disable @typescript-eslint/no-unsafe-assignment */ /* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  RfqPriority,
  RfqStatus,
  type CompanyAddress,
  type Prisma,
} from "@prisma/client";
import { Flex, ProgressBar } from "@tremor/react";
import { format } from "date-fns";
import {
  AlertCircle,
  BadgeDollarSign,
  Box,
  CalendarIcon,
  ChevronDown,
  ChevronsUpDown,
  CircleDashed,
  Download,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  RefreshCcw,
  Sheet,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash2,
  Upload,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import FileViewer from "~/components/FileView";
import HeaderNav from "~/components/HeaderNav";
import QuoteNav from "~/components/QuoteNav";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
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
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Progress } from "~/components/ui/progress";
import { ScrollArea } from "~/components/ui/scroll-area";
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
import { ToastAction } from "~/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils";
import { api } from "~/utils/api";
import { countries, type CountryOption } from "~/utils/countries";
import { currencies, getCurrencySymbol } from "~/utils/getCurrency";

const Rfq: NextPage = () => {
  let optimisticUpdate = null;
  const utils = api.useContext();
  const { toast } = useToast();

  const { status, data: sessionData } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const rfqUid = String(uid);
  const currentRfq = api.rfq?.getOne.useQuery(rfqUid, { cacheTime: 100 });
  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const checklistSchema =
    api.organization?.getOrganizationChecklistSchema.useQuery();
  const [, setCustomerId] = useState(currentRfq.data?.customerId);
  const [dateReceived, setDateReceived] = useState(
    currentRfq.data?.dateReceived
  );
  const [rfqNumber, setrfqNumber] = useState(currentRfq.data?.rfqNumber);
  const [dueDate, setDueDate] = useState(currentRfq.data?.dueDate);
  const [responseDate, setResponseDate] = useState(
    currentRfq.data?.responseDate
  );
  const [notes, setNotes] = useState(currentRfq.data?.notes);
  const [addressOne, setAddressOne] = useState(currentRfq.data?.addressOne);
  const [addressTwo, setAddressTwo] = useState(currentRfq.data?.addressTwo);
  const [addressState, setAddressState] = useState(
    currentRfq.data?.addressState
  );
  const [addressZip, setAddressZip] = useState(currentRfq.data?.addressZip);
  const [city, setCity] = useState(currentRfq.data?.city);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    currentRfq.data?.country
      ? { label: currentRfq.data?.country, value: currentRfq.data?.country }
      : null
  );
  const [salesPersonId, setSalesPersonId] = useState(
    currentRfq?.data?.salesPersonId
  );
  const [estimatorId, setEstimatorId] = useState(currentRfq?.data?.estimatorId);
  const [rfqStatus, setRfqStatus] = useState(
    currentRfq?.data?.status
      ? String(currentRfq?.data?.status)
      : String(RfqStatus.BACKLOG)
  );
  const [rfqPriority, setRfqPriority] = useState(
    currentRfq?.data?.priority
      ? String(currentRfq?.data?.priority)
      : String(RfqPriority.No)
  );
  const [customFields, setCustomFields] = useState(
    currentRfq.data?.customFields
  );
  const [checkListFields, setCheckListFields] = useState<
    Prisma.JsonValue | undefined
  >(currentRfq.data?.checkList);
  const [lastUpdatedName, setLastUpdatedName] = useState(
    currentRfq.data?.updatedById
  );
  const [createdName, setCreatedName] = useState(currentRfq.data?.userId);
  const [openDropdown, setOpenDropdown] = useState(false);

  const [orgCurrency, setOrgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );
  const companyAddresses = api.customer?.getCompanyAddresses.useQuery(
    currentRfq.data?.customerId ?? "",
    {
      cacheTime: 100,
    }
  );

  const [viewerUrl, setViewerUrl] = useState("");
  const [rfqCurrency, setRfqCurrency] = useState<string | null>(null);

  const [orderValue, setOrderValue] = useState<number | string>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAddress, setSelectedAddress] = useState<CompanyAddress | null>(
    null
  );
  const handleAddressSelection = (selectedItem: CompanyAddress) => {
    setSelectedAddress(selectedItem);
    setAddressOne(selectedItem.addressOne || "");
    setAddressTwo(selectedItem.addressTwo || "");
    setCity(selectedItem.addressCity || "");
    setAddressState(selectedItem.addressState || "");
    setAddressZip(selectedItem.addressZip || "");
    const matchingCountry = countries.find(
      (country) => country.value === selectedItem.addressCountry
    );
    setSelectedCountry(matchingCountry || null);
  };
  const updateRfq = api.rfq.updateRfq.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.rfq.getOne.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.rfq.getOne.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.rfq.getOne.setData(rfqUid, optimisticUpdate);
      }
    },
    // TODO: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.rfq.getOne.invalidate();
    },
  });
  const [
    loadingRfqToSalesOrderConversion,
    setLoadingRfqToSalesOrderConversion,
  ] = useState(false);
  const convertRfqToSalesOrder = api.rfq.convertRfqToSalesOrder.useMutation({
    onMutate: () => {
      setLoadingRfqToSalesOrderConversion(true);
    },
    onSuccess: () => {
      setLoadingRfqToSalesOrderConversion(false);
      toast({
        title: "Converted Rfq to Sales Order",
      });
    },
    onSettled: () => {
      setLoadingRfqToSalesOrderConversion(false);
    },
  });
  const handleConvertToSalesOrder = async () => {
    console.log("handleConvertToSalesOrder called.");
    try {
      console.log("Starting conversion process...");
      const response = await convertRfqToSalesOrder.mutateAsync({
        rfqId: rfqUid,
      });
      console.log("Conversion response:", response);
      if (response && response.id) {
        console.log(
          "Conversion successful. Navigating to Sales Order details..."
        );
        await router.push(`/order-details/${response.id}`);
      }
    } catch (error) {
      console.error("Failed to convert RFQ to Sales Order:", error);
      toast({
        variant: "destructive",
        title: "Failed to convert RFQ to Sales Order",
      });
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateRfq.mutate(
      {
        rfqId: rfqUid ? rfqUid : "",
        rfqNumber: rfqNumber ? rfqNumber : null,
        dateReceived: dateReceived ? dateReceived : null,
        dueDate: dueDate ? dueDate : null,
        responseDate: responseDate ? responseDate : null,
        notes: notes ? notes : null,
        addressOne: addressOne ? addressOne : null,
        addressTwo: addressTwo ? addressTwo : null,
        addressZip: addressZip ? addressZip : null,
        addressState: addressState ? addressState : null,
        city: city ? city : null,
        country: selectedCountry ? selectedCountry.value : null,
        customFields: customFields ? customFields : undefined,
        checkListFields: checkListFields ? checkListFields : undefined,
        salesPersonId: salesPersonId ? salesPersonId : null,
        estimatorId: estimatorId ? estimatorId : null,
        status: rfqStatus
          ? RfqStatus[rfqStatus as keyof typeof RfqStatus]
          : RfqStatus.BACKLOG,
        priority: rfqPriority
          ? RfqPriority[rfqPriority as keyof typeof RfqPriority]
          : RfqPriority.No,
        currency: rfqCurrency ? rfqCurrency : orgCurrency,
        orderValue: orderValue ? Number(orderValue) : null,
      },
      {
        onSuccess: (data: any) => {
          if (data && data.id) {
            toast({
              title: "RFQ updated",
            });
          } else {
            toast({
              variant: "destructive",
              title:
                "RFQ did not update: possible duplicate PO number or other error",
            });
          }
        },
      }
    );
  };
  const [open, setOpen] = useState(false);
  const handleChange = (selectedOption: CountryOption) => {
    setSelectedCountry(selectedOption as CountryOption | null);
  };

  const { data: orgMembers } =
    api.organization?.getOrganizationUserNames.useQuery();
  const returnUserName = (userId: string | null | undefined): string => {
    if (orgMembers && userId) {
      const result = orgMembers.find((member) => member.id === userId);
      if (result && result.name !== undefined && result.name !== null) {
        return result.name;
      }
    }
    return "Unassigned";
  };
  function getAfterLastDot(str: string): string {
    const lastDotIndex = str.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No dot found in the string
      return "";
    }
    return str.substring(lastDotIndex + 1);
  }
  const LastUpdatedName =
    api.user?.getUserNameById.useQuery({ id: lastUpdatedName ?? "" }).data
      ?.name ?? "";
  const CreatedName =
    api.user?.getUserNameById.useQuery({ id: createdName ?? "" }).data?.name ??
    "";
  const quoteFilesS3Urls = api.files.getS3UrlsForRfq.useQuery({
    rfqId: rfqUid,
  });

  const updateCheckListField = (key: string, newValue: boolean) => {
    setCheckListFields((prevFields) => {
      if (typeof prevFields === "object" && prevFields !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...prevFields, // spread the previous fields into the new state
          [key]: newValue, // update the specific key with the new value
        };
      }

      // If prevFields is not an object, return a new object with just the key-value pair
      return { [key]: newValue };
    });
  };

  type checkListFieldType = { [key: string]: boolean };

  const rfqCustomFieldSchema =
    api.organization?.getOrganizationRfqFieldSchema.useQuery();

  const updateCustomField = (key: string, newValue: any) => {
    setCustomFields((prevFields) => {
      if (typeof prevFields === "object" && prevFields !== null) {
        return {
          ...prevFields, // spread the previous fields into the new state
          [key]: newValue, // update the specific key with the new value
        };
      }

      // If prevFields is not an object, return a new object with just the key-value pair
      return { [key]: newValue };
    });
  };

  useEffect(() => {
    let newJson = undefined;
    if (rfqCustomFieldSchema.data?.rfqCustomFieldSchema) {
      newJson = Object.keys(
        rfqCustomFieldSchema.data.rfqCustomFieldSchema
      ).reduce((obj: { [key: string]: any }, key) => {
        if (
          !rfqCustomFieldSchema.data ||
          !rfqCustomFieldSchema.data.rfqCustomFieldSchema
        ) {
          return {};
        }
        // Grab the schema for this field
        const fieldSchema = (
          rfqCustomFieldSchema.data.rfqCustomFieldSchema as {
            [index: string]: any;
          }
        )[key];

        // Initialize the object for this field based on its schema
        obj[key] = Object.keys(fieldSchema).reduce(
          (fieldObj: { [subKey: string]: string }, subKey) => {
            fieldObj[subKey] = "";
            return fieldObj;
          },
          {}
        );

        return obj;
      }, {});
    }
    setCustomerId(currentRfq.data?.customerId);
    setSalesPersonId(currentRfq.data?.salesPersonId);
    setEstimatorId(currentRfq.data?.estimatorId);
    setRfqStatus(currentRfq.data?.status ?? String(RfqStatus.BACKLOG));
    setRfqPriority(currentRfq.data?.priority ?? String(RfqPriority.No));
    setrfqNumber(currentRfq.data?.rfqNumber);
    setDateReceived(currentRfq.data?.dateReceived);
    setDueDate(currentRfq.data?.dueDate);
    setResponseDate(currentRfq.data?.responseDate);
    setNotes(currentRfq.data?.notes);
    setAddressOne(currentRfq.data?.addressOne);
    setAddressTwo(currentRfq.data?.addressTwo);
    setAddressZip(currentRfq.data?.addressZip);
    setAddressState(currentRfq.data?.addressState);
    setCity(currentRfq.data?.city);
    setSelectedCountry(
      currentRfq.data?.country
        ? { label: currentRfq.data?.country, value: currentRfq.data?.country }
        : null
    );
    setCustomFields(currentRfq.data?.customFields ?? newJson);
    setLastUpdatedName(currentRfq.data?.updatedById);
    setCreatedName(currentRfq.data?.userId);
    setOrgCurrency(String(orgCurrencyData.data?.currency) || "USD");
    setRfqCurrency(currentRfq.data?.currency ?? null);
    setOrderValue(Number(currentRfq.data?.orderValue) ?? null);
    let checkListJson = undefined;
    if (checklistSchema.data?.checkListSchema) {
      checkListJson = checklistSchema.data?.checkListSchema.reduce(
        (obj: { [key: string]: boolean }, key) => {
          obj[key] = false;
          return obj;
        },
        {}
      );
    }
    setCheckListFields(currentRfq.data?.checkList ?? checkListJson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentRfq.isLoading,
    checklistSchema.isLoading,
    rfqCustomFieldSchema.isLoading,
  ]);
  const totalCheckListLength =
    checklistSchema.data?.checkListSchema.length ?? 0;

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
  const aws_files_s3_file_uploader =
    api.files?.getPresignedUrlForRfqFile.useMutation();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const inputFile = useRef<any>(null);
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
  const deleteRfqFile = api.files?.deleteFile.useMutation({
    onMutate: () => {
      void utils.files.getS3UrlsForRfq.cancel();
      optimisticUpdate = utils.files.getS3UrlsForRfq.getData();
      if (optimisticUpdate) {
        utils.files.getS3UrlsForRfq.setData({ rfqId: "" }, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.files.getS3UrlsForRfq.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "RFQ File Deleted Successfully",
      });
    },
  });
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
    // posthog.capture("File Uploaded", {
    //   createdBy: session ? session.user.email : "could not get email",
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileDelete = (fileId: string) => () => {
    console.log("handleFileDelete called.");
    console.log("fileId:", fileId);
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this file.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteRfqFile.mutate(fileId);
            }}
          >
            Delete
          </ToastAction>
        </>
      ),
    });
  };

  const { isDragActive, getRootProps, getInputProps } = useDropzone({
    onDrop,
  });
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (currentRfq.isLoading || loadingRfqToSalesOrderConversion) {
    return <Spinner />;
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Quote Details • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col bg-muted">
          <HeaderNav currentPage={"quotes"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="container relative gap-12 ">
              <QuoteNav currentPage={"quote-details"} currentRfqId={rfqUid} />
              <div className="mt-2 flex flex-row justify-between">
                {totalCheckListLength > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="w-[420px]">
                      {checkListFields && (
                        <Flex>
                          <ProgressBar
                            value={
                              (Object.values(
                                checkListFields as checkListFieldType
                              ).filter((value) => value === true).length /
                                totalCheckListLength) *
                              100
                            }
                            color="neutral"
                            className="mr-4"
                          />
                          <h3 className="mr-2 flex items-center">
                            {
                              Object.values(
                                checkListFields as checkListFieldType
                              ).filter((value) => value === true).length
                            }
                            /{totalCheckListLength}{" "}
                          </h3>
                          <ChevronDown />
                        </Flex>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 grid grid-cols-4 gap-8 rounded-lg border p-4 ">
                        {checklistSchema.data &&
                          checklistSchema.data?.checkListSchema.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={index.toString()}
                                  checked={
                                    checkListFields &&
                                    typeof checkListFields === "object"
                                      ? (checkListFields as checkListFieldType)[
                                          item
                                        ]
                                      : false
                                  }
                                  onCheckedChange={(checked) => {
                                    if (checked === "indeterminate") {
                                      checked = false;
                                    }
                                    updateCheckListField(item, checked);
                                  }}
                                />
                                <Label htmlFor={index.toString()}>{item}</Label>
                              </div>
                            )
                          )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
              <form
                className="mb-8 flex flex-col justify-between gap-4 "
                onSubmit={handleSubmit}
              >
                <div className="right-10 top-4 flex items-center space-x-4 sm:absolute">
                  <p className="text-sm text-muted-foreground">
                    Last Modified by{" "}
                    {currentRfq.data?.updatedById
                      ? currentRfq.data?.updatedById == sessionData?.user.id
                        ? "You"
                        : LastUpdatedName
                      : CreatedName}{" "}
                    on {format(currentRfq.data?.updatedAt ?? new Date(), "PPp")}
                  </p>
                  <Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Actions
                          <MoreHorizontal className="ml-2 h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[300px]" align="start">
                        <DropdownMenuItem>
                          <DialogTrigger
                            className="flex w-full flex-row items-center justify-between p-2"
                            onClick={() => setDialogOpen(true)}
                          >
                            Convert to Sales Order
                            <BadgeDollarSign className="h-4 w-4" />
                          </DialogTrigger>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex  items-center">
                          Convert to Sales Order
                        </DialogTitle>
                        <DialogDescription>
                          Click on confirm to convert.
                        </DialogDescription>
                      </DialogHeader>
                      {dialogOpen && (
                        <DialogFooter>
                          <DialogTrigger>
                            <Button
                              onClick={() => {
                                setDialogOpen(false);
                                void handleConvertToSalesOrder();
                              }}
                              type="submit"
                            >
                              Confirm
                            </Button>
                          </DialogTrigger>
                        </DialogFooter>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button type="submit">Save</Button>
                </div>
                <div className="grid h-fit w-full flex-col gap-4 rounded-md bg-background p-8 shadow">
                  <div className="grid ">
                    <div className="col-span-2 grid w-full grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="rfqNumber">PO Number</Label>
                        <Input
                          type="text"
                          placeholder="Quote Number"
                          className="max-w-[240px]"
                          value={rfqNumber ? rfqNumber : undefined}
                          onChange={(event) => setrfqNumber(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Status</Label>
                        <Select onValueChange={setRfqStatus}>
                          <SelectTrigger className="max-w-[240px]">
                            <SelectValue>
                              {rfqStatus === RfqStatus.BACKLOG
                                ? "📝 Backlog"
                                : rfqStatus === RfqStatus.PROGRESS
                                ? "🚧 Progress"
                                : rfqStatus === RfqStatus.HOLD
                                ? "📁 Hold"
                                : rfqStatus === RfqStatus.ORDERPLACED
                                ? "🔔 Order Placed"
                                : "✅ Quote Sent"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RfqStatus.BACKLOG}>
                              📝 Backlog
                            </SelectItem>
                            <SelectItem value={RfqStatus.PROGRESS}>
                              🚧 Progress
                            </SelectItem>
                            <SelectItem value={RfqStatus.HOLD}>
                              📁 Hold
                            </SelectItem>
                            <SelectItem value={RfqStatus.ORDERPLACED}>
                              🔔 Order Placed
                            </SelectItem>
                            <SelectItem value={RfqStatus.COMPLETED}>
                              ✅ Quote Sent
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quote priority</Label>
                        <Select onValueChange={setRfqPriority}>
                          <SelectTrigger className="max-w-[240px]">
                            <SelectValue>
                              {rfqPriority === RfqPriority.No ? (
                                <>
                                  <CircleDashed className="mr-2 inline-block h-4 w-4" />{" "}
                                  No Priority
                                </>
                              ) : rfqPriority === RfqPriority.Urgent ? (
                                <>
                                  <AlertCircle className="mr-2 inline-block h-4 w-4" />{" "}
                                  Urgent
                                </>
                              ) : rfqPriority === RfqPriority.Low ? (
                                <>
                                  <SignalLow className="mr-2 inline-block h-4 w-4" />{" "}
                                  Low
                                </>
                              ) : rfqPriority === RfqPriority.Medium ? (
                                <>
                                  <SignalMedium className="mr-2 inline-block h-4 w-4" />{" "}
                                  Medium
                                </>
                              ) : rfqPriority === RfqPriority.High ? (
                                <>
                                  <SignalHigh className="mr-2 inline-block h-4 w-4" />{" "}
                                  High
                                </>
                              ) : (
                                "No Priority"
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RfqPriority.No}>
                              <CircleDashed className="mr-2 inline-block h-4 w-4	" />
                              No
                            </SelectItem>
                            <SelectItem value={RfqPriority.Urgent}>
                              <AlertCircle className="mr-2 inline-block h-4 w-4	" />
                              Urgent
                            </SelectItem>
                            <SelectItem value={RfqPriority.Low}>
                              <SignalLow className="mr-2 inline-block h-4 w-4	" />
                              Low
                            </SelectItem>
                            <SelectItem value={RfqPriority.Medium}>
                              <SignalMedium className="mr-2 inline-block h-4 w-4	" />
                              Medium
                            </SelectItem>
                            <SelectItem value={RfqPriority.High}>
                              <SignalHigh className="mr-2 inline-block h-4 w-4	" />
                              High
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid ">
                        <Label htmlFor="date">Date Received</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "max-w-[240px] justify-start text-left font-normal",
                                !dateReceived && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateReceived ? (
                                format(dateReceived, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateReceived ?? undefined}
                              onSelect={setDateReceived}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid max-w-[240px] grid-cols-4 gap-1">
                        <Label htmlFor="rfqCurrency" className="col-span-4">
                          Quote Currency
                        </Label>
                        <Popover
                          open={openDropdown}
                          onOpenChange={setOpenDropdown}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "flex justify-between",
                                currentRfq.data?.currency
                                  ? "col-span-3 mr-2"
                                  : "col-span-4"
                              )}
                            >
                              <span>
                                {getCurrencySymbol(
                                  rfqCurrency ? rfqCurrency : orgCurrency
                                )}
                              </span>
                              {rfqCurrency ? rfqCurrency : orgCurrency}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent
                            className={cn(
                              "p-0",
                              rfqCurrency ? "max-w-[180px]" : "max-w-[240px]"
                            )}
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search Currency"
                                className="h-9"
                              />
                              <CommandEmpty>Currency Not found.</CommandEmpty>
                              <CommandGroup className="h-[200px]">
                                <ScrollArea type="always" className="h-72">
                                  {currencies.map((currency) => (
                                    <CommandItem
                                      key={currency.shortName}
                                      className="flex justify-between"
                                      onSelect={() => {
                                        setRfqCurrency(currency.shortName);
                                        setOpenDropdown(false);
                                      }}
                                    >
                                      <span>{currency.symbol}</span>
                                      <span>{currency.shortName}</span>
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {currentRfq.data?.currency && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  type="button"
                                  onClick={() => setRfqCurrency(null)}
                                >
                                  <RefreshCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Set Organization Currency</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="rfqNumber">Order Value</Label>
                        <Input
                          id="orderValue"
                          pattern="^\d*(\.\d{0,4})?$"
                          placeholder="Order Value"
                          className="max-w-[240px]"
                          value={orderValue.toString()}
                          onChange={(e) => {
                            setOrderValue(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="salesperson">Salesperson</Label>
                      <Select onValueChange={setSalesPersonId}>
                        <SelectTrigger className="max-w-[240px]">
                          <SelectValue
                            placeholder={returnUserName(salesPersonId)}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {orgMembers?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="production">Production</Label>
                      <Select onValueChange={setEstimatorId}>
                        <SelectTrigger className="max-w-[240px]">
                          <SelectValue
                            placeholder={returnUserName(estimatorId)}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {orgMembers?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="date">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "max-w-[240px] justify-start text-left font-normal",
                              !dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? (
                              format(dueDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dueDate ?? undefined}
                            onSelect={setDueDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="">
                    <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" className="border">
                              Select Company Address
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {companyAddresses.data?.companyAddresses?.map(
                              (companyAddress: CompanyAddress) => (
                                <DropdownMenuItem
                                  key={companyAddress.id}
                                  className="mb-4 flex w-96 justify-between rounded-lg border p-4"
                                  onClick={() =>
                                    handleAddressSelection(companyAddress)
                                  }
                                >
                                  <div>
                                    {companyAddress.isBillingAddress &&
                                    companyAddress.isShippingAddress ? (
                                      <p className="font-semibold">
                                        Billing and Shipping Address
                                      </p>
                                    ) : companyAddress.isBillingAddress ? (
                                      <p className="font-semibold">
                                        Billing Address
                                      </p>
                                    ) : companyAddress.isShippingAddress ? (
                                      <p className="font-semibold">
                                        Shipping Address
                                      </p>
                                    ) : null}
                                    {companyAddress.addressOne ? (
                                      <>{`${String(
                                        companyAddress.addressOne
                                      )}, `}</>
                                    ) : (
                                      ""
                                    )}
                                    {companyAddress.addressTwo ? (
                                      <>
                                        {`${String(
                                          companyAddress.addressTwo
                                        )}, `}
                                        <br />
                                      </>
                                    ) : (
                                      ""
                                    )}
                                    {companyAddress.addressCity ? (
                                      <>{`${String(
                                        companyAddress.addressCity
                                      )}, `}</>
                                    ) : (
                                      ""
                                    )}
                                    {companyAddress.addressState
                                      ? `${String(
                                          companyAddress.addressState
                                        )}, `
                                      : ""}
                                    {companyAddress.addressCountry
                                      ? `${String(
                                          companyAddress.addressCountry
                                        )}, `
                                      : ""}
                                    {companyAddress.addressZip
                                      ? `${String(companyAddress.addressZip)}`
                                      : ""}
                                  </div>
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Label>Address 1</Label>
                        <Input
                          type="text"
                          placeholder="Address 1"
                          value={addressOne ? addressOne : undefined}
                          className="max-w-[240px]"
                          onChange={(event) =>
                            setAddressOne(event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Address 2</Label>
                        <Input
                          type="text"
                          placeholder="Address 2"
                          value={addressTwo ? addressTwo : undefined}
                          className="max-w-[240px]"
                          onChange={(event) =>
                            setAddressTwo(event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          type="text"
                          placeholder="City"
                          value={city ? city : undefined}
                          className="max-w-[240px]"
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          type="text"
                          placeholder="State"
                          value={addressState ? addressState : undefined}
                          className="max-w-[240px]"
                          onChange={(event) =>
                            setAddressState(event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Zip Code</Label>
                        <Input
                          type="text"
                          placeholder="Zip Code"
                          value={addressZip ? addressZip : undefined}
                          className="max-w-[240px]"
                          onChange={(event) =>
                            setAddressZip(event.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="max-w-[240px] justify-between"
                            >
                              {selectedCountry
                                ? countries.find(
                                    (country) =>
                                      country.value === selectedCountry.value
                                  )?.label
                                : "Select country..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="max-w-[240px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search countries"
                                className="h-9"
                              />
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup className="h-[200px]">
                                {countries.map((country) => (
                                  <CommandItem
                                    key={country.value}
                                    onSelect={() => {
                                      handleChange(country);
                                      setOpen(false);
                                    }}
                                  >
                                    {country.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {/* <div className="grid gap-1.5">
                        <Label htmlFor="date">Response Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "max-w-[240px] justify-start text-left font-normal",
                                !responseDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {responseDate ? (
                                format(responseDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={responseDate ?? undefined}
                              onSelect={setResponseDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div> */}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {customFields &&
                      typeof customFields === "object" &&
                      rfqCustomFieldSchema.data?.rfqCustomFieldSchema &&
                      typeof rfqCustomFieldSchema.data?.rfqCustomFieldSchema ===
                        "object" &&
                      Object.entries(
                        rfqCustomFieldSchema.data?.rfqCustomFieldSchema
                      ).map(([group, groupFields]) => (
                        <div key={group}>
                          {/* <Separator className="my-8" /> */}
                          <Collapsible className="mt-8" defaultOpen={true}>
                            <div className="grid grid-cols-2">
                              <div className="flex">
                                <h2 className="text-xl">{group}</h2>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-9 p-0"
                                  >
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle</span>
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                              <CollapsibleContent className="col-span-2 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(groupFields as any).map(
                                  ([label, value]) => (
                                    <div key={label}>
                                      {Array.isArray(value) ? (
                                        <div className="flex flex-col gap-2 ">
                                          <Label>{label}</Label>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="max-w-[240px] justify-between"
                                              >
                                                {(customFields as any)[label] ||
                                                  `Select ${label}...`}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="max-w-[240px] p-0">
                                              <Command>
                                                <CommandInput
                                                  placeholder={`Search ${label}`}
                                                  className="h-9"
                                                />
                                                <CommandEmpty>{`No ${label} found.`}</CommandEmpty>
                                                <CommandGroup className="h-[200px]">
                                                  {value.map((item) => (
                                                    <CommandItem
                                                      key={item}
                                                      onSelect={() => {
                                                        updateCustomField(
                                                          label,
                                                          item
                                                        );
                                                        setOpen(false);
                                                      }}
                                                    >
                                                      {String(item)}
                                                    </CommandItem>
                                                  ))}
                                                </CommandGroup>
                                              </Command>
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      ) : value === "date" ? (
                                        <div className="grid gap-1.5">
                                          <Label htmlFor="date">{label}</Label>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant={"outline"}
                                                className={cn(
                                                  "max-w-[240px] justify-start text-left font-normal",
                                                  !(customFields as any)[
                                                    label
                                                  ] && "text-muted-foreground"
                                                )}
                                              >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {(customFields as any)[
                                                  label
                                                ] ? (
                                                  new Date(
                                                    (customFields as any)[label]
                                                  ).toLocaleDateString()
                                                ) : (
                                                  <span>Pick a date</span>
                                                )}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                              <Calendar
                                                mode="single"
                                                selected={
                                                  (customFields as any)[label]
                                                }
                                                onSelect={(date) => {
                                                  updateCustomField(
                                                    String(label),
                                                    date
                                                  );
                                                }}
                                                initialFocus
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      ) : (
                                        <>
                                          <Label htmlFor="customfield">
                                            {label}
                                          </Label>
                                          <Input
                                            value={
                                              typeof (customFields as any)[
                                                label
                                              ] === "string" &&
                                              (customFields as any)[label] !==
                                                undefined
                                                ? String(
                                                    (customFields as any)[label]
                                                  )
                                                : undefined
                                            }
                                            onChange={(event) =>
                                              updateCustomField(
                                                String(label),
                                                event.target.value
                                              )
                                            }
                                            className="max-w-[240px]"
                                          />
                                        </>
                                      )}
                                    </div>
                                  )
                                )}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="flex h-fit flex-col gap-4 ">
                  <div className="rounded-md bg-background p-4 shadow">
                    <div className="flex flex-row">
                      <section className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg p-4 ">
                        <div
                          {...getRootProps()}
                          className={`flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 hover:bg-foreground/5  ${
                            isDragActive ? "border-blue-500" : ""
                          }`}
                        >
                          <input {...getInputProps()} />
                          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                          <p className="mb-2 text-sm text-zinc-700">
                            Click to upload or drag and drop
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
                      <Table className="mt-2 w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>File name</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quoteFilesS3Urls.data
                            ? quoteFilesS3Urls.data?.map((s3UrlObject: any) => {
                                return (
                                  <TableRow key={s3UrlObject.s3FileKey}>
                                    <TableCell
                                      className="flex items-center gap-1"
                                      onClick={() => {
                                        viewerUrl.length === 0
                                          ? setViewerUrl(s3UrlObject.s3Url)
                                          : setViewerUrl("");
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
                                              <span className="line-clamp-2">
                                                {s3UrlObject.humanFileName.substr(
                                                  0,
                                                  21
                                                )}
                                                ...
                                              </span>
                                            </TooltipTrigger>
                                            {s3UrlObject.humanFileName.length >
                                              20 && (
                                              <TooltipContent>
                                                <p>
                                                  {s3UrlObject.humanFileName}
                                                </p>
                                              </TooltipContent>
                                            )}
                                          </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider delayDuration={200}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              {s3UrlObject.quoteLineItemName && (
                                                <span className="rounded-lg bg-blue-300 p-1 text-xs">
                                                  {
                                                    s3UrlObject.quoteLineItemName
                                                  }
                                                </span>
                                              )}
                                            </TooltipTrigger>
                                            <TooltipContent side={"bottom"}>
                                              <p>
                                                {s3UrlObject.quoteLineItemName}{" "}
                                                is the linked quote line item
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
                                            className="flex h-6 w-6 p-0 data-[state=open]:bg-muted"
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
                                          <DropdownMenuItem
                                            onClick={handleFileDelete(
                                              s3UrlObject.fileId
                                            )}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                          </DropdownMenuItem>
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
                    <div className="w-full rounded-lg">
                      {viewerUrl ? (
                        <div className="h-screen">
                          <FileViewer viewerUrl={viewerUrl} />
                        </div>
                      ) : (
                        <div className="flex w-full flex-col items-center justify-center"></div>
                      )}
                    </div>
                  </div>
                </div>
                {/* {email.data?.emailText && (
                  <>
                    <div className="mt-8 grid grid-cols-3">
                      <h2 className="col-span-1 text-xl">RFQ Email Received</h2>
                      <div className="col-span-2">
                        {email.data?.emailText ? (
                          <div className="w-full rounded-lg border p-8 shadow-sm">
                            <h1 className="font-semibold"></h1>
                            {email.data?.emailSubject}
                            {!viewFullEmail && (
                              <Button
                                variant={"link"}
                                onClick={() => setViewFullEmail(true)}
                              >
                                View more
                              </Button>
                            )}
                            {viewFullEmail && (
                              <>
                                <br />
                                {emailHtml(email.data?.emailText)}
                                <br />
                                <Button
                                  size="sm"
                                  variant={"link"}
                                  onClick={() => setViewFullEmail(false)}
                                >
                                  View less
                                </Button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                )} */}
              </form>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default Rfq;

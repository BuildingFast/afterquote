/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */ /* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import {
  OrderPriority,
  type CompanyAddress,
  type Prisma,
} from "@prisma/client";
import { format } from "date-fns";
import {
  AlertCircle,
  Box,
  CalendarIcon,
  ChevronsUpDown,
  CircleDashed,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  RefreshCcw,
  Sheet,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Upload,
  Trash2,
  Copy,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import HeaderNav from "~/components/HeaderNav";
import OrderNav from "~/components/OrderNav";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Progress } from "~/components/ui/progress";
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
import posthog from "posthog-js";
import { Separator } from "~/components/ui/separator";
import { ToastAction } from "~/components/ui/toast";
import FileViewer from "~/components/FileView";
import { Card } from "~/components/ui/card";

const SalesOrder: NextPage = () => {
  const isKtex = useFeatureIsOn("is-ktex");
  let optimisticUpdate = null;
  const utils = api.useContext();
  const { toast } = useToast();
  const inputFile = useRef<any>(null);
  // const { data: session, status } = useSession();
  const { status, data: sessionData } = useSession();
  const router = useRouter();
  const { uid, fileId } = router.query;
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const salesOrderUid = String(uid);
  const userRole = api.user?.getUserRole.useQuery();
  const isAdminOrHigher =
    userRole.data?.role === "ADMIN" || userRole.data?.role === "OWNER"
      ? true
      : false;
  const currentSalesOrder = api.salesOrder?.getOne.useQuery(salesOrderUid, {
    cacheTime: 100,
  });
  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const checklistSchema =
    api.organization?.getOrganizationChecklistSchema.useQuery();
  const [, setCustomerId] = useState(currentSalesOrder.data?.customerId);
  const [dateReceived, setDateReceived] = useState(
    currentSalesOrder.data?.dateReceived
  );
  const [poNumber, setPoNumber] = useState(currentSalesOrder.data?.poNumber);
  const [invoiceNumber, setInvoiceNumber] = useState(
    currentSalesOrder.data?.invoiceNumber
  );
  console.log(invoiceNumber);
  const [dueDate, setDueDate] = useState(currentSalesOrder.data?.dueDate);
  const [piNumber, setPiNumber] = useState(currentSalesOrder.data?.piNumber);
  const [piDate, setPiDate] = useState(currentSalesOrder.data?.piDate);
  const [notes, setNotes] = useState(currentSalesOrder.data?.notes);
  const [addressOne, setAddressOne] = useState(
    currentSalesOrder.data?.addressOne
  );
  const put_aws_file_s3_url_in_db =
    api.orderFiles?.putSalesOrderFileInDb.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.orderFiles.getS3UrlsForOrder.cancel();
        // Snapshot the previous value
        const optimisticUpdate = utils.orderFiles.getS3UrlsForOrder.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.orderFiles.getS3UrlsForOrder.setData(
            { salesOrderId: "" },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.orderFiles.getS3UrlsForOrder.invalidate();
      },
    });
  const [viewerUrl, setViewerUrl] = useState("");
  function getPresignedUrlForFileId(fileId: string): string {
    if (!orderFilesS3Urls.data) {
      return "";
    }
    for (const obj of orderFilesS3Urls.data) {
      if (obj.fileId === fileId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
  }, []);
  function getAfterLastDot(str: string): string {
    const lastDotIndex = str.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No dot found in the string
      return "";
    }
    return str.substring(lastDotIndex + 1);
  }
  const orderFilesS3Urls = api.orderFiles.getS3UrlsForOrder.useQuery({
    salesOrderId: salesOrderUid,
  });

  const [addressTwo, setAddressTwo] = useState(
    currentSalesOrder.data?.addressTwo
  );
  const [addressState, setAddressState] = useState(
    currentSalesOrder.data?.addressState
  );
  const [addressZip, setAddressZip] = useState(
    currentSalesOrder.data?.addressZip
  );
  const [city, setCity] = useState(currentSalesOrder.data?.city);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    currentSalesOrder.data?.country
      ? {
          label: currentSalesOrder.data?.country,
          value: currentSalesOrder.data?.country,
        }
      : null
  );
  const companyAddresses = api.customer?.getCompanyAddresses.useQuery(
    currentSalesOrder.data?.customerId ?? "",
    {
      cacheTime: 100,
    }
  );
  const [salesOrderStatus, setSalesOrderStatus] = useState(
    currentSalesOrder?.data?.orderStatus
      ? String(currentSalesOrder?.data?.orderStatus)
      : null
  );
  const [salesOrderPaymentStatus, setSalesOrderPaymentStatus] = useState(
    currentSalesOrder?.data?.paymentStatus
      ? String(currentSalesOrder?.data?.paymentStatus)
      : "Pending"
  );
  const [salesOrderPriority, setSalesOrderPriority] = useState(
    currentSalesOrder?.data?.priority
      ? String(currentSalesOrder?.data?.priority)
      : String(OrderPriority.No)
  );
  const [customFields, setCustomFields] = useState(
    currentSalesOrder.data?.customFields
  );
  const [checkListFields, setCheckListFields] = useState<
    Prisma.JsonValue | undefined
  >(currentSalesOrder.data?.checkList);
  const [lastUpdatedName, setLastUpdatedName] = useState(
    currentSalesOrder.data?.updatedById
  );
  const [createdName, setCreatedName] = useState(
    currentSalesOrder.data?.userId
  );
  const [openDropdown, setOpenDropdown] = useState(false);

  const [orgCurrency, setOrgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );

  const [salesOrderCurrency, setSalesOrderCurrency] = useState<string | null>(
    null
  );

  const [orderValue, setOrderValue] = useState<number | string>(0);

  const updateSalesOrder = api.salesOrder.updateSalesOrder.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.salesOrder.getOne.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.salesOrder.getOne.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.salesOrder.getOne.setData(salesOrderUid, optimisticUpdate);
      }
    },
    // TODO: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.salesOrder.getOne.invalidate();
    },
  });
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
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateSalesOrder.mutate(
      {
        salesOrderId: salesOrderUid ? salesOrderUid : "",
        poNumber: poNumber ? poNumber : null,
        invoiceNumber: invoiceNumber ? invoiceNumber : null,
        dateReceived: dateReceived ? dateReceived : null,
        dueDate: dueDate ? dueDate : null,
        notes: notes ? notes : null,
        addressOne: addressOne ? addressOne : null,
        addressTwo: addressTwo ? addressTwo : null,
        addressZip: addressZip ? addressZip : null,
        addressState: addressState ? addressState : null,
        city: city ? city : null,
        country: selectedCountry ? selectedCountry.value : null,
        customFields: customFields ? customFields : undefined,
        checkListFields: checkListFields ? checkListFields : undefined,
        orderStatus: salesOrderStatus ? salesOrderStatus : null,
        paymentStatus: salesOrderPaymentStatus ? salesOrderPaymentStatus : null,
        priority: salesOrderPriority
          ? OrderPriority[salesOrderPriority as keyof typeof OrderPriority]
          : OrderPriority.No,
        currency: salesOrderCurrency ? salesOrderCurrency : orgCurrency,
        orderValue: orderValue ? Number(orderValue) : null,
        piNumber: piNumber ? piNumber : null,
        piDate: piDate ? piDate : null,
      },
      {
        onSuccess: (data: any) => {
          if (data && data.id) {
            toast({
              title: "Sales Order updated",
            });
          } else {
            toast({
              variant: "destructive",
              title:
                "Sales Order did not update: possible duplicate PO number or other error",
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

  const LastUpdatedName =
    api.user?.getUserNameById.useQuery({ id: lastUpdatedName ?? "" }).data
      ?.name ?? "";
  const CreatedName =
    api.user?.getUserNameById.useQuery({ id: createdName ?? "" }).data?.name ??
    "";

  const updateSalesOrderVisibility =
    api.salesOrder?.updateSalesOrderVisibility.useMutation({
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.salesOrder.getOne.cancel();
        // Snapshot the previous value
        const optimisticUpdate = utils.salesOrder.getOne.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.salesOrder.getOne.setData(salesOrderUid, optimisticUpdate);
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.salesOrder.getOne.invalidate();
      },
      onSuccess: () => {
        toast({
          title: "Updated sales order visibility",
        });
      },
    });
  const updateSalesOrderPublicShare =
    api.salesOrder?.updatePublicShare.useMutation({
      onMutate: () => {
        void utils.salesOrder.getOne.cancel();
        const optimisticUpdate = utils.salesOrder.getOne.getData();
        if (optimisticUpdate) {
          utils.salesOrder.getOne.setData(salesOrderUid, optimisticUpdate);
        }
      },
      onSettled: () => {
        void utils.salesOrder.getOne.invalidate();
      },
      onSuccess: () => {
        toast({
          title: "Enabled public sales order sharing",
        });
      },
    });
  const updateFileVisibilityMutation =
    api.orderFiles?.updateFileVisibility.useMutation({
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.orderFiles.getS3UrlsForOrder.cancel();
        // Snapshot the previous value
        const optimisticUpdate = utils.orderFiles.getS3UrlsForOrder.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.orderFiles.getS3UrlsForOrder.setData(
            { salesOrderId: "" },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.orderFiles.getS3UrlsForOrder.invalidate();
      },
      onSuccess: () => {
        toast({
          title: "Updated file visibility",
        });
      },
    });
  const updateFileVisibility = (fileId: string, visibility: boolean) => {
    updateFileVisibilityMutation.mutate({
      fileId,
      visibility,
    });
  };
  const updateVisbility = (visibility: boolean) => {
    updateSalesOrderVisibility.mutate({
      salesOrderId: salesOrderUid,
      visibility,
    });
  };
  const updatePublicShare = (visibility: boolean) => {
    updateSalesOrderPublicShare.mutate({
      salesOrderId: salesOrderUid,
      visibility,
    });
  };

  const orderCustomFieldSchema =
    api.organization?.getOrganizationOrderFieldSchema.useQuery();

  const orderStatusOptions =
    api.organization?.getOrganizationOrderStatusOptions.useQuery();

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
    if (orderCustomFieldSchema.data?.orderCustomFieldSchema) {
      newJson = Object.keys(
        orderCustomFieldSchema.data.orderCustomFieldSchema
      ).reduce((obj: { [key: string]: any }, key) => {
        if (
          !orderCustomFieldSchema.data ||
          !orderCustomFieldSchema.data.orderCustomFieldSchema
        ) {
          return {};
        }
        // Grab the schema for this field
        const fieldSchema = (
          orderCustomFieldSchema.data.orderCustomFieldSchema as {
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
    setCustomerId(currentSalesOrder.data?.customerId);
    setSalesOrderStatus(currentSalesOrder.data?.orderStatus ?? null);
    setSalesOrderPaymentStatus(
      String(currentSalesOrder.data?.paymentStatus) || "Pending"
    );
    setSalesOrderPriority(
      currentSalesOrder.data?.priority ?? String(OrderPriority.No)
    );
    setPoNumber(currentSalesOrder.data?.poNumber);
    setInvoiceNumber(currentSalesOrder.data?.invoiceNumber);
    setDateReceived(currentSalesOrder.data?.dateReceived);
    setDueDate(currentSalesOrder.data?.dueDate);
    setPiNumber(currentSalesOrder.data?.piNumber);
    setPiDate(currentSalesOrder.data?.piDate);
    setNotes(currentSalesOrder.data?.notes);
    setAddressOne(currentSalesOrder.data?.addressOne);
    setAddressTwo(currentSalesOrder.data?.addressTwo);
    setAddressZip(currentSalesOrder.data?.addressZip);
    setAddressState(currentSalesOrder.data?.addressState);
    setCity(currentSalesOrder.data?.city);
    setSelectedCountry(
      currentSalesOrder.data?.country
        ? {
            label: currentSalesOrder.data?.country,
            value: currentSalesOrder.data?.country,
          }
        : null
    );
    setCustomFields(currentSalesOrder.data?.customFields ?? newJson);
    setLastUpdatedName(currentSalesOrder.data?.updatedById);
    setCreatedName(currentSalesOrder.data?.userId);
    setOrgCurrency(String(orgCurrencyData.data?.currency) || "USD");
    setSalesOrderCurrency(currentSalesOrder.data?.currency ?? null);
    setOrderValue(Number(currentSalesOrder.data?.orderValue) ?? null);
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
    setCheckListFields(currentSalesOrder.data?.checkList ?? checkListJson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSalesOrder.isLoading,
    checklistSchema.isLoading,
    orderCustomFieldSchema.isLoading,
  ]);
  const [publicSharingEnabled, setPublicSharingEnabled] = useState(
    currentSalesOrder.data?.enablePublicShare || false
  );
  const copyLinkToClipboard = () => {
    if (!publicSharingEnabled) {
      return;
    }
    const copyText = `${process.env.NEXT_PUBLIC_URL}/public_share/order/${salesOrderUid}`;
    navigator.clipboard
      .writeText(copyText)
      .then(() => {
        toast({
          title: "Copied Link",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy link",
        });
      });
  };
  useEffect(() => {
    setPublicSharingEnabled(currentSalesOrder.data?.enablePublicShare || false);
  }, [currentSalesOrder.data?.enablePublicShare]);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const aws_files_s3_file_uploader =
    api.orderFiles?.getPresignedUrlForSalesOrderFile.useMutation();

  const acceptedExtensions = [
    "pdf",
    "xls",
    "xlsx",
    "csv",
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
  const deleteOrderFile = api.orderFiles?.deleteFile.useMutation({
    onMutate: () => {
      void utils.orderFiles.getS3UrlsForOrder.cancel();
      optimisticUpdate = utils.orderFiles.getS3UrlsForOrder.getData();
      if (optimisticUpdate) {
        utils.orderFiles.getS3UrlsForOrder.setData(
          { salesOrderId: "" },
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.orderFiles.getS3UrlsForOrder.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "Order File Deleted Successfully",
      });
    },
  });
  const uploadFile = (selectedFile: File) => {
    setIsUploading(true);
    const progressInterval = startSimulatedProgress();
    aws_files_s3_file_uploader.mutate(
      {
        salesOrderId: salesOrderUid,
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
                salesOrderId: salesOrderUid,
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
              deleteOrderFile.mutate(fileId);
            }}
          >
            Delete
          </ToastAction>
        </>
      ),
    });
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
    posthog.capture("File Uploaded", {
      createdBy: sessionData ? sessionData.user.email : "could not get email",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { isDragActive, getRootProps, getInputProps } = useDropzone({
    onDrop,
  });
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (currentSalesOrder.isLoading) {
    return <Spinner />;
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Order Details • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col bg-muted/40 ">
          <HeaderNav currentPage={"orders"} />
          <main className="flex min-h-screen w-screen flex-row justify-center">
            <div className="container relative">
              <OrderNav
                currentPage={"order-details"}
                currentOrderId={salesOrderUid}
              />
              <form
                className="flex flex-col gap-4 rounded-lg bg-background"
                onSubmit={handleSubmit}
              >
                <div className="right-10 top-4 hidden flex-col items-center justify-start space-x-4 sm:absolute sm:flex sm:flex-row">
                  <div className="hidden flex-row justify-between sm:flex">
                    {currentSalesOrder.data?.createdFromRfqId ? (
                      <Badge variant="outline" className="bg-background">
                        <Link
                          href={
                            "/quote-details/" +
                            currentSalesOrder.data?.createdFromRfqId
                          }
                        >
                          Created from Quote
                        </Link>
                      </Badge>
                    ) : null}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Last modified by{" "}
                    {currentSalesOrder.data?.updatedById
                      ? currentSalesOrder.data?.updatedById ==
                        sessionData?.user.id
                        ? "You"
                        : LastUpdatedName
                      : CreatedName}{" "}
                    on{" "}
                    {format(
                      currentSalesOrder.data?.updatedAt ?? new Date(),
                      "PPp"
                    )}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="hidden sm:flex">
                        Actions
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="" align="start">
                      {isAdminOrHigher && (
                        <DropdownMenuItem className="flex items-center justify-between gap-2">
                          Display on customer portal
                          <Switch
                            onCheckedChange={(visibility) => {
                              updateVisbility(visibility);
                            }}
                            checked={currentSalesOrder.data?.visibleToCustomer}
                          />
                        </DropdownMenuItem>
                      )}
                      {isAdminOrHigher && <DropdownMenuSeparator />}
                      <DropdownMenuItem>
                        <Link
                          className="flex w-full items-center justify-between"
                          href={`/sales_order_preview/${salesOrderUid}`}
                          target="_blank"
                        >
                          Preview as customer
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </DropdownMenuItem>
                      {isAdminOrHigher && <DropdownMenuSeparator />}
                      {isAdminOrHigher && (
                        <DropdownMenuItem className="flex items-center justify-between">
                          Enable Public Sharing
                          <Switch
                            onCheckedChange={(visibility) => {
                              updatePublicShare(visibility);
                              setPublicSharingEnabled(visibility);
                            }}
                            checked={currentSalesOrder.data?.enablePublicShare}
                          />
                        </DropdownMenuItem>
                      )}
                      {isAdminOrHigher && <DropdownMenuSeparator />}
                      <div className="p-2">
                        <Button
                          variant="outline"
                          onClick={copyLinkToClipboard}
                          disabled={!publicSharingEnabled}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {publicSharingEnabled && "Copy Public Share link"}
                        </Button>
                        {!publicSharingEnabled && (
                          <span className="text-gray-500">
                            {" "}
                            Enable Public Sharing to Copy Link
                          </span>
                        )}
                      </div>
                      {isAdminOrHigher && <DropdownMenuSeparator />}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button type="submit">Save</Button>
                </div>
                <Card className="grid flex-col p-8 ">
                  <div className="grid sm:grid-cols-3">
                    <div className="col-span-3 grid w-full grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="poNumber">PO Number</Label>
                        <Input
                          type="text"
                          placeholder="PO Number"
                          className="mb-2 sm:max-w-[240px]"
                          value={poNumber ? poNumber : undefined}
                          onChange={(event) => setPoNumber(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="date">PO Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal sm:max-w-[240px]",
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
                      <div>
                        <Label htmlFor="poNumber">PI Number</Label>
                        <Input
                          type="text"
                          placeholder="PI Number"
                          className="sm:max-w-[240px]"
                          value={piNumber ? piNumber : undefined}
                          onChange={(event) => setPiNumber(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="date">PI Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal sm:max-w-[240px]",
                                !piDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {piDate ? (
                                format(piDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={piDate ?? undefined}
                              onSelect={setPiDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {isKtex ? null : (
                        <>
                          <div>
                            <Label htmlFor="name">Status</Label>
                            <Select onValueChange={setSalesOrderStatus}>
                              <SelectTrigger className="sm:max-w-[240px]">
                                <SelectValue>{salesOrderStatus}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {orderStatusOptions.data?.orderStatusOptions?.map(
                                  (statusOption) => (
                                    <SelectItem
                                      key={statusOption}
                                      value={statusOption}
                                    >
                                      {statusOption}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Order priority</Label>
                            <Select onValueChange={setSalesOrderPriority}>
                              <SelectTrigger className="sm:max-w-[240px]">
                                <SelectValue>
                                  {salesOrderPriority === OrderPriority.No ? (
                                    <>
                                      <CircleDashed className="mr-2 inline-block h-4 w-4" />{" "}
                                      No Priority
                                    </>
                                  ) : salesOrderPriority ===
                                    OrderPriority.Urgent ? (
                                    <>
                                      <AlertCircle className="mr-2 inline-block h-4 w-4" />{" "}
                                      Urgent
                                    </>
                                  ) : salesOrderPriority ===
                                    OrderPriority.Low ? (
                                    <>
                                      <SignalLow className="mr-2 inline-block h-4 w-4" />{" "}
                                      Low
                                    </>
                                  ) : salesOrderPriority ===
                                    OrderPriority.Medium ? (
                                    <>
                                      <SignalMedium className="mr-2 inline-block h-4 w-4" />{" "}
                                      Medium
                                    </>
                                  ) : salesOrderPriority ===
                                    OrderPriority.High ? (
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
                                <SelectItem value={OrderPriority.No}>
                                  <CircleDashed className="mr-2 inline-block h-4 w-4	" />
                                  No
                                </SelectItem>
                                <SelectItem value={OrderPriority.Urgent}>
                                  <AlertCircle className="mr-2 inline-block h-4 w-4	" />
                                  Urgent
                                </SelectItem>
                                <SelectItem value={OrderPriority.Low}>
                                  <SignalLow className="mr-2 inline-block h-4 w-4	" />
                                  Low
                                </SelectItem>
                                <SelectItem value={OrderPriority.Medium}>
                                  <SignalMedium className="mr-2 inline-block h-4 w-4	" />
                                  Medium
                                </SelectItem>
                                <SelectItem value={OrderPriority.High}>
                                  <SignalHigh className="mr-2 inline-block h-4 w-4	" />
                                  High
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      <div>
                        <Label htmlFor="name">Payment Status</Label>
                        <Select
                          onValueChange={(value) => {
                            setSalesOrderPaymentStatus(value);
                          }}
                        >
                          <SelectTrigger className="sm:max-w-[240px]">
                            <SelectValue>
                              {salesOrderPaymentStatus === "Completed"
                                ? "Completed"
                                : "Pending"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="orderValue">Order Value</Label>
                        <Input
                          id="orderValue"
                          pattern="^\d*(\.\d{0,4})?$"
                          placeholder="Order Value"
                          className="mt-0.5 sm:max-w-[240px]"
                          value={orderValue.toString()}
                          onChange={(e) => {
                            setOrderValue(e.target.value);
                          }}
                        />
                      </div>
                      <div className="grid w-full grid-cols-4 gap-2.5 sm:max-w-[240px]">
                        <Label
                          htmlFor="salesOrderCurrency"
                          className="col-span-4"
                        >
                          Order Currency
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
                                currentSalesOrder.data?.currency
                                  ? "col-span-3 mr-2"
                                  : "col-span-4"
                              )}
                            >
                              <span>
                                {getCurrencySymbol(
                                  salesOrderCurrency
                                    ? salesOrderCurrency
                                    : orgCurrency
                                )}
                              </span>
                              {salesOrderCurrency
                                ? salesOrderCurrency
                                : orgCurrency}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className={cn(
                              "p-0",
                              salesOrderCurrency
                                ? "sm:max-w-[180px]"
                                : "sm:max-w-[240px]"
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
                                        setSalesOrderCurrency(
                                          currency.shortName
                                        );
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
                        {currentSalesOrder.data?.currency && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  type="button"
                                  onClick={() => setSalesOrderCurrency(null)}
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
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input
                          type="text"
                          placeholder="Invoice Number"
                          className="sm:max-w-[240px]"
                          value={invoiceNumber ? invoiceNumber : undefined}
                          onChange={(event) =>
                            setInvoiceNumber(event.target.value)
                          }
                        />
                      </div>
                      <div className="mt-1 grid gap-3 lg:mt-0 lg:gap-0">
                        <Label htmlFor="date">
                          {isKtex ? "B/L Date" : "Due Date"}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal sm:max-w-[240px]",
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
                  </div>
                  <Separator className="my-4" />
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <Button
                        className="flex w-64 justify-between"
                        variant="secondary"
                      >
                        Address
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="col-span-2 mt-4 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              Select Company Address
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {companyAddresses.data?.companyAddresses?.map(
                              (companyAddress: CompanyAddress) => (
                                <DropdownMenuItem
                                  key={companyAddress.id}
                                  className="mb-4 flex w-64 justify-between rounded-lg border p-4"
                                  onClick={() =>
                                    handleAddressSelection(companyAddress)
                                  }
                                >
                                  <div>
                                    {companyAddress.isBillingAddress &&
                                    companyAddress.isShippingAddress ? (
                                      <p>Billing and Shipping Address</p>
                                    ) : companyAddress.isBillingAddress ? (
                                      <p>Billing Address</p>
                                    ) : companyAddress.isShippingAddress ? (
                                      <p>Shipping Address</p>
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
                          className="sm:max-w-[240px]"
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
                          className="sm:max-w-[240px]"
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
                          className="sm:max-w-[240px]"
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          type="text"
                          placeholder="State"
                          value={addressState ? addressState : undefined}
                          className="sm:max-w-[240px]"
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
                          className="sm:max-w-[240px]"
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
                              className="justify-between sm:max-w-[240px]"
                            >
                              {selectedCountry
                                ? countries.find(
                                    (country) =>
                                      country.value === selectedCountry.value
                                  )?.label
                                : "Select country..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 sm:max-w-[240px]">
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
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="flex flex-col">
                    {customFields &&
                      typeof customFields === "object" &&
                      orderCustomFieldSchema.data?.orderCustomFieldSchema &&
                      typeof orderCustomFieldSchema.data
                        ?.orderCustomFieldSchema === "object" &&
                      Object.entries(
                        orderCustomFieldSchema.data?.orderCustomFieldSchema
                      ).map(([group, groupFields]) => (
                        <Collapsible key={group} defaultOpen={false}>
                          <div className="flex flex-col">
                            <Separator className="my-4" />
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="secondary"
                                className="flex w-64 justify-between"
                              >
                                {group}
                                <ChevronsUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="col-span-2 mt-4 grid grid-cols-2 gap-8 lg:grid-cols-4">
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
                                            className="justify-between sm:max-w-[240px]"
                                          >
                                            {(customFields as any)[label] ||
                                              `Select ${label}...`}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 sm:max-w-[240px]">
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
                                              "justify-start text-left font-normal sm:max-w-[240px]",
                                              !(customFields as any)[label] &&
                                                "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {(customFields as any)[label] ? (
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
                                        className="sm:max-w-[240px]"
                                      />
                                    </>
                                  )}
                                </div>
                              )
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                  </div>
                  <Separator className="my-4" />
                  <Collapsible defaultOpen={true}>
                    <CollapsibleTrigger asChild>
                      <Button
                        className="flex w-64 justify-between"
                        variant="secondary"
                      >
                        Files
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-4 flex flex-col gap-4">
                        <section className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-background hover:bg-background/90 ">
                          <div
                            {...getRootProps()}
                            className={`flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 hover:bg-foreground/5  ${
                              isDragActive ? "border-blue-500" : ""
                            }`}
                          >
                            <input {...getInputProps()} />
                            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                            <p className="mb-2 text-sm text-zinc-700">
                              Click or drag and drop to upload a file
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
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>File name</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderFilesS3Urls.data
                              ? orderFilesS3Urls.data?.map(
                                  (s3UrlObject: any) => {
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
                                          <div className="flex items-center gap-4">
                                            <p>{s3UrlObject.humanFileName}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {s3UrlObject.visibleToCustomer ? (
                                            <Badge
                                              variant="secondary"
                                              className="bg-blue-100 text-blue-800"
                                            >
                                              Visible on customer portal
                                            </Badge>
                                          ) : null}
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
                                              {isAdminOrHigher && (
                                                <DropdownMenuItem>
                                                  <div className="flex w-full justify-between">
                                                    <div className="flex items-center">
                                                      <Eye className="mr-2 h-4 w-4" />
                                                      <span>
                                                        Display on customer
                                                        portal
                                                      </span>
                                                    </div>
                                                    <Switch
                                                      onCheckedChange={(
                                                        visibility
                                                      ) => {
                                                        updateFileVisibility(
                                                          s3UrlObject.fileId,
                                                          visibility
                                                        );
                                                      }}
                                                      checked={
                                                        s3UrlObject.visibleToCustomer
                                                      }
                                                    />
                                                  </div>
                                                </DropdownMenuItem>
                                              )}
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
                                  }
                                )
                              : null}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="h-fit w-full rounded-lg">
                        {viewerUrl ? (
                          <div className="h-screen pt-8">
                            <FileViewer viewerUrl={viewerUrl} />
                          </div>
                        ) : (
                          <div className="flex w-full flex-col items-center justify-center"></div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
                {/*email.data?.emailText && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3">
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
                            )*/}
              </form>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default SalesOrder;

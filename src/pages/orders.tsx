import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { type SalesOrder } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Building,
  CalendarIcon,
  ChevronsUpDown,
  FilePlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { DataTableColumnHeader } from "~/components/DataTableColumnHeader";
import Layout from "~/components/Layout";
import { SalesOrderDataTable } from "~/components/SalesOrderDataTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Card } from "~/components/ui/card";
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
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils";
import { api } from "~/utils/api";

const Orders: NextPage = () => {
  const { toast } = useToast();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { data: salesOrders } = api.salesOrder?.getSalesOrders.useQuery();
  const customerList = api.customer?.getCustomers.useQuery();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const inputFile = useRef<HTMLInputElement | null>(null);

  interface CustomerOption {
    value: string;
    label: string;
  }

  const [customerOption, setCustomerOption] = useState<CustomerOption | null>();
  const myCustomerOptions: CustomerOption[] =
    customerList.data?.map((customer) => {
      return {
        value: customer.id,
        label: customer.companyName,
      };
    }) ?? [];

  const [openNewSalesOrderModal, setOpenNewSalesOrderModal] = useState(false);
  const handleCloseSalesOrderModal = () => {
    setOpenNewSalesOrderModal(false);
    setCustomerOption(null);
  };
  const [openNewCustomerModal, setOpenNewCustomerModal] = useState(false);
  const handleCloseCustomerModal = () => setOpenNewCustomerModal(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [dateReceived, setDateReceived] = useState<Date>();
  const createCustomer = api.customer.createCustomer.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.customer.getCustomers.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.customer.getCustomers.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.customer.getCustomers.setData(undefined, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.customer.getCustomers.invalidate();
    },
  });
  let updatedData: SalesOrder[] = [];
  if (salesOrders) {
    updatedData = salesOrders.map((salesOrder) => {
      const customerName = getCustomerNameById(salesOrder.customerId);
      return { ...salesOrder, customerId: customerName ?? "" };
    });
  }
  function getCustomerNameById(customerId: string): string | undefined {
    if (customerList.data && customerId) {
      const customer = customerList.data.find((c) => c.id === customerId);
      return customer ? customer.companyName : undefined;
    }
  }
  const [openPopover, setOpenPopover] = useState(false);
  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => {
        const url = `/order-details/${row.original.id}`;
        return (
          <Link className="text-muted-foreground" href={url}>
            {row.original.invoiceNumber ? row.original.invoiceNumber : ""}
          </Link>
        );
      },
    },
    {
      accessorKey: "customerId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company name" />
      ),
      cell: ({ row }) => {
        const customerName = row.original.customerId;
        const url = `/order-details/${row.original.id}`;
        return (
          <Link className="font-medium" href={url}>
            {customerName}
          </Link>
        );
      },
    },
    {
      accessorKey: "poNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer PO" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">
            {row.original.poNumber ? row.original.poNumber : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "dateReceived",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date Received" />
      ),
      cell: ({ row }) => {
        const dateReceived = row.original.dateReceived?.toLocaleDateString(
          "en-US",
          { month: "numeric", day: "numeric", year: "2-digit" }
        );
        const timeReceived = row.original.dateReceived?.toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" }
        );
        const url = `/order-details/${row.original.id}`;
        return (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link className="text-muted-foreground" href={url}>
                    <span>{dateReceived}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {timeReceived}
                    {" - "}
                    {dateReceived}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        );
      },
    },
    {
      accessorKey: "piNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PI Number" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">
            {row.original.piNumber ? row.original.piNumber : null}
          </span>
        );
      },
    },
    {
      accessorKey: "piDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PI Date" />
      ),
      cell: ({ row }) => {
        const piDate = row.original.piDate?.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "2-digit",
        });
        const url = `/order-details/${row.original.id}`;
        return (
          <Link className="text-muted-foreground" href={url}>
            <span>{piDate ? piDate : null}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate?.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        });
        const url = `/order-details/${row.original.id}`;
        return (
          <Link className="text-muted-foreground" href={url}>
            <span>{dueDate ? dueDate : null}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "orderFile",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Files Uploaded" />
      ),
      cell: ({ row }) => {
        const orderFilesS3Urls = api.orderFiles.getS3UrlsForOrder.useQuery({
          salesOrderId: row.original.id,
        });
        if (orderFilesS3Urls.data && orderFilesS3Urls.data.length > 0) {
          return <Badge variant={"success"}>Uploaded</Badge>;
        }
        return <div></div>;
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex items-end justify-end">
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
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full cursor-pointer items-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete record
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Your sales order{" "}
                        <span className="font-bold">
                          {row.original.poNumber
                            ? "#" + row.original.poNumber
                            : ""}
                        </span>{" "}
                        with{" "}
                        <span className="font-bold">
                          {row.original.customerId}
                        </span>{" "}
                        will be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => softDelete(row.original.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
  const createSalesOrder = api.salesOrder.createSalesOrder.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.salesOrder.getSalesOrders.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.salesOrder.getSalesOrders.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.salesOrder.getSalesOrders.setData(undefined, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.salesOrder.getSalesOrders.invalidate();
    },
  });
  const handleSubmitSalesOrder = (e: React.SyntheticEvent) => {
    // setOpenNewSalesOrderModal(false);
    // setCreateSalesOrderLoading(true);
    e.preventDefault();
    if (customerOption) {
      createSalesOrder.mutate(
        {
          customerId: customerOption.value,
          poNumber: null,
          city: null,
          country: null,
          piNumber: null,
          currency: null,
          orderValue: null,
          dateReceived: dateReceived ?? new Date(),
          dueDate: null,
          notes: null,
        },
        {
          onSuccess: (data: unknown) => {
            handleCloseSalesOrderModal();
            toast({
              title: "Created new sales order",
            });
            posthog.capture("Sales Order Created", {
              createdBy: session ? session.user.email : "could not get email",
            });
            if (data) {
              void router.push(`/order-details/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };
  const handleSubmitCustomer = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (companyName) {
      createCustomer.mutate(
        {
          companyName: companyName,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              setCustomerOption({
                label: (data as { companyName: string }).companyName,
                value: (data as { id: string }).id,
              });
              handleCloseCustomerModal();
            }
          },
        }
      );
    }
  };
  const deleteSalesOrder = api.salesOrder?.deleteSalesOrder.useMutation({
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.salesOrder.getSalesOrders.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.salesOrder.getSalesOrders.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.salesOrder.getSalesOrders.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.salesOrder?.getSalesOrders.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "Order deleted successfully",
      });
    },
  });

  const softDelete = (id: string) => {
    deleteSalesOrder.mutate(id);
  };
  const put_aws_file_s3_url_in_db =
    api.aiFiles?.putSalesOrderFileInDb.useMutation({
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
  function getAfterLastDot(str: string): string {
    const lastDotIndex = str.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No dot found in the string
      return "";
    }
    return str.substring(lastDotIndex + 1);
  }
  const acceptedExtensions = ["pdf"];
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
    api.aiFiles?.getPresignedUrlForAiFile.useMutation();

  const uploadFile = (selectedFile: File) => {
    setIsUploading(true);
    const progressInterval = startSimulatedProgress();
    aws_files_s3_file_uploader.mutate(
      {
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
                fileKey: data.fileKey,
                humanFileName: selectedFile.name,
              });
              clearInterval(progressInterval);
              setIsUploading(false);
              setUploadProgress(100);
              // toast({
              //   title: "File Upload Successful",
              //   description: "Your file has been successfully uploaded.",
              // });
              await router.push(`/ai-file/${data.fileKey}`);
            }
          }
        },
      }
    );
    if (inputFile.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      inputFile.current.value = "";
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const onDrop = useCallback((acceptedFiles: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const ext = getAfterLastDot(acceptedFiles[0].name).toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!acceptedExtensions.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid file type",
      });
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
      <Layout headerTitle="Orders • Afterquote" currentPage="orders">
        <div className="flex flex-col justify-between sm:flex-row">
          <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          <Dialog
            open={openNewSalesOrderModal}
            onOpenChange={setOpenNewSalesOrderModal}
          >
            <DialogTrigger asChild>
              <Button>Add Order</Button>
            </DialogTrigger>
            <DialogContent className="sm:min-w-[500px]">
              <form onSubmit={handleSubmitSalesOrder}>
                <DialogHeader>
                  <DialogTitle>New Sales Order</DialogTitle>
                  <DialogDescription>
                    Upload a PO (Purchase Order) PDF file
                  </DialogDescription>
                </DialogHeader>
                <section className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-background p-4 hover:bg-background/90 ">
                  <div
                    {...getRootProps()}
                    className={`flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 hover:bg-foreground/5  ${
                      isDragActive ? "border-blue-500" : ""
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Sparkles className="mb-2 h-6 w-6 text-muted-foreground" />
                    {/* <Sparkles /> */}
                    <p className="mb-2 text-sm font-semibold text-primary/50">
                      Drag and drop your PO here to create an order with AI.
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
                <Separator className="my-8" />
                <DialogDescription>
                  Or select a customer and click create when you&apos;re done.
                </DialogDescription>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center gap-4 py-4">
                    {customerList?.data && customerOption ? (
                      <div className="flex w-full justify-between">
                        <div>
                          Customer:{" "}
                          <span className="text-lg font-semibold">
                            {getCustomerNameById(customerOption.value)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={"ghost"}
                          onClick={() => setCustomerOption(null)}
                        >
                          Change
                          <Pencil className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Popover
                          open={openPopover}
                          onOpenChange={setOpenPopover}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openPopover}
                              className="w-[200px] justify-between"
                            >
                              Select customer
                              <Building className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Search customers" />
                              <ScrollArea className="h-96">
                                <CommandEmpty>No Account found.</CommandEmpty>
                                <CommandGroup>
                                  {myCustomerOptions.map((customer) => (
                                    <CommandItem
                                      id="searched-customer"
                                      key={customer.value}
                                      onSelect={() => {
                                        setCustomerOption(customer);
                                      }}
                                    >
                                      {customer.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </ScrollArea>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <span className="text-muted-foreground">or</span>
                        <div>
                          <Dialog
                            open={openNewCustomerModal}
                            onOpenChange={setOpenNewCustomerModal}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant={"outline"}
                                className="w-[200px] justify-between"
                              >
                                New customer
                                <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>New Customer</DialogTitle>
                                <DialogDescription>
                                  Add the customer&apos;s information. Click
                                  Save when you&apos;re done.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitCustomer}>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-3 items-center gap-4">
                                    <Label
                                      htmlFor="name"
                                      className="text-right"
                                    >
                                      Company Name
                                    </Label>
                                    <Input
                                      id="name"
                                      placeholder="Acme Inc."
                                      className="col-span-2"
                                      onChange={(event) =>
                                        setCompanyName(event.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button id="create-new-btn" type="submit">
                                    Create
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"ghost"}
                        className={cn(
                          "w-fit justify-start text-left font-normal",
                          !dateReceived && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateReceived ? (
                          format(dateReceived, "PPP")
                        ) : (
                          <span>Date Received</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateReceived}
                        onSelect={setDateReceived}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="sm:px-none mt-4">
          {salesOrders === undefined || salesOrders.length === 0 ? (
            <Card className="mt-4 flex h-80 items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-primary-foreground p-4">
                  <FilePlus className="h-[2rem] w-[2rem] text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-medium">
                    Hey it looks like you have no Orders yet!
                  </h2>
                  <p>Click the button above to create an Order</p>
                </div>
              </div>
            </Card>
          ) : (
            <SalesOrderDataTable columns={columns} data={updatedData} />
          )}
        </div>
      </Layout>
    );
  }
  return <Spinner />;
};

export default Orders;

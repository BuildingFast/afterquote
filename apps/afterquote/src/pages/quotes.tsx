import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { RfqStatus, type Rfq } from "@prisma/client";
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
  Trash2,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import Layout from "~/components/Layout";
import { QuoteDatatable } from "~/components/QuoteDataTable";
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
import { ScrollArea } from "~/components/ui/scroll-area";
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

const Quotes: NextPage = () => {
  const { toast } = useToast();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { data: quote } = api.rfq?.getRfqs.useQuery();
  const customerList = api.customer?.getCustomers.useQuery();
  const userRole = api.user?.getUserRole.useQuery();
  const isAdminOrHigher =
    userRole.data?.role === "ADMIN" || userRole.data?.role === "OWNER"
      ? true
      : false;
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

  const [openNewQuoteModal, setOpenNewQuoteModal] = useState(false);
  const handleCloseQuoteModal = () => {
    setOpenNewQuoteModal(false);
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
  let updatedData: Rfq[] = [];
  if (quote) {
    updatedData = quote.map((quote) => {
      const customerName = getCustomerNameById(quote.customerId);
      return { ...quote, customerId: customerName ?? "" };
    });
  }
  function getCustomerNameById(customerId: string): string | undefined {
    if (customerList.data && customerId) {
      const customer = customerList.data.find((c) => c.id === customerId);
      return customer ? customer.companyName : undefined;
    }
  }
  const [open, setOpen] = useState(false);
  const columns: ColumnDef<Rfq>[] = [
    {
      accessorKey: "rfqNumber",
      header: "Quote",
      cell: ({ row }) => {
        const url = `/quote-details/${row.original.id}`;
        return (
          <Link className="text-muted-foreground" href={url}>
            {row.original.rfqNumber ? row.original.rfqNumber : "-"}
          </Link>
        );
      },
    },
    {
      accessorKey: "customerId",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company name
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const customerName = row.original.customerId;
        const url = `/quote-details/${row.original.id}`;
        return (
          <Link className="font-medium underline-offset-2" href={url}>
            {customerName}
          </Link>
        );
      },
    },
    {
      accessorKey: "dateReceived",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Received
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateReceived = row.original.dateReceived?.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "2-digit" }
        );
        const timeReceived = row.original.dateReceived?.toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" }
        );
        const url = `/quote-details/${row.original.id}`;
        return (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link className="text-muted-foreground" href={url}>
                    {dateReceived}
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
      accessorKey: "dueDate",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dueDate = row.original.dueDate?.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        });
        const url = `/quote-details/${row.original.id}`;
        return (
          <>
            <Link href={url}>
              <span>{dueDate ? dueDate : ""}</span>
            </Link>
          </>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const url = `/quote-details/${row.original.id}`;
        return (
          <Link href={url}>
            {row.original.status === RfqStatus.BACKLOG ? (
              <Badge variant="outline">📝 Backlog </Badge>
            ) : row.original.status === RfqStatus.PROGRESS ? (
              <Badge variant="outline">🚧 Progress</Badge>
            ) : row.original.status === RfqStatus.HOLD ? (
              <Badge variant="outline">📁 Hold</Badge>
            ) : row.original.status === RfqStatus.ORDERPLACED ? (
              <Badge variant="outline">🔔 Order Placed</Badge>
            ) : (
              <Badge variant="outline">✅ Quote Sent</Badge>
            )}
          </Link>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        if (isAdminOrHigher) {
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
                          This action cannot be undone. Your Quote{" "}
                          <span className="font-bold">
                            #
                            {row.original.rfqNumber
                              ? row.original.rfqNumber
                              : "-"}
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
        }
        return null;
      },
    },
  ];
  const createRfq = api.rfq.createRfq.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.rfq.getRfqs.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.rfq.getRfqs.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.rfq.getRfqs.setData(undefined, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.rfq.getRfqs.invalidate();
    },
  });
  const handleSubmitRfq = (e: React.SyntheticEvent) => {
    // setOpenNewRfqModal(false);
    // setCreateRfqLoading(true);
    e.preventDefault();
    if (customerOption) {
      createRfq.mutate(
        {
          customerId: customerOption.value,
          rfqNumber: null,
          companyEmail: null,
          city: null,
          country: null,
          dateReceived: dateReceived ?? new Date(),
          dueDate: null,
          responseDate: null,
          notes: null,
        },
        {
          onSuccess: (data: unknown) => {
            handleCloseQuoteModal();
            toast({
              title: "Created new draft quote",
            });
            posthog.capture("Quote Created", {
              createdBy: session ? session.user.email : "could not get email",
            });
            if (data) {
              void router.push(`/quote-details/${(data as { id: string }).id}`);
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
  const deleteRfq = api.rfq?.deleteRfq.useMutation({
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.rfq.getRfqs.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.rfq.getRfqs.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.rfq.getRfqs.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.rfq?.getRfqs.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "RFQ Deleted Successfully",
      });
    },
  });

  const softDelete = (id: string) => {
    deleteRfq.mutate(id);
  };
  const isKtex = useFeatureIsOn("is-ktex");
  const isFactoryFloor = useFeatureIsOn("is-factory-floor");
  if (isKtex) {
    void router.push("/orders");
  }
  if (isFactoryFloor) {
    void router.push("/rejection_tracking");
  }
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout headerTitle="Dashboard • Afterquote" currentPage="quotes">
        <div className="flex flex-col justify-between sm:flex-row">
          <h1 className="text-xl font-semibold tracking-tight">Quotes</h1>
          <Dialog open={openNewQuoteModal} onOpenChange={setOpenNewQuoteModal}>
            <DialogTrigger asChild>
              <Button>Add Quote</Button>
            </DialogTrigger>
            <DialogContent className="min-w-[500px]">
              <form onSubmit={handleSubmitRfq}>
                <DialogHeader>
                  <DialogTitle>New Quote</DialogTitle>
                  <DialogDescription>
                    Select a customer and click create when you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
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
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
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
                                        setOpen(false);
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
        <div className="sm:px-none w-full">
          {quote === undefined || quote.length === 0 ? (
            <Card className="mt-4 flex h-80 items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-primary-foreground p-4">
                  <FilePlus className="h-[2rem] w-[2rem] text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-medium">
                    Hey it looks like you have no Quotes yet!
                  </h2>
                  <p>Click the button above to create a Quote</p>
                </div>
              </div>
            </Card>
          ) : (
            <QuoteDatatable columns={columns} data={updatedData} />
          )}
        </div>
      </Layout>
    );
  }
  return <Spinner />;
};

export default Quotes;

import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { format } from "date-fns";
import { Building, CalendarIcon, Pencil, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderNav from "~/components/HeaderNav";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/utils";
import { api } from "~/utils/api";
import { currencies, getCurrencySymbol } from "~/utils/getCurrency";

function Loading() {
  return (
    <div className="relative w-full overflow-hidden rounded-lg p-4 shadow hover:shadow-md">
      <div className="flex animate-pulse space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiFile() {
  const isKtex = useFeatureIsOn("is-ktex");
  const { status } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  let optimisticUpdate = null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const aiFilesS3Url = api.aiFiles.getS3UrlForFile.useQuery({
    fileName: String(router.query.uid),
  });

  interface CustomerOption {
    value: string;
    label: string;
  }

  interface OrderItem {
    id: number;
    name: string;
    description: string;
    quantity: number;
    price: number;
  }

  const [aiResponse, setAiResponse] = useState<object>();
  const [openNewCustomerModal, setOpenNewCustomerModal] = useState(false);
  const handleCloseCustomerModal = () => setOpenNewCustomerModal(false);
  const [customerOption, setCustomerOption] = useState<CustomerOption | null>();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [piNumber, setPiNumber] = useState<string | null>();
  const [poNumber, setPoNumber] = useState<string | null>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [piDate, setPiDate] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [dateReceived, setDateReceived] = useState<any>();
  const [orderValue, setOrderValue] = useState<number>(0);
  const [openDropdown, setOpenDropdown] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [dueDate, setDueDate] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [invoiceNumber, setInvoiceNumber] = useState<any>();
  const [salesOrderCurrency, setSalesOrderCurrency] = useState<string | null>();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const [orgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );

  const customerList = api.customer?.getCustomers.useQuery();
  const myCustomerOptions: CustomerOption[] =
    customerList.data?.map((customer) => {
      return {
        value: customer.id,
        label: customer.companyName,
      };
    }) ?? [];
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const getGptResponse =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    api.aiFiles.getPdfArrayGptResponseForOrderFile.useMutation({});
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const viewerUrl = aiFilesS3Url.data?.s3Url;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const updateFileSalesOrderId =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    api.aiFiles.setSalesOrderIdForAiFile.useMutation();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const bulkCreateSalesOrderItems =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    api.aiFiles.bulkCreateSalesOrderItems.useMutation();

  function getCustomerNameById(customerId: string): string | undefined {
    if (customerList.data && customerId) {
      const customer = customerList.data.find((c) => c.id === customerId);
      return customer ? customer.companyName : undefined;
    }
  }
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (aiFilesS3Url.data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, react-hooks/exhaustive-deps
      getGptResponse.mutate(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        { pdfArray: String(aiFilesS3Url.data?.awsPdfArray) },
        {
          onSuccess: (data) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            setAiResponse(data);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            setOrderItems(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
              data.order_items.map((item: any, index: number) => ({
                ...item,
                id: index + 1, // You can adjust this logic based on your requirements
              }))
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.total_amount) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              setOrderValue(data.total_amount);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              setSalesOrderCurrency(data.currency_code);
            }
            if (
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              data.purchase_order_number &&
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              data.purchase_order_number !== ""
            ) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              setPoNumber(data.purchase_order_number);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.invoice_number && data.invoice_number !== "") {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              setPiNumber(data.invoice_number);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.purchase_order_date) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              const parts = data?.purchase_order_date?.split("-");
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (parts.length > 1) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                const year = parseInt(parts[0], 10);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                const month = parseInt(parts[1], 10) - 1;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                const day = parseInt(parts[2], 10);
                const tmp = new Date(year, month, day);
                setDateReceived(tmp);
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.invoice_date) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              const parts = data.invoice_date.split("-");
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (parts.length > 1) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                const year = parseInt(parts[0], 10);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                const month = parseInt(parts[1], 10) - 1;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                const day = parseInt(parts[2], 10);
                const tmp = new Date(year, month, day);
                setPiDate(tmp);
              }
            }
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, @typescript-eslint/no-unsafe-member-access
  }, [aiFilesS3Url.isLoading]);

  const createSalesOrder = api.salesOrder.createSalesOrder.useMutation({
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
    // Always refetch after error or success:
    onSettled: () => {
      void utils.salesOrder.getSalesOrders.invalidate();
    },
  });
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

  const handleSubmitSalesOrder = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (customerOption) {
      createSalesOrder.mutate(
        {
          customerId: customerOption.value,
          poNumber: poNumber ? String(poNumber) : null,
          piNumber: piNumber ? String(piNumber) : null,
          currency: salesOrderCurrency ? salesOrderCurrency : orgCurrency,
          orderValue: orderValue ? orderValue : 0,
          city: null,
          country: null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          dateReceived: dateReceived ? dateReceived : new Date(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          dueDate: dueDate ? dueDate : null,
          notes: null,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              // TODO: Set file sales order id to data.id
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              updateFileSalesOrderId.mutate(
                {
                  fileId: router.query.uid as string,
                  salesOrderId: (data as { id: string }).id,
                },
                {
                  onSuccess: () => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    bulkCreateSalesOrderItems.mutate({
                      salesOrderId: (data as { id: string }).id,
                      salesOrderItems: orderItems,
                    });
                    void router.push(
                      `/order-details/${(data as { id: string }).id}`
                    );
                  },
                }
              );
            }
          },
        }
      );
    }
  };
  const updateOrderItemValue = (
    orderItemId: number,
    newValue: { fieldName: string; fieldValue: string | number }
  ) => {
    // Create a new array with the modified object
    console.log("Yeet", orderItems);
    const updatedOrderItems = orderItems.map((item) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      item.id === orderItemId
        ? { ...item, [newValue.fieldName]: newValue.fieldValue }
        : item
    );
    // Update the state with the new array
    setOrderItems(updatedOrderItems);
  };

  if (status === "authenticated") {
    return (
      <div>
        <HeaderNav currentPage={"orders"} />
        <div className="grid h-screen w-screen grid-cols-2">
          <div className="rounded-lg p-2 shadow-sm">
            {viewerUrl ? (
              <iframe
                src={
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  viewerUrl
                }
                title="File Preview"
                className="h-full w-full "
                height={500}
              />
            ) : (
              <Loading />
            )}
          </div>
          <div>
            {aiResponse ? (
              <>
                <div className="mt-4 text-xl">
                  <span className="font-semibold">Step 1:</span> Select the
                  customer name
                </div>
                <form onSubmit={handleSubmitSalesOrder}>
                  <div className="flex flex-col gap-4">
                    {customerList?.data && customerOption ? (
                      <div className="flex w-96 justify-between border">
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
                      <div className="flex items-center gap-2 ">
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
                                Add the customer&apos;s information. Click Save
                                when you&apos;re done.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmitCustomer}>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <Label htmlFor="name" className="text-right">
                                    Company Name
                                  </Label>
                                  <Input
                                    id="name"
                                    placeholder="Acme Inc."
                                    className="col-span-2"
                                    onChange={(event) =>
                                      setCompanyName(String(event.target.value))
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
                    )}
                    <Separator className="my-2" />
                    <div className="text-xl">
                      <span className="font-semibold">Step 2:</span> Confirm
                      order details
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 ">
                      <div>
                        <Label htmlFor="poNumber">PI Number</Label>
                        <Input
                          type="text"
                          placeholder="PI Number"
                          className="sm:max-w-[240px]"
                          value={piNumber ? piNumber : undefined}
                          onChange={(event) =>
                            setPiNumber(String(event.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="poNumber">Customer PO Number</Label>
                        <Input
                          type="text"
                          placeholder="PO Number"
                          className="mb-2 sm:max-w-[240px]"
                          value={poNumber ? poNumber : undefined}
                          onChange={(event) =>
                            setPoNumber(String(event.target.value))
                          }
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
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                format(piDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                piDate ?? undefined
                              }
                              onSelect={setPiDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="date">PO Date Received</Label>
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
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                format(dateReceived, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                dateReceived ?? undefined
                              }
                              onSelect={setDateReceived}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                            setOrderValue(Number(e.target.value));
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
                              className={cn("col-span-4 flex justify-between")}
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
                      </div>
                      <div>
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input
                          type="text"
                          placeholder="Invoice Number"
                          className="!mt-2 sm:max-w-[240px]"
                          value={
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            invoiceNumber ? invoiceNumber : undefined
                          }
                          onChange={(event) =>
                            setInvoiceNumber(String(event.target.value))
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
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                format(dueDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                dueDate ?? undefined
                              }
                              onSelect={setDueDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-xl">
                      <span className="font-semibold">Step 3:</span> Confirm
                      order items
                    </div>
                    {aiResponse ? (
                      <Table>
                        <TableCaption>Order item list.</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item: OrderItem) => (
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            <TableRow key={item.id}>
                              <TableCell>
                                <Input
                                  defaultValue={item.name}
                                  onBlur={(event) =>
                                    updateOrderItemValue(item.id, {
                                      fieldName: "name",
                                      fieldValue: event.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue={item.description}
                                  onBlur={(event) =>
                                    updateOrderItemValue(item.id, {
                                      fieldName: "description",
                                      fieldValue: event.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue={item.quantity}
                                  onBlur={(event) =>
                                    updateOrderItemValue(item.id, {
                                      fieldName: "quantity",
                                      fieldValue: event.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue={item.price}
                                  onBlur={(event) =>
                                    updateOrderItemValue(item.id, {
                                      fieldName: "price",
                                      fieldValue: event.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : null}
                    <Button className="w-36" type="submit">
                      Create Order
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="relative w-96 overflow-hidden rounded-lg p-4 shadow hover:shadow-md">
                  <div className="flex animate-pulse space-x-4">
                    <p className="text-2xl font-semibold">
                      Please wait while AI🤖 is parsing your data
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

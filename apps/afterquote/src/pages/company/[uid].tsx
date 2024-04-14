/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  RfqStatus,
  type CompanyAddress,
  type Contact,
  type Rfq,
  type SalesOrder,
} from "@prisma/client";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { ToastAction } from "@radix-ui/react-toast";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  PlusIcon,
  Receipt,
  Trash,
  Truck,
  User,
  X,
  Building,
  ChevronsUpDown,
  CalendarIcon,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ContactDataTable } from "~/components/ContactDataTable";
import { CustomerRfqDataTable } from "~/components/CustomerRfqDataTable";
import { CustomerOrderDataTable } from "~/components/CustomerOrderDataTable";
import Layout from "~/components/Layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/utils";
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
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import { countries, type CountryOption } from "~/utils/countries";
const columns: ColumnDef<Rfq>[] = [
  {
    accessorKey: "rfqNumber",
    header: "Quote #",
    cell: ({ row }) => {
      return row.original.rfqNumber ? row.original.rfqNumber : "-";
    },
  },
  {
    accessorKey: "dateReceived",
    header: "Date Received",
    cell: ({ row }) => {
      const dateReceived =
        row.original.dateReceived?.toLocaleDateString("en-US");
      const url = `/quote-details/${row.original.id}`;
      return (
        <Link
          className="underline decoration-muted-foreground/50 underline-offset-2"
          href={url}
        >
          {dateReceived}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => {
      return <div className="ml-3">Status</div>;
    },
    cell: ({ row }) => {
      return row.original.status === RfqStatus.BACKLOG ? (
        <Badge variant="outline">📝 Backlog </Badge>
      ) : row.original.status === RfqStatus.PROGRESS ? (
        <Badge variant="outline">🚧 Progress</Badge>
      ) : row.original.status === RfqStatus.HOLD ? (
        <Badge variant="outline">📁 Hold</Badge>
      ) : row.original.status === RfqStatus.ORDERPLACED ? (
        <Badge variant="outline">🔔 Order Placed</Badge>
      ) : (
        <Badge variant="outline">✅ Quote Sent</Badge>
      );
    },
  },
];
const orderColumns: ColumnDef<SalesOrder>[] = [
  {
    accessorKey: "poNumber",
    header: "Order #",
    cell: ({ row }) => {
      return row.original.poNumber ? row.original.poNumber : "-";
    },
  },
  {
    accessorKey: "dateReceived",
    header: "Date Received",
    cell: ({ row }) => {
      const dateReceived =
        row.original.dateReceived?.toLocaleDateString("en-US");
      const url = `/order-details/${row.original.id}`;
      return (
        <Link
          className="underline decoration-muted-foreground/50 underline-offset-2"
          href={url}
        >
          {dateReceived}
        </Link>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: () => {
      return <div className="ml-3">Status</div>;
    },
    cell: ({ row }) => {
      return row.original.orderStatus ? (
        <Badge variant="outline">{row.original.orderStatus}</Badge>
      ) : (
        <Badge variant="outline">-</Badge>
      );
    },
  },
];

const contactColumns: ColumnDef<Contact>[] = [
  {
    accessorKey: "contactFirstName",
    header: "Contact Name",
    cell: ({ row }) => {
      return (
        <Link
          className="text-md underline decoration-muted-foreground/50 underline-offset-2"
          href={`/contact/${row.original.id}`}
        >
          {row.original.contactFirstName + " " + row.original.contactLastName}
        </Link>
      );
    },
  },
];
const Account: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const [openDropdown, setOpenDropdown] = useState(false);
  const router = useRouter();
  const { current_tab } = router.query;
  const utils = api.useContext();
  const { uid } = router.query;
  const customerUid = String(uid);
  const currentCustomer = api.customer?.getOne.useQuery(customerUid, {
    cacheTime: 100,
  });
  const createCompanyAddress = api.customer.createCompanyAddress.useMutation({
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.customer.getCompanyAddresses.cancel();
      // Snapshot the previous value
      const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.customer.getCompanyAddresses.setData(
          customerUid,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.customer.getCompanyAddresses.invalidate();
    },
  });
  const deleteCompanyAddress = api.customer.deleteCompanyAddresses.useMutation({
    onMutate: () => {
      void utils.customer.getCompanyAddresses.cancel();
      const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
      if (optimisticUpdate) {
        utils.customer.getCompanyAddresses.setData(
          customerUid,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.customer.getCompanyAddresses.invalidate();
    },
  });
  const updateCompanyName = api.customer.updateCompanyName.useMutation();
  const updateCompanyAddressOne =
    api.customer.updateCompanyAddressOne.useMutation({
      onMutate: () => {
        void utils.customer.getCompanyAddresses.cancel();
        const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
        if (optimisticUpdate) {
          utils.customer.getCompanyAddresses.setData(
            customerUid,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.customer.getCompanyAddresses.invalidate();
      },
    });
  const updateCompanyAddressTwo =
    api.customer.updateCompanyAddressTwo.useMutation({
      onMutate: () => {
        void utils.customer.getCompanyAddresses.cancel();
        const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
        if (optimisticUpdate) {
          utils.customer.getCompanyAddresses.setData(
            customerUid,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.customer.getCompanyAddresses.invalidate();
      },
    });
  const updateCompanyAddressCity =
    api.customer.updateCompanyAddressCity.useMutation({
      onMutate: () => {
        void utils.customer.getCompanyAddresses.cancel();
        const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
        if (optimisticUpdate) {
          utils.customer.getCompanyAddresses.setData(
            customerUid,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.customer.getCompanyAddresses.invalidate();
      },
    });
  const updateCompanyAddressState =
    api.customer.updateCompanyAddressState.useMutation({
      onMutate: () => {
        void utils.customer.getCompanyAddresses.cancel();
        const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
        if (optimisticUpdate) {
          utils.customer.getCompanyAddresses.setData(
            customerUid,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.customer.getCompanyAddresses.invalidate();
      },
    });
  const updateCompanyAddressZip =
    api.customer.updateCompanyAddressZip.useMutation({
      onMutate: () => {
        void utils.customer.getCompanyAddresses.cancel();
        const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
        if (optimisticUpdate) {
          utils.customer.getCompanyAddresses.setData(
            customerUid,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.customer.getCompanyAddresses.invalidate();
      },
    });
  const updateCompanyAddressCountry =
    api.customer.updateCompanyAddressCountry.useMutation({
      onMutate: () => {
        void utils.customer.getCompanyAddresses.cancel();
        const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
        if (optimisticUpdate) {
          utils.customer.getCompanyAddresses.setData(
            customerUid,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.customer.getCompanyAddresses.invalidate();
      },
    });
  const companyAddresses = api.customer?.getCompanyAddresses.useQuery(
    customerUid,
    {
      cacheTime: 100,
    }
  );
  const [addressOne, setAddressOne] = useState<string | undefined>();
  const [addressTwo, setAddressTwo] = useState<string | undefined>();
  const [addressCity, setAddressCity] = useState<string | undefined>();
  const [addressState, setAddressState] = useState<string | undefined>();
  const [addressZip, setAddressZip] = useState<string | undefined>();
  const [selectedCountry, setSelectedCountry] =
    useState<CountryOption | null>();
  const { data: customerRfqs } = api.customer?.getRfqsForCustomer.useQuery(
    customerUid,
    { cacheTime: 100 }
  );
  const { data: customerOrders } = api.customer?.getOrdersForCustomer.useQuery(
    customerUid,
    { cacheTime: 100 }
  );
  const [companyName, setCompanyName] = useState<string | undefined>();

  const handleCreateCompanyAddress = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (customerUid) {
      createCompanyAddress.mutate(
        {
          customerId: customerUid,
          addressOne: addressOne ? addressOne : null,
          addressTwo: addressTwo ? addressTwo : null,
          addressZip: addressZip ? addressZip : null,
          addressCity: addressCity ? addressCity : null,
          addressState: addressState ? addressState : null,
          addressCountry: selectedCountry ? selectedCountry.value : null,
        },
        {
          onSuccess: () => {
            toast({
              title: "Address added",
            });
          },
        }
      );
    }
  };
  const updateCustomer = api.customer.updateCustomer.useMutation();
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   updateCustomer.mutate(
  //     {
  //       customerId: customerUid ? customerUid : null,
  //       companyName: companyName ? companyName : null,
  //     },
  //     {
  //       onSuccess: () => {
  //         console.log("Success");
  //         setOpen(false);
  //         toast({
  //           title: "Updated customer name",
  //         });
  //       },
  //     }
  //   );
  // };
  const handleSubmitCustomField = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    updateCustomer.mutate(
      {
        customerId: customerUid ? customerUid : null,
        companyName: companyName ? companyName : null,
        customFields: customFields ? customFields : undefined,
      },
      {
        onSuccess: () => {
          console.log("Success");
          setOpen(false);
          toast({
            title: "Updated custom fields",
          });
        },
      }
    );
  };
  const { data: contacts } = api.contact?.getNoCustomerContacts.useQuery();
  interface ContactOption {
    value: string;
    label: string;
  }
  const myContactOptions: ContactOption[] =
    contacts?.map((ctc) => {
      return {
        value: ctc.id,
        label:
          ctc.contactFirstName +
          " " +
          ctc.contactLastName +
          "\n" +
          (ctc.contactEmail ? " (" + ctc.contactEmail + ")" : ""),
      };
    }) ?? [];
  const linkContactToCustomer = api.contact.linkContactToCustomer.useMutation({
    onMutate: () => {
      void utils.customer.getOne.cancel();
      const optimisticUpdate = utils.customer.getOne.getData();
      if (optimisticUpdate) {
        utils.customer.getOne.setData(customerUid, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.customer.getOne.invalidate();
    },
  });
  const handleCustomerSubmit = (contactUid: string) => {
    if (contactUid && customerUid) {
      linkContactToCustomer.mutate(
        {
          contactId: contactUid,
          customerId: customerUid,
        },
        {
          onSuccess: () => {
            console.log("Success");
            setOpen(false);
            toast({
              title: "Contact successfully linked to Company",
            });
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
              deleteCompanyAddress.mutate(lineItemId, {
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
  const handleCompanyNameChange = (
    companyId: string,
    companyName: string | null
  ) => {
    if (companyId && companyName && companyName.length > 0) {
      updateCompanyName.mutate({
        companyId: companyId,
        companyName: companyName ?? "",
      });
    }
    setCompanyName(companyName ?? "");
  };
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const handleCompanyAddressChange = (
    companyId: string,
    field: string,
    value: string | null
  ) => {
    if (companyId && value && value.length > 0) {
      switch (field) {
        case "addressOne":
          updateCompanyAddressOne.mutate({
            companyId: companyId,
            addressOne: value ?? "",
          });
          break;
        case "addressTwo":
          updateCompanyAddressTwo.mutate({
            companyId: companyId,
            addressTwo: value ?? "",
          });
          break;
        case "addressCity":
          updateCompanyAddressCity.mutate({
            companyId: companyId,
            addressCity: value ?? "",
          });
          break;
        case "addressState":
          updateCompanyAddressState.mutate({
            companyId: companyId,
            addressState: value ?? "",
          });
          break;
        case "addressZip":
          updateCompanyAddressZip.mutate({
            companyId: companyId,
            addressZip: value ?? "",
          });
          break;
        case "addressCountry":
          updateCompanyAddressCountry.mutate({
            companyId: companyId,
            addressCountry: value ?? "",
          });
          break;
        default:
          break;
      }
    }
  };

  const [open, setOpen] = useState(false);
  const [customFields, setCustomFields] = useState(
    currentCustomer.data?.customFields
  );
  const updateCustomField = (key: string, newValue: any) => {
    setCustomFields((prevFields) => {
      if (typeof prevFields === "object" && prevFields !== null) {
        return {
          ...prevFields,
          [key]: newValue,
        };
      }
      return { [key]: newValue };
    });
  };
  const companiesCustomFieldSchema =
    api.organization?.getOrganizationCompaniesFieldSchema.useQuery();
  const [openDialog, setOpenDialog] = useState(false);
  const handleCountryChange = (selectedOption: CountryOption) => {
    setSelectedCountry(selectedOption as CountryOption | null);
    // handleAddressSubmit(selectedOption as CountryOption | null);
  };
  const setBillingAddress = api.customer.setBillingAddress.useMutation({
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.customer.getCompanyAddresses.cancel();
      // Snapshot the previous value
      const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.customer.getCompanyAddresses.setData(
          customerUid,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.customer.getCompanyAddresses.invalidate();
    },
    onSuccess: () => {
      console.log("Success");
      setOpen(false);
      toast({
        title: "Updated to billing address",
      });
    },
  });
  const setShippingAddress = api.customer.setShippingAddress.useMutation({
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.customer.getCompanyAddresses.cancel();
      // Snapshot the previous value
      const optimisticUpdate = utils.customer.getCompanyAddresses.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.customer.getCompanyAddresses.setData(
          customerUid,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.customer.getCompanyAddresses.invalidate();
    },
    onSuccess: () => {
      console.log("Success");
      setOpen(false);
      toast({
        title: "Updated to shipping address",
      });
    },
  });
  const isKtex = useFeatureIsOn("is-ktex");
  const handleBillingAddressChange = (
    id: string,
    isBillingAddress: boolean
  ) => {
    setBillingAddress.mutate({ id, isBillingAddress });
  };
  const handleShippingAddressChange = (
    id: string,
    isShippingAddress: boolean
  ) => {
    setShippingAddress.mutate({ id, isShippingAddress });
  };
  useEffect(() => {
    let newJson = undefined;
    if (companiesCustomFieldSchema.data?.companiesCustomFieldSchema) {
      newJson = Object.keys(
        companiesCustomFieldSchema.data.companiesCustomFieldSchema
      ).reduce((obj: { [key: string]: any }, key) => {
        if (
          !companiesCustomFieldSchema.data ||
          !companiesCustomFieldSchema.data.companiesCustomFieldSchema
        ) {
          return {};
        }
        const fieldSchema = (
          companiesCustomFieldSchema.data.companiesCustomFieldSchema as {
            [index: string]: any;
          }
        )[key];
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
    setCustomFields(currentCustomer.data?.customFields ?? newJson);
    setCompanyName(currentCustomer.data?.companyName);
  }, [
    currentCustomer.data?.companyName,
    currentCustomer.isLoading,
    companiesCustomFieldSchema.isLoading,
    companiesCustomFieldSchema.data,
    currentCustomer.data?.customFields,
  ]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void router.push("/companies");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]);
  const updateTabQueryParam = (tabValue: string) => {
    void router.push({
      pathname: `/company/${uid}`,
      query: { current_tab: tabValue },
    });
  };

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout
        headerTitle={`${companyName ?? ""} • Afterquote`}
        currentPage="companies"
      >
        <div className="container mx-auto mt-2 min-h-screen max-w-7xl rounded-xl border shadow">
          <div className="my-4">
            <div className="my-2 flex flex-row items-center">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void router.push("/companies")}
                    >
                      <X className="h-4 w-4 opacity-50" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Close •{" "}
                    <span className="rounded-md border px-1 py-0.5">ESC</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <h1 className="text-2xl font-semibold">{companyName}</h1>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger>
                  <Button
                    onClick={() => setOpenDialog(true)}
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                  >
                    <Pencil className="h-4 w-4 " />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  {/* <form onSubmit={handleSubmit}> */}
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Building className="mr-2 h-[1.2rem] w-[1.2rem]" />
                      Edit company name
                    </DialogTitle>
                    <DialogDescription>Click save when.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Company Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="Company"
                        defaultValue={companyName ?? ""}
                        className="col-span-2 max-w-[240px]"
                        onChange={(event) =>
                          handleCompanyNameChange(
                            customerUid,
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setOpenDialog(false);
                      }}
                      // type="submit"
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                  {/* </form> */}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Tabs
            defaultValue={isKtex ? "orders" : "rfqs"}
            value={current_tab ? String(current_tab) : "rfqs"}
          >
            <TabsList className={`grid w-[600px] grid-cols-5`}>
              {!isKtex && (
                <TabsTrigger
                  value="rfqs"
                  onClick={() => updateTabQueryParam("rfqs")}
                >
                  Quotes
                </TabsTrigger>
              )}
              <TabsTrigger
                value="orders"
                onClick={() => updateTabQueryParam("orders")}
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="team"
                onClick={() => updateTabQueryParam("team")}
              >
                Team
              </TabsTrigger>
              <TabsTrigger
                value="companyinfo"
                onClick={() => updateTabQueryParam("companyinfo")}
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="customfields"
                onClick={() => updateTabQueryParam("customfields")}
              >
                Custom Fields
              </TabsTrigger>
            </TabsList>
            <TabsContent className="w-full" value="rfqs">
              {customerRfqs !== undefined ? (
                <CustomerRfqDataTable columns={columns} data={customerRfqs} />
              ) : (
                <p>No Quotes</p>
              )}
            </TabsContent>
            <TabsContent className="w-full" value="orders">
              {customerOrders !== undefined ? (
                <CustomerOrderDataTable
                  columns={orderColumns}
                  data={customerOrders}
                />
              ) : (
                <p>No Orders</p>
              )}
            </TabsContent>
            <TabsContent value="team">
              {currentCustomer.data?.contacts !== undefined &&
              currentCustomer.data?.contacts.length > 0 ? (
                <ContactDataTable
                  columns={contactColumns}
                  data={currentCustomer.data?.contacts}
                />
              ) : (
                <div className="my-8 flex h-80 w-[400px] items-center justify-center rounded-lg border px-8 shadow-sm">
                  <div className="flex flex-col items-center gap-6">
                    <div className="rounded-full bg-primary-foreground p-4">
                      <User className="h-[2rem] w-[2rem] text-primary" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-lg font-medium">No related people</h2>
                      <p>Link a person</p>
                    </div>
                    {contacts && (
                      <Popover
                        open={openDropdown}
                        onOpenChange={setOpenDropdown}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="secondary"
                            role="combobox"
                            aria-expanded={open}
                            className="col-span-2"
                          >
                            <LinkIcon className="mr-2 h-5 w-5" />
                            Link person
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          side="right"
                          className="overflow-y-auto p-0 "
                        >
                          <Command className="overflow-scroll">
                            <CommandInput
                              placeholder="Search people"
                              className="h-9"
                            />
                            <CommandEmpty>No Account found.</CommandEmpty>
                            <CommandGroup className="overflow-y-auto">
                              <ScrollArea type="always" className="h-72">
                                {myContactOptions.map((contact) => (
                                  <CommandItem
                                    key={contact.value}
                                    className="cursor-pointer"
                                    onSelect={() => {
                                      handleCustomerSubmit(contact?.value);
                                      setOpenDropdown(false);
                                    }}
                                  >
                                    {contact.label}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="companyinfo">
              <Separator className="my-8" />
              <div>
                <Label htmlFor="addressOne">Addresses</Label>
                <>
                  {companyAddresses.data?.companyAddresses?.map(
                    ({
                      id,
                      addressOne,
                      addressTwo,
                      addressCity,
                      addressState,
                      addressCountry,
                      addressZip,
                      isBillingAddress,
                      isShippingAddress,
                    }: CompanyAddress) => (
                      <div
                        className="mb-4 flex w-96 justify-between rounded-lg border p-4"
                        key={id}
                      >
                        <div>
                          {isBillingAddress && isShippingAddress ? (
                            <p className="font-semibold">
                              Billing and Shipping Address
                            </p>
                          ) : isBillingAddress ? (
                            <p className="font-semibold">Billing Address</p>
                          ) : isShippingAddress ? (
                            <p className="font-semibold">Shipping Address</p>
                          ) : null}
                          {addressOne ? <>{`${String(addressOne)}, `}</> : ""}
                          {addressTwo ? (
                            <>
                              {`${String(addressTwo)}, `}
                              <br />
                            </>
                          ) : (
                            ""
                          )}
                          {addressCity ? <>{`${String(addressCity)}, `}</> : ""}
                          {addressState ? `${String(addressState)}, ` : ""}
                          {addressCountry ? `${String(addressCountry)}, ` : ""}
                          {addressZip ? `${String(addressZip)}` : ""}
                        </div>
                        <Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DialogTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() => setIsEditFormOpen(true)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleBillingAddressChange(
                                    id,
                                    !isBillingAddress
                                  )
                                }
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Switch Billing Address
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleShippingAddressChange(
                                    id,
                                    !isShippingAddress
                                  )
                                }
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                Switch Shipping Address
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleDelete(id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex  items-center">
                                Edit or add an address
                              </DialogTitle>
                              <DialogDescription>
                                Add an address to this company.
                              </DialogDescription>
                            </DialogHeader>
                            {isEditFormOpen && (
                              <div>
                                <div className="flex flex-col gap-4">
                                  <div>
                                    <Label htmlFor="addressOne">
                                      Address 1
                                    </Label>
                                    <Input
                                      type="text"
                                      placeholder="Address 1"
                                      defaultValue={addressOne || ""}
                                      className="max-w-[240px]"
                                      onChange={(event) =>
                                        handleCompanyAddressChange(
                                          id,
                                          "addressOne",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="addressOne">
                                      Address 2
                                    </Label>
                                    <Input
                                      type="text"
                                      placeholder="Address 2"
                                      defaultValue={addressTwo || ""}
                                      className="max-w-[240px]"
                                      onChange={(event) =>
                                        handleCompanyAddressChange(
                                          id,
                                          "addressTwo",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                      type="text"
                                      placeholder="City"
                                      defaultValue={addressCity || ""}
                                      className="max-w-[240px]"
                                      onChange={(event) =>
                                        handleCompanyAddressChange(
                                          id,
                                          "addressCity",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="addressState">
                                      Address State
                                    </Label>
                                    <Input
                                      type="text"
                                      placeholder="Address State"
                                      defaultValue={addressState || ""}
                                      className="max-w-[240px]"
                                      onChange={(event) =>
                                        handleCompanyAddressChange(
                                          id,
                                          "addressState",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="zip code">Zip Code</Label>
                                    <Input
                                      type="text"
                                      placeholder="Zip Code"
                                      defaultValue={addressZip || ""}
                                      className="max-w-[240px]"
                                      onChange={(event) =>
                                        handleCompanyAddressChange(
                                          id,
                                          "addressZip",
                                          event.target.value
                                        )
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
                                          {addressCountry
                                            ? addressCountry
                                            : "Select country..."}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="max-w-[240px] p-0">
                                        <Command>
                                          <CommandInput
                                            placeholder="Search countries"
                                            className="h-9"
                                          />
                                          <CommandEmpty>
                                            No country found.
                                          </CommandEmpty>
                                          <CommandGroup className="h-[200px]">
                                            {countries.map((country) => (
                                              <CommandItem
                                                key={country.value}
                                                onSelect={(ct) => {
                                                  handleCompanyAddressChange(
                                                    id,
                                                    "addressCountry",
                                                    country.value
                                                  );
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
                                </div>
                                <DialogFooter>
                                  <DialogTrigger>
                                    <Button
                                      onClick={() => {
                                        setIsEditFormOpen(false);
                                      }}
                                    >
                                      Close
                                    </Button>
                                  </DialogTrigger>
                                </DialogFooter>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    )
                  )}
                </>
              </div>
              <Dialog>
                <DialogTrigger>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-blue-600"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add address
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-fit">
                  <DialogHeader>
                    <DialogTitle className="flex  items-center">
                      Edit or add an address
                    </DialogTitle>
                    <DialogDescription>
                      Add an address to this company.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCompanyAddress}>
                    <div className="flex flex-col gap-4">
                      <div>
                        <Label htmlFor="addressOne">Address 1</Label>
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
                        <Label htmlFor="addressTwo">Address 2</Label>
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
                        <Label htmlFor="city">City</Label>
                        <Input
                          type="text"
                          placeholder="City"
                          value={addressCity ? addressCity : undefined}
                          className="max-w-[240px]"
                          onChange={(event) =>
                            setAddressCity(event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">State</Label>
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
                        <Label htmlFor="zipCode">Zip Code</Label>
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
                                      handleCountryChange(country);
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
                    </div>
                    <DialogFooter>
                      <DialogTrigger>
                        <Button type="submit">Confirm</Button>
                      </DialogTrigger>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="customfields">
              <form
                className=" flex flex-row justify-between gap-5 p-8 shadow-sm"
                onSubmit={handleSubmitCustomField}
              >
                <div className="flex flex-col gap-4">
                  {customFields &&
                    typeof customFields === "object" &&
                    companiesCustomFieldSchema.data
                      ?.companiesCustomFieldSchema &&
                    typeof companiesCustomFieldSchema.data
                      ?.companiesCustomFieldSchema === "object" &&
                    Object.entries(
                      companiesCustomFieldSchema.data
                        ?.companiesCustomFieldSchema
                    ).map(([group, groupFields]) => (
                      <div key={group}>
                        <Separator className="my-8" />
                        <Collapsible defaultOpen={true}>
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
                {Object.keys(customFields || {}).length > 0 &&
                  companiesCustomFieldSchema?.data
                    ?.companiesCustomFieldSchema && (
                    <Button size="sm" variant={"outline"}>
                      Save
                    </Button>
                  )}
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    );
  }
  return <Spinner />;
};

export default Account;

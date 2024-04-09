/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  AtSign,
  Building,
  Pencil,
  Phone,
  StickyNote,
  X,
  ChevronsUpDown,
  CalendarIcon,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { default as ReactSelect } from "react-select";
import HeaderNav from "~/components/HeaderNav";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/utils";
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
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const Contact: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const contactUid = String(uid);
  const currentContact = api.contact?.getOne.useQuery(contactUid, {
    cacheTime: 100,
  });
  const accountsList = api.customer?.getCustomers.useQuery();
  interface AccountOption {
    value: string;
    label: string;
  }
  const myAccountOptions: AccountOption[] =
    accountsList.data?.map((acc) => {
      return {
        value: acc.id,
        label: acc.companyName,
      };
    }) ?? [];

  function getAccountNameById(accountId: string): string | undefined {
    if (accountsList.data && accountId) {
      const acc = accountsList.data.find((a) => a.id === accountId);
      return acc ? acc.companyName : undefined;
    }
  }

  const [contactFirstName, setContactFirstName] = useState(
    currentContact.data?.contactFirstName
  );
  const [contactLastName, setContactLastName] = useState(
    currentContact.data?.contactLastName
  );
  const contactFullName = `${contactFirstName ?? ""}  ${contactLastName ?? ""}`;
  const [contactEmail, setContactEmail] = useState(
    currentContact.data?.contactEmail
  );
  const [contactNumber, setContactNumber] = useState(
    currentContact.data?.contactNumber
  );
  const [contactNotes, setContactNotes] = useState(
    currentContact.data?.contactNotes
  );
  const [accountOption, setAccountOption] = useState<AccountOption | null>(
    currentContact.data?.customerId
      ? {
          value: currentContact.data?.customerId,
          label: getAccountNameById(currentContact.data?.customerId) ?? "",
        }
      : null
  );
  const [open, setOpen] = useState(false);
  const [customFields, setCustomFields] = useState(
    currentContact.data?.customFields
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
  const updateContact = api.contact.updateContact.useMutation();
  const contactsCustomFieldSchema =
    api.organization?.getOrganizationContactsFieldSchema.useQuery();
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (contactFirstName && contactLastName) {
      updateContact.mutate(
        {
          contactId: contactUid,
          contactFirstName: contactFirstName,
          contactLastName: contactLastName,
          contactNumber: contactNumber ?? null,
          contactEmail: contactEmail ?? null,
          contactNotes: contactNotes ?? null,
          customerId: accountOption?.value ?? null,
          customFields: customFields ? customFields : undefined,
        },
        {
          onSuccess: () => {
            console.log("Success");
            setOpen(false);
            toast({
              title: "Updated contact",
            });
          },
        }
      );
    }
  };
  useEffect(() => {
    let newJson = undefined;
    if (contactsCustomFieldSchema.data?.contactsCustomFieldSchema) {
      newJson = Object.keys(
        contactsCustomFieldSchema.data.contactsCustomFieldSchema
      ).reduce((obj: { [key: string]: any }, key) => {
        if (
          !contactsCustomFieldSchema.data ||
          !contactsCustomFieldSchema.data.contactsCustomFieldSchema
        ) {
          return {};
        }
        const fieldSchema = (
          contactsCustomFieldSchema.data.contactsCustomFieldSchema as {
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
    setContactFirstName(currentContact.data?.contactFirstName);
    setContactLastName(currentContact.data?.contactLastName);
    setContactEmail(currentContact.data?.contactEmail);
    setAccountOption(
      currentContact.data?.customerId
        ? {
            value: currentContact.data?.customerId,
            label: getAccountNameById(currentContact.data?.customerId) ?? "",
          }
        : null
    );
    setContactNumber(currentContact.data?.contactNumber);
    setContactNotes(currentContact.data?.contactNotes);
    setCustomFields(currentContact.data?.customFields ?? newJson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact.isLoading, contactsCustomFieldSchema.isLoading]);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>{contactFullName} • Afterquote</title>
        </Head>
        <div className="flex h-screen w-screen flex-col bg-muted">
          <HeaderNav currentPage={"contacts"} />
          <main className="flex w-screen flex-row justify-center ">
            <div className="container mx-16 mt-2 max-w-7xl gap-12 rounded-xl border bg-background shadow-md">
              <div className="my-4">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Separator className="my-2" />
              </div>
              <div className="my-8">
                <div className="flex flex-row justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                      {contactFirstName} {contactLastName}
                    </h2>
                    <div className="flex items-center">
                      <AtSign className="mr-2 h-[1rem] w-[1rem]" />
                      <Link
                        href={`mailto:${contactEmail ?? ""}`}
                        className="text-xl  text-blue-500"
                      >
                        {contactEmail}
                      </Link>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-[1rem] w-[1rem]" />
                      <h1 className="text-xl  ">
                        {contactNumber ?? "Set phone number"}
                      </h1>
                    </div>
                    <div className="flex items-center">
                      <Building className="mr-2 h-[1rem] w-[1rem]" />
                      <h1 className="text-xl  ">
                        {accountOption?.label ?? "None selected"}
                      </h1>
                    </div>
                    <div className="flex items-center">
                      <StickyNote className="mr-2 h-[1rem] w-[1rem]" />
                      <h1 className="text-xl ">{contactNotes ?? "No notes"}</h1>
                    </div>
                    <form
                      className=" flex flex-row justify-between gap-5 p-8 shadow-sm"
                      onSubmit={handleSubmit}
                    >
                      <div className="flex flex-col gap-4">
                        {customFields &&
                          typeof customFields === "object" &&
                          contactsCustomFieldSchema.data
                            ?.contactsCustomFieldSchema &&
                          typeof contactsCustomFieldSchema.data
                            ?.contactsCustomFieldSchema === "object" &&
                          Object.entries(
                            contactsCustomFieldSchema.data
                              ?.contactsCustomFieldSchema
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
                                                    {(customFields as any)[
                                                      label
                                                    ] || `Select ${label}...`}
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
                                              <Label htmlFor="date">
                                                {label}
                                              </Label>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                      "max-w-[240px] justify-start text-left font-normal",
                                                      !(customFields as any)[
                                                        label
                                                      ] &&
                                                        "text-muted-foreground"
                                                    )}
                                                  >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {(customFields as any)[
                                                      label
                                                    ] ? (
                                                      new Date(
                                                        (customFields as any)[
                                                          label
                                                        ]
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
                                                      (customFields as any)[
                                                        label
                                                      ]
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
                                                  (customFields as any)[
                                                    label
                                                  ] !== undefined
                                                    ? String(
                                                        (customFields as any)[
                                                          label
                                                        ]
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
                        contactsCustomFieldSchema?.data
                          ?.contactsCustomFieldSchema && (
                          <Button size="sm" variant={"outline"}>
                            Save
                          </Button>
                        )}
                    </form>
                  </div>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant={"outline"}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleSubmit}>
                        <DialogHeader>
                          <DialogTitle>Edit customer profile</DialogTitle>
                          <DialogDescription>
                            Make changes to the customers profile here. Click
                            save when you&apos;re done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Contact First Name
                            </Label>
                            <Input
                              id="name"
                              value={contactFirstName}
                              className="col-span-3"
                              onChange={(event) =>
                                setContactFirstName(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Contact Last Name
                            </Label>
                            <Input
                              id="name"
                              value={contactLastName}
                              className="col-span-3"
                              onChange={(event) =>
                                setContactLastName(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Contact Email
                            </Label>
                            <Input
                              type="email"
                              value={contactEmail ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setContactEmail(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Contact Number
                            </Label>
                            <Input
                              id="name"
                              value={contactNumber ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setContactNumber(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Contact Notes
                            </Label>
                            <Input
                              id="name"
                              value={contactNotes ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setContactNotes(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Select Account
                            </Label>
                            {accountsList?.data && accountOption ? (
                              <div className="col-span-3 flex flex-row items-center justify-between">
                                <div>{accountOption.label}</div>
                                <Button
                                  size="sm"
                                  variant={"ghost"}
                                  onClick={() => setAccountOption(null)}
                                >
                                  Change
                                  <Pencil className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <ReactSelect
                                className="min-w-[240px]"
                                onChange={setAccountOption}
                                value={accountOption}
                                options={myAccountOptions}
                                placeholder="Select account"
                              />
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
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

export default Contact;

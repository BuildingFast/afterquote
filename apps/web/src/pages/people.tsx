import { type Contact } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Building,
  Contact as ContactIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { ContactDataTable } from "~/components/ContactDataTable";
import Layout from "~/components/Layout";
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
import { Button } from "~/components/ui/button";
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
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const Contacts: NextPage = () => {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { data: contacts } = api.contact?.getContacts.useQuery();
  const accountsList = api.customer?.getCustomers.useQuery();
  interface AccountOption {
    value: string;
    label: string;
  }
  const [accountOption, setAccountOption] = useState<AccountOption | null>();
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
  const utils = api.useContext();
  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "contactFirstName",
      header: "Contact Name",
      cell: ({ row }) => {
        return (
          <Link
            href={`/contact/${row.original.id}`}
            className="underline decoration-muted-foreground/50 underline-offset-2"
          >
            {row.original.contactFirstName + " " + row.original.contactLastName}
          </Link>
        );
      },
    },
    {
      accessorKey: "contactEmail",
      header: "Contact Email",
      cell: ({ row }) => {
        return (
          <Link href={`/contact/${row.original.id}`}>
            {row.original.contactEmail}
          </Link>
        );
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
                  className="flex h-6 w-6 p-0 data-[state=open]:bg-muted"
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
                        This action cannot be undone. Your contact{" "}
                        <span className="font-bold">
                          {row.original.contactFirstName +
                            " " +
                            row.original.contactLastName}
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

  const [contactFirstName, setContactFirstName] = useState<string | null>(null);
  const [contactLastName, setContactLastName] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactNumber, setContactNumber] = useState<string | null>(null);
  const [contactNotes, setContactNotes] = useState<string | null>(null);
  const createContact = api.contact.createContact.useMutation();
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (contactFirstName && contactLastName) {
      createContact.mutate(
        {
          contactFirstName: contactFirstName,
          contactLastName: contactLastName,
          contactNumber: contactNumber,
          contactEmail: contactEmail,
          contactNotes: contactNotes,
          customerId: accountOption ? accountOption.value : null,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              void router.push(`/contact/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };

  const deleteContact = api.contact?.deleteContact.useMutation({
    onMutate: () => {
      void utils.contact?.getContacts.cancel();
      const optimisticUpdate = utils.contact?.getContacts.getData();
      if (optimisticUpdate) {
        utils.contact?.getContacts.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.contact?.getContacts.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "Deleted record successfully",
      });
    },
  });

  const softDelete = (id: string) => {
    deleteContact.mutate(id);
  };

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout headerTitle={"People • Afterquote"} currentPage={"people"}>
        <div className="flex w-full justify-between ">
          <h1 className="text-xl font-semibold tracking-tight">People</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>Add person</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Users className="mr-2 h-[1.2rem] w-[1.2rem]" />
                    Create new person
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription>Click save when done.</DialogDescription>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      First Name
                    </Label>
                    <Input
                      type="text"
                      className="col-span-2"
                      placeholder="John"
                      required
                      onChange={(event) =>
                        setContactFirstName(event.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Last Name
                    </Label>
                    <Input
                      type="text"
                      className="col-span-2"
                      required
                      placeholder="Doe"
                      onChange={(event) =>
                        setContactLastName(event.target.value)
                      }
                    />
                  </div>
                  <div className="grid w-full grid-cols-3 items-center gap-4">
                    <Label className="text-right">Company</Label>
                    {accountsList?.data && accountOption ? (
                      <div className="col-span-2 flex w-full items-center justify-between">
                        <span className="text-lg font-semibold">
                          {getAccountNameById(accountOption.value)}
                        </span>
                        <Button
                          size="sm"
                          variant={"link"}
                          onClick={() => setAccountOption(null)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Popover
                        open={openDropdown}
                        onOpenChange={setOpenDropdown}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="col-span-2 justify-between text-muted-foreground"
                          >
                            Select company
                            <Building className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search companies"
                              className="h-9"
                            />
                            <CommandEmpty>No company found.</CommandEmpty>
                            <CommandGroup>
                              {myAccountOptions.map((account) => (
                                <CommandItem
                                  id="searched-company"
                                  key={account.value}
                                  onSelect={() => {
                                    setAccountOption(account);
                                    setOpenDropdown(false);
                                  }}
                                >
                                  {account.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="grid w-full grid-cols-3 items-center gap-4">
                    <Label className="text-right">Email</Label>
                    <Input
                      type="email"
                      className="col-span-2"
                      placeholder="abc@gmail.com"
                      onChange={(event) => setContactEmail(event.target.value)}
                    />
                  </div>
                  <div className="grid w-full grid-cols-3 items-center gap-4">
                    <Label className="text-right">Phone Number</Label>
                    <Input
                      type="text"
                      className="col-span-2"
                      placeholder="+1 (123)-456-7890"
                      onChange={(event) => setContactNumber(event.target.value)}
                    />
                  </div>
                  <div className="grid w-full grid-cols-3 items-center gap-4">
                    <Label className="text-right">Contact Notes</Label>
                    <Input
                      type="text"
                      className="col-span-2"
                      placeholder="Notes"
                      onChange={(event) => setContactNotes(event.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      posthog.capture("Create person clicked", {
                        createdBy: session
                          ? session.user.email
                          : "could not get email",
                      });
                    }}
                    type="submit"
                  >
                    New person
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {contacts === undefined || contacts.length === 0 ? (
          <div className="mt-8 flex h-80 w-full items-center justify-center rounded-lg border shadow-sm">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-full bg-primary-foreground p-4">
                <ContactIcon className="h-[2rem] w-[2rem] text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium">
                  You have no people added yet
                </h2>
                <p>Add person by clicking on the button above</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ContactDataTable columns={columns} data={contacts} />
          </>
        )}
      </Layout>
    );
  }
  return <Spinner />;
};

export default Contacts;

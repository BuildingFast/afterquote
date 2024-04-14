/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { PlusCircle, Send, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const CustomerPortalInvite: React.FC = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const { data: customerPortalMembers } =
    api.organization?.getOrganizationCustomerPortalUsers.useQuery();
  const { data: contacts } = api.contact?.getContacts.useQuery();
  interface ContactOption {
    value: string;
    label: string;
  }
  const [contactOption, setContactOption] = useState<ContactOption | null>();
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
  const openDialog = () => {
    setOpen(true);
  };
  const closeDialog = () => {
    setOpen(false);
  };
  const inviteToCustomerPortal =
    api.invite?.createInviteForCustomerPortal.useMutation({
      onSettled: () => {
        void utils.organization?.getCustomerPortalInvitations.invalidate();
        void router.push({
          pathname: "/settings",
          query: { current_tab: "customer-portal" },
        });
      },
    });
  const mutateInvite = (e: React.SyntheticEvent) => {
    e.preventDefault();
    inviteToCustomerPortal.mutate(
      {
        contactId: contactOption?.value ?? null,
        orgName: "RfqTiger",
      },
      {
        onSuccess: (data: any) => {
          if (data) {
            toast({
              title: "Customer Portal Invite Sent",
            });
          } else {
            toast({
              title: "Failed to send invite",
            });
          }
        },
      }
    );
    closeDialog();
  };
  // Function to find the role by email
  // function findRoleByEmail(
  //   users: {
  //     id: string;
  //     role: UserRole;
  //     name: string | null;
  //     email: string | null;
  //   }[],
  //   emailToFind: string
  // ): UserRole | null {
  //   const user = users.find((user) => user.email === emailToFind);
  //   return user ? user.role : "MEMBER";
  // }
  const { data: customerPortalInvites } =
    api.organization?.getCustomerPortalInvitations.useQuery();

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <div>
        <div className="flex justify-between">
          <div>
            <h1 className="text-lg font-semibold ">
              Customer Contacts Invited
            </h1>
            <p className="">
              Manage customer&apos;s invited to use a customer portal here.
            </p>
          </div>
          <div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button" onClick={openDialog}>
                  Invite customer to portal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex  items-center">
                    <Send className="mr-2 h-[1rem] w-[1rem]" />
                    Invite a customer
                  </DialogTitle>
                  <DialogDescription>
                    Verify contacts email address before inviting!
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={mutateInvite}>
                  <div className="grid gap-4 py-4">
                    <div className="items-center gap-4">
                      {contacts && contactOption ? (
                        <Button
                          size="lg"
                          variant={"ghost"}
                          onClick={() => setContactOption(null)}
                          className="w-fit"
                        >
                          {contactOption.label}
                        </Button>
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
                              className="col-span-2 w-[200px] justify-between"
                            >
                              Select person
                              <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                      onSelect={() => {
                                        setContactOption(contact);
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
                  <DialogFooter>
                    <Button type="submit">Confirm</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="grid grid-cols-4">
          <div className="col-span-1">
            <h2 className="text-lg">Invited Customers</h2>
            <p className="font-light">
              Invites sent by your organization for customer portal
            </p>
          </div>
          <div className="col-span-3 rounded-md border bg-background">
            <Table>
              <TableHeader className="uppercase">
                <TableRow className="w-full">
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPortalInvites &&
                  customerPortalInvites?.map((member) => {
                    return (
                      <TableRow key={member.id}>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
  return <Spinner />;
};

export default CustomerPortalInvite;

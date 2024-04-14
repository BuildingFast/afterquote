import { type UserRole } from "@prisma/client";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ChevronLeft, PlusCircle, Send } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useEffect,
  useState,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactFragment,
  type ReactPortal,
} from "react";
import CustomChecklistSettings from "~/components/CustomChecklistSettings";
import RfqCustomFieldSettings from "~/components/RfqCustomFieldsSettings";
import SalesOrderCustomFieldSettings from "~/components/SalesOrderCustomFieldsSettings";
import SalesOrderCustomStatusOptionsSettings from "~/components/SalesOrderCustomStatusOptionsSettings";
import ContactsCustomFieldSettings from "~/components/ContactsCustomFieldsSettings";
import CompaniesCustomFieldSettings from "~/components/CompaniesCustomFieldSettings";
import CustomerPortalInvite from "~/components/CustomerPortalInvite";
import TaxRates from "~/components/TaxRates";
import HeaderNav from "~/components/HeaderNav";
import Layout from "~/components/Layout";
import OrganizationAddress from "~/components/OrganizationAddress";
import ThemeSettings from "~/components/ThemeSettings";
import { Badge } from "~/components/ui/badge";
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
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/utils/api";
import { currencies, getCurrencySymbol } from "~/utils/getCurrency";
import { Card } from "~/components/ui/card";

const Settings: NextPage = () => {
  const { data: sessionData, status } = useSession();
  const router = useRouter();
  const { current_tab } = router.query;
  const [emailInviteValue, setEmailInviteValue] = useState("");
  const currentUserOrganization = api.user?.getUserOrganization.useQuery();
  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const { data: orgMembers, isLoading } =
    api.organization?.getOrganizationUsers.useQuery();
  const { data: orgInvites } =
    api.organization?.getOrganizationInvitations.useQuery();
  const inviteMember = api.invite?.createInvite.useMutation();

  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  const [orgCurrency, setOrgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );

  const changeOrganizationCurrency =
    api.organization?.changeOrganizationCurrency.useMutation();
  const changeOrgCurrency = (name: string) => {
    changeOrganizationCurrency.mutate({ currency: name });
  };

  const mutateInviteMember = () => {
    inviteMember.mutate({
      email: emailInviteValue,
      orgName: "RfqTiger",
    });
  };
  const updateTabQueryParam = (tabValue: string) => {
    void router.push({
      pathname: "/settings",
      query: { current_tab: tabValue },
    });
  };
  // Function to find the role by email
  function findRoleByEmail(
    users: {
      id: string;
      role: UserRole;
      name: string | null;
      email: string | null;
    }[],
    emailToFind: string
  ): UserRole | null {
    const user = users.find((user) => user.email === emailToFind);
    return user ? user.role : "MEMBER";
  }

  const userRole =
    !sessionData || !orgMembers
      ? "MEMBER"
      : findRoleByEmail(
          orgMembers,
          sessionData.user?.email ? sessionData.user?.email : ""
        );

  useEffect(() => {
    setOrgCurrency(String(orgCurrencyData.data?.currency) || "USD");
  }, [orgCurrencyData.data?.currency]);

  if (isLoading) {
    return <Spinner />;
  }

  const isAdminOrHigher =
    userRole === "ADMIN" || userRole === "OWNER" ? true : false;

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated" && isAdminOrHigher) {
    return (
      <Layout headerTitle="Settings • Afterquote" currentPage="settings">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings and preferences
          </p>
        </div>
        <Tabs
          defaultValue="team"
          value={current_tab ? String(current_tab) : "team"}
          className="mt-8 w-full"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger
              value="team"
              onClick={() => updateTabQueryParam("team")}
            >
              Team
            </TabsTrigger>
            <TabsTrigger
              value="customer-portal"
              onClick={() => updateTabQueryParam("customer-portal")}
            >
              Customer Portal
            </TabsTrigger>
            <TabsTrigger
              value="general"
              onClick={() => updateTabQueryParam("general")}
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="custom-fields"
              onClick={() => updateTabQueryParam("custom-fields")}
            >
              Custom Fields
            </TabsTrigger>
            <TabsTrigger
              value="theme"
              onClick={() => updateTabQueryParam("theme")}
            >
              Theme
            </TabsTrigger>
            <TabsTrigger
              value="taxes"
              onClick={() => updateTabQueryParam("taxes")}
            >
              Taxes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="team" className="py-8">
            <div className="flex justify-between">
              <div>
                <h1 className="text-lg font-semibold ">Team members</h1>
                <p className="">
                  Manage your team members and account permissions here.
                </p>
              </div>
              <div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" onClick={() => setOpen(true)}>
                      Invite team member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex  items-center">
                        <Send className="mr-2 h-[1rem] w-[1rem]" />
                        Invite a member
                      </DialogTitle>
                      <DialogDescription>
                        Only add members who are trusted to access your company
                        data.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={mutateInviteMember}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Members email
                          </Label>
                          <Input
                            id="name"
                            placeholder="johndoe@gmail.com  "
                            className="col-span-2"
                            onChange={(event) =>
                              setEmailInviteValue(event.target.value)
                            }
                          />
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
                <h2 className="text-lg">Active Members</h2>
                <p className="font-light">People part of your organization</p>
              </div>
              <div className="col-span-3 rounded-md border bg-background">
                <Table className="">
                  <TableHeader className="uppercase">
                    <TableRow className="w-full">
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgMembers &&
                      orgMembers?.map(
                        (member: {
                          id: Key | null | undefined;
                          name:
                            | string
                            | number
                            | boolean
                            | ReactElement<
                                any,
                                string | JSXElementConstructor<any>
                              >
                            | ReactPortal
                            | null
                            | undefined;
                          email:
                            | string
                            | number
                            | boolean
                            | ReactElement<
                                any,
                                string | JSXElementConstructor<any>
                              >
                            | ReactPortal
                            | null
                            | undefined;
                          role:
                            | string
                            | number
                            | boolean
                            | ReactElement<
                                any,
                                string | JSXElementConstructor<any>
                              >
                            | ReactFragment
                            | ReactPortal
                            | null
                            | undefined;
                        }) => {
                          return (
                            <TableRow key={member.id} className="w-full">
                              <TableCell className="min-w-[200px]">
                                {member.name} - {member.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{member.role}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <Separator className="my-8" />
            <div className="grid grid-cols-4">
              <div className="col-span-1">
                <h2 className="text-lg">Invites</h2>
                <p className="font-light">Invites send by your organization</p>
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
                    {orgInvites &&
                      orgInvites
                        .filter((invite) => invite.status === "PENDING")
                        .map((invite) => (
                          <TableRow key={invite.id} className="w-full">
                            <TableCell scope="row" className="min-w-[200px]">
                              {invite.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{invite.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="customer-portal" className="py-8">
            <CustomerPortalInvite />
          </TabsContent>
          <TabsContent value="custom-fields" className="py-8">
            <div className="mb-4">
              <h1 className="text-lg font-semibold">Custom fields</h1>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-4 ">
              <RfqCustomFieldSettings />
              <CompaniesCustomFieldSettings />
              <SalesOrderCustomFieldSettings />
              <ContactsCustomFieldSettings />
            </div>
          </TabsContent>
          <TabsContent value="theme" className="py-8">
            <ThemeSettings />
          </TabsContent>
          <TabsContent value="taxes" className="py-8">
            <TaxRates />
          </TabsContent>
          <TabsContent value="general" className="py-8">
            <div className="mb-4">
              <h1 className="text-lg font-semibold ">Currency</h1>
              <p className="">Change Organization Currency</p>
            </div>
            <div>
              <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="col-span-2 w-32 justify-between"
                  >
                    <span>{getCurrencySymbol(orgCurrency)}</span>
                    {orgCurrency}
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="overflow-y-auto p-0 ">
                  <Command className="overflow-scroll">
                    <CommandInput
                      placeholder="Search Currency"
                      className="h-9"
                    />
                    <CommandEmpty>Currency Not found.</CommandEmpty>
                    <CommandGroup className="overflow-y-auto">
                      <ScrollArea type="always" className="h-72">
                        {currencies.map((currency) => (
                          <CommandItem
                            key={currency.shortName}
                            className="flex justify-between"
                            onSelect={() => {
                              setOrgCurrency(currency.shortName);
                              changeOrgCurrency(currency.shortName);
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
              <OrganizationAddress />
            </div>
          </TabsContent>
        </Tabs>
      </Layout>
    );
  }
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Image src="/access.svg" width={300} height={300} alt={"no access"} />
      <h1 className="text-2xl font-medium text-slate-800">
        You don&apos;t have access to this page
      </h1>
      <Link href="/quotes">
        <Button className="mt-8" size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </Link>
    </div>
  );
};

export default Settings;

import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Bell, ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import RfqCommand from "~/components/RfqCommand";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/utils";
import { api } from "~/utils/api";
import { Button } from "./ui/button";

type ClassValue = string | undefined | null | string[];

function classNames(...classes: ClassValue[]) {
  return classes
    .reduce((acc: string[], cls: ClassValue) => {
      if (Array.isArray(cls)) {
        acc.push(...cls);
      } else if (typeof cls === "string") {
        acc.push(cls);
      }
      return acc;
    }, [])
    .filter((cls: string) => cls)
    .join(" ");
}

export interface NavProps {
  currentPage: string;
}

type NavigationItem = {
  name: string;
  href?: string;
  current: boolean;
  children?: NavigationItem[];
};

const updateNavigation = (page: string): NavigationItem[] => {
  return [
    { name: "Quotes", href: "/quotes", current: page === "quotes" },
    { name: "Orders", href: "/orders", current: page === "orders" },
    {
      name: "Contacts",
      current: page === "companies" || page === "people",
      children: [
        {
          name: "Companies",
          href: "/companies",
          current: page === "companies",
        },
        {
          name: "People",
          href: "/people",
          current: page === "people",
        },
      ],
    },
    { name: "Reports", href: "/reports", current: page === "reports" },
    { name: "Catalog", href: "/catalog", current: page === "catalog" },
    {
      name: "Primary Data",
      href: "/operations",
      current: page === "primary_data",
    },
  ];
};

const ktexNavigation = (page: string): NavigationItem[] => {
  return [
    { name: "Orders", href: "/orders", current: page === "orders" },
    { name: "Companies", href: "/companies", current: page === "companies" },
    { name: "People", href: "/people", current: page === "people" },
    { name: "Reports", href: "/reports", current: page === "reports" },
  ];
};
const factoryFloorNavigation = (page: string): NavigationItem[] => {
  return [
    {
      name: "Rejection Tracking",
      href: "/rejection_tracking",
      current: page === "rejection_tracking",
    },
  ];
};
const aaciplNavigation = (page: string): NavigationItem[] => {
  return [
    { name: "Orders", href: "/orders", current: page === "orders" },
    {
      name: "Contacts",
      current: page === "companies" || page === "people",
      children: [
        {
          name: "Companies",
          href: "/companies",
          current: page === "companies",
        },
        {
          name: "People",
          href: "/people",
          current: page === "people",
        },
      ],
    },
  ];
};

export default function HeaderNav({ currentPage }: NavProps) {
  let navigation: NavigationItem[];
  const { data: sessionData } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const organizationName = api.organization.getOrganizationName.useQuery();
  const organizationList = api.organization.getOrganizationList.useQuery();
  const { data: notification_count } =
    api.notification?.getUnreadNotificationsCount.useQuery();
  const isKtex = useFeatureIsOn("is-ktex");
  const isAacipl = useFeatureIsOn("is-aacipl");
  const isFactoryFloor = useFeatureIsOn("is-factory-floor");
  const updateUserOrg = api.user.updateUserOrganization.useMutation({
    onSettled: () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      void utils.organization.getOrganizationName.invalidate();
    },
  });
  const handleSubmit = (selectedOrg: string) => {
    updateUserOrg.mutate(
      { orgId: selectedOrg },
      {
        onSuccess: () => {
          void utils.invalidate();
          void router.reload();
        },
      }
    );
  };

  if (isKtex) {
    navigation = ktexNavigation(currentPage);
  } else if (isAacipl) {
    navigation = aaciplNavigation(currentPage);
  } else if (isFactoryFloor) {
    navigation = factoryFloorNavigation(currentPage);
  } else {
    navigation = updateNavigation(currentPage);
  }

  return (
    <Disclosure as="nav" className="border-b">
      {({ open }) => (
        <>
          <div className="px-2 sm:px-6 ">
            <div className="relative mx-auto flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <Button variant="ghost" asChild>
                  <Link className="text-xl" href="/orders">
                    {organizationName?.data?.name ? (
                      <span>{organizationName?.data?.name}</span>
                    ) : (
                      <span>Afterquote</span>
                    )}
                  </Link>
                </Button>
                <div className="hidden items-center sm:ml-6 sm:flex">
                  <div className="flex items-center space-x-8">
                    {navigation.map((item) =>
                      item.children ? (
                        <DropdownMenu key={item.name}>
                          <DropdownMenuTrigger asChild>
                            <Link
                              key={item.name}
                              href={item.href ?? "/"}
                              className={cn(
                                "flex items-center transition-colors hover:text-foreground/80",
                                item.current
                                  ? "text-foreground"
                                  : "text-foreground/60"
                              )}
                            >
                              {item.name}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Link>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {item.children.map((child) => (
                              <DropdownMenuItem
                                className="p-2"
                                asChild
                                key={child.href}
                              >
                                <Link href={child.href ?? ""}>
                                  {child.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Link
                          key={item.name}
                          className={cn(
                            "transition-colors hover:text-foreground/80",
                            item.current
                              ? "text-foreground"
                              : "text-foreground/60"
                          )}
                          href={item.href ?? "/"}
                        >
                          {item.name}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 hidden items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:flex sm:pr-0">
                <RfqCommand />
                <Button className="relative" asChild variant="ghost">
                  <Link href="/notifications">
                    <Bell className="relative h-[1rem] w-[1rem]" />
                    {notification_count !== 0 ? (
                      <div className="absolute bottom-6 right-2 h-2 w-2 rounded-full bg-blue-500"></div>
                    ) : null}
                  </Link>
                </Button>
                {organizationList &&
                  organizationList?.data &&
                  organizationList?.data?.length > 1 && (
                    <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="col-span-2 w-32 justify-between"
                        >
                          {organizationName?.data?.name}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        className="overflow-y-auto p-0 "
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search orgs"
                            className="h-9"
                          />
                          <CommandGroup className="h-[200px]">
                            {
                              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                              organizationList.data.map((org) => (
                                <CommandItem
                                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                  key={org?.id ?? null}
                                  onSelect={() => {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                                    handleSubmit(org ? org.id : "");
                                    setOpen(false);
                                  }}
                                >
                                  {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                    org ? org.name : null
                                  }
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="ml-4" size="icon">
                      <Avatar>
                        {sessionData?.user.image != null ? (
                          <>
                            <AvatarImage src={sessionData?.user?.image} />
                          </>
                        ) : (
                          <AvatarFallback>
                            {sessionData?.user?.name?.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        {sessionData?.user.name}
                      </DropdownMenuLabel>
                      <DropdownMenuItem className="text-muted-foreground">
                        {sessionData?.user.email}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={
                        sessionData
                          ? () =>
                              void signOut({
                                callbackUrl: process.env.NEXT_PUBLIC_URL,
                              })
                          : () => console.log("Error")
                      }
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current ? "text-foreground" : "text-foreground/60",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

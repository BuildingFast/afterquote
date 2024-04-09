import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { UserIcon } from "lucide-react";

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

export default function HeaderNav() {
  const { data: sessionData } = useSession();
  const organizationName = api.organization.getOrganizationName.useQuery();
  const mainOrgName = api.organization?.getCustomerPortalOrgName.useQuery();

  const { setTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

  return (
    <Disclosure as="nav">
      {({ open }) => (
        <>
          <div className="border-b ">
            <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-2 sm:px-6 lg:px-8">
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
                <Link className="text-xl font-semibold" href="/">
                  {mainOrgName?.data?.name}
                </Link>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="mr-6" variant="ghost" size="icon">
                      <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="grid grid-rows-2 justify-items-end gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold">
                    {sessionData?.user.email}
                  </span>
                  <span>{organizationName?.data?.name}</span>
                </div>
                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex rounded-full bg-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-400">
                      <span className="sr-only">Open user menu</span>
                      <div>
                        {sessionData?.user.image != null ? (
                          <Image
                            src={sessionData.user.image}
                            className="rounded-full border"
                            alt="profilepic"
                            width="40"
                            height="40"
                          />
                        ) : (
                          <div className="w-fit rounded-full border p-2">
                            <UserIcon className="h-5 w-5 " />
                          </div>
                        )}
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={classNames(
                              active ? "bg-gray-100" : "",
                              " w-full px-4 py-2 text-start text-sm text-gray-700"
                            )}
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
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
}

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, SunIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  { name: "Contacts", href: "/contacts", current: false },
  { name: "Catalog", href: "/catalog", current: false },
  { name: "Quotes", href: "/quotes", current: false },
  { name: "Invoices", href: "/invoices", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Navbar = () => {
  const { data: sessionData } = useSession();

  return (
    <>
      <Disclosure
        as="nav"
        className="sticky top-0 border-b bg-slate-50 dark:border-slate-600 dark:bg-slate-900"
      >
        {({ open }) => (
          <>
            <div className="mx-auto px-3 py-3 dark:bg-gray-800 lg:px-5 lg:pl-3">
              <div className="relative flex h-12 items-center justify-between">
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
                  <div className="mr-16 flex flex-shrink-0 items-center">
                    <Link href="/quotes">
                      <Image
                        className="hidden h-8 w-auto lg:block"
                        src="/Frame.svg"
                        alt="Your Company"
                        width={500}
                        height={500}
                      />
                    </Link>
                  </div>
                  <form className="flex items-center">
                    <label htmlFor="simple-search" className="sr-only">
                      Search
                    </label>
                    <div className="relative w-full">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg
                          aria-hidden="true"
                          className="h-5 w-5 text-gray-500 dark:text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="simple-search"
                        className="block w-full rounded-lg border border-gray-300 bg-muted p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        placeholder="Search"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="ml-2 rounded-lg border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                      <span className="sr-only">Search</span>
                    </button>
                  </form>
                </div>
                {sessionData ? (
                  <>
                    <button
                      id="theme-toggle"
                      type="button"
                      className="rounded-lg p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    >
                      <SunIcon
                        className="h-6 w-6 text-gray-100"
                        id="theme-toggle-dark-icon"
                      />
                      {/* <MoonIcon id="theme-toggle-light-icon" /> */}
                    </button>
                    <p className="hidden font-semibold text-gray-800 dark:text-gray-300 sm:block">
                      {sessionData.user?.name}{" "}
                    </p>
                  </>
                ) : null}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {/* Profile dropdown */}
                  {sessionData && (
                    <div className="flex items-center justify-center">
                      <button
                        className="text-lg font-bold text-blue-500 no-underline "
                        onClick={
                          sessionData
                            ? () =>
                                void signOut({
                                  callbackUrl: process.env.NEXT_PUBLIC_URL,
                                })
                            : () => void signIn()
                        }
                      >
                        {sessionData ? "Sign out" : "Sign in"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 divide-y divide-zinc-200 bg-zinc-50 px-2 pb-3 pt-2	">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "bg-zinc-300 text-gray-900"
                        : "text-gray-700 hover:bg-zinc-300 hover:text-zinc-700",
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
    </>
  );
};

export default Navbar;

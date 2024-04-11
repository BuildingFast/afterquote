import { Building, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "~/utils";

interface NavProps {
  currentPage: string;
}

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
  icon?: JSX.Element;
};

const updateNavigation = (page: string): NavigationItem[] => {
  return [
    {
      name: "Accounts",
      href: "/accounts",
      current: page === "accounts",
      icon: <Building className="mr-2 h-[1rem] w-[1rem]" />,
    },
    {
      name: "Contacts",
      href: "/contacts",
      current: page === "contacts",
      icon: <Users className="mr-2 h-[1rem] w-[1rem]" />,
    },
  ];
};

export default function AccountsContactsNav({ currentPage }: NavProps) {
  const navigation: NavigationItem[] = updateNavigation(currentPage);

  return (
    <>
      <div className="mx-auto max-w-7xl border-b px-2 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center transition-colors hover:text-foreground/80",
                      item.current
                        ? "font-semibold text-foreground"
                        : "text-foreground/60"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

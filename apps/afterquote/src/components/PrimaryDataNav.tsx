import {
  Box,
  Cog,
  Component,
  File,
  Folder,
  Info,
  MessageCircle,
  PanelBottomClose,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "./ui/button";

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
      name: "Operation Categories",
      href: "/operations",
      current: page === "operations",
      icon: <Cog className="mr-2 h-4 w-4" />,
    },
    {
      name: "Operations",
      href: "/machines",
      current: page === "machines",
      icon: <PanelBottomClose className="mr-2 h-4 w-4" />,
    },
    {
      name: "Materials",
      href: "/materials",
      current: page === "materials",
      icon: <Box className="mr-2 h-4 w-4" />,
    },
    {
      name: "Processes",
      href: "/processes",
      current: page === "processes",
      icon: <Box className="mr-2 h-4 w-4" />,
    },
    /*{
      name: "Parts",
      href: "/parts",
      current: page === "parts",
      icon: <Component className="mr-2 h-4 w-4" />,
    },*/
  ];
};

export default function PrimaryDataNav({ currentPage }: NavProps) {
  const navigation: NavigationItem[] = updateNavigation(currentPage);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.back();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]);

  return (
    <>
      <div className="mx-auto mt-2 ">
        <div className="relative mx-auto flex items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-row items-start rounded-none border-b-2 px-4 hover:bg-background ${
                    item.current === true
                      ? "border-muted-foreground"
                      : "border-transparent text-gray-500"
                  } hover:border-secondary hover:bg-none `}
                >
                  {/* {item.icon} */}
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

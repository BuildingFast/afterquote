import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { File, Info, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/utils";
import { api } from "~/utils/api";

interface NavProps {
  currentPage: string;
  currentOrderId: string;
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
      name: "Details",
      href: "/order-details",
      current: page === "order-details",
      icon: <Info className="mr-2 h-4 w-4" />,
    },
    {
      name: "Order Items",
      href: "/order-items",
      current: page === "order-items",
      icon: <File className="mr-2 h-4 w-4" />,
    },
    {
      name: "Chat",
      href: "/order_chat",
      current: page === "order_chat",
      icon: <MessageCircle className="mr-2 h-4 w-4" />,
    },
  ];
};

export default function OrderNav({ currentPage, currentOrderId }: NavProps) {
  const navigation: NavigationItem[] = updateNavigation(currentPage);
  const customerCompanyName =
    api.salesOrder.getSalesOrderCustomerName.useQuery(currentOrderId);
  const hideQuoteTab = useFeatureIsOn("is-ktex");
  if (hideQuoteTab) {
    for (let i = 0; i < navigation.length; i++) {
      if (navigation[i] && navigation[i]?.name === "Quote") {
        navigation.splice(i, 1);
      }
    }
  }
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
      <div className="mx-auto hidden sm:flex ">
        <div className="relative flex h-16 items-center justify-between">
          <div className="mt-2 flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void router.back()}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">
                {customerCompanyName.data}
              </h1>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href + "/" + currentOrderId}
                  className={cn(
                    "flex items-center transition-colors hover:text-foreground/80 hover:underline hover:decoration-primary/50",
                    item.current
                      ? "text-foreground decoration-primary underline-offset-2"
                      : "text-foreground/40"
                  )}
                >
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

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
import { Badge } from "./ui/badge";

interface NavProps {
  currentPage: string;
  currentRfqId: string;
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
      href: "/quote-details",
      current: page === "quote-details",
      icon: <Info className="mr-2 h-4 w-4" />,
    },
    {
      name: "Quote",
      href: "/quote-items",
      current: page === "quote",
      icon: <File className="mr-2 h-4 w-4" />,
    },
    {
      name: "Chat",
      href: "/quote-chat",
      current: page === "quote-chat",
      icon: <MessageCircle className="mr-2 h-4 w-4" />,
    },
  ];
};

export default function QuoteNav({ currentPage, currentRfqId }: NavProps) {
  const navigation: NavigationItem[] = updateNavigation(currentPage);
  const customerCompanyName = api.rfq.getRfqCustomerName.useQuery(currentRfqId);

  const rfqData = api.rfq.getRfqConverted.useQuery(currentRfqId);
  const isConverted = rfqData.data?.converted === true;

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
      <div className="mx-auto max-w-7xl ">
        <div className="relative mx-auto flex h-16 items-center justify-between">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void router.push("/quotes")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex space-x-4">
              <div>
                <h1 className="text-lg">
                  <span className="mr-4 font-semibold">
                    {customerCompanyName.data}
                  </span>
                </h1>
              </div>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href + "/" + currentRfqId}
                  className={cn(
                    "flex items-center transition-colors hover:text-foreground/80 hover:underline hover:decoration-primary/50",
                    item.current
                      ? "font-medium text-foreground decoration-primary underline-offset-2"
                      : "text-foreground/40"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              {isConverted && (
                <Badge variant="outline" className="bg-background">
                  Converted to Order
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

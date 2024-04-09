/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";
// import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { type Prisma } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronsUpDown, Sticker } from "lucide-react";
import Link from "next/link";
import { CustomerPortalDataTable } from "~/components/CustomerPortalDataTable";
import CustomerPortalNav from "~/components/CustomerPortalNav";
import { type SalesOrder } from "@prisma/client";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  getCurrencySymbol,
  getOrganizationCurrency,
} from "~/utils/getCurrency";

type CustomerTableRow = {
  id: string;
  poNumber: string | null;
  dateReceived: Date | null;
  orderValue: Prisma.Decimal | null;
  currency: string | null;
  organizationId: string;
  orderStatus: string | null;
};

const Dashboard: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { data: session } = useSession();
  const { data: salesOrders } =
    api.salesOrder?.getCustomerPortalSalesOrders.useQuery();
  const createNotificationForSalesOrderClick =
    api.notification.createNotificationForCustomerPortalSalesOrderClick.useMutation();
  let updatedData: CustomerTableRow[] = [];
  if (salesOrders) {
    updatedData = salesOrders.map((salesOrder) => {
      return { ...(salesOrder ?? "") };
    });
  }
  const columns: ColumnDef<CustomerTableRow>[] = [
    {
      accessorKey: "poNumber",
      header: "PO #",
      cell: ({ row }) => {
        return (
          <Link
            href={`/customer_portal/order-details/${row.original.id}`}
            className="underline decoration-muted-foreground/50 underline-offset-2 "
          >
            <span
              onClick={() => {
                createNotificationForSalesOrderClick.mutate({
                  salesOrderId: row.original.id,
                });
                posthog.capture("Customer Portal Order Clicked", {
                  createdBy: session
                    ? session.user.email
                    : "could not get email",
                });
              }}
            >
              {row.original.poNumber ? row.original.poNumber : ""}
            </span>
          </Link>
        );
      },
    },
    {
      accessorKey: "dateReceived",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Received
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateReceived = row.original.dateReceived?.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "2-digit" }
        );
        const timeReceived = row.original.dateReceived?.toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" }
        );
        return (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/customer_portal/order-details/${row.original.id}`}
                    className="underline decoration-muted-foreground/50 underline-offset-2 "
                  >
                    <span
                      onClick={() => {
                        createNotificationForSalesOrderClick.mutate({
                          salesOrderId: row.original.id,
                        });
                        posthog.capture("Customer Portal Order Clicked", {
                          createdBy: session
                            ? session.user.email
                            : "could not get email",
                        });
                      }}
                    >
                      {dateReceived}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{timeReceived}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        );
      },
    },
    {
      accessorKey: "orderStatus",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return row.original.orderStatus ? (
          <Badge variant="outline">{row.original.orderStatus}</Badge>
        ) : (
          <Badge variant="outline">-</Badge>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Value
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span>
            {row.original.currency
              ? getCurrencySymbol(row.original.currency)
              : getCurrencySymbol(
                  getOrganizationCurrency(row.original.organizationId)
                )}{" "}
            {row.original.orderValue
              ? Intl.NumberFormat("en-US").format(
                  Number(row.original.orderValue)
                )
              : "-"}
          </span>
        );
      },
    },
  ];
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Dashboard • Afterquote</title>
        </Head>
        <div className="flex h-screen w-screen flex-col">
          <CustomerPortalNav />
          <main className="flex h-full w-screen flex-row justify-center ">
            <div className="container mx-10 mt-8 gap-12 sm:max-w-7xl">
              <div className="sm:px-none h-full w-full">
                {/* Header */}
                <div className="flex flex-row justify-between">
                  <div>
                    <h2 className="text-2xl tracking-tight transition-colors first:mt-0">
                      Order status
                    </h2>
                  </div>
                </div>
                <Separator className="my-4" />
                {salesOrders === undefined || salesOrders.length === 0 ? (
                  <div className="flex h-80 w-full items-center justify-center rounded-lg border shadow-sm">
                    <div className="flex flex-col items-center gap-6">
                      <div className="rounded-full bg-indigo-50 p-4">
                        <div className="rounded-full bg-indigo-100 p-4">
                          <Sticker className="h-[2rem] w-[2rem] text-indigo-900" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-lg font-medium">No Orders yet</h2>
                        <div>
                          Your orders will show up here when they are added.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CustomerPortalDataTable
                    columns={columns}
                    data={updatedData}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default Dashboard;

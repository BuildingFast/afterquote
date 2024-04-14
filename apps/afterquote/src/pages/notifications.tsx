/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { NotificationPurpose, type Notification } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { Mail, MailOpen } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "~/components/Layout";
import { NotificationDataTable } from "~/components/NotificationDataTable";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/utils";
import { api } from "~/utils/api";

const Dashboard: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { data: notifications } = api.notification?.getNotifications.useQuery();
  const utils = api.useContext();
  let optimisticUpdate = null;
  let optimisticUpdate2 = null;
  const markNotificationAsRead =
    api.notification?.markNotificationAsRead.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.notification.getNotifications.cancel();
        void utils.notification.getUnreadNotificationsCount.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.notification.getNotifications.getData();
        optimisticUpdate2 =
          utils.notification.getUnreadNotificationsCount.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.notification.getNotifications.setData(
            undefined,
            optimisticUpdate
          );
        }
        if (optimisticUpdate2) {
          utils.notification.getUnreadNotificationsCount.setData(
            undefined,
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.notification.getNotifications.invalidate();
        void utils.notification.getUnreadNotificationsCount.invalidate();
      },
    });
  const markNotificationAsUnRead =
    api.notification?.markNotificationAsUnRead.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.notification.getNotifications.cancel();
        void utils.notification.getUnreadNotificationsCount.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.notification.getNotifications.getData();
        optimisticUpdate2 =
          utils.notification.getUnreadNotificationsCount.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.notification.getNotifications.setData(
            undefined,
            optimisticUpdate
          );
        }
        if (optimisticUpdate2) {
          utils.notification.getUnreadNotificationsCount.setData(
            undefined,
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.notification.getNotifications.invalidate();
        void utils.notification.getUnreadNotificationsCount.invalidate();
      },
    });
  const columns: ColumnDef<Notification>[] = [
    {
      accessorKey: "read",
      header: ({ column }) => {
        return (
          <Button
            variant="link"
            className="-ml-3 h-8 text-foreground data-[state=open]:bg-accent"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "desc")
            }
          >
            Message
            <ArrowsUpDownIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <Button
            asChild
            variant="link"
            className={cn(
              "text-foreground",
              row.original.read && "text-foreground/60 hover:text-foreground/90"
            )}
            onClick={() => {
              markNotificationAsRead.mutate({
                notificationId: row.original.id,
              });
            }}
          >
            <Link
              className={cn(
                "text-foreground",
                "text-ellipsis",
                row.original.read &&
                  "text-foreground/60 hover:text-foreground/90"
              )}
              href={
                row.original.rfqId
                  ? row.original.purpose === NotificationPurpose.RfqCreated ||
                    row.original.purpose ===
                      NotificationPurpose.CustomerPortalViewed
                    ? `/quote-details/${row.original.rfqId}`
                    : row.original.purpose === NotificationPurpose.ChatMention
                    ? `/quote-chat/${row.original.rfqId}`
                    : row.original.purpose ===
                      NotificationPurpose.CustomerPortalFileViewed
                    ? `/quote-files/${row.original.rfqId}`
                    : "/quotes"
                  : row.original.salesOrderId
                  ? row.original.purpose === NotificationPurpose.OrderCreated
                    ? `/order-details/${row.original.salesOrderId}`
                    : ""
                  : row.original.purpose === NotificationPurpose.InviteAccepted
                  ? "/settings"
                  : ""
              }
              passHref
            >
              {!row.original.read && (
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
              {row.original.message}
            </Link>
          </Button>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="link"
            className="-ml-3 h-8 text-foreground data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateCreated = row.original.createdAt?.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "2-digit" }
        );
        new Intl.RelativeTimeFormat("en", { style: "short" });
        const timeReceived = row.original.createdAt?.toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" }
        );
        const past = row.original.createdAt;
        const now = new Date();
        const diffTime = Math.abs(past.getTime() - now.getTime());
        const diffSeconds = Math.floor(diffTime / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        return (
          <>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      row.original.read &&
                        "text-foreground/60 hover:text-foreground/90"
                    )}
                  >
                    {diffDays !== 0
                      ? diffDays + "d "
                      : diffHours !== 0
                      ? diffHours + "h "
                      : diffMinutes + "m "}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {timeReceived}
                    {" - "}
                    {dateCreated}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Action",
      cell: ({ row }) => {
        return row.original.read ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    markNotificationAsUnRead.mutate({
                      notificationId: row.original.id,
                    });
                  }}
                >
                  <Mail className="h-4 w-4 stroke-foreground/60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as unread</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    markNotificationAsRead.mutate({
                      notificationId: row.original.id,
                    });
                  }}
                >
                  <MailOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as read</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
  ];

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout headerTitle="Notifications" currentPage="">
        <div className="flex flex-row justify-center">
          <div className="container mt-4 max-w-4xl gap-12 sm:mx-10">
            <div className="mx-auto rounded-lg ">
              <Header
                notification_count={
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  notifications
                    ? notifications.filter((obj) => obj.read === false).length
                    : 0
                }
              />
              <NotificationDataTable
                columns={columns}
                data={notifications ?? []}
              />
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  return <Spinner />;
};

export default Dashboard;

interface NotificationHeaderProps {
  notification_count: number;
}

const Header: React.FC<NotificationHeaderProps> = ({ notification_count }) => {
  const utils = api.useContext();
  let optimisticUpdate = null;
  let optimisticUpdate2 = null;
  const markAllNotificationsAsRead =
    api.notification?.markAllNotificationsAsRead.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.notification.getNotifications.cancel();
        void utils.notification.getUnreadNotificationsCount.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.notification.getNotifications.getData();
        optimisticUpdate2 =
          utils.notification.getUnreadNotificationsCount.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.notification.getNotifications.setData(
            undefined,
            optimisticUpdate
          );
        }
        if (optimisticUpdate2) {
          utils.notification.getUnreadNotificationsCount.setData(
            undefined,
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.notification.getNotifications.invalidate();
        void utils.notification.getUnreadNotificationsCount.invalidate();
      },
    });
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        <div className="ml-2 rounded-lg border bg-background px-2 py-2">
          <p className="relative text-sm">{notification_count} unread</p>
        </div>
      </div>
      <Button
        onClick={() => {
          markAllNotificationsAsRead.mutate();
        }}
      >
        Mark all read
      </Button>
    </div>
  );
};

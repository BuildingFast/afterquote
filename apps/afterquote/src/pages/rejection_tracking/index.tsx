/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";
// import { Dialog, Transition } from "@headlessui/react";
import { type QualityRejection } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { Building, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RejectionTrackingDataTable } from "~/components/RejectionTrackingDataTable";
import Layout from "~/components/Layout";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/ui/use-toast";

const columns: ColumnDef<QualityRejection>[] = [
  {
    accessorKey: "dateOfRejection",
    header: "Date",
    cell: ({ row }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const rejectionDate = row.original.dateOfRejection?.toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "2-digit" }
      );
      return <h1>{rejectionDate}</h1>;
    },
  },
  {
    accessorKey: "rollNumber",
    header: "Roll Number",
    cell: ({ row }) => {
      return <h1>{row.original.rollNumber}</h1>;
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      return <h1>{row.original.customer}</h1>;
    },
  },
  {
    accessorKey: "actualWidth",
    header: "Actual Width (mm)",
    cell: ({ row }) => {
      return <h1>{Number(row.original.actualWidth)}</h1>;
    },
  },
  {
    accessorKey: "actualLength",
    header: "Actual Length (mtr)",
    cell: ({ row }) => {
      return <h1>{Number(row.original.actualLength)}</h1>;
    },
  },
  {
    accessorKey: "qualityDecision",
    header: "Quality Decision",
    cell: ({ row }) => {
      return <h1>{row.original.qualityDecision}</h1>;
    },
  },
  {
    accessorKey: "qualityObservation",
    header: "Quality Observation",
    cell: ({ row }) => {
      return <h1>{row.original.qualityObservation}</h1>;
    },
  },
  {
    accessorKey: "disposableMaterials",
    header: "Disposable Materials",
    cell: ({ row }) => {
      return <h1>{row.original.disposableMaterials}</h1>;
    },
  },
  {
    accessorKey: "finalStatus",
    header: "Final Status",
    cell: ({ row }) => {
      return <h1>{row.original.finalStatus} </h1>;
    },
  },
  {
    accessorKey: "submittedBy",
    header: "Submitted By",
    cell: ({ row }) => {
      return <h1>{row.original.submittedBy}</h1>;
    },
  },
  {
    accessorKey: "shiftNumber",
    header: "Shift Number",
    cell: ({ row }) => {
      return <h1>{row.original.shiftNumber}</h1>;
    },
  },
];

const RejectionTracking: NextPage = () => {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const orgFormWidgetId =
    api.organization?.getOrganizationFormWidgetId.useQuery();
  const { data: qualityRejections } =
    api.rejectionForm.getRejections.useQuery();

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout
        currentPage={"rejection_tracking"}
        headerTitle={"Rejections • Afterquote"}
      >
        <div className="flex w-full justify-between ">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Slit Roll Hold Reject Tracking
            </h1>
          </div>
          <Link
            href={`/rejection_tracking/${orgFormWidgetId?.data?.formWidgetId}`}
            className="flex flex-row"
          >
            New Rejection
            <Plus className="ml-2 mt-1 h-4 w-4" />
          </Link>
        </div>
        <Separator className="my-4" />
        {qualityRejections === undefined || qualityRejections.length === 0 ? (
          <div className="flex h-80 w-full items-center justify-center rounded-lg border shadow-sm">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-full bg-primary-foreground p-4">
                <Building className="h-[2rem] w-[2rem] text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium">
                  No quality rejections added
                </h2>
                <p>Add a rejection by clicking on &apos;New Rejection&apos;</p>
              </div>
              <Link
                href={`/rejection_tracking/${orgFormWidgetId?.data?.formWidgetId}`}
                className="flex flex-row"
              >
                New Rejection
                <Plus className="ml-2 mt-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <RejectionTrackingDataTable
              columns={columns}
              data={qualityRejections}
            />
          </>
        )}
      </Layout>
    );
  }
  return <Spinner />;
};

export default RejectionTracking;

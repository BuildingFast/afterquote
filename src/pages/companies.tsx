import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";
// import { Dialog, Transition } from "@headlessui/react";
import { type Customer } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { Building, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomerDataTable } from "~/components/CustomerDataTable";
import Layout from "~/components/Layout";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/use-toast";
import { Card } from "~/components/ui/card";

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => {
      return (
        <Link className="font-medium" href={`/company/${row.original.id}`}>
          {row.original.companyName}
        </Link>
      );
    },
  },
];

const Accounts: NextPage = () => {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { data: customers } = api.customer?.getCustomers.useQuery();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const utils = api.useContext();
  let optimisticUpdate = null;
  const createCustomer = api.customer.createCustomer.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.customer.getCustomers.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.customer.getCustomers.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.customer?.getCustomers.setData(undefined, optimisticUpdate);
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.customer?.getCustomers.invalidate();
    },
  });
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (companyName) {
      createCustomer.mutate(
        {
          companyName: companyName,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              toast({
                title: "Created new Account",
              });
            }
          },
        }
      );
    }
  };

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout currentPage={"companies"} headerTitle={"Accounts • Afterquote"}>
        <div className="flex w-full justify-between ">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>Add company</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Building className="mr-2 h-[1.2rem] w-[1.2rem]" />
                    Create new company
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Company Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Acme Inc."
                      className="col-span-2"
                      onChange={(event) => setCompanyName(event.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      posthog.capture("Create company clicked", {
                        createdBy: session
                          ? session.user.email
                          : "could not get email",
                      });
                    }}
                    type="submit"
                  >
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {customers === undefined || customers.length === 0 ? (
          <Card className="mt-4 flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-full bg-primary-foreground p-4">
                <Building className="h-[2rem] w-[2rem] text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium">No companies added</h2>
                <p>Add a company by clicking on the button above</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <CustomerDataTable columns={columns} data={customers} />
          </>
        )}
      </Layout>
    );
  }
  return <Spinner />;
};

export default Accounts;

/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { useState } from "react";
import { Plus, PlusCircle } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "~/components/Layout";
import PrimaryDataNav from "~/components/PrimaryDataNav";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useToast } from "~/components/ui/use-toast";
import { ToastAction } from "~/components/ui/toast";
import { api } from "~/utils/api";
import { Badge } from "~/components/ui/badge";

const OperationsCatalog: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const { toast } = useToast();
  const [operationName, setOperationName] = useState<string | null>(null);
  const [operationRate, setOperationRate] = useState<number | null>(null);
  const [operationToolingRate, setOperationToolingRate] = useState<
    number | null
  >(null);
  const { data: operations } =
    api.operationsCatalog.getOrgOperations.useQuery();
  const createOperation =
    api.operationsCatalog.createOrgOperation.useMutation();
  const deleteOperation = api.operationsCatalog.deleteOperationItem.useMutation(
    {
      onMutate: () => {
        void utils.operationsCatalog.getOrgOperations.cancel();
        optimisticUpdate = utils.operationsCatalog.getOrgOperations.getData();

        if (optimisticUpdate) {
          utils.operationsCatalog.getOrgOperations.setData(
            undefined,
            optimisticUpdate
          );
        }
      },
      onSettled: () => {
        void utils.operationsCatalog.getOrgOperations.invalidate();
      },
    }
  );
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (operationName) {
      createOperation.mutate(
        {
          name: operationName,
          rate: operationRate,
          toolingRate: operationToolingRate,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              void router.push(`/operations/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };
  const handleDelete = (opId: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this operation.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteOperation.mutate(opId, {
                onSuccess: () => {
                  toast({ title: "Deleted item" });
                },
              });
            }}
          >
            Delete
          </ToastAction>
        </>
      ),
    });
  };

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout
        headerTitle={"Primary Data • Afterquote"}
        currentPage="primary_data"
      >
        <PrimaryDataNav currentPage="operations" />
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <div className="mt-4 flex w-full flex-row justify-end">
                <Button>Add operation</Button>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex  items-center">
                  Add Operation
                </DialogTitle>
                <DialogDescription>
                  Click confirm to add operation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Operation Name"
                      onChange={(e) => {
                        setOperationName(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Rate"
                      onChange={(e) => {
                        setOperationRate(Number(e.target.value));
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Tooling Rate"
                      onChange={(e) => {
                        setOperationToolingRate(Number(e.target.value));
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogTrigger>
                    <Button type="submit">Confirm</Button>
                  </DialogTrigger>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 rounded-md bg-background p-4 shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Machines</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations?.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>
                    <Link
                      className="font-medium hover:underline"
                      href={`/operations/${(op as { id: string }).id}`}
                    >
                      {op.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {op.machines.map((mc) => (
                      <Badge variant="outline" key={mc.machine.id}>
                        {mc.machine.name}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right hover:underline"
                    onClick={handleDelete(op.id)}
                  >
                    Delete
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Layout>
    );
  }

  return <Spinner />;
};

export default OperationsCatalog;

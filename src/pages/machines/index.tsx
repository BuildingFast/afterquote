/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Select from "react-select";
import Layout from "~/components/Layout";
import PrimaryDataNav from "~/components/PrimaryDataNav";
import { Badge } from "~/components/ui/badge";
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
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

type MachineOperation = {
  value: string;
  label: string;
};

const MachinesCatalog: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const { toast } = useToast();
  const [machineName, setMachineName] = useState<string | null>(null);
  const [machineRate, setMachineRate] = useState<number | null>(null);
  const [machineOperations, setMachineOperations] = useState<
    MachineOperation[]
  >([]);
  const { data: machines } = api.machinesCatalog.getOrgMachines.useQuery();
  const { data: operations } =
    api.operationsCatalog.getOrgOperations.useQuery();
  const createMachine = api.machinesCatalog.createOrgMachine.useMutation();
  const deleteMachine = api.machinesCatalog.deleteMachineItem.useMutation({
    onMutate: () => {
      void utils.machinesCatalog.getOrgMachines.cancel();
      optimisticUpdate = utils.machinesCatalog.getOrgMachines.getData();

      if (optimisticUpdate) {
        utils.machinesCatalog.getOrgMachines.setData(
          undefined,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.machinesCatalog.getOrgMachines.invalidate();
    },
  });
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (machineName) {
      createMachine.mutate(
        {
          name: machineName,
          rate: machineRate,
          machineOperations:
            machineOperations.length > 0
              ? machineOperations.map((machineOp) => machineOp.value)
              : null,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              void router.push(`/machines/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };
  const handleDelete = (opId: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this machine.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteMachine.mutate(opId, {
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

  const handleMachineOperationsChange = (selected: any) => {
    setMachineOperations(selected as MachineOperation[]);
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
        <PrimaryDataNav currentPage="machines" />
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <div className="mt-4 flex w-full flex-row justify-end">
                <Button>Add machine</Button>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex  items-center">
                  Add Machine
                </DialogTitle>
                <DialogDescription>
                  Click confirm to add machine
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Machine Name"
                      onChange={(e) => {
                        setMachineName(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Rate"
                      onChange={(e) => {
                        setMachineRate(Number(e.target.value));
                      }}
                    />
                  </div>
                  <div>
                    <Select
                      isMulti
                      name="colors"
                      value={machineOperations}
                      onChange={handleMachineOperationsChange}
                      options={operations?.map(
                        (operation: { id: string; name: string }) => ({
                          value: operation.id,
                          label: operation.name,
                        })
                      )}
                      className="basic-multi-select"
                      classNamePrefix="select"
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
                <TableHead>Rate</TableHead>
                <TableHead>Used in</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines?.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">
                    <Link href={`/machines/${(machine as { id: string }).id}`}>
                      {machine.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {machine.rate}
                  </TableCell>
                  <TableCell>
                    {machine.operations.map((op) => (
                      <Badge key={op.operation.id} variant="secondary">
                        {op.operation.name + " "}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right hover:underline"
                    onClick={handleDelete(machine.id)}
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

export default MachinesCatalog;

import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Select from "react-select";
import Link from "next/link";
import Layout from "~/components/Layout";
import PrimaryDataNav from "~/components/PrimaryDataNav";
import { Spinner } from "~/components/ui/spinner";
import { useRouter } from "next/router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { ToastAction } from "~/components/ui/toast";
import { api } from "~/utils/api";
import { Badge } from "~/components/ui/badge";

type MachinesType = {
  value: string;
  label: string;
};
type MaterialsType = {
  value: string;
  label: string;
};

const ProcessesCatalog: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const { toast } = useToast();
  const [processName, setProcessName] = useState<string | null>(null);
  const [machinesType, setMachinesType] = useState<MachinesType[]>([]);
  const [materialsType, setMaterialsType] = useState<MachinesType[]>([]);
  const { data: processes } = api.processCatalog.getOrgProcesses.useQuery();
  const { data: machines } = api.machinesCatalog.getOrgMachines.useQuery();
  const { data: materials } = api.materialsCatalog.getOrgMaterials.useQuery();
  const createProcess = api.processCatalog.createOrgProcess.useMutation();
  const deleteProcess = api.processCatalog?.deleteProcessItem.useMutation({
    onMutate: () => {
      void utils.processCatalog.getOrgProcesses.cancel();
      optimisticUpdate = utils.processCatalog.getOrgProcesses.getData();

      if (optimisticUpdate) {
        utils.processCatalog.getOrgProcesses.setData(
          undefined,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.processCatalog?.getOrgProcesses.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "Process deleted successfully",
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (processName) {
      createProcess.mutate(
        {
          name: processName,
          machines:
            machinesType.length > 0
              ? machinesType.map((machine) => machine.value)
              : null,
          materials:
            materialsType.length > 0
              ? materialsType.map((material) => material.value)
              : null,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              void router.push(`/processes/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };
  const softDelete = (id: string) => {
    deleteProcess.mutate(id);
  };

  const handleMachinesChange = (selected: any) => {
    setMachinesType(selected as MachinesType[]);
  };
  const handleMaterialsChange = (selected: any) => {
    setMaterialsType(selected as MaterialsType[]);
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
        <PrimaryDataNav currentPage="processes" />
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <div className="mt-4 flex w-full flex-row justify-end">
                <Button>Add process</Button>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex  items-center">
                  Add Process
                </DialogTitle>
                <DialogDescription>
                  Click confirm to add process
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Process Name"
                      onChange={(e) => {
                        setProcessName(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Select
                      isMulti
                      name="colors"
                      value={machinesType}
                      onChange={handleMachinesChange}
                      options={machines?.map(
                        (machine: { id: string; name: string }) => ({
                          value: machine.id,
                          label: machine.name,
                        })
                      )}
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />
                  </div>
                  <div>
                    <Select
                      isMulti
                      name="colors"
                      value={materialsType}
                      onChange={handleMaterialsChange}
                      options={materials?.map(
                        (material: { id: string; name: string }) => ({
                          value: material.id,
                          label: material.name,
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
        <div className="mt-4 rounded-md bg-background p-4 shadow ">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Operations</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes?.map((process) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">
                    <Link href={`/processes/${(process as { id: string }).id}`}>
                      {process.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {process.processMachines.map((op) => (
                      <Badge key={op.machine.id} variant="secondary">
                        {op.machine.name + " "}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    {process.processMaterials.map((op) => (
                      <Badge key={op.material.id} variant="secondary">
                        {op.material.name + " "}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-right underline">
                    <div className="flex items-end justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex h-6 w-6 p-0 data-[state=open]:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full cursor-pointer items-center text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete record
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => softDelete(process.id)}
                                  className="hover.bg-red-600 bg-red-500"
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

export default ProcessesCatalog;

import { AtSign, Building, Pencil, Phone, StickyNote, X } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Select from "react-select";
import HeaderNav from "~/components/HeaderNav";
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
import { Spinner } from "~/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import { getCurrencySymbol } from "~/utils/getCurrency";

type MachinesType = {
  value: string;
  label: string;
};
type MaterialsType = {
  value: string;
  label: string;
};

const Process: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const processUid = String(uid);
  const utils = api.useContext();
  const currentProcess = api.processCatalog?.getProcess.useQuery(
    { id: processUid },
    {
      cacheTime: 100,
    }
  );
  const { data: machines } = api.machinesCatalog.getOrgMachines.useQuery();
  const { data: materials } = api.materialsCatalog.getOrgMaterials.useQuery();
  const [processName, setProcessName] = useState(currentProcess.data?.name);
  const [machinesType, setMachinesType] = useState<MachinesType[]>([]);
  const [materialsType, setMaterialsType] = useState<MachinesType[]>([]);
  const [open, setOpen] = useState(false);
  const updateProcess = api.processCatalog.updateProcess.useMutation({
    onSettled: () => {
      void utils.processCatalog.getProcess.invalidate();
    },
  });
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (processUid && processName) {
      updateProcess.mutate(
        {
          id: processUid,
          name: processName,
          machines:
            machinesType.length > 0
              ? machinesType.map((machine) => machine.value)
              : [],
          materials:
            materialsType.length > 0
              ? materialsType.map((material) => material.value)
              : [],
        },
        {
          onSuccess: () => {
            console.log("Success");
            setOpen(false);
            toast({
              title: "Updated process",
            });
          },
        }
      );
    }
  };
  useEffect(() => {
    setProcessName(currentProcess.data?.name);
    setMachinesType(
      currentProcess.data?.processMachines &&
        currentProcess.data?.processMachines.length > 0
        ? currentProcess.data?.processMachines.map((op) => ({
            value: op.machine.id,
            label: op.machine.name,
          }))
        : []
    );
    setMaterialsType(
      currentProcess.data?.processMaterials &&
        currentProcess.data?.processMaterials.length > 0
        ? currentProcess.data?.processMaterials.map((op) => ({
            value: op.material.id,
            label: op.material.name,
          }))
        : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProcess.isLoading]);

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
      <>
        <Head>
          <title>{processName} • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col ">
          <HeaderNav currentPage={"contacts"} />
          <main className="flex w-screen flex-row justify-center ">
            <div className="min-h-96 container mx-16 mt-2 max-w-7xl gap-12 rounded-xl border shadow-md">
              <div className="my-4">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Separator className="my-2" />
              </div>
              <div className="my-8">
                <div className="flex flex-row justify-between">
                  <div>
                    <div className="items-center">
                      <h1>Process Name: </h1>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {processName}
                      </h1>
                    </div>
                    <div className="items-center">
                      <h1>Machines: </h1>
                      <h1 className="text-xl  ">
                        {currentProcess.data?.processMachines.map(
                          (op) => op.machine.name + " "
                        )}
                      </h1>
                    </div>
                    <div className="items-center">
                      <h1>Materials: </h1>
                      <h1 className="text-xl  ">
                        {currentProcess.data?.processMaterials.map(
                          (op) => op.material.name + " "
                        )}
                      </h1>
                    </div>
                  </div>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant={"outline"}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleSubmit}>
                        <DialogHeader>
                          <DialogTitle>Edit customer profile</DialogTitle>
                          <DialogDescription>
                            Make changes to the process here. Click save when
                            you&apos;re done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Process name
                            </Label>
                            <Input
                              id="name"
                              value={processName}
                              className="col-span-3"
                              onChange={(event) =>
                                setProcessName(event.target.value)
                              }
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
                          <Button type="submit">Save changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};
export default Process;

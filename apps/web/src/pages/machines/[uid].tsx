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

type MachineOperation = {
  value: string;
  label: string;
};

const Machine: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const machineUid = String(uid);
  const utils = api.useContext();
  let optimisticUpdate = null;
  const currentMachine = api.machinesCatalog?.getMachine.useQuery(
    { id: machineUid },
    {
      cacheTime: 100,
    }
  );
  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const [orgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );

  const { data: operations } =
    api.operationsCatalog.getOrgOperations.useQuery();

  const [machineName, setMachineName] = useState(currentMachine.data?.name);
  const [machineRate, setMachineRate] = useState(currentMachine.data?.rate);
  const [machineOperations, setMachineOperations] = useState<
    MachineOperation[]
  >([]);
  const [open, setOpen] = useState(false);

  const updateMachine = api.machinesCatalog.updateMachine.useMutation({
    onMutate: () => {
      void utils.machinesCatalog.getMachine.cancel();
      optimisticUpdate = utils.machinesCatalog.getMachine.getData();

      if (optimisticUpdate) {
        utils.machinesCatalog.getMachine.setData(
          { id: machineUid },
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.machinesCatalog.getMachine.invalidate();
    },
  });
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (machineUid && machineName) {
      updateMachine.mutate(
        {
          id: machineUid,
          name: machineName,
          rate: machineRate ?? null,
          machineOperations:
            machineOperations.length >= 0
              ? machineOperations.map((machineOp) => machineOp.value)
              : null,
        },
        {
          onSuccess: () => {
            console.log("Success");
            setOpen(false);
            toast({
              title: "Updated machine",
            });
          },
        }
      );
    }
  };
  useEffect(() => {
    setMachineName(currentMachine.data?.name);
    setMachineRate(currentMachine.data?.rate);
    setMachineOperations(
      currentMachine.data?.operations &&
        currentMachine.data?.operations.length > 0
        ? currentMachine.data?.operations.map((op) => ({
            value: op.operation.id,
            label: op.operation.name,
          }))
        : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMachine.isLoading]);

  const handleMachineOperationsChange = (selected: any) => {
    setMachineOperations(selected as MachineOperation[]);
  };

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>{machineName} • Afterquote</title>
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
                      <h1>Machine Name: </h1>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {machineName}
                      </h1>
                    </div>
                    <div className="items-center">
                      <h1>Rate: </h1>
                      <h1 className="text-xl  ">
                        {getCurrencySymbol(orgCurrency)}
                        {machineRate}
                      </h1>
                    </div>
                    <div className="items-center">
                      <h1>Operations: </h1>
                      <h1 className="text-xl  ">
                        {currentMachine.data?.operations.map(
                          (op) => op.operation.name + " "
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
                            Make changes to the machine here. Click save when
                            you&apos;re done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Machine name
                            </Label>
                            <Input
                              id="name"
                              value={machineName}
                              className="col-span-3"
                              onChange={(event) =>
                                setMachineName(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Rate
                            </Label>
                            <Input
                              type="number"
                              value={machineRate ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setMachineRate(Number(event.target.value))
                              }
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

export default Machine;

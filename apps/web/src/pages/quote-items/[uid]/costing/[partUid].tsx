/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { MoreHorizontal, PlusCircle, Trash2, X } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import CostingMaterial from "~/components/CostingMaterial";
import CostingOperation from "~/components/CostingOperation";
import CostingTooling from "~/components/CostingTooling";
import HeaderNav from "~/components/HeaderNav";
import QuoteNav from "~/components/QuoteNav";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const MaterialCostingTableHeaders = [
  {
    title: "Material",
  },
  {
    title: "Weight per component",
  },
  {
    title: "Cost per component",
  },
];

const OperationCostingTableHeaders = [
  {
    title: "Operation",
  },
  {
    title: "Setup Time",
  },
  {
    title: "Running Time",
  },
  {
    title: "Rate",
  },
  {
    title: "Cost per component",
  },
];

const ToolingCostingTableHeaders = [
  {
    title: "Operation",
  },
  {
    title: "Weight",
  },
  {
    title: "Factor",
  },
  {
    title: "Rate",
  },
  {
    title: "Cost per component",
  },
];

const PartCosting: NextPage = () => {
  const { status } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const { uid, partUid } = router.query;
  const rfqUid = String(uid);
  const quoteLineItemUid = String(partUid);
  const utils = api.useContext();
  let optimisticUpdate = null;
  const [costingMaterialItemToCreate, setCostingMaterialItemToCreate] =
    useState("");
  const [costingMaterialItemToCreateRate, setCostingMaterialItemToCreateRate] =
    useState<number | null>(null);
  const [openMaterialPopover, setOpenMaterialPopover] = useState(false);
  const [openOperationPopover, setOpenOperationPopover] = useState(false);
  const [openToolingPopover, setOpenToolingPopover] = useState(false);
  const [costingOperationItemToCreate, setCostingOperationItemToCreate] =
    useState("");
  const [
    costingOperationItemToCreateRate,
    setCostingOperationItemToCreateRate,
  ] = useState<number | null>(null);
  const [costingToolingItemToCreate, setCostingToolingItemToCreate] =
    useState("");
  const [costingToolingItemToCreateRate, setCostingToolingItemToCreateRate] =
    useState<number | null>(null);
  const currentQuoteLineItem =
    api.costing.getQuoteLineItemCostingDetails.useQuery({
      id: quoteLineItemUid,
    });
  const materialCostingList =
    api.costing.getQuoteLineItemMaterialCosting.useQuery({
      quoteLineItemId: quoteLineItemUid,
    });
  const operationCostingList =
    api.costing.getQuoteLineItemOperationsCosting.useQuery({
      quoteLineItemId: quoteLineItemUid,
    });
  const toolingCostingList =
    api.costing.getQuoteLineItemToolingCosting.useQuery({
      quoteLineItemId: quoteLineItemUid,
    });
  const catalogMaterials = api.materialsCatalog.getOrgMaterials.useQuery();
  const catalogMachines = api.machinesCatalog.getOrgMachines.useQuery();
  const createMaterialCostingItem =
    api.costing.createMaterialCostingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemMaterialCosting.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemMaterialCosting.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.costing.getQuoteLineItemMaterialCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemMaterialCosting.invalidate();
        setCostingMaterialItemToCreate("");
      },
    });
  const handleCreateMaterialCostingItem = (e: React.SyntheticEvent) => {
    e.preventDefault();
    createMaterialCostingItem.mutate({
      quoteLineItemId: quoteLineItemUid,
      materialName: costingMaterialItemToCreate,
      rate: costingMaterialItemToCreateRate ?? null,
    });
  };
  const createOperationCostingItem =
    api.costing.createOperationCostingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemOperationsCosting.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemOperationsCosting.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.costing.getQuoteLineItemOperationsCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemOperationsCosting.invalidate();
        setCostingOperationItemToCreate("");
      },
    });
  const handleCreateOperationCostingItem = (e: React.SyntheticEvent) => {
    e.preventDefault();
    createOperationCostingItem.mutate({
      quoteLineItemId: quoteLineItemUid,
      operationName: costingOperationItemToCreate,
      rate: costingOperationItemToCreateRate ?? null,
    });
  };
  const createToolingCostingItem =
    api.costing.createToolingCostingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemToolingCosting.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemToolingCosting.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.costing.getQuoteLineItemToolingCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemToolingCosting.invalidate();
        setCostingToolingItemToCreate("");
      },
    });
  const handleCreateToolingCostingItem = (e: React.SyntheticEvent) => {
    e.preventDefault();
    createToolingCostingItem.mutate({
      quoteLineItemId: quoteLineItemUid,
      toolingName: costingToolingItemToCreate,
      rate: costingToolingItemToCreateRate ?? null,
    });
  };
  const deleteMaterialCostingItem =
    api.costing.deleteMaterialCostingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemMaterialCosting.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemMaterialCosting.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.costing.getQuoteLineItemMaterialCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemMaterialCosting.invalidate();
      },
    });
  const deleteToolingCostingItem =
    api.costing.deleteToolingCostingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemToolingCosting.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemToolingCosting.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.costing.getQuoteLineItemToolingCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemToolingCosting.invalidate();
      },
    });
  const deleteOperationCostingItem =
    api.costing.deleteOperationCostingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemOperationsCosting.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemOperationsCosting.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.costing.getQuoteLineItemOperationsCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemOperationsCosting.invalidate();
      },
    });
  const handleDelete = (costingItemId: string, costingType: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this item.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              if (costingType === "tooling") {
                deleteToolingCostingItem.mutate(costingItemId, {
                  onSuccess: () => {
                    toast({ title: "Deleted item" });
                  },
                });
              } else if (costingType === "material") {
                deleteMaterialCostingItem.mutate(costingItemId, {
                  onSuccess: () => {
                    toast({ title: "Deleted item" });
                  },
                });
              } else if (costingType === "operation") {
                deleteOperationCostingItem.mutate(costingItemId, {
                  onSuccess: () => {
                    toast({ title: "Deleted item" });
                  },
                });
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ToastAction>
        </>
      ),
    });
  };
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated" && currentQuoteLineItem.data) {
    return (
      <>
        <Head>
          <title>Quote • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col bg-muted">
          <HeaderNav currentPage={"quotes"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="container mx-16 max-w-7xl gap-12 ">
              <QuoteNav currentPage={"quote"} currentRfqId={rfqUid} />
              <div className="flex flex-col gap-4">
                <div className="mb-5 mt-4 flex h-fit w-full flex-col rounded-lg border bg-background p-8 shadow-sm">
                  <div className="flex items-center justify-start">
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
                    <h1 className="text-xl font-semibold tracking-tight">
                      {currentQuoteLineItem.data.partName} Part Costing
                    </h1>
                  </div>
                  <div>
                    <div className="mt-8 flex items-center justify-between">
                      <h2 className="text-lg font-medium">Materials</h2>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Add Material
                            <PlusCircle className="ml-2 h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Add Material or Material Markup
                            </DialogTitle>
                            <DialogDescription>
                              Click confirm to save material.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateMaterialCostingItem}>
                            <div className="grid gap-4 py-4">
                              <Popover
                                open={openMaterialPopover}
                                onOpenChange={setOpenMaterialPopover}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openMaterialPopover}
                                    className="w-[200px] justify-between"
                                  >
                                    {costingMaterialItemToCreate
                                      ? costingMaterialItemToCreate
                                      : "Select materials"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="right"
                                  className="overflow-y-auto p-0 "
                                >
                                  <Command>
                                    <CommandInput
                                      value={costingMaterialItemToCreate}
                                      onValueChange={
                                        setCostingMaterialItemToCreate
                                      }
                                      placeholder="Search materials"
                                      className="h-9"
                                    />
                                    <CommandGroup>
                                      {catalogMaterials.data?.map(
                                        (catalogMaterial) => (
                                          <CommandItem
                                            key={catalogMaterial.id}
                                            onSelect={(currentValue) => {
                                              setCostingMaterialItemToCreate(
                                                catalogMaterial.name
                                              );
                                              setCostingMaterialItemToCreateRate(
                                                catalogMaterial.rate
                                              );
                                              setOpenMaterialPopover(false);
                                            }}
                                          >
                                            {catalogMaterial.name}
                                          </CommandItem>
                                        )
                                      )}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {MaterialCostingTableHeaders.map(
                              (header, index) => (
                                <TableHead
                                  scope="col"
                                  key={index}
                                  className="w-1/3"
                                >
                                  {header.title}
                                </TableHead>
                              )
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materialCostingList.data?.map((materialLineItem) => (
                            <TableRow
                              key={materialLineItem.id}
                              onClick={() => {
                                console.log("Material Clicked");
                              }}
                            >
                              <TableCell className="w-[60px]">
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="bg-blue-100"
                                    >
                                      {materialLineItem.materialName}
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent className="min-w-[800px]">
                                    <SheetHeader>
                                      <SheetTitle>Material Costing</SheetTitle>
                                      <SheetDescription>
                                        Make changes to selected material
                                        costing here. Click save when
                                        you&apos;re done.
                                      </SheetDescription>
                                    </SheetHeader>
                                    <CostingMaterial
                                      quoteLineItemUid={quoteLineItemUid}
                                      materialItemId={materialLineItem.id}
                                      materialName={
                                        materialLineItem.materialName
                                      }
                                    />
                                  </SheetContent>
                                </Sheet>
                              </TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>
                                {" "}
                                {materialLineItem.unitCost &&
                                materialLineItem.materialMarkup
                                  ? materialLineItem.unitCost +
                                    materialLineItem.unitCost *
                                      (materialLineItem.materialMarkup / 100)
                                  : materialLineItem.unitCost
                                  ? materialLineItem.unitCost
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-[160px]"
                                  >
                                    <DropdownMenuItem
                                      onClick={handleDelete(
                                        materialLineItem.id,
                                        "material"
                                      )}
                                    >
                                      Delete item
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell>Material Cost Per Part</TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              {materialCostingList.data?.reduce(
                                (acc, materialLineItem) => {
                                  return (
                                    acc +
                                    (materialLineItem?.unitCost
                                      ? materialLineItem.unitCost +
                                        materialLineItem.unitCost *
                                          (materialLineItem.materialMarkup ??
                                            0 / 100)
                                      : 0)
                                  );
                                },
                                0
                              )}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <div className="mt-8 flex items-center justify-between">
                      <h2 className="text-lg font-medium">Operations</h2>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Add Operation
                            <PlusCircle className="ml-2 h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Operation</DialogTitle>
                            <DialogDescription>
                              Operation can be machining, finishing, labor,
                              transportation, or any operation used in creating
                              the part. Click confirm to save operation.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateOperationCostingItem}>
                            <div className="grid gap-4 py-4">
                              <Popover
                                open={openOperationPopover}
                                onOpenChange={setOpenOperationPopover}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openOperationPopover}
                                    className="w-[200px] justify-between"
                                  >
                                    {costingOperationItemToCreate
                                      ? costingOperationItemToCreate
                                      : "Select operations"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="right"
                                  className="overflow-y-auto p-0 "
                                >
                                  <Command>
                                    <CommandInput
                                      value={costingOperationItemToCreate}
                                      onValueChange={
                                        setCostingOperationItemToCreate
                                      }
                                      placeholder="Search operations"
                                      className="h-9"
                                    />
                                    <CommandGroup>
                                      {catalogMachines.data?.map(
                                        (catalogMachine) => (
                                          <CommandItem
                                            key={catalogMachine.id}
                                            onSelect={(currentValue) => {
                                              setCostingOperationItemToCreate(
                                                catalogMachine.name
                                              );
                                              setCostingOperationItemToCreateRate(
                                                catalogMachine.rate
                                              );
                                              setOpenOperationPopover(false);
                                            }}
                                          >
                                            {catalogMachine.name}
                                          </CommandItem>
                                        )
                                      )}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {OperationCostingTableHeaders.map(
                              (header, index) => (
                                <TableHead
                                  scope="col"
                                  key={index}
                                  className="w-1/4"
                                >
                                  {header.title}
                                </TableHead>
                              )
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operationCostingList.data?.map(
                            (operationLineItem) => (
                              <TableRow
                                key={operationLineItem.id}
                                onClick={() => {
                                  console.log("Operation Clicked");
                                }}
                              >
                                <TableCell className="w-[60px]">
                                  <Sheet>
                                    <SheetTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="bg-blue-100"
                                      >
                                        {operationLineItem.operationName}
                                      </Button>
                                    </SheetTrigger>
                                    <SheetContent className="min-w-[800px]">
                                      <SheetHeader>
                                        <SheetTitle>
                                          Operation Costing
                                        </SheetTitle>
                                        <SheetDescription>
                                          Make changes to selected operation
                                          costing here. Click save when
                                          you&apos;re done.
                                        </SheetDescription>
                                      </SheetHeader>
                                      <CostingOperation
                                        quoteLineItemUid={quoteLineItemUid}
                                        operationItemId={operationLineItem.id}
                                        operationName={
                                          operationLineItem.operationName
                                        }
                                      />
                                    </SheetContent>
                                  </Sheet>
                                </TableCell>
                                <TableCell>
                                  {operationLineItem.setUpTimeMinutes
                                    ? Number(operationLineItem.setUpTimeMinutes)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {operationLineItem.runTimeMinutes
                                    ? Number(operationLineItem.runTimeMinutes)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {operationLineItem.rate
                                    ? Number(operationLineItem.rate)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {operationLineItem.runTimeMinutes &&
                                  operationLineItem.setUpTimeMinutes &&
                                  operationLineItem.rate
                                    ? Number(
                                        Number(
                                          operationLineItem.setUpTimeMinutes
                                        ) *
                                          Number(operationLineItem.rate) +
                                          Number(
                                            operationLineItem.runTimeMinutes
                                          ) *
                                            Number(operationLineItem.rate)
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-[160px]"
                                    >
                                      <DropdownMenuItem
                                        onClick={handleDelete(
                                          operationLineItem.id,
                                          "operation"
                                        )}
                                      >
                                        Delete item
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                          <TableRow>
                            <TableCell>Operations Cost Per Part</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              {operationCostingList.data?.length &&
                              operationCostingList.data?.length > 0
                                ? operationCostingList.data
                                    .reduce((acc, operationLineItem) => {
                                      return (
                                        acc +
                                        (operationLineItem.runTimeMinutes &&
                                        operationLineItem.setUpTimeMinutes &&
                                        operationLineItem.rate
                                          ? Number(
                                              operationLineItem.setUpTimeMinutes
                                            ) *
                                              Number(operationLineItem.rate) +
                                            Number(
                                              operationLineItem.runTimeMinutes
                                            ) *
                                              Number(operationLineItem.rate)
                                          : 0)
                                      );
                                    }, 0)
                                    .toLocaleString() // Convert the number to a string
                                : "0"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Operation & Material Cost</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              {(materialCostingList.data?.reduce(
                                (acc, materialLineItem) => {
                                  return (
                                    acc +
                                    (materialLineItem?.unitCost
                                      ? materialLineItem.unitCost +
                                        materialLineItem.unitCost *
                                          ((materialLineItem.materialMarkup ??
                                            0) /
                                            100)
                                      : 0)
                                  );
                                },
                                0
                              ) || 0) +
                                (operationCostingList.data?.length &&
                                operationCostingList.data?.length > 0
                                  ? operationCostingList.data.reduce(
                                      (acc, operationLineItem) => {
                                        return (
                                          acc +
                                          (operationLineItem.runTimeMinutes &&
                                          operationLineItem.setUpTimeMinutes &&
                                          operationLineItem.rate
                                            ? Number(
                                                operationLineItem.setUpTimeMinutes
                                              ) *
                                                Number(operationLineItem.rate) +
                                              Number(
                                                operationLineItem.runTimeMinutes
                                              ) *
                                                Number(operationLineItem.rate)
                                            : 0)
                                        );
                                      },
                                      0
                                    )
                                  : 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <div className="mt-8 flex items-center justify-between">
                      <h2 className="text-lg font-medium">Tooling</h2>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Add Tooling Operation
                            <PlusCircle className="ml-2 h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Tooling Operation</DialogTitle>
                            <DialogDescription>
                              Tooling operation can be any operation used in
                              creating the tool for a part. Click confirm to
                              save tooling operation.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateToolingCostingItem}>
                            <div className="grid gap-4 py-4">
                              <Popover
                                open={openToolingPopover}
                                onOpenChange={setOpenToolingPopover}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openToolingPopover}
                                    className="w-[200px] justify-between"
                                  >
                                    {costingToolingItemToCreate
                                      ? costingToolingItemToCreate
                                      : "Select tooling operations"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="right"
                                  className="overflow-y-auto p-0 "
                                >
                                  <Command>
                                    <CommandInput
                                      value={costingToolingItemToCreate}
                                      onValueChange={
                                        setCostingToolingItemToCreate
                                      }
                                      placeholder="Search Operations"
                                      className="h-9"
                                    />
                                    <CommandGroup>
                                      {catalogMachines.data?.map(
                                        (catalogMachine) => (
                                          <CommandItem
                                            key={catalogMachine.id}
                                            onSelect={(currentValue) => {
                                              setCostingToolingItemToCreate(
                                                catalogMachine.name
                                              );
                                              setCostingToolingItemToCreateRate(
                                                catalogMachine.rate
                                              );
                                              setOpenToolingPopover(false);
                                            }}
                                          >
                                            {catalogMachine.name}
                                          </CommandItem>
                                        )
                                      )}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {ToolingCostingTableHeaders.map((header, index) => (
                              <TableHead
                                scope="col"
                                key={index}
                                className="w-1/4"
                              >
                                {header.title}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {toolingCostingList.data?.map((toolingLineItem) => (
                            <TableRow
                              key={toolingLineItem.id}
                              onClick={() => {
                                console.log("Tooling Operation Clicked");
                              }}
                            >
                              <TableCell className="w-[60px]">
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="bg-blue-100"
                                    >
                                      {toolingLineItem.name}
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent className="min-w-[800px]">
                                    <SheetHeader>
                                      <SheetTitle>Tooling Costing</SheetTitle>
                                      <SheetDescription>
                                        Make changes to selected tooling
                                        operation costing here. Click save when
                                        you&apos;re done.
                                      </SheetDescription>
                                    </SheetHeader>
                                    <CostingTooling
                                      quoteLineItemUid={quoteLineItemUid}
                                      toolingItemId={toolingLineItem.id}
                                      toolingOperationName={
                                        toolingLineItem.name
                                      }
                                    />
                                  </SheetContent>
                                </Sheet>
                              </TableCell>
                              <TableCell>
                                {toolingLineItem.toolingWeight
                                  ? Number(toolingLineItem.toolingWeight)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {toolingLineItem.toolingFactor
                                  ? Number(toolingLineItem.toolingFactor)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {toolingLineItem.rate
                                  ? Number(toolingLineItem.rate)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {toolingLineItem.toolingWeight &&
                                toolingLineItem.toolingFactor &&
                                toolingLineItem.rate
                                  ? (
                                      Number(toolingLineItem.toolingWeight) *
                                      Number(toolingLineItem.toolingFactor) *
                                      Number(toolingLineItem.rate)
                                    ).toFixed(2)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-[160px]"
                                  >
                                    <DropdownMenuItem
                                      onClick={handleDelete(
                                        toolingLineItem.id,
                                        "tooling"
                                      )}
                                    >
                                      Delete item
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell>Tooling Cost Per Part</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              {toolingCostingList.data?.length &&
                              toolingCostingList.data?.length > 0
                                ? toolingCostingList.data
                                    .reduce((acc, toolingLineItem) => {
                                      return (
                                        acc +
                                        (toolingLineItem.toolingWeight &&
                                        toolingLineItem.toolingFactor &&
                                        toolingLineItem.rate
                                          ? Number(
                                              toolingLineItem.toolingWeight
                                            ) *
                                            Number(
                                              toolingLineItem.toolingFactor
                                            ) *
                                            Number(toolingLineItem.rate)
                                          : 0)
                                      );
                                    }, 0)
                                    .toLocaleString() // Convert the number to a string
                                : "0"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
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

export default PartCosting;

import { TaxType, type Taxes } from "@prisma/client";
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import { regions, type RegionOption } from "~/utils/region";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Separator } from "./ui/separator";

const TaxRates: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const taxUid = String(uid);
  const [open, setOpen] = useState(false);
  const [isopen, setIsOpen] = useState(false);
  let optimisticUpdate = null;
  const [selectedTaxItem, setSelectedTaxItem] = useState<Taxes | null>(null);
  const utils = api.useContext();
  const currentTaxItem = api.taxes?.getOne.useQuery(taxUid, {
    cacheTime: 100,
  });
  const [selectedRegion, setSelectedRegion] = useState<RegionOption | null>();

  const handleChange = (selectedOption: RegionOption) => {
    setSelectedRegion(selectedOption as RegionOption | null);
  };

  const taxItems = api.taxes.getTaxItems.useQuery();
  const createTaxItem = api.taxes.createTaxItem.useMutation({
    onMutate: () => {
      // Cancel the getTaxItems query
      void utils.taxes.getTaxItems.cancel();
      optimisticUpdate = utils.taxes.getTaxItems.getData();
      if (optimisticUpdate) {
        utils.taxes?.getTaxItems.setData(undefined, optimisticUpdate);
      }
    },
    // Update the state when the mutation is successful
    onSettled: () => {
      void utils.taxes.getTaxItems.invalidate();
      setTaxRate(0);
      setTaxDesc("");
    },
  });
  const updateTaxRate = api.taxes.updateTaxRate.useMutation();
  const updateTaxType = api.taxes.updateTaxType.useMutation();
  const updateTaxDesc = api.taxes.updateTaxDesc.useMutation();
  const updateTaxRegion = api.taxes.updateTaxRegion.useMutation({
    onMutate: () => {
      void utils.taxes.getTaxItems.cancel();
      const optimisticUpdate = utils.taxes.getTaxItems.getData();
      if (optimisticUpdate) {
        utils.taxes.getTaxItems.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.taxes.getTaxItems.invalidate();
    },
  });

  const deleteTaxItem = api.taxes.deleteTaxItem.useMutation({
    onMutate: () => {
      void utils.taxes.getTaxItems.cancel();
      void utils.files.getFilesForRfqWithoutS3Urls.cancel();
      optimisticUpdate = utils.taxes.getTaxItems.getData();

      if (optimisticUpdate) {
        utils.taxes.getTaxItems.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.taxes.getTaxItems.invalidate();
    },
  });
  const [taxRate, setTaxRate] = useState<number>(0);
  const [taxDesc, setTaxDesc] = useState("");
  const [taxType, setTaxType] = useState(
    currentTaxItem?.data?.type
      ? String(currentTaxItem?.data?.type)
      : String(TaxType.SalesTax)
  );

  const handleTaxItem = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (taxUid) {
      createTaxItem.mutate({
        taxType: taxType
          ? TaxType[taxType as keyof typeof TaxType]
          : TaxType.SalesTax,
        taxRegion: selectedRegion ? selectedRegion.value : "",
        taxRate: Number(taxRate) ?? 0,
        taxDesc: taxDesc,
      });
    }
  };
  const handleUpdateTaxRate = (taxItemId: string, updatedTaxRate: number) => {
    if (taxItemId && updatedTaxRate >= 0) {
      updateTaxRate.mutate(
        {
          taxItemId: taxItemId,
          TaxRate: updatedTaxRate,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated Tax Rate" });
          },
          onError: (error) => {
            console.error("Error updating tax rate:", error);
          },
        }
      );
    }
  };
  const handleUpdateTaxDesc = (taxItemId: string, updatedTaxDesc: string) => {
    if (taxItemId && updatedTaxDesc.length > 0) {
      updateTaxDesc.mutate(
        {
          taxItemId: taxItemId,
          TaxDesc: updatedTaxDesc,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated Tax Description" });
          },
          onError: (error) => {
            console.error("Error updating tax description:", error);
          },
        }
      );
    }
  };
  const handleUpdateTaxType = (taxItemId: string, updatedTaxType: TaxType) => {
    if (taxItemId) {
      updateTaxType.mutate(
        {
          taxItemId: taxItemId,
          TaxType: updatedTaxType,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated Tax Type" });
          },
          onError: (error: any) => {
            console.error("Error updating tax type:", error);
          },
        }
      );
    }
  };
  const handleUpdateTaxRegion = (
    taxItemId: string,
    TaxRegion: string | null
  ) => {
    if (taxItemId && TaxRegion && TaxRegion.length > 0) {
      updateTaxRegion.mutate(
        {
          taxItemId: taxItemId,
          TaxRegion: TaxRegion ?? "",
        },
        {
          onSuccess: () => {
            toast({ title: "Updated Tax Region" });
            setSelectedRegion({
              label: TaxRegion,
              value: TaxRegion,
            });
          },
          onError: (error) => {
            console.error("Error updating tax region:", error);
          },
        }
      );
    }
  };

  const Headers = [
    {
      title: "TAX RATE ID",
    },
    {
      title: "TYPE",
    },
    {
      title: "REGION",
    },
    {
      title: "DESCRIPTION",
    },
    {
      title: "RATE",
    },
    {
      title: "CREATED AT",
    },
  ];
  const [isopenMap, setIsOpenMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const initialIsOpenMap: Record<string, boolean> = {};
    taxItems.data?.forEach((taxItem) => {
      initialIsOpenMap[taxItem.id] = false;
    });
    setIsOpenMap(initialIsOpenMap);
  }, [taxItems.data]);
  const handlePopoverOpen = (taxItemId: string) => {
    setIsOpenMap((prevState) => ({
      ...prevState,
      [taxItemId]: !prevState[taxItemId], // Toggle the state
    }));
  };

  useEffect(() => {
    setSelectedTaxItem(
      taxItems.data && taxItems.data?.length > 0
        ? taxItems.data[0]
          ? taxItems.data[0]
          : null
        : null
    );
  }, [taxItems.data, taxItems.isLoading]);
  const handleDelete = (taxId: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this item.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteTaxItem.mutate(taxId, {
                onSuccess: () => {
                  toast({ title: "Deleted item" });
                },
              });
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
  if (status === "authenticated" && taxItems.isSuccess) {
    return (
      <div>
        <div className="flex justify-between">
          <div>
            <h1 className="text-lg font-semibold ">Tax Rates</h1>
            <p>Manage your companies taxes here.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add taxes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  Add taxes
                </DialogTitle>
                <DialogDescription>
                  Click confirm to save tax.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTaxItem}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Select onValueChange={setTaxType}>
                      <SelectTrigger className="">
                        <SelectValue>
                          {taxType === TaxType.SalesTax
                            ? "Sales Tax"
                            : taxType === TaxType.GST
                            ? "GST"
                            : taxType === TaxType.VAT
                            ? "VAT"
                            : taxType === TaxType.Custom
                            ? "Custom"
                            : "Sales Tax"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaxType.SalesTax}>
                          Sales Tax
                        </SelectItem>
                        <SelectItem value={TaxType.GST}>GST</SelectItem>
                        <SelectItem value={TaxType.VAT}>VAT</SelectItem>
                        <SelectItem value={TaxType.Custom}>Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="justify-between"
                        >
                          {selectedRegion
                            ? regions.find(
                                (region) =>
                                  region.value === selectedRegion.value
                              )?.label
                            : "Select region..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-[240px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search countries"
                            className="h-9"
                          />
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup className="h-[200px]">
                            {regions.map((region) => (
                              <CommandItem
                                key={region.value}
                                onSelect={() => {
                                  handleChange(region);
                                  setOpen(false);
                                }}
                              >
                                {region.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Input
                      pattern="^\d*(\.\d{0,4})?$"
                      placeholder="Rate %"
                      onChange={(e) => {
                        setTaxRate(Number(e.target.value));
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Tax Description"
                      pattern=".{1,}"
                      onChange={(e) => {
                        setTaxDesc(e.target.value);
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
        <Separator className="my-8" />
        <div className="rounded-md bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                {Headers.map((header, index) => (
                  <TableHead scope="col" key={index}>
                    {header.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxItems.data?.map((taxItem: Taxes) => (
                <TableRow
                  key={taxItem.id}
                  onClick={() => setSelectedTaxItem(taxItem)}
                  className={
                    selectedTaxItem && selectedTaxItem.id === taxItem.id
                      ? ""
                      : ""
                  }
                >
                  <TableCell className="relative align-top">
                    {taxItem?.id}
                  </TableCell>
                  <TableCell className="relative align-top">
                    <div className="rounded-sm bg-background p-2">
                      <Select
                        defaultValue={taxItem.type ?? ""}
                        onValueChange={(selectedOption) => {
                          if (selectedOption !== taxItem.type) {
                            handleUpdateTaxType(
                              taxItem.id,
                              selectedOption as TaxType
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="max-w-[100px]">
                          <SelectValue>{taxItem.type ?? ""}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaxType.SalesTax}>
                            Sales Tax
                          </SelectItem>
                          <SelectItem value={TaxType.GST}>GST</SelectItem>
                          <SelectItem value={TaxType.VAT}>VAT</SelectItem>
                          <SelectItem value={TaxType.Custom}>Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="relative align-top">
                    <div className="rounded-sm bg-background p-2">
                      <Popover
                        open={isopenMap[taxItem.id]}
                        onOpenChange={() => handlePopoverOpen(taxItem.id)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isopen}
                            className="max-w-[150px] justify-between"
                          >
                            {taxItem.region
                              ? regions.find(
                                  (region) => region.value === taxItem.region
                                )?.label
                              : "Select region..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-[150px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search countries"
                              className="h-9"
                            />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup className="h-[200px]">
                              {regions.map((region) => (
                                <CommandItem
                                  key={region.value}
                                  onSelect={() => {
                                    handleUpdateTaxRegion(
                                      taxItem.id,
                                      region.value
                                    );
                                    setIsOpen(false); // Close the Popover
                                  }}
                                >
                                  {region.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                  <TableCell className="relative align-top">
                    <div className="rounded-sm bg-background p-2">
                      <Input
                        className="max-w-[100px]"
                        defaultValue={taxItem.description ?? ""}
                        onChange={(e) => {
                          setTaxDesc(e.target.value);
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== taxItem.description) {
                            handleUpdateTaxDesc(taxItem.id, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="relative align-top">
                    <div className="flex gap-1 rounded-sm bg-background p-2">
                      <Input
                        className="max-w-[100px]"
                        defaultValue={String(taxItem?.rate)}
                        onChange={(e) => {
                          setTaxRate(Number(e.target.value));
                        }}
                        onBlur={(e) => {
                          if (Number(e.target.value) !== Number(taxItem.rate)) {
                            handleUpdateTaxRate(
                              taxItem.id,
                              Number(e.target.value)
                            );
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="relative align-top">
                    {taxItem?.createdAt.toDateString()}
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
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={handleDelete(taxItem.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  return <Spinner />;
};
export default TaxRates;

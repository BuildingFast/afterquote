/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { toast } from "~/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";

interface CostingMaterialProps {
  quoteLineItemUid: string;
  materialItemId: string;
  materialName: string;
}

const CostingMaterial: React.FC<CostingMaterialProps> = ({
  quoteLineItemUid,
  materialItemId,
  materialName,
}) => {
  const utils = api.useContext();
  let optimisticUpdate = null;
  let optimisticUpdate2 = null;
  const [open, setOpen] = useState(false);
  const materialCostingItem = api.costing.getCostingMaterialItem.useQuery({
    materialCostingItemId: materialItemId,
  });
  const customMaterialCosting = api.costing.getMaterialCostingJson.useQuery();
  const [costingJson, setCostingJson] = useState(
    materialCostingItem.data?.costingJson
  );
  const [materialCostingObject, setMaterialCostingObject] = useState<{
    materialName: string | undefined;
    unitCost: number | null | undefined;
    materialMarkup: number | null | undefined;
  }>({
    materialName: materialCostingItem.data?.materialName,
    unitCost: materialCostingItem.data?.unitCost,
    materialMarkup: materialCostingItem.data?.materialMarkup,
  });
  const updateCostingJson = (key: string, newValue: any) => {
    setCostingJson((prevFields) => {
      if (typeof prevFields === "object" && prevFields !== null) {
        return {
          ...prevFields, // spread the previous fields into the new state
          [key]: newValue, // update the specific key with the new value
        };
      }

      // If prevFields is not an object, return a new object with just the key-value pair
      return { [key]: newValue };
    });
  };
  const updateMaterialCostingItem =
    api.costing.updateCostingMaterialItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemMaterialCosting.cancel();
        void utils.costing.getCostingMaterialItem.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemMaterialCosting.getData();
        optimisticUpdate2 = utils.costing.getCostingMaterialItem.getData();
        // Optimistically update to the new value
        if (optimisticUpdate && optimisticUpdate2) {
          utils.costing.getQuoteLineItemMaterialCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
          utils.costing.getCostingMaterialItem.setData(
            { materialCostingItemId: materialItemId },
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemMaterialCosting.invalidate();
        void utils.costing.getCostingMaterialItem.invalidate();
      },
      onSuccess: () => {
        toast({
          title: "Updated material costing",
        });
      },
    });
  function saveChangesClicked(event: any) {
    event.preventDefault();
    updateMaterialCostingItem.mutate({
      materialName: materialCostingObject.materialName ?? "",
      materialCostingItemId: materialItemId,
      costingJson: costingJson ?? null,
      unitCost: materialCostingObject.unitCost ?? null,
      materialMarkup: materialCostingObject.materialMarkup ?? null,
    });
  }
  useEffect(() => {
    let newJson = undefined;
    if (customMaterialCosting.data?.materialCostingFields) {
      newJson = Object.keys(
        customMaterialCosting.data?.materialCostingFields
      ).reduce((obj: { [key: string]: string }, key) => {
        obj[key] = "";
        return obj;
      }, {});
    }
    setCostingJson(materialCostingItem.data?.costingJson ?? newJson);
    setMaterialCostingObject({
      materialName: materialCostingItem.data?.materialName,
      unitCost: materialCostingItem.data?.unitCost,
      materialMarkup: materialCostingItem.data?.materialMarkup,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialCostingItem.isLoading, customMaterialCosting.isLoading]);
  return (
    <div className="overflow-scroll-y">
      <div>
        {materialCostingItem.data ? (
          <form onSubmit={saveChangesClicked}>
            <div className="col-span-2 mb-4 mt-2 grid w-full grid-cols-2 gap-4">
              <div>
                <Label>Material Name</Label>
                <Input
                  type="string"
                  value={materialCostingObject.materialName ?? undefined}
                  className="col-span-3"
                  onChange={(event) =>
                    setMaterialCostingObject({
                      materialName: event.target.value,
                      unitCost: materialCostingObject.unitCost,
                      materialMarkup: materialCostingObject.materialMarkup,
                    })
                  }
                />
              </div>
              <div></div>
            </div>
            <div className="col-span-2 mt-2 grid w-full grid-cols-4 gap-4">
              {costingJson &&
                typeof costingJson === "object" &&
                customMaterialCosting.data?.materialCostingFields &&
                typeof customMaterialCosting.data?.materialCostingFields ===
                  "object" &&
                Object.entries(
                  customMaterialCosting.data?.materialCostingFields
                ).map(([label, value]) => (
                  <div className="mb-1" key={label}>
                    <label
                      htmlFor="date"
                      className="mb-1 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {label}
                    </label>
                    {Array.isArray(value) ? (
                      <div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="max-w-[240px] justify-between"
                            >
                              {(costingJson as any)[label] ||
                                `Select ${label}...`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="max-w-[240px] p-0">
                            <Command>
                              <CommandInput
                                placeholder={`Search ${label}`}
                                className="h-9"
                              />
                              <CommandEmpty>{`No ${label} found.`}</CommandEmpty>
                              <CommandGroup className="h-[100px]">
                                {value.map((item) => (
                                  <CommandItem
                                    key={String(item)}
                                    onSelect={() => {
                                      updateCostingJson(label, item);
                                      setOpen(false);
                                    }}
                                  >
                                    {String(item)}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <input
                        type={value === "string" ? "text" : "number"}
                        className="block w-full rounded-lg border border-gray-300 bg-muted p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        value={
                          typeof (costingJson as any)[label] === "string"
                            ? String((costingJson as any)[label])
                            : String((costingJson as any)[label])
                        }
                        onChange={(event) =>
                          updateCostingJson(String(label), event.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
            </div>
            <div className="col-span-2 mt-2 grid w-full grid-cols-2 gap-4">
              <div>
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  value={materialCostingObject.unitCost ?? undefined}
                  className="col-span-3"
                  onChange={(event) =>
                    setMaterialCostingObject({
                      materialName: materialCostingObject.materialName,
                      unitCost: Number(event.target.value),
                      materialMarkup: materialCostingObject.materialMarkup,
                    })
                  }
                />
              </div>
              <div>
                <Label>Material Markup %</Label>
                <Input
                  type="number"
                  value={
                    String(materialCostingObject.materialMarkup) ?? undefined
                  }
                  className="col-span-3"
                  onChange={(event) =>
                    setMaterialCostingObject({
                      materialName: materialCostingObject.materialName,
                      unitCost: materialCostingObject.unitCost,
                      materialMarkup: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mb-4 mt-4">
              <Label>Material Costing</Label>
              <h1>
                {materialCostingObject.unitCost &&
                materialCostingObject.materialMarkup
                  ? materialCostingObject.unitCost +
                    materialCostingObject.unitCost *
                      (materialCostingObject.materialMarkup / 100)
                  : "-"}
              </h1>
            </div>
            <Button type="submit" className="float-right">
              Save changes
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default CostingMaterial;

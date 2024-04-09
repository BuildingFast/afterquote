/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { toast } from "~/components/ui/use-toast";

interface CostingToolingProps {
  quoteLineItemUid: string;
  toolingItemId: string;
  toolingOperationName: string;
}

const CostingTooling: React.FC<CostingToolingProps> = ({
  quoteLineItemUid,
  toolingItemId,
  toolingOperationName,
}) => {
  const utils = api.useContext();
  let optimisticUpdate = null;
  let optimisticUpdate2 = null;
  const toolingCostingItem = api.costing.getCostingToolingItem.useQuery({
    toolingCostingItemId: toolingItemId,
  });
  const [toolingCostingObject, setToolingCostingObject] = useState<{
    toolingOperationName: string | undefined;
    toolingWidth: number | null | undefined;
    toolingHeight: number | null | undefined;
    toolingLength: number | null | undefined;
    toolingWeight: number | null | undefined;
    toolingFactor: number | null | undefined;
    toolingRate: number | null | undefined;
  }>({
    toolingOperationName: toolingCostingItem.data?.name,
    toolingWidth: Number(toolingCostingItem.data?.toolingWidth),
    toolingHeight: Number(toolingCostingItem.data?.toolingHeight),
    toolingLength: Number(toolingCostingItem.data?.toolingLength),
    toolingWeight: Number(toolingCostingItem.data?.toolingWeight),
    toolingFactor: Number(toolingCostingItem.data?.toolingFactor),
    toolingRate: Number(toolingCostingItem.data?.rate),
  });
  const updateToolingCostingItem =
    api.costing.updateCostingToolingItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemToolingCosting.cancel();
        void utils.costing.getCostingToolingItem.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemToolingCosting.getData();
        optimisticUpdate2 = utils.costing.getCostingToolingItem.getData();
        // Optimistically update to the new value
        if (optimisticUpdate && optimisticUpdate2) {
          utils.costing.getQuoteLineItemToolingCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
          utils.costing.getCostingToolingItem.setData(
            { toolingCostingItemId: toolingItemId },
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemToolingCosting.invalidate();
        void utils.costing.getCostingToolingItem.invalidate();
      },
      onSuccess: () => {
        toast({
          title: "Updated tooling costing",
        });
      },
    });
  function saveChangesClicked(event: any) {
    event.preventDefault();
    updateToolingCostingItem.mutate({
      toolingOperationName: toolingCostingObject.toolingOperationName ?? "",
      toolingCostingItemId: toolingItemId,
      toolingWidth: toolingCostingObject.toolingWidth ?? null,
      toolingHeight: toolingCostingObject.toolingHeight ?? null,
      toolingLength: toolingCostingObject.toolingLength ?? null,
      toolingWeight: toolingCostingObject.toolingWeight ?? null,
      toolingFactor: toolingCostingObject.toolingFactor ?? null,
      toolingRate: toolingCostingObject.toolingRate ?? null,
    });
  }
  useEffect(() => {
    setToolingCostingObject({
      toolingOperationName: toolingCostingItem.data?.name,
      toolingWidth: Number(toolingCostingItem.data?.toolingWidth),
      toolingHeight: Number(toolingCostingItem.data?.toolingHeight),
      toolingLength: Number(toolingCostingItem.data?.toolingLength),
      toolingWeight: Number(toolingCostingItem.data?.toolingWeight),
      toolingFactor: Number(toolingCostingItem.data?.toolingFactor),
      toolingRate: Number(toolingCostingItem.data?.rate),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolingCostingItem.isLoading]);
  return (
    <div>
      <div className="grid gap-4 py-4">
        <h1>{toolingOperationName}</h1>
      </div>
      <div>
        {toolingCostingItem.data ? (
          <form onSubmit={saveChangesClicked}>
            <div className="col-span-2 mb-4 grid w-full grid-cols-2 gap-4">
              <div>
                <Label>Tooling Operation Name</Label>
                <Input
                  type="string"
                  value={toolingCostingObject.toolingOperationName ?? undefined}
                  className="col-span-3"
                  onChange={(event) =>
                    setToolingCostingObject({
                      toolingOperationName: event.target.value,
                      toolingWidth: toolingCostingObject.toolingWidth,
                      toolingHeight: toolingCostingObject.toolingHeight,
                      toolingLength: toolingCostingObject.toolingLength,
                      toolingWeight: toolingCostingObject.toolingWeight,
                      toolingFactor: toolingCostingObject.toolingFactor,
                      toolingRate: toolingCostingObject.toolingRate,
                    })
                  }
                />
              </div>
              <div>
                <Label>Length</Label>
                <Input
                  type="number"
                  value={
                    String(toolingCostingObject.toolingLength) ?? undefined
                  }
                  className="col-span-3"
                  onChange={(event) =>
                    setToolingCostingObject({
                      toolingOperationName:
                        toolingCostingObject.toolingOperationName,
                      toolingWidth: toolingCostingObject.toolingWidth,
                      toolingHeight: toolingCostingObject.toolingHeight,
                      toolingLength: Number(event.target.value),
                      toolingWeight: toolingCostingObject.toolingWeight,
                      toolingFactor: toolingCostingObject.toolingFactor,
                      toolingRate: toolingCostingObject.toolingRate,
                    })
                  }
                />
              </div>
            </div>
            <div className="col-span-2 grid w-full grid-cols-2 gap-4">
              <div>
                <Label>Weight</Label>
                <Input
                  type="number"
                  value={String(toolingCostingObject.toolingWidth) ?? undefined}
                  className="col-span-3"
                  onChange={(event) =>
                    setToolingCostingObject({
                      toolingOperationName:
                        toolingCostingObject.toolingOperationName,
                      toolingWidth: Number(event.target.value),
                      toolingHeight: toolingCostingObject.toolingHeight,
                      toolingLength: toolingCostingObject.toolingLength,
                      toolingWeight: toolingCostingObject.toolingWeight,
                      toolingFactor: toolingCostingObject.toolingFactor,
                      toolingRate: toolingCostingObject.toolingRate,
                    })
                  }
                />
              </div>
              <div>
                <Label>Height</Label>
                <Input
                  type="number"
                  value={
                    String(toolingCostingObject.toolingHeight) ?? undefined
                  }
                  className="col-span-3"
                  onChange={(event) =>
                    setToolingCostingObject({
                      toolingOperationName:
                        toolingCostingObject.toolingOperationName,
                      toolingWidth: toolingCostingObject.toolingWidth,
                      toolingHeight: Number(event.target.value),
                      toolingLength: toolingCostingObject.toolingLength,
                      toolingWeight: toolingCostingObject.toolingWeight,
                      toolingFactor: toolingCostingObject.toolingFactor,
                      toolingRate: toolingCostingObject.toolingRate,
                    })
                  }
                />
              </div>
              <div className="col-span-2 grid w-full grid-cols-3 gap-4">
                <div>
                  <Label>Weight</Label>
                  <Input
                    type="number"
                    value={
                      String(toolingCostingObject.toolingWeight) ?? undefined
                    }
                    className="col-span-3"
                    onChange={(event) =>
                      setToolingCostingObject({
                        toolingOperationName:
                          toolingCostingObject.toolingOperationName,
                        toolingWidth: toolingCostingObject.toolingWidth,
                        toolingHeight: toolingCostingObject.toolingHeight,
                        toolingLength: toolingCostingObject.toolingLength,
                        toolingWeight: Number(event.target.value),
                        toolingFactor: toolingCostingObject.toolingFactor,
                        toolingRate: toolingCostingObject.toolingRate,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Factor</Label>
                  <Input
                    type="number"
                    value={
                      String(toolingCostingObject.toolingFactor) ?? undefined
                    }
                    className="col-span-3"
                    onChange={(event) =>
                      setToolingCostingObject({
                        toolingOperationName:
                          toolingCostingObject.toolingOperationName,
                        toolingWidth: toolingCostingObject.toolingWidth,
                        toolingHeight: toolingCostingObject.toolingHeight,
                        toolingLength: toolingCostingObject.toolingLength,
                        toolingWeight: toolingCostingObject.toolingWeight,
                        toolingFactor: Number(event.target.value),
                        toolingRate: toolingCostingObject.toolingRate,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    value={
                      String(toolingCostingObject.toolingRate) ?? undefined
                    }
                    className="col-span-3"
                    onChange={(event) =>
                      setToolingCostingObject({
                        toolingOperationName:
                          toolingCostingObject.toolingOperationName,
                        toolingWidth: toolingCostingObject.toolingWidth,
                        toolingHeight: toolingCostingObject.toolingHeight,
                        toolingLength: toolingCostingObject.toolingLength,
                        toolingWeight: toolingCostingObject.toolingWeight,
                        toolingFactor: toolingCostingObject.toolingFactor,
                        toolingRate: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="float-right mt-8">
              Save changes
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default CostingTooling;

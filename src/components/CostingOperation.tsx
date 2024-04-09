/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { toast } from "~/components/ui/use-toast";

interface CostingOperationProps {
  quoteLineItemUid: string;
  operationItemId: string;
  operationName: string;
}

const CostingOperation: React.FC<CostingOperationProps> = ({
  quoteLineItemUid,
  operationItemId,
  operationName,
}) => {
  const utils = api.useContext();
  let optimisticUpdate = null;
  let optimisticUpdate2 = null;
  const operationCostingItem = api.costing.getCostingOperationItem.useQuery({
    operationCostingItemId: operationItemId,
  });
  const [operationCostingObject, setOperationCostingObject] = useState<{
    operationName: string | undefined;
    setUpTimeMinutes: number | null | undefined;
    runTimeMinutes: number | null | undefined;
    rate: number | null | undefined;
  }>({
    operationName: operationCostingItem.data?.operationName,
    setUpTimeMinutes: Number(operationCostingItem.data?.setUpTimeMinutes),
    runTimeMinutes: Number(operationCostingItem.data?.runTimeMinutes),
    rate: Number(operationCostingItem.data?.rate),
  });
  const updateOperationCostingItem =
    api.costing.updateCostingOperationItem.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.costing.getQuoteLineItemOperationsCosting.cancel();
        void utils.costing.getCostingOperationItem.cancel();
        // Snapshot the previous value
        optimisticUpdate =
          utils.costing.getQuoteLineItemOperationsCosting.getData();
        optimisticUpdate2 = utils.costing.getCostingOperationItem.getData();
        // Optimistically update to the new value
        if (optimisticUpdate && optimisticUpdate2) {
          utils.costing.getQuoteLineItemOperationsCosting.setData(
            { quoteLineItemId: quoteLineItemUid },
            optimisticUpdate
          );
          utils.costing.getCostingOperationItem.setData(
            { operationCostingItemId: operationItemId },
            optimisticUpdate2
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.costing.getQuoteLineItemOperationsCosting.invalidate();
        void utils.costing.getCostingOperationItem.invalidate();
      },
      onSuccess: () => {
        toast({
          title: "Updated operations costing",
        });
      },
    });
  function saveChangesClicked(event: any) {
    event.preventDefault();
    updateOperationCostingItem.mutate({
      operationName: operationCostingObject.operationName ?? "",
      operationCostingItemId: operationItemId,
      setUpTimeMinutes: operationCostingObject.setUpTimeMinutes ?? null,
      runTimeMinutes: operationCostingObject.runTimeMinutes ?? null,
      rate: operationCostingObject.rate ?? null,
    });
  }
  useEffect(() => {
    setOperationCostingObject({
      operationName: operationCostingItem.data?.operationName,
      setUpTimeMinutes: Number(operationCostingItem.data?.setUpTimeMinutes),
      runTimeMinutes: Number(operationCostingItem.data?.runTimeMinutes),
      rate: Number(operationCostingItem.data?.rate),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationCostingItem.isLoading]);
  return (
    <div>
      <div className="grid gap-4 py-4">
        <h1>{operationName}</h1>
      </div>
      <div>
        {operationCostingItem.data ? (
          <form onSubmit={saveChangesClicked}>
            <div className="col-span-2 mb-4 grid w-full grid-cols-2 gap-4">
              <div>
                <Label>Operation Name</Label>
                <Input
                  type="string"
                  value={operationCostingObject.operationName ?? undefined}
                  className="col-span-3"
                  onChange={(event) =>
                    setOperationCostingObject({
                      operationName: event.target.value,
                      setUpTimeMinutes: operationCostingObject.setUpTimeMinutes,
                      runTimeMinutes: operationCostingObject.runTimeMinutes,
                      rate: operationCostingObject.rate,
                    })
                  }
                />
              </div>
              <div>
                <Label>Rate</Label>
                <Input
                  type="number"
                  value={String(operationCostingObject.rate) ?? undefined}
                  className="col-span-3"
                  onChange={(event) =>
                    setOperationCostingObject({
                      operationName: operationCostingObject.operationName,
                      rate: Number(event.target.value),
                      runTimeMinutes: operationCostingObject.runTimeMinutes,
                      setUpTimeMinutes: operationCostingObject.setUpTimeMinutes,
                    })
                  }
                />
              </div>
            </div>
            <div className="col-span-2 grid w-full grid-cols-2 gap-4">
              <div>
                <Label>Set Up Time (Minutes)</Label>
                <Input
                  type="number"
                  value={
                    String(operationCostingObject.setUpTimeMinutes) ?? undefined
                  }
                  className="col-span-3"
                  onChange={(event) =>
                    setOperationCostingObject({
                      operationName: operationCostingObject.operationName,
                      rate: operationCostingObject.rate,
                      runTimeMinutes: operationCostingObject.runTimeMinutes,
                      setUpTimeMinutes: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Run Time (Minutes)</Label>
                <Input
                  type="number"
                  value={
                    String(operationCostingObject.runTimeMinutes) ?? undefined
                  }
                  className="col-span-3"
                  onChange={(event) =>
                    setOperationCostingObject({
                      operationName: operationCostingObject.operationName,
                      rate: operationCostingObject.rate,
                      runTimeMinutes: Number(event.target.value),
                      setUpTimeMinutes: operationCostingObject.setUpTimeMinutes,
                    })
                  }
                />
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

export default CostingOperation;

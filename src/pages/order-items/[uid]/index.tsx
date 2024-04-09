/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type OrderLineItem } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderNav from "~/components/HeaderNav";
import OrderNav from "~/components/OrderNav";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
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
import { Textarea } from "~/components/ui/textarea";
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import { getCurrencySymbol } from "~/utils/getCurrency";

const OrderInvoice: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const salesOrderUid = String(uid);
  const currentSalesOrder = api.salesOrder?.getOne.useQuery(salesOrderUid, {
    cacheTime: 100,
  });
  const [customerId, setCustomerId] = useState(
    currentSalesOrder.data?.customerId
  );
  let optimisticUpdate = null;
  const utils = api.useContext();
  const orderLineItems = api.orderItems.getOrderLineItems.useQuery({
    id: salesOrderUid,
  });
  const [selectedLineItem, setSelectedLineItem] =
    useState<OrderLineItem | null>(null);
  const createOrderLineItem = api.orderItems.createOrderLineItem.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.orderItems.getOrderLineItems.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.orderItems.getOrderLineItems.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.orderItems.getOrderLineItems.setData(
          { id: salesOrderUid },
          optimisticUpdate
        );
      }
    },
    // todo: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.orderItems.getOrderLineItems.invalidate();
      setPartName("");
      setPartNumber("");
      setPartQuantity(0);
    },
  });
  const updateOrderLineItemName =
    api.orderItems.updateOrderLineItemName.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.orderItems.getOrderLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.orderItems.getOrderLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.orderItems.getOrderLineItems.setData(
            { id: salesOrderUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.orderItems.getOrderLineItems.invalidate();
        setPartName("");
        setPartNumber("");
        setPartQuantity(0);
      },
    });
  const updateOrderLineItemDetails =
    api.orderItems.updateOrderLineItemDetails.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.orderItems.getOrderLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.orderItems.getOrderLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.orderItems.getOrderLineItems.setData(
            { id: salesOrderUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.orderItems.getOrderLineItems.invalidate();
        setPartName("");
        setPartDetails("");
        setPartNumber("");
        setPartQuantity(0);
      },
    });
  const updateOrderLineItemQuantity =
    api.orderItems.updateOrderLineItemQuantity.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.orderItems.getOrderLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.orderItems.getOrderLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.orderItems.getOrderLineItems.setData(
            { id: salesOrderUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.orderItems.getOrderLineItems.invalidate();
        setPartName("");
        setPartDetails("");
        setPartNumber("");
        setPartQuantity(0);
        setPartCost(0);
      },
    });
  const updateOrderLineItemCost =
    api.orderItems.updateOrderLineItemCost.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.orderItems.getOrderLineItems.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.orderItems.getOrderLineItems.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.orderItems.getOrderLineItems.setData(
            { id: salesOrderUid },
            optimisticUpdate
          );
        }
      },
      // todo: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.orderItems.getOrderLineItems.invalidate();
        setPartName("");
        setPartDetails("");
        setPartNumber("");
        setPartQuantity(0);
      },
    });
  const deleteOrderLineItem = api.orderItems.deleteOrderLineItem.useMutation({
    onMutate: () => {
      void utils.orderItems.getOrderLineItems.cancel();
      optimisticUpdate = utils.orderItems.getOrderLineItems.getData();
      if (optimisticUpdate) {
        utils.orderItems.getOrderLineItems.setData(
          { id: salesOrderUid },
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.orderItems.getOrderLineItems.invalidate();
    },
  });
  const [partName, setPartName] = useState("");
  const [partDetails, setPartDetails] = useState("");
  const [partNumber, setPartNumber] = useState<string | null>(null);
  const [partProcess, setPartProcess] = useState<string | null>(null);
  const [partMaterial, setPartMaterial] = useState<string | null>(null);
  const [partMachine, setPartMachine] = useState<string | null>(null);
  const [partFinish, setPartFinish] = useState<string | null>(null);
  const [partCost, setPartCost] = useState<number>(0);
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const handleCreateLineItem = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (customerId) {
      createOrderLineItem.mutate({
        salesOrderId: salesOrderUid,
        partName: partName,
        partNumber: partNumber ?? null,
        partQuantity: Number(partQuantity) ?? 1,
        partCost: Number(partCost) ?? 0,
      });
    }
  };
  const Headers = [
    {
      title: "Name",
    },
    {
      title: "Quantity",
    },
    {
      title: "Unit Cost",
    },
    {
      title: "Line Total",
    },
  ];

  useEffect(() => {
    setCustomerId(currentSalesOrder.data?.customerId);
    setSelectedLineItem(
      orderLineItems.data && orderLineItems.data?.length > 0
        ? orderLineItems.data[0]
          ? orderLineItems.data[0]
          : null
        : null
    );
  }, [
    currentSalesOrder.data?.customerId,
    currentSalesOrder.isLoading,
    orderLineItems.data,
    orderLineItems.isLoading,
  ]);
  const handleItemInputNameChange = (
    lineItemId: string,
    partName: string | null
  ) => {
    if (lineItemId && partName && partName.length > 0) {
      updateOrderLineItemName.mutate(
        {
          id: lineItemId,
          partName: partName ?? "",
        },
        {
          onSuccess: () => {
            toast({ title: "Updated name" });
          },
        }
      );
    }
  };
  const handleItemInputDetailsChange = (
    lineItemId: string,
    partName: string | null
  ) => {
    if (lineItemId && partName && partName.length > 0) {
      updateOrderLineItemDetails.mutate(
        {
          id: lineItemId,
          partDetails: partDetails ?? "",
        },
        {
          onSuccess: () => {
            toast({ title: "Updated item details" });
          },
        }
      );
    }
  };
  const handleItemInputQuantityChange = (
    lineItemId: string,
    partQuantity: number | null
  ) => {
    if (lineItemId && partQuantity) {
      updateOrderLineItemQuantity.mutate(
        {
          id: lineItemId,
          partQuantity: partQuantity ?? 1,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated quantity" });
          },
        }
      );
    }
  };
  const handleItemInputCostChange = (
    lineItemId: string,
    partCost: number | null
  ) => {
    if (lineItemId && partCost) {
      updateOrderLineItemCost.mutate(
        {
          id: lineItemId,
          partCost: partCost ?? 0,
        },
        {
          onSuccess: () => {
            toast({ title: "Updated part cost" });
          },
        }
      );
    }
  };
  const handleDelete = (lineItemId: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this item.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteOrderLineItem.mutate(lineItemId, {
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

  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const [orgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );

  function getLineTotal(
    partCost: number | null,
    partQuantity: number | null
  ): string {
    if (partCost && partQuantity) {
      return (Number(partCost) * Number(partQuantity)).toFixed(2);
    } else if (partCost && !partQuantity) {
      return Number(partCost).toFixed(2);
    } else {
      return "0.0";
    }
  }
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated" && orderLineItems.isSuccess) {
    return (
      <>
        <Head>
          <title>Invoice • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col bg-muted/40">
          <HeaderNav currentPage={"orders"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <div className="container relative gap-12 ">
              <OrderNav
                currentPage={"order-items"}
                currentOrderId={salesOrderUid}
              />
              <div>
                <div className="flex flex-col gap-4">
                  <div className="mb-5 mt-4 flex h-fit w-full flex-col rounded-sm ">
                    <div className="flex items-center justify-end">
                      <div className="grid grid-cols-2 gap-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">Add Part</Button>
                          </DialogTrigger>
                          <DialogContent className="">
                            <DialogHeader>
                              <DialogTitle>Add part</DialogTitle>
                              <DialogDescription>
                                Click confirm to save part.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateLineItem}>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <Input
                                    type="text"
                                    placeholder="Part Name"
                                    pattern=".{1,}"
                                    required
                                    value={partName}
                                    onChange={(e) => {
                                      setPartName(e.target.value);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Input
                                    pattern="^\d*(\.\d{0,4})?$"
                                    placeholder="Quantity (10, 15, 25)"
                                    onChange={(e) => {
                                      setPartQuantity(Number(e.target.value));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Input
                                    pattern="^\d*(\.\d{0,4})?$"
                                    placeholder="Part cost"
                                    onChange={(e) => {
                                      setPartCost(Number(e.target.value));
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
                        <Button asChild>
                          <Link href={`${salesOrderUid}/invoice_pdf`}>
                            Create invoice
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <Card className="mt-4 px-16 py-8 ">
                      <Table className="mt-4">
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
                          {orderLineItems.data?.map(
                            (lineItem: OrderLineItem) => (
                              <TableRow
                                key={lineItem.id}
                                onClick={() => setSelectedLineItem(lineItem)}
                                className={
                                  selectedLineItem &&
                                  selectedLineItem.id === lineItem.id
                                    ? ""
                                    : ""
                                }
                              >
                                <TableCell className="relative align-top">
                                  <Input
                                    className="static"
                                    defaultValue={lineItem.partName}
                                    onChange={(e) => {
                                      setPartName(e.target.value);
                                    }}
                                    onBlur={(e) => {
                                      if (
                                        e.target.value !== lineItem.partName
                                      ) {
                                        handleItemInputNameChange(
                                          lineItem.id,
                                          e.target.value
                                        );
                                      }
                                    }}
                                  />
                                  <Textarea
                                    placeholder="Item description"
                                    className="rounded-sm bg-background"
                                    defaultValue={lineItem.partDetails ?? ""}
                                    onChange={(e) => {
                                      setPartDetails(e.target.value);
                                    }}
                                    onBlur={(e) => {
                                      if (
                                        e.target.value !== lineItem.partName
                                      ) {
                                        handleItemInputDetailsChange(
                                          lineItem.id,
                                          e.target.value
                                        );
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="align-top">
                                  <Input
                                    className="max-w-[100px]"
                                    defaultValue={String(
                                      lineItem?.partQuantity
                                    )}
                                    onChange={(e) => {
                                      setPartQuantity(Number(e.target.value));
                                    }}
                                    onBlur={(e) => {
                                      if (
                                        Number(e.target.value) !==
                                        Number(lineItem.partQuantity)
                                      ) {
                                        handleItemInputQuantityChange(
                                          lineItem.id,
                                          Number(e.target.value)
                                        );
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="flex items-center align-top">
                                  <Input
                                    className="max-w-[100px]"
                                    defaultValue={String(lineItem?.partCost)}
                                    onChange={(e) => {
                                      setPartCost(Number(e.target.value));
                                    }}
                                    onBlur={(e) => {
                                      if (
                                        Number(e.target.value) !==
                                        Number(lineItem.partQuantity)
                                      ) {
                                        handleItemInputCostChange(
                                          lineItem.id,
                                          Number(e.target.value)
                                        );
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="align-top">
                                  <div className="font-bold">
                                    {getCurrencySymbol(
                                      currentSalesOrder.data?.currency
                                        ? currentSalesOrder.data?.currency
                                        : orgCurrency
                                    )}{" "}
                                    {getLineTotal(
                                      Number(lineItem?.partCost),
                                      Number(lineItem?.partQuantity)
                                    ) ?? 0}
                                  </div>
                                </TableCell>
                                <TableCell className="align-top">
                                  <div className="flex flex-row justify-between">
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
                                          onClick={handleDelete(lineItem.id)}
                                        >
                                          Delete item
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                          <TableRow>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {getCurrencySymbol(
                                  currentSalesOrder.data?.currency
                                    ? currentSalesOrder.data?.currency
                                    : orgCurrency
                                )}{" "}
                                {orderLineItems.data?.reduce(
                                  (acc, lineItem) =>
                                    acc +
                                    Number(
                                      getLineTotal(
                                        Number(lineItem.partCost),
                                        Number(lineItem.partQuantity)
                                      )
                                    ),
                                  0
                                ) ?? 0}
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
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

export default OrderInvoice;

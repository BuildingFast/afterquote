import { X } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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

const Operation: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const operationUid = String(uid);
  const currentOperation = api.operationsCatalog?.getOperation.useQuery(
    { id: operationUid },
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

  const [operationName, setOperationName] = useState(
    currentOperation.data?.name
  );
  const [operationRate, setOperationRate] = useState(
    currentOperation.data?.rate
  );
  const [operationToolingRate, setOperationToolingRate] = useState(
    currentOperation.data?.toolingRate
  );
  const [open, setOpen] = useState(false);

  const updateOperation = api.operationsCatalog.updateOperation.useMutation();
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (operationUid && operationName) {
      updateOperation.mutate(
        {
          id: operationUid,
          name: operationName,
          rate: operationRate ?? null,
          toolingRate: operationToolingRate ?? null,
        },
        {
          onSuccess: () => {
            console.log("Success");
            setOpen(false);
            toast({
              title: "Updated operation",
            });
          },
        }
      );
    }
  };
  useEffect(() => {
    setOperationName(currentOperation.data?.name);
    setOperationRate(currentOperation.data?.rate);
    setOperationToolingRate(currentOperation.data?.toolingRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOperation.isLoading]);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>{operationName} • Afterquote</title>
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
                    <h2 className="text-3xl font-bold tracking-tight">
                      {operationName}
                    </h2>
                    <div className="items-center">
                      <h1>Rate: </h1>
                      <h1 className="text-xl  ">
                        {getCurrencySymbol(orgCurrency)}
                        {operationRate}
                      </h1>
                    </div>
                    <div className="items-center">
                      <h1>Tooling rate: </h1>
                      <h1 className="text-xl">
                        {getCurrencySymbol(orgCurrency)}
                        {operationToolingRate}
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
                            Make changes to the operation here. Click save when
                            you&apos;re done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Operation name
                            </Label>
                            <Input
                              id="name"
                              value={operationName}
                              className="col-span-3"
                              onChange={(event) =>
                                setOperationName(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Rate
                            </Label>
                            <Input
                              type="number"
                              value={operationRate ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setOperationRate(Number(event.target.value))
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Tooling Rate
                            </Label>
                            <Input
                              type="number"
                              value={operationToolingRate ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setOperationToolingRate(
                                  Number(event.target.value)
                                )
                              }
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

export default Operation;

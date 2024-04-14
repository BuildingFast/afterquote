import { AtSign, Building, Pencil, Phone, StickyNote, X } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { default as ReactSelect } from "react-select";
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

const Material: NextPage = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const materialUid = String(uid);
  const currentMaterial = api.materialsCatalog?.getMaterial.useQuery(
    { id: materialUid },
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

  const [materialName, setMaterialName] = useState(currentMaterial.data?.name);
  const [materialRate, setMaterialRate] = useState(currentMaterial.data?.rate);
  const [open, setOpen] = useState(false);

  const updateMaterial = api.materialsCatalog.updateMaterial.useMutation();
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (materialUid && materialName) {
      updateMaterial.mutate(
        {
          id: materialUid,
          name: materialName,
          rate: materialRate ?? null,
        },
        {
          onSuccess: () => {
            console.log("Success");
            setOpen(false);
            toast({
              title: "Updated material",
            });
          },
        }
      );
    }
  };
  useEffect(() => {
    setMaterialName(currentMaterial.data?.name);
    setMaterialRate(currentMaterial.data?.rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMaterial.isLoading]);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>{materialName} • Afterquote</title>
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
                      {materialName}
                    </h2>
                    <div className="items-center">
                      <h1>Rate: </h1>
                      <h1 className="text-xl  ">
                        {getCurrencySymbol(orgCurrency)}
                        {materialRate}
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
                            Make changes to the material here. Click save when
                            you&apos;re done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Material name
                            </Label>
                            <Input
                              id="name"
                              value={materialName}
                              className="col-span-3"
                              onChange={(event) =>
                                setMaterialName(event.target.value)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Rate
                            </Label>
                            <Input
                              type="number"
                              value={materialRate ?? undefined}
                              className="col-span-3"
                              onChange={(event) =>
                                setMaterialRate(Number(event.target.value))
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

export default Material;

import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderNav from "~/components/HeaderNav";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const ProductCatalog: NextPage = () => {
  let optimisticUpdate = null;
  const utils = api.useContext();
  const { toast } = useToast();

  const { status } = useSession();
  const router = useRouter();
  const { uid } = router.query;
  const productUid = String(uid);

  const currentProduct = api.catalog?.getOne.useQuery(productUid, {
    cacheTime: 100,
  });

  const [name, setName] = useState(currentProduct.data?.name);
  const [unitCost, setUnitCost] = useState(currentProduct.data?.unitCost);
  const [units, setUnits] = useState(currentProduct.data?.units);

  const updateProductCatalog = api.catalog.updateCatalog.useMutation({
    // When mutate is called:
    onMutate: () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      void utils.catalog.getOne.cancel();
      // Snapshot the previous value
      optimisticUpdate = utils.catalog.getOne.getData();
      // Optimistically update to the new value
      if (optimisticUpdate) {
        utils.catalog.getOne.setData(productUid, optimisticUpdate);
      }
    },
    // TODO: need to add error case
    // Always refetch after error or success:
    onSettled: () => {
      void utils.catalog.getOne.invalidate();
    },
  });

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateProductCatalog.mutate(
      {
        name: name ? name : "",
        unitCost: unitCost ? Number(unitCost) : null,
        units: units ? units : "",
        id: productUid,
      },
      {
        onSuccess: (data: any) => {
          if (data) {
            toast({
              title: "Product updated",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Product did not update",
            });
          }
        },
      }
    );
  };

  useEffect(() => {
    setName(currentProduct.data?.name);
    setUnitCost(currentProduct.data?.unitCost);
    setUnits(currentProduct.data?.units);
  }, [
    currentProduct.data?.name,
    currentProduct.data?.unitCost,
    currentProduct.data?.units,
    currentProduct.isLoading,
  ]);

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (currentProduct.isLoading) {
    return <Spinner />;
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Product Details • Afterquote</title>
        </Head>
        <div className="flex h-max w-screen flex-col bg-muted">
          <HeaderNav currentPage={"catalog"} />
          <main className="flex min-h-screen w-screen flex-row justify-center ">
            <form
              className="mb-8 mt-4 flex h-fit flex-col gap-4 rounded-lg bg-background sm:border sm:p-8 sm:shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col items-start justify-between sm:flex-row">
                <h2 className="text-lg font-semibold">Product Details</h2>
                <Button className="right-10 top-3" type="submit">
                  Save
                </Button>
              </div>
              <div className="grid h-fit flex-col gap-3 rounded-lg">
                <div className="grid sm:grid-cols-3">
                  <div className="col-span-3 grid w-full grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-3">
                    <div>
                      <Label>Product Name</Label>
                      <Input
                        type="text"
                        placeholder="PI Number"
                        className="sm:max-w-[240px]"
                        value={name ? name : undefined}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </div>
                    <div className="">
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        placeholder="PO Number"
                        className="mb-2 sm:max-w-[240px]"
                        value={unitCost ? unitCost : undefined}
                        onChange={(event) =>
                          setUnitCost(Number(event.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label>Units</Label>
                      <Input
                        type="text"
                        placeholder="PI Number"
                        className="sm:max-w-[240px]"
                        value={units ? units : undefined}
                        onChange={(event) => setUnits(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </main>
        </div>
      </>
    );
  }
  return <Spinner />;
};

export default ProductCatalog;

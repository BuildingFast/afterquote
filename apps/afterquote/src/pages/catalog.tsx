import { type ProductsCatalog } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { FilePlus, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Layout from "~/components/Layout";
import { ProductDataTable } from "~/components/ProductDataTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const Catalog: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: productsCatalog } = api.catalog?.getAll.useQuery();
  const [openProductCatalogModal, setOpenProductCatalogModal] = useState(false);

  const utils = api.useContext();
  const columns: ColumnDef<ProductsCatalog>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => {
        return (
          <Link
            href={`/catalog/${String(row.original.id)}`}
            className="decoration-muted-foreground/50 underline-offset-2 hover:underline"
          >
            {row.original.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "unitCost",
      header: "Unit Cost",
      cell: ({ row }) => {
        return (
          <Link
            className="text-muted-foreground"
            href={`/catalog/${row.original.id}`}
          >
            {row.original.unitCost}
          </Link>
        );
      },
    },
    {
      accessorKey: "units",
      header: "Units",
      cell: ({ row }) => {
        return (
          <Link
            href={`/catalog/${row.original.id}`}
            className="text-muted-foreground"
          >
            {row.original.units}
          </Link>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex items-end justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-6 w-6 p-0 data-[state=open]:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full cursor-pointer items-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete record
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Your Product{" "}
                        <span className="font-bold">{row.original.name}</span>{" "}
                        will be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => softDelete(row.original.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const [productName, setProductName] = useState<string>("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [units, setUnits] = useState<string>("");

  const createCatalog = api.catalog.createCatalog.useMutation();
  const handleSubmitProductCatalog = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (productName && unitCost && units) {
      createCatalog.mutate(
        {
          name: productName,
          unitCost: unitCost,
          units: units,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              void router.push(`/catalog/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };

  const deleteCatalog = api.catalog?.deleteCatalog.useMutation({
    onMutate: () => {
      void utils.catalog?.getAll.cancel();
      const optimisticUpdate = utils.catalog?.getAll.getData();
      if (optimisticUpdate) {
        utils.catalog?.getAll.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      void utils.catalog?.getAll.invalidate();
    },
    onSuccess: () => {
      toast({
        title: "Deleted record successfully",
      });
    },
  });

  const softDelete = (id: string) => {
    deleteCatalog.mutate(id);
  };

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout headerTitle="Catalog • Afterquote" currentPage="catalog">
        <div className="flex flex-col justify-between sm:flex-row">
          <h1 className="text-xl font-semibold tracking-tight">
            Product Catalog
          </h1>
          <Dialog
            open={openProductCatalogModal}
            onOpenChange={setOpenProductCatalogModal}
          >
            <DialogTrigger asChild>
              <Button className="mt-2 w-fit sm:mt-0">Add Product</Button>
            </DialogTrigger>
            <DialogContent className="sm:min-w-[500px]">
              <form onSubmit={handleSubmitProductCatalog}>
                <DialogHeader>
                  <DialogTitle>Create new product</DialogTitle>
                  <DialogDescription>Click save when done.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Product Name
                    </Label>
                    <Input
                      type="text"
                      className="col-span-2"
                      placeholder="Steel Plates"
                      required
                      onChange={(event) => setProductName(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Unit Cost
                    </Label>
                    <Input
                      type="number"
                      className="col-span-2"
                      required
                      placeholder="120"
                      onChange={(event) =>
                        setUnitCost(Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Units
                    </Label>
                    <Input
                      type="text"
                      className="col-span-2"
                      required
                      placeholder="Pc"
                      onChange={(event) => setUnits(event.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="sm:px-none w-full ">
          {productsCatalog === undefined || productsCatalog.length === 0 ? (
            <div className="flex h-80 w-full items-center justify-center rounded-lg border shadow-sm">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-primary-foreground p-4">
                  <FilePlus className="h-[2rem] w-[2rem] text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-medium">
                    No products in catalog yet
                  </h2>
                  <p className="">
                    Create a new product by clicking on &apos;New Product&apos;
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setOpenProductCatalogModal(true)}
                >
                  Add Product
                </Button>
              </div>
            </div>
          ) : (
            <ProductDataTable
              columns={
                columns as ColumnDef<
                  {
                    name: string | null;
                    unitCost: number | null;
                    units: string | null;
                  },
                  unknown
                >[]
              }
              data={productsCatalog}
            />
          )}
        </div>
      </Layout>
    );
  }

  return <Spinner />;
};

export default Catalog;

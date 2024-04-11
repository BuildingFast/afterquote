/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { useState } from "react";
import { Plus, PlusCircle } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "~/components/Layout";
import PrimaryDataNav from "~/components/PrimaryDataNav";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useToast } from "~/components/ui/use-toast";
import { ToastAction } from "~/components/ui/toast";
import { api } from "~/utils/api";

const MaterialsCatalog: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const { toast } = useToast();
  const [materialName, setMaterialName] = useState<string | null>(null);
  const [materialRate, setMaterialRate] = useState<number | null>(null);
  const { data: materials } = api.materialsCatalog.getOrgMaterials.useQuery();
  const createMaterial = api.materialsCatalog.createOrgMaterial.useMutation();
  const deleteMaterial = api.materialsCatalog.deleteMaterialItem.useMutation({
    onMutate: () => {
      void utils.materialsCatalog.getOrgMaterials.cancel();
      optimisticUpdate = utils.materialsCatalog.getOrgMaterials.getData();

      if (optimisticUpdate) {
        utils.materialsCatalog.getOrgMaterials.setData(
          undefined,
          optimisticUpdate
        );
      }
    },
    onSettled: () => {
      void utils.materialsCatalog.getOrgMaterials.invalidate();
    },
  });
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (materialName) {
      createMaterial.mutate(
        {
          name: materialName,
          rate: materialRate,
        },
        {
          onSuccess: (data: unknown) => {
            if (data) {
              void router.push(`/materials/${(data as { id: string }).id}`);
            }
          },
        }
      );
    }
  };
  const handleDelete = (opId: string) => () => {
    toast({
      title: "Are You Sure?",
      description: "This will permanently delete this material.",
      action: (
        <>
          <ToastAction
            altText="Go"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              deleteMaterial.mutate(opId, {
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

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout
        headerTitle={"Primary Data • Afterquote"}
        currentPage="primary_data"
      >
        <PrimaryDataNav currentPage="materials" />
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <div className="mt-4 flex w-full flex-row justify-end">
                <Button>Add material</Button>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex  items-center">
                  Add Material
                </DialogTitle>
                <DialogDescription>
                  Click confirm to add material
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Material Name"
                      onChange={(e) => {
                        setMaterialName(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Rate"
                      onChange={(e) => {
                        setMaterialRate(Number(e.target.value));
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
        <div className="mt-4 rounded-md bg-background p-4 shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials?.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/materials/${(material as { id: string }).id}`}
                    >
                      {material.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material.rate}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right hover:underline"
                    onClick={handleDelete(material.id)}
                  >
                    Delete
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Layout>
    );
  }

  return <Spinner />;
};

export default MaterialsCatalog;

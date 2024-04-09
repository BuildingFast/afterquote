/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { dump } from "js-yaml";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import AccessDenied from "./AccessDenied";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const SalesOrderCustomFieldSettings: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const orderCustomFieldSchema =
    api.organization?.getOrganizationOrderFieldSchema.useQuery();

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            View Sales Order Custom Fields
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 h-96 overflow-x-auto rounded-md border-2 bg-slate-900 p-4 pr-12">
            <code className="text-slate-100">
              {dump(orderCustomFieldSchema.data?.orderCustomFieldSchema, {
                indent: 2,
              })}
            </code>
          </pre>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  return <AccessDenied />;
};

export default SalesOrderCustomFieldSettings;

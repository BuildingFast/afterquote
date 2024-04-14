import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import AccessDenied from "./AccessDenied";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

const ThemeSettings: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <div className="mb-4">
          <h1 className="text-lg font-semibold ">Color theme</h1>
          <p className="">Customize the color theme of the app.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Change theme</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex justify-between"
              onClick={() => setTheme("rose")}
            >
              Rose
              <div className="ml-4 h-2 w-2 rounded-full bg-rose-500"></div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onClick={() => setTheme("blue")}
            >
              Blue
              <div className="ml-4 h-2 w-2 rounded-full bg-blue-500"></div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onClick={() => setTheme("orange")}
            >
              Orange
              <div className="ml-4 h-2 w-2 rounded-full bg-orange-500"></div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onClick={() => setTheme("light")}
            >
              Gray
              <div className="ml-4 h-2 w-2 rounded-full bg-gray-500"></div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onClick={() => setTheme("dark")}
            >
              Dark
              <div className="ml-4 h-2 w-2 rounded-full bg-gray-950"></div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }
  return <AccessDenied />;
};
export default ThemeSettings;

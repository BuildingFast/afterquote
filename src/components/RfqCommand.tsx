import { useFeatureIsOn } from "@growthbook/growthbook-react";
import {
  BadgeHelp,
  Bell,
  Building,
  FileCheck,
  FileInput,
  MoonIcon,
  PieChart,
  Search,
  Settings,
  SunIcon,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "~/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";

export function CommandDialogDemo() {
  const { setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  const router = useRouter();
  const isKtex = useFeatureIsOn("is-ktex");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <div className="w-full flex-1 md:w-auto md:flex-none">
        <Button
          variant="outline"
          className={cn(
            "relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
          )}
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="flex w-full justify-between truncate">
            Search
            <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </span>
        </Button>
      </div>
      <Command>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Links">
              {!isKtex && (
                <CommandItem
                  onSelect={() => {
                    runCommand(() => router.push("/quotes"));
                  }}
                >
                  <FileInput className="mr-2 h-4 w-4" />
                  Quotes
                </CommandItem>
              )}
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("/orders"));
                }}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Orders
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("/companies"));
                }}
              >
                <Building className="mr-2 h-4 w-4" />
                <span>Companies</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("/people"));
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>People</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Other">
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("/reports"));
                }}
              >
                <PieChart className="mr-2 h-4 w-4" />
                Reports
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("/notifications"));
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("/settings"));
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Support">
              <CommandItem
                onSelect={() => {
                  runCommand(() => router.push("https://rfqtiger.com/docs"));
                }}
              >
                <BadgeHelp className="mr-2 h-4 w-4" />
                <span>Get help</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                <SunIcon className="mr-2 h-4 w-4" />
                Set light
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                <MoonIcon className="mr-2 h-4 w-4" />
                Set dark
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </Command>
    </>
  );
}

export default CommandDialogDemo;

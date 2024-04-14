import { HelpCircle, Loader2, Search } from "lucide-react";
import { Badge } from "~/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/utils";

const PrimaryText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <h1 className={cn("mt-8 text-2xl font-bold tracking-tight")}>{children}</h1>
  );
};
const SecondaryText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <p className="text-muted-foreground">{children}</p>;
};

export default function Design() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <div className="grid min-w-[700px] space-y-8">
          <PrimaryText>Afterquote Design System</PrimaryText>
          <Separator />
          <div>
            <SecondaryText>Tabs</SecondaryText>
            <Tabs defaultValue="team" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="customer-portal">
                  Customer Portal
                </TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="taxes">Taxes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Separator />
          <div>
            <SecondaryText>Buttons</SecondaryText>
            <div className="flex flex-row justify-start space-x-4">
              <Button variant={"default"}>Default</Button>
              <Button variant={"default"}>
                <HelpCircle className="mr-2 h-4 w-4" />
                With Icon{" "}
              </Button>
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
              <Button variant={"secondary"}>Secondary</Button>
              <Button variant={"outline"}>Outline</Button>
              <Button variant={"ghost"}>Ghost</Button>
              <Button variant={"link"}>Link</Button>
              <Button variant={"outline"} size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <SecondaryText>Badge</SecondaryText>
            <div className="flex flex-row justify-start space-x-4">
              <Badge variant={"default"}>Default</Badge>
              <Badge variant={"secondary"}>Secondary</Badge>
              <Badge variant={"destructive"}>Destructive</Badge>
              <Badge variant={"outline"}>Outline</Badge>
            </div>
          </div>
          <Separator />
          <div>
            <SecondaryText>Dialog</SecondaryText>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you are
                    done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      defaultValue="Pedro Duarte"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      defaultValue="@peduarte"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div>
            <SecondaryText>Tooltip</SecondaryText>
            <TooltipProvider>
              <Tooltip defaultOpen={true}>
                <TooltipTrigger asChild>
                  <Button variant="outline">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Hover
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Separator />
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <SecondaryText>Search Bar</SecondaryText>
            <Button
              variant="outline"
              className={cn(
                "relative w-full justify-start text-sm text-muted-foreground md:w-40 lg:w-64"
              )}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="flex w-full justify-between truncate">
                Search
                <kbd className="pointer-events-none mx-1.5 hidden h-5 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[12px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

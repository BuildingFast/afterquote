/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextPage } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { CalendarIcon, CheckIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { cn } from "~/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { toast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

enum QualityDecision {
  HOLD,
  REJECT,
}

const rejectionFormSchema = z.object({
  rollNumber: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(100, {
      message: "Name must not be longer than 100 characters.",
    }),
  customer: z.string({
    required_error: "Please select a customer.",
  }),
  dateOfRejection: z.date({
    required_error: "A rejection date is required.",
  }),
  actualWidth: z.coerce.number(),
  actualLength: z.coerce.number(),
  qualityDecision: z.nativeEnum(QualityDecision),
  qualityObservation: z.string().min(2, {
    message: "Observation must be at least 2 characters.",
  }),
  disposableMaterials: z.string(),
  submittedBy: z.string().min(2, {
    message: "Submitted by must be at least 2 character.",
  }),
  shiftNumber: z.string().min(1, {
    message: "Shift number must be at least 1 character.",
  }),
});

type RejectionFormValues = z.infer<typeof rejectionFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<RejectionFormValues> = {
  // name: "Your name",
  // dob: new Date("2023-01-23"),
  disposableMaterials: "",
};

const RejectionTrackingForm: NextPage = () => {
  const form = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues,
  });

  const router = useRouter();
  const { formId } = router.query;
  const formUid = String(formId);

  const submitRejectionForm =
    api.rejectionForm.submitRejectionForm.useMutation();

  function onSubmit(values: RejectionFormValues) {
    submitRejectionForm.mutate({
      formWidgetId: formUid,
      rollNumber: values.rollNumber,
      customer: values.customer,
      dateOfRejection: values.dateOfRejection,
      actualWidth: values.actualWidth,
      actualLength: values.actualLength,
      qualityDecision: values.qualityDecision,
      qualityObservation: values.qualityObservation,
      disposableMaterials: values.disposableMaterials,
      submittedBy: values.submittedBy,
      shiftNumber: values.shiftNumber,
    });
    form.reset({
      rollNumber: "",
      customer: "",
      dateOfRejection: undefined,
      actualWidth: 0,
      actualLength: 0,
      qualityDecision: undefined,
      qualityObservation: "",
      disposableMaterials: "",
      submittedBy: "",
      shiftNumber: "",
    });
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-green-500 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-8 my-4 space-y-4"
      >
        <h1 className="text-center text-xl font-semibold">
          Slit Roll Hold Reject Details Form
        </h1>
        <div className="grid w-full grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rollNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roll No./Slit No.</FormLabel>
                <FormControl>
                  <Input placeholder="Roll Number/Slit Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shiftNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift Number</FormLabel>
                <FormControl>
                  <Input placeholder="Shift Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid w-full grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dateOfRejection"
            render={({ field }) => (
              <FormItem className="mt-2.5 flex flex-col">
                <FormLabel>Rejection Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          " pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <FormControl>
                  <Input placeholder="Customer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid w-full grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="actualWidth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Width (mm)</FormLabel>
                <FormControl>
                  <Input placeholder="Width" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actualLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Length (Mtr)</FormLabel>
                <FormControl>
                  <Input placeholder="Length" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="qualityDecision"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Quality Decision</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value === QualityDecision["HOLD"] ||
                      field.value === QualityDecision["REJECT"]
                        ? QualityDecision[field.value]
                        : "Select quality decision"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Select quality decision..." />
                    <CommandEmpty></CommandEmpty>
                    <CommandGroup>
                      {(
                        Object.keys(QualityDecision) as Array<
                          keyof typeof QualityDecision
                        >
                      ).map((qd) =>
                        qd === "HOLD" || qd === "REJECT" ? (
                          <CommandItem
                            value={qd}
                            key={qd}
                            onSelect={() => {
                              form.setValue(
                                "qualityDecision",
                                QualityDecision[qd]
                              );
                            }}
                          >
                            {qd}
                          </CommandItem>
                        ) : null
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="qualityObservation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quality Observation</FormLabel>
              <FormControl>
                <Input placeholder="Quality Observation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="disposableMaterials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disposable Materials</FormLabel>
              <FormControl>
                <Input placeholder="Disposable Materials" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid w-full grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="submittedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submitted By</FormLabel>
                <FormControl>
                  <Input placeholder="Submitted By" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export default RejectionTrackingForm;

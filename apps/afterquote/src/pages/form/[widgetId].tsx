/* eslint-disable @typescript-eslint/no-misused-promises */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { cn } from "src/utils";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { Toaster } from "~/components/ui/toaster";
import { toast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";

const detailOptions = [
  {
    id: "1K Moulded Parts",
    value: "1K Moulded Parts",
  },
  {
    id: "2K Moulded Parts",
    value: "2K Moulded Parts",
  },
  {
    id: "Stamped Parts",
    value: "Stamped Parts",
  },
  {
    id: "Hybrid Moulded Parts and Assemblies",
    value: "Hybrid Moulded Parts and Assemblies",
  },
  {
    id: "Other",
    value: "Other",
  },
] as const;

const rfqFormSchema = z.object({
  fullName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  phone: z.string({
    required_error: "Please provide a phone number.",
  }),
  email: z
    .string({
      required_error: "Please provide an email for a response.",
    })
    .email(),
  companyName: z.string({
    required_error: "Please select or add a company name.",
  }),
  quoteRequiredBy: z.date({
    required_error: "Quote Required By is a required field.",
  }),
  deliveryTime: z.string(),
  details: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Select at least one item.",
  }),
  location: z.string(),
  message: z.string().min(2, {
    message: "Message must be at least 2 characters.",
  }),
});

type RfqFormValues = z.infer<typeof rfqFormSchema>;

export default function RfqForm() {
  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqFormSchema),
    mode: "onChange",
    defaultValues: {
      details: [],
    },
  });

  const router = useRouter();
  const { widgetId } = router.query;
  const widgetUid = String(widgetId);

  const submitWidget = api.website_form.submitWidgetForm.useMutation();

  function onSubmit(values: RfqFormValues) {
    console.log(values);
    submitWidget.mutate({
      formWidgetId: widgetUid,
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      companyName: values.companyName,
      quoteRequiredBy: values.quoteRequiredBy,
      deliveryTime: values.deliveryTime,
      details: values.details,
      message: values.message,
      location: values.location,
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
    <>
      <Head>
        <title>Submit an RFQ </title>
      </Head>
      <div className="mx-auto my-10 flex max-w-[500px] flex-col px-6 sm:px-0">
        <div className="max-w-[500px]">
          <h2 className="text-4xl font-bold tracking-tight">
            Request for quote
          </h2>
          <p className="text-muted-foreground">
            After clicking submit, someone from our office will contact you as
            soon as possible.
          </p>
        </div>
        <Separator className="my-6" />
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-8"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 9820012345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme, Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quoteRequiredBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote required by</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onDayClick={field.onChange}
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
                  name="deliveryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Delivery Time " />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="details"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        I am interested in:{" "}
                      </FormLabel>
                    </div>
                    {detailOptions.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="details"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          item.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item.value}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter Message"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>
      </div>
      <Toaster />
    </>
  );
}

import React, { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { toast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import { type CountryOption, countries } from "~/utils/countries";
import { Card } from "./ui/card";

const OrganizationAddress: React.FC = () => {
  const orgAddress = api.organization?.getOrganizationAddress.useQuery();
  const utils = api.useContext();
  let optimisticUpdate = null;
  const [orgAddressOne, setOrgAddressOne] = useState(
    orgAddress.data?.addressOne
  );
  const [orgAddressTwo, setOrgAddressTwo] = useState(
    orgAddress.data?.addressTwo
  );
  const [orgCity, setOrgCity] = useState(orgAddress.data?.addressCity);
  const [orgState, setOrgState] = useState(orgAddress.data?.addressState);
  const [orgZipCode, setOrgZipCode] = useState(orgAddress.data?.addressZip);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    orgAddress.data?.addressCountry
      ? {
          label: orgAddress.data?.addressCountry,
          value: orgAddress.data?.addressCountry,
        }
      : null
  );
  useEffect(() => {
    setOrgAddressOne(orgAddress.data?.addressOne);
    setOrgAddressTwo(orgAddress.data?.addressTwo);
    setOrgCity(orgAddress.data?.addressCity);
    setOrgState(orgAddress.data?.addressState);
    setOrgZipCode(orgAddress.data?.addressZip);
    setSelectedCountry(
      orgAddress.data?.addressCountry
        ? {
            label: orgAddress.data?.addressCountry,
            value: orgAddress.data?.addressCountry,
          }
        : null
    );
  }, [orgAddress.isLoading]);
  const [open, setOpen] = useState(false);
  const handleCountryChange = (selectedOption: CountryOption) => {
    setSelectedCountry(selectedOption as CountryOption | null);
    handleSubmit(selectedOption as CountryOption | null);
  };
  const updateOrgAddress =
    api.organization.updateOrganizationAddress.useMutation({
      // When mutate is called:
      onMutate: () => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        void utils.organization.getOrganizationAddress.cancel();
        // Snapshot the previous value
        optimisticUpdate = utils.organization.getOrganizationAddress.getData();
        // Optimistically update to the new value
        if (optimisticUpdate) {
          utils.organization.getOrganizationAddress.setData(
            undefined,
            optimisticUpdate
          );
        }
      },
      // TODO: need to add error case
      // Always refetch after error or success:
      onSettled: () => {
        void utils.organization.getOrganizationAddress.invalidate();
      },
    });
  const handleSubmit = (country: CountryOption | null) => {
    updateOrgAddress.mutate(
      {
        orgAddressOne: orgAddressOne ? orgAddressOne : null,
        orgAddressTwo: orgAddressTwo ? orgAddressTwo : null,
        orgAddressZip: orgZipCode ? orgZipCode : null,
        orgCity: orgCity ? orgCity : null,
        orgAddressState: orgState ? orgState : null,
        orgCountry: country ? country.value : null,
      },
      {
        onSuccess: (data: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (data && data?.id) {
            toast({
              title: "Organization Address updated",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Organization Address failed to update",
            });
          }
        },
      }
    );
  };
  return (
    <div className="mt-10 w-full">
      <div>
        <h1 className="text-lg font-semibold ">Address</h1>
        <p>Update Company Address</p>
      </div>
      <Card className="col-span-4 mt-4 grid w-1/2 grid-cols-2 gap-4 p-8">
        <div>
          <Label htmlFor="addressOne">Address 1</Label>
          <Input
            type="text"
            placeholder="Address 1"
            value={orgAddressOne ? orgAddressOne : undefined}
            className="max-w-[240px]"
            onChange={(event) => setOrgAddressOne(event.target.value)}
            onBlur={() => {
              handleSubmit(selectedCountry);
            }}
          />
        </div>
        <div>
          <Label htmlFor="addressTwo">Address 2</Label>
          <Input
            type="text"
            placeholder="Address 2"
            value={orgAddressTwo ? orgAddressTwo : undefined}
            className="max-w-[240px]"
            onChange={(event) => setOrgAddressTwo(event.target.value)}
            onBlur={() => {
              handleSubmit(selectedCountry);
            }}
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            type="text"
            placeholder="City"
            value={orgCity ? orgCity : undefined}
            className="max-w-[240px]"
            onChange={(event) => setOrgCity(event.target.value)}
            onBlur={() => {
              handleSubmit(selectedCountry);
            }}
          />
        </div>
        <div>
          <Label htmlFor="city">State</Label>
          <Input
            type="text"
            placeholder="State"
            value={orgState ? orgState : undefined}
            className="max-w-[240px]"
            onChange={(event) => setOrgState(event.target.value)}
            onBlur={() => {
              handleSubmit(selectedCountry);
            }}
          />
        </div>
        <div>
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            type="text"
            placeholder="Zip Code"
            value={orgZipCode ? orgZipCode : undefined}
            className="max-w-[240px]"
            onChange={(event) => setOrgZipCode(event.target.value)}
            onBlur={() => {
              handleSubmit(selectedCountry);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="max-w-[240px] justify-between"
              >
                {selectedCountry
                  ? countries.find(
                      (country) => country.value === selectedCountry.value
                    )?.label
                  : "Select country..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[240px] p-0">
              <Command>
                <CommandInput placeholder="Search countries" className="h-9" />
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup className="h-[200px]">
                  {countries.map((country) => (
                    <CommandItem
                      key={country.value}
                      onSelect={() => {
                        handleCountryChange(country);
                        setOpen(false);
                      }}
                    >
                      {country.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </Card>
    </div>
  );
};

export default OrganizationAddress;

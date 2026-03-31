"use client";

import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  charterPackageSchema,
  type CharterPackageInput,
  type CharterDepartureOptionInput,
  type CharterPackageHotelOptionInput,
  type CharterPackageAddonInput,
  inboundTypeConfigSchema,
  type InboundTypeConfig,
} from "@/lib/validations/charter-package";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/utils";
import { PackageType } from "@/services/packages/types";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/currency";

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface CharterPackageFormProps {
  initialData?: CharterPackageInput & {
    id?: string;
    departureOptions?: any[];
    hotelOptions?: any[];
    addons?: any[];
    priceOverrides?: Array<{
      currency: string;
      basePrice?: number | null;
      priceRangeMin?: number | null;
      priceRangeMax?: number | null;
    }>;
    typeConfig?: unknown;
  };
}

const DEFAULT_INBOUND_TYPE_CONFIG: InboundTypeConfig = {
  header: {
    campaignTitle: "",
    subtitle: "",
    durationText: "",
  },
  includes: [],
  excludes: [],
  itinerary: [],
  offer: {
    currentPrice: 0,
    oldPrice: null,
    currency: DEFAULT_CURRENCY,
    perPersonLabel: "Per Person",
    validUntilText: "",
  },
  contact: {
    phone: "",
    email: "",
    primaryAddress: "",
    secondaryAddress: null,
  },
  pickupLocations: [],
  transferOptions: [],
};

export function CharterPackageForm({
  initialData,
}: CharterPackageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const inboundConfigResult = inboundTypeConfigSchema.safeParse(initialData?.typeConfig);
  const initialInboundConfig = inboundConfigResult.success
    ? inboundConfigResult.data
    : DEFAULT_INBOUND_TYPE_CONFIG;
  const [mainImage, setMainImage] = useState<string | null>(
    initialData?.mainImage || null
  );
  const [gallery, setGallery] = useState<string[]>(
    (initialData?.gallery as string[]) || []
  );
  const [includedServices, setIncludedServices] = useState<string[]>(
    initialData?.includedServices || []
  );
  const [excludedServices, setExcludedServices] = useState<string[]>(
    initialData?.excludedServices || []
  );
  const [excursionProgram, setExcursionProgram] = useState<string[]>(
    initialData?.excursionProgram || []
  );
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(
    initialData?.requiredDocuments || []
  );
  const [departureOptions, setDepartureOptions] = useState<
    (CharterDepartureOptionInput & { 
      id?: string; 
      hotelPricings?: Array<{
        hotelOptionId: string;
        currency: string;
        roomTypePricings: Array<{
          roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
          adultPrice: number;
          childPrice6to12?: number | null;
          childPrice2to6?: number | null;
          infantPrice?: number | null;
          currency: string;
        }>;
      }>;
    })[]
  >(initialData?.departureOptions || []);
  const [hotelOptions, setHotelOptions] = useState<
    (CharterPackageHotelOptionInput & { id?: string; hotelId?: string })[]
  >(initialData?.hotelOptions || []);
  const [addons, setAddons] = useState<
    (CharterPackageAddonInput & { id?: string })[]
  >(initialData?.addons || []);
  const [priceOverrides, setPriceOverrides] = useState<
    Array<{
      currency: string;
      basePrice: number | null;
      priceRangeMin: number | null;
      priceRangeMax: number | null;
    }>
  >(
    initialData?.priceOverrides?.map((override) => ({
      currency: override.currency,
      basePrice: override.basePrice ?? null,
      priceRangeMin: override.priceRangeMin ?? null,
      priceRangeMax: override.priceRangeMax ?? null,
    })) || []
  );
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceInput, setServiceInput] = useState("");
  const [excursionInput, setExcursionInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");
  const [inboundIncludeInput, setInboundIncludeInput] = useState("");
  const [inboundExcludeInput, setInboundExcludeInput] = useState("");
  const [inboundPickupInput, setInboundPickupInput] = useState("");
  const [inboundTypeConfig, setInboundTypeConfig] = useState<InboundTypeConfig>(
    initialInboundConfig
  );

  useEffect(() => {
    fetch("/api/hotels?isActive=true")
      .then((res) => res.json())
      .then((data) => setHotels(data))
      .catch(console.error);
  }, []);

  const form = useForm<CharterPackageInput>({
    resolver: zodResolver(charterPackageSchema) as any,
    defaultValues: {
      type: (initialData?.type as PackageType) || PackageType.CHARTER,
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      shortDescription: initialData?.shortDescription || "",
      destinationCountry: initialData?.destinationCountry || "",
      destinationCity: initialData?.destinationCity || "",
      nights: initialData?.nights || 7,
      days: initialData?.days || 8,
      mainImage: initialData?.mainImage || null,
      gallery: (initialData?.gallery as string[]) || [],
      basePrice: initialData?.basePrice || null,
      priceRangeMin: initialData?.priceRangeMin || null,
      priceRangeMax: initialData?.priceRangeMax || null,
      currency: initialData?.currency || DEFAULT_CURRENCY,
      discount: initialData?.discount || null,
      isActive: initialData?.isActive ?? true,
      includedServices: initialData?.includedServices || [],
      excludedServices: initialData?.excludedServices || [],
      excursionProgram: initialData?.excursionProgram || [],
      requiredDocuments: initialData?.requiredDocuments || [],
      typeConfig: initialData?.typeConfig ?? null,
      priceOverrides:
        initialData?.priceOverrides?.map((override) => ({
          currency: override.currency as "EGP" | "USD",
          basePrice: override.basePrice ?? null,
          priceRangeMin: override.priceRangeMin ?? null,
          priceRangeMax: override.priceRangeMax ?? null,
        })) || [],
    },
  });
  const selectedPackageType = form.watch("type");
  const isInbound = selectedPackageType === PackageType.INBOUND;

  useEffect(() => {
    // Keep schema-validated form value in sync with inbound editor state.
    // Without this, inbound submissions fail zodResolver because typeConfig remains null.
    if (isInbound) {
      form.setValue("typeConfig", inboundTypeConfig, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      form.setValue("typeConfig", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, inboundTypeConfig, isInbound]);

  const handleImageUpload = async (file: File, isMain = false) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/charter-packages/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (isMain) {
        setMainImage(data.url);
        form.setValue("mainImage", data.url);
      } else {
        const newGallery = [...gallery, data.url];
        setGallery(newGallery);
        form.setValue("gallery", newGallery);
      }
      toast({
        title: "Image uploaded",
        description: "The image has been uploaded successfully.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Failed to upload image",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addService = (type: "included" | "excluded") => {
    if (serviceInput.trim()) {
      if (type === "included") {
        const newServices = [...includedServices, serviceInput.trim()];
        setIncludedServices(newServices);
        form.setValue("includedServices", newServices);
      } else {
        const newServices = [...excludedServices, serviceInput.trim()];
        setExcludedServices(newServices);
        form.setValue("excludedServices", newServices);
      }
      setServiceInput("");
    }
  };

  const removeService = (index: number, type: "included" | "excluded") => {
    if (type === "included") {
      const newServices = includedServices.filter((_, i) => i !== index);
      setIncludedServices(newServices);
      form.setValue("includedServices", newServices);
    } else {
      const newServices = excludedServices.filter((_, i) => i !== index);
      setExcludedServices(newServices);
      form.setValue("excludedServices", newServices);
    }
  };

  const addExcursion = () => {
    if (excursionInput.trim()) {
      const newExcursions = [...excursionProgram, excursionInput.trim()];
      setExcursionProgram(newExcursions);
      form.setValue("excursionProgram", newExcursions);
      setExcursionInput("");
    }
  };

  const removeExcursion = (index: number) => {
    const newExcursions = excursionProgram.filter((_, i) => i !== index);
    setExcursionProgram(newExcursions);
    form.setValue("excursionProgram", newExcursions);
  };

  const addDocument = () => {
    if (documentInput.trim()) {
      const newDocuments = [...requiredDocuments, documentInput.trim()];
      setRequiredDocuments(newDocuments);
      form.setValue("requiredDocuments", newDocuments);
      setDocumentInput("");
    }
  };

  const removeDocument = (index: number) => {
    const newDocuments = requiredDocuments.filter((_, i) => i !== index);
    setRequiredDocuments(newDocuments);
    form.setValue("requiredDocuments", newDocuments);
  };

  const addInboundListItem = (
    key: "includes" | "excludes" | "pickupLocations",
    value: string
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setInboundTypeConfig((prev) => ({
      ...prev,
      [key]: [...prev[key], trimmed],
    }));
  };

  const removeInboundListItem = (
    key: "includes" | "excludes" | "pickupLocations",
    index: number
  ) => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const addInboundItineraryItem = () => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        {
          dayLabel: `Day ${prev.itinerary.length + 1}`,
          title: "",
          description: "",
        },
      ],
    }));
  };

  const updateInboundItineraryItem = (
    index: number,
    field: "dayLabel" | "title" | "description",
    value: string
  ) => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeInboundItineraryItem = (index: number) => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  };

  const addInboundTransferOption = () => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      transferOptions: [
        ...prev.transferOptions,
        {
          id: `transfer-${prev.transferOptions.length + 1}`,
          name: "",
          price: 0,
        },
      ],
    }));
  };

  const updateInboundTransferOption = (
    index: number,
    field: "id" | "name" | "price",
    value: string | number
  ) => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      transferOptions: prev.transferOptions.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeInboundTransferOption = (index: number) => {
    setInboundTypeConfig((prev) => ({
      ...prev,
      transferOptions: prev.transferOptions.filter((_, i) => i !== index),
    }));
  };

  const addDepartureOption = () => {
    setDepartureOptions([
      ...departureOptions,
      {
        departureAirport: "",
        arrivalAirport: "",
        departureDate: new Date(),
        returnDate: new Date(),
        flightInfo: null,
        priceModifier: null,
        currency: DEFAULT_CURRENCY,
        isActive: true,
        hotelPricings: [],
      },
    ]);
  };

  const updateDepartureOption = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...departureOptions];
    updated[index] = { ...updated[index], [field]: value };
    setDepartureOptions(updated);
  };

  const removeDepartureOption = (index: number) => {
    setDepartureOptions(departureOptions.filter((_, i) => i !== index));
  };

  const addHotelOption = () => {
    setHotelOptions([
      ...hotelOptions,
      {
        hotelId: "",
        starRating: null,
        bookingRating: null,
        distanceFromCenter: null,
        isActive: true,
      },
    ]);
  };

  const updateHotelOption = (index: number, field: string, value: any) => {
    const updated = [...hotelOptions];
    updated[index] = { ...updated[index], [field]: value };
    setHotelOptions(updated);
  };

  const removeHotelOption = (index: number) => {
    setHotelOptions(hotelOptions.filter((_, i) => i !== index));
  };

  const addAddon = () => {
    setAddons([
      ...addons,
      {
        name: "",
        description: null,
        price: 0,
        currency: DEFAULT_CURRENCY,
        isRequired: false,
        isActive: true,
      },
    ]);
  };

  const updateAddon = (index: number, field: string, value: any) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    setAddons(updated);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CharterPackageInput) => {
    setSubmitting(true);
    try {
      const url = initialData?.id
        ? `/api/charter-packages/${initialData.id}`
        : "/api/charter-packages";
      const method = initialData?.id ? "PUT" : "POST";

      const packageData = {
        ...data,
        mainImage,
        gallery,
        includedServices,
        excludedServices,
        excursionProgram,
        requiredDocuments,
        typeConfig: isInbound ? inboundTypeConfig : null,
        priceOverrides,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save package");
      }

      const savedPackage = await response.json();

      if (!isInbound) {
        // Save hotel options first to get their IDs
        const hotelOptionIdMap = new Map<string, string>(); // Maps temp ID or existing ID to actual ID
        for (let i = 0; i < hotelOptions.length; i++) {
          const option = hotelOptions[i];
          // Use index-based temp ID for new options, existing ID for saved options
          const tempKey = option.id || `temp_${i}`;
          
          if (option.id) {
            // Existing hotel option - update it
            await fetch(
              `/api/charter-packages/${savedPackage.id}/hotel-options/${option.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(option),
              }
            );
            hotelOptionIdMap.set(tempKey, option.id);
          } else {
            // New hotel option - save and get the ID
            const response = await fetch(
              `/api/charter-packages/${savedPackage.id}/hotel-options`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(option),
              }
            );
            if (!response.ok) {
              throw new Error(`Failed to save hotel option: ${response.statusText}`);
            }
            const savedOption = await response.json();
            // Map the temp key to the new ID
            hotelOptionIdMap.set(tempKey, savedOption.id);
          }
        }

        // Save departure options with hotel pricings
        for (const option of departureOptions) {
          // Map hotel pricings: map hotel option IDs to actual IDs
          let mappedHotelPricings: Array<{
            hotelOptionId: string;
            currency: string;
            roomTypePricings: Array<{
              roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
              adultPrice: number;
              childPrice6to12?: number | null;
              childPrice2to6?: number | null;
              infantPrice?: number | null;
              currency: string;
            }>;
          }> = [];

          if (option.hotelPricings && option.hotelPricings.length > 0) {
            mappedHotelPricings = option.hotelPricings.map((hp) => {
              // Map hotel option ID
              const mappedHotelOptionId = hotelOptionIdMap.get(hp.hotelOptionId) || 
                (hotelOptions.some((opt) => opt.id === hp.hotelOptionId) ? hp.hotelOptionId : null);
              
              if (!mappedHotelOptionId) {
                throw new Error(`Hotel option ${hp.hotelOptionId} not found`);
              }

              return {
                hotelOptionId: mappedHotelOptionId,
                currency: hp.currency || DEFAULT_CURRENCY,
                roomTypePricings: hp.roomTypePricings || [],
              };
            }).filter((hp) => hp.hotelOptionId !== null);
          }

          const departureData = {
            departureAirport: option.departureAirport,
            arrivalAirport: option.arrivalAirport,
            departureDate: option.departureDate,
            returnDate: option.returnDate,
            flightInfo: option.flightInfo,
            priceModifier: option.priceModifier,
            currency: option.currency,
            isActive: option.isActive,
            hotelPricings: mappedHotelPricings,
          };

          if (option.id) {
            const response = await fetch(
              `/api/charter-packages/${savedPackage.id}/departure-options/${option.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(departureData),
              }
            );
            if (!response.ok) {
              const error = await response.json().catch(() => ({}));
              console.error("Error updating departure option:", error);
              throw new Error(error.message || "Failed to update departure option");
            }
          } else {
            const response = await fetch(
              `/api/charter-packages/${savedPackage.id}/departure-options`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(departureData),
              }
            );
            if (!response.ok) {
              const error = await response.json().catch(() => ({}));
              console.error("Error creating departure option:", error);
              throw new Error(error.message || "Failed to create departure option");
            }
          }
        }

        for (const addon of addons) {
          if (addon.id) {
            await fetch(
              `/api/charter-packages/${savedPackage.id}/addons/${addon.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addon),
              }
            );
          } else {
            await fetch(`/api/charter-packages/${savedPackage.id}/addons`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(addon),
            });
          }
        }
      }

      toast({
        title: initialData ? "Package updated!" : "Package created!",
        description: "The charter package has been saved successfully.",
        variant: "success",
      });
      router.push("/admin/charter-packages");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving package:", error);
      toast({
        title: "Failed to save package",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<CharterPackageInput>) => {
    const firstErrorEntry = Object.entries(errors)[0];
    const firstMessage =
      firstErrorEntry && typeof firstErrorEntry[1]?.message === "string"
        ? String(firstErrorEntry[1].message)
        : "Please check required fields in Basic, Pricing, and Inbound tabs.";

    console.error("Package form validation errors:", errors);
    toast({
      title: "Form validation failed",
      description: firstMessage,
      variant: "destructive",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className={`grid w-full ${isInbound ? "grid-cols-4" : "grid-cols-6"}`}>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            {isInbound ? (
              <TabsTrigger value="inbound">Inbound Content</TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="departures">Departures</TabsTrigger>
                <TabsTrigger value="hotels">Hotels</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || PackageType.CHARTER}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PackageType.CHARTER}>
                          Charter Package (with flights)
                        </SelectItem>
                        <SelectItem value={PackageType.INBOUND}>
                          Inbound Package (no international flights)
                        </SelectItem>
                        <SelectItem value={PackageType.REGULAR}>
                          Regular Package
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of package. Charter includes flights, Inbound is for local tourism.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-generate slug from name if slug is empty
                          const currentSlug = form.getValues("slug");
                          if (!currentSlug || currentSlug === slugify(form.getValues("name") || "")) {
                            form.setValue("slug", slugify(e.target.value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                        onBlur={(e) => {
                          // Auto-generate slug if empty when name is available
                          if (!e.target.value && form.getValues("name")) {
                            const generatedSlug = slugify(form.getValues("name"));
                            field.onChange(generatedSlug);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      URL-friendly version of the name (auto-generated from name if empty)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinationCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinationCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nights</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardHeader>
                <CardTitle>Main Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mainImage && (
                  <div className="relative w-64 h-48 group">
                    <img
                      src={mainImage}
                      alt="Main image"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setMainImage(null);
                        form.setValue("mainImage", null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, true);
                  }}
                  disabled={uploading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          const newGallery = gallery.filter((_, i) => i !== index);
                          setGallery(newGallery);
                          form.setValue("gallery", newGallery);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, false);
                  }}
                  disabled={uploading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceRangeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Range Min (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceRangeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Range Max (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount % (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Per-Currency Price Overrides</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setPriceOverrides((prev) => [
                        ...prev,
                        {
                          currency: DEFAULT_CURRENCY,
                          basePrice: null,
                          priceRangeMin: null,
                          priceRangeMax: null,
                        },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Override
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {priceOverrides.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No overrides configured. Base package currency values will be used with FX fallback.
                  </p>
                ) : null}
                {priceOverrides.map((override, index) => (
                  <div key={`${override.currency}-${index}`} className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-5">
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <Select
                        value={override.currency}
                        onValueChange={(value) =>
                          setPriceOverrides((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, currency: value } : item))
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Base Price</label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.01"
                        value={override.basePrice ?? ""}
                        onChange={(e) =>
                          setPriceOverrides((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    basePrice: e.target.value ? Number(e.target.value) : null,
                                  }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Range Min</label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.01"
                        value={override.priceRangeMin ?? ""}
                        onChange={(e) =>
                          setPriceOverrides((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    priceRangeMin: e.target.value ? Number(e.target.value) : null,
                                  }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Range Max</label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.01"
                        value={override.priceRangeMax ?? ""}
                        onChange={(e) =>
                          setPriceOverrides((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    priceRangeMax: e.target.value ? Number(e.target.value) : null,
                                  }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setPriceOverrides((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {isInbound && (
            <TabsContent value="inbound" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Poster Header</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Title *</label>
                    <Input
                      value={inboundTypeConfig.header.campaignTitle}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          header: { ...prev.header, campaignTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration Text *</label>
                    <Input
                      value={inboundTypeConfig.header.durationText}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          header: { ...prev.header, durationText: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Subtitle *</label>
                    <Textarea
                      rows={2}
                      value={inboundTypeConfig.header.subtitle}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          header: { ...prev.header, subtitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Includes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={inboundIncludeInput}
                        onChange={(e) => setInboundIncludeInput(e.target.value)}
                        placeholder="Add include item"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addInboundListItem("includes", inboundIncludeInput);
                          setInboundIncludeInput("");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul className="space-y-1">
                      {inboundTypeConfig.includes.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-center justify-between text-sm">
                          <span>{item}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeInboundListItem("includes", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Excludes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={inboundExcludeInput}
                        onChange={(e) => setInboundExcludeInput(e.target.value)}
                        placeholder="Add exclude item"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addInboundListItem("excludes", inboundExcludeInput);
                          setInboundExcludeInput("");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul className="space-y-1">
                      {inboundTypeConfig.excludes.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-center justify-between text-sm">
                          <span>{item}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeInboundListItem("excludes", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Itinerary</CardTitle>
                    <Button type="button" onClick={addInboundItineraryItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Day
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inboundTypeConfig.itinerary.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Itinerary Item {index + 1}</span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeInboundItineraryItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={item.dayLabel}
                        onChange={(e) =>
                          updateInboundItineraryItem(index, "dayLabel", e.target.value)
                        }
                        placeholder="Day label (e.g. Day 1)"
                      />
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          updateInboundItineraryItem(index, "title", e.target.value)
                        }
                        placeholder="Title"
                      />
                      <Textarea
                        rows={3}
                        value={item.description}
                        onChange={(e) =>
                          updateInboundItineraryItem(index, "description", e.target.value)
                        }
                        placeholder="Description"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Offer Block</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Current Price *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={inboundTypeConfig.offer.currentPrice}
                        onChange={(e) =>
                          setInboundTypeConfig((prev) => ({
                            ...prev,
                            offer: {
                              ...prev.offer,
                              currentPrice: Number(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Old Price (Optional)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={inboundTypeConfig.offer.oldPrice ?? ""}
                        onChange={(e) =>
                          setInboundTypeConfig((prev) => ({
                            ...prev,
                            offer: {
                              ...prev.offer,
                              oldPrice: e.target.value ? Number(e.target.value) : null,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Currency *</label>
                      <Select
                        value={inboundTypeConfig.offer.currency}
                        onValueChange={(value) =>
                          setInboundTypeConfig((prev) => ({
                            ...prev,
                            offer: {
                              ...prev.offer,
                              currency: value as InboundTypeConfig["offer"]["currency"],
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={inboundTypeConfig.offer.perPersonLabel}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          offer: { ...prev.offer, perPersonLabel: e.target.value },
                        }))
                      }
                      placeholder="Per person label"
                    />
                    <Input
                      value={inboundTypeConfig.offer.validUntilText}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          offer: { ...prev.offer, validUntilText: e.target.value },
                        }))
                      }
                      placeholder="Valid-until text"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact / Footer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={inboundTypeConfig.contact.phone}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, phone: e.target.value },
                        }))
                      }
                      placeholder="Phone"
                    />
                    <Input
                      type="email"
                      value={inboundTypeConfig.contact.email}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, email: e.target.value },
                        }))
                      }
                      placeholder="Email"
                    />
                    <Textarea
                      rows={2}
                      value={inboundTypeConfig.contact.primaryAddress}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, primaryAddress: e.target.value },
                        }))
                      }
                      placeholder="Primary address"
                    />
                    <Textarea
                      rows={2}
                      value={inboundTypeConfig.contact.secondaryAddress || ""}
                      onChange={(e) =>
                        setInboundTypeConfig((prev) => ({
                          ...prev,
                          contact: {
                            ...prev.contact,
                            secondaryAddress: e.target.value || null,
                          },
                        }))
                      }
                      placeholder="Secondary address (optional)"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={inboundPickupInput}
                        onChange={(e) => setInboundPickupInput(e.target.value)}
                        placeholder="Add pickup location"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addInboundListItem("pickupLocations", inboundPickupInput);
                          setInboundPickupInput("");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul className="space-y-1">
                      {inboundTypeConfig.pickupLocations.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-center justify-between text-sm">
                          <span>{item}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeInboundListItem("pickupLocations", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Transfer Options</CardTitle>
                      <Button type="button" onClick={addInboundTransferOption}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Transfer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {inboundTypeConfig.transferOptions.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeInboundTransferOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={item.id}
                          onChange={(e) =>
                            updateInboundTransferOption(index, "id", e.target.value)
                          }
                          placeholder="ID (unique key)"
                        />
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateInboundTransferOption(index, "name", e.target.value)
                          }
                          placeholder="Label"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateInboundTransferOption(
                              index,
                              "price",
                              Number(e.target.value) || 0
                            )
                          }
                          placeholder="Price"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {!isInbound && (
          <TabsContent value="departures" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Departure Options</h3>
              <Button type="button" onClick={addDepartureOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Departure
              </Button>
            </div>

            {departureOptions.map((option, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Departure Option {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDepartureOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Departure Airport
                      </label>
                      <Input
                        value={option.departureAirport}
                        onChange={(e) =>
                          updateDepartureOption(
                            index,
                            "departureAirport",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Arrival Airport
                      </label>
                      <Input
                        value={option.arrivalAirport}
                        onChange={(e) =>
                          updateDepartureOption(
                            index,
                            "arrivalAirport",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Departure Date
                      </label>
                      <Input
                        type="datetime-local"
                        value={
                          option.departureDate instanceof Date
                            ? option.departureDate.toISOString().slice(0, 16)
                            : new Date(option.departureDate)
                                .toISOString()
                                .slice(0, 16)
                        }
                        onChange={(e) =>
                          updateDepartureOption(
                            index,
                            "departureDate",
                            new Date(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Return Date</label>
                      <Input
                        type="datetime-local"
                        value={
                          option.returnDate instanceof Date
                            ? option.returnDate.toISOString().slice(0, 16)
                            : new Date(option.returnDate)
                                .toISOString()
                                .slice(0, 16)
                        }
                        onChange={(e) =>
                          updateDepartureOption(
                            index,
                            "returnDate",
                            new Date(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Price Modifier (Optional)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={option.priceModifier || ""}
                        onChange={(e) =>
                          updateDepartureOption(
                            index,
                            "priceModifier",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Currency *</label>
                      <Select
                        value={option.currency || DEFAULT_CURRENCY}
                        onValueChange={(value) =>
                          updateDepartureOption(index, "currency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Flight Info (Optional)
                    </label>
                    <Textarea
                      value={option.flightInfo || ""}
                      onChange={(e) =>
                        updateDepartureOption(
                          index,
                          "flightInfo",
                          e.target.value || null
                        )
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Hotel Pricing Configuration
                    </label>
                    <div className="border rounded-lg p-4 space-y-4">
                      {hotelOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hotel options available. Please add hotel options first.
                        </p>
                      ) : (
                        hotelOptions.map((hotelOpt, hotelIndex) => {
                          const hotel = hotels.find((h) => h.id === hotelOpt.hotelId);
                          const hotelOptIdentifier = hotelOpt.id || `temp_${hotelIndex}`;
                          const hotelPricing = (option.hotelPricings || []).find(
                            (hp) => hp.hotelOptionId === hotelOptIdentifier
                          );
                          const isSelected = !!hotelPricing;

                          const addHotelPricing = () => {
                            const currentPricings = option.hotelPricings || [];
                            const newPricing = {
                              hotelOptionId: hotelOptIdentifier,
                              currency: DEFAULT_CURRENCY,
                              roomTypePricings: [
                                { roomType: "SINGLE" as const, adultPrice: 0, childPrice6to12: null, childPrice2to6: null, infantPrice: null, currency: DEFAULT_CURRENCY },
                                { roomType: "DOUBLE" as const, adultPrice: 0, childPrice6to12: null, childPrice2to6: null, infantPrice: null, currency: DEFAULT_CURRENCY },
                              ],
                            };
                            updateDepartureOption(index, "hotelPricings", [...currentPricings, newPricing]);
                          };

                          const removeHotelPricing = () => {
                            const currentPricings = option.hotelPricings || [];
                            updateDepartureOption(
                              index,
                              "hotelPricings",
                              currentPricings.filter((hp) => hp.hotelOptionId !== hotelOptIdentifier)
                            );
                          };

                          const updateRoomTypePricing = (roomType: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD", field: string, value: any) => {
                            if (!hotelPricing) return;
                            const updatedPricings = (option.hotelPricings || []).map((hp) => {
                              if (hp.hotelOptionId === hotelOptIdentifier) {
                                const updatedRoomTypes = hp.roomTypePricings.map((rtp) =>
                                  rtp.roomType === roomType ? { ...rtp, [field]: value } : rtp
                                );
                                return { ...hp, roomTypePricings: updatedRoomTypes };
                              }
                              return hp;
                            });
                            updateDepartureOption(index, "hotelPricings", updatedPricings);
                          };

                          const addRoomType = (roomType: "TRIPLE" | "QUAD") => {
                            if (!hotelPricing) return;
                            const updatedPricings = (option.hotelPricings || []).map((hp) => {
                              if (hp.hotelOptionId === hotelOptIdentifier) {
                                const newRoomType = {
                                  roomType,
                                  adultPrice: 0,
                                  childPrice6to12: null,
                                  childPrice2to6: null,
                                  infantPrice: null,
                                  currency: hp.currency || DEFAULT_CURRENCY,
                                };
                                return { ...hp, roomTypePricings: [...hp.roomTypePricings, newRoomType] };
                              }
                              return hp;
                            });
                            updateDepartureOption(index, "hotelPricings", updatedPricings);
                          };

                          return (
                            <div key={hotelOpt.id || `temp_${hotelIndex}`} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        addHotelPricing();
                                      } else {
                                        removeHotelPricing();
                                      }
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <label className="text-sm font-medium cursor-pointer">
                                    {hotel ? `${hotel.name} (${hotel.city}, ${hotel.country})` : `Hotel ID: ${hotelOpt.hotelId || "Not selected"}`}
                                  </label>
                                </div>
                              </div>
                              {isSelected && hotelPricing && (
                                <div className="ml-6 space-y-4 mt-4">
                                  <div>
                                    <label className="text-xs font-medium">Currency</label>
                                    <Select
                                      value={hotelPricing.currency || DEFAULT_CURRENCY}
                                      onValueChange={(value) => {
                                        const updated = (option.hotelPricings || []).map((hp) =>
                                          hp.hotelOptionId === hotelOptIdentifier
                                            ? { ...hp, currency: value }
                                            : hp
                                        );
                                        updateDepartureOption(index, "hotelPricings", updated);
                                      }}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select currency" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SUPPORTED_CURRENCIES.map((currency) => (
                                          <SelectItem key={currency} value={currency}>
                                            {currency}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {hotelPricing.roomTypePricings.map((rtp, rtpIndex) => (
                                    <div key={rtpIndex} className="border rounded p-3 space-y-2">
                                      <div className="font-semibold text-sm">{rtp.roomType} Room</div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div>
                                          <label className="text-xs">Adult Price</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rtp.adultPrice}
                                            onChange={(e) =>
                                              updateRoomTypePricing(rtp.roomType, "adultPrice", parseFloat(e.target.value) || 0)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Child Price (6-12 Years)</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rtp.childPrice6to12 || ""}
                                            onChange={(e) =>
                                              updateRoomTypePricing(rtp.roomType, "childPrice6to12", e.target.value ? parseFloat(e.target.value) : null)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Child Price (2-6 Years)</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rtp.childPrice2to6 || ""}
                                            onChange={(e) =>
                                              updateRoomTypePricing(rtp.roomType, "childPrice2to6", e.target.value ? parseFloat(e.target.value) : null)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Infant Price (0-2 Years)</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rtp.infantPrice || ""}
                                            onChange={(e) =>
                                              updateRoomTypePricing(rtp.roomType, "infantPrice", e.target.value ? parseFloat(e.target.value) : null)
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="flex gap-2">
                                    {!hotelPricing.roomTypePricings.some((rtp) => rtp.roomType === "TRIPLE") && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addRoomType("TRIPLE")}
                                      >
                                        Add Triple Room
                                      </Button>
                                    )}
                                    {!hotelPricing.roomTypePricings.some((rtp) => rtp.roomType === "QUAD") && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addRoomType("QUAD")}
                                      >
                                        Add Quad Room
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {(!option.hotelPricings || option.hotelPricings.length === 0) && (
                      <p className="text-sm text-destructive mt-1">
                        At least one hotel with pricing must be configured
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          )}

          {!isInbound && (
          <TabsContent value="hotels" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Hotel Options</h3>
              <Button type="button" onClick={addHotelOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hotel
              </Button>
            </div>

            {hotelOptions.map((option, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Hotel Option {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeHotelOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Hotel</label>
                    <Select
                      value={option.hotelId || ""}
                      onValueChange={(value) =>
                        updateHotelOption(index, "hotelId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.name} - {hotel.city}, {hotel.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Star Rating (Optional)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={option.starRating || ""}
                        onChange={(e) =>
                          updateHotelOption(
                            index,
                            "starRating",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Booking Rating (Optional)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={option.bookingRating || ""}
                        onChange={(e) =>
                          updateHotelOption(
                            index,
                            "bookingRating",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Distance from Center (km, Optional)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={option.distanceFromCenter || ""}
                        onChange={(e) =>
                          updateHotelOption(
                            index,
                            "distanceFromCenter",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          )}

          {!isInbound && (
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Included Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService("included");
                      }
                    }}
                    placeholder="Add included service"
                  />
                  <Button
                    type="button"
                    onClick={() => addService("included")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {includedServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      <span>{service}</span>
                      <button
                        type="button"
                        onClick={() => removeService(index, "included")}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Excluded Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService("excluded");
                      }
                    }}
                    placeholder="Add excluded service"
                  />
                  <Button
                    type="button"
                    onClick={() => addService("excluded")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {excludedServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm"
                    >
                      <span>{service}</span>
                      <button
                        type="button"
                        onClick={() => removeService(index, "excluded")}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add-ons</CardTitle>
                  <Button type="button" onClick={addAddon}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Add-on
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {addons.map((addon, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Add-on {index + 1}</h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAddon(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={addon.name}
                          onChange={(e) =>
                            updateAddon(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={addon.price}
                          onChange={(e) =>
                            updateAddon(index, "price", parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Currency *</label>
                        <Select
                          value={addon.currency || DEFAULT_CURRENCY}
                          onValueChange={(value) =>
                            updateAddon(index, "currency", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addon.isRequired}
                          onChange={(e) =>
                            updateAddon(index, "isRequired", e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        <label className="text-sm font-medium">Required</label>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Description (Optional)
                      </label>
                      <Textarea
                        value={addon.description || ""}
                        onChange={(e) =>
                          updateAddon(
                            index,
                            "description",
                            e.target.value || null
                          )
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {!isInbound && (
          <TabsContent value="other" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Excursion Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={excursionInput}
                    onChange={(e) => setExcursionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addExcursion();
                      }
                    }}
                    placeholder="Add excursion location"
                  />
                  <Button type="button" onClick={addExcursion}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {excursionProgram.map((location, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{location}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExcursion(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={documentInput}
                    onChange={(e) => setDocumentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDocument();
                      }
                    }}
                    placeholder="Add required document"
                  />
                  <Button type="button" onClick={addDocument}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{doc}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>

        <div className="flex gap-4">
          <Button type="submit" disabled={uploading || submitting}>
            {submitting
              ? "Saving..."
              : initialData
              ? "Update Package"
              : "Create Package"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={uploading || submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}


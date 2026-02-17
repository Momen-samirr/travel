"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  charterPackageSchema,
  type CharterPackageInput,
  type CharterDepartureOptionInput,
  type CharterPackageHotelOptionInput,
  type CharterPackageAddonInput,
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
  };
}

export function CharterPackageForm({
  initialData,
}: CharterPackageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
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
          price: number;
          childPrice?: number | null;
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
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceInput, setServiceInput] = useState("");
  const [excursionInput, setExcursionInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");

  useEffect(() => {
    fetch("/api/hotels?isActive=true")
      .then((res) => res.json())
      .then((data) => setHotels(data))
      .catch(console.error);
  }, []);

  const form = useForm<CharterPackageInput>({
    resolver: zodResolver(charterPackageSchema) as any,
    defaultValues: {
      type: (initialData?.type as PackageType) || PackageType.HOTEL_CHARTER,
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
      currency: initialData?.currency || "EGP",
      discount: initialData?.discount || null,
      isActive: initialData?.isActive ?? true,
      includedServices: initialData?.includedServices || [],
      excludedServices: initialData?.excludedServices || [],
      excursionProgram: initialData?.excursionProgram || [],
      requiredDocuments: initialData?.requiredDocuments || [],
    },
  });

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
        currency: "EGP",
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
        currency: "EGP",
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
            price: number;
            childPrice?: number | null;
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
              currency: hp.currency || "EGP",
              roomTypePricings: hp.roomTypePricings || [],
            };
          }).filter((hp) => hp.hotelOptionId !== null);
        }

        console.log(`Saving departure option with ${mappedHotelPricings.length} hotel pricing records`);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="departures">Departures</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
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
                      defaultValue={field.value || PackageType.HOTEL_CHARTER}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PackageType.HOTEL_CHARTER}>
                          Hotel Charter (with flights)
                        </SelectItem>
                        <SelectItem value={PackageType.INBOUND}>
                          Inbound (no international flights)
                        </SelectItem>
                        <SelectItem value={PackageType.OUTBOUND}>
                          Outbound
                        </SelectItem>
                        <SelectItem value={PackageType.DOMESTIC}>
                          Domestic
                        </SelectItem>
                        <SelectItem value={PackageType.CUSTOM}>
                          Custom
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
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
          </TabsContent>

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
                      <label className="text-sm font-medium">Currency</label>
                      <Input
                        value={option.currency}
                        onChange={(e) =>
                          updateDepartureOption(index, "currency", e.target.value)
                        }
                      />
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
                              currency: "EGP",
                              roomTypePricings: [
                                { roomType: "SINGLE" as const, price: 0, currency: "EGP" },
                                { roomType: "DOUBLE" as const, price: 0, currency: "EGP" },
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
                                  price: 0,
                                  currency: hp.currency || "EGP",
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
                                    <Input
                                      value={hotelPricing.currency}
                                      onChange={(e) => {
                                        const updated = (option.hotelPricings || []).map((hp) =>
                                          hp.hotelOptionId === hotelOptIdentifier
                                            ? { ...hp, currency: e.target.value }
                                            : hp
                                        );
                                        updateDepartureOption(index, "hotelPricings", updated);
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                  {hotelPricing.roomTypePricings.map((rtp, rtpIndex) => (
                                    <div key={rtpIndex} className="border rounded p-3 space-y-2">
                                      <div className="font-semibold text-sm">{rtp.roomType} Room</div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="text-xs">Price</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rtp.price}
                                            onChange={(e) =>
                                              updateRoomTypePricing(rtp.roomType, "price", parseFloat(e.target.value) || 0)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Child Price</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rtp.childPrice || ""}
                                            onChange={(e) =>
                                              updateRoomTypePricing(rtp.roomType, "childPrice", e.target.value ? parseFloat(e.target.value) : null)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs">Infant Price</label>
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
                        <label className="text-sm font-medium">Currency</label>
                        <Input
                          value={addon.currency}
                          onChange={(e) =>
                            updateAddon(index, "currency", e.target.value)
                          }
                        />
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


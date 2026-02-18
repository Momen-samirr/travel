"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { branchSchema, type BranchInput, type WorkingHours } from "@/lib/validations/branch";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GoogleMapsPicker } from "./google-maps-picker";
import { Checkbox } from "@/components/ui/checkbox";

interface BranchFormProps {
  initialData?: BranchInput & { id?: string };
}

const dayNames = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function BranchForm({ initialData }: BranchFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: initialData?.latitude ?? null,
    longitude: initialData?.longitude ?? null,
    placeId: initialData?.placeId ?? null,
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
  });

  const defaultWorkingHours: WorkingHours = {
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  };

  const form = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          address: initialData.address,
          city: initialData.city,
          country: initialData.country,
          latitude: initialData.latitude ?? null,
          longitude: initialData.longitude ?? null,
          placeId: initialData.placeId ?? null,
          phone: initialData.phone,
          phoneAlt: initialData.phoneAlt ?? null,
          email: initialData.email,
          emailAlt: initialData.emailAlt ?? null,
          workingHours: initialData.workingHours || defaultWorkingHours,
          isActive: initialData.isActive ?? true,
          displayOrder: initialData.displayOrder ?? 0,
        }
      : {
          name: "",
          slug: "",
          address: "",
          city: "",
          country: "",
          latitude: null,
          longitude: null,
          placeId: null,
          phone: "",
          phoneAlt: null,
          email: "",
          emailAlt: null,
          workingHours: defaultWorkingHours,
          isActive: true,
          displayOrder: 0,
        },
  });

  const handleLocationChange = (data: {
    latitude: number | null;
    longitude: number | null;
    placeId: string | null;
    address: string;
    city: string;
    country: string;
  }) => {
    setLocationData(data);
    form.setValue("latitude", data.latitude);
    form.setValue("longitude", data.longitude);
    form.setValue("placeId", data.placeId);
    form.setValue("address", data.address);
    if (data.city) form.setValue("city", data.city);
    if (data.country) form.setValue("country", data.country);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!initialData) {
      // Auto-generate slug for new branches
      form.setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = async (data: BranchInput) => {
    setSubmitting(true);
    try {
      const url = initialData?.id
        ? `/api/admin/branches/${initialData.id}`
        : "/api/admin/branches";
      const method = initialData?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save branch");
      }

      toast({
        title: initialData?.id ? "Branch updated!" : "Branch created!",
        description: `The branch has been ${initialData?.id ? "updated" : "created"} successfully.`,
        variant: "success",
      });

      router.push("/admin/branches");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving branch:", error);
      toast({
        title: "Failed to save branch",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cairo Main Office"
                        {...field}
                        onChange={(e) => {
                          handleNameChange(e.target.value);
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
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="cairo-main-office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+20 123 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternative Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+20 123 456 7891"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="info@tourismco.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternative Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="support@tourismco.com"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleMapsPicker
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              placeId={locationData.placeId}
              address={locationData.address}
              city={locationData.city}
              country={locationData.country}
              onLocationChange={handleLocationChange}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Travel Street, Downtown"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cairo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input placeholder="Egypt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayNames.map((day) => (
                <FormField
                  key={day.key}
                  control={form.control}
                  name={`workingHours.${day.key}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{day.label}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9:00 AM - 5:00 PM"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Saving..."
              : initialData?.id
              ? "Update Branch"
              : "Create Branch"}
          </Button>
        </div>
      </form>
    </Form>
  );
}



"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hotelSchema, type HotelInput } from "@/lib/validations/hotel";
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
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HotelFormProps {
  initialData?: HotelInput & { id?: string };
}

export function HotelForm({ initialData }: HotelFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);
  const [amenityInput, setAmenityInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<HotelInput>({
    resolver: zodResolver(hotelSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description,
      address: initialData.address,
      city: initialData.city,
      country: initialData.country,
      latitude: initialData.latitude ?? null,
      longitude: initialData.longitude ?? null,
      pricePerNight: initialData.pricePerNight,
      currency: initialData.currency ?? "EGP",
      rating: initialData.rating ?? null,
      amenities: initialData.amenities,
      images: initialData.images,
      checkInTime: initialData.checkInTime ?? null,
      checkOutTime: initialData.checkOutTime ?? null,
      isActive: initialData.isActive ?? true,
    } : {
      name: "",
      slug: "",
      description: "",
      address: "",
      city: "",
      country: "",
      latitude: null,
      longitude: null,
      pricePerNight: 0,
      currency: "EGP",
      rating: null,
      amenities: [],
      images: [],
      checkInTime: null,
      checkOutTime: null,
      isActive: true,
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/hotels/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const newImages = [...images, data.url];
      setImages(newImages);
      form.setValue("images", newImages);
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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    form.setValue("images", newImages);
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      const newAmenities = [...amenities, amenityInput.trim()];
      setAmenities(newAmenities);
      form.setValue("amenities", newAmenities);
      setAmenityInput("");
    }
  };

  const removeAmenity = (index: number) => {
    const newAmenities = amenities.filter((_, i) => i !== index);
    setAmenities(newAmenities);
    form.setValue("amenities", newAmenities);
  };

  const onSubmit = async (data: HotelInput) => {
    setSubmitting(true);
    try {
      const url = initialData?.id
        ? `/api/hotels/${initialData.id}`
        : "/api/hotels";
      const method = initialData?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, images, amenities }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save hotel");
      }

      toast({
        title: initialData ? "Hotel updated!" : "Hotel created!",
        description: "The hotel has been saved successfully.",
        variant: "success",
      });
      router.push("/admin/hotels");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving hotel:", error);
      toast({
        title: "Failed to save hotel",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  URL-friendly version of the name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePerNight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Night</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (0-5)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
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
            name="checkInTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-in Time</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="14:00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="checkOutTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-out Time</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="11:00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
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
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
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
        </div>

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
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder="Add amenity (e.g., WiFi, Pool, Gym)"
              />
              <Button type="button" onClick={addAmenity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
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
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Hotel image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
            </div>
          </CardContent>
        </Card>

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

        <div className="flex gap-4">
          <Button type="submit" disabled={uploading || submitting}>
            {submitting ? "Saving..." : initialData ? "Update Hotel" : "Create Hotel"}
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


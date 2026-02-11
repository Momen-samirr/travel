"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visaSchema, type VisaInput } from "@/lib/validations/visa";
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
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VisaFormProps {
  initialData?: VisaInput & { id?: string };
}

export function VisaForm({ initialData }: VisaFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(
    initialData?.requiredDocuments || []
  );
  const [documentInput, setDocumentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<VisaInput>({
    resolver: zodResolver(visaSchema) as any,
    defaultValues: initialData || {
      country: "",
      type: "",
      description: "",
      price: 0,
      currency: "EGP",
      processingTime: "",
      requiredDocuments: [],
      isActive: true,
    },
  });

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

  const onSubmit = async (data: VisaInput) => {
    setSubmitting(true);
    try {
      const url = initialData?.id
        ? `/api/visas/${initialData.id}`
        : "/api/visas";
      const method = initialData?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, requiredDocuments }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save visa");
      }

      toast({
        title: initialData ? "Visa updated!" : "Visa created!",
        description: "The visa service has been saved successfully.",
        variant: "success",
      });
      router.push("/admin/visas");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving visa:", error);
      toast({
        title: "Failed to save visa",
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visa Type</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Tourist, Business, Transit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
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
            name="processingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing Time</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 5-7 business days" />
                </FormControl>
                <FormDescription>
                  Estimated processing time for the visa
                </FormDescription>
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
                placeholder="Add required document (e.g., Passport, Photo)"
              />
              <Button type="button" onClick={addDocument}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {requiredDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  <span>{doc}</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : initialData ? "Update Visa" : "Create Visa"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}


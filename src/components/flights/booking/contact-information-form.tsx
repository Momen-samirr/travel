"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactInformationSchema, type ContactInformationInput } from "@/lib/validations/passenger";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";

interface ContactInformationFormProps {
  defaultValues?: Partial<ContactInformationInput>;
  onUpdate: (data: ContactInformationInput) => void;
}

export function ContactInformationForm({
  defaultValues,
  onUpdate,
}: ContactInformationFormProps) {
  const form = useForm<ContactInformationInput>({
    resolver: zodResolver(contactInformationSchema),
    defaultValues: {
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      countryCode: defaultValues?.countryCode || "+20",
    },
  });

  // Update parent when form changes
  const handleChange = () => {
    const values = form.getValues();
    onUpdate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <p className="text-sm text-gray-600">
          This information will be used for booking confirmation and updates
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={handleChange} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        {...field}
                        className="pl-10"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          className="pl-10"
                          placeholder="01234567890"
                          required
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


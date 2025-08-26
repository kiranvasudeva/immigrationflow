import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { insertClientProfileSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const clientFormSchema = insertClientProfileSchema.extend({
  ownerUserId: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ClientFormData>;
}

export default function ClientForm({ onSubmit, isLoading = false, initialData }: ClientFormProps) {
  const { t } = useLanguage();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      cui: initialData?.cui || "",
      address: initialData?.address || "",
      caen: initialData?.caen || "",
      contactEmail: initialData?.contactEmail || "",
      onrc: initialData?.onrc || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder={t('form.placeholders.companyName') || 'Enter company name'}
                  data-testid="input-company-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cui"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUI *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={t('form.placeholders.cui') || 'RO12345678'}
                    data-testid="input-cui"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="caen"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CAEN Code *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="6201"
                    data-testid="input-caen"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={t('form.placeholders.companyAddress') || 'Enter company address'}
                  className="min-h-20"
                  data-testid="textarea-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="email"
                    placeholder="contact@company.ro"
                    data-testid="input-contact-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="onrc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ONRC</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder={t('form.placeholders.onrc') || 'J40/1234/2020'}
                    data-testid="input-onrc"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit-client"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Company Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/contexts/LanguageContext";
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
  const { t } = useTranslation();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      legalName: initialData?.legalName || "",
      cui: initialData?.cui || "",
      legalAddress: initialData?.legalAddress || "",
      caen: initialData?.caen || "",
      contactEmail: initialData?.contactEmail || "",
      registrationNumber: initialData?.registrationNumber || "",
      adminName: initialData?.adminName || "",
      phoneNumber: initialData?.phoneNumber || "",
      bankIban: initialData?.bankIban || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.labels.legalName') || 'Legal Name *'}</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder={t('form.placeholders.legalName') || 'Enter legal company name'}
                  data-testid="input-legal-name"
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
                <FormLabel>{t('form.labels.cui') || 'CUI *'}</FormLabel>
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
                <FormLabel>{t('form.labels.caenCode') || 'CAEN Code *'}</FormLabel>
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
          name="legalAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.labels.legalAddress') || 'Legal Address *'}</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={t('form.placeholders.legalAddress') || 'Enter registered legal address'}
                  className="min-h-20"
                  data-testid="textarea-legal-address"
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
                <FormLabel>{t('form.labels.contactEmail') || 'Contact Email *'}</FormLabel>
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
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.registrationNumber') || 'Registration Number *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder={t('form.placeholders.registrationNumber') || 'J40/1234/2020'}
                    data-testid="input-registration-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="adminName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.labels.adminName') || 'Administrator Name *'}</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder={t('form.placeholders.adminName') || 'Full name of legal representative'}
                  data-testid="input-admin-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.phoneNumber') || 'Phone Number *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={t('form.placeholders.phoneNumber') || '+40 21 123 4567'}
                    data-testid="input-phone-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankIban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.bankIban') || 'Bank IBAN *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder={t('form.placeholders.bankIban') || 'RO49 AAAA 1B31 0075 9384 0001'}
                    data-testid="input-bank-iban"
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

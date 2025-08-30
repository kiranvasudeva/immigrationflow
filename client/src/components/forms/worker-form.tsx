import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/contexts/LanguageContext";
import { insertWorkerSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useState, useEffect } from "react";

const workerFormSchema = insertWorkerSchema.extend({
  clientProfileId: z.string().optional(),
});

type WorkerFormData = z.infer<typeof workerFormSchema>;

interface WorkerFormProps {
  onSubmit: (data: WorkerFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<WorkerFormData>;
  clientProfileId: string;
}

export default function WorkerForm({ onSubmit, isLoading = false, initialData, clientProfileId }: WorkerFormProps) {
  const { t } = useTranslation();
  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      nationality: initialData?.nationality || "",
      passportNumber: initialData?.passportNumber || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      dob: initialData?.dob || undefined,
      passportExpiry: initialData?.passportExpiry || undefined,
      assignedWorkflowIds: initialData?.assignedWorkflowIds || [],
      clientProfileId,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.firstName') || 'First Name *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={t('form.placeholders.firstName') || 'Enter first name'}
                    data-testid="input-first-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.lastName') || 'Last Name *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={t('form.placeholders.lastName') || 'Enter last name'}
                    data-testid="input-last-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.nationality') || 'Nationality *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={t('form.placeholders.nationality') || 'USA'}
                    data-testid="input-nationality"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passportNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.passportNumber') || 'Passport Number *'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder={t('form.placeholders.passportNumber') || 'US1234567'}
                    data-testid="input-passport-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.labels.dateOfBirth') || 'Date of Birth'}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    data-testid="input-date-of-birth"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passportExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Expiry</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    data-testid="input-passport-expiry"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    type="email"
                    placeholder="worker@email.com"
                    data-testid="input-worker-email"
                  />
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
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder="+1234567890"
                    data-testid="input-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="assignedWorkflowIds"
                render={({ field }) => {
                  const [workflows] = useState([
                    { id: 'work-permit-initial', name: 'Initial Work Permit Application', description: 'Complete Romanian work permit application process' },
                    { id: 'residence-permit-temp', name: 'Temporary Residence Permit', description: 'Romanian temporary residence permit application' },
                    { id: 'work-permit-renewal', name: 'Work Permit Renewal', description: 'Renewal process for existing work permits' },
                  ]);
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Select Applicable Workflows</FormLabel>
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        {workflows.map((workflow) => (
                          <div 
                            key={workflow.id} 
                            className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <Checkbox 
                              checked={field.value?.includes(workflow.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, workflow.id]);
                                } else {
                                  field.onChange(currentValues.filter((id: string) => id !== workflow.id));
                                }
                              }}
                              data-testid={`checkbox-workflow-${workflow.id}`}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{workflow.name}</h4>
                              <p className="text-sm text-muted-foreground">{workflow.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit-worker"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Worker
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

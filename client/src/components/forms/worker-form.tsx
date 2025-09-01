import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/contexts/I18nProvider";
import { insertWorkerSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      // Personal Information
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      middleName: initialData?.middleName || "",
      dob: initialData?.dob || undefined,
      placeOfBirth: initialData?.placeOfBirth || "",
      countryOfBirth: initialData?.countryOfBirth || "",
      nationality: initialData?.nationality || "",
      gender: initialData?.gender || "",
      maritalStatus: initialData?.maritalStatus || "",
      
      // Contact Information
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      emergencyContact: initialData?.emergencyContact || "",
      emergencyPhone: initialData?.emergencyPhone || "",
      
      // Address Information
      homeAddress: initialData?.homeAddress || "",
      homeCity: initialData?.homeCity || "",
      homeCountry: initialData?.homeCountry || "",
      homePostalCode: initialData?.homePostalCode || "",
      romanianAddress: initialData?.romanianAddress || "",
      romanianCity: initialData?.romanianCity || "",
      romanianCounty: initialData?.romanianCounty || "",
      romanianPostalCode: initialData?.romanianPostalCode || "",
      
      // Passport Information
      passportNumber: initialData?.passportNumber || "",
      passportIssueDate: initialData?.passportIssueDate || undefined,
      passportExpiry: initialData?.passportExpiry || undefined,
      passportIssuingAuthority: initialData?.passportIssuingAuthority || "",
      passportPlaceOfIssue: initialData?.passportPlaceOfIssue || "",
      
      // Education Information
      educationLevel: initialData?.educationLevel || "",
      universityName: initialData?.universityName || "",
      degreeField: initialData?.degreeField || "",
      graduationYear: initialData?.graduationYear || undefined,
      professionalCertifications: initialData?.professionalCertifications || "",
      languageSkills: initialData?.languageSkills ? JSON.stringify(initialData.languageSkills) : "",
      
      // Employment Information
      jobTitle: initialData?.jobTitle || "",
      workExperience: initialData?.workExperience || "",
      previousEmployers: initialData?.previousEmployers ? JSON.stringify(initialData.previousEmployers) : "",
      monthlyGrossSalary: initialData?.monthlyGrossSalary || undefined,
      workLocation: initialData?.workLocation || "",
      workSchedule: initialData?.workSchedule || "",
      contractType: initialData?.contractType || "",
      contractStartDate: initialData?.contractStartDate || undefined,
      contractEndDate: initialData?.contractEndDate || undefined,
      
      // Immigration History
      previousRomanianVisa: initialData?.previousRomanianVisa || false,
      previousVisaDetails: initialData?.previousVisaDetails || "",
      previousRejections: initialData?.previousRejections || false,
      rejectionDetails: initialData?.rejectionDetails || "",
      criminalRecord: initialData?.criminalRecord || false,
      criminalRecordDetails: initialData?.criminalRecordDetails || "",
      
      // Health Information
      healthInsurance: initialData?.healthInsurance || "",
      medicalConditions: initialData?.medicalConditions || "",
      vaccinationRecord: initialData?.vaccinationRecord || "",
      
      // Family Information
      spouseName: initialData?.spouseName || "",
      spouseNationality: initialData?.spouseNationality || "",
      children: initialData?.children || "",
      familyInRomania: initialData?.familyInRomania || false,
      familyInRomaniaDetails: initialData?.familyInRomaniaDetails || "",
      
      // Financial Information
      bankAccountDetails: initialData?.bankAccountDetails || "",
      financialSupport: initialData?.financialSupport || "",
      proofOfFunds: initialData?.proofOfFunds || "",
      
      // Romanian Administrative Information
      personalNumericalCode: initialData?.personalNumericalCode || "",
      taxIdentificationNumber: initialData?.taxIdentificationNumber || "",
      socialSecurityNumber: initialData?.socialSecurityNumber || "",
      
      // Document Status
      documentStatus: initialData?.documentStatus || "",
      missingDocuments: initialData?.missingDocuments || "",
      notes: initialData?.notes || "",
      
      clientProfileId,
    },
  });

  // Handle date inputs - convert Date to string for input fields
  const formatDateForInput = (date: Date | null | undefined) => {
    return date ? new Date(date).toISOString().split('T')[0] : '';
  };

  const handleDateChange = (value: string) => {
    return value ? new Date(value) : undefined;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="passport">Passport</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter first name" data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Enter middle name" data-testid="input-middle-name" />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter last name" data-testid="input-last-name" />
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
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                            data-testid="input-date-of-birth"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., American, Indian" data-testid="input-nationality" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="placeOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Birth</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="City of birth" data-testid="input-place-of-birth" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="countryOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Birth</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Country of birth" data-testid="input-country-of-birth" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-marital-status">
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                            <SelectItem value="Separated">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact & Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="email" placeholder="worker@email.com" data-testid="input-worker-email" />
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
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="+1234567890" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Emergency contact name" data-testid="input-emergency-contact" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="+1234567890" data-testid="input-emergency-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Home Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="homeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Street address" data-testid="input-home-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="City" data-testid="input-home-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="homeCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Country" data-testid="input-home-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homePostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Postal code" data-testid="input-home-postal-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Romanian Address (if available)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="romanianAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Romanian street address" data-testid="input-romanian-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="romanianCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Romanian city" data-testid="input-romanian-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="romanianCounty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Romanian county" data-testid="input-romanian-county" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="romanianPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Romanian postal code" data-testid="input-romanian-postal-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passport Information Tab */}
          <TabsContent value="passport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Passport Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="US1234567" data-testid="input-passport-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passportIssuingAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Authority</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., US Dept of State" data-testid="input-passport-issuing-authority" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passportIssueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                            data-testid="input-passport-issue-date"
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
                        <FormLabel>Expiry Date *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                            data-testid="input-passport-expiry"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="passportPlaceOfIssue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Issue</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="City/Country where passport was issued" data-testid="input-passport-place-of-issue" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Information Tab */}
          <TabsContent value="education" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Education & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="educationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-education-level">
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="High School">High School</SelectItem>
                            <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                            <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Vocational">Vocational Training</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="2020" 
                            data-testid="input-graduation-year" 
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
                    name="universityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University/School Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="University name" data-testid="input-university-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="degreeField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field of Study</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., Computer Science" data-testid="input-degree-field" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="professionalCertifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Certifications</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="List your professional certifications" data-testid="textarea-professional-certifications" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languageSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language Skills</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={typeof field.value === 'string' ? field.value : (field.value ? JSON.stringify(field.value) : '')} placeholder="e.g., English (Native), Spanish (Fluent), French (Basic)" data-testid="textarea-language-skills" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Information Tab */}
          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., Software Developer" data-testid="input-job-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyGrossSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Gross Salary (LEI)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="5000" 
                            data-testid="input-monthly-gross-salary" 
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
                    name="workLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Bucharest, Romania" data-testid="input-work-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-contract-type">
                              <SelectValue placeholder="Select contract type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                            data-testid="input-contract-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                            data-testid="input-contract-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Schedule</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="e.g., Monday to Friday, 9 AM - 5 PM" data-testid="input-work-schedule" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Experience</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Describe your work experience" data-testid="textarea-work-experience" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previousEmployers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Employers</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={typeof field.value === 'string' ? field.value : (field.value ? JSON.stringify(field.value) : '')} placeholder="List previous employers" data-testid="textarea-previous-employers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Information Tab */}
          <TabsContent value="other" className="space-y-4">
            {/* Immigration History */}
            <Card>
              <CardHeader>
                <CardTitle>Immigration History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="previousRomanianVisa"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-previous-romanian-visa"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Previous Romanian Visa</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousRejections"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-previous-rejections"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Previous Visa Rejections</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="previousVisaDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Visa Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Details about previous Romanian visas" data-testid="textarea-previous-visa-details" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rejectionDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Details about any visa rejections" data-testid="textarea-rejection-details" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="criminalRecord"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-criminal-record"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Criminal Record</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="criminalRecordDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criminal Record Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Details if any criminal record exists" data-testid="textarea-criminal-record-details" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Health Information */}
            <Card>
              <CardHeader>
                <CardTitle>Health Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="healthInsurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Insurance</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Health insurance provider" data-testid="input-health-insurance" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Any medical conditions or medications" data-testid="textarea-medical-conditions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vaccinationRecord"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaccination Record</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Vaccination history and records" data-testid="textarea-vaccination-record" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Family Information */}
            <Card>
              <CardHeader>
                <CardTitle>Family Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spouseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spouse Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Spouse full name" data-testid="input-spouse-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="spouseNationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spouse Nationality</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Spouse nationality" data-testid="input-spouse-nationality" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="children"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Children</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Information about children (names, ages)" data-testid="textarea-children" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyInRomania"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-family-in-romania"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Family in Romania</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyInRomaniaDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family in Romania Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Details about family members in Romania" data-testid="textarea-family-in-romania-details" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankAccountDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Bank name, account type, etc." data-testid="textarea-bank-account-details" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialSupport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financial Support</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Sources of financial support" data-testid="textarea-financial-support" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proofOfFunds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proof of Funds</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Available proof of funds documents" data-testid="textarea-proof-of-funds" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Romanian Administrative Information */}
            <Card>
              <CardHeader>
                <CardTitle>Romanian Administrative Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personalNumericalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Numerical Code (CNP)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Romanian CNP" data-testid="input-personal-numerical-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxIdentificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Identification Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Romanian tax ID" data-testid="input-tax-identification-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="socialSecurityNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Social security number" data-testid="input-social-security-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Document Status */}
            <Card>
              <CardHeader>
                <CardTitle>Document Status & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Status</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Current status of immigration documents" data-testid="textarea-document-status" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="missingDocuments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Missing Documents</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="List of missing or required documents" data-testid="textarea-missing-documents" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Any additional notes or comments" data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit-worker"
            size="lg"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving Worker...
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
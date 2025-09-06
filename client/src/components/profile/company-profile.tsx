import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientProfile } from "@shared/schema";

interface CompanyProfileProps {
  profile: ClientProfile;
}

export default function CompanyProfile({ profile }: CompanyProfileProps) {
  return (
    <Card className="mb-8" data-testid="card-company-profile">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle>Company Profile</CardTitle>
          <Button variant="ghost" data-testid="button-edit-profile">
            <i className="fas fa-edit mr-1"></i>Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <p className="text-gray-900 font-medium" data-testid="text-company-name">{profile.legalName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CUI</label>
            <p className="text-gray-900 font-mono" data-testid="text-company-cui">{profile.cui}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CAEN Code</label>
            <p className="text-gray-900 font-mono" data-testid="text-company-caen">{profile.caen}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <p className="text-gray-900" data-testid="text-company-address">{profile.legalAddress}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <p className="text-gray-900" data-testid="text-company-email">{profile.contactEmail}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ONRC</label>
            <p className="text-gray-900 font-mono" data-testid="text-company-onrc">{profile.registrationNumber || 'Not provided'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

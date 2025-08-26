import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, Building, MapPin, Phone } from 'lucide-react';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500';
      case 'OWNER':
        return 'bg-blue-500';
      case 'WORKER':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'OWNER':
        return 'Client Owner';
      case 'WORKER':
        return 'Worker';
      default:
        return 'Viewer';
    }
  };

  // Mock additional profile data
  const profileData = {
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Smith',
    email: user?.email || 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    nationality: 'United States',
    dateOfBirth: '1990-05-15',
    address: '123 Main Street, New York, NY 10001',
    emergencyContact: 'Jane Smith - +1 (555) 987-6543',
    workPermitStatus: 'In Progress',
    visaStatus: 'Pending Application'
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user?.role || 'VIEWER'} />
      
      <div className="ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-gray-600 mt-2">
                  Manage your personal information and immigration status
                </p>
              </div>
              <Button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                data-testid="button-edit-profile"
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview Card */}
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                    <AvatarFallback className="text-xl">
                      {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{profileData.firstName} {profileData.lastName}</CardTitle>
                  <Badge className={`${getRoleColor(user?.role || 'VIEWER')} text-white`}>
                    {getRoleDisplay(user?.role || 'VIEWER')}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{profileData.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        disabled={!isEditing}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        disabled={!isEditing}
                        data-testid="input-last-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profileData.email}
                        disabled={!isEditing}
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        disabled={!isEditing}
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={profileData.nationality}
                        disabled={!isEditing}
                        data-testid="input-nationality"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth}
                        disabled={!isEditing}
                        data-testid="input-date-of-birth"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Immigration Status Card */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Immigration Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <Label>Work Permit Status</Label>
                      <div className="mt-2">
                        <Badge variant="secondary">{profileData.workPermitStatus}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Visa Status</Label>
                      <div className="mt-2">
                        <Badge variant="secondary">{profileData.visaStatus}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Current Address</Label>
                      <div className="mt-2 flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <span className="text-sm">{profileData.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact Card */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={profileData.emergencyContact}
                        disabled={!isEditing}
                        data-testid="input-emergency-contact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
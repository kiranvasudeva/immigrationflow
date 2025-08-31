import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Plus, Search, Filter, Edit2, Trash2, DollarSign, Calendar } from 'lucide-react';

interface Payment {
  id: string;
  clientId: string;
  workerId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    workerId: '',
    amount: 0,
    currency: 'RON',
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    description: '',
    dueDate: ''
  });

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || ''))) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin or Owner privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || '')) {
    return null;
  }

  // Fetch payments from API (placeholder - will use real API when available)
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    enabled: isAuthenticated && ['ADMIN', 'OWNER'].includes(user?.role || ''),
    queryFn: async () => {
      // For now, return empty array as payments API is not fully implemented yet
      return [];
    }
  });

  // Filter payments based on search criteria
  const filteredPayments = (payments as Payment[]).filter((payment: Payment) => {
    const matchesSearch = !searchTerm || 
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod === selectedMethod;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency || 'RON'
    }).format(amount);
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8" />
              {t('pages.payments.title') || 'Payment Management'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.payments.description') || 'Track payments and invoices for immigration services'}
            </p>
          </div>
          
          {user?.role === 'ADMIN' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-create-payment">
                  <Plus className="h-4 w-4" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Payment</DialogTitle>
                  <DialogDescription>
                    Record a new payment or invoice for immigration services.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newPayment.description}
                      onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                      placeholder="e.g., Work Permit Application Fee"
                      data-testid="input-payment-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                        data-testid="input-payment-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={newPayment.currency} 
                        onValueChange={(value) => setNewPayment({...newPayment, currency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RON">RON (Romanian Leu)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => {/* Handle create */}}
                    data-testid="button-save-payment"
                  >
                    Create Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-payments"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payments ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all' 
                    ? 'Try adjusting your filters to see more results.' 
                    : 'No payments have been recorded yet. Add payments to track service billing.'}
                </p>
                {user?.role === 'ADMIN' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-payment">
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment: Payment) => (
                  <div 
                    key={payment.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`payment-card-${payment.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </h3>
                          {getStatusBadge(payment.status)}
                          <Badge variant="outline" className="text-xs">{payment.paymentMethod}</Badge>
                        </div>
                        
                        {payment.description && (
                          <p className="text-gray-600 text-sm mb-2">{payment.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Client: {payment.clientId}</span>
                          {payment.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {payment.paidAt && (
                            <span>Paid: {new Date(payment.paidAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      {user?.role === 'ADMIN' && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-edit-payment-${payment.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`button-delete-payment-${payment.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
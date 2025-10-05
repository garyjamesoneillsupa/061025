import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Receipt, 
  CheckCircle, 
  X, 
  Eye, 
  Download, 
  Calendar,
  User,
  FileText,
  Fuel,
  Train,
  Car,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "date-fns";

interface Expense {
  id: string;
  jobNumber: string;
  type: string;
  amount: number;
  notes?: string;
  driverName: string;
  isApproved: boolean;
  chargeToCustomer: boolean;
  submittedAt: string;
  approvedAt?: string;
  receiptPhotoPath?: string;
}

export default function ExpenseApproval() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses/pending"],
    enabled: true,
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, isApproved, chargeToCustomer }: {
      expenseId: string;
      isApproved: boolean;
      chargeToCustomer: boolean;
    }) => {
      return apiRequest("PATCH", `/api/expenses/${expenseId}/approve`, {
        isApproved,
        chargeToCustomer,
      });
    },
    onSuccess: () => {
      toast({
        title: "Expense Updated",
        description: "Expense approval status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApproval = (expense: Expense, isApproved: boolean, chargeToCustomer: boolean) => {
    approveExpenseMutation.mutate({
      expenseId: expense.id,
      isApproved,
      chargeToCustomer,
    });
  };

  const getExpenseIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return <Fuel className="h-4 w-4" />;
      case 'train':
        return <Train className="h-4 w-4" />;
      case 'uber':
        return <Car className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    const labels = {
      fuel: "Fuel",
      train: "Train/Public Transport",
      uber: "Taxi/Uber",
      misc: "Miscellaneous",
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const pendingExpenses = expenses?.filter((exp: Expense) => !exp.isApproved) || [];
  const approvedExpenses = expenses?.filter((exp: Expense) => exp.isApproved) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Expense Management</h2>
        <div className="text-sm text-gray-600">
          {pendingExpenses.length} pending • {approvedExpenses.length} approved
        </div>
      </div>

      {/* Pending Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Pending Approval ({pendingExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingExpenses.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No expenses pending approval
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingExpenses.map((expense: Expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onApprove={handleApproval}
                  isPending={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Approved Expenses ({approvedExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved expenses yet
            </div>
          ) : (
            <div className="space-y-4">
              {approvedExpenses.map((expense: Expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onApprove={handleApproval}
                  isPending={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseCard({ 
  expense, 
  onApprove, 
  isPending 
}: { 
  expense: Expense; 
  onApprove: (expense: Expense, approved: boolean, chargeToCustomer: boolean) => void;
  isPending: boolean;
}) {
  const [chargeToCustomer, setChargeToCustomer] = useState(expense.chargeToCustomer);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getExpenseIcon(expense.type)}
            <span className="font-medium">{getExpenseTypeLabel(expense.type)}</span>
          </div>
          <Badge variant="outline">
            Job {expense.jobNumber}
          </Badge>
          <div className="text-sm text-gray-600 flex items-center">
            <User className="h-3 w-3 mr-1" />
            {expense.driverName}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">£{expense.amount.toFixed(2)}</div>
          <div className="text-xs text-gray-500 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(new Date(expense.submittedAt), "MMM dd, yyyy")}
          </div>
        </div>
      </div>

      {expense.notes && (
        <div className="text-sm text-gray-700">
          <span className="font-medium">Notes:</span> {expense.notes}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {expense.receiptPhotoPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/expenses/${expense.id}/receipt`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Receipt
            </Button>
          )}
          
          {isPending && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={chargeToCustomer}
                onCheckedChange={setChargeToCustomer}
              />
              <Label className="text-sm">Charge to customer</Label>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove(expense, false, chargeToCustomer)}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(expense, true, chargeToCustomer)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Badge variant={expense.chargeToCustomer ? "default" : "secondary"}>
              {expense.chargeToCustomer ? "Customer Charged" : "Company Cost"}
            </Badge>
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  function getExpenseIcon(type: string) {
    switch (type) {
      case 'fuel':
        return <Fuel className="h-4 w-4" />;
      case 'train':
        return <Train className="h-4 w-4" />;
      case 'uber':
        return <Car className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  }

  function getExpenseTypeLabel(type: string) {
    const labels = {
      fuel: "Fuel",
      train: "Train/Public Transport", 
      uber: "Taxi/Uber",
      misc: "Miscellaneous",
    };
    return labels[type as keyof typeof labels] || type;
  }
}
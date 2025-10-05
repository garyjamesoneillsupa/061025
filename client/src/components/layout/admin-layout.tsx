import { Switch, Route } from "wouter";
import Header from "./header";
import Footer from "./footer";
import AuthWrapper from "@/components/auth/auth-wrapper";
import NotFound from "@/pages/not-found";

// Admin Pages
import Dashboard from "@/pages/modern-admin-dashboard";
import Jobs from "@/pages/jobs";
import JobDetails from "@/pages/job-details";

import JobAbort from "@/pages/job-abort";
import JobCancel from "@/pages/job-cancel";
import Planner from "@/pages/planner";
import Customers from "@/pages/customers";
import Drivers from "@/pages/drivers";
import Reports from "@/pages/reports";
import Expenses from "@/pages/expenses";
import Wages from "@/pages/wages";
import Invoices from "@/pages/invoices";
import LegacyInvoiceConverter from "@/pages/legacy-invoice-converter";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";
import SystemArchive from "@/pages/system-archive";
import SystemMonitoring from "@/pages/system-monitoring";
import EmailTemplates from "@/pages/email-templates";
import AuditLogs from "@/pages/audit-logs";
import UserManagement from "@/pages/user-management";
import AdminDocuments from "@/pages/admin-documents";
import UnifiedInvoices from "@/pages/unified-invoices";

export default function AdminLayout() {
  return (
    <AuthWrapper>
      {(user) => {
        // Check if user has admin role
        if (user.role !== 'admin') {
          return <NotFound />;
        }

        // Render admin interface
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1">
              <Switch>
                <Route path="/admin" component={Dashboard} />
                <Route path="/admin/jobs/:jobNumber/abort" component={JobAbort} />
                <Route path="/admin/jobs/:jobNumber/cancel" component={JobCancel} />
                <Route path="/admin/jobs/:jobNumber" component={JobDetails} />
                <Route path="/admin/jobs" component={Jobs} />
                <Route path="/admin/planner" component={Planner} />
                <Route path="/admin/customers" component={Customers} />
                <Route path="/admin/drivers" component={Drivers} />
                <Route path="/admin/reports" component={Reports} />
                <Route path="/admin/expenses" component={Expenses} />
                <Route path="/admin/wages" component={Wages} />
                <Route path="/admin/invoices" component={UnifiedInvoices} />
                <Route path="/admin/legacy-converter" component={LegacyInvoiceConverter} />
                <Route path="/admin/documents" component={AdminDocuments} />
                <Route path="/admin/settings" component={Settings} />
                <Route path="/admin/system-archive" component={SystemArchive} />
                <Route path="/admin/users" component={UserManagement} />
                <Route path="/admin/system-monitoring" component={SystemMonitoring} />
                <Route path="/admin/email-templates" component={EmailTemplates} />
                <Route path="/admin/audit-logs" component={AuditLogs} />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
          </div>
        );
      }}
    </AuthWrapper>
  );
}
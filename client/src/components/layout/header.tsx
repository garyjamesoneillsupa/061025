import { Link, useLocation } from "wouter";
import { Bell, User, LogOut, Settings, Menu, X, UserCircle, Archive, BarChart3, Activity, Mail, Shield, CheckCircle } from "lucide-react";
import { useState } from "react";
import ovmLogo from "@assets/ovmlogo_1753908468997.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Jobs", href: "/admin/jobs" },
  { name: "Planner", href: "/admin/planner" },
  { name: "Customers", href: "/admin/customers" },
  { name: "Drivers", href: "/admin/drivers" },
  { name: "Expenses", href: "/admin/expenses" },
  { name: "Wages", href: "/admin/wages" },
  { name: "Reports", href: "/admin/reports" },
  { name: "Invoices", href: "/admin/invoices" },
  { name: "Documents", href: "/admin/documents" },
];

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/admin">
              <img src={ovmLogo} alt="OVM" className="h-8 w-auto cursor-pointer" />
            </Link>
          </div>
          
          {/* Navigation Menu */}
          <nav className="hidden lg:flex space-x-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`font-medium transition-colors ${
                      isActive 
                        ? "bg-[#00ABE7] text-white hover:bg-[#0096d1]" 
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <UserCircle className="h-6 w-6 text-gray-500" />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">Admin</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Global Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/system-archive" className="flex items-center w-full">
                    <Archive className="mr-2 h-4 w-4" />
                    System Archive
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/users" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    User Management
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/system-monitoring" className="flex items-center w-full">
                    <Activity className="mr-2 h-4 w-4" />
                    System Monitoring
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/email-templates" className="flex items-center w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Templates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/audit-logs" className="flex items-center w-full">
                    <Shield className="mr-2 h-4 w-4" />
                    Audit Logs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/reports" className="flex items-center w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Reports & Analytics
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center text-red-600 focus:text-red-600"
                  onClick={() => {
                    // Clear any stored auth data
                    localStorage.clear();
                    sessionStorage.clear();
                    // Redirect to login or refresh page
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start font-medium transition-colors ${
                      isActive 
                        ? "bg-primary text-white" 
                        : "text-gray-700 hover:text-primary"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Button>
                </Link>
              );
            })}
            
            {/* Mobile User Menu */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link href="/admin/settings">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Global Settings
                </Button>
              </Link>
              <Link href="/admin/system-archive">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Archive className="mr-2 h-4 w-4" />
                  System Archive
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <User className="mr-2 h-4 w-4" />
                  User Management
                </Button>
              </Link>
              <Link href="/admin/system-monitoring">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Activity className="mr-2 h-4 w-4" />
                  System Monitoring
                </Button>
              </Link>
              <Link href="/admin/email-templates">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Templates
                </Button>
              </Link>
              <Link href="/admin/audit-logs">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Audit Logs
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports & Analytics
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-600"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

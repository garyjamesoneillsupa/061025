import { Link } from "wouter";
import { Shield, Car, ArrowRight, Truck, Users, BarChart3, CheckCircle, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/layout/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00ABE7] to-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#00ABE7] to-blue-600 bg-clip-text text-transparent">
              OVM Pro
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-gray-600">
            <span className="text-sm font-medium">Professional Transport Management</span>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-[#00ABE7] via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Truck className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#00ABE7] via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                OVM Pro
              </h1>
              <p className="text-2xl md:text-3xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
                Professional Vehicle Transport Management System
              </p>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Streamline your fleet operations with our comprehensive PWA solution designed for modern transport businesses.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                  <p className="text-sm text-gray-600">Monitor vehicle collections and deliveries in real-time</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Offline Capable</h3>
                  <p className="text-sm text-gray-600">Continue operations even without internet connectivity</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">PWA Technology</h3>
                  <p className="text-sm text-gray-600">Native app experience across all devices</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Access Portals */}
        <section className="px-6 py-16 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Portal</h2>
              <p className="text-xl text-gray-600">Access the right tools for your role</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Admin Portal */}
              <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-blue-50 overflow-hidden">
                <CardContent className="p-10 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ABE7]/10 to-blue-600/20 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#00ABE7] to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-3xl font-bold text-gray-900">Admin Portal</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Complete fleet management dashboard with job tracking, driver management, and comprehensive reporting tools.
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 pt-2">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>User Management</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>Analytics</span>
                        </div>
                      </div>
                    </div>
                    <Link href="/admin">
                      <Button className="w-full h-14 text-lg bg-gradient-to-r from-[#00ABE7] to-blue-600 hover:from-blue-600 hover:to-[#00ABE7] transition-all duration-300 shadow-lg hover:shadow-xl">
                        Enter Admin Portal
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Portal */}
              <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50 overflow-hidden">
                <CardContent className="p-10 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-green-600/20 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Car className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-3xl font-bold text-gray-900">Driver Portal</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Mobile-optimized interface for drivers to manage collections, deliveries, and vehicle inspections on the go.
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 pt-2">
                        <div className="flex items-center space-x-1">
                          <Truck className="h-4 w-4" />
                          <span>Job Management</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe className="h-4 w-4" />
                          <span>Offline Ready</span>
                        </div>
                      </div>
                    </div>
                    <Link href="/drivers">
                      <Button className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl">
                        Enter Driver Portal
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* System Stats */}
        <section className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#00ABE7] to-blue-600 bg-clip-text text-transparent">
                  100%
                </div>
                <div className="text-sm text-gray-600 font-medium">Production Ready</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                  PWA
                </div>
                <div className="text-sm text-gray-600 font-medium">Mobile Optimized</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-gray-600 font-medium">Offline Capable</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Real-time
                </div>
                <div className="text-sm text-gray-600 font-medium">Data Sync</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
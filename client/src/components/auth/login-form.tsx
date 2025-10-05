import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertTriangle
} from "lucide-react";
import ovmLogo from "@assets/ovmlogo_1753908468997.png";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  pin: z.string().optional(),
}).refine(data => data.password || data.pin, {
  message: "Password is required",
  path: ["password"],
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLoginSuccess: (userData: any) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const adminForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      onLoginSuccess(data);
    },
    onError: (error) => {
      setLoginError(error.message);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAdminSubmit = (data: LoginFormData) => {
    setLoginError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 relative">
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '40px', paddingBottom: '140px' }}>
        <div className="p-4 w-full max-w-md">
          <Card className="w-full shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-8 pt-10">
          <div className="flex items-center justify-center mb-3">
            <img 
              src={ovmLogo} 
              alt="OVM Logo" 
              className="h-9 w-auto object-contain"
            />
            <span className="ml-[11px] text-[1.76rem] font-bold bg-gradient-to-r from-[#00ABE7] to-[#0096D1] bg-clip-text text-transparent leading-none">
              Pro
            </span>
          </div>
          <p className="text-gray-600 font-medium -mt-1">
            Vehicle Movement Software
          </p>

            </CardHeader>

            <CardContent className="space-y-6 px-8">
          {loginError && (
            <Alert className="border-[#00ABE7] bg-[#00ABE7]/10">
              <AlertTriangle className="h-4 w-4 text-[#00ABE7]" />
              <AlertDescription className="text-[#00ABE7] font-medium">{loginError}</AlertDescription>
            </Alert>
          )}

          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-5">
              <FormField
                control={adminForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your username"
                          className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 text-base"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 h-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#00ABE7] to-[#0096D1] hover:from-[#0096D1] hover:to-[#007BB8] text-white font-semibold text-base mt-6"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Use consistent footer component */}
      <div className="absolute bottom-0 left-0 right-0">
        <footer className="mt-auto py-6 px-4 border-t border-gray-200/50 bg-white">
          <div className="container mx-auto">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 tracking-wide">
                <span className="font-bold bg-gradient-to-r from-[#00ABE7] to-[#0096D1] bg-clip-text text-transparent">
                  OVM Pro
                </span>
                <span className="mx-2 text-gray-400">|</span>
                Vehicle Movement Software{' '}
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#00ABE7]/10 text-[#00ABE7] font-semibold text-xs">
                  v1.0
                </span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
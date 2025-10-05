import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import LoginForm from "./login-form";

interface User {
  id: string;
  username: string;
  role: 'admin' | 'driver';
  driverId?: string;
}

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token and validate it
  const { data: authenticatedUser, isError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        throw new Error("Invalid token");
      }

      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (authenticatedUser) {
      setUser(authenticatedUser);
      setIsLoading(false);
    } else if (isError) {
      setUser(null);
      setIsLoading(false);
    } else {
      // Check localStorage for existing user data
      const storedUserData = localStorage.getItem("userData");
      const storedToken = localStorage.getItem("authToken");
      
      if (storedUserData && storedToken) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
        } catch (error) {
          localStorage.removeItem("userData");
          localStorage.removeItem("authToken");
        }
      }
      setIsLoading(false);
    }
  }, [authenticatedUser, isError]);

  const handleLoginSuccess = (data: any) => {
    setUser(data.user);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("userData", JSON.stringify(data.user));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Pass user to children and provide logout function
  return (
    <>
      {children(user)}
      {/* Global logout handler can be added here if needed */}
    </>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

interface AuthRequiredProps {
  title?: string;
  message?: string;
  showSignInButton?: boolean;
  onSignIn?: () => void;
}

export function AuthRequired({ 
  title = "Sign in required", 
  message = "Please sign in to access this content.",
  showSignInButton = true,
  onSignIn 
}: AuthRequiredProps) {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {showSignInButton && (
          <CardContent className="text-center">
            <Button onClick={onSignIn} className="w-full">
              Sign In
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Helper function to check if data has auth-required state
export function hasAuthRequired(data: any): boolean {
  return data?.authRequired === true;
}
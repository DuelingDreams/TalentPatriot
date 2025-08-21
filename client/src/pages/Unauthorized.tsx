import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Unauthorized() {
  const { userRole, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-md">
        <Card className="bg-white">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-[#1A1A1A]">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-[#5C667B]">
              <p>Your current role: <span className="font-medium text-[#1A1A1A]">{userRole || 'Unknown'}</span></p>
              <p className="mt-2">Please contact your administrator if you believe this is an error.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                onClick={signOut}
                className="w-full text-[#5C667B]"
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
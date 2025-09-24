import { useAuth } from '@/contexts/AuthContext';
import { useUserOrganization } from '@/features/organization/hooks/useUserOrganization';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserMinus, Crown, Shield } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getOrganizationUsers } from '@/features/organization/hooks/useUserOrganization';

interface OrganizationUsersProps {
  orgId: string;
}

export function OrganizationUsers({ orgId }: OrganizationUsersProps) {
  const { user } = useAuth();
  const { removeUserFromOrganization, isRemoving } = useUserOrganization();

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['organization-users', orgId],
    queryFn: () => getOrganizationUsers(orgId),
    enabled: !!orgId,
  });

  const handleRemoveUser = async (userId: string) => {
    if (userId === user?.id) {
      return; // Can't remove yourself
    }

    if (confirm('Are you sure you want to remove this user from the organization?')) {
      await removeUserFromOrganization.mutateAsync({ orgId, userId });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading members...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">
            Failed to load organization members
          </div>
        </CardContent>
      </Card>
    );
  }

  const users = usersData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organization Members
        </CardTitle>
        <CardDescription>
          {users.length} {users.length === 1 ? 'member' : 'members'} in your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No members found. Start by inviting team members to your organization.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((member: any) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {member.user_id?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.user_id === user?.id ? 'You' : member.user_id}
                      </span>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(member.role) as any}>
                        {member.role}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {member.user_id !== user?.id && member.role !== 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveUser(member.user_id)}
                    disabled={isRemoving}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
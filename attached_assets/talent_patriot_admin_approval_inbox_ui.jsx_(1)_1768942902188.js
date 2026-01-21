import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, XCircle, UserCheck, Globe } from "lucide-react";
import { motion } from "framer-motion";

const pendingAdminClaims = [
  { id: 1, name: "Jane Recruiter", email: "jane@acmestaffing.com", requestedAt: "2 hours ago" },
];

const pendingPublishes = [
  { id: 2, org: "Acme Staffing", slug: "acme-staffing", requestedBy: "Jane Recruiter" },
];

export default function AdminApprovalInbox() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-2">Admin Approval Inbox</h1>
        <p className="text-muted-foreground mb-6">
          Review and approve admin requests and careers page publishing.
        </p>

        <Tabs defaultValue="publishing">
          <TabsList>
            <TabsTrigger value="publishing">Publish Requests</TabsTrigger>
            <TabsTrigger value="admins">Admin Role Requests</TabsTrigger>
          </TabsList>

          {/* Publish Requests */}
          <TabsContent value="publishing" className="mt-6 space-y-4">
            {pendingPublishes.map((item) => (
              <Card key={item.id} className="rounded-xl shadow">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <h3 className="font-medium">{item.org}</h3>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested by {item.requestedBy}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      careers.talentpatriot.com/{item.slug}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline">Preview</Button>
                    <Button className="bg-green-600 text-white">
                      <CheckCircle size={16} className="mr-1" /> Approve & Publish
                    </Button>
                    <Button variant="destructive">
                      <XCircle size={16} className="mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Admin Role Requests */}
          <TabsContent value="admins" className="mt-6 space-y-4">
            {pendingAdminClaims.map((user) => (
              <Card key={user.id} className="rounded-xl shadow">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserCheck size={16} />
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge variant="outline">Admin Request</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Requested {user.requestedAt}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button className="bg-green-600 text-white">
                      <CheckCircle size={16} className="mr-1" /> Approve Admin
                    </Button>
                    <Button variant="destructive">
                      <XCircle size={16} className="mr-1" /> Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

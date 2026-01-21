import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, Palette, Type, ShieldCheck, ShieldAlert, Link } from "lucide-react";
import { motion } from "framer-motion";

/**
 * WHITE-LABEL CONFIG
 * Can be driven by env, org tier, or reseller
 */
const WHITE_LABEL = {
  platformName: "TalentPatriot",
  careersDomain: "careers.talentpatriot.com",
  defaultPrimary: "#1E3A8A",
  defaultAccent: "#F97316",
  defaultFont: "font-sans",
};

const steps = [
  "Welcome",
  "Organization",
  "Branding",
  "Careers",
  "URL",
  "Role",
  "Review",
  "Complete",
];

export default function WhiteLabelRoleAwareOnboarding() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("recruiter"); // recruiter | admin
  const [adminClaim, setAdminClaim] = useState(false);

  const [org, setOrg] = useState({
    name: "",
    type: "",
    logo: null,
    primaryColor: WHITE_LABEL.defaultPrimary,
    accentColor: WHITE_LABEL.defaultAccent,
    font: WHITE_LABEL.defaultFont,
    headline: "",
    mission: "",
    published: false,
  });

  const careersSlug = org.name.toLowerCase().replace(/\s+/g, "-");

  const canPublish = role === "admin" && adminClaim;

  return (
    <div className="min-h-screen bg-muted p-8 flex justify-center">
      <Card className="w-full max-w-4xl rounded-2xl shadow-xl">
        <CardContent className="p-8 space-y-6">
          <Progress value={((step + 1) / steps.length) * 100} />

          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

            {/* STEP 0: Welcome */}
            {step === 0 && (
              <section className="space-y-4">
                <h1 className="text-2xl font-bold">Welcome to {WHITE_LABEL.platformName}</h1>
                <p className="text-muted-foreground">
                  Set up your organization and careers page. Admins can publish; recruiters can draft safely.
                </p>
              </section>
            )}

            {/* STEP 1: Organization */}
            {step === 1 && (
              <section className="space-y-4">
                <Label>Organization Name</Label>
                <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />

                <Label>Business Type</Label>
                <Select value={org.type} onValueChange={(v) => setOrg({ ...org, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employer">Direct Employer</SelectItem>
                    <SelectItem value="staffing">Staffing / Recruiting Firm</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            )}

            {/* STEP 2: Branding (ADMIN-ENHANCED) */}
            {step === 2 && (
              <section className="space-y-4">
                <Label className="flex gap-2 items-center"><Upload size={16} /> Logo</Label>
                <Input type="file" onChange={(e) => setOrg({ ...org, logo: URL.createObjectURL(e.target.files[0]) })} />
                {org.logo && <img src={org.logo} className="h-14 rounded" />}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label><Palette size={14} /> Primary Color</Label>
                    <Input type="color" value={org.primaryColor} onChange={(e) => setOrg({ ...org, primaryColor: e.target.value })} />
                  </div>

                  <div>
                    <Label><Type size={14} /> Font</Label>
                    <Select value={org.font} onValueChange={(v) => setOrg({ ...org, font: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="font-sans">Inter</SelectItem>
                        <SelectItem value="font-roboto">Roboto</SelectItem>
                        <SelectItem value="font-poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3: Careers Content */}
            {step === 3 && (
              <section className="space-y-4">
                <Label>Headline</Label>
                <Input value={org.headline} onChange={(e) => setOrg({ ...org, headline: e.target.value })} />

                <Label>Mission</Label>
                <Input value={org.mission} onChange={(e) => setOrg({ ...org, mission: e.target.value })} />
              </section>
            )}

            {/* STEP 4: URL Preview */}
            {step === 4 && (
              <section className="space-y-4">
                <Label>Careers Page URL</Label>
                <div className="border rounded p-3 text-sm flex gap-2 items-center">
                  <Link size={14} /> https://{WHITE_LABEL.careersDomain}/{careersSlug}
                </div>
                <p className="text-xs text-muted-foreground">Draft until published by admin</p>
              </section>
            )}

            {/* STEP 5: Role Gate */}
            {step === 5 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Your Role</h2>
                <div className="flex gap-4">
                  <Button variant={role === "admin" ? "default" : "outline"} onClick={() => { setRole("admin"); setAdminClaim(true); }}>
                    <ShieldCheck size={16} className="mr-2" /> I’m the Admin
                  </Button>
                  <Button variant={role === "recruiter" ? "default" : "outline"} onClick={() => { setRole("recruiter"); setAdminClaim(false); }}>
                    <ShieldAlert size={16} className="mr-2" /> I’m a Recruiter
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 6: Review & Publish */}
            {step === 6 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Review & Finalize</h2>
                <div className="border rounded p-4 text-sm space-y-1">
                  <p><strong>Org:</strong> {org.name}</p>
                  <p><strong>Headline:</strong> {org.headline}</p>
                  <p><strong>Mission:</strong> {org.mission}</p>
                </div>

                {canPublish ? (
                  <div className="flex items-center justify-between">
                    <span>Publish careers page</span>
                    <Switch checked={org.published} onCheckedChange={(v) => setOrg({ ...org, published: v })} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Admin approval required to publish.</p>
                )}
              </section>
            )}

            {/* STEP 7: Complete */}
            {step === 7 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold">Setup Complete</h2>
                {canPublish && org.published ? (
                  <p>Your careers page is live.</p>
                ) : (
                  <p>Your setup is saved. Waiting for admin approval.</p>
                )}
              </section>
            )}

          </motion.div>

          <div className="flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button onClick={() => setStep(Math.min(step + 1, steps.length - 1))}>
              {step === steps.length - 1 ? "Finish" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

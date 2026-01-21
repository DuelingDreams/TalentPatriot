import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Check, X, MessageSquare, Filter, Search, ExternalLink, Download, Settings, ChevronRight, Sparkles } from "lucide-react";

/**
 * TalentPatriot — White‑Label Client Portal (Demo Mockup)
 * ------------------------------------------------------------------
 * Single-file React component (Tailwind + shadcn/ui) to demo how a
 * white‑label client portal would look/feel for SMB staffing firms.
 *
 * Features shown:
 *  - White‑label header (logo, domain, brand color)
 *  - Jobs tab with job list + selected job details
 *  - Candidate review cards with Approve/Reject/Request Interview
 *  - Feedback drawer (inline for demo) and rating
 *  - Messages tab (thread preview)
 *  - Settings tab to live‑tweak brand (logo, color, org name, domain)
 *
 * Usage: drop into your app and render <ClientPortalMock />
 */

export default function ClientPortalMock() {
  // BRANDING (white‑label)
  const [brand, setBrand] = useState({
    orgName: "Hildebrand Staffing",
    domain: "portal.hildebrandstaffing.com",
    color: "#1F3A5F",
    logoUrl: "https://dummyimage.com/160x40/1f3a5f/ffffff&text=Your+Logo",
  });

  // DATA (demo)
  const jobs = [
    { id: "job1", title: "Cloud Engineer", dept: "IT", location: "Remote", openSince: "Aug 12, 2025", submitted: 3 },
    { id: "job2", title: "Data Analyst", dept: "Operations", location: "Austin, TX", openSince: "Sep 2, 2025", submitted: 2 },
    { id: "job3", title: "HR Generalist", dept: "People", location: "Remote", openSince: "Aug 30, 2025", submitted: 1 },
  ];

  const [activeJobId, setActiveJobId] = useState("job1");
  const activeJob = useMemo(() => jobs.find(j => j.id === activeJobId)!, [activeJobId]);

  const [candidates, setCandidates] = useState([
    {
      id: "c1",
      name: "Jordan Lee",
      role: "Cloud Engineer",
      exp: "7 yrs – AWS, Terraform, Kubernetes",
      rating: 4,
      status: "Submitted",
      resumeUrl: "#",
      summary: "Led IaC rollout, 40% infra cost reduction; built multi‑region failover.",
    },
    {
      id: "c2",
      name: "Avery Kim",
      role: "Cloud Engineer",
      exp: "5 yrs – Azure, AKS, Bicep",
      rating: 5,
      status: "Interview Requested",
      resumeUrl: "#",
      summary: "Migrated SAP to Azure; observability with OpenTelemetry.",
    },
    {
      id: "c3",
      name: "Casey Patel",
      role: "Cloud Engineer",
      exp: "9 yrs – GCP, Anthos, Istio",
      rating: 3,
      status: "Submitted",
      resumeUrl: "#",
      summary: "Built service mesh; reduced MTTR by 30% via SLOs & runbooks.",
    },
  ]);

  // FEEDBACK state (inline demo)
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const setCandidateStatus = (id: string, next: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
  };

  const setCandidateRating = (id: string, next: number) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, rating: next } : c));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50" style={{ ['--brand' as any]: brand.color }}>
      {/* Header (white‑label) */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt="logo" className="h-8 w-auto" />
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm text-slate-600">Signed in to <span className="font-medium text-slate-800">{brand.domain}</span></div>
          <div className="ml-auto flex items-center gap-2">
            <Badge style={{ backgroundColor: "var(--brand)" }} className="text-white">Client Portal</Badge>
            <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4 mr-2"/>Help</Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Jobs list & filters */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4"/>Open Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
                <Input placeholder="Search jobs" className="pl-8"/>
              </div>
              <div className="mt-4 space-y-2">
                {jobs.map(j => (
                  <button key={j.id} onClick={() => setActiveJobId(j.id)} className={`w-full text-left rounded-xl border p-3 hover:border-slate-400 transition ${activeJobId===j.id ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{j.title}</div>
                        <div className="text-xs text-slate-600">{j.dept} • {j.location}</div>
                      </div>
                      <Badge variant="secondary">{j.submitted} submitted</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Open since {j.openSince}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Branding quick settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4"/>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={brand.orgName} onChange={e=>setBrand(b=>({ ...b, orgName: e.target.value }))} placeholder="Organization name"/>
              <Input value={brand.domain} onChange={e=>setBrand(b=>({ ...b, domain: e.target.value }))} placeholder="Portal domain"/>
              <Input value={brand.logoUrl} onChange={e=>setBrand(b=>({ ...b, logoUrl: e.target.value }))} placeholder="Logo URL"/>
              <Input type="color" value={brand.color} onChange={e=>setBrand(b=>({ ...b, color: e.target.value }))} />
              <Button className="w-full" style={{ backgroundColor: "var(--brand)" }}>
                <Sparkles className="h-4 w-4 mr-2"/>Apply Theme
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Job details & candidates */}
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>{activeJob.title}</span>
                <div className="text-sm text-slate-500">{activeJob.location} • {activeJob.dept}</div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="candidates">
                <TabsList>
                  <TabsTrigger value="candidates">Candidates</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="about">About Role</TabsTrigger>
                </TabsList>

                {/* Candidates */}
                <TabsContent value="candidates" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.map(c => (
                      <Card key={c.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`} />
                              <AvatarFallback>{c.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-slate-900">{c.name}</div>
                                  <div className="text-xs text-slate-600">{c.role}</div>
                                </div>
                                <Badge variant="outline" style={{ borderColor: "var(--brand)", color: "var(--brand)" }}>{c.status}</Badge>
                              </div>
                              <div className="text-sm text-slate-700 mt-2">{c.exp}</div>
                              <div className="text-sm text-slate-600 mt-1">{c.summary}</div>

                              {/* Rating */}
                              <div className="flex items-center gap-1 mt-3">
                                {[1,2,3,4,5].map(n => (
                                  <button key={n} onClick={()=>setCandidateRating(c.id, n)} className={`p-1 ${n <= c.rating ? 'text-yellow-500' : 'text-slate-300'}`} aria-label={`rate ${n}`}>
                                    <Star className="h-4 w-4 fill-current"/>
                                  </button>
                                ))}
                              </div>

                              {/* Actions */}
                              <div className="mt-4 flex items-center gap-2">
                                <Button size="sm" style={{ backgroundColor: "var(--brand)" }} onClick={()=>setCandidateStatus(c.id, "Approved")}> <Check className="h-4 w-4 mr-1"/> Approve</Button>
                                <Button size="sm" variant="destructive" onClick={()=>setCandidateStatus(c.id, "Rejected")}><X className="h-4 w-4 mr-1"/> Reject</Button>
                                <Button size="sm" variant="outline" onClick={()=>setCandidateStatus(c.id, "Interview Requested")}><MessageSquare className="h-4 w-4 mr-1"/> Request Interview</Button>
                                <Button size="sm" variant="ghost"><Download className="h-4 w-4 mr-1"/> Resume</Button>
                              </div>

                              {/* Feedback */}
                              <div className="mt-3">
                                <Textarea rows={3} placeholder="Private feedback to recruiter (only your team can see this)"
                                  value={feedback[c.id] ?? ""}
                                  onChange={e=>setFeedback(f=>({ ...f, [c.id]: e.target.value }))}
                                />
                                <div className="mt-2 text-right">
                                  <Button size="sm" variant="secondary">Submit Feedback <ChevronRight className="h-4 w-4 ml-1"/></Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Messages */}
                <TabsContent value="messages" className="pt-4">
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600">Thread with your recruiter</div>
                    <Card className="bg-slate-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="text-sm"><span className="font-medium">Recruiter</span>: Submitted 3 candidates for review.</div>
                        <div className="text-sm"><span className="font-medium">You</span>: Reviewing now, will request interview for Avery.</div>
                        <div className="text-sm"><span className="font-medium">Recruiter</span>: Great — I’ll propose times for next week.</div>
                      </CardContent>
                    </Card>
                    <div className="flex gap-2">
                      <Input placeholder="Write a message to your recruiter..."/>
                      <Button style={{ backgroundColor: "var(--brand)" }}>Send</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* About */}
                <TabsContent value="about" className="pt-4">
                  <div className="prose prose-slate max-w-none">
                    <h3>About the role</h3>
                    <p>We’re seeking a Cloud Engineer to design, build, and operate secure, scalable infrastructure. Must have strong experience with IaC (Terraform/Bicep), containers, and at least one cloud provider.</p>
                    <ul>
                      <li>Tech: AWS/Azure/GCP, Kubernetes, IaC</li>
                      <li>Process: GitOps, CICD, Observability</li>
                      <li>Nice to have: FinOps, SRE practices</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust footer (white‑label, minimal TP mention if any) */}
          <div className="text-center text-xs text-slate-500 py-4">© {new Date().getFullYear()} {brand.orgName} • Powered by TalentPatriot</div>
        </div>
      </div>
    </div>
  );
}

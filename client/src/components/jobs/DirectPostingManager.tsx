import { useState, useEffect } from 'react';
import { Copy, ExternalLink, Share2, QrCode, Download, Settings, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  generateDirectPostingLink, 
  generateEmbedCode, 
  generateSocialShareLinks, 
  generateQRCodeUrl,
  copyToClipboard,
  type DirectPostingConfig 
} from '@/utils/directPosting';
import type { Job } from '@shared/schema';

interface DirectPostingManagerProps {
  job: Job;
  baseUrl?: string;
}

export default function DirectPostingManager({ job, baseUrl = window.location.origin }: DirectPostingManagerProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<DirectPostingConfig>({
    baseUrl,
    jobId: job.id,
    customization: {
      companyName: '',
      logo: '',
      primaryColor: '#1F3A5F',
      hideHeader: false,
    }
  });

  const [generatedLink, setGeneratedLink] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const link = generateDirectPostingLink(config);
    const embed = generateEmbedCode(config);
    const qr = generateQRCodeUrl(config);
    
    setGeneratedLink(link);
    setEmbedCode(embed);
    setQrCodeUrl(qr);
  }, [config]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(config);
    if (success) {
      toast({
        title: "Link Copied!",
        description: "Direct posting link copied to clipboard.",
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast({
        title: "Embed Code Copied!",
        description: "Embed code copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the embed code manually.",
        variant: "destructive",
      });
    }
  };

  const updateCustomization = (field: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        [field]: value
      }
    }));
  };

  const socialLinks = generateSocialShareLinks(config, job.title);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Direct Posting Links
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generate shareable links and embed codes for "{job.title}"
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Link</TabsTrigger>
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
            <TabsTrigger value="social">Social Share</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="direct-link">Direct Posting Link</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  id="direct-link"
                  value={generatedLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopyLink} size="sm" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => window.open(generatedLink, '_blank')} 
                  size="sm" 
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this link directly with candidates or post on job boards
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">QR Code</h4>
                <div className="text-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Job Posting QR Code" 
                    className="mx-auto mb-2 border rounded"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `job-${job.id}-qr.png`;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">Link Analytics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Views:</span>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Applications:</span>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion:</span>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <div>
              <Label htmlFor="embed-code">Embed Code</Label>
              <Textarea 
                id="embed-code"
                value={embedCode} 
                readOnly 
                className="font-mono text-sm mt-2"
                rows={8}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Copy this HTML code to embed the job posting on your website
                </p>
                <Button onClick={handleCopyEmbed} size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </div>

            <Card className="p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="border bg-white rounded p-2">
                <iframe 
                  src={generatedLink} 
                  width="100%" 
                  height="400" 
                  className="border-0 rounded"
                  title="Job Posting Preview"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Share on Social Media</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(socialLinks.linkedin, '_blank')}
                >
                  <div className="w-5 h-5 bg-blue-600 rounded mr-3"></div>
                  Share on LinkedIn
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(socialLinks.twitter, '_blank')}
                >
                  <div className="w-5 h-5 bg-sky-500 rounded mr-3"></div>
                  Share on Twitter
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(socialLinks.facebook, '_blank')}
                >
                  <div className="w-5 h-5 bg-blue-800 rounded mr-3"></div>
                  Share on Facebook
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(socialLinks.email, '_blank')}
                >
                  <div className="w-5 h-5 bg-gray-600 rounded mr-3"></div>
                  Share via Email
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Social Media Copy</h4>
              <Card className="p-3">
                <p className="text-sm text-gray-700 mb-2">
                  🚀 We're hiring! Check out this amazing opportunity: {job.title}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  {job.location && `📍 ${job.location}`}
                  {job.jobType && ` • ${job.jobType.replace('-', ' ')}`}
                </p>
                <p className="text-sm text-blue-600 font-mono">
                  {generatedLink}
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={async () => {
                    const text = `🚀 We're hiring! Check out this amazing opportunity: ${job.title}\n${job.location ? `📍 ${job.location}` : ''}${job.jobType ? ` • ${job.jobType.replace('-', ' ')}` : ''}\n\n${generatedLink}`;
                    try {
                      await navigator.clipboard.writeText(text);
                      toast({
                        title: "Social Copy Copied!",
                        description: "Social media post copied to clipboard.",
                      });
                    } catch (error) {
                      toast({
                        title: "Copy Failed",
                        description: "Please copy the text manually.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Social Post
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name (Optional)</Label>
                <Input 
                  id="company-name"
                  value={config.customization?.companyName || ''} 
                  onChange={(e) => updateCustomization('companyName', e.target.value)}
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <Label htmlFor="logo-url">Company Logo URL (Optional)</Label>
                <Input 
                  id="logo-url"
                  value={config.customization?.logo || ''} 
                  onChange={(e) => updateCustomization('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    id="primary-color"
                    type="color"
                    value={config.customization?.primaryColor || '#1F3A5F'} 
                    onChange={(e) => updateCustomization('primaryColor', e.target.value)}
                    className="w-20"
                  />
                  <Input 
                    value={config.customization?.primaryColor || '#1F3A5F'} 
                    onChange={(e) => updateCustomization('primaryColor', e.target.value)}
                    placeholder="#1F3A5F"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hide-header">Hide Header</Label>
                  <p className="text-sm text-gray-500">Remove the TalentPatriot header from the job posting</p>
                </div>
                <Switch 
                  id="hide-header"
                  checked={config.customization?.hideHeader || false}
                  onCheckedChange={(checked) => updateCustomization('hideHeader', checked)}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                <Label>Live Preview</Label>
              </div>
              <Card className="p-2 bg-gray-50">
                <iframe 
                  src={generatedLink} 
                  width="100%" 
                  height="300" 
                  className="border-0 rounded bg-white"
                  title="Customization Preview"
                />
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
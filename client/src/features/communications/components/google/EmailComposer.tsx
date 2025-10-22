import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Paperclip } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EmailComposerProps {
  fromEmail?: string;
  toEmail?: string;
  subject?: string;
  threadId?: string;
  onSent?: () => void;
}

export function EmailComposer({
  fromEmail = "recruiter@talentpatriot.com",
  toEmail = "",
  subject = "",
  threadId,
  onSent,
}: EmailComposerProps) {
  const [to, setTo] = useState(toEmail);
  const [subjectValue, setSubjectValue] = useState(subject);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!to || !subjectValue || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Send email through backend
      await apiRequest('/api/messages/email', {
        method: 'POST',
        body: JSON.stringify({
          to,
          subject: subjectValue,
          body,
          threadId,
          channelType: 'email',
        }),
      });

      toast({
        title: "Email sent",
        description: "Your message has been sent successfully",
      });

      // Clear form
      setTo("");
      setSubjectValue("");
      setBody("");

      // Invalidate messages cache
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });

      onSent?.();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-from">From</Label>
        <Input
          id="email-from"
          value={fromEmail}
          disabled
          className="bg-muted"
          data-testid="input-email-from"
        />
        <p className="text-xs text-muted-foreground">
          This is your organization's sending email address
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-to">
          To <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email-to"
          type="email"
          placeholder="candidate@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          data-testid="input-email-to"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email-subject"
          placeholder="Interview invitation"
          value={subjectValue}
          onChange={(e) => setSubjectValue(e.target.value)}
          data-testid="input-email-subject"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-body">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="email-body"
          placeholder="Write your message here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="resize-none"
          data-testid="textarea-email-body"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          data-testid="button-attach-file"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Attach File
          <span className="ml-2 text-xs text-muted-foreground">(Soon)</span>
        </Button>

        <Button
          onClick={handleSend}
          disabled={isSending || !to || !subjectValue || !body}
          data-testid="button-send-email"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

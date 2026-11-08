"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  PhoneCall,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrandFooter() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("POS & Billing Issue");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    const ticketId = `#TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedTicket(ticketId);
  };

  const handleClose = (open: boolean) => {
    setSupportOpen(open);
    if (!open) {
      setTimeout(() => {
        setSubmittedTicket(null);
        setSubject("");
        setMessage("");
      }, 300);
    }
  };

  const whatsappUrl = `https://wa.me/918446653644?text=${encodeURIComponent(
    `Hi Modexsys Support, I need help with my restaurant POS system${
      subject ? ` (Issue: ${subject})` : ""
    }.`,
  )}`;

  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border/50 px-3 py-2.5">
      <button
        type="button"
        onClick={() => setSupportOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 px-3 py-2 text-xs font-semibold text-sidebar-foreground transition-all hover:border-primary/40 hover:bg-sidebar-accent hover:text-primary shadow-xs"
      >
        <LifeBuoy className="h-4 w-4 text-primary" />
        <span>Modexsys Support</span>
      </button>

      {/* Support Ticket & WhatsApp Help Modal */}
      <Dialog open={supportOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <LifeBuoy className="size-5 text-primary" />
              Modexsys Support &amp; Help Desk
            </DialogTitle>
            <DialogDescription className="text-xs">
              Raise an issue or contact our 24/7 restaurant technical support team
            </DialogDescription>
          </DialogHeader>

          {submittedTicket ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>

              <div>
                <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30 bg-primary/5">
                  Ticket {submittedTicket} Created
                </Badge>
                <h3 className="mt-2 text-base font-bold text-foreground">
                  Your ticket has been logged!
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Your issue will be solved and our team will contact you within the next 24 hours.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3 text-xs text-left space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <Clock className="size-3.5" />
                  Need Instant Assistance?
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Till that you can WhatsApp us directly for faster response.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01]"
                >
                  {/* WhatsApp SVG Icon */}
                  <svg viewBox="0 0 24 24" className="size-4 fill-current">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.83c0 4.53-3.69 8.23-8.23 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.02 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                  </svg>
                  Chat on WhatsApp (+91 8446653644)
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose(false)}
                  className="h-9 text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
              <div>
                <Label htmlFor="issueCat" className="text-xs font-medium">
                  Issue Category
                </Label>
                <select
                  id="issueCat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium"
                >
                  <option value="POS & Billing Issue">POS &amp; Billing Issue</option>
                  <option value="Thermal Printer / Hardware">Thermal Printer / Hardware</option>
                  <option value="Kitchen Display (KDS)">Kitchen Display (KDS)</option>
                  <option value="QR Code & Online Ordering">QR Code &amp; Online Ordering</option>
                  <option value="GST & Reports Invoicing">GST &amp; Reports Invoicing</option>
                  <option value="Account / Outlet Setup">Account / Outlet Setup</option>
                  <option value="Other Technical Query">Other Technical Query</option>
                </select>
              </div>

              <div>
                <Label htmlFor="issueSubject" className="text-xs font-medium">
                  Subject / Summary <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="issueSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Printer not printing KOT tickets"
                  required
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="issuePhone" className="text-xs font-medium">
                  Contact Mobile Number
                </Label>
                <Input
                  id="issuePhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="issueDetails" className="text-xs font-medium">
                  Describe what happened
                </Label>
                <textarea
                  id="issueDetails"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide details so our engineers can quickly reproduce and fix..."
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-xs resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <Button type="submit" className="h-10 w-full gap-2 font-semibold text-xs shadow-sm">
                  <Send className="size-3.5" />
                  Submit Support Ticket
                </Button>

                <div className="relative my-1 text-center">
                  <span className="bg-background px-2 text-[10px] text-muted-foreground uppercase font-medium">
                    Or For Faster Response
                  </span>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.83c0 4.53-3.69 8.23-8.23 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.02 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                  </svg>
                  WhatsApp Us: 8446653644
                </a>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

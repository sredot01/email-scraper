import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [url, setUrl] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const scrapeEmails = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    setLoading(true);
    try {
      // Placeholder scraping logic
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Failed to scrape");
      const data = await response.json();
      setEmails(data.emails || []);
      toast.success(`Found ${data.emails?.length || 0} emails`);
    } catch (error) {
      toast.error("Failed to scrape emails");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Scraper</CardTitle>
            <CardDescription>
              Enter a URL to extract email addresses from the page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scrapeEmails()}
              />
              <Button onClick={scrapeEmails} disabled={loading}>
                {loading ? "Scraping..." : "Scrape"}
              </Button>
            </div>
            {emails.length > 0 && (
              <Textarea
                value={emails.join("\n")}
                readOnly
                className="min-h-[200px] font-mono text-sm"
                placeholder="Extracted emails will appear here"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

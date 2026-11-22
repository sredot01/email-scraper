import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateInterviewPrep } from "@/lib/interview-prep.functions";
import type { InterviewPrep } from "@/lib/interview-prep.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Prep — tailored questions & study plan" },
      {
        name: "description",
        content:
          "Paste an interview email and get AI-tailored practice questions, topics to study, and a time-boxed preparation plan.",
      },
      { property: "og:title", content: "Interview Prep — tailored questions & study plan" },
      {
        property: "og:description",
        content:
          "Paste an interview email and get AI-tailored practice questions, topics to study, and a time-boxed preparation plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SAMPLE_EMAIL = `Subject: Interview — Please confirm

Hi Alex,

Great speaking with you! Your video interview with Acme Cloud for the Platform Engineer role is scheduled for Friday 10/30 at 3:00 PM IST and will run for 60 minutes via Microsoft Teams. Please join 10 minutes early with your camera on.

We'd like to cover: Kubernetes and container troubleshooting, Terraform modules, CI/CD pipeline design, and your experience mentoring junior engineers. Come prepared to walk through a pipeline you have built and to troubleshoot a failing deployment live.

Please reply to confirm you can make it.

Best regards,
Priya Sharma
Talent Partner, Acme Cloud`;

function Index() {
  const prepFn = useServerFn(generateInterviewPrep);
  const [emailText, setEmailText] = useState("");
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setPrep(null);
    setIsPending(true);
    try {
      const result = await prepFn({ data: { emailText } });
      setPrep(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            AI-powered interview prep
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn an interview email into a game plan
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Paste the email you received about an upcoming interview. You'll get the key
            details, the topics to study, tailored practice questions, and a plan for the
            hours you have left.
          </p>
        </header>

        <div className="mt-10 rounded-2xl border bg-card p-6 shadow-sm">
          <label className="text-sm font-medium" htmlFor="email">
            Interview email
          </label>
          <textarea
            id="email"
            className="mt-2 min-h-[220px] w-full rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste the full email here — subject, body, everything..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={isPending || !emailText.trim()}
              className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {isPending ? "Generating..." : "Generate prep"}
            </button>
            <button
              type="button"
              onClick={() => setEmailText(SAMPLE_EMAIL)}
              className="rounded-full border px-6 py-2.5 text-sm font-medium"
            >
              Try a sample email
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Analyzed on the server, never stored. Verify details against the original email.
          </p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {prep && (
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-xl font-semibold">Key details</h2>
              <pre className="mt-3 whitespace-pre-wrap text-sm">{JSON.stringify(prep, null, 2)}</pre>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { Check, Copy, HardDrive, Server, Terminal, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AnimatedCounter } from "@/components/marketing/animated-counter";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { downloadHref, totalDownloads } from "@/lib/downloads";
import { useDownloadStats } from "@/hooks/use-download-stats";

const INSTALL_COMMAND =
  "curl -fsSL https://horeca.modexsys.com/quickstart.sh | bash";

const channels = [
  {
    channel: "install-script" as const,
    icon: Terminal,
    title: "One-click install",
    description: "Run install.sh on your server — auto-generates secrets, sets up Postgres, and launches the stack.",
  },
  {
    channel: "docker" as const,
    icon: HardDrive,
    title: "Docker Compose",
    description: "Postgres, API, and web app — three high-performance containers running locally on port 1995.",
  },
  {
    channel: "casaos" as const,
    icon: Server,
    title: "Dedicated Local Server",
    description: "Deploy onto your local in-restaurant hardware or private cloud box with zero WAN dependency.",
  },
  {
    channel: "docker" as const,
    icon: ShieldCheck,
    title: "Offline-First Security",
    description: "Proprietary software by Modexsys. Run locally on your restaurant LAN with 100% data sovereignty.",
  },
];

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(INSTALL_COMMAND);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="group flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-left font-mono text-[13px] text-foreground/90 transition-colors hover:border-primary/40"
    >
      <span className="truncate">{INSTALL_COMMAND}</span>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  );
}

export function InstallSection() {
  const { data: stats } = useDownloadStats();
  const total = totalDownloads(stats);

  return (
    <section id="get-started" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Running in minutes, not a sales call
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Deploy Modexsys HORECA on your local hardware or in-restaurant server.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8 flex justify-center">
        <CopyCommand />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((c, i) => (
          <RevealItem key={`${c.title}-${i}`}>
            <a
              href={downloadHref(c.channel)}
              className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </p>
              <span className="mt-4 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Deploy now &rarr;
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.15} className="mt-14 flex flex-col items-center gap-1 text-center">
        <p className="text-4xl font-semibold tabular-nums text-foreground sm:text-5xl">
          <AnimatedCounter value={total} />
        </p>
        <p className="text-sm text-muted-foreground">
          HORECA nodes and server instances deployed worldwide.
        </p>
      </Reveal>
    </section>
  );
}
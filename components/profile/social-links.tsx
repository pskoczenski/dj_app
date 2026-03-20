import type { Json } from "@/types";
import { Globe, Instagram, Facebook, Twitter } from "lucide-react";

interface SocialLinksProps {
  links: Json | null;
}

interface LinkEntry {
  platform: string;
  url: string;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  website: Globe,
};

function parseLinks(raw: Json | null): LinkEntry[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === "string" && (v as string).length > 0)
    .map(([platform, url]) => ({ platform, url: url as string }));
}

export function SocialLinks({ links }: SocialLinksProps) {
  const entries = parseLinks(links);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {entries.map(({ platform, url }) => {
        const Icon = ICONS[platform.toLowerCase()] ?? Globe;
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-stone hover:text-bone"
          >
            <Icon className="size-4" />
            <span className="capitalize">{platform}</span>
          </a>
        );
      })}
    </div>
  );
}

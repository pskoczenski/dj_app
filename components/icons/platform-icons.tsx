import type { SVGProps } from "react";

type PlatformIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function base({ size, ...rest }: PlatformIconProps, defaultSize = 20) {
  const s = size ?? defaultSize;
  return { width: s, height: s, viewBox: "0 0 24 24", fill: "currentColor", ...rest };
}

export function SoundCloudIcon(props: PlatformIconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M1 18V15h1v3H1zm2.5-5V18H5V13H3.5zM6 10v8h1.5V10H6zm2.5-1v9H10V9H8.5zM11 7v11h1.5V7H11zm3.5 0c2.5 0 4.5 2 4.5 4.5S17 16 14.5 16H13V7h1.5z" />
    </svg>
  );
}

export function MixcloudIcon(props: PlatformIconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M4.5 17A3.5 3.5 0 0 1 4.5 10h1A4.5 4.5 0 0 1 10 6.5c1.8 0 3.4 1 4.2 2.5h.3a3.5 3.5 0 0 1 0 7H4.5z" />
    </svg>
  );
}

export function SpotifyIcon(props: PlatformIconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 14.4a.6.6 0 0 1-.8.2c-2.3-1.4-5.2-1.7-8.6-.9a.6.6 0 1 1-.3-1.2c3.7-.8 6.9-.5 9.5 1.1a.6.6 0 0 1 .2.8zm1.2-2.7a.8.8 0 0 1-1.1.3c-2.7-1.6-6.7-2.1-9.8-1.1a.8.8 0 1 1-.4-1.5c3.6-1.1 8-.6 11 1.2a.8.8 0 0 1 .3 1.1zm.1-2.8C14.7 9 8.8 8.8 5.4 9.8a.9.9 0 1 1-.5-1.8c3.9-1.1 10.3-.9 14.3 1.2a.9.9 0 0 1-.3 1.7z" />
    </svg>
  );
}

export function YouTubeIcon(props: PlatformIconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.9 31.9 0 0 0 0 12a31.9 31.9 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-2 .5-5.8.5-5.8s0-3.8-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z" />
    </svg>
  );
}

export function AppleMusicIcon(props: PlatformIconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M18.5 2h-13A3.5 3.5 0 0 0 2 5.5v13A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5v-13A3.5 3.5 0 0 0 18.5 2zm-1 12.3c0 1.5-1.1 2.7-2.5 2.7s-2-.8-2-1.8.9-1.8 2-2v-4l-5 1.5V16c0 1.5-1.1 2.5-2.5 2.5S6 17.8 6 16.7s.9-1.9 2-2V9.5l7-2.2v7z" />
    </svg>
  );
}

export const platformIcons: Record<string, typeof SoundCloudIcon> = {
  soundcloud: SoundCloudIcon,
  mixcloud: MixcloudIcon,
  spotify: SpotifyIcon,
  youtube: YouTubeIcon,
  apple_music: AppleMusicIcon,
};

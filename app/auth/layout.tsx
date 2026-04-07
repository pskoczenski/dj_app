import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-deep-loam px-4 py-10">
      <div className="mb-8">
        <Link href="/" className="inline-block">
          <Wordmark className="text-sm" />
        </Link>
      </div>
      <div className="w-full max-w-md rounded-default border border-root-line bg-dark-moss p-8 shadow-default">
        {children}
      </div>
    </div>
  );
}

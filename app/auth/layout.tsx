export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-deep-loam px-4">
      <div className="w-full max-w-md rounded-default border border-root-line bg-dark-moss p-8 shadow-default">
        {children}
      </div>
    </div>
  );
}


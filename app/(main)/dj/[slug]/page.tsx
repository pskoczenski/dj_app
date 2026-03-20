export default async function DjProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-bone">@{slug}</h1>
      <p className="mt-2 text-stone">DJ profile page — coming soon.</p>
    </div>
  );
}

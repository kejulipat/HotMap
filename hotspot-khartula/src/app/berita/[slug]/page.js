export async function generateMetadata({ params }) {
  const { slug } = await params;

  return {
    title: `Detail Berita: ${slug} | Hotspot Karhutla`,
  };
}

export default async function DetailBeritaPage({ params }) {
  const { slug } = await params;

  return (
    <main>
      <h1>Detail Berita: {slug}</h1>
    </main>
  );
}


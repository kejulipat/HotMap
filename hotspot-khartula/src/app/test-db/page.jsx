import { createClient } from "@/lib/supabase/server";

// Selalu ambil data terbaru (tanpa cache) saat halaman dibuka.
export const dynamic = "force-dynamic";

function DataTable({ title, result }) {
  const { data, error } = result;
  const rows = data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {error ? (
          <span className="rounded bg-red-100 px-2 py-0.5 text-sm text-red-700">
            Gagal
          </span>
        ) : (
          <span className="rounded bg-green-100 px-2 py-0.5 text-sm text-green-700">
            {rows.length} baris
          </span>
        )}
      </div>

      {error && (
        <pre className="overflow-x-auto rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!error && rows.length === 0 && (
        <p className="text-sm text-gray-500">
          Tabel kosong, atau data tidak terlihat karena kebijakan RLS.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i} className="border-t border-gray-200">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 align-top">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatCell(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function TestDbPage() {
  const supabase = await createClient();

  const [wilayah, laporan] = await Promise.all([
    supabase.from("wilayah").select("*").limit(50),
    supabase.from("laporan_karhutla").select("*").limit(50),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Tes Koneksi Database</h1>
      <p className="mb-8 text-sm text-gray-500">
        Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(belum diset)"}
      </p>

      <DataTable title="wilayah" result={wilayah} />
      <DataTable title="laporan_karhutla" result={laporan} />
    </main>
  );
}


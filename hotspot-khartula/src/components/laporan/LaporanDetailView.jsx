import Link from "next/link";
import FotoGalleryLightbox from "@/components/laporan/FotoGalleryLightbox";
import HotmapMap from "@/components/map/HotmapMap";
import { StatusBadge } from "@/components/ui/SharedUI";
import {
  formatCoordinates,
  getGoogleMapsUrl,
  getOsmUrl,
} from "@/lib/gis";
import { formatDate, isValidLatLng, normalizeDate } from "@/lib/normalizers";
import { getJenisKejadianLabel, getKeparahanMeta } from "@/lib/workflow";

export default function LaporanDetailView({
  laporan,
  fotoList = [],
  penugasanList = [],
  riwayatList = [],
  penangananLogList = [],
  relationsReady = false,
  backHref,
  backLabel = "Kembali ke daftar",
  children = null,
}) {
  const hasCoords = isValidLatLng(laporan.latitude, laporan.longitude);
  const googleMapsUrl = hasCoords
    ? getGoogleMapsUrl(laporan.latitude, laporan.longitude)
    : null;
  const osmUrl = hasCoords
    ? getOsmUrl(laporan.latitude, laporan.longitude)
    : null;
  const keparahanMeta = getKeparahanMeta(laporan.tingkatKeparahan);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#155E42] hover:underline"
          >
            &larr; {backLabel}
          </Link>
          <h1 className="mt-1.5 text-2xl font-bold text-[#12241B]">
            {laporan.judul}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {keparahanMeta && (
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${keparahanMeta.badgeBg} ${keparahanMeta.badgeText}`}
            >
              Prioritas: {keparahanMeta.label}
            </span>
          )}
          <StatusBadge statusKey={laporan.statusKey} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
                Deskripsi Kejadian
              </h2>
              <p className="mt-2 text-sm text-[#2B3B32] leading-relaxed whitespace-pre-line">
                {laporan.deskripsi || "Belum ada deskripsi kejadian."}
              </p>
            </div>

            {laporan.alamatLokasi && (
              <div className="rounded-xl border border-[#E7ECE5] bg-[#FBFBFA] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6B61]">
                  Alamat / Keterangan Lokasi
                </h3>
                <p className="mt-1 text-sm text-[#14231B]">
                  {laporan.alamatLokasi}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-[#E7ECE5] bg-[#F6F7F3] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6B61]">
                Catatan Verifikasi / Tindak Lanjut
              </h3>
              <p className="mt-1.5 text-sm text-[#14231B]">
                {laporan.catatanVerifikasi ||
                  "Belum ada catatan verifikasi dari admin atau petugas."}
              </p>
            </div>

            {children}
          </section>

          {/* Lokasi Kejadian pada Peta GIS */}
          {hasCoords && (
            <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
                    Lokasi Kejadian pada Peta GIS
                  </h2>
                  <p className="text-xs font-mono text-[#6B7A71]">
                    {formatCoordinates(laporan.latitude, laporan.longitude, 6)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-1.5 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC]"
                    >
                      Buka Google Maps &rarr;
                    </a>
                  )}
                  {osmUrl && (
                    <a
                      href={osmUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-1.5 text-xs font-semibold text-[#4E5E55] hover:bg-[#EAF1EC]"
                    >
                      OpenStreetMap
                    </a>
                  )}
                </div>
              </div>

              <HotmapMap
                laporan={[laporan]}
                selectedId={laporan.id}
                singleMarkerMode={true}
                showControls={true}
                showLegend={false}
                heightClass="h-[260px] sm:h-[300px]"
              />
            </section>
          )}

          {/* Foto Bukti Laporan dengan Galeri + Lightbox */}
          <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
              Foto Bukti &amp; Dokumentasi Lapangan ({fotoList.length})
            </h2>

            {!relationsReady ? (
              <p className="text-xs text-[#6B7A71]">
                Menunggu penerapan migration{" "}
                <code className="font-mono bg-[#EEF2EC] px-1 rounded">
                  laporan_foto
                </code>{" "}
                dan bucket privat{" "}
                <code className="font-mono bg-[#EEF2EC] px-1 rounded">
                  laporan-bukti
                </code>
                .
              </p>
            ) : (
              <FotoGalleryLightbox fotoList={fotoList} />
            )}
          </section>

          {/* Riwayat Penugasan & Perubahan Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
                Riwayat Penugasan
              </h2>
              {!relationsReady ? (
                <p className="text-xs text-[#6B7A71]">
                  Tabel <code className="font-mono">penugasan_laporan</code> siap
                  pada migration 002.
                </p>
              ) : penugasanList.length === 0 ? (
                <p className="text-xs text-[#6B7A71]">
                  Belum ada riwayat penugasan petugas.
                </p>
              ) : (
                <ul className="space-y-3 text-xs">
                  {penugasanList.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-lg border border-[#ECEFE9] bg-[#FBFBFA] p-3 space-y-1"
                    >
                      <div className="flex justify-between font-semibold text-[#14231B]">
                        <span>{p.petugasNama}</span>
                        <span className="capitalize text-[#155E42]">
                          {p.statusPenugasan.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[#6B7A71]">
                        Ditugaskan oleh {p.assignedByNama} &bull;{" "}
                        {formatDate(normalizeDate(p.assignedAt), "short")}
                      </p>
                      {p.catatan && <p className="text-[#2B3B32]">{p.catatan}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
                Riwayat Status
              </h2>
              {!relationsReady ? (
                <p className="text-xs text-[#6B7A71]">
                  Tabel{" "}
                  <code className="font-mono">laporan_riwayat_status</code> siap
                  pada migration 002.
                </p>
              ) : riwayatList.length === 0 ? (
                <p className="text-xs text-[#6B7A71]">
                  Belum ada catatan perubahan status.
                </p>
              ) : (
                <ul className="space-y-3 text-xs">
                  {riwayatList.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-[#ECEFE9] bg-[#FBFBFA] p-3 space-y-1"
                    >
                      <div className="font-semibold text-[#14231B]">
                        {r.statusSebelumnya
                          ? `${r.statusSebelumnya.replace(/_/g, " ")} → ${r.statusBaru.replace(/_/g, " ")}`
                          : r.statusBaru.replace(/_/g, " ")}
                      </div>
                      <p className="text-[#6B7A71]">
                        Oleh {r.changedByNama} &bull;{" "}
                        {formatDate(normalizeDate(r.createdAt), "short")}
                      </p>
                      {r.catatan && <p className="text-[#2B3B32]">{r.catatan}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Log Penanganan Lapangan */}
          <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
              Log Penanganan Lapangan
            </h2>
            {penangananLogList.length === 0 ? (
              <p className="text-xs text-[#6B7A71]">
                Belum ada catatan log penanganan dari petugas lapangan.
              </p>
            ) : (
              <ul className="space-y-3 text-xs">
                {penangananLogList.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-lg border border-[#ECEFE9] bg-[#FBFBFA] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold text-[#14231B]">
                      <span>{log.petugasNama}</span>
                      <span className="capitalize text-[#155E42]">
                        {String(log.statusUpdate ?? "").replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[#6B7A71]">
                      {formatDate(normalizeDate(log.createdAt), "short")}
                    </p>
                    {log.catatanPenanganan && (
                      <p className="text-[#2B3B32]">{log.catatanPenanganan}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
            Informasi Laporan
          </h2>
          <dl className="divide-y divide-[#ECEFE9] text-xs">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">ID Laporan</dt>
              <dd className="font-mono font-semibold text-[#14231B] truncate max-w-[160px]">
                {laporan.id}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Wilayah</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.wilayah}
              </dd>
            </div>
            {laporan.jenisKejadian && (
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#6B7A71]">Jenis Kejadian</dt>
                <dd className="font-semibold text-[#14231B] text-right">
                  {getJenisKejadianLabel(laporan.jenisKejadian)}
                </dd>
              </div>
            )}
            {laporan.tingkatKeparahan && (
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#6B7A71]">Keparahan</dt>
                <dd className="font-semibold text-[#14231B] text-right capitalize">
                  {keparahanMeta?.label ?? laporan.tingkatKeparahan}
                </dd>
              </div>
            )}
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Estimasi Luas</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.estimasiLuas}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Koordinat</dt>
              <dd className="font-mono font-semibold text-[#14231B] text-right">
                {hasCoords
                  ? formatCoordinates(laporan.latitude, laporan.longitude, 5)
                  : "Belum diisi"}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Pelapor</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.pelapor}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Petugas</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.petugas}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Tanggal Kejadian</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {formatDate(laporan.tanggal, "long")}
              </dd>
            </div>
            {laporan.createdAt && (
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#6B7A71]">Tanggal Dilaporkan</dt>
                <dd className="font-semibold text-[#14231B] text-right">
                  {formatDate(normalizeDate(laporan.createdAt), "short")}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

const HotmapCanvas = dynamic(() => import("./HotmapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] lg:h-[500px] w-full rounded-xl border border-[#DCE0D5] bg-[#EEF2E4] animate-pulse flex flex-col items-center justify-center gap-2 text-xs font-medium text-[#4A5243]">
      <span className="h-7 w-7 animate-spin rounded-full border-3 border-[#DCE0D5] border-t-[#557029]" />
      <span>Memuat peta GIS interaktif...</span>
    </div>
  ),
});

export default function HotmapMap(props) {
  return <HotmapCanvas {...props} />;
}

"use client";

import dynamic from "next/dynamic";

const HotmapCanvas = dynamic(() => import("./HotmapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] lg:h-[500px] w-full rounded-xl border border-[#CFE0D8] bg-[#E6EFEA] animate-pulse flex flex-col items-center justify-center gap-2 text-xs font-medium text-[#4E5E55]">
      <span className="h-7 w-7 animate-spin rounded-full border-3 border-[#CFE0D8] border-t-[#155E42]" />
      <span>Memuat peta GIS interaktif...</span>
    </div>
  ),
});

export default function HotmapMap(props) {
  return <HotmapCanvas {...props} />;
}

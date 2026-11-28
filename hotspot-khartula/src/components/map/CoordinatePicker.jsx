"use client";

import dynamic from "next/dynamic";

const CoordinatePickerMap = dynamic(() => import("./CoordinatePickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] w-full rounded-xl border border-[#DCE0D5] bg-[#EEF2E4] animate-pulse flex items-center justify-center text-xs font-medium text-[#4A5243]">
      Memuat peta pemilih koordinat...
    </div>
  ),
});

export default function CoordinatePicker(props) {
  return <CoordinatePickerMap {...props} />;
}

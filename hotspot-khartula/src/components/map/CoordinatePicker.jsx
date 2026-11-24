"use client";

import dynamic from "next/dynamic";

const CoordinatePickerMap = dynamic(() => import("./CoordinatePickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] w-full rounded-xl border border-[#CFE0D8] bg-[#E6EFEA] animate-pulse flex items-center justify-center text-xs font-medium text-[#4E5E55]">
      Memuat peta pemilih koordinat...
    </div>
  ),
});

export default function CoordinatePicker(props) {
  return <CoordinatePickerMap {...props} />;
}

import { LoadingSpinner } from "@/components/ui/SharedUI";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F6F7F3] flex items-center justify-center px-4">
      <LoadingSpinner label="Memuat halaman HotMap..." />
    </div>
  );
}

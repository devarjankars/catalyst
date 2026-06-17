import TopNav from "@/components/top-nav";
import RouteLoader from "@/components/route-loader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <RouteLoader />
      <TopNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

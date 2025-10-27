import SideBar from "@/components/side-bar";  
export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex h-[100dvh] bg-gray-50" >
      <SideBar/>
      {/* Main content */}
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
  );
}

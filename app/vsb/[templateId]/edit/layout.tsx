export default function VSBLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex h-[100dvh] bg-gray-50" >
      {/* Main content */}
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
  );
}
import { Sidebar } from "../../components/layout/sidebar";
import { AuthGuard } from "../../components/auth/auth-guard";
import { SystemBanner } from "../../components/layout/system-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#131316] text-[#E4E4E7]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#131316]">
          <SystemBanner />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}

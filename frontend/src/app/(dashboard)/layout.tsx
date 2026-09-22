import { Sidebar } from "../../components/layout/sidebar";
import { AuthGuard } from "../../components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#F8F9FB] text-slate-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}

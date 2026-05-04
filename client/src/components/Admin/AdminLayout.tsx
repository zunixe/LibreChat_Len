import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminGuard from './AdminGuard';

export default function AdminLayout() {
  return (
    <AdminGuard>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </AdminGuard>
  );
}

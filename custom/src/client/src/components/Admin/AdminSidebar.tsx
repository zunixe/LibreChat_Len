import { useNavigate, NavLink } from 'react-router-dom';
import { Users, Shield, Settings, ArrowLeft } from 'lucide-react';
import { useLocalize } from '~/hooks';

export default function AdminSidebar() {
  const localize = useLocalize();
  const navigate = useNavigate();

  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white" aria-label="Admin sidebar">
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-gray-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-gray-800">
            {localize('com_admin_title')}
          </h2>
        </div>
      </div>
      <div className="border-b border-gray-200 p-2">
        <button
          onClick={() => navigate('/c/new')}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label={localize('com_ui_back_to_chat')}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          {localize('com_ui_back_to_chat')}
        </button>
      </div>
      <nav className="flex flex-col gap-0.5 p-2" aria-label="Admin navigation">
        <NavLink
          to="/d/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          <Users className="size-4 shrink-0" aria-hidden="true" />
          {localize('com_admin_users')}
        </NavLink>
        <NavLink
          to="/d/admin/roles"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          <Shield className="size-4 shrink-0" aria-hidden="true" />
          {localize('com_admin_roles')}
        </NavLink>
      </nav>
    </aside>
  );
}

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NavSecondary } from '@/components/nav-secondary';
import AppearanceDropdown from '@/components/appearance-dropdown';
import ApplicationLogo from '@/components/application-logo';

export function SidebarNav() {
  return (
    <aside className="w-64 bg-white shadow h-full flex flex-col">
      <div className="p-4 flex items-center">
        <ApplicationLogo className="h-10" />
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <NavMain />
        <NavSecondary />
      </nav>
      <div className="p-4 flex items-center justify-between">
        <NavUser />
        <AppearanceDropdown />
      </div>
    </aside>
  );
}

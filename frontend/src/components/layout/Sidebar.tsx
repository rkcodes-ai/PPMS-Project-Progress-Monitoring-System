import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Activity, 
  GraduationCap, 
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeRole } = useAuth();

  const getNavLinks = () => {
    switch (activeRole) {
      case 'HOD':
        return [
          { to: '/dashboard', label: 'Department Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
          { to: '/projects', label: 'All CSE Projects', icon: <FolderKanban className="w-5 h-5" /> },
          { to: '/analytics', label: 'Department Analytics', icon: <Activity className="w-5 h-5" /> },
        ];
      case 'ADVISOR':
        return [
          { to: '/dashboard', label: 'Section Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
          { to: '/projects', label: 'Section Projects', icon: <FolderKanban className="w-5 h-5" /> },
          { to: '/analytics', label: 'Section Analytics', icon: <Activity className="w-5 h-5" /> },
        ];
      case 'MENTOR':
        return [
          { to: '/dashboard', label: 'Supervision Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
          { to: '/projects', label: 'Assigned Projects', icon: <FolderKanban className="w-5 h-5" /> },
          { to: '/analytics', label: 'Mentor Analytics', icon: <Activity className="w-5 h-5" /> },
        ];
      case 'STUDENT':
      default:
        return [
          { to: '/dashboard', label: 'My Project Hub', icon: <LayoutDashboard className="w-5 h-5" /> },
          { to: '/projects', label: 'Project Workspace', icon: <FolderKanban className="w-5 h-5" /> },
          { to: '/analytics', label: 'My Analytics', icon: <Activity className="w-5 h-5" /> },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-stone-900 text-stone-300 flex flex-col border-r border-stone-800 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-stone-800 bg-stone-950/80">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-sm block">CSE PPMS</span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wide block uppercase">College Monitoring</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Menu Navigation
          </div>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/70'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Institutional footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/50 text-[11px] text-stone-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-400" />
          <span>CSE Department Academic Platform</span>
        </div>
      </aside>
    </>
  );
};

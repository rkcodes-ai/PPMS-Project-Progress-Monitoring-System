import React, { useState } from 'react';
import { Menu, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../../features/notifications/NotificationDropdown';
import { ChangePasswordModal } from '../../features/auth/ChangePasswordModal';
import type { RoleEnum } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeRole, logout } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const getRoleBadgeStyle = (r: RoleEnum) => {
    switch (r) {
      case 'HOD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADVISOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MENTOR':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'STUDENT':
      default:
        return 'bg-teal-100 text-teal-800 border-teal-300';
    }
  };

  return (
    <header className="h-16 bg-stone-50 border-b border-stone-200/90 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 lg:hidden focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-200/70 text-stone-700 border border-stone-300/80">
            Department of CSE
          </span>
        </div>
      </div>

      {/* Right: Profile pill, Notifications, Logout */}
      <div className="flex items-center gap-3">

        {/* In-App Persistent Notification Center */}
        <NotificationDropdown />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">

          <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">
              {user?.full_name || 'Academic User'}
            </span>
            <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>
          {activeRole && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(activeRole)}`}>
              {activeRole}
            </span>
          )}
        </div>

        {/* Change password action */}
        <button
          onClick={() => setIsChangePasswordOpen(true)}
          title="Change Password"
          aria-label="Change Password"
          className="p-2 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors focus:outline-none"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* Logout action */}
        <button
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};

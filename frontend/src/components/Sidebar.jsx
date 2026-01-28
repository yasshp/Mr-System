import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, BarChart3, Shield, Sun, Moon, Command } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const toggleDark = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
    setDarkMode(!darkMode);
  };

  if (!user) return null;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['mr', 'admin'] },
    { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['mr', 'admin'] },
    { to: '/admin', icon: Shield, label: 'Admin', roles: ['admin'] },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0e1116] to-[#232526] text-white flex flex-col my-1 ml-0 rounded-r-2xl shadow-2xl z-20 h-[calc(100vh-0.5rem)] border-r border-white/10 ring-1 ring-white/5 relative overflow-hidden backdrop-blur-xl">
      {/* Subtle shine effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-8 relative z-10 border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/10 rounded-lg border border-white/10 shadow-inner">
            <Command size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            MR Portal
          </h1>
        </div>
        <p className="text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-medium pl-1">
          Management System
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
        {navItems
          .filter(item => item.roles.includes(user.role))
          .map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                  ? 'bg-white/10 text-white shadow-lg border border-white/5'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                )}

                <item.icon
                  className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'
                    }`}
                />
                <span className="font-medium tracking-wide text-sm">{item.label}</span>

                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50" />
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mx-2 mb-2 relative z-10">
        <div className="px-4 py-5 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold border border-white/20 shadow-md">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate max-w-[90px]">
                  {user.name || user.user_id}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {user.role === 'admin' ? 'Administrator' : 'Medical Rep.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={toggleDark}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white flex justify-center items-center group"
              title="Toggle Theme"
            >
              <div className="relative">
                <Sun size={18} className={`absolute transition-all duration-300 ${darkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                <Moon size={18} className={`transition-all duration-300 ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
              </div>
            </button>
            <button
              onClick={logout}
              className="flex-1 py-2.5 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-lg transition-all text-zinc-400 hover:text-red-400 flex justify-center items-center group"
              title="Sign Out"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
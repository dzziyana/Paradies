import { useState } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Users } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/admin/calendar", icon: CalendarDays, label: "Calendar", end: false },
  { to: "/admin/residents", icon: Users, label: "WG", end: false },
] as const;

function NavItem({
  to,
  icon: Icon,
  label,
  end,
}: (typeof navItems)[number]) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <div
          className={`flex flex-col items-center px-6 py-2 rounded-full transition-colors ${
            isActive
              ? "bg-primary-fixed/30 text-primary"
              : "text-outline hover:text-primary"
          }`}
        >
          <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
          <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const location = useLocation();
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-surface/60">
        <div className="flex justify-between items-center px-6 py-5 max-w-2xl mx-auto">
          <h1 className="font-headline italic font-bold text-2xl tracking-tight text-primary">
            Paradies <span className="text-primary/50">✦</span>
          </h1>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-label text-sm font-bold overflow-hidden"
            >
              {user?.profilePicture && user.profilePictureMimeType ? (
                <img
                  src={`data:${user.profilePictureMimeType};base64,${user.profilePicture}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : initial}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl bg-surface-container-low p-2 outline outline-1 outline-outline/15 shadow-lg">
                  <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                    <p className="font-body text-sm font-semibold truncate">{user?.name}</p>
                    <p className="font-body text-xs text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/admin/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl font-label text-xs font-bold tracking-wider text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Edit profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 rounded-xl font-label text-xs font-bold tracking-wider text-error hover:bg-error/5 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main key={location.pathname} className="max-w-2xl mx-auto px-6 pt-24 pb-12 animate-in">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 glass border-t border-outline-variant/20 shadow-[0_-20px_40px_-10px_rgba(36,173,182,0.08)] z-50 rounded-t-3xl">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}

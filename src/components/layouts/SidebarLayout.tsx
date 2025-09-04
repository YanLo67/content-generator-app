import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  FiHome,
  FiEdit,
  FiClipboard,
  FiCalendar,
  FiUser,
  FiLogOut,
  FiZap,
} from "react-icons/fi";

export default function SidebarLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      navigate("/logout");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col justify-between h-screen sticky top-0">
        <div>
          <h1 className="text-2xl font-bold mb-8">ContentGen</h1>
          <nav className="flex flex-col gap-2">
            <SidebarLink to="/user/creation" label="Création" Icon={FiEdit} />

            <SidebarLink to="/user/posts" label="Posts" Icon={FiClipboard} />
            <SidebarLink
              to="/user/calendar"
              label="Calendrier"
              Icon={FiCalendar}
            />
            <SidebarLink to="/user/profile" label="Profil" Icon={FiUser} />

            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 text-left p-2 rounded hover:bg-gray-700 transition w-full font-normal mt-4"
            >
              <FiLogOut size={18} />
              Déconnexion
            </button>
          </nav>
        </div>

        <footer className="text-xs text-gray-400">
          {user && (
            <p>
              Connecté en tant que : <br />
              <span className="font-semibold text-white">{user.email}</span>
            </p>
          )}
        </footer>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  Icon,
}: {
  to: string;
  label: string;
  Icon?: React.ComponentType<{ size?: number }>;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 p-2 rounded hover:bg-gray-700 transition ${
          isActive ? "bg-gray-700 font-semibold" : ""
        }`
      }
    >
      {Icon && <Icon size={18} />}
      {label}
    </NavLink>
  );
}

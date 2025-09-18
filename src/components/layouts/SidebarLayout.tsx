import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  FiEdit,
  FiClipboard,
  FiCalendar,
  FiUser,
  FiLogOut,
  FiHelpCircle,
} from "react-icons/fi";

export default function SidebarLayout({
  startTour,
}: {
  startTour: () => void;
}) {
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
            <div id="tour-step-1">
              <SidebarLink to="/user/creation" label="Création" Icon={FiEdit} />
            </div>
            <div id="tour-step-4">
              <SidebarLink to="/user/posts" label="Posts" Icon={FiClipboard} />
            </div>
            <div id="tour-step-5">
              <SidebarLink
                to="/user/calendar"
                label="Calendrier"
                Icon={FiCalendar}
              />
            </div>
            <div id="tour-step-8">
              <SidebarLink to="/user/profile" label="Profil" Icon={FiUser} />
            </div>

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
          <button
            onClick={startTour}
            className="text-slate-400 hover:text-white transition-colors"
            title="Relancer le tutoriel"
          >
            <FiHelpCircle size={22} />
          </button>
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

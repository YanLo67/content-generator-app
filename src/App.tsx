import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/Login";
import Dashboard from "./features/user/Dashboard";
import Profile from "./features/user/Profile";
import Postes from "./features/user/Postes";
import Calendar from "./features/user/Calendar";
import Creation from "./features/user/Creation";
import SidebarLayout from "./components/layouts/SidebarLayout";
import { useAuth } from "./hooks/useAuth";
import Logout from "./features/auth/Logout";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {user ? (
          <Route path="/user" element={<SidebarLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="creation" element={<Creation />} />
            <Route path="Postes" element={<Postes />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

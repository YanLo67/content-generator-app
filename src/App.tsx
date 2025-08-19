import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/Login";
import Dashboard from "./features/user/Dashboard";
import Profile from "./features/user/Profile";
import Postes from "./features/user/Postes";
import Calendar from "./features/user/Calendar";
import Creation from "./features/user/Creation";
import SidebarLayout from "./components/layouts/SidebarLayout";
import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import OnboardingModal from "./components/Onboarding/OnboardingModal";
import Logout from "./features/auth/Logout";

function App() {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, on s'assure que la modale est cachée.
    if (!user) {
      setShowOnboarding(false);
      return;
    }

    // Si l'utilisateur est connecté, on vérifie son statut d'onboarding.
    const checkOnboardingStatus = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]); // Cet effet se relance chaque fois que l'utilisateur se connecte ou déconnecte.

  if (loading) {
    return <div>Chargement...</div>;
  }

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
            <Route path="Posts" element={<Postes />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
        <Route path="/logout" element={<Logout />} />
        {/* Et par-dessus, on affiche la modale si `showOnboarding` est vrai */}
      </Routes>
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </BrowserRouter>
  );
}

export default App;

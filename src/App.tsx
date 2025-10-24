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
import SignUp from "./features/auth/signup";
import AppTour from "./components/AppTour";
import { useWindowSize } from "./hooks/useWindowSize";
import MobileNotSupported from "./components/MobileNotSupported";

function App() {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [runTour, setRunTour] = useState(false);

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

  const startTour = () => {
    // On s'assure d'être sur la bonne page avant de lancer
    setTimeout(() => {
      setRunTour(true);
    }, 200);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false); // On ferme la modale
    // On attend un court instant pour une transition fluide, puis on lance le tour
    setTimeout(() => {
      setRunTour(true);
    }, 200);
  };

  const { width } = useWindowSize();
  const MOBILE_BREAKPOINT = 768; // 768px est une limite standard

  if (width && width < MOBILE_BREAKPOINT) {
    return <MobileNotSupported />;
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <BrowserRouter>
      <AppTour run={runTour} onTourEnd={() => setRunTour(false)} />
      <Routes>
        <Route path="/" element={<Login />} />
        {user ? (
          <Route path="/user" element={<SidebarLayout startTour={startTour} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="creation" element={<Creation />} />
            <Route path="Posts" element={<Postes />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
        <Route path="/logout" element={<Logout />} />
        {/* Et par-dessus, on affiche la modale si `showOnboarding` est vrai */}
      </Routes>
      {showOnboarding && <OnboardingModal onClose={handleOnboardingComplete} />}
    </BrowserRouter>
  );
}

export default App;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vérifie si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/user/dashboard");
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/user/dashboard");
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert(
        "Inscription réussie ! Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte mail."
      );
      setMode("login"); // bascule vers connexion après inscription
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {mode === "login" ? (
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white w-full py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        ) : (
          <button
            onClick={handleSignup}
            className="bg-green-600 text-white w-full py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                onClick={() => {
                  setError(null);
                  setMode("signup");
                }}
                className="text-blue-600 hover:underline"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
                className="text-blue-600 hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

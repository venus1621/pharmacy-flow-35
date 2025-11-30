import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/services/backendApi";
import { Profile } from "@/types/backend";

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null; // Alias for user for backward compatibility
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------
  // Load user session from backend
  // ------------------------------------------
  const refreshSession = async () => {
    try {
      setLoading(true);
      const sessionData = await authApi.getSession();

      if (sessionData?.user) {
        setUser(sessionData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session load error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // Initial session load
  // ------------------------------------------
  useEffect(() => {
    refreshSession();
  }, []);

  // ------------------------------------------
  // Sign out
  // ------------------------------------------
  const signOut = async () => {
    await authApi.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------------
// Hook
// ------------------------------------------

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

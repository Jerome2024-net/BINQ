"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, profileToUser, userToProfileUpdate } from "@/types";
import { createClient } from "@/lib/supabase/client";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  getUserById: (id: string) => Promise<User | undefined>;
}

interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Charger la session au démarrage + écouter les changements d'auth
  useEffect(() => {
    // Récupérer la session initiale
    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (e) {
        console.warn("Auth init error (non-blocking):", e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      try {
        setSession(newSession);

        if (event === "SIGNED_IN" && newSession?.user) {
          // Ne recharger le profil que si pas déjà chargé (évite le double appel après login)
          if (!user || user.id !== newSession.user.id) {
            await loadProfile(newSession.user.id);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      } catch (e) {
        console.warn("Auth state change error:", e);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setUser(profileToUser(data));
    }
  };

  const login = useCallback(
    async (email: string, password: string) => {
      if (!email || !password) {
        return { success: false, error: "Veuillez remplir tous les champs" };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { success: false, error: "Email ou mot de passe incorrect" };
        }
        if (error.message.includes("Email not confirmed")) {
          return { success: false, error: "Veuillez confirmer votre email avant de vous connecter" };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadProfile(data.user.id);
      }

      return { success: true };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const register = useCallback(
    async (data: RegisterData) => {
      if (!data.nom || !data.prenom || !data.email || !data.password) {
        return { success: false, error: "Veuillez remplir tous les champs obligatoires" };
      }

      if (data.password.length < 6) {
        return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères" };
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nom: data.nom,
            prenom: data.prenom,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { success: false, error: "Cet email est déjà utilisé" };
        }
        return { success: false, error: error.message };
      }

      // Mettre à jour le profil avec les infos supplémentaires
      if (authData.user) {
        await supabase.from("profiles").update({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
        }).eq("id", authData.user.id);

        await loadProfile(authData.user.id);

        // Envoyer email de bienvenue via Resend
        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "welcome",
              to: data.email,
              data: { prenom: data.prenom },
            }),
          });
        } catch (e) {
          console.warn("Welcome email failed (non-blocking):", e);
        }
      }

      return { success: true };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      if (!user) return;

      const dbFields = userToProfileUpdate(data);

      const { error } = await supabase
        .from("profiles")
        .update(dbFields)
        .eq("id", user.id);

      if (!error) {
        setUser((prev) => (prev ? { ...prev, ...data } : null));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(profileToUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserById = useCallback(
    async (id: string): Promise<User | undefined> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return undefined;
      return profileToUser(data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, login, register, logout, updateProfile, getAllUsers, getUserById }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

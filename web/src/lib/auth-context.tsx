"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import {
  getMe,
  login as apiLogin,
  verifyLogin2FA as apiVerifyLogin2FA,
  register as apiRegister,
  googleLogin,
  logout as apiLogout,
  updateProfile,
  User,
  LoginResponse,
  UpdateProfilePayload,
} from "./api"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, code?: string) => Promise<LoginResponse>
  verify2FALogin: (tempToken: string, code: string) => Promise<LoginResponse>
  register: (
    email: string,
    password: string,
    name?: string,
    role?: "STUDENT" | "TEACHER"
  ) => Promise<void>
  loginWithGoogle: (role?: "STUDENT" | "TEACHER") => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: UpdateProfilePayload) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await getMe()
      setUser(res.user)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    getMe()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string, code?: string): Promise<LoginResponse> => {
    const res = await apiLogin(email, password, code)
    if (res.user) {
      setUser(res.user)
    }
    return res
  }

  const verify2FALogin = async (tempToken: string, code: string): Promise<LoginResponse> => {
    const res = await apiVerifyLogin2FA(tempToken, code)
    if (res.user) {
      setUser(res.user)
    }
    return res
  }

  const register = async (
    email: string,
    password: string,
    name?: string,
    role?: "STUDENT" | "TEACHER"
  ) => {
    const res = await apiRegister(email, password, name, role)
    if (res.user) {
      setUser(res.user)
    }
  }

  const loginWithGoogle = async (role?: "STUDENT" | "TEACHER") => {
    const { signInWithGoogle } = await import("./firebase")
    const googleData = await signInWithGoogle()
    const res = await googleLogin({
      idToken: googleData.idToken,
      email: googleData.email,
      name: googleData.name,
      avatar: googleData.avatar,
      role: role || "STUDENT",
    })
    if (res.user) {
      setUser(res.user)
    }
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  const updateUserProfile = async (data: UpdateProfilePayload) => {
    const res = await updateProfile(data)
    setUser(res.user)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verify2FALogin,
        register,
        loginWithGoogle,
        logout,
        updateUserProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

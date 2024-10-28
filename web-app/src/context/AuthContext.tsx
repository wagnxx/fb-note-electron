// src/context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { login as loginAction, logout as logoutAction } from '@/features/auth/authSlice'

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated)
  const dispatch = useDispatch()

  const login = () => dispatch(loginAction())
  const logout = () => dispatch(logoutAction())

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

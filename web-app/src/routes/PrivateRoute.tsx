// src/components/PrivateRoute.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

const PrivateRoute: React.FC<{ element: JSX.Element }> = ({ element }) => {
  // const { isAuthenticated } = useAuth()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return isAuthenticated ? element : <Navigate to="/login" />
}

export default PrivateRoute

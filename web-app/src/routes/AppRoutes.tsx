// src/routes/AppRoutes.tsx
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import HomePage from '@/pges/home/Home'
import UserProfilePage from '@/pges/user/Profile'
// import ProductPage from '../pages/ProductPage'
import PrivateRoute from './PrivateRoute'
import NotFound from '@/pges/error/NotFound'

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/products" element={<ProductPage />} /> */}

        {/* 使用 PrivateRoute 包裹受保护的路由 */}
        <Route
          path="/user-profile"
          element={
            <PrivateRoute>
              <UserProfilePage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes

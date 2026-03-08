import React from 'react'
import { Outlet } from 'react-router-dom'
// AUTH BYPASSED — localStorage mode, no login needed
export default function ProtectedRoute() {
  return <Outlet />
}

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import HomePage    from './pages/HomePage'
import WatchPage   from './pages/WatchPage'
import UploadPage  from './pages/UploadPage'
import useAuthStore from './store/authStore'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { token, fetchMe } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* 認証 */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 公開 */}
        <Route path="/"          element={<HomePage />} />
        <Route path="/watch/:id" element={<WatchPage />} />

        {/* 認証必須 */}
        <Route path="/upload" element={
          <PrivateRoute><UploadPage /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

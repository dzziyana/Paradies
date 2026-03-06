import { Routes, Route, Navigate } from "react-router-dom"
import ApplyPage from "@/pages/ApplyPage"
import SuccessPage from "@/pages/SuccessPage"
import AdminPage from "@/pages/AdminPage"
import EvaluatePage from "@/pages/EvaluatePage"
import CastingsPage from "@/pages/CastingsPage"
import ApplicationsPage from "@/pages/ApplicationsPage"
import AllApplicationsPage from "@/pages/AllApplicationsPage"

export default function App() {
  return (
    <Routes>
      <Route path="/apply/:castingId" element={<ApplyPage />} />
      <Route path="/apply/:castingId/success/:applicationId" element={<SuccessPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/castings" element={<CastingsPage />} />
      <Route path="/admin/applications" element={<AllApplicationsPage />} />
      <Route path="/admin/casting/:castingId/applications" element={<ApplicationsPage />} />
      <Route path="/admin/casting/:castingId/application/:applicationId" element={<EvaluatePage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

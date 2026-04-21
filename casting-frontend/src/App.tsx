import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";
import AdminPage from "@/pages/AdminPage";
import CastingsPage from "@/pages/CastingsPage";
import AllApplicationsPage from "@/pages/AllApplicationsPage";
import EvaluatePage from "@/pages/EvaluatePage";
import NewCastingPage from "@/pages/NewCastingPage";
import CastingManagePage from "@/pages/CastingManagePage";
import CleaningPlanPage from "@/pages/CleaningPlanPage";
import WgCalendarPage from "@/pages/WgCalendarPage";
import ApplyPage from "@/pages/ApplyPage";
import ApplicationFormPage from "@/pages/ApplicationFormPage";
import SuccessPage from "@/pages/SuccessPage";
import MagicLinkPage from "@/pages/MagicLinkPage";
import ResidentsPage from "@/pages/ResidentsPage";
import ManageResidentsPage from "@/pages/ManageResidentsPage";
import RoomsPage from "@/pages/RoomsPage";
import LoginPage from "@/pages/LoginPage";
import SetupPage from "@/pages/SetupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ProfilePage from "@/pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      {/* ── Auth (public) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/setup/:token" element={<SetupPage />} />

      {/* ── Admin (authenticated, shell nav) ── */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/castings" element={<CastingsPage />} />
        <Route path="/admin/castings/new" element={<NewCastingPage />} />
        <Route path="/admin/castings/:castingId/manage" element={<CastingManagePage />} />
        <Route path="/admin/applications" element={<AllApplicationsPage />} />
        <Route path="/admin/casting/:castingId/application/:applicationId" element={<EvaluatePage />} />
        <Route path="/admin/cleaning" element={<CleaningPlanPage />} />
        <Route path="/admin/calendar" element={<WgCalendarPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/residents" element={<ResidentsPage />} />
        <Route path="/admin/residents/manage" element={<ManageResidentsPage />} />
        <Route path="/admin/rooms" element={<RoomsPage />} />
      </Route>

      {/* ── Applicant portal (public, no shell) ── */}
      <Route path="/apply/:castingId" element={<ApplyPage />} />
      <Route path="/apply/:castingId/form" element={<ApplicationFormPage />} />
      <Route path="/apply/:castingId/success/:applicationId" element={<SuccessPage />} />
      <Route path="/status/:token" element={<MagicLinkPage />} />

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

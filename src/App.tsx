import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { SignInPage } from "@/pages/SignInPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CardsPage } from "@/pages/CardsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { CardTemplatePage } from "@/pages/CardTemplatePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { EnrollmentPage } from "@/pages/EnrollmentPage"; // ? PRIDÁNO

export default function App() {
  return (
    <Routes>
      {/* ?? verejná enrollment route (QR vstup) */}
      <Route path="/e/:code" element={<EnrollmentPage />} />

      <Route path="/sign-in" element={<SignInPage />} />

      {/* ?? chránená cást */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/card-template" element={<CardTemplatePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

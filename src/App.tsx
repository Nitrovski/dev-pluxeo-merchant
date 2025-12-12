import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { SignInPage } from "@/pages/SignInPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CardsPage } from "@/pages/CardsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { CardTemplatePage } from "@/pages/CardTemplatePage";
import { SettingsPage } from "@/pages/SettingsPage"; // ? NOVÉ

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />

      {/* chránená cást */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/card-template" element={<CardTemplatePage />} />
        <Route path="/settings" element={<SettingsPage />} /> {/* ? NOVÉ */}

        {/* default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

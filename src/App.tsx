import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { SignInPage } from "@/pages/SignInPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CardsPage } from "@/pages/CardsPage";
import { OnboardingPage } from "@/pages/OnboardingPage"; // pridat

// ?? Pridejme nový import:
import { CardTemplatePage } from "@/pages/CardTemplatePage";

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />

      {/* chránená cást */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cards" element={<CardsPage />} />
        {/* ?? Nová route – Onboarding cast  */}
        <Route path="/onboarding" element={<OnboardingPage />} /> 
        {/* ?? Nová route – Šablona vernostní karty */}
        <Route path="/card-template" element={<CardTemplatePage />} />

        {/* default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

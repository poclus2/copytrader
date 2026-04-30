import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Traders from "./pages/Traders";
import TraderProfile from "./pages/TraderProfile";
import BotProfile from "./pages/BotProfile";
import CopyConfig from "./pages/CopyConfig";
import Affiliation from "./pages/Affiliation";
import KycVerification from "./pages/KycVerification";
import SlaveDetails from "./pages/SlaveDetails";
import Settings from "./pages/Settings"; // Replaces Profile
import Transactions from "@/pages/Transactions";
import MT5Connect from "@/pages/MT5Connect";
import MT5Status from "./pages/MT5Status";
import MT5Error from "./pages/MT5Error";
import DepositMethod from "./pages/DepositMethod";
import DepositForm from "./pages/DepositForm";
import DepositSuccess from "./pages/DepositSuccess";
import WithdrawMethod from "./pages/WithdrawMethod";
import WithdrawForm from "./pages/WithdrawForm";
import WithdrawSuccess from "./pages/WithdrawSuccess";
import KYCLevel1 from "./pages/KYCLevel1";
import KYCLevel2 from "./pages/KYCLevel2";
import KYCLevel3 from "./pages/KYCLevel3";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/auth" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/traders" element={<Traders />} />
            <Route path="/trader/:id" element={<TraderProfile />} />
            <Route path="/bot/:id" element={<BotProfile />} />
            <Route path="/copy-config" element={<CopyConfig />} />
            <Route path="/copy/:id" element={<SlaveDetails />} />
            <Route path="/mt5-connect" element={<ProtectedRoute><MT5Connect /></ProtectedRoute>} />
            <Route path="/affiliation" element={<ProtectedRoute><Affiliation /></ProtectedRoute>} />
            <Route path="/profile/kyc" element={<ProtectedRoute><KycVerification /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<Settings />} /> {/* Alias for backward compatibility */}
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/mt5/connect" element={<MT5Connect />} />
            <Route path="/mt5/status" element={<MT5Status />} />
            <Route path="/mt5/error" element={<MT5Error />} />
            <Route path="/deposit" element={<DepositMethod />} />
            <Route path="/deposit/:method" element={<DepositForm />} />
            <Route path="/deposit/success" element={<DepositSuccess />} />
            <Route path="/withdraw" element={<WithdrawMethod />} />
            <Route path="/withdraw/:method" element={<WithdrawForm />} />
            <Route path="/withdraw/success" element={<WithdrawSuccess />} />
            <Route path="/profile/kyc" element={<KYCLevel1 />} />
            <Route path="/profile/kyc/level1" element={<KYCLevel1 />} />
            <Route path="/profile/kyc/level2" element={<KYCLevel2 />} />
            <Route path="/profile/kyc/level3" element={<KYCLevel3 />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

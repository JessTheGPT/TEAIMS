import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Spec from "./pages/Spec";
import Crews from "./pages/Crews";
import Toolbox from "./pages/Toolbox";
import Prompts from "./pages/Prompts";
import Builder from "./pages/Builder";
import Share from "./pages/Share";
import Startup from "./pages/Startup";
import Squad from "./pages/Squad";
import Context from "./pages/Context";
import Judgement from "./pages/Judgement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/spec" element={<Spec />} />
              <Route path="/crews" element={<Crews />} />
              <Route path="/toolbox" element={<Toolbox />} />
              <Route path="/prompts" element={<Prompts />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/share" element={<Share />} />
              <Route path="/startup" element={<ProtectedRoute><Startup /></ProtectedRoute>} />
              <Route path="/squad" element={<ProtectedRoute><Squad /></ProtectedRoute>} />
              <Route path="/context" element={<ProtectedRoute><Context /></ProtectedRoute>} />
              <Route path="/judgement" element={<ProtectedRoute><Judgement /></ProtectedRoute>} />
              <Route path="/resources" element={<Toolbox />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

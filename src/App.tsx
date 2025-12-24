import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentLogin from "./pages/login/StudentLogin";
import LecturerLogin from "./pages/login/LecturerLogin";
import ParentLogin from "./pages/login/ParentLogin";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import LecturerDashboard from "./pages/dashboards/LecturerDashboard";
import ParentDashboard from "./pages/dashboards/ParentDashboard";
import TestsPage from "./pages/TestsPage";
import AdminPage from "./pages/AdminPage";
import ManageSubjectsPage from "./pages/ManageSubjectsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/lecturer" element={<LecturerLogin />} />
            <Route path="/login/parent" element={<ParentLogin />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/manage-subjects" element={<ManageSubjectsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

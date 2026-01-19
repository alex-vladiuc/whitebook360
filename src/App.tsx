import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetPin from "./pages/SetPin";
import Kiosk from "./pages/Kiosk";
import LeaveCalendar from "./pages/LeaveCalendar";
import VisitorLog from "./pages/VisitorLog";
import SeeYaLater from "./pages/SeeYaLater";
import Dashboard from "./pages/admin/Dashboard";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/set-pin" element={<SetPin />} />
            <Route path="/kiosk" element={<Kiosk />} />
            <Route path="/leave-calendar" element={<LeaveCalendar />} />
            <Route path="/visitor-log" element={<VisitorLog />} />
            <Route path="/see-ya-later" element={<SeeYaLater />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/user-management" element={<Dashboard />} />
            <Route path="/admin/employee-management" element={<EmployeeManagement />} />
            <Route path="/admin/admin-hours" element={<Dashboard />} />
            <Route path="/admin/invoice-management" element={<Dashboard />} />
            <Route path="/admin/project-calendar" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

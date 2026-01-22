import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import RequireAuth from "@/components/layout/RequireAuth";
import RequireAdmin from "@/components/layout/RequireAdmin";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetPin from "./pages/SetPin";
import LeaveCalendar from "./pages/LeaveCalendar";
import VisitorLog from "./pages/VisitorLog";
import SeeYaLater from "./pages/SeeYaLater";
import Dashboard from "./pages/admin/Dashboard";
import EmployeeManagement from "./pages/admin/EmployeeManagement";

// Kiosk variants
import KioskPrivate from "./pages/KioskPrivate";
// NOTE: KioskPublic exists but is not routed

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
              {/* Public/auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/set-pin" element={<SetPin />} />

              {/* Everything else requires auth + pin */}
              <Route
                  path="/*"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/kiosk" element={<KioskPrivate />} />
                          <Route path="/leave-calendar" element={<LeaveCalendar />} />

                          {/* Visitor log can be admin-only if you want; for now keep admin gated */}
                          <Route
                              path="/visitor-log"
                              element={
                                <RequireAdmin>
                                  <VisitorLog />
                                </RequireAdmin>
                              }
                          />

                          <Route
                              path="/see-ya-later"
                              element={
                                <RequireAdmin>
                                  <SeeYaLater />
                                </RequireAdmin>
                              }
                          />

                          {/* Admin */}
                          <Route
                              path="/admin/dashboard"
                              element={
                                <RequireAdmin>
                                  <Dashboard />
                                </RequireAdmin>
                              }
                          />
                          <Route
                              path="/admin/employee-management"
                              element={
                                <RequireAdmin>
                                  <EmployeeManagement />
                                </RequireAdmin>
                              }
                          />

                          {/* TODO: add the rest of admin pages when you add them */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </MainLayout>
                    </RequireAuth>
                  }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;

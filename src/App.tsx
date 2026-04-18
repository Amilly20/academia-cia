import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/pages/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Billing from "@/pages/Billing";
import LostFound from "@/pages/LostFound";
import Events from "@/pages/Events";
import Announcements from "@/pages/Announcements";
import PaymentHistory from "@/pages/PaymentHistory";
import StudentArea from "@/pages/StudentArea";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log("App rendering..."); 
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              <Route path="/lost-found" element={<LostFound />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/events" element={<Events />} />
              <Route path="/student-area" element={<StudentArea />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CountryProvider } from "@/context/CountryContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocaleGate from "@/components/LocaleGate";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Providers from "@/pages/Providers";
import ProviderDetail from "@/pages/ProviderDetail";
import Book from "@/pages/Book";
import Checkout from "@/pages/Checkout";
import Appointments from "@/pages/Appointments";
import Specialties from "@/pages/Specialties";
import Intake from "@/pages/Intake";
import BookingJourney from "@/pages/BookingJourney";
import Pricing from "@/pages/Pricing";
import Simulator from "@/pages/Simulator";
import Contracts from "@/pages/Contracts";
import Session from "@/pages/Session";
import AddDoctor from "@/pages/AddDoctor";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min — data considered fresh
      gcTime: 1000 * 60 * 15,           // 15 min — keep unused data in memory
      retry: 1,
      refetchOnWindowFocus: false,       // don't re-fetch when switching tabs
      refetchOnReconnect: true,          // do re-fetch when coming back online
    },
  },
});

const FULL_SCREEN_ROUTES = ["/get-started", "/session", "/book-now", "/admin", "/login"];

function Router() {
  const [location] = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => location.startsWith(r));

  return (
    <>
      <LocaleGate />
      {!isFullScreen && <Navbar />}
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/providers" component={Providers} />
        <Route path="/providers/:id">{(params) => <ProviderDetail id={params.id} />}</Route>
        <Route path="/book" component={Book} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/specialties" component={Specialties} />
        <Route path="/get-started" component={BookingJourney} />
        <Route path="/book-now" component={BookingJourney} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/simulator" component={Simulator} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/session" component={Session} />
        <Route path="/add-doctor" component={AddDoctor} />
        <Route path="/login" component={Login} />
        <Route path="/admin">{() => <ProtectedRoute component={Admin} />}</Route>
        <Route component={NotFound} />
      </Switch>
      {!isFullScreen && <Footer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CountryProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </AuthProvider>
          </CountryProvider>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

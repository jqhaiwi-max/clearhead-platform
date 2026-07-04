import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CountryProvider } from "@/context/CountryContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Providers from "@/pages/Providers";
import ProviderDetail from "@/pages/ProviderDetail";
import Book from "@/pages/Book";
import Appointments from "@/pages/Appointments";
import Specialties from "@/pages/Specialties";
import Intake from "@/pages/Intake";
import Pricing from "@/pages/Pricing";
import Simulator from "@/pages/Simulator";
import Contracts from "@/pages/Contracts";
import Session from "@/pages/Session";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
});

const FULL_SCREEN_ROUTES = ["/get-started", "/session"];

function Router() {
  const [location] = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => location.startsWith(r));

  return (
    <>
      {!isFullScreen && <Navbar />}
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/providers" component={Providers} />
        <Route path="/providers/:id">{(params) => <ProviderDetail id={params.id} />}</Route>
        <Route path="/book" component={Book} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/specialties" component={Specialties} />
        <Route path="/get-started" component={Intake} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/simulator" component={Simulator} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/session" component={Session} />
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
        <CountryProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </CountryProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

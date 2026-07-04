import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Providers from "@/pages/Providers";
import ProviderDetail from "@/pages/ProviderDetail";
import Book from "@/pages/Book";
import Appointments from "@/pages/Appointments";
import Specialties from "@/pages/Specialties";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/providers" component={Providers} />
        <Route path="/providers/:id">
          {(params) => <ProviderDetail id={params.id} />}
        </Route>
        <Route path="/book" component={Book} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/specialties" component={Specialties} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

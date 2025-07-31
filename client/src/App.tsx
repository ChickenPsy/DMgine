import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/home";
import Premium from "@/pages/premium";
import Blog from "@/pages/blog";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/premium" component={Premium} />
      <Route path="/blog" component={Blog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Policies from "./pages/Policies";
import SignIn from "./pages/SignIn";
import Workspace from "./pages/Workspace";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/sign-in" component={SignIn} />
    <Route path="/onboarding" component={Onboarding} />
    <Route path="/policies" component={Policies} />
    <Route path="/workspace" component={Workspace} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

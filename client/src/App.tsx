import { lazy, Suspense, type ComponentType } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const Workspace = lazy(() => import("./pages/Workspace"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Policies = lazy(() => import("./pages/Policies"));
const NotFound = lazy(() => import("./pages/NotFound"));

function withSuspense(Component: ComponentType) {
  return function SuspenseWrapper(props: any) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#f8f4e9]" />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

const LazyWorkspace = withSuspense(Workspace);
const LazySignIn = withSuspense(SignIn);
const LazySignUp = withSuspense(SignUp);
const LazyOnboarding = withSuspense(Onboarding);
const LazyPolicies = withSuspense(Policies);
const LazyNotFound = withSuspense(NotFound);

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/sign-in" component={LazySignIn} />
    <Route path="/sign-up" component={LazySignUp} />
    <Route path="/onboarding" component={LazyOnboarding} />
    <Route path="/policies" component={LazyPolicies} />
    <Route path="/workspace" component={LazyWorkspace} />
    <Route path="/404" component={LazyNotFound} />
    <Route component={LazyNotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

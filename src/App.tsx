import { ComponentType, useEffect, useState } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import "./index.css";
import HomeNav from "./components/homeNav";
import Hero from "./components/Hero";
import Sidebar from "./components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import Transcription from "@/components/Transcription";
import Login, { Signup } from "./components/Auth";
import { Toaster } from "sonner";
import CreateNewProject from "./components/CreateNewProject";
import SettingsPage from "./components/settings";
import AboutPage from "./components/about";
import { MusicIcon } from "lucide-react";

interface RouteProps {
  path: string;
  component: ComponentType<any>;
}

export const ProtectedRoute: React.FC<RouteProps> = ({ path, component: Component }) => {
  const [isValid, setIsValid] = useState<null | boolean>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsValid(false);
      return;
    }

    fetch("http://localhost:8000/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then(() => setIsValid(true))
      .catch(() => setIsValid(false));
  }, []);

  if (isValid === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <MusicIcon className="w-8 h-8 text-gray-500 animate-bounce" />
      </div>
    );
  }

  return <Route path={path}>{isValid ? <Component /> : <Redirect to="/auth/login" />}</Route>;
};

export const PublicRoute: React.FC<RouteProps> = ({ path, component: Component }) => {
  const [isValid, setIsValid] = useState<null | boolean>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsValid(false);
      return;
    }

    fetch("http://localhost:8000/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then(() => setIsValid(true))
      .catch(() => setIsValid(false));
  }, []);

  useEffect(() => {
    if (isValid === true) {
      navigate("/");
    }
  }, [isValid, navigate]);

  if (isValid === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <MusicIcon className="w-8 h-8 text-gray-500 animate-bounce" />
      </div>
    );
  }

  return <Route path={path} component={Component} />;
};

const App = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [location] = useLocation();

  const showSidebar = location.toLowerCase().startsWith("/transcription");
  return (
    <div className="relative flex bg-gradient-to-r from-slate-100 via-pink-100 to-blue-100 w-screen h-screen">
      {showSidebar && (
        <div className="z-[1000] sticky">
          <Sidebar open={openSidebar} setOpen={setOpenSidebar} />
        </div>
      )}
      <Toaster
        toastOptions={{
          style: {
            background: "linear-gradient(to right, #f8fafc, #e2e8f0)", // Subtle whitish-slatish gradient
            color: "#1e293b ",
          },
        }}
      />
      <div className="flex flex-col w-full h-full">
        <div>
          <HomeNav />
          {/* <button onClick={() => toast.success("test")}>test</button> */}
        </div>
        <AnimatePresence mode="wait">
          <motion.div className="z-0 relative flex flex-grow justify-center m-0 p-0 w-full h-full">
            <Switch>
              <Route path="/" component={Hero} />
              <Route path="/Home" component={Hero} />

              <Route path="/auth" nest>
                <motion.div
                  key={location}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex justify-center items-center w-full h-full"
                >
                  <PublicRoute path="/login" component={Login} />
                  <PublicRoute path="/signup" component={Signup} />
                </motion.div>
              </Route>

              <ProtectedRoute path="/transcription" component={CreateNewProject} />
              <Route path="/transcription/:projectId" component={Transcription} />
              <ProtectedRoute path="/settings" component={SettingsPage} />
              <Route path="/About" component={AboutPage} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

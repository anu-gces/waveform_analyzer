import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import "./index.css";
import HomeNav from "./components/homeNav";
import Hero from "./components/Hero";
import Sidebar from "./components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import Transcription from "@/components/Transcription";
import Login, { Signup } from "./components/Auth";

const App = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [location] = useLocation();

  return (
    <div className="relative flex bg-gradient-to-r from-slate-100 via-pink-100 to-blue-100 w-screen h-screen">
      <div className="z-[1000] sticky">
        <Sidebar open={openSidebar} setOpen={setOpenSidebar} />
      </div>
      <div className="flex flex-col w-full h-full">
        <div>
          <HomeNav />
        </div>
        <AnimatePresence mode="wait">
          <motion.div className="relative z-0 flex flex-grow justify-center m-0 p-0 w-full h-full">
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
                  <Route path="/login" component={Login} />
                  <Route path="/signup" component={Signup} />
                </motion.div>
              </Route>
              <Route path="/transcription" component={Transcription} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

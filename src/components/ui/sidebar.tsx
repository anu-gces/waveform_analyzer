import React, { Dispatch, memo, SetStateAction, useState } from "react";
import { ChevronsRight, LucideIcon, Music4Icon, ShoppingCart, Folder, Plus, Trash } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import pitchForgeLogo from "@/assets/Logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "./input";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const projects = [
  "Goofy Project 1",
  "Cool Project 2",
  "Random Idea",
  "What dup",
  "hehehehe",
  "Goofy Project 1",
  "Cool Project 2",
  "Random Idea",
  "What dup",
  "hehehehe",
  "Goofy Project 1",
  "Cool Project 2",
  "Random Idea",
  "What dup",
  "hehehehe",
  "Goofy Project 1",
  "Cool Project 2",
  "Random Idea",
  "What dup",
  "hehehehe",
];

const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const [selected, setSelected] = useState("Dashboard");
  const [newProjectName, setNewProjectName] = useState("");

  const setSongFile = useStore((state) => state.setSongFile);

  const handleSongUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setSongFile(selectedFile);
    }
  };

  return (
    <>
      <motion.nav
        layout
        className="top-0 z-[1000] fixed border-slate-300 bg-gradient-to-b from-slate-100 via-pink-100 to-blue-100 p-2 border-r h-screen shrink-0"
        style={{
          width: open ? "225px" : "fit-content",
        }}
      >
        <TitleSection open={open} />

        <div className="space-y-1">
          {/* Start New Project Option */}

          <Dialog>
            <DialogTrigger asChild>
              <motion.button
                layout
                className={`relative flex h-10 w-full items-center rounded-md transition-colors ${
                  selected === "Start New Project" ? "bg-indigo-100 text-slate-800" : "text-slate-500 hover:bg-black/20"
                }`}
              >
                <motion.div layout className="place-content-center grid w-10 h-full text-lg">
                  <Plus className="text-green-500" /> {/* + icon in green */}
                </motion.div>
                {open && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.125 }}
                    className="font-medium text-xs"
                  >
                    Start New Project
                  </motion.span>
                )}
              </motion.button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Start New Project</DialogTitle>
              <DialogDescription>Enter details for your new project.</DialogDescription>
              <Input
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => {
                  e.preventDefault();

                  setNewProjectName(e.target.value);
                }}
              />
              <Input type="file" placeholder="Upload Music" />
              <DialogClose className="flex justify-between">
                <Button variant="destructive">Cancel</Button>
                <Button
                  onClick={() => {
                    if (newProjectName) {
                      projects.push(newProjectName);
                      setNewProjectName("");
                    }
                  }}
                >
                  Save
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>

          {/* Project Options */}
          <AnimatePresence>
            <div
              className="h-[600px] overflow-y-auto"
              style={{
                maskImage: "linear-gradient(to bottom, black, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
              }}
            >
              {projects.map((project, index) => (
                <Option
                  key={index}
                  Icon={Folder}
                  title={project}
                  selected={selected}
                  setSelected={setSelected}
                  open={open}
                  trashIcon={open} // Show trash icon when expanded
                />
              ))}
            </div>
          </AnimatePresence>
        </div>

        <ToggleClose open={open} setOpen={setOpen} />
      </motion.nav>
      {/* this is just a dummy nav dont worry about it */}
      <nav
        className="top-0 z-[-1] border-slate-300 bg-red-500 opacity-0 p-2 border-r h-screen shrink-0"
        style={{
          width: "fit-content",
        }}
      >
        <div className="space-y-1">
          <Option Icon={Folder} title="Products" selected={selected} setSelected={setSelected} open={false} />
        </div>
      </nav>
    </>
  );
};

const Option = ({
  Icon,
  title,
  selected,
  setSelected,
  open,
  trashIcon,
  specialAction,
}: {
  Icon: LucideIcon;
  title: string;
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  open: boolean;
  trashIcon?: boolean; // Trash icon flag
  specialAction?: boolean; // Special action for + icon
}) => {
  const [, setLocation] = useLocation();

  return (
    <motion.button
      layout
      onClick={() => {
        setSelected(title);
        setLocation(`/transcription?projectId=${title}`);
      }}
      className={`relative flex h-10 w-full items-center rounded-md transition-colors ${
        selected === title ? "bg-indigo-100 text-slate-700" : "text-slate-500 hover:bg-black/20"
      }`}
    >
      <motion.div layout className="place-content-center grid w-10 h-full text-lg">
        <Icon className={specialAction ? "text-green-500" : ""} />
      </motion.div>
      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.125 }}
          className="font-medium text-xs"
        >
          {title}
        </motion.span>
      )}

      {trashIcon && open && title !== "Start New Project" && (
        <motion.div
          layout
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{ delay: 0.5 }}
          className="flex justify-center items-center ml-auto w-8 h-8 text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering project selection
            console.log(`Delete ${title}`);
          }}
        >
          <Trash size={16} />
        </motion.div>
      )}
    </motion.button>
  );
};

const MemoizedLogo = memo(() => (
  <motion.img layout key="image" layoutId="logo" src={pitchForgeLogo} className="h-16" />
));

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="border-slate-300 mb-3 pb-3 border-b">
      <div className="flex justify-center items-center hover:bg-black/20 rounded-md transition-colors cursor-pointer">
        {open ? (
          <MemoizedLogo />
        ) : (
          <motion.div layout key="pf" layoutId="logo" className="flex justify-center items-center w-8 h-8 font-bold">
            <Music4Icon />
          </motion.div>
        )}
      </div>
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>> }) => {
  return (
    <button
      onClick={() => setOpen((pv) => !pv)}
      className="right-0 bottom-0 left-0 absolute border-slate-300 border-t transition-colors"
    >
      <div className={cn("flex items-center p-2 justify-start w-full")}>
        <Avatar className="w-8 h-8 transition-none">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" className="w-8 h-8" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="ml-2 font-medium text-xs"
          >
            Welcome, Anu!
          </motion.span>
        )}
      </div>
      <div className="flex items-center hover:bg-black/20 p-2">
        <motion.div layout className="place-content-center grid text-lg size-10">
          <ChevronsRight className={`transition-transform ${open && "rotate-180"}`} />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="font-medium text-xs"
          >
            Hide
          </motion.span>
        )}
      </div>
    </button>
  );
};

export default Sidebar;

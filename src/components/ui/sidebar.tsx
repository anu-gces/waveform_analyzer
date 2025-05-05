import React, { Dispatch, memo, SetStateAction, useState } from "react";
import {
  ChevronsRight,
  LucideIcon,
  Music4Icon,
  ShoppingCart,
  Folder,
  Plus,
  Trash,
  MusicIcon,
  SettingsIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import pitchForgeLogo from "@/assets/Logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "./input";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ProfilePicture from "@/assets/CoverPic.jpg";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "wouter/use-browser-location";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");

  const [songFileInput, setSongFileInput] = useState<File | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", newProjectName);
      if (songFileInput) formData.append("file", songFileInput);

      const res = await fetch("http://localhost:8000/create-new-project", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create project");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      toast.success("Project created successfully!", { description: data.id });
      setLocation(`/transcription/${data.id}`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewProjectName("");
      setSongFileInput(null);
    },
    onError: (err) => {
      toast.error((err as Error).message || "Something went wrong");
    },
  });

  const handleCreate = () => {
    if (!newProjectName || !songFileInput) {
      toast.error("Both project name and song are required.");
      return;
    }
    createProjectMutation.mutate();
  };

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/projects", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<
        Array<{
          id: string;
          user_id: string;
          name: string;
          song_url: string;
          seeker_position: number;
          zoom_factor: number;
          loop_start: number | null;
          loop_end: number | null;
          created_at: string;
          updated_at: string;
        }>
      >;
    },
  });

  return (
    <>
      <motion.nav
        layout
        className="top-0 z-[1000] fixed bg-gradient-to-b from-slate-100 via-pink-100 to-blue-100 p-2 border-slate-300 border-r h-screen shrink-0"
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
                  <Plus className="text-green-500" />
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
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Input type="file" accept="audio/*" onChange={(e) => setSongFileInput(e.target.files?.[0] || null)} />
              <DialogClose asChild>
                <div className="flex justify-between space-x-2 mt-4">
                  <Button variant="destructive">Cancel</Button>
                  <Button onClick={handleCreate} disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? <MusicIcon className="w-5 h-5 animate-bounce" /> : "Save"}
                  </Button>
                </div>
              </DialogClose>
            </DialogContent>
          </Dialog>

          {/* Project Options */}
          <AnimatePresence>
            <div className="h-[550px] overflow-y-auto">
              {projects.map((project, index) => (
                <div key={index} onClick={() => navigate(`/transcription/${project.id}`)}>
                  <Option
                    key={project.id}
                    Icon={Folder}
                    projectId={project.id}
                    title={project.name}
                    selected={selected}
                    setSelected={setSelected}
                    open={open}
                    trashIcon={open} // Show trash icon when expanded
                  />
                </div>
              ))}
            </div>
          </AnimatePresence>
        </div>

        <ToggleClose open={open} setOpen={setOpen} />
      </motion.nav>
      {/* this is just a dummy nav dont worry about it */}
      <nav
        className="top-0 z-[-1] bg-red-500 opacity-0 p-2 border-slate-300 border-r h-screen shrink-0"
        style={{
          width: "fit-content",
        }}
      >
        <div className="space-y-1">
          <Option
            Icon={Folder}
            title="Products"
            selected={selected}
            setSelected={setSelected}
            open={false}
            projectId={""}
          />
        </div>
      </nav>
    </>
  );
};

const Option = ({
  Icon,
  projectId,
  title,
  selected,
  setSelected,
  open,
  trashIcon,
  specialAction,
}: {
  Icon: LucideIcon;
  projectId: string;
  title: string;
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  open: boolean;
  trashIcon?: boolean;
  specialAction?: boolean;
}) => {
  const [showDialog, setShowDialog] = useState(false);

  const queryClient = useQueryClient();

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`http://localhost:8000/project/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete project");
      }

      return await res.json();
    },
    onSuccess: (_, projectId) => {
      toast.success("Project deleted successfully", {
        description: `Project ID: ${projectId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to delete project");
    },
  });

  return (
    <>
      <motion.button
        layout
        onClick={() => {
          setSelected(projectId);
        }}
        className={`relative flex h-10 w-full items-center rounded-md transition-colors ${
          selected === projectId ? "bg-indigo-100 text-slate-700" : "text-slate-500 hover:bg-black/20"
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
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="top-1 right-2 absolute flex justify-center items-center bg-white rounded-full w-8 h-8 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              setShowDialog(true);
            }}
          >
            <Trash size={16} className="text-red-500 active:scale-90 transition-transform duration-150" />
          </motion.div>
        )}
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500 text-sm">
            This will permanently delete <span className="font-semibold">{title}</span>. Id: {projectId}
          </p>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log(`Confirmed delete: ${title}`);
                setShowDialog(false);
                deleteProjectMutation.mutate(projectId); // <-- Actual delete logic
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MemoizedLogo = memo(() => (
  <motion.img layout key="image" layoutId="logo" src={pitchForgeLogo} className="h-16" />
));

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="mb-3 pb-3 border-slate-300 border-b">
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
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // adjust this if you're storing token elsewhere
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return (
    <button
      onClick={() => setOpen((pv) => !pv)}
      className="right-0 bottom-0 left-0 absolute border-slate-300 border-t transition-colors"
    >
      <div className="flex justify-start items-center p-2 w-full">
        <Avatar className="w-8 h-8 transition-none">
          <AvatarImage src={ProfilePicture} alt="@user" className="w-8 h-8" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        {open && !isLoading && user && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="flex items-center gap-2 ml-2 font-medium text-slate-700 text-xs"
          >
            <span>Welcome, {user.email}!</span>
            <SettingsIcon
              size={16}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // prevent sidebar collapse
                navigate("/settings");
              }}
            />
          </motion.div>
        )}
      </div>

      <div className="flex items-center hover:bg-black/20 p-2">
        <motion.div layout className="place-content-center grid size-10 text-lg">
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

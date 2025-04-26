import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Music } from "lucide-react";

const CreateNewProject = () => {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", name);
      if (file) formData.append("file", file);

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

      return await res.json(); // { id: ..., song_url: ... }
    },
    onSuccess: (data) => {
      toast.success("Project created successfully!", data.id);
      console.log("New project ID:", data.id);
      setLocation(`/transcription/${data.id}`);
      queryClient.invalidateQueries({
        queryKey: ["projects"], // Explicitly specify the query key
      });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Something went wrong");
    },
  });

  const handleCreate = () => {
    if (!name || !file) {
      toast.error("Both project name and song are required.");
      return;
    }
    createProjectMutation.mutate();
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-full">
      <div className="flex flex-col justify-center items-center space-y-4 shadow-lg my-0 px-8 py-0 rounded-lg w-[500px] h-[300px]">
        <h2 className="font-semibold text-slate-800 text-xl">Start New Project</h2>
        <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={handleCreate} disabled={createProjectMutation.isPending} className="justify-center w-[150px]">
          {createProjectMutation.isPending ? <Music className="w-5 h-5 animate-bounce" /> : "Create Project"}
        </Button>
      </div>
    </div>
  );
};

export default CreateNewProject;

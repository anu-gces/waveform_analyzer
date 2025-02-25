import { Music } from "lucide-react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <Music className="w-10 h-10 text-slate-800 animate-bounce" />
    </div>
  );
};

import { useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import useMeasure from "react-use-measure";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

interface NotesPopoverProps {
  message?: string;
  markerRef: React.RefObject<any>;
  remoteButtonRef: React.RefObject<HTMLButtonElement>;
}

const NotesPopover: React.FC<NotesPopoverProps> = ({
  message = "",
  markerRef,
  remoteButtonRef,
}) => {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [measureRef, bounds] = useMeasure();

  const handleMarkerClick = () => {
    if (markerRef.current) {
      const markerPosition = markerRef.current.getClientRect();
      setPopoverPosition({
        x: markerPosition.x + markerPosition.width / 2,
        y: markerPosition.y + markerPosition.height / 2,
      });
    }
    if (remoteButtonRef.current) {
      remoteButtonRef.current.click();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hidden">Open Popover</button>
      </PopoverTrigger>
      <PopoverContent
        ref={measureRef}
        className="absolute"
        style={{ left: popoverPosition.x, top: popoverPosition.y }}
      >
        <>
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              defaultValue={message}
              className="flex-none border-black w-[90%]"
            />
            <Trash2 className="text-rose-600 transform transition-transform duration-150 cursor-pointer active:scale-75" />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button>Cancel</Button>
            <Button>Save</Button>
          </div>
        </>
      </PopoverContent>
    </Popover>
  );
};

export default NotesPopover;

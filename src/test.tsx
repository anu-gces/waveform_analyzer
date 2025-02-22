import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogImage,
  DialogSubtitle,
  DialogClose,
  DialogDescription,
  DialogContainer,
} from "@/components/ui/ibelickDialog";
import { PlusIcon } from "lucide-react";

export function DialogBasicOne() {
  return (
    <Dialog
      transition={{
        type: "spring",
        bounce: 0.05,
        duration: 0.5,
      }}
    >
      <DialogTrigger
        style={{
          borderRadius: "12px",
        }}
        className="flex flex-col border-zinc-950/10 dark:border-zinc-50/10 bg-white dark:bg-zinc-900 border max-w-[270px] overflow-hidden"
      >
        <DialogImage
          src="/eb-27-lamp-edouard-wilfrid-buquet.jpg"
          alt="A desk lamp designed by Edouard Wilfrid Buquet in 1925. It features a double-arm design and is made from nickel-plated brass, aluminium and varnished wood."
          className="w-full h-48 object-cover"
        />
        <div className="flex flex-row flex-grow justify-between items-end p-2">
          <div>
            <DialogTitle className="text-zinc-950 dark:text-zinc-50">
              EB27
            </DialogTitle>
            <DialogSubtitle className="text-zinc-700 dark:text-zinc-400">
              Edouard Wilfrid Buquet
            </DialogSubtitle>
          </div>
          <button
            type="button"
            className="relative flex justify-center items-center border-zinc-950/10 dark:border-zinc-50/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900 ml-1 border rounded-lg focus-visible:ring-2 dark:focus-visible:ring-zinc-500 w-6 h-6 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-50 dark:text-zinc-500 transition-colors select-none appearance-none scale-100 shrink-0 active:scale-[0.98]"
            aria-label="Open dialog"
          >
            <PlusIcon size={12} />
          </button>
        </div>
      </DialogTrigger>
      <DialogContainer>
        <DialogContent
          style={{
            borderRadius: "24px",
          }}
          className="relative flex flex-col border-zinc-950/10 dark:border-zinc-50/10 bg-white dark:bg-zinc-900 border w-full sm:w-[500px] h-auto overflow-hidden pointer-events-auto"
        >
          <DialogImage
            src="/eb-27-lamp-edouard-wilfrid-buquet.jpg"
            alt="A desk lamp designed by Edouard Wilfrid Buquet in 1925. It features a double-arm design and is made from nickel-plated brass, aluminium and varnished wood."
            className="w-full h-full"
          />
          <div className="p-6">
            <DialogTitle className="text-2xl text-zinc-950 dark:text-zinc-50">
              EB27
            </DialogTitle>
            <DialogSubtitle className="text-zinc-700 dark:text-zinc-400">
              Edouard Wilfrid Buquet
            </DialogSubtitle>
            <DialogDescription
              disableLayoutAnimation
              variants={{
                initial: { opacity: 0, scale: 0.8, y: 100 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.8, y: 100 },
              }}
            >
              <p className="mt-2 text-zinc-500 dark:text-zinc-500">
                Little is known about the life of Édouard-Wilfrid Buquet. He was
                born in France in 1866, but the time and place of his death is
                unfortunately a mystery.
              </p>
              <p className="text-zinc-500">
                Research conducted in the 1970s revealed that he’d designed the
                “EB 27” double-arm desk lamp in 1925, handcrafting it from
                nickel-plated brass, aluminium and varnished wood.
              </p>
              <a
                className="inline-flex mt-2 text-zinc-500 underline"
                href="https://www.are.na/block/12759029"
                target="_blank"
                rel="noopener noreferrer"
              >
                Are.na block
              </a>
            </DialogDescription>
          </div>
          <DialogClose className="text-zinc-50" />
        </DialogContent>
      </DialogContainer>
    </Dialog>
  );
}

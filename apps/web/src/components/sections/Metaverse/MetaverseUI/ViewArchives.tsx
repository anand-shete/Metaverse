import api from "@/api";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ViewArchives = ({ isOpen, onClose }: Props) => {
  const [archives, setArchives] = useState<{ Key: string; Size: number }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const getArchiveNotes = async () => {
      try {
        const res = await api.get("/user/archives");
        console.log("data:", res.data);
        console.log("array:", Array.from(res.data));
        setArchives(res.data);
      } catch {
        toast.error("Error fetching Metaverse archives");
      }
    };
    getArchiveNotes();

    const closeModalOnEsc = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", closeModalOnEsc, true);
    return () => {
      document.removeEventListener("keydown", closeModalOnEsc, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-600 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between rounded-tl-xl rounded-tr-xl border-b border-slate-700 bg-slate-700 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">Metaverse Archives</h2>
            <p className="text-sm text-slate-200">
              All files stored in archives
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-slate-600"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="h-80 space-y-4 overflow-y-scroll px-5 py-4">
          {Array.from(archives).length === 0 ? (
            <p className="pt-4 text-center text-sm">
              Upload notes to Metaverse archives to see them here.
            </p>
          ) : (
            archives.map((notes, idx) => (
              <div
                key={idx}
                className="flex max-h-48 justify-between space-y-2 overflow-y-auto rounded-md bg-gray-50 p-3 text-sm"
              >
                <span>{notes.Key.split("notes/").pop()}</span>
                <span className="text-black/80">
                  {(notes.Size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewArchives;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { imageBaseUrl } from "../utils/baseURL";
import { FaFilePdf } from "react-icons/fa6";
import { Button } from "./ui/button";
import { useState } from "react";

const PreviewDialog = ({ imageName, title, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      const pdfUrl = imageBaseUrl + imageName;
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsOpen(false); // Close dialog after download
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "my-2 w-24 h-24 rounded-md border flex items-center justify-center border-black cursor-pointer",
            className,
          )}
        >
          {imageName ? (
            imageName.endsWith(".pdf") ? (
              <FaFilePdf className="size-8 text-red-600" />
            ) : (
              <img
                className="object-contain w-full h-full"
                src={imageBaseUrl + imageName}
                alt={imageName}
              />
            )
          ) : (
            <img
              className="object-contain w-full h-full"
              src={"/placeholder.svg"}
              alt={"placeholder"}
            />
          )}
        </div>
      </DialogTrigger>
      {imageName && !imageName.endsWith(".pdf") && (
        <DialogContent className="max-h-[90vh]">
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            <DialogDescription className="hidden" />
          </DialogHeader>
          <div className="my-2 max-h-[75vh] max-w-[90vw] rounded-md border flex items-center justify-center border-black">
            <img
              className="object-contain w-full h-full"
              src={imageBaseUrl + imageName}
              alt={imageName}
            />
          </div>
        </DialogContent>
      )}
      {imageName && imageName.endsWith(".pdf") && (
        <DialogContent className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Do you want to download this?</DialogTitle>
            <DialogDescription className="hidden" />
          </DialogHeader>
          <div className="my-2 flex items-center justify-end gap-4">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleDownloadPDF}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default PreviewDialog;

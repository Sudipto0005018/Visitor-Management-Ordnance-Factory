import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import baseUrl from "../utils/baseURL";
import { FaSearch } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

const DocumentTypeSelect = ({ configDocumentTypes = [], value, onChange }) => {
  const [customDocumentType, setCustomDocumentType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newType, setNewType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const DocumentTypeList = [...configDocumentTypes];

  if (customDocumentType && !DocumentTypeList.includes(customDocumentType)) {
    DocumentTypeList.push(customDocumentType);
  }

  // 🔍 Filter logic
  const filteredList = DocumentTypeList.filter((type) =>
    type?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (dialogOpen) {
      setStep(1);
      setNewType("");
      setIsSaving(false);
    }
  }, [dialogOpen]);

  const handleSelectChange = (selectedValue) => {
    if (selectedValue === "Other") {
      setDialogOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const saveData = async (newValue) => {
    try {
      await axios.post(baseUrl + "/api/v1/config/document", {
        doc_type: newValue,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSave = async (shouldSave) => {
    const finalizedType = newType.trim();

    if (shouldSave) {
      setIsSaving(true);
      await saveData(finalizedType);
      setIsSaving(false);
    }

    setCustomDocumentType(finalizedType);
    onChange(finalizedType);
    setDialogOpen(false);
  };

  const handleDelete = async (type) => {
    console.log(type);

    try {
      await axios.post(
        baseUrl + "/api/v1/config/delete",
        {
          key: "document_types",
          value: type,
        },
        { withCredentials: true },
      );

      const updated = DocumentTypeList.filter((t) => t !== type);

      setCustomDocumentType("");
      onChange("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="mb-4">
      <Select value={value || undefined} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select" />
        </SelectTrigger>

        <SelectContent>
          {/* 🔍 SEARCH */}
          <div
            className="p-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border rounded-md px-2">
              <FaSearch className="text-gray-400 text-sm mr-2" />
              <input
                className="w-full py-1 outline-none text-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* {filteredList.length > 0 ? (
            filteredList.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500 p-2">
              No results found
            </div>
          )} */}

          {filteredList.length > 0 ? (
            filteredList.map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="flex items-center justify-between group"
              >
                <div className="flex w-full items-center justify-between">
                  <span>{type}</span>

                  <button
                    className="ml-2 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete(type);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500 p-2">
              No results found
            </div>
          )}

          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Add Visitor Document" : "Save Visitor Document"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 ? "Enter new Document" : "Do you want to save it?"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <Input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Enter Document"
            />
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)} disabled={!newType.trim()}>
                  OK
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => handleSave(false)}>No</Button>
                <Button onClick={() => handleSave(true)}>
                  {isSaving ? "Saving..." : "Yes"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentTypeSelect;

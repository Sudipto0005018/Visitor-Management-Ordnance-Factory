import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const VisitorCategoryTypeSelect = ({
  configCategoryTypes = [],
  value,
  onChange,
  onConfigUpdate,
}) => {
  const [customCategoryType, setCustomCategoryType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newType, setNewType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [localCategoryTypes, setLocalCategoryTypes] = useState([]);

  // Initialize local state when prop changes
  useEffect(() => {
    setLocalCategoryTypes([...configCategoryTypes]);
  }, [configCategoryTypes]);

  // Build the complete list including custom type
  const getCategoryTypeList = () => {
    const list = [...localCategoryTypes];
    if (customCategoryType && !list.includes(customCategoryType)) {
      list.push(customCategoryType);
    }
    return list;
  };

  // Filtered list for display
  const filteredList = getCategoryTypeList().filter((type) =>
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
      await axios.post(baseUrl + "/api/v1/config/category", {
        Visitor_category: newValue,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const handleSave = async (shouldSave) => {
    const finalizedType = newType.trim();

    if (shouldSave) {
      setIsSaving(true);
      try {
        await saveData(finalizedType);
        // Update local state after successful save
        const updatedList = [...localCategoryTypes, finalizedType];
        setLocalCategoryTypes(updatedList);
        // Notify parent
        if (onConfigUpdate) {
          onConfigUpdate(updatedList);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsSaving(false);
      }
    }

    setCustomCategoryType(finalizedType);
    onChange(finalizedType);
    setDialogOpen(false);
  };

  const handleDelete = async (type) => {
    try {
      console.log(type);

      await axios.post(
        baseUrl + "/api/v1/config/delete",
        {
          key: "visitor_types",
          value: type,
        },
        { withCredentials: true },
      );

      // Update local state by removing the deleted item
      const updatedTypes = localCategoryTypes.filter((t) => t !== type);
      setLocalCategoryTypes(updatedTypes);

      // Notify parent
      if (onConfigUpdate) {
        onConfigUpdate(updatedTypes);
      }

      // Clear selection if the deleted item was selected
      if (value === type) {
        onChange("");
      }

      // Clear custom category type if it matches
      if (customCategoryType === type) {
        setCustomCategoryType("");
      }

      // Clear search to show remaining items
      setSearch("");
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
          {/* Search Input */}
          <div
            className="p-2 border-b"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border rounded-md px-2">
              <FaSearch className="text-gray-400 text-sm mr-2" />
              <input
                className="w-full py-1 text-sm outline-none border-none"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredList.length > 0 ? (
            filteredList.map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="!flex !w-full !items-center !justify-between group"
              >
                <span className="flex-1 pr-18 text-left">{type}</span>

                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDelete(type);
                  }}
                >
                  <FaTrash />
                </button>
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

      {/* Dialog remains the same */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Add Visitor Category" : "Save Visitor Category"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 ? "Enter new category" : "Do you want to save it?"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <Input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Enter category"
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

export default VisitorCategoryTypeSelect;

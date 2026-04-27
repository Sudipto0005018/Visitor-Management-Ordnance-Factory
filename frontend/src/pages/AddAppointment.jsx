import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FiPhone, FiUser } from "react-icons/fi";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineMailOutline } from "react-icons/md";
import { GrUserManager } from "react-icons/gr";
import { FaPlus, FaRegBuilding } from "react-icons/fa";
import { RiMenuSearchLine } from "react-icons/ri";
import { CiCalendarDate } from "react-icons/ci";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Context } from "../utils/Context";
import toaster from "../utils/toaster";
import baseURL from "../utils/baseURL";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const AddAppointment = () => {
  const { employees } = useContext(Context);
  const navigate = useNavigate();
  const imageInputRef = React.useRef(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [inputs, setInputs] = React.useState({
    name: "",
    visitor_contact: "",
    email: "",
    visitor_address: "",
    purpose: "",
    whome_to_meet: "",
    reference: "",
    date: null,
    unit_name: "",
    designation: "",
  });
  const [searchEmp, setSearchEmp] = React.useState("");
  const [open, setOpen] = React.useState({
    calendar: false,
    dialog: false,
    rejectDialog: false,
    checkout: false,
  });
  const [selectedEmp, setSelectedEmp] = useState({});

  const d = new Date();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };
  const generatePdfThumbnail = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      setImagePreview(canvas.toDataURL());
    };
    reader.readAsArrayBuffer(file);
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type == "application/pdf") {
        generatePdfThumbnail(file);
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (
      !inputs.name ||
      !inputs.visitor_contact ||
      !inputs.visitor_address ||
      !inputs.purpose ||
      !inputs.whome_to_meet ||
      !inputs.reference ||
      !inputs.date
    ) {
      toaster("error", "Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", inputs.name);
      formData.append("visitor_contact", inputs.visitor_contact);
      formData.append("email", inputs.email);
      formData.append("visitor_address", inputs.visitor_address);
      formData.append("purpose", inputs.purpose);
      formData.append(
        "ref_date",
        inputs.date ? new Date(inputs.date).toISOString() : "",
      );
      formData.append("whome_to_meet", selectedEmp.name);
      formData.append("reference", inputs.reference);
      formData.append("unit_name", inputs.unit_name);
      formData.append("designation", inputs.designation);
      formData.append(
        "date",
        inputs.date ? new Date(inputs.date).toISOString() : "",
      );
      if (imageInputRef.current.files.length > 0) {
        formData.append("ad_image", imageInputRef.current.files[0]);
      }
      await axios.post(`${baseURL}/api/v1/appointment/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      navigate("/view-appointments");
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to register appointment");
    }
  };
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchEmp.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchEmp.toLowerCase()),
  );

  return (
    <div className="bg-white h-full p-4 rounded-md shadow flex flex-col">
      <h1 className="text-[16px] font-semibold mb-4 text-center">
        New Appointment Registration
      </h1>
      <div className="flex flex-col overflow-y-scroll hidden-scrollbar">
        <div className="flex flex-col lg:flex-row lg:gap-4">
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="name"
              >
                <FiUser />
                Name<span className="text-red-500"> *</span>
              </label>
              <Input
                id="name"
                placeholder="Name"
                className="mb-4 disabled-black"
                name="name"
                value={inputs.name}
                onChange={handleChange}
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="visitor_contact"
              >
                <FiPhone />
                Mobile Number<span className="text-red-500"> *</span>
              </label>
              <Input
                id="visitor_contact"
                placeholder="Mobile"
                className="mb-4 disabled-black"
                type="number"
                name="visitor_contact"
                value={inputs.visitor_contact}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="email"
              >
                <MdOutlineMailOutline />
                Email
              </label>
              <Input
                id="email"
                placeholder="email"
                className="mb-4"
                name="email"
                value={inputs.email}
                onChange={handleChange}
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="visitor_address"
              >
                <IoLocationOutline />
                Address<span className="text-red-500"> *</span>
              </label>
              <Input
                id="visitor_address"
                placeholder="Address"
                className="mb-4 disabled-black"
                name="visitor_address"
                value={inputs.visitor_address}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:gap-4">
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="purpose"
              >
                <FaRegBuilding />
                Visiting Purpose<span className="text-red-500"> *</span>
              </label>
              <Input
                id="purpose"
                placeholder="Purpose"
                className="mb-4 disabled-black"
                name="purpose"
                value={inputs.purpose}
                onChange={handleChange}
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="whome_to_meet"
              >
                <GrUserManager />
                Whom to Meet<span className="text-red-500"> *</span>
              </label>
              {employees.length == 0 && (
                <Input
                  placeholder="Whom to Meet"
                  className="mb-4"
                  name="whome_to_meet"
                  id="whome_to_meet"
                  value={inputs.whome_to_meet}
                  onChange={handleChange}
                />
              )}
              {employees.length > 0 && (
                <div className="mb-4">
                  <Select
                    onValueChange={(value) => {
                      const selectedEmp = employees.find(
                        (emp) => emp.id === value,
                      );
                      setSelectedEmp(selectedEmp);

                      setInputs((prev) => ({
                        ...prev,
                        whome_to_meet: value,
                        designation: selectedEmp?.designation || "",
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    {/* <SelectContent>
                      {employees
                        .map((emp) => emp.name)
                        .map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent> */}
                    <SelectContent>
                      {/* 🔍 Search Input */}
                      <div
                        className="p-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Input
                          placeholder="Search employee..."
                          value={searchEmp}
                          onChange={(e) => setSearchEmp(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>

                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.designation})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          No results found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-1/2 px-1 flex flex-col justify-between">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="reference"
              >
                <RiMenuSearchLine size={18} />
                Reference No.<span className="text-red-500"> *</span>
              </label>
              <Input
                id="reference"
                placeholder="Reference No."
                className="mb-4 disabled-black"
                name="reference"
                value={inputs.reference}
                onChange={handleChange}
              />
            </div>

            <div className="w-full md:w-1/2 px-1 flex flex-col">
              <label
                className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1"
                htmlFor="date"
              >
                <CiCalendarDate size={18} />
                Reference Date<span className="text-red-500"> *</span>
              </label>
              <Popover
                open={open.calendar}
                onOpenChange={(set) =>
                  setOpen((prev) => {
                    return { ...prev, calendar: set };
                  })
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-full justify-between font-normal"
                  >
                    {inputs.date
                      ? new Date(inputs.date).toLocaleDateString()
                      : "Select date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={inputs.date ? new Date(inputs.date) : undefined}
                    captionLayout="dropdown"
                    startMonth={new Date(2025, 0)}
                    endMonth={
                      new Date(d.getFullYear(), d.getMonth(), d.getDate())
                    }
                    onSelect={(date) => {
                      setInputs({ ...inputs, date });
                      setOpen((prev) => {
                        return { ...prev, calendar: false };
                      });
                    }}
                    classNames={{
                      day: "h-9 w-9 text-sm rounded-sm overflow-hidden aria-selected:bg-blue-500 aria-selected:text-white",
                    }}
                    // disabled={(date) => date > new Date()}
                  />
                  <div className="w-full flex justify-center pb-2">
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-blue-700"
                      onClick={() => {
                        // setDate(new Date());
                        setInputs({ ...inputs, date: new Date() });
                        setOpen((prev) => {
                          return { ...prev, calendar: false };
                        });
                      }}
                    >
                      Today
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col">
            <label className="text-sm font-medium flex items-center gap-1">
              <FaRegBuilding />
              Unit Name
            </label>

            <Input
              name="unit_name"
              value={inputs.unit_name}
              onChange={handleChange}
              placeholder="Unit Name"
            />
          </div>

          {/* Designation */}
          <div className="flex flex-col">
            <label className="text-sm font-medium flex items-center gap-1">
              <GrUserManager />
              Designation<span className="text-red-500"> *</span>
            </label>

            <Input
              value={inputs.designation}
              placeholder="Designation"
              readOnly
            />
          </div>
        </div>

        <div className="px-1">
          <label className="ms-1 mb-2 text-sm font-medium text-gray-700">
            Document Upload
          </label>
          <input
            type="file"
            accept="image/*, application/pdf"
            ref={imageInputRef}
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
          <div
            className="mt-2 border border-gray-600 rounded-md h-32 w-32 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => imageInputRef.current.click()}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Document Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center p-2">
                <FaPlus className="text-4xl text-gray-600" />
                <p className="text-center text-xs mt-1 text-gray-600">
                  Click here to capture
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center mt-3">
          <Button onClick={handleSubmit} className="cursor-pointer">
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddAppointment;

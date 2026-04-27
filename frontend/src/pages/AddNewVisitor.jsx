import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";

import Camera from "../components/Camera.jsx";
import { Context } from "../utils/Context";
import toast from "../utils/toaster";
import { base64ToBlob, getSqlTimeStamp } from "../utils/helperFunctions";
import baseUrl, { imageBaseUrl } from "../utils/baseURL";
import DocumentTypeSelect from "../components/DocumentTypeSelect";
import { cn } from "../lib/utils";

import { FaPlus } from "react-icons/fa6";
import { FiUser, FiPhone, FiSearch } from "react-icons/fi";
import { MdOutlineMailOutline, MdOutlineDocumentScanner } from "react-icons/md";
import { IoLocationOutline } from "react-icons/io5";
import {
  FaRegBuilding,
  FaCarSide,
  FaRegClock,
  FaRegCheckCircle,
} from "react-icons/fa";
import { GrUserManager } from "react-icons/gr";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { VscUngroupByRefType } from "react-icons/vsc";
import { BsShop } from "react-icons/bs";
import fpSocket from "../utils/fpSocket";
import fingerprintSvg from "../assets/fingerprint.svg";
import socket from "../utils/fpSocket";
import VisitorCategoryTypeSelect from "../components/VisitorCategoryTypeSelect.jsx";

const AddNewVisitor = () => {
  const { user, config, employees } = useContext(Context);
   const [localConfig, setLocalConfig] = useState(config);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, config]);
  const initialValues = {
    name: "",
    email: "",
    visitor_contact: "",
    whome_to_meet: "",
    document_type: "",
    document_number: "",
    visitor_address: "",
    unit_name: "",
    city: "",
    designation: "",
    purpose: "",
    vehicle_number: "",
    in_time: "",
    Visitor_category: "",
    kiosk_name: "",
    otp: "",
    email_verified: false,
    mobile_verified: false,
  };

  //search related states\
  const [searchEmp, setSearchEmp] = useState("");

  const [dialogOpen, setDialogOpen] = useState({
    visitor: false,
    document: false,
    email: false,
    mobile: false,
    fingerprint: false,
    fpSearch: false,
    confirm: false,
  });
  const [images, setImages] = useState({ visitor: null, document: null });

  const [inputs, setInputs] = useState(
    JSON.parse(JSON.stringify(initialValues)),
  );
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const [fp, setFp] = useState({
    isConnected: fpSocket.connected,
    scanning: false,
    scanData: null,
    matchResult: null,
    error: null,
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchEmp.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchEmp.toLowerCase()),
  );
  // const handleSubmit = async () => {
  //   const {
  //     name,
  //     email,
  //     visitor_contact,
  //     whome_to_meet,
  //     document_type,
  //     document_number,
  //     visitor_address,
  //     purpose,
  //     vehicle_number,
  //     in_time,
  //     Visitor_category,
  //     unit_name
  //   } = inputs;

  //   if (
  //     !name ||
  //     !visitor_contact ||
  //     !visitor_address ||
  //     !purpose ||
  //     !whome_to_meet ||
  //     !in_time ||
  //     !Visitor_category ||
  //     !images.visitor
  //   ) {
  //     toast("error", "Please fill all required fields");
  //     return;
  //   }

  //   let time = (in_time + "").split(":");
  //   let d = new Date();
  //   d.setHours(parseInt(time[0]), parseInt(time[1]), 0, 0);
  //   const date = getSqlTimeStamp(d);
  //   const uid = Date.now();

  //   const imageToBlob = async (imageSrc) => {
  //     console.log("imageSrc", imageSrc);

  //     if (!imageSrc) return null;
  //     if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
  //       const response = await fetch(imageSrc);
  //       return await response.blob();
  //     }
  //     return base64ToBlob(imageSrc);
  //   };

  //   try {
  //     const visitorBlob = await imageToBlob(images.visitor);
  //     const documentBlob = images.document
  //       ? await imageToBlob(images.document)
  //       : null;

  //     const formData = new FormData();
  //     formData.append("name", name);
  //     formData.append("email", email);
  //     formData.append("visitor_contact", visitor_contact);
  //     formData.append("whome_to_meet", whome_to_meet);
  //     formData.append("document_type", document_type);
  //     formData.append("document_number", document_number);
  //     formData.append("visitor_address", visitor_address);
  //     formData.append("unit_name", inputs.unit_name);
  //     formData.append("city", inputs.city);
  //     formData.append("designation", inputs.designation);
  //     formData.append("purpose", purpose);
  //     formData.append("vehicle_number", vehicle_number);
  //     formData.append("in_time", date);
  //     formData.append("Visitor_category", Visitor_category);
  //     formData.append("user_name", user.user_name);
  //     formData.append("visitor_image", visitorBlob, `visitor_${uid}.jpg`);
  //     formData.append("mobile_verified", inputs.mobile_verified);
  //     formData.append("email_verified", inputs.email_verified);
  //     if (documentBlob) {
  //       formData.append("document_image", documentBlob, `document_${uid}.jpg`);
  //     }
  //     if (fp.scanData) {
  //       formData.append("fingerprint", fp.scanData);
  //     }

  //     const url = baseUrl + "/api/v1/visitor/add";
  //     const res = await axios.post(url, formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //       withCredentials: true,
  //     });
  //     if (res.data.success) {
  //       toast("success", "Visitor registered successfully");
  //       navigate("/view-visitors");
  //       socket.emit("RELOAD");
  //     }
  //   } catch (error) {
  //     const errMsg = error.response?.data?.message || error.message;
  //     toast("error", errMsg || "Failed to register visitor");
  //   }
  // };

  const handleSubmit = () => {
    const {
      name,
      visitor_contact,
      visitor_address,
      purpose,
      whome_to_meet,
      in_time,
      Visitor_category,
    } = inputs;

    if (
      !name ||
      !visitor_contact ||
      !visitor_address ||
      !purpose ||
      !whome_to_meet ||
      !in_time ||
      !Visitor_category ||
      !images.visitor
    ) {
      toast("error", "Please fill all required fields");
      return;
    }
    if (user.role == "user" && !fp.scanData) {
      toast("error", "Please add fingerprint");
      return;
    }

    // open confirmation dialog instead of submitting
    setDialogOpen((prev) => ({ ...prev, confirm: true }));
  };

  const confirmSubmit = async () => {
    try {
      const {
        name,
        email,
        visitor_contact,
        whome_to_meet,
        document_type,
        document_number,
        visitor_address,
        purpose,
        vehicle_number,
        in_time,
        Visitor_category,
      } = inputs;

      let time = (in_time + "").split(":");
      let d = new Date();
      d.setHours(parseInt(time[0]), parseInt(time[1]), 0, 0);
      const date = getSqlTimeStamp(d);
      const uid = Date.now();

      const imageToBlob = async (imageSrc) => {
        if (!imageSrc) return null;
        if (imageSrc.startsWith("http")) {
          const response = await fetch(imageSrc);
          return await response.blob();
        }
        return base64ToBlob(imageSrc);
      };

      const visitorBlob = await imageToBlob(images.visitor);
      const documentBlob = images.document
        ? await imageToBlob(images.document)
        : null;

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("visitor_contact", visitor_contact);
      formData.append("whome_to_meet", whome_to_meet);
      formData.append("document_type", document_type);
      formData.append("document_number", document_number);
      formData.append("visitor_address", visitor_address);
      formData.append("unit_name", inputs.unit_name);
      formData.append("city", inputs.city);
      formData.append("designation", inputs.designation);
      formData.append("purpose", purpose);
      formData.append("vehicle_number", vehicle_number);
      formData.append("in_time", date);
      formData.append("Visitor_category", Visitor_category);
      formData.append("user_name", user.user_name);
      formData.append("visitor_image", visitorBlob, `visitor_${uid}.jpg`);

      if (documentBlob) {
        formData.append("document_image", documentBlob, `document_${uid}.jpg`);
      }

      if (fp.scanData) {
        formData.append("fingerprint", fp.scanData);
      }

      const res = await axios.post(baseUrl + "/api/v1/visitor/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        toast("success", "Visitor registered successfully");
        navigate("/view-visitors");
        socket.emit("RELOAD");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toast("error", errMsg || "Failed to register visitor");
    } finally {
      setDialogOpen((prev) => ({ ...prev, confirm: false }));
    }
  };

  const handleConfigUpdate = (key, updatedList) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: updatedList,
    }));
  };


  const verifyEmail = async () => {
    if (!inputs.email) {
      toast("error", "Please enter an email to verify");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email)) {
      toast("error", "Please enter a valid email address");
      return;
    }
    try {
      setDialogOpen({ ...dialogOpen, email: true });
      const url = baseUrl + "/api/v1/visitor/verify-email";
      const res = await axios.post(
        url,
        { email: inputs.email },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast("success", "OTP sent successfully");
        setDialogOpen({ ...dialogOpen, email: true });
      } else {
        toast("error", res.data.message || "Failed to send OTP");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toast("error", errMsg || "Failed to verify email");
    }
  };

  const verifyMobile = async () => {
    if (!inputs.visitor_contact) {
      toast("error", "Please enter a mobile number to verify");
      return;
    }
    if (!/^\d{10}$/.test(inputs.visitor_contact)) {
      toast("error", "Please enter a valid 10-digit mobile number");
      return;
    }
    try {
      setDialogOpen({ ...dialogOpen, mobile: true });
      const url = baseUrl + "/api/v1/visitor/verify-mobile";
      const res = await axios.post(
        url,
        { mobile: inputs.visitor_contact },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast("success", "OTP sent successfully");
        setDialogOpen({ ...dialogOpen, mobile: true });
      } else {
        toast("error", res.data.message || "Failed to send OTP");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toast("error", errMsg || "Failed to verify mobile number");
    }
  };

  const verifyMobileOTP = async () => {
    if (!inputs.otp) {
      toast("error", "Please enter the OTP to verify");
      return;
    }
    try {
      const url = baseUrl + "/api/v1/visitor/verify-mobile-otp";
      const res = await axios.post(
        url,
        { mobile: inputs.visitor_contact, otp: inputs.otp },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast("success", "Mobile number verified successfully");
        setDialogOpen({ ...dialogOpen, mobile: false });
        setInputs((prev) => ({ ...prev, mobile_verified: true, otp: "" }));
      } else {
        toast("error", res.data.message || "Failed to verify OTP");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toast("error", errMsg || "Failed to verify OTP");
    }
  };

  const verifyOTP = async () => {
    if (!inputs.otp) {
      toast("error", "Please enter the OTP to verify");
      return;
    }
    try {
      const url = baseUrl + "/api/v1/visitor/verify-email-otp";
      const res = await axios.post(
        url,
        { email: inputs.email, otp: inputs.otp },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast("success", "Email verified successfully");
        setDialogOpen({ ...dialogOpen, email: false });
        setInputs((prev) => ({ ...prev, email_verified: true, otp: "" }));
      } else {
        toast("error", res.data.message || "Failed to verify OTP");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toast("error", errMsg || "Failed to verify OTP");
    }
  };

   useEffect(() => {
     setLocalConfig(config);
   }, [config]);

  useEffect(() => {
    if (location.state) {
      setInputs((prev) => ({ ...prev, ...location.state.visitor }));
    }
  }, [location.state]);

  const onConnect = () => {
    setFp((prev) => ({ ...prev, isConnected: true, error: null }));
  };
  const onDisconnect = () => {
    setFp((prev) => ({ ...prev, isConnected: false, scanning: false }));
  };
  const onScanResult = (data) => {
    const fpData = JSON.parse(data);
    if (fpData.message?.toLowerCase() == "success") {
      setFp((prev) => ({
        ...prev,
        scanning: false,
        scanData: fpData.result,
        error: data?.error || null,
      }));
    }
  };
  const onMatchResult = (data) => {
    console.log(JSON.parse(data), "sdafsdf");
    setFp((prev) => ({
      ...prev,
      scanning: false,
      matchResult: JSON.parse(data),
      error: data?.error || null,
    }));
  };
  useEffect(() => {
    fpSocket.on("connect", onConnect);
    fpSocket.on("disconnect", onDisconnect);
    fpSocket.on("SCAN_RESULT", onScanResult);
    fpSocket.on("MATCH_RESULT", onMatchResult);

    return () => {
      fpSocket.off("connect", onConnect);
      fpSocket.off("disconnect", onDisconnect);
      fpSocket.off("SCAN_RESULT", onScanResult);
      fpSocket.off("MATCH_RESULT", onMatchResult);
    };
  }, []);

  return (
    <div className="bg-white h-full p-4 rounded-md shadow flex flex-col">
      <h1 className="text-[16px] font-semibold mb-4 text-center">
        New Visitor Registration
      </h1>
      <div className="flex flex-col overflow-y-scroll hidden-scrollbar">
        <div className="flex flex-col lg:flex-row lg:gap-4">
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <FiUser />
                Name<span className="text-red-500"> *</span>
              </label>
              <Input
                placeholder="Name"
                className="mb-4"
                name="name"
                value={inputs.name}
                onChange={handleChange}
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <FiPhone />
                Mobile Number<span className="text-red-500"> *</span>
              </label>
              <div className="flex">
                <Input
                  placeholder="Mobile"
                  className="mb-4 focus-visible:ring-0"
                  type="number"
                  name="visitor_contact"
                  value={inputs.visitor_contact}
                  disabled={inputs.mobile_verified}
                  onChange={handleChange}
                />
                {/* {!inputs.mobile_verified ? (
                  <Button
                    variant="outline"
                    className="rounded-l-none text-sm px-2 cursor-pointer"
                    onClick={verifyMobile}
                  >
                    Verify
                  </Button>
                ) : (
                  <div className="h-9 flex items-center justify-center px-2  border border-gray-300 rounded-r-md">
                    <FaRegCheckCircle className="text-green-600" />
                  </div>
                )} */}
              </div>
            </div>
          </div>
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <MdOutlineMailOutline />
                Email
              </label>
              <div className="flex">
                <Input
                  placeholder="email"
                  className="mb-4 focus-visible:ring-0"
                  name="email"
                  disabled={inputs.email_verified}
                  value={inputs.email}
                  onChange={handleChange}
                />
                {/* {!inputs.email_verified ? (
                  <Button
                    variant="outline"
                    className="rounded-l-none text-sm px-2 cursor-pointer"
                    onClick={verifyEmail}
                  >
                    Verify
                  </Button>
                ) : (
                  <div className="h-9 flex items-center justify-center px-2  border border-gray-300 rounded-r-md">
                    <FaRegCheckCircle className="text-green-600" />
                  </div>
                )} */}
              </div>
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <IoLocationOutline />
                Address<span className="text-red-500"> *</span>
              </label>
              <Input
                placeholder="Address"
                className="mb-4"
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
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <FaRegBuilding />
                Visiting Purpose<span className="text-red-500"> *</span>
              </label>
              <Input
                placeholder="Purpose"
                className="mb-4"
                name="purpose"
                value={inputs.purpose}
                onChange={handleChange}
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <GrUserManager />
                Whom to Meet<span className="text-red-500"> *</span>
              </label>

              {employees.length === 0 && (
                <Input
                  placeholder="Whom to Meet"
                  className="mb-4"
                  name="whome_to_meet"
                  value={inputs.whome_to_meet}
                  onChange={handleChange}
                />
              )}

              {employees.length > 0 && (
                <div className="mb-4">
                  <Select
                    onValueChange={(value) => {
                      const selectedEmp = employees.find(
                        (emp) => emp.id.toString() === value,
                      );

                      setInputs({
                        ...inputs,
                        whome_to_meet: selectedEmp.name,
                        designation: selectedEmp.designation,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          inputs.whome_to_meet || "Search & Select Employee"
                        }
                      />
                    </SelectTrigger>

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
                          <SelectItem key={emp.id} value={emp.id.toString()}>
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
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <HiOutlineClipboardDocumentList />
                Document Type<span className="text-red-500"> *</span>
              </label>
              {/* <DocumentTypeSelect
                configDocumentTypes={config?.document_types}
                value={inputs.document_type}
                onChange={(value) =>
                  setInputs((prev) => ({ ...prev, document_type: value }))
                }
              /> */}

              <DocumentTypeSelect
                configDocumentTypes={localConfig?.document_types}
                value={inputs.document_type}
                onChange={(value) =>
                  setInputs((prev) => ({ ...prev, document_type: value }))
                }
                onConfigUpdate={(updatedList) =>
                  handleConfigUpdate("document_types", updatedList)
                }
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <MdOutlineDocumentScanner />
                Document Number
              </label>
              <Input
                placeholder="Document Number"
                className="mb-4"
                name="document_number"
                value={inputs.document_number}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:gap-4">
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <FaCarSide />
                Vehicle Number
              </label>
              <Input
                placeholder="Vehicle Number"
                className="mb-4"
                name="vehicle_number"
                value={inputs.vehicle_number}
                onChange={handleChange}
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <FaRegClock />
                In Time<span className="text-red-500"> *</span>
              </label>
              <div className="flex">
                <Input
                  placeholder="In Time"
                  className="mb-4 rounded-r-none focus-visible:ring-0"
                  type="time"
                  name="in_time"
                  value={inputs.in_time}
                  onChange={handleChange}
                />
                <Button
                  onClick={() => {
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, "0");
                    const minutes = String(now.getMinutes()).padStart(2, "0");
                    setInputs((prev) => ({
                      ...prev,
                      in_time: `${hours}:${minutes}`,
                    }));
                  }}
                  className="rounded-l-none text-sm px-2 cursor-pointer"
                  variant="outline"
                >
                  Now
                </Button>
              </div>
            </div>
          </div>
          <div className="md:flex w-full lg:w-1/2">
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <VscUngroupByRefType />
                Visitor Category<span className="text-red-500"> *</span>
              </label>
              {/* <VisitorCategoryTypeSelect
                configCategoryTypes={config?.visitor_types}
                value={inputs.Visitor_category}
                onChange={(value) =>
                  setInputs((prev) => ({ ...prev, Visitor_category: value }))
                }
              /> */}
              <VisitorCategoryTypeSelect
                configCategoryTypes={localConfig?.visitor_types}
                value={inputs.Visitor_category}
                onChange={(value) =>
                  setInputs((prev) => ({ ...prev, Visitor_category: value }))
                }
                onConfigUpdate={(updatedList) =>
                  handleConfigUpdate("visitor_types", updatedList)
                }
              />
            </div>
            <div className="w-full md:w-full px-1 flex flex-col justify-between">
              <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                <BsShop />
                User Name<span className="text-red-500"> *</span>
              </label>
              <Input
                className="mb-4"
                name="user_name"
                value={user?.user_name}
                disabled
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* City */}
          <div className="flex flex-col">
            <label className="text-sm font-medium flex items-center gap-1">
              <IoLocationOutline />
              City
            </label>

            <Input
              name="city"
              value={inputs.city}
              onChange={handleChange}
              placeholder="City"
            />
          </div>

          {/* Unit Name */}
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
        <div className="flex flex-row gap-4 mt-4">
          <div className="px-1">
            <label className="ms-1 mb-2 text-sm font-medium text-gray-700">
              Visitor Image<span className="text-red-500"> *</span>
            </label>
            <div
              className="mt-2 border border-gray-600 rounded-md h-32 w-32 flex items-center justify-center cursor-pointer"
              onClick={() => {
                setDialogOpen({ ...dialogOpen, visitor: true });
              }}
            >
              {!images.visitor && (
                <div className="flex flex-col items-center p-2">
                  <FaPlus className="text-4xl text-gray-600" />
                  <p className="text-center text-xs mt-1 text-gray-600">
                    Click here to capture
                  </p>
                </div>
              )}
              {images.visitor && (
                <img
                  className="rounded-md"
                  src={images.visitor}
                  alt="visitor"
                />
              )}
            </div>
          </div>
          <div className="px-1">
            <label className="ms-1 mb-2 text-sm font-medium text-gray-700">
              Document Image
            </label>
            <div
              className="mt-2 border border-gray-600 rounded-md h-32 w-32 flex items-center justify-center cursor-pointer"
              onClick={() => {
                setDialogOpen({ ...dialogOpen, document: true });
              }}
            >
              {!images.document && (
                <div className="flex flex-col items-center p-2">
                  <FaPlus className="text-4xl text-gray-600" />
                  <p className="text-center text-xs mt-1 text-gray-600">
                    Click here to capture
                  </p>
                </div>
              )}
              {images.document && (
                <img
                  className="rounded-md"
                  src={images.document}
                  alt="document"
                />
              )}
            </div>
          </div>
          <div className="px-1">
            <div className="flex items-center gap-2">
              <label className="ms-1 text-sm font-medium text-gray-700">
                Fingerprint
              </label>
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  fp.isConnected ? "bg-green-600" : "bg-red-600",
                )}
              />
            </div>
            <div
              className="mt-2 border border-gray-600 rounded-md h-32 w-32 flex items-center justify-center cursor-pointer"
              onClick={() => {
                if (!fp.isConnected) {
                  toast(
                    "error",
                    "Fingerprint device not connected or service not started",
                  );
                  return;
                }

                setDialogOpen({ ...dialogOpen, fingerprint: true });
              }}
            >
              {fp.scanData ? (
                <img
                  src={fingerprintSvg}
                  alt="fingerprint captured"
                  className="h-20 w-20 opacity-80"
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
            {/* Search button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-32 flex items-center gap-1 cursor-pointer text-xs"
              onClick={() => {
                if (!fp.scanData) {
                  toast("error", "Please capture a fingerprint first");
                  return;
                }
                setFp((prev) => ({ ...prev, matchResult: null, error: null }));
                setDialogOpen((prev) => ({ ...prev, fpSearch: true }));
                fpSocket.emit("MATCH", fp.scanData);
              }}
            >
              <FiSearch />
              Search
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center mt-3">
          <Button onClick={handleSubmit} className="cursor-pointer">
            Register
          </Button>
        </div>
      </div>
      <Dialog open={dialogOpen.visitor}>
        <DialogTitle />
        <DialogDescription />
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onPointerDownOutside={() =>
            setDialogOpen({ document: false, visitor: false })
          }
        >
          <Camera
            setImages={setImages}
            setDialogOpen={setDialogOpen}
            name="visitor"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen.document}>
        <DialogTitle />
        <DialogDescription />
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onPointerDownOutside={() =>
            setDialogOpen({ document: false, visitor: false })
          }
        >
          <Camera
            setImages={setImages}
            setDialogOpen={setDialogOpen}
            name="document"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen.email}>
        <DialogTitle />
        <DialogDescription />
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <div className="flex flex-col items-center">
            <p>
              OTP is sent to <b>{inputs.email}</b>
            </p>
            <p className="mb-4">Please enter the otp to verify the email</p>
            <InputOTP
              maxLength={6}
              value={inputs.otp}
              name="otp"
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              onChange={(newVal) =>
                setInputs((prev) => ({ ...prev, otp: newVal }))
              }
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex items-center justify-center mt-4 gap-5">
              <Button
                className="bg-red-600 cursor-pointer hover:bg-red-700"
                onClick={() => {
                  setDialogOpen({ ...dialogOpen, email: false });
                  setInputs((prev) => ({ ...prev, otp: "" }));
                }}
              >
                Cancel
              </Button>
              <Button className="cursor-pointer" onClick={verifyOTP}>
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen.mobile}>
        <DialogTitle />
        <DialogDescription />
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <div className="flex flex-col items-center">
            <p>
              OTP is sent to <b>{inputs.visitor_contact}</b>
            </p>
            <p className="mb-4">
              Please enter the otp to verify the mobile number
            </p>
            <InputOTP
              maxLength={6}
              value={inputs.otp}
              name="otp"
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              onChange={(newVal) =>
                setInputs((prev) => ({ ...prev, otp: newVal }))
              }
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex items-center justify-center mt-4 gap-5">
              <Button
                className="bg-red-600 cursor-pointer hover:bg-red-700"
                onClick={() => {
                  setDialogOpen({ ...dialogOpen, mobile: false });
                  setInputs((prev) => ({ ...prev, otp: "" }));
                }}
              >
                Cancel
              </Button>
              <Button className="cursor-pointer" onClick={verifyMobileOTP}>
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen.fingerprint}>
        <DialogTitle />
        <DialogDescription />
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onPointerDownOutside={() => {
            setDialogOpen((prev) => ({ ...prev, fingerprint: false }));
            setFp((prev) => ({
              ...prev,
              scanning: false,
              scanData: null,
              matchResult: null,
              error: null,
            }));
          }}
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-base font-semibold">Fingerprint Capture</h2>

            {/* Scanner status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  fp.isConnected ? "bg-green-500" : "bg-red-500",
                )}
              />
              <span className="text-xs text-gray-500">
                {fp.isConnected ? "Scanner Ready" : "Scanner Disconnected"}
              </span>
            </div>

            {/* Scan area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl h-40 w-40 flex flex-col items-center justify-center text-gray-400">
              {fp.scanning && (
                <>
                  <svg
                    className="animate-spin h-8 w-8 text-blue-500 mb-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  <p className="text-xs">Place finger on scanner…</p>
                </>
              )}
              {!fp.scanning && fp.scanData && (
                <>
                  <FaRegCheckCircle className="text-green-500 text-4xl mb-1" />
                  <p className="text-xs text-green-600">Fingerprint captured</p>
                </>
              )}
              {!fp.scanning && !fp.scanData && (
                <p className="text-xs text-center px-2">
                  Press &quot;Scan&quot; to capture fingerprint
                </p>
              )}
            </div>

            {/* Error message */}
            {fp.error && <p className="text-xs text-red-500">{fp.error}</p>}

            {/* Match result */}
            {fp.matchResult && (
              <div
                className={cn(
                  "text-xs px-3 py-2 rounded-md w-full text-center",
                  fp.matchResult.matched
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700",
                )}
              >
                {fp.matchResult.matched
                  ? `Matched: ${fp.matchResult.visitor?.name || "Visitor found"}`
                  : "No matching fingerprint found"}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              {fp.scanData && !fp.scanning ? (
                <>
                  {/* Captured — offer Proceed or Recapture */}
                  <Button
                    className="cursor-pointer"
                    onClick={() => {
                      setDialogOpen((prev) => ({
                        ...prev,
                        fingerprint: false,
                      }));
                    }}
                  >
                    Proceed
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      setFp((prev) => ({
                        ...prev,
                        scanning: true,
                        scanData: null,
                        matchResult: null,
                        error: null,
                      }));
                      fpSocket.emit("SCAN");
                    }}
                  >
                    Recapture
                  </Button>
                </>
              ) : (
                <>
                  {/* Not yet captured — offer Scan or Close */}
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    disabled={fp.scanning}
                    onClick={() => {
                      setFp((prev) => ({
                        ...prev,
                        scanning: true,
                        scanData: null,
                        matchResult: null,
                        error: null,
                      }));
                      fpSocket.emit("SCAN");
                    }}
                  >
                    {fp.scanning ? "Scanning…" : "Scan"}
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 cursor-pointer"
                    onClick={() => {
                      setDialogOpen((prev) => ({
                        ...prev,
                        fingerprint: false,
                      }));
                      setFp((prev) => ({
                        ...prev,
                        scanning: false,
                        scanData: null,
                        matchResult: null,
                        error: null,
                      }));
                    }}
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen.fpSearch}>
        <DialogTitle />
        <DialogDescription />
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-sm"
          onPointerDownOutside={() => {
            setDialogOpen((prev) => ({ ...prev, fpSearch: false }));
            setFp((prev) => ({ ...prev, matchResult: null, error: null }));
          }}
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FiSearch />
              Fingerprint Search
            </h2>

            {/* Searching spinner — shown while waiting for MATCH_RESULT */}
            {!fp.matchResult && !fp.error && (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="animate-spin h-10 w-10 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                <p className="text-sm text-gray-500">Searching visitors…</p>
              </div>
            )}

            {/* Error */}
            {fp.error && !fp.matchResult && (
              <p className="text-sm text-red-500 text-center">{fp.error}</p>
            )}

            {/* Match result */}
            {fp.matchResult && (
              <>
                {fp.matchResult.result ? (
                  <div className="w-full flex flex-col items-center gap-3">
                    <FaRegCheckCircle className="text-green-500 text-4xl" />
                    <p className="text-sm font-semibold text-green-700">
                      Visitor Found
                    </p>
                    <div className="w-full bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                      {[
                        {
                          label: "Name",
                          value: fp.matchResult.result.name,
                        },
                        {
                          label: "Mobile",
                          value: fp.matchResult.result.visitor_contact,
                        },
                        {
                          label: "Email",
                          value: fp.matchResult.result.email,
                        },
                        {
                          label: "Address",
                          value: fp.matchResult.result.address,
                        },
                        {
                          label: "City",
                          value: fp.matchResult.result.city,
                        },
                        {
                          label: "Unit",
                          value: fp.matchResult.result.unit,
                        },
                        {
                          label: "Purpose",
                          value: fp.matchResult.result.purpose,
                        },
                        {
                          label: "Whom to Meet",
                          value: fp.matchResult.result.whome_to_meet,
                        },
                        {
                          label: "In Time",
                          value: fp.matchResult.result.in_time,
                        },
                      ]
                        .filter((row) => row.value)
                        .map((row) => (
                          <div
                            key={row.label}
                            className="flex justify-between px-3 py-1.5"
                          >
                            <span className="text-gray-500">{row.label}</span>
                            <span className="font-medium text-right max-w-[55%] break-words">
                              {row.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-500 text-xl font-bold">!</span>
                    </div>
                    <p className="text-sm text-red-600 font-medium">
                      No matching visitor found
                    </p>
                    <p className="text-xs text-gray-400 text-center">
                      This fingerprint does not match any registered visitor.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Buttons */}
            {fp.matchResult?.result ? (
              <div className="flex gap-3 mt-2">
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    const r = fp.matchResult.result;
                    setInputs((prev) => ({
                      ...prev,
                      name: r.name || prev.name,
                      visitor_contact:
                        r.visitor_contact || prev.visitor_contact,
                      visitor_address: r.address || prev.visitor_address,
                      city: r.city || prev.city,
                      email: r.email || prev.email,
                      document_number:
                        r.document_number || prev.document_number,
                    }));
                    if (r.visitor_image) {
                      setImages((prev) => ({
                        ...prev,
                        visitor: imageBaseUrl + r.visitor_image,
                      }));
                    }
                    if (r.document_image) {
                      setImages((prev) => ({
                        ...prev,
                        document: imageBaseUrl + r.document_image,
                      }));
                    }
                    setDialogOpen((prev) => ({ ...prev, fpSearch: false }));
                    setFp((prev) => ({
                      ...prev,
                      matchResult: null,
                      error: null,
                    }));
                  }}
                >
                  OK
                </Button>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    setDialogOpen((prev) => ({ ...prev, fpSearch: false }));
                    setFp((prev) => ({
                      ...prev,
                      matchResult: null,
                      error: null,
                    }));
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                className="bg-red-600 hover:bg-red-700 cursor-pointer mt-2"
                onClick={() => {
                  setDialogOpen((prev) => ({ ...prev, fpSearch: false }));
                  setFp((prev) => ({
                    ...prev,
                    matchResult: null,
                    error: null,
                  }));
                }}
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen.confirm}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogDescription>
            Are you sure you want to continue with the changes?
          </DialogDescription>

          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setDialogOpen((prev) => ({ ...prev, confirm: false }))
              }
            >
              No
            </Button>
            <Button onClick={confirmSubmit}>Yes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewVisitor;

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Camera = ({ setImages, setDialogOpen, name }) => {
    const webcamRef = useRef(null);
    const [image, setImage] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");

    const videoConstraints = {
        width: 640,
        height: 640,
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    };

    const captureImage = () => {
        const screenshot = webcamRef.current?.getScreenshot();
        if (!screenshot) return;

        const img = new Image();
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;

            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

            const cropped = canvas.toDataURL("image/jpeg");
            setImage(cropped);
        };
        img.src = screenshot;
    };

    const proceedHandler = () => {
        setImages((prev) => ({ ...prev, [name]: image }));
        setDialogOpen((prev) => ({ ...prev, [name]: false }));
    };

    useEffect(() => {
        const initCameras = async () => {
            try {
                // Ask for permission first
                await navigator.mediaDevices.getUserMedia({ video: true });

                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = mediaDevices.filter((device) => device.kind === "videoinput");

                setDevices(videoDevices);

                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            } catch (error) {
                console.error("Error accessing cameras:", error);
                setDevices([]);
            }
        };

        initCameras();
    }, []);

    return (
        <div className="w-full">
            {/* Camera Selection */}
            {devices.length > 1 && (
                <div className="mb-4">
                    <Select
                        value={selectedDeviceId}
                        onValueChange={(value) => setSelectedDeviceId(value)}
                    >
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select camera" />
                        </SelectTrigger>
                        <SelectContent>
                            {devices.map((device) => (
                                <SelectItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${device.deviceId}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* No Camera Found */}
            {devices.length === 0 && (
                <div className="text-center text-red-500 font-medium mb-4">
                    No camera found on this device.
                </div>
            )}

            {/* Webcam */}
            {devices.length > 0 && (
                <div className="flex items-center justify-center">
                    {!image && selectedDeviceId && (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="w-[300px] h-[300px] object-cover rounded-xl border border-gray-400"
                        />
                    )}

                    {image && (
                        <img
                            src={image}
                            alt="Captured"
                            className="w-[300px] h-[300px] object-cover rounded-xl border border-gray-400"
                        />
                    )}
                </div>
            )}

            {/* Buttons */}
            {devices.length > 0 && (
                <div className="flex justify-center gap-4 mt-4">
                    {!image && (
                        <Button onClick={captureImage} className="py-2 px-4 cursor-pointer">
                            Capture
                        </Button>
                    )}
                    {image && (
                        <>
                            <Button
                                onClick={() => setImage(null)}
                                className="py-2 px-4 cursor-pointer"
                            >
                                Recapture
                            </Button>
                            <Button onClick={proceedHandler} className="py-2 px-4 cursor-pointer">
                                Proceed
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Camera;

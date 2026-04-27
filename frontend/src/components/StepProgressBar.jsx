import { Check, X } from "lucide-react";

const StepProgress = ({ currentStep = 1, rejected }) => {
    const steps = [
        { id: 1, label: "Register" },
        { id: 2, label: "Pending" },
        { id: 3, label: "Approved" },
        { id: 4, label: "Gate pass" },
    ];

    return (
        <div className="flex items-center justify-center w-full max-w-2xl mx-auto px-4">
            {steps.map((step, index) => {
                const stepNumber = step.id;

                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;
                const isRejected = step.id === 3 && rejected;

                return (
                    <div
                        key={index}
                        className={`flex items-center ${step.id != 4 ? "w-full" : "w-[50%]"}`}
                    >
                        {/* Step Circle */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium border-1
                                            ${
                                                step.id === 3 && isRejected
                                                    ? "bg-red-200 border-red-600 text-white"
                                                    : isCompleted
                                                    ? "bg-green-200 border-green-600 text-white"
                                                    : isActive
                                                    ? "bg-white border-blue-500 text-blue-500"
                                                    : "bg-white border-gray-300 text-gray-400"
                                            }`}
                            >
                                {step.id === 3 && isRejected ? (
                                    <X className="w-5 h-5 text-red-600" />
                                ) : isCompleted ? (
                                    <Check className="w-5 h-5 text-green-600" />
                                ) : (
                                    <span className="text-xs">{step.id}</span>
                                )}
                            </div>
                            <span className="mt-2 text-xs text-center text-gray-700">
                                {step.id === 3 && isRejected ? "Rejected" : step.label}
                            </span>
                        </div>

                        {/* Line */}
                        {index !== steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 -mt-5 ${
                                    currentStep - 1 == stepNumber
                                        ? "bg-blue-500"
                                        : currentStep > stepNumber
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                }`}
                            ></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepProgress;

import { useEffect, useState } from "react";
import { parsePassTime } from "../utils/helperFunctions";

export default function VerticalStepProgress({ data }) {
    const [stepData, setStepData] = useState([]);
    useEffect(() => {
        const temp = JSON.parse(data.gate_details).map((item) => ({
            gate: item[0],
            passTime: item[1] ? parsePassTime(item[1]) : "",
        }));
        temp.unshift({
            gate: "in",
            passTime: parsePassTime(data.in_time),
        });
        if (data.out_time)
            temp.push({
                gate: "out",
                passTime: parsePassTime(data.out_time),
            });
        if (data) {
            setStepData(temp);
        }
    }, [data]);

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
            {stepData.map((step, index) => {
                const isLast = index === stepData.length - 1;
                return (
                    <div
                        key={Math.random() + "" + index}
                        className="flex items-start relative h-[64px]"
                    >
                        {!isLast && (
                            <div className="absolute left-[18px] top-[32px] w-[1px] h-[52px] bg-blue-700" />
                        )}
                        <div className="z-10 mt-1 ms-1 flex">
                            <div
                                className={`border-[1px] ${
                                    step.gate == "in" || step.gate == "out"
                                        ? "border-green-700"
                                        : "border-blue-700"
                                } rounded-full w-[30px] h-[30px] relative ${
                                    step.gate == "in" || step.gate == "out"
                                        ? "bg-green-100"
                                        : "bg-blue-100"
                                }`}
                            >
                                <p
                                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-${
                                        step.gate == "in" || step.gate == "out" ? "green" : "blue"
                                    }-800`}
                                >
                                    {index + 1}
                                </p>
                            </div>
                            <div className="ms-2 text-gray-500 text-sm">
                                {step.gate == "in" || step.gate == "out" ? (
                                    <>
                                        <p className="font-semibold capitalize">
                                            Check {step.gate}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Time:</span>{" "}
                                            {step.passTime}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p>
                                            <span className="font-semibold">Gate no:</span>{" "}
                                            {step.gate}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Pass time:</span>{" "}
                                            {step.passTime}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

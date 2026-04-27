import { useState, useEffect } from "react";

export function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState("lg");

    useEffect(() => {
        function updateSize() {
            if (window.innerWidth < 640) {
                setBreakpoint("sm");
            } else if (window.innerWidth < 1024) {
                setBreakpoint("md");
            } else {
                setBreakpoint("lg");
            }
        }
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    return breakpoint;
}

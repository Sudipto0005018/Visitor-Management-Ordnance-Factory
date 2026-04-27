const Spinner = ({ color = "blue", size = 32 }) => {
    return (
        <div className="flex justify-center items-center">
            <div
                className={`w-[20px] h-[20px] border-[3px] border-${color}-500 border-t-transparent rounded-full animate-spin`}
            />
        </div>
    );
};

export default Spinner;

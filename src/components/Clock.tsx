import { useState, useEffect } from "react";

export default function Clock() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const optionTime: object = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const clock = currentTime.toLocaleTimeString('es-ES', optionTime); 

    const optionsDate: object = { weekday: 'short', day: 'numeric', month: 'long'};
    const dateStr = currentTime.toLocaleDateString('es-ES', optionsDate);

    return (
        <>
            <div className="flex flex-col">
                <span className="text-7xl font-bold">{clock}</span>
                <span className="text-2xl font-bold">{dateStr}</span>
            </div>
        </>
    );
}

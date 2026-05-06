import * as React from "react";
import { cn } from "@/lib/utils";

interface ClockTimePickerProps {
  hour: string;
  minute: string;
  period: "AM" | "PM";
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  onPeriodChange: (period: "AM" | "PM") => void;
  minTime?: { hour: string; minute: string; period: "AM" | "PM" };
}

export function ClockTimePicker({
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  minTime,
}: ClockTimePickerProps) {
  const [view, setView] = React.useState<"hours" | "minutes">("hours");

  const hours = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const to24h = (h: string, m: string, p: string) => {
    let hr = parseInt(h) || 12;
    if (p === "AM" && hr === 12) hr = 0;
    if (p === "PM" && hr !== 12) hr += 12;
    return hr * 60 + (parseInt(m) || 0);
  };

  const isHourAllowed = (h: number) => {
    if (!minTime) return true;
    
    // Convert current selection's period and target hour to 24h, assuming max minutes (59)
    // to see if any time in this hour could be valid
    const targetTime24 = to24h(h.toString(), "59", period);
    const minTime24 = to24h(minTime.hour, minTime.minute, minTime.period);
    
    return targetTime24 >= minTime24;
  };

  const isMinuteAllowed = (m: number) => {
    if (!minTime) return true;
    
    const targetTime24 = to24h(hour, m.toString(), period);
    const minTime24 = to24h(minTime.hour, minTime.minute, minTime.period);
    
    return targetTime24 >= minTime24;
  };

  const isPeriodAllowed = (p: "AM" | "PM") => {
    if (!minTime) return true;
    
    // Check if this period could contain any valid time (max minutes/hours in period)
    const targetTime24 = to24h("11", "59", p);
    const minTime24 = to24h(minTime.hour, minTime.minute, minTime.period);
    
    return targetTime24 >= minTime24;
  };

  const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    
    if (view === "hours") {
      let selectedHour = Math.round((angle / (2 * Math.PI)) * 12);
      if (selectedHour === 0) selectedHour = 12;
      
      if (isHourAllowed(selectedHour)) {
        onHourChange(selectedHour.toString());
        setView("minutes");
      }
    } else {
      let selectedMinute = Math.round((angle / (2 * Math.PI)) * 60);
      if (selectedMinute === 60) selectedMinute = 0;
      
      if (isMinuteAllowed(selectedMinute)) {
        onMinuteChange(selectedMinute.toString().padStart(2, "0"));
      }
    }
  };

  const getHandRotation = () => {
    if (view === "hours") {
      const h = parseInt(hour) || 12;
      return (h % 12) * 30;
    } else {
      const m = parseInt(minute) || 0;
      return m * 6;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2 select-none">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <button
          type="button"
          onClick={() => setView("hours")}
          className={cn(
            "px-2 py-1 rounded transition-colors",
            view === "hours" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {hour.padStart(2, "0")}
        </button>
        <span>:</span>
        <button
          type="button"
          onClick={() => setView("minutes")}
          className={cn(
            "px-2 py-1 rounded transition-colors",
            view === "minutes" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {minute.padStart(2, "0")}
        </button>
        <div className="flex flex-col gap-1 ml-2">
          <button
            type="button"
            disabled={!isPeriodAllowed("AM")}
            onClick={() => onPeriodChange("AM")}
            className={cn(
              "text-xs px-2 py-0.5 rounded border transition-colors",
              period === "AM" ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
              !isPeriodAllowed("AM") && "opacity-30 cursor-not-allowed"
            )}
          >
            AM
          </button>
          <button
            type="button"
            disabled={!isPeriodAllowed("PM")}
            onClick={() => onPeriodChange("PM")}
            className={cn(
              "text-xs px-2 py-0.5 rounded border transition-colors",
              period === "PM" ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
              !isPeriodAllowed("PM") && "opacity-30 cursor-not-allowed"
            )}
          >
            PM
          </button>
        </div>
      </div>

      <div
        className="relative w-56 h-56 rounded-full bg-gray-50/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-800 flex items-center justify-center cursor-pointer shadow-inner"
        onClick={handleClockClick}
      >
        {/* Center dot */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-500 z-10 shadow-sm" />
        
        {/* Clock hand */}
        <div
          className="absolute bottom-1/2 left-1/2 w-0.5 bg-orange-500 origin-bottom transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)"
          style={{
            height: "40%",
            transform: `translateX(-50%) rotate(${getHandRotation()}deg)`,
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-orange-500/20 animate-pulse" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500 shadow-md" />
        </div>

        {/* Numbers */}
        {view === "hours" ? (
          hours.map((h, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const radius = 85;
            const x = Math.sin(angle) * radius;
            const y = -Math.cos(angle) * radius;
            const isActive = parseInt(hour) === h;
            const isAllowed = isHourAllowed(h);
            
            return (
              <div
                key={h}
                className={cn(
                  "absolute text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200",
                  isActive 
                    ? "bg-orange-500 text-white shadow-lg scale-110" 
                    : isAllowed
                      ? "text-gray-500 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400"
                      : "text-gray-200 dark:text-gray-700 cursor-not-allowed"
                )}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {h}
              </div>
            );
          })
        ) : (
          minutes.map((m, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const radius = 85;
            const x = Math.sin(angle) * radius;
            const y = -Math.cos(angle) * radius;
            const isActive = parseInt(minute) === m;
            const isAllowed = isMinuteAllowed(m);

            return (
              <div
                key={m}
                className={cn(
                  "absolute text-xs font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200",
                  isActive 
                    ? "bg-orange-500 text-white shadow-lg scale-110" 
                    : isAllowed
                      ? "text-gray-500 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400"
                      : "text-gray-200 dark:text-gray-700 cursor-not-allowed"
                )}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {m}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

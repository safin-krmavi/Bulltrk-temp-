import React from "react";
import { Button } from "./ui/button";
import { Bell, HelpCircle, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// import { useTheme } from "@/App";
import { useNotifications } from "@/contexts/NotificationContext";

const navDropdowns = [
  {
    label: "Trade",
    options: [
  { label: "Trade", value: "/strategy-builder" },
  { label: "Indy Lesi", value: "/indie-lesi" },
  { label: "Indy Trend", value: "/indie-trend" },
  { label: "Indy UTC", value: "/indy-utc" },
  { label: "Growth Dca", value: "/growth-dca" },
  { label: "Price Action", value: "/price-action" },
  { label: "Human Grid", value: "/human-grid" },
  { label: "Smart Grid", value: "/smart-grid" },
    ],
  },
  {
    label: "Reports",
    options: [
      { label: "Reports", value: "/trading-report" },
      { label: "Scanner", value: "/scanner" },
      { label: "Trends", value: "/trends" },
    ],
  },
  {
    label: "Copy Trade",
    options: [
      { label: "Copy Trade", value: "/copy-trade" },
      { label: "Copy Trade 1", value: "/copy-trade-1" },
      { label: "Copy Trade 2", value: "/copy-trade-2" },
      { label: "Copy Trade 3", value: "/copy-trade-3" },
      { label: "Trader Overview", value: "/trader-overview" },
      { label: "Diverse Follow", value: "/diverse-follow" },
      { label: "Smart Copy", value: "/smart-copy" },
      { label: "Traders Comparison", value: "/traders-comparison" },
    ],
  },
  {
    label: "Market Place",
    options: [
      { label: "Market Place", value: "/market-place" },
      { label: "Pricing", value: "/pricing" },
      { label: "Payment", value: "/payment" },
    ],
  },
];

export const HeaderDropdown: React.FC<{
  label: string;
  options: { label: string; value: string }[];
  navigate: (path: string) => void;
  selectedValue?: string;
  setSelectedValue?: (value: string) => void;
}> = ({ label, options, navigate, selectedValue, setSelectedValue }) => {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = selectedValue
    ? options.find((opt) => opt.value === selectedValue)?.label || label
    : label;
  return (
    <div className="relative" style={{ zIndex: 9999 }}>
      <button
        className="min-w-[90px] px-3 py-1 flex items-center justify-center h-9 rounded-md bg-secondary text-secondary-foreground dark:text-white font-medium text-sm transition-colors border-transparent hover:bg-secondary/80 focus:outline-none focus:ring-1 focus:ring-ring"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        type="button"
      >
        {selectedLabel}
        <ChevronDown className="ml-2 w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-44 rounded-md shadow-xl z-[9999] bg-white/95 dark:bg-[#232326]/95 border border-gray-200 dark:border-[#333] backdrop-blur-md">
          {options.map((option) => (
            <button
              key={option.value}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-secondary/80 focus:bg-secondary/80 transition-colors text-secondary-foreground dark:text-white first:rounded-t-md last:rounded-b-md"
              onMouseDown={() => {
                navigate(option.value);
                setSelectedValue && setSelectedValue(option.value);
              }}
              tabIndex={-1}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTrade, setSelectedTrade] = React.useState<string>("/trade");
  const { hasUnreadNotifications} = useNotifications();

  const handleSelectChange = (path: string) => {
    navigate(path);
  };

  return (
    <header className="border-b border-border bg-background/95 w-full transition-colors duration-300 shadow-sm backdrop-blur-md z-[9998] relative">
      <div className="max-w-[1400px] mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/logo.svg" alt="Builtrek" className="h-8 drop-shadow dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]" />
            <nav className="flex items-center gap-6">
              <Link to="/dashboard" className="text-foreground dark:text-white hover:text-primary transition-colors">Dashboard</Link>
              {navDropdowns.map((dropdown) =>
                dropdown.label === "Trade" ? (
                  <HeaderDropdown
                    key={dropdown.label}
                    label={dropdown.label}
                    options={dropdown.options}
                    navigate={handleSelectChange}
                    selectedValue={selectedTrade}
                    setSelectedValue={setSelectedTrade}
                  />
                ) : (
                  <HeaderDropdown
                    key={dropdown.label}
                    label={dropdown.label}
                    options={dropdown.options}
                    navigate={handleSelectChange}
                  />
                )
              )}
              <Link to="/support" className="text-foreground dark:text-white hover:text-primary transition-colors">Support</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            {/* <ThemeToggleButton /> */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notifications")}
              className="relative"
            >
              <Bell className="h-9 w-9 text-foreground dark:text-white" />
              {hasUnreadNotifications && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/help")}
            >
              <HelpCircle className="h-5 w-5 text-foreground dark:text-white" />
            </Button>
            <div
              className="h-8 w-8 rounded-full bg-muted border border-border cursor-pointer"
              onClick={() => navigate("/account ")}
            />
            <Button
              className="bg-[#4A0D0D] text-white rounded-2xl hover:bg-primary/90 shadow-md dark:text-white dark:bg-[#232326]"
              onClick={() => navigate("/tutorial")}
            >
              Tutorial
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// // Theme toggle button component
// const ThemeToggleButton = () => {
//   const { theme, toggleTheme } = useTheme();
//   return (
//     <button
//       onClick={toggleTheme}
//       className="p-2 rounded-full bg-muted hover:scale-110 transition-transform"
//       aria-label="Toggle theme"
//     >
//       {theme === 'dark' ? (
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-8.66l-.71.71M4.05 4.05l-.71.71M21 12h-1M4 12H3m16.95 7.95l-.71-.71M4.05 19.95l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
//       ) : (
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
//       )}
//     </button>
//   );
// };

export default Header;

import { Mic, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === "/search" ? "search" : "record";

  return (
    <nav className="flex items-center justify-around py-3 bg-base-bg/80 backdrop-blur-sm border-t border-base-border/30">
      <button
        onClick={() => navigate("/")}
        className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
          active === "record" ? "text-base-accent" : "text-base-muted/50"
        }`}
      >
        <Mic className="w-5 h-5" />
        <span className="text-[10px] font-light">录音</span>
      </button>
      <button
        onClick={() => navigate("/search")}
        className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
          active === "search" ? "text-base-accent" : "text-base-muted/50"
        }`}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-light">搜索</span>
      </button>
    </nav>
  );
}

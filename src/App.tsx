import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RecordPage from "@/pages/RecordPage";
import SearchPage from "@/pages/SearchPage";
import BottomNav from "@/components/BottomNav";
import ErrorBoundary from "@/components/ErrorBoundary";

function Layout() {
  return (
    <div className="h-full flex flex-col max-w-md mx-auto">
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

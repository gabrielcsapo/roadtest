import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Docs from "./pages/Docs";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Navigate to="/docs/installation" replace />} />
        <Route path="/docs/:docId" element={<Docs />} />
      </Routes>
    </BrowserRouter>
  );
}

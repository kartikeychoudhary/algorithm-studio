"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar.jsx";

// Root-layout navigation survives lesson route changes.
export default function StudioShell({ children }) {
  const pathname = usePathname();
  const lessonId = pathname?.startsWith("/lessons/")
    ? pathname.split("/")[2]
    : "ttt";
  return (
    <div id="app">
      <Sidebar lessonId={lessonId} />
      {children}
    </div>
  );
}

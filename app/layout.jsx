import "../styles/base.css";
import "../styles/studio.css";
import "../styles/interview.css";
import "../styles/sidebar.css";
import { StudioProvider } from "../components/layout/StudioProvider.jsx";
import StudioShell from "../components/layout/StudioShell.jsx";

export const metadata = {
  title: "Algorithm Studio — Learn by seeing",
  description:
    "Explore minimax, knapsack, graph traversal, and shortest paths with interactive execution traces.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <StudioProvider>
          <StudioShell>{children}</StudioShell>
        </StudioProvider>
      </body>
    </html>
  );
}

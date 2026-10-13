import "../styles/base.css";
import "../styles/studio.css";
import "../styles/interview.css";
import "../styles/sidebar.css";
import "../styles/learning.css";
import "../styles/expansion.css";
import { StudioProvider } from "../components/layout/StudioProvider.jsx";
import StudioShell from "../components/layout/StudioShell.jsx";

export const metadata = {
  title: "Algorithm Studio — Learn by seeing",
  description:
    "Explore algorithms, engineering concepts, system design, and Spring with interactive visual lessons and interview practice.",
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

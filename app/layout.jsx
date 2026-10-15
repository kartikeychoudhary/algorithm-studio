import "../styles/base.css";
import "../styles/studio.css";
import "../styles/interview.css";
import "../styles/sidebar.css";
import "../styles/learning.css";
import "../styles/expansion.css";
import "../styles/llm.css";
import "../styles/systems.css";
import "../styles/guides.css";
import { StudioProvider } from "../components/layout/StudioProvider.jsx";
import StudioShell from "../components/layout/StudioShell.jsx";

export const metadata = {
  title: "Algorithm Studio — Learn by seeing",
  description:
    "Explore algorithms, databases, operating systems, Java, Spring, distributed systems, security, developer tooling, and LLMs through interactive visual lessons.",
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

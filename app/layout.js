import "./globals.css";

export const metadata = {
  title: "eSIM Order Automation PoC",
  description: "Minimal travel eSIM automation proof of concept"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

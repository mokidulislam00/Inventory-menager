import "./globals.css";

export const metadata = {
  title: "Inventory Dashboard",
  description: "Track stock, sales activity and purchase orders",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

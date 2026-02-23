import "./globals.css";
import ThemeProvider from "./components/ThemeProvider";
import OrderProvider from "./components/OrderProvider";

export const metadata = { title: "Pilona Coffee – Harapan Kita" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <OrderProvider>{children}</OrderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
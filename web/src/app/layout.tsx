import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mom's Pizza - Sistema POS",
  description: "Sistema de Punto de Venta para Mom's Pizza. Toma de comandas, gestión de cocina y administración del restaurante.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Toaster theme="dark" richColors position="top-center" duration={2000} closeButton />
      </body>
    </html>
  );
}

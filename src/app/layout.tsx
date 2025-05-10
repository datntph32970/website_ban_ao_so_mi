import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientBody } from "./ClientBody";
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shoes Store Admin Dashboard",
  description: "Admin dashboard for shoes store management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Providers>
          <ClientBody>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#059669',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#059669',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: '#DC2626',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#DC2626',
                  },
                },
              }}
            />
          </ClientBody>
        </Providers>
      </body>
    </html>
  );
}

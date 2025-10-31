// company-website/src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aiconmac Models - Company Portal',
  description: 'Admin panel for Aiconmac Models content management',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
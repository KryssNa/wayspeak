import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/lib/redux/provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WaySpeak - WhatsApp API Platform',
  description: 'Connect and engage with your customers using our powerful WhatsApp API platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <div className="flex min-h-screen flex-col">
           
            <main className="flex-1">{children}</main>
            
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}

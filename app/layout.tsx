import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plinko Game - Provably Fair',
  description: 'An interactive provably-fair Plinko game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


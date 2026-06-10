import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reverso Showcase - Every Field Type',
  description: 'A reference example exercising every Reverso CMS field type end to end.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

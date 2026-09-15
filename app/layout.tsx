import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'RAP Material Control System | PLAN → PURCHASE → RECEIVE → INSTALL',
  description: 'Construction material monitoring and procurement control system: Plan, Purchase, Receive, Install, Monitor, and Report.',
  openGraph: {
    title: 'RAP Material Control System',
    description: 'Construction material monitoring and procurement control system: Plan, Purchase, Receive, Install, Monitor, and Report.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAP Material Control System',
    description: 'Construction material monitoring and procurement control system: Plan, Purchase, Receive, Install, Monitor, and Report.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

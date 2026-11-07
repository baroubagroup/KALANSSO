import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'kalansso os — Le Système d’Exploitation Scolaire Africain',
  description:
    'ERP et suite logicielle tout-en-un pour établissements scolaires : de la crèche au lycée et supérieur. Gestion administrative, caisse & mobile money, bulletins scellés par QR Code.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-bg text-typography-main antialiased selection:bg-nature-200 selection:text-nature-900">
        {children}
      </body>
    </html>
  );
}

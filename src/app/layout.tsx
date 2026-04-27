import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Desafio Empreendedor — Metas',
  description: 'Acompanhamento semanal das turmas do Desafio Empreendedor',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}

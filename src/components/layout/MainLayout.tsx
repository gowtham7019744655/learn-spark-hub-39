import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { FloatingChatWidget } from '@/components/chat/FloatingChatWidget';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <FloatingChatWidget />
    </div>
  );
};

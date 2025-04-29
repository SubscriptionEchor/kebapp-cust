import React, { ReactNode } from 'react';
import { useTelegram } from '../context/TelegramContext';
import Header from './Header';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  title: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  headerRightComponent?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showHeader = true,
  showNavigation = true,
  headerRightComponent,
}) => {
  const { colorScheme, isLoading } = useTelegram();

  const isDarkMode = colorScheme === 'dark';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col`}>
      {showHeader && (
        <Header
          title={title}
          rightComponent={headerRightComponent}
        />
      )}

      <main className="flex-1 container mx-auto px-4 py-4 max-w-none pb-[72px]">
        {children}
      </main>

      {showNavigation && (
        <div className="fixed bottom-0 left-0 right-0">
          <Navigation />
        </div>
      )}
    </div>
  );
};

export default Layout;
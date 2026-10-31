import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ToastProvider } from '@/context/ToastContext';
import ToastContainer from '@/components/ui/ToastContainer';

interface LayoutProps {
  children: ReactNode;
  /** Focus mode hides the header and footer. */
  focus?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, focus = false }) => {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        {!focus && <Header />}
        <main className="flex-1">{children}</main>
        {!focus && <Footer />}
        <ToastContainer />
      </div>
    </ToastProvider>
  );
};

export default Layout;

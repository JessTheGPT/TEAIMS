import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';

const navItems = [
  { label: 'Armory', href: '/' },
  { label: 'Startup', href: '/startup' },
  { label: 'Squad', href: '/squad' },
  { label: 'Crews', href: '/crews' },
  { label: 'Toolbox', href: '/toolbox' },
  { label: 'Prompts', href: '/prompts' },
  { label: 'Builder', href: '/builder' },
  { label: 'Spec', href: '/spec' },
];

const AppNavigation = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-semibold text-foreground text-sm hidden sm:block tracking-tight">Agent Armory</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = item.href === '/' 
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.href);
                
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`
                      relative px-3 py-1.5 text-sm font-medium transition-colors duration-150
                      ${isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded hover:bg-secondary/50 transition-colors"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl md:hidden pt-14">
          <div className="flex flex-col items-center justify-center h-full gap-6">
            {navItems.map((item) => {
              const isActive = item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    text-xl font-medium transition-colors duration-150
                    ${isActive ? 'text-primary' : 'text-foreground hover:text-primary'}
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default AppNavigation;

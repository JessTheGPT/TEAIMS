import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Armory', href: '/' },
  {
    label: 'Crews',
    children: [
      { label: 'Startup Crew', href: '/startup' },
      { label: 'Elite Squad', href: '/squad' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'Toolbox', href: '/toolbox' },
      { label: 'Prompts', href: '/prompts' },
      { label: 'Builder', href: '/builder' },
      { label: 'Spec', href: '/spec' },
    ],
  },
  { label: 'Context', href: '/context' },
  { label: 'Judgement', href: '/judgement' },
];

const AppNavigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const isGroupActive = (children: { href: string }[]) =>
    children.some((c) => isActive(c.href));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-semibold text-foreground text-sm hidden sm:block tracking-tight">Agent Armory</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                if ('children' in item && item.children) {
                  const groupActive = isGroupActive(item.children);
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors duration-150
                          ${groupActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {item.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 pt-1 min-w-[160px]">
                          <div className="bg-popover border border-border rounded-lg shadow-lg py-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                to={child.href}
                                className={`block px-4 py-2 text-sm transition-colors
                                  ${isActive(child.href)
                                    ? 'text-primary bg-primary/5'
                                    : 'text-foreground hover:bg-muted'
                                  }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`relative px-3 py-1.5 text-sm font-medium transition-colors duration-150
                      ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.label}
                    {isActive(item.href) && <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">Sign in</Button>
                </Link>
              )}
            </div>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded hover:bg-secondary/50 transition-colors"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl md:hidden pt-14">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {navItems.map((item) => {
              if ('children' in item && item.children) {
                return (
                  <div key={item.label} className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</span>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`text-lg font-medium ${isActive(child.href) ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`text-xl font-medium ${isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                >
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <button onClick={() => { signOut(); setIsMobileOpen(false); }} className="text-muted-foreground mt-4">
                Sign out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setIsMobileOpen(false)} className="text-primary mt-4">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AppNavigation;

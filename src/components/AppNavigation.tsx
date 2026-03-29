import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  {
    label: 'Personal',
    children: [
      { label: 'Context Files', href: '/context' },
      { label: 'Judgement', href: '/judgement' },
    ],
  },
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

  const userInitial = user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-3 h-3 text-primary" />
              </div>
              <span className="font-semibold text-foreground text-xs hidden sm:block tracking-tight">Agent Armory</span>
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
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors duration-150
                          ${groupActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {item.label}
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 pt-1 min-w-[140px]">
                          <div className="bg-popover border border-border rounded-lg shadow-lg py-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                to={child.href}
                                className={`block px-3 py-1.5 text-xs transition-colors
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
                    className={`relative px-2.5 py-1 text-xs font-medium transition-colors duration-150
                      ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.label}
                    {isActive(item.href) && <span className="absolute bottom-0 left-2.5 right-2.5 h-px bg-primary" />}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-1.5">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar className="h-7 w-7 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2">
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/context" className="text-xs">Context Files</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/judgement" className="text-xs">Judgement Rules</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-xs text-destructive">
                      <LogOut className="w-3 h-3 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">Sign in</Button>
                </Link>
              )}
            </div>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-1.5 rounded hover:bg-secondary/50 transition-colors"
            >
              {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl md:hidden pt-12">
          <div className="flex flex-col items-center justify-center h-full gap-3">
            {navItems.map((item) => {
              if ('children' in item && item.children) {
                return (
                  <div key={item.label} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`text-base font-medium ${isActive(child.href) ? 'text-primary' : 'text-foreground hover:text-primary'}`}
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
                  className={`text-lg font-medium ${isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                >
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <button onClick={() => { signOut(); setIsMobileOpen(false); }} className="text-muted-foreground mt-3 text-sm">
                Sign out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setIsMobileOpen(false)} className="text-primary mt-3 text-sm">
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

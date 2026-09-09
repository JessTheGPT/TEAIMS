import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-7 w-7"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  );
};

export default ThemeToggle;
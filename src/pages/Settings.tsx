import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Eye, EyeOff, Key, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  label: string;
  key: string;
  provider: string;
}

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'google', label: 'Google AI', placeholder: 'AIza...' },
  { id: 'supabase', label: 'Supabase', placeholder: 'eyJ...' },
  { id: 'firecrawl', label: 'Firecrawl', placeholder: 'fc-...' },
  { id: 'telegram', label: 'Telegram Bot', placeholder: '123456:ABC...' },
  { id: 'github', label: 'GitHub', placeholder: 'ghp_...' },
  { id: 'custom', label: 'Custom', placeholder: 'Enter key...' },
];

const Settings = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newProvider, setNewProvider] = useState('openai');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadKeys();
  }, [user]);

  const loadKeys = async () => {
    const { data } = await supabase
      .from('context_files')
      .select('*')
      .eq('user_id', user!.id)
      .eq('category', 'api_keys')
      .order('created_at', { ascending: true });

    if (data) {
      setKeys(data.map(d => {
        try {
          const parsed = JSON.parse(d.content);
          return { id: d.id, label: d.title, key: parsed.key || '', provider: parsed.provider || 'custom' };
        } catch {
          return { id: d.id, label: d.title, key: d.content, provider: 'custom' };
        }
      }));
    }
    setLoading(false);
  };

  const addKey = async () => {
    if (!newKey.trim() || !user) return;
    const label = newLabel.trim() || PROVIDERS.find(p => p.id === newProvider)?.label || newProvider;
    const slug = `api-key-${newProvider}-${Date.now()}`;
    
    const { error } = await supabase.from('context_files').insert({
      user_id: user.id,
      title: label,
      slug,
      category: 'api_keys',
      content: JSON.stringify({ provider: newProvider, key: newKey.trim() }),
    });

    if (error) {
      toast.error('Failed to save key');
      return;
    }
    toast.success(`${label} key saved`);
    setNewKey('');
    setNewLabel('');
    loadKeys();
  };

  const deleteKey = async (id: string) => {
    await supabase.from('context_files').delete().eq('id', id);
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success('Key deleted');
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">API Keys</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Store your API keys securely. These are saved in your private context and never shared.
          </p>

          {/* Existing keys */}
          <div className="space-y-2 mb-6">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : keys.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No API keys stored yet.</p>
            ) : (
              keys.map(k => (
                <Card key={k.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{k.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {k.provider}
                      </span>
                    </div>
                    <code className="text-[11px] text-muted-foreground font-mono mt-0.5 block truncate">
                      {showKey[k.id] ? k.key : maskKey(k.key)}
                    </code>
                  </div>
                  <button
                    onClick={() => setShowKey(prev => ({ ...prev, [k.id]: !prev[k.id] }))}
                    className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground"
                  >
                    {showKey[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>

          {/* Add new key */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Add API Key
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Provider</Label>
                <select
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Label (optional)</Label>
                <Input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder={PROVIDERS.find(p => p.id === newProvider)?.label}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="mb-3">
              <Label className="text-[11px] text-muted-foreground mb-1 block">API Key</Label>
              <Input
                type="password"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder={PROVIDERS.find(p => p.id === newProvider)?.placeholder}
                className="h-9 text-xs font-mono"
              />
            </div>
            <Button onClick={addKey} size="sm" disabled={!newKey.trim()} className="text-xs h-8">
              Save Key
            </Button>
          </Card>
        </div>

        {/* Quick links */}
        <div className="border-t border-border/40 pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Context Files', href: '/context' },
              { label: 'Judgement Rules', href: '/judgement' },
              { label: 'Share Links', href: '/share' },
            ].map(link => (
              <a key={link.href} href={link.href} className="flex items-center gap-2 px-3 py-2 rounded bg-secondary/40 border border-border/30 text-xs text-foreground hover:bg-secondary transition-colors">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

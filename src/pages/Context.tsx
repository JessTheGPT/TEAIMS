import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FileText, Plus, Save, Share2, Eye, Edit3, Trash2, Copy, Check, Loader2, Link, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const CORE_FILES = [
  { slug: 'soul', title: 'Soul.md', description: 'Core identity, values, mission. Who you are at the deepest level.', category: 'core' },
  { slug: 'human', title: 'Human.md', description: 'Your human context — preferences, style, personality traits.', category: 'core' },
  { slug: 'skills', title: 'Skills.md', description: 'Technical and professional capabilities, experience, domain expertise.', category: 'core' },
  { slug: 'judgements', title: 'Judgements.md', description: 'Decision-making framework, heuristics, red lines, trade-off preferences.', category: 'core' },
  { slug: 'communications', title: 'Communications.md', description: 'Communication style, cadence, tone mapping for different contexts.', category: 'extended' },
  { slug: 'delegation', title: 'Delegation.md', description: 'Routing rules — when to delegate, which model, cost vs. confidence matrix.', category: 'extended' },
  { slug: 'thinking', title: 'Thinking.md', description: 'Reasoning patterns, strengths/weaknesses, optimization codex.', category: 'extended' },
];

interface ContextFile {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  description: string | null;
  is_shared: boolean;
  version: number;
  tags: string[];
  updated_at: string;
}

const buildShareUrl = (token: string) => `${window.location.origin}/share/${token}`;

const buildEdgeFunctionUrl = (token: string) => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/agent-context/${token}`;
};

const Context = () => {
  const { user, loading } = useAuth();
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [activeFile, setActiveFile] = useState<ContextFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [aggregateToken, setAggregateToken] = useState<string | null>(null);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    const { data } = await supabase.from('context_files').select('*').order('category').order('title');
    if (data) setFiles(data as unknown as ContextFile[]);
  };

  const initCoreFile = async (template: typeof CORE_FILES[0]) => {
    const { data, error } = await supabase.from('context_files').insert({
      user_id: user!.id,
      slug: template.slug,
      title: template.title,
      content: `# ${template.title}\n\n> ${template.description}\n\n<!-- Start writing below -->\n\n`,
      category: template.category,
      description: template.description,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    const file = data as unknown as ContextFile;
    setFiles(prev => [...prev, file]);
    setActiveFile(file);
    setEditContent(file.content);
    setIsEditing(true);
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setSaving(true);
    const { error } = await supabase.from('context_files')
      .update({ content: editContent, version: activeFile.version + 1 })
      .eq('id', activeFile.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    setActiveFile({ ...activeFile, content: editContent, version: activeFile.version + 1 });
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: editContent, version: f.version + 1 } : f));
    setIsEditing(false);
    setSaving(false);
    toast.success('Saved');
  };

  const toggleShare = async (file: ContextFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { error } = await supabase.from('context_files')
      .update({ is_shared: !file.is_shared })
      .eq('id', file.id);
    if (error) { toast.error(error.message); return; }
    const updated = { ...file, is_shared: !file.is_shared };
    setFiles(prev => prev.map(f => f.id === file.id ? updated : f));
    if (activeFile?.id === file.id) setActiveFile(updated);
    toast.success(file.is_shared ? 'File excluded from sharing' : 'File included in sharing');
  };

  const copyFileLink = async (file: ContextFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Ensure file is shared first
    if (!file.is_shared) {
      await toggleShare(file);
    }
    // Create a file-specific share token
    const { data, error } = await supabase.from('share_tokens').insert({
      resource_type: 'context_file',
      resource_id: file.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    const url = buildShareUrl(data.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('File link copied!');
  };

  const generateAggregateUrl = async () => {
    const { data, error } = await supabase.from('share_tokens').insert({
      resource_type: 'context',
      resource_id: null,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setAggregateToken(data.token);
    await navigator.clipboard.writeText(buildShareUrl(data.token));
    toast.success('Aggregate share link copied!');
  };

  const previewShareLink = (token: string) => {
    window.open(buildShareUrl(token), '_blank');
  };

  const deleteFile = async (file: ContextFile) => {
    const { error } = await supabase.from('context_files').delete().eq('id', file.id);
    if (error) { toast.error(error.message); return; }
    setFiles(prev => prev.filter(f => f.id !== file.id));
    if (activeFile?.id === file.id) setActiveFile(null);
    toast.success('Deleted');
  };

  const createCustomFile = async () => {
    if (!newTitle.trim() || !newSlug.trim()) return;
    const { data, error } = await supabase.from('context_files').insert({
      user_id: user!.id,
      slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
      title: newTitle,
      content: `# ${newTitle}\n\n`,
      category: 'custom',
    }).select().single();
    if (error) { toast.error(error.message); return; }
    const file = data as unknown as ContextFile;
    setFiles(prev => [...prev, file]);
    setShowNewFile(false);
    setNewTitle('');
    setNewSlug('');
    setActiveFile(file);
    setEditContent(file.content);
    setIsEditing(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const existingSlugs = files.map(f => f.slug);
  const uninitialized = CORE_FILES.filter(c => !existingSlugs.includes(c.slug));
  const sharedCount = files.filter(f => f.is_shared).length;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Context Files</h1>
            <p className="text-sm text-muted-foreground mt-1">Your personal agent configuration — identity, skills, judgement, communication style</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewFile(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Custom File
            </Button>
            <Button variant="outline" size="sm" onClick={generateAggregateUrl} className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Share All ({sharedCount})
            </Button>
          </div>
        </div>

        {/* Aggregate share URL */}
        {aggregateToken && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background p-2 rounded border border-border truncate">{buildShareUrl(aggregateToken)}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(buildShareUrl(aggregateToken)); toast.success('Copied'); }}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => previewShareLink(aggregateToken)}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aggregated link — includes all {sharedCount} file{sharedCount !== 1 ? 's' : ''} marked as shared. 
              Use the toggle on each file to include/exclude.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-4 space-y-4">
            {files.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground px-2">Your Files</span>
                {files.map(file => (
                  <div
                    key={file.id}
                    className={`flex items-center rounded-lg transition-colors group
                      ${activeFile?.id === file.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                  >
                    <button
                      onClick={() => { setActiveFile(file); setIsEditing(false); }}
                      className="flex-1 text-left px-3 py-2.5 flex items-center gap-2 min-w-0"
                    >
                      <FileText className={`w-4 h-4 shrink-0 ${activeFile?.id === file.id ? 'text-primary' : ''}`} />
                      <span className={`text-sm font-medium truncate ${activeFile?.id === file.id ? 'text-primary' : 'text-foreground'}`}>
                        {file.title}
                      </span>
                    </button>
                    <div className="flex items-center gap-1 pr-2">
                      {/* Share toggle */}
                      <button
                        onClick={(e) => toggleShare(file, e)}
                        className="p-1 rounded hover:bg-background/50 transition-colors"
                        title={file.is_shared ? 'Included in sharing — click to exclude' : 'Excluded from sharing — click to include'}
                      >
                        {file.is_shared
                          ? <ToggleRight className="w-4 h-4 text-primary" />
                          : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      {/* Copy file link */}
                      <button
                        onClick={(e) => copyFileLink(file, e)}
                        className="p-1 rounded hover:bg-background/50 transition-colors"
                        title="Copy link to this file"
                      >
                        {copiedId === file.id
                          ? <Check className="w-3.5 h-3.5 text-green-500" />
                          : <Link className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <span className="text-[10px] text-muted-foreground ml-1">v{file.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {uninitialized.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground px-2">Available Templates</span>
                {uninitialized.map(template => (
                  <button
                    key={template.slug}
                    onClick={() => initCoreFile(template)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{template.title}</span>
                        <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="col-span-8">
            {activeFile ? (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div>
                    <h2 className="font-semibold text-foreground">{activeFile.title}</h2>
                    {activeFile.description && (
                      <p className="text-xs text-muted-foreground">{activeFile.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={activeFile.is_shared ? 'default' : 'outline'} className="text-[10px] px-2 py-0 cursor-pointer" onClick={() => toggleShare(activeFile)}>
                      {activeFile.is_shared ? 'shared' : 'private'}
                    </Badge>
                    {isEditing ? (
                      <Button size="sm" onClick={saveFile} disabled={saving} className="gap-1.5 ml-2">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { setEditContent(activeFile.content); setIsEditing(true); }}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteFile(activeFile)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 min-h-[500px]">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[500px] font-mono text-sm border-0 resize-none focus-visible:ring-0 p-0 bg-transparent"
                      placeholder="Write your context in markdown..."
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{activeFile.content || '*Empty file — click edit to get started*'}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a file or create one from the templates</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New file dialog */}
      <Dialog open={showNewFile} onOpenChange={setShowNewFile}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Custom Context File</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Title (e.g. Workflows.md)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Input placeholder="Slug (e.g. workflows)" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
            <Button onClick={createCustomFile} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Context;

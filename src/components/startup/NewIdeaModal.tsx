import { useState, useRef } from 'react';
import { Rocket, Upload, X, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface NewIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ideaId: string) => void;
}

interface PendingFile {
  file: File;
  id: string;
}

const MAX_FILE_MB = 10;

const NewIdeaModal = ({ open, onOpenChange, onCreated }: NewIdeaModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setFiles([]);
    setSubmitting(false);
  };

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list).filter(f => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name} exceeds ${MAX_FILE_MB}MB`);
        return false;
      }
      return true;
    }).map(file => ({ file, id: crypto.randomUUID() }));
    setFiles(prev => [...prev, ...arr]);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);

    try {
      // 1. Create idea
      const { data: idea, error: ideaErr } = await supabase
        .from('startup_ideas')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          status: 'active',
          current_phase: 'intake',
          user_id: user.id,
        })
        .select()
        .single();

      if (ideaErr || !idea) throw new Error(ideaErr?.message || 'Failed to create idea');

      // 2. Upload files & extract text
      if (files.length > 0) {
        toast.info(`Uploading ${files.length} file(s) and extracting content...`);
        for (const pf of files) {
          const path = `${user.id}/${idea.id}/${Date.now()}-${pf.file.name}`;
          const { error: upErr } = await supabase.storage
            .from('idea-files')
            .upload(path, pf.file, { upsert: false });
          if (upErr) {
            toast.error(`Upload failed: ${pf.file.name}`);
            continue;
          }

          // Insert source file row first (in case extraction fails)
          const { data: sourceRow } = await supabase.from('idea_source_files').insert({
            idea_id: idea.id,
            user_id: user.id,
            file_name: pf.file.name,
            mime_type: pf.file.type || 'application/octet-stream',
            storage_path: path,
            size_bytes: pf.file.size,
          }).select().single();

          // Extract text via edge function (fire-and-forget update)
          try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            const res = await fetch(
              `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/extract-file-text`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  storage_path: path,
                  mime_type: pf.file.type,
                  file_name: pf.file.name,
                }),
              }
            );
            const data = await res.json();
            if (data.text && sourceRow) {
              await supabase.from('idea_source_files')
                .update({ extracted_text: data.text })
                .eq('id', sourceRow.id);
            }
          } catch (e) {
            console.warn('text extraction failed', e);
          }
        }
      }

      toast.success('Idea created');
      onCreated(idea.id);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create idea');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Rocket className="w-4 h-4 text-primary" />
            New Startup Idea
          </DialogTitle>
          <DialogDescription className="text-xs">
            Give your team everything they need to get started — name, description, and any source material.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Idea Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Acme Analytics for SMB Retail"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Description & Context
            </label>
            <Textarea
              placeholder="Describe the problem, target users, your hypothesis, constraints, source material, links, anything the team should know..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={submitting}
              className="min-h-[140px] text-xs leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              The more context, the sharper the team's first deliverables.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Source Files (optional)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-card/30'}
              `}
            >
              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-foreground font-medium">Drop files or click to browse</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PDF, DOCX, TXT, MD, images — text auto-extracted (max {MAX_FILE_MB}MB each)
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                accept=".pdf,.txt,.md,.csv,.json,.docx,image/*"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map(pf => {
                  const Icon = pf.file.type.startsWith('image/') ? ImageIcon : FileText;
                  return (
                    <div key={pf.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-card/50 border border-border/40">
                      <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="text-[11px] truncate flex-1">{pf.file.name}</span>
                      <span className="text-[9px] text-muted-foreground flex-shrink-0">
                        {(pf.file.size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(pf.id); }}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={submitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || submitting} className="gap-2">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              {submitting ? 'Creating...' : 'Create & Start'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewIdeaModal;

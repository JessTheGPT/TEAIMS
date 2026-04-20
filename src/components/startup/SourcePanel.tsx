import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export interface IdeaSourceFile {
  id: string;
  file_name: string;
  mime_type: string | null;
  storage_path: string;
  size_bytes: number | null;
  extracted_text: string | null;
  created_at: string;
}

interface SourcePanelProps {
  ideaId: string;
  description: string | null;
}

const SourcePanel = ({ ideaId, description }: SourcePanelProps) => {
  const [files, setFiles] = useState<IdeaSourceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFileId, setOpenFileId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('idea_source_files')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at');
      if (!cancelled) {
        setFiles((data as IdeaSourceFile[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ideaId]);

  const downloadFile = async (f: IdeaSourceFile) => {
    const { data } = await supabase.storage.from('idea-files').createSignedUrl(f.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 max-w-3xl mx-auto space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Original Description</h3>
          {description ? (
            <div className="text-xs text-foreground/90 whitespace-pre-wrap bg-card/40 border border-border/40 rounded-lg p-3 leading-relaxed">
              {description}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No description provided.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Source Files {files.length > 0 && <span className="text-muted-foreground font-normal">({files.length})</span>}
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>
          ) : files.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No files uploaded.</p>
          ) : (
            <div className="space-y-2">
              {files.map(f => {
                const Icon = f.mime_type?.startsWith('image/') ? ImageIcon : FileText;
                const isOpen = openFileId === f.id;
                return (
                  <div key={f.id} className="border border-border/40 rounded-lg bg-card/30 overflow-hidden">
                    <div className="flex items-center gap-2 p-2.5">
                      <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <button
                        onClick={() => setOpenFileId(isOpen ? null : f.id)}
                        className="flex-1 text-left text-xs font-medium text-foreground hover:text-primary truncate"
                      >
                        {f.file_name}
                      </button>
                      <span className="text-[10px] text-muted-foreground">
                        {f.size_bytes ? `${(f.size_bytes / 1024).toFixed(0)}KB` : ''}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadFile(f)}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-border/40 p-3 bg-background/40 max-h-72 overflow-y-auto">
                        {f.extracted_text ? (
                          <pre className="text-[11px] whitespace-pre-wrap font-sans text-foreground/85 leading-relaxed">{f.extracted_text}</pre>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">No extracted text available.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourcePanel;

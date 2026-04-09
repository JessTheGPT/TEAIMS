import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Constraint {
  id: string;
  agent_code: string;
  type: string;
  description: string;
  validator_type: string;
  validator_config: Record<string, unknown>;
  severity: string;
  is_active: boolean;
  created_at: string;
}

const AGENT_OPTIONS = [
  { value: '*', label: 'All Agents (Global)' },
  { value: 'chief_of_staff', label: 'Chief of Staff' },
  { value: 'tech_lead', label: 'Tech Lead' },
  { value: 'business_exec', label: 'Business Executive' },
  { value: 'designer', label: 'Lead Designer' },
  { value: 'developer', label: 'Lead Developer' },
  { value: 'competitive_research', label: 'Research Analyst' },
  { value: 'A1_market', label: 'A1 — Market Strategist' },
  { value: 'A2_vision', label: 'A2 — Visionary PM' },
  { value: 'A3_architect', label: 'A3 — Systems Architect' },
  { value: 'A4_ui', label: 'A4 — UI Specialist' },
  { value: 'A5_frontend', label: 'A5 — Frontend Engineer' },
  { value: 'A6_backend', label: 'A6 — Backend Engineer' },
  { value: 'A7_security', label: 'A7 — Security Auditor' },
  { value: 'A8_growth', label: 'A8 — Growth Lead' },
  { value: 'A9_ops', label: 'A9 — SRE/Ops/Legal' },
];

const VALIDATOR_TEMPLATES: Record<string, { label: string; config: Record<string, unknown> }[]> = {
  regex: [
    { label: 'Must mention keyword', config: { pattern: '', mode: 'must_match', flags: 'i' } },
    { label: 'Must NOT mention', config: { pattern: '', mode: 'must_not_match', flags: 'i' } },
  ],
  function: [
    { label: 'Max features count', config: { check: 'max_features', max: 6 } },
    { label: 'Max sprint days', config: { check: 'max_sprint_days', max: 14 } },
    { label: 'Required sections', config: { check: 'has_sections', sections: [] } },
    { label: 'Word count range', config: { check: 'word_count_range', min: 200, max: 5000 } },
  ],
  llm: [
    { label: 'Custom AI check', config: { check: '' } },
  ],
};

const Constraints = () => {
  const { user } = useAuth();
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    agent_code: '*',
    type: 'rule' as string,
    description: '',
    validator_type: 'regex' as string,
    validator_config: '{}',
    severity: 'warn' as string,
  });

  useEffect(() => { if (user) loadConstraints(); }, [user]);

  const loadConstraints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('constraints')
      .select('*')
      .order('created_at', { ascending: false });
    setConstraints((data as Constraint[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ agent_code: '*', type: 'rule', description: '', validator_type: 'regex', validator_config: '{}', severity: 'warn' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!user || !form.description.trim()) return;
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(form.validator_config);
    } catch {
      toast.error('Invalid JSON in validator config');
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('constraints').update({
        agent_code: form.agent_code,
        type: form.type,
        description: form.description,
        validator_type: form.validator_type,
        validator_config: config as any,
        severity: form.severity,
      }).eq('id', editingId);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Constraint updated');
    } else {
      const { error } = await supabase.from('constraints').insert({
        user_id: user.id,
        agent_code: form.agent_code,
        type: form.type,
        description: form.description,
        validator_type: form.validator_type,
        validator_config: config as any,
        severity: form.severity,
      } as any);
      if (error) { toast.error('Failed to create'); return; }
      toast.success('Constraint created');
    }

    resetForm();
    setShowNew(false);
    loadConstraints();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('constraints').update({ is_active: !current }).eq('id', id);
    setConstraints(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
  };

  const deleteConstraint = async (id: string) => {
    await supabase.from('constraints').delete().eq('id', id);
    setConstraints(prev => prev.filter(c => c.id !== id));
    toast.success('Constraint deleted');
  };

  const startEdit = (c: Constraint) => {
    setForm({
      agent_code: c.agent_code,
      type: c.type,
      description: c.description,
      validator_type: c.validator_type,
      validator_config: JSON.stringify(c.validator_config, null, 2),
      severity: c.severity,
    });
    setEditingId(c.id);
    setShowNew(true);
  };

  const applyTemplate = (template: { config: Record<string, unknown> }) => {
    setForm(prev => ({ ...prev, validator_config: JSON.stringify(template.config, null, 2) }));
  };

  const agentLabel = (code: string) => AGENT_OPTIONS.find(a => a.value === code)?.label || code;

  return (
    <div className="min-h-screen bg-background pt-16 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Constraint Engine</h1>
              <p className="text-xs text-muted-foreground">Executable constraints that gate agent output — not prompts, enforcement.</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowNew(true); }} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Constraint
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: constraints.length, color: 'text-foreground' },
            { label: 'Active', value: constraints.filter(c => c.is_active).length, color: 'text-green-500' },
            { label: 'Blocking', value: constraints.filter(c => c.severity === 'block').length, color: 'text-destructive' },
            { label: 'Red Lines', value: constraints.filter(c => c.type === 'red_line').length, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-card/50 border border-border/40 rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Constraints list */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
          ) : constraints.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-xl">
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No constraints yet</p>
              <p className="text-xs text-muted-foreground/60 mb-4">Add constraints to enforce standards on agent outputs</p>
              <Button onClick={() => { resetForm(); setShowNew(true); }} variant="outline" size="sm" className="gap-1.5">
                <Plus className="w-3 h-3" /> Create First Constraint
              </Button>
            </div>
          ) : (
            constraints.map(c => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                  c.is_active
                    ? 'bg-card/60 border-border/40'
                    : 'bg-muted/20 border-border/20 opacity-60'
                }`}
              >
                <button onClick={() => toggleActive(c.id, c.is_active)} className="flex-shrink-0">
                  {c.is_active ? (
                    <ToggleRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">{c.description}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {agentLabel(c.agent_code)}
                    </Badge>
                    <Badge
                      variant={c.type === 'red_line' ? 'destructive' : 'secondary'}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {c.type === 'red_line' ? '🔴 Red Line' : 'Rule'}
                    </Badge>
                    <Badge
                      variant={c.severity === 'block' ? 'destructive' : 'outline'}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {c.severity === 'block' ? '⛔ Block' : '⚠️ Warn'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {c.validator_type}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(c)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteConstraint(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showNew} onOpenChange={(open) => { if (!open) { resetForm(); } setShowNew(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Constraint' : 'New Constraint'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Input
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Lighthouse ≥ 98 on mobile"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Agent</label>
                <Select value={form.agent_code} onValueChange={v => setForm(prev => ({ ...prev, agent_code: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENT_OPTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={form.type} onValueChange={v => setForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red_line">🔴 Red Line</SelectItem>
                    <SelectItem value="rule">📐 Rule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Validator</label>
                <Select value={form.validator_type} onValueChange={v => setForm(prev => ({ ...prev, validator_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regex">Regex Pattern</SelectItem>
                    <SelectItem value="function">Function Check</SelectItem>
                    <SelectItem value="llm">LLM Evaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
                <Select value={form.severity} onValueChange={v => setForm(prev => ({ ...prev, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">⛔ Block (prevents saving)</SelectItem>
                    <SelectItem value="warn">⚠️ Warn (saves with flag)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template shortcuts */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Quick Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {(VALIDATOR_TEMPLATES[form.validator_type] || []).map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(t)}
                    className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Validator Config (JSON)</label>
              <Textarea
                value={form.validator_config}
                onChange={e => setForm(prev => ({ ...prev, validator_config: e.target.value }))}
                className="font-mono text-xs min-h-[100px]"
                placeholder='{"pattern": "Lighthouse.*(9[8-9]|100)", "mode": "must_match"}'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowNew(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.description.trim()}>
              {editingId ? 'Update' : 'Create'} Constraint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Constraints;

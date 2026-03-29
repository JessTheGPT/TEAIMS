import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Scale, Plus, Check, X, Clock, BookOpen, Loader2, ChevronDown, ChevronRight, AlertTriangle, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JudgementEntry {
  id: string;
  agent: string;
  category: string;
  question: string;
  context: string | null;
  options: any[];
  decision: string | null;
  reasoning: string | null;
  confidence_level: string;
  status: string;
  rule_created: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface JudgementRule {
  id: string;
  category: string;
  rule: string;
  examples: any[];
  confidence: string;
  active: boolean;
  times_applied: number;
}

const Judgement = () => {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<JudgementEntry[]>([]);
  const [rules, setRules] = useState<JudgementRule[]>([]);
  const [tab, setTab] = useState<'pending' | 'decided' | 'rules'>('pending');
  const [activeEntry, setActiveEntry] = useState<JudgementEntry | null>(null);
  const [decision, setDecision] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ category: '', rule: '' });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingRule, setEditingRule] = useState<JudgementRule | null>(null);
  const [editRuleText, setEditRuleText] = useState('');
  const [editRuleCategory, setEditRuleCategory] = useState('');
  const [editRuleConfidence, setEditRuleConfidence] = useState('');

  useEffect(() => {
    if (user) { fetchEntries(); fetchRules(); }
  }, [user]);

  const fetchEntries = async () => {
    const { data } = await supabase.from('judgement_entries').select('*').order('created_at', { ascending: false });
    if (data) setEntries(data as unknown as JudgementEntry[]);
  };

  const fetchRules = async () => {
    const { data } = await supabase.from('judgement_rules').select('*').order('category').order('created_at');
    if (data) setRules(data as unknown as JudgementRule[]);
  };

  const makeDecision = async () => {
    if (!activeEntry || !decision.trim()) return;
    const { error } = await supabase.from('judgement_entries')
      .update({ decision, reasoning, status: 'decided', reviewed_at: new Date().toISOString() })
      .eq('id', activeEntry.id);
    if (error) { toast.error(error.message); return; }
    setEntries(prev => prev.map(e => e.id === activeEntry.id
      ? { ...e, decision, reasoning, status: 'decided', reviewed_at: new Date().toISOString() }
      : e
    ));
    setActiveEntry(null);
    setDecision('');
    setReasoning('');
    toast.success('Decision recorded');
  };

  const codifyRule = async (entry: JudgementEntry) => {
    const ruleText = `When facing "${entry.category}" decisions like "${entry.question}", the preference is: ${entry.decision}. Reasoning: ${entry.reasoning || 'N/A'}`;
    const { data, error } = await supabase.from('judgement_rules').insert({
      user_id: user!.id,
      category: entry.category,
      rule: ruleText,
      examples: [{ question: entry.question, decision: entry.decision }],
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from('judgement_entries').update({ rule_created: (data as any).id }).eq('id', entry.id);
    setRules(prev => [...prev, data as unknown as JudgementRule]);
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, rule_created: (data as any).id } : e));
    toast.success('Rule codified');
  };

  const addManualRule = async () => {
    if (!newRule.category.trim() || !newRule.rule.trim()) return;
    const { data, error } = await supabase.from('judgement_rules').insert({
      user_id: user!.id,
      ...newRule,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setRules(prev => [...prev, data as unknown as JudgementRule]);
    setShowAddRule(false);
    setNewRule({ category: '', rule: '' });
    toast.success('Rule added');
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleRuleActive = async (rule: JudgementRule) => {
    const { error } = await supabase.from('judgement_rules').update({ active: !rule.active }).eq('id', rule.id);
    if (error) { toast.error(error.message); return; }
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
    toast.success(rule.active ? 'Rule deactivated' : 'Rule activated');
  };

  const deleteRule = async (ruleId: string) => {
    const { error } = await supabase.from('judgement_rules').delete().eq('id', ruleId);
    if (error) { toast.error(error.message); return; }
    setRules(prev => prev.filter(r => r.id !== ruleId));
    toast.success('Rule deleted');
  };

  const startEditRule = (rule: JudgementRule) => {
    setEditingRule(rule);
    setEditRuleText(rule.rule);
    setEditRuleCategory(rule.category);
    setEditRuleConfidence(rule.confidence);
  };

  const saveEditRule = async () => {
    if (!editingRule || !editRuleText.trim()) return;
    const { error } = await supabase.from('judgement_rules').update({
      rule: editRuleText,
      category: editRuleCategory,
      confidence: editRuleConfidence,
    }).eq('id', editingRule.id);
    if (error) { toast.error(error.message); return; }
    setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, rule: editRuleText, category: editRuleCategory, confidence: editRuleConfidence } : r));
    setEditingRule(null);
    toast.success('Rule updated');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const pending = entries.filter(e => e.status === 'pending');
  const decided = entries.filter(e => e.status === 'decided');
  const ruleCategories = [...new Set(rules.map(r => r.category))];

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" /> Judgement Framework
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Decision log, codified rules, and weekly QA review</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddRule(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
          {[
            { key: 'pending' as const, label: 'Pending', count: pending.length, icon: Clock },
            { key: 'decided' as const, label: 'Decided', count: decided.length, icon: Check },
            { key: 'rules' as const, label: 'Rules', count: rules.length, icon: BookOpen },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <Badge variant={t.key === 'pending' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0 ml-1">
                  {t.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Pending */}
        {tab === 'pending' && (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No pending decisions. Your agents are operating within established rules.</p>
              </Card>
            ) : (
              pending.map(entry => (
                <Card key={entry.id} className="p-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => { setActiveEntry(entry); setDecision(''); setReasoning(''); }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">{entry.category}</Badge>
                      <p className="font-medium text-foreground">{entry.question}</p>
                      {entry.context && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.context}</p>}
                      <p className="text-xs text-muted-foreground mt-2">Agent: {entry.agent} · {new Date(entry.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{entry.confidence_level}</Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Decided */}
        {tab === 'decided' && (
          <div className="space-y-3">
            {decided.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No decisions made yet.</p>
              </Card>
            ) : (
              decided.map(entry => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs mb-2">{entry.category}</Badge>
                      <p className="font-medium text-foreground">{entry.question}</p>
                      <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm font-medium text-primary">Decision: {entry.decision}</p>
                        {entry.reasoning && <p className="text-xs text-muted-foreground mt-1">{entry.reasoning}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Decided: {entry.reviewed_at ? new Date(entry.reviewed_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-3">
                      {!entry.rule_created && (
                        <Button size="sm" variant="outline" onClick={() => codifyRule(entry)} className="gap-1 text-xs">
                          <BookOpen className="w-3 h-3" /> Codify
                        </Button>
                      )}
                      {entry.rule_created && <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20">Rule created</Badge>}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Rules */}
        {tab === 'rules' && (
          <div className="space-y-3">
            {ruleCategories.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No rules codified yet. Make decisions and codify patterns.</p>
              </Card>
            ) : (
              ruleCategories.map(cat => (
                <div key={cat}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors"
                  >
                    {expandedCategories.has(cat) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {cat}
                    <Badge variant="secondary" className="text-[10px]">{rules.filter(r => r.category === cat).length}</Badge>
                  </button>
                  {expandedCategories.has(cat) && (
                    <div className="space-y-2 ml-6 mb-4">
                      {rules.filter(r => r.category === cat).map(rule => (
                        <Card key={rule.id} className="p-3">
                          <p className="text-sm text-foreground">{rule.rule}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{rule.confidence} confidence</Badge>
                            <span className="text-[10px] text-muted-foreground">Applied {rule.times_applied}x</span>
                            <Badge variant={rule.active ? 'default' : 'secondary'} className="text-[10px]">
                              {rule.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <div className="ml-auto flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toggleRuleActive(rule)} title={rule.active ? 'Deactivate' : 'Activate'}>
                                {rule.active ? <ToggleRight className="w-3.5 h-3.5 text-green-500" /> : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditRule(rule)} title="Edit">
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteRule(rule.id)} title="Delete">
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Decision dialog */}
      <Dialog open={!!activeEntry} onOpenChange={() => setActiveEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Make Decision</DialogTitle></DialogHeader>
          {activeEntry && (
            <div className="space-y-4 pt-2">
              <div>
                <Badge variant="outline" className="text-xs mb-2">{activeEntry.category}</Badge>
                <p className="font-medium text-foreground">{activeEntry.question}</p>
                {activeEntry.context && <p className="text-sm text-muted-foreground mt-1">{activeEntry.context}</p>}
              </div>
              {activeEntry.options && (activeEntry.options as any[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Suggested options:</span>
                  {(activeEntry.options as any[]).map((opt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setDecision(typeof opt === 'string' ? opt : opt.label || JSON.stringify(opt))}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors
                        ${decision === (typeof opt === 'string' ? opt : opt.label) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                    >
                      {typeof opt === 'string' ? opt : opt.label || JSON.stringify(opt)}
                    </button>
                  ))}
                </div>
              )}
              <Input
                placeholder="Your decision..."
                value={decision}
                onChange={e => setDecision(e.target.value)}
              />
              <Textarea
                placeholder="Reasoning (optional — helps codify future rules)..."
                value={reasoning}
                onChange={e => setReasoning(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={makeDecision} disabled={!decision.trim()} className="w-full gap-1.5">
                <Check className="w-4 h-4" /> Confirm Decision
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add rule dialog */}
      <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Manual Rule</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Category (e.g. scope, legal, design)" value={newRule.category} onChange={e => setNewRule(p => ({ ...p, category: e.target.value }))} />
            <Textarea placeholder="Rule description..." value={newRule.rule} onChange={e => setNewRule(p => ({ ...p, rule: e.target.value }))} />
            <Button onClick={addManualRule} className="w-full">Add Rule</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit rule dialog */}
      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Rule</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Category" value={editRuleCategory} onChange={e => setEditRuleCategory(e.target.value)} />
            <Textarea placeholder="Rule description..." value={editRuleText} onChange={e => setEditRuleText(e.target.value)} className="min-h-[100px]" />
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(c => (
                <button
                  key={c}
                  onClick={() => setEditRuleConfidence(c)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${editRuleConfidence === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button onClick={saveEditRule} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Judgement;

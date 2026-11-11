import type { ReactNode } from 'react';
import { LockKeyhole, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Item, Plan } from '@/lib/dinner';

export function IngredientControl({ item, plan, open, onOpenChange, onUpdate, children }: { item: Item; plan: Plan; open: boolean; onOpenChange: (open: boolean) => void; onUpdate: (plan: Plan, message?: string) => void; children: ReactNode }) {
  const kept = plan.kept.includes(item.id);
  return <Popover open={open} onOpenChange={onOpenChange}><PopoverTrigger asChild>{children}</PopoverTrigger><PopoverContent className="ingredient-popover" sideOffset={8} collisionPadding={16} aria-label={`${item.name} controls`}>
    <div className="editor-heading"><strong>{item.name}</strong><Button variant="ghost" size="icon" aria-label="Close ingredient controls" title="Close controls" onClick={() => onOpenChange(false)}><X /></Button></div>
    <div className="quantity-control"><label htmlFor={`quantity-${item.id}`}>Quantity</label><Input id={`quantity-${item.id}`} type="number" min="1" step={item.unit === 'g' ? 50 : 1} value={plan.quantities[item.id]} onChange={e => onUpdate({ ...plan, quantities: { ...plan.quantities, [item.id]: Math.max(1, Number(e.target.value)) } })}/><span>{item.unit}</span></div>
    <label className="keep-label"><Checkbox checked={kept} onCheckedChange={checked => onUpdate({ ...plan, kept: checked ? [...plan.kept, item.id] : plan.kept.filter(id => id !== item.id) })}/>Keep this item{kept && <LockKeyhole size={12}/>}</label>
    <Button variant="ghost" className="remove-item" size="sm" aria-label={`Remove ${item.name}`} disabled={kept} title={kept ? 'Unkeep before removing' : 'Remove ingredient'} onClick={() => { onUpdate({ ...plan, quantities: { ...plan.quantities, [item.id]: 0 } }, `${item.name} removed.`); onOpenChange(false); }}><Trash2/>Remove</Button>
  </PopoverContent></Popover>;
}
import type { ReactNode } from 'react';
import { LockKeyhole, MoreHorizontal, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Item, Plan } from '@/lib/dinner';
export function IngredientControl({ item, plan, open, onOpenChange, onUpdate, children, explanation }: { item: Item; plan: Plan; open: boolean; onOpenChange: (open: boolean) => void; onUpdate: (plan: Plan, message?: string) => void; children: ReactNode; explanation?:ReactNode }) {
  const kept = plan.kept.includes(item.id);
  const step = item.unit === 'g' ? 50 : 1;
  const setQuantity = (quantity: number) => onUpdate({...plan,quantities:{...plan.quantities,[item.id]:Math.max(1,quantity)}});
  return <Popover open={open} onOpenChange={onOpenChange}><PopoverTrigger asChild>{children}</PopoverTrigger><PopoverContent className="ingredient-popover" side="right" align="center" sideOffset={10} collisionPadding={16} aria-label={`${item.name} controls`}>
    <div className="compact-quantity"><Button variant="ghost" size="icon" aria-label={`Decrease ${item.name} quantity`} disabled={plan.quantities[item.id]<=1} onClick={()=>setQuantity(plan.quantities[item.id]-step)}><Minus/></Button><Input aria-label="Quantity" type="number" min="1" step={step} value={plan.quantities[item.id]} onChange={e=>setQuantity(Number(e.target.value))}/><span>{item.unit}</span><Button variant="ghost" size="icon" aria-label={`Increase ${item.name} quantity`} onClick={()=>setQuantity(plan.quantities[item.id]+step)}><Plus/></Button></div>
    <div className="compact-editor-bottom"><label className="keep-label"><Checkbox checked={kept} onCheckedChange={checked=>onUpdate({...plan,kept:checked?[...plan.kept,item.id]:plan.kept.filter(id=>id!==item.id)})}/><LockKeyhole size={12}/>Keep</label><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`${item.name} actions`} title="Item actions"><MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled={kept} aria-label={`Remove ${item.name}`} onSelect={()=>{onUpdate({...plan,quantities:{...plan.quantities,[item.id]:0}},`${item.name} removed.`);onOpenChange(false);}}><Trash2/>Remove</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    {explanation}
  </PopoverContent></Popover>;
}

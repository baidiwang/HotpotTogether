import { ArrowRight } from 'lucide-react';
import { packages, quantityLabel, type Item, type Plan } from '@/lib/dinner';
import { money, type Assistant } from './assistant-team';
export function ingredientReason(item:Item,plan:Plan,preview:Plan|null) {
  if(!preview||preview.quantities[item.id]===plan.quantities[item.id])return 'Your planned portion.';
  if(preview.quantities[item.id]===0)return preview.vegetarians===preview.guests?'All guests are vegetarian.':'Not needed in this proposal.';
  if(plan.kept.includes(item.id))return 'Kept in the plan; portions can increase for the group.';
  return item.id==='beef'?`For ${preview.guests-preview.vegetarians} non-vegetarian guests.`:`Portions for ${preview.guests} guests${preview.vegetarians>0&&['tofu','enoki','lotus','bok'].includes(item.id)?`, including ${preview.vegetarians} vegetarian`:''}.`;
}
export function IngredientReadout({item,plan,preview,active}:{item:Item;plan:Plan;preview:Plan|null;active:Assistant|null}) {
  const current=plan.quantities[item.id],next=preview?.quantities[item.id]??current;
  const label=(q:number)=>active==='shopping'?`${packages(q,item)} × ${item.packageSize} ${item.unit} packs`:active==='budget'?money(packages(q,item)*item.price):quantityLabel(q,item);
  return <><span className={`ingredient-qty ${active?`agent-${active}`:''}`}>{next===0&&current>0?<span>Remove</span>:next!==current?<><span>{label(current)}</span><ArrowRight/><span>{label(next)}</span></>:label(current)}</span>{active==='shopping'&&<span className="ingredient-context">{quantityLabel(next,item)} planned · {quantityLabel(packages(next,item)*item.packageSize,item)} purchased</span>}{next===0&&current>0&&<span className="ingredient-context">{ingredientReason(item,plan,preview)}</span>}</>;
}
export function IngredientExplanation({item,plan,preview,active}:{item:Item;plan:Plan;preview:Plan|null;active:Assistant|null}) {
  const next=preview?.quantities[item.id]??plan.quantities[item.id],packs=packages(next,item),purchased=packs*item.packageSize;
  return <div className="ingredient-explanation">{active==='shopping'?<><strong>Package rounding</strong><p>{quantityLabel(next,item)} planned ÷ {item.packageSize} {item.unit} per pack → {packs} whole packs.</p><p>{quantityLabel(purchased,item)} purchased{purchased>next?` · ${quantityLabel(purchased-next,item)} extra`:''}.</p></>:active==='budget'?<><strong>Purchase estimate</strong><p>{packs} packs × {money(item.price)} = {money(packs*item.price)}.</p><p>{quantityLabel(next,item)} planned; charged by whole packs.</p></>:<><strong>Menu’s portion</strong><p>{ingredientReason(item,plan,preview)}</p></>}</div>;
}
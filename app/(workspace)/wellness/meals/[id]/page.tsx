import { notFound } from "next/navigation";
import { getMeal } from "../../../../../lib/fitcircle-data";
import { AddMealItemForm, DeleteMealForm, RemoveMealItemForm, UpdateMealForm, UpdateMealItemForm } from "../../../../components/mutation-forms";
import { LocalDataNote, PageHeader } from "../../../../components/workspace-ui";

export default async function MealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meal = await getMeal(id);
  if (!meal) notFound();
  const totals = meal.meal_items.reduce((sum, item) => ({
    calories: sum.calories + (item.calories ?? 0),
    protein: sum.protein + (item.protein_g ?? 0),
    carbs: sum.carbs + (item.carbs_g ?? 0),
    fat: sum.fat + (item.fat_g ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return <div className="fc-page">
    <PageHeader eyebrow="Private food log" title={`${meal.meal_type[0].toUpperCase()}${meal.meal_type.slice(1)}`} description={new Intl.DateTimeFormat("en-AE", { dateStyle: "full", timeStyle: "short" }).format(new Date(meal.eaten_at))} backHref="/wellness" />
    <LocalDataNote>Nutrient totals use your entered values for the portions shown. They are not a prescribed target.</LocalDataNote>
    <section className="fc-panel"><h2>Food items</h2><div className="fc-meal-items">{meal.meal_items.map((item) => <article key={item.id}><span><strong>{item.name}</strong><small>{item.quantity} {item.unit}</small></span><span>{item.calories ?? 0} kcal · P {item.protein_g ?? 0}g · C {item.carbs_g ?? 0}g · F {item.fat_g ?? 0}g</span><UpdateMealItemForm mealId={meal.id} item={item} /><RemoveMealItemForm mealId={meal.id} itemId={item.id} /></article>)}</div><p className="fc-meal-totals"><strong>Total:</strong> {totals.calories} kcal · protein {totals.protein.toFixed(1)}g · carbs {totals.carbs.toFixed(1)}g · fat {totals.fat.toFixed(1)}g</p></section>
    <section className="fc-panel"><h2>Add another food</h2><AddMealItemForm mealId={meal.id} /></section>
    <section className="fc-panel"><h2>Edit meal details</h2><UpdateMealForm meal={meal} /></section>
    <section className="fc-panel"><h2>Remove meal</h2><DeleteMealForm mealId={meal.id} /></section>
  </div>;
}

import type { CaravanItineraryDay } from "@/features/caravans/types";

export function CaravanItineraryText({ days }: { days: CaravanItineraryDay[] }) {
  if (!days.length) return null;

  return (
    <details className="mt-6 rounded-[18px] border border-leehov-border bg-white px-5 text-leehov-text sm:px-7">
      <summary className="cursor-pointer py-4 font-bold text-leehov-blue-600">Ver roteiro completo em texto</summary>
      <ol className="divide-y divide-leehov-border border-t border-leehov-border">
        {days.map((day, index) => (
          <li key={day.id || `${day.day}-${index}`} className="space-y-2 py-5">
            <h3 className="text-lg font-bold">Dia {day.day} — {day.title}</h3>
            {day.location ? <p className="text-sm font-semibold">{day.location}</p> : null}
            {day.description ? <p className="text-sm leading-6 sm:text-base">{day.description}</p> : null}
            {day.meals.length ? <p className="text-sm">Refeições: {day.meals.join(", ")}</p> : null}
            {day.accommodation ? <p className="text-sm">Hospedagem: {day.accommodation}</p> : null}
          </li>
        ))}
      </ol>
    </details>
  );
}

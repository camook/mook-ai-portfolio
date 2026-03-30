import type { PageServerLoad } from "./$types";

export type StatEntry = {
  id: string;
  section: "tech_stack" | "hero";
  label: string;
  value: string;
  unit: string;
  sort_order: number;
};

export const load: PageServerLoad = async ({ platform }) => {
  const { results } = await platform!.env.DB.prepare(
    "SELECT * FROM stats ORDER BY section ASC, sort_order ASC",
  ).all<Record<string, unknown>>();

  return {
    entries: results.map(
      (r): StatEntry => ({
        id: r.id as string,
        section: r.section as "tech_stack" | "hero",
        label: r.label as string,
        value: r.value as string,
        unit: (r.unit as string) || "",
        sort_order: r.sort_order as number,
      }),
    ),
  };
};

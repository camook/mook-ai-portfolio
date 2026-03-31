import type { PageServerLoad } from "./$types";

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: number; // 0 | 1
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw new Error("Database binding unavailable");

  const { results } = await db.prepare(
    "SELECT * FROM contact_submissions ORDER BY created_at DESC",
  ).all<Record<string, unknown>>();

  return {
    submissions: results.map(
      (r): ContactSubmission => ({
        id: r.id as string,
        name: r.name as string,
        email: r.email as string,
        message: r.message as string,
        created_at: r.created_at as string,
        read: (r.read as number) ?? 0,
      }),
    ),
  };
};

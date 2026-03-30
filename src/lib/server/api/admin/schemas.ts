import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

export const ReorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sort_order: z.number().int() }))
    .min(1),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const ProjectCreateSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  category_tags: z.array(z.string()).default([]),
  description: z.string().min(1),
  long_description: z.string().default(""),
  tech_stack: z.array(z.string()).default([]),
  github_url: z.string().url(),
  live_url: z
    .string()
    .url()
    .nullish()
    .transform((v) => v ?? null),
  thumbnail_key: z.string().min(1),
  key_metric_label: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  key_metric_value: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  card_size: z.enum(["large", "medium", "small"]).default("medium"),
  sort_order: z.number().int().default(0),
  status: z.enum(["published", "draft"]).default("draft"),
  featured: z.boolean().default(false),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export const ImageUploadMetaSchema = z.object({
  alt_text: z.string().default(""),
  caption: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  sort_order: z.number().int().default(0),
});

export const ImageUpdateSchema = z.object({
  alt_text: z.string().default(""),
  caption: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
});

// ─── Experience ───────────────────────────────────────────────────────────────

export const ExperienceCreateSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  year_label: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  role_title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().default(""),
  achievement_label: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  achievement_text: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  sort_order: z.number().int().default(0),
  status: z.enum(["published", "draft"]).default("draft"),
});

export const ExperienceUpdateSchema = ExperienceCreateSchema.partial();

// ─── Tech Stack ───────────────────────────────────────────────────────────────

export const TechStackCreateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["pill", "runtime", "infrastructure"]),
  percentage: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullish()
    .transform((v) => v ?? null),
  qualifier: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  sort_order: z.number().int().default(0),
  status: z.enum(["published", "draft"]).default("draft"),
});

export const TechStackUpdateSchema = TechStackCreateSchema.partial();

// ─── Site Content ─────────────────────────────────────────────────────────────

export const SiteContentUpsertSchema = z.object({
  value: z.string(),
});

// ─── Stats ────────────────────────────────────────────────────────────────────

export const StatsCreateSchema = z.object({
  section: z.enum(["tech_stack", "hero"]),
  label: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().default(""),
  sort_order: z.number().int().default(0),
});

export const StatsUpdateSchema = StatsCreateSchema.partial();

// ─── Inferred types (for use outside the API layer, e.g. admin UI forms) ─────

export type ReorderPayload = z.infer<typeof ReorderSchema>;
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;
export type ExperienceCreate = z.infer<typeof ExperienceCreateSchema>;
export type ExperienceUpdate = z.infer<typeof ExperienceUpdateSchema>;
export type TechStackCreate = z.infer<typeof TechStackCreateSchema>;
export type TechStackUpdate = z.infer<typeof TechStackUpdateSchema>;
export type SiteContentUpsert = z.infer<typeof SiteContentUpsertSchema>;
export type StatsCreate = z.infer<typeof StatsCreateSchema>;
export type StatsUpdate = z.infer<typeof StatsUpdateSchema>;
export type ImageUpdate = z.infer<typeof ImageUpdateSchema>;

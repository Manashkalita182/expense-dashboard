import { z } from 'zod';

export const TransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine(d => !isNaN(Date.parse(d)), { message: "Invalid date format" }),
  category: z.string().min(1, "Category is required"),
  merchant: z.string().nullish(),
  description: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  type: z.string().nullish(),
}).passthrough(); // allows other fields like id

export const GoalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  target: z.number().positive("Target amount must be positive"),
  saved: z.number().min(0, "Saved amount cannot be negative").default(0),
}).passthrough();

export const SettingsSchema = z.object({
  total_budget: z.number().positive("Budget must be positive").optional(),
  monthly_income: z.number().positive("Income must be positive").optional(),
  theme_color: z.string().optional(),
  avatar_url: z.string().optional(),
}).passthrough();

import z from "zod";

export const envSchema = z.object({
    MARKETCHECK_API_KEY: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

// Ensure all required env vars are set

export const env = envSchema.parse(process.env);
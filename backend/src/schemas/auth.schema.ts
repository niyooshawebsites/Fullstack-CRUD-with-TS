import { z } from "zod";

export const registrationSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be atleast 3 characters"),
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
  }),
});

export type RegisterBody = z.infer<typeof registrationSchema>["body"];
export type LoginBody = z.infer<typeof loginSchema>["body"];

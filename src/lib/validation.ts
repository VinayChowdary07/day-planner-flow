import { z } from 'zod';

// Enhanced password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Enhanced email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email must be less than 254 characters')
  .email('Please enter a valid email address')
  .refine(
    (email) => {
      // Additional email validation: check for common invalid patterns
      const invalidPatterns = [
        /^\./,           // Starts with dot
        /\.$/,           // Ends with dot
        /\.\./,          // Contains consecutive dots
        /@\./,           // @ followed by dot
        /\.@/,           // Dot followed by @
      ];
      return !invalidPatterns.some(pattern => pattern.test(email));
    },
    { message: 'Please enter a valid email format' }
  );

// Name validation schema
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(name => name.trim());

// Sign in form validation schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Sign up form validation schema
export const signUpSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema,
  password: passwordSchema
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
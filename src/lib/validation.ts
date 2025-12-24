import { z } from 'zod';

/**
 * Validation schemas for application data
 * Ensures data integrity and prevents invalid inputs
 */

// Grade schema - valid academic grades
export const GradeSchema = z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'O', 'S']);

// Subject validation schema
export const SubjectSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Subject name is required')
    .max(100, 'Subject name must be less than 100 characters'),
  max_internal: z.number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(100, 'Maximum internal marks cannot exceed 100'),
  max_external: z.number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(200, 'Maximum external marks cannot exceed 200'),
  semester: z.number()
    .int('Must be a whole number')
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12'),
});

// Student marks validation schema
export const StudentMarksSchema = z.object({
  student_usn: z.string()
    .trim()
    .min(1, 'Student USN is required')
    .max(20, 'USN cannot exceed 20 characters'),
  subject_id: z.string().uuid('Invalid subject ID'),
  internal_marks: z.number()
    .int('Must be a whole number')
    .min(0, 'Marks cannot be negative'),
  external_marks: z.number()
    .int('Must be a whole number')
    .min(0, 'Marks cannot be negative'),
  grade: GradeSchema.optional(),
});

// Assignment validation schema
export const AssignmentSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  course_code: z.string()
    .trim()
    .min(1, 'Course code is required')
    .max(20, 'Course code must be less than 20 characters'),
  due_date: z.string().datetime({ message: 'Invalid date format' }),
});

// Test validation schema
export const TestSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  duration_minutes: z.number()
    .int('Must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours'),
  total_questions: z.number()
    .int('Must be a whole number')
    .min(1, 'Must have at least 1 question')
    .max(200, 'Cannot exceed 200 questions'),
  max_score: z.number()
    .int('Must be a whole number')
    .min(1, 'Score must be at least 1')
    .max(1000, 'Score cannot exceed 1000'),
});

/**
 * Parse and validate input, returning result with error message if invalid
 */
export const validateInput = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid input' };
};

/**
 * Safely parse a number, returning 0 for invalid values
 */
export const safeParseInt = (value: string | number): number => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : Math.floor(value);
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate marks don't exceed maximum allowed
 */
export const validateMarksRange = (
  marks: number,
  maxMarks: number
): { valid: boolean; message?: string } => {
  if (marks < 0) {
    return { valid: false, message: 'Marks cannot be negative' };
  }
  if (marks > maxMarks) {
    return { valid: false, message: `Marks cannot exceed ${maxMarks}` };
  }
  return { valid: true };
};

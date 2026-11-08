import {z} from 'zod';
export const attemptInput=z.object({id:z.uuid(),activityId:z.string().max(100),answer:z.string().min(1).max(10000),source:z.enum(['typed','speech']),assisted:z.boolean(),mode:z.enum(['practice','exam']),selfReview:z.boolean().default(false)});
export const tutorInput=z.object({message:z.string().min(1).max(2000),source:z.enum(['typed','speech']),model:z.string().max(120).optional(),activityId:z.string().optional(),planOnlyConfirmed:z.literal(true)});
export type AttemptInput=z.infer<typeof attemptInput>;

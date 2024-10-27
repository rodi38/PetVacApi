// import { z } from "zod";
// import { ObjectId } from "mongodb";

// export const vaccineSchema = z.object({
//     name: z.string().min(1).max(100),
//     description: z.string().optional(),
//     pets: z.array(z.instanceof(ObjectId)).default([])
// });

// export type CreateVaccineDto = z.infer<typeof vaccineSchema>;
// export type UpdateVaccineDto = Partial<CreateVaccineDto>;
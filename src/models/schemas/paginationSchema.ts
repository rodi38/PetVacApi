import { z } from "zod";

export const paginationQuerySchema = z.object({
	page: z.coerce.number({ invalid_type_error: "page deve ser um número" }).int("page deve ser um número inteiro").min(1, "page deve ser pelo menos 1").default(1),

	limit: z.coerce.number({ invalid_type_error: "limit deve ser um número" }).int("limit deve ser um número inteiro").min(1, "limit deve ser pelo menos 1").max(100, "limit não pode exceder 100").default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export function toPaginatedResult<T>(items: T[], total: number, { page, limit }: PaginationQuery): PaginatedResult<T> {
	return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

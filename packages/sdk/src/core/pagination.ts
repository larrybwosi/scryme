export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class PaginationHelper {
  static toParams(params: PaginationParams): Record<string, any> {
    return {
      page: params.page || 1,
      limit: params.limit || 10,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      ...params,
    };
  }
}

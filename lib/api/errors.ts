export type ApiError = { code: string; message: string; fields?: Record<string, string[]> };

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError,
  ) {
    super(error.message);
  }
}

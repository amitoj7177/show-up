export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function ok(data: unknown, source: "live" | "snapshot" = "live", status = 200) {
  return Response.json({ data, source, fetchedAt: new Date().toISOString() }, { status });
}

type Handler = (request: Request) => Promise<Response>;

export function route(handler: Handler): Handler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
      }
      console.error(error);
      return Response.json(
        { error: { code: "server_error", message: "Something went wrong on our side. Please try again." } },
        { status: 500 },
      );
    }
  };
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // Fall through to the error below.
  }
  throw new HttpError(400, "bad_request", "We couldn't read that request.");
}

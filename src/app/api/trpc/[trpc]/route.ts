import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const createContext = async (req: NextRequest) => {
    return createTRPCContext({
        headers: req.headers,
    });
};

const handler = async (req: NextRequest) => {
    if (req.method === "OPTIONS") {
        res.headers.delete("transfer-encoding")
        return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }

    const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () => createContext(req),
        onError:
            env.NODE_ENV === "development"
                ? ({ path, error }) => {
                    console.error(
                        `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
                    );
                }
                : undefined,
    });

    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    response.headers.delete("transfer-encoding");
    return response;
};

export { handler as GET, handler as POST, handler as OPTIONS };
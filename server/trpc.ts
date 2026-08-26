import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

export const INTERNAL_ERROR_MESSAGE = "تعذر إتمام الطلب الآن. أعد المحاولة لاحقاً.";

export function clientMessageForTrpcError(code: string, message: string) {
  return code === "INTERNAL_SERVER_ERROR" ? INTERNAL_ERROR_MESSAGE : message;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message: clientMessageForTrpcError(error.code, shape.message),
      data: {
        ...shape.data,
        stack: process.env.NODE_ENV === "production" ? undefined : shape.data.stack,
      },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول أولاً." });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

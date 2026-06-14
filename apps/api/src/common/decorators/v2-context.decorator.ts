import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { V2ApiContext } from "@repo/shared/server";

export const v2Context = createParamDecorator(
  (data: keyof V2ApiContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const context = request.v2Context as V2ApiContext;

    return data ? context?.[data] : context;
  },
);

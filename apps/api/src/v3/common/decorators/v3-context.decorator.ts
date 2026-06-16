import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { V3ApiContext } from '@repo/shared/api/v2/types';

export const v3Context = createParamDecorator(
  (data: keyof V3ApiContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const context = request.v3Context as V3ApiContext;

    return data ? context?.[data] : context;
  },
);

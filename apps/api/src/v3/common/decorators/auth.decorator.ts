import { SetMetadata } from "@nestjs/common";

export const ALLOW_PUBLIC_KEY = "allowPublic";
export const AllowPublic = () => SetMetadata(ALLOW_PUBLIC_KEY, true);

export const SCOPES_KEY = "scopes";
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);

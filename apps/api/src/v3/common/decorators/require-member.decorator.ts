import { SetMetadata } from "@nestjs/common";

export const REQUIRE_MEMBER_KEY = "require_member";
export const RequireMember = () => SetMetadata(REQUIRE_MEMBER_KEY, true);

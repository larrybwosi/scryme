-- Step 1: Update existing records to avoid enum violations
UPDATE "user" SET "role" = 'MEMBER' WHERE "role" = 'CUSTOMER';
UPDATE "member" SET "role" = 'EMPLOYEE' WHERE "role" = 'CUSTOMER';

-- Step 2: Recreate UserRole enum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'CLIENT', 'MEMBER');
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
DROP TYPE "UserRole_old";

-- Step 3: Recreate MemberRole enum
ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'CASHIER', 'REPORTER', 'GUEST');
ALTER TABLE "member" ALTER COLUMN "role" TYPE "MemberRole" USING ("role"::text::"MemberRole");
DROP TYPE "MemberRole_old";

-- Step 1: Update existing records to avoid enum violations
UPDATE "user" SET "role" = 'MEMBER' WHERE "role" = 'CUSTOMER';
UPDATE "member" SET "role" = 'EMPLOYEE' WHERE "role" = 'CUSTOMER';

-- Step 2: Recreate UserRole enum safely
DO $$
BEGIN
    -- 2a. Drop default constraint referring to UserRole
    ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

    -- 2b. Rename old UserRole enum if it exists and UserRole_old does not exist
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole_old') THEN
        ALTER TYPE "UserRole" RENAME TO "UserRole_old";
    END IF;

    -- 2c. Create new UserRole enum if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'CLIENT', 'MEMBER');
    END IF;

    -- 2d. Alter column type
    ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");

    -- 2e. Restore default constraint
    ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"UserRole";

    -- 2f. Drop old UserRole enum if exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole_old') THEN
        DROP TYPE "UserRole_old";
    END IF;
END $$;

-- Step 3: Recreate MemberRole enum safely
DO $$
BEGIN
    -- 3a. Rename old MemberRole enum if MemberRole_old does not exist
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberRole') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberRole_old') THEN
        ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";
    END IF;

    -- 3b. Create new MemberRole enum if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberRole') THEN
        CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'CASHIER', 'REPORTER', 'GUEST');
    END IF;

    -- 3c. Alter "member" table "role" column
    ALTER TABLE "member" ALTER COLUMN "role" TYPE "MemberRole" USING ("role"::text::"MemberRole");

    -- 3d. Alter "invitation" table "role" column
    ALTER TABLE "invitation" ALTER COLUMN "role" TYPE "MemberRole" USING ("role"::text::"MemberRole");

    -- 3e. Alter "ApprovalStepAction" table "approverRole" column
    ALTER TABLE "ApprovalStepAction" ALTER COLUMN "approverRole" TYPE "MemberRole" USING ("approverRole"::text::"MemberRole");

    -- 3f. Alter "report_channels" table "allowedRoles" array column
    ALTER TABLE "report_channels" ALTER COLUMN "allowedRoles" TYPE "MemberRole"[] USING ("allowedRoles"::text[]::"MemberRole"[]);

    -- 3g. Drop old MemberRole enum if exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberRole_old') THEN
        DROP TYPE "MemberRole_old";
    END IF;
END $$;

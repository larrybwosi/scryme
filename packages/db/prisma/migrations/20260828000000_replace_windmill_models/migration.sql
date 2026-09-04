-- DropForeignKey
ALTER TABLE "windmill_configuration" DROP CONSTRAINT IF EXISTS "windmill_configuration_organizationId_fkey";
ALTER TABLE "windmill_workflow" DROP CONSTRAINT IF EXISTS "windmill_workflow_configId_fkey";
ALTER TABLE "windmill_execution" DROP CONSTRAINT IF EXISTS "windmill_execution_organizationId_fkey";
ALTER TABLE "windmill_execution" DROP CONSTRAINT IF EXISTS "windmill_execution_configId_fkey";

-- DropTable
DROP TABLE IF EXISTS "windmill_execution";
DROP TABLE IF EXISTS "windmill_workflow";
DROP TABLE IF EXISTS "windmill_configuration";

-- DropEnum if any legacy enum exists
DROP TYPE IF EXISTS "WindmillExecutionStatus";

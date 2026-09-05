CREATE TYPE "BookingAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "ScheduleOverrideType" AS ENUM ('WORKING', 'UNAVAILABLE', 'LEAVE', 'BLACKOUT');
CREATE TYPE "BookingEventSource" AS ENUM ('ADMIN', 'PUBLIC', 'SCRYME', 'SYSTEM');

ALTER TABLE "service_booking" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "booking_staff" ADD COLUMN "status" "BookingAssignmentStatus" NOT NULL DEFAULT 'PENDING', ADD COLUMN "respondedAt" TIMESTAMP(3), ADD COLUMN "responseReason" TEXT;
ALTER TABLE "staff_shift" ADD COLUMN "locationId" TEXT, ADD COLUMN "effectiveFrom" TIMESTAMP(3), ADD COLUMN "effectiveUntil" TIMESTAMP(3);
ALTER TABLE "organization_settings" ADD COLUMN "bookingReminderMinutes" INTEGER[] NOT NULL DEFAULT ARRAY[1440, 120]::INTEGER[], ADD COLUMN "bookingAssignmentTimeoutMinutes" INTEGER NOT NULL DEFAULT 30, ADD COLUMN "bookingEscalationEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "staff_schedule_override" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "locationId" TEXT,
  "type" "ScheduleOverrideType" NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_schedule_override_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_event" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "source" "BookingEventSource" NOT NULL,
  "type" TEXT NOT NULL,
  "actorMemberId" TEXT,
  "fromStatus" "BookingStatus",
  "toStatus" "BookingStatus",
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_booking_organizationId_scheduledStartTime_status_idx" ON "service_booking"("organizationId", "scheduledStartTime", "status");
CREATE INDEX "service_booking_locationId_scheduledStartTime_idx" ON "service_booking"("locationId", "scheduledStartTime");
CREATE INDEX "booking_staff_memberId_status_idx" ON "booking_staff"("memberId", "status");
CREATE INDEX "staff_shift_organizationId_dayOfWeek_isActive_idx" ON "staff_shift"("organizationId", "dayOfWeek", "isActive");
CREATE INDEX "staff_shift_memberId_effectiveFrom_effectiveUntil_idx" ON "staff_shift"("memberId", "effectiveFrom", "effectiveUntil");
CREATE INDEX "staff_schedule_override_organizationId_startTime_endTime_idx" ON "staff_schedule_override"("organizationId", "startTime", "endTime");
CREATE INDEX "staff_schedule_override_memberId_startTime_endTime_idx" ON "staff_schedule_override"("memberId", "startTime", "endTime");
CREATE INDEX "booking_event_organizationId_createdAt_idx" ON "booking_event"("organizationId", "createdAt");
CREATE INDEX "booking_event_bookingId_createdAt_idx" ON "booking_event"("bookingId", "createdAt");

ALTER TABLE "staff_schedule_override" ADD CONSTRAINT "staff_schedule_override_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_schedule_override" ADD CONSTRAINT "staff_schedule_override_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_event" ADD CONSTRAINT "booking_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_event" ADD CONSTRAINT "booking_event_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

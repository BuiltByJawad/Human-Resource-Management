/*
  Warnings:

  - Added the required column `organizationId` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `ReviewCycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable (add nullable first; backfill; then enforce NOT NULL)
ALTER TABLE "PerformanceReview" ADD COLUMN     "organizationId" TEXT;

-- AlterTable (add nullable first; backfill; then enforce NOT NULL)
ALTER TABLE "ReviewCycle" ADD COLUMN     "organizationId" TEXT;

-- DropForeignKey (idempotent)
ALTER TABLE "ReviewCycle" DROP CONSTRAINT IF EXISTS "ReviewCycle_organizationId_fkey";

-- DropForeignKey (idempotent)
ALTER TABLE "PerformanceReview" DROP CONSTRAINT IF EXISTS "PerformanceReview_organizationId_fkey";

DO $$
DECLARE org_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM "Organization";

  -- Shadow DB / empty install: allow no-op only if there is no data to backfill.
  IF org_count = 0 THEN
    IF EXISTS (SELECT 1 FROM "PerformanceReview") OR EXISTS (SELECT 1 FROM "ReviewCycle") THEN
      RAISE EXCEPTION 'Cannot backfill performance tenant ownership: 0 Organizations exist but performance rows exist.';
    END IF;
    RETURN;
  END IF;

  -- Backfill PerformanceReview.organizationId from Employee.organizationId
  IF EXISTS (
    SELECT 1
    FROM "PerformanceReview" pr
    JOIN "Employee" e ON e.id = pr."employeeId"
    JOIN "Employee" r ON r.id = pr."reviewerId"
    WHERE pr."organizationId" IS NULL
      AND (e."organizationId" IS NULL OR r."organizationId" IS NULL OR e."organizationId" <> r."organizationId")
  ) THEN
    RAISE EXCEPTION 'Cannot backfill PerformanceReview.organizationId: employee/reviewer org missing or mismatch.';
  END IF;

  UPDATE "PerformanceReview" pr
  SET "organizationId" = e."organizationId"
  FROM "Employee" e
  WHERE pr."employeeId" = e.id
    AND pr."organizationId" IS NULL;

  IF EXISTS (SELECT 1 FROM "PerformanceReview" WHERE "organizationId" IS NULL) THEN
    RAISE EXCEPTION 'PerformanceReview.organizationId backfill incomplete: NULLs remain.';
  END IF;

  -- Backfill ReviewCycle.organizationId from linked reviews
  -- If there are cycles with no reviews:
  -- - if exactly 1 organization exists, assign them to that org
  -- - otherwise abort (cannot infer tenant ownership)
  IF EXISTS (
    SELECT 1
    FROM "ReviewCycle" c
    WHERE c."organizationId" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "PerformanceReview" pr WHERE pr."cycleId" = c.id)
  ) THEN
    IF org_count = 1 THEN
      UPDATE "ReviewCycle" c
      SET "organizationId" = (SELECT id FROM "Organization" LIMIT 1)
      WHERE c."organizationId" IS NULL
        AND NOT EXISTS (SELECT 1 FROM "PerformanceReview" pr WHERE pr."cycleId" = c.id);
    ELSE
      RAISE EXCEPTION 'Cannot backfill ReviewCycle.organizationId: found cycles with no reviews in a multi-tenant DB.';
    END IF;
  END IF;

  -- Ensure each cycle maps to exactly one organization via its reviews
  IF EXISTS (
    WITH inferred AS (
      SELECT
        c.id AS cycle_id,
        MIN(pr."organizationId") AS org_id,
        COUNT(DISTINCT pr."organizationId") AS org_cnt
      FROM "ReviewCycle" c
      JOIN "PerformanceReview" pr ON pr."cycleId" = c.id
      WHERE c."organizationId" IS NULL
      GROUP BY c.id
    )
    SELECT 1 FROM inferred WHERE org_id IS NULL OR org_cnt <> 1
  ) THEN
    RAISE EXCEPTION 'Cannot backfill ReviewCycle.organizationId: ambiguous tenant mapping (multiple orgs found via reviews).';
  END IF;

  UPDATE "ReviewCycle" c
  SET "organizationId" = inferred.org_id
  FROM (
    SELECT
      c2.id AS cycle_id,
      MIN(pr2."organizationId") AS org_id
    FROM "ReviewCycle" c2
    JOIN "PerformanceReview" pr2 ON pr2."cycleId" = c2.id
    WHERE c2."organizationId" IS NULL
    GROUP BY c2.id
  ) AS inferred
  WHERE c.id = inferred.cycle_id AND c."organizationId" IS NULL;

  IF EXISTS (SELECT 1 FROM "ReviewCycle" WHERE "organizationId" IS NULL) THEN
    RAISE EXCEPTION 'ReviewCycle.organizationId backfill incomplete: NULLs remain.';
  END IF;
END $$;

-- Make columns required
ALTER TABLE "ReviewCycle" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "PerformanceReview" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "PerformanceReview_organizationId_idx" ON "PerformanceReview"("organizationId");

-- CreateIndex
CREATE INDEX "ReviewCycle_organizationId_idx" ON "ReviewCycle"("organizationId");

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

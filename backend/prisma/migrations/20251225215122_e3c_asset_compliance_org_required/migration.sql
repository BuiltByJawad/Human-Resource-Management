/*
  Warnings:

  - Made the column `organizationId` on table `Asset` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `ComplianceRule` required. This step will fail if there are existing NULL values in that column.

 */
-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ComplianceRule" DROP CONSTRAINT IF EXISTS "ComplianceRule_organizationId_fkey";

DO $$
DECLARE org_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM "Organization";
  -- Shadow DB / empty install: allow no-op as long as there is no data to backfill.
  IF org_count = 0 THEN
    IF EXISTS (SELECT 1 FROM "Asset" WHERE "organizationId" IS NULL)
      OR EXISTS (SELECT 1 FROM "ComplianceRule" WHERE "organizationId" IS NULL) THEN
      RAISE EXCEPTION 'Cannot backfill tenant ownership: 0 Organizations exist but tenant-owned rows exist.';
    END IF;
    RETURN;
  END IF;

  -- Backfill Asset.organizationId from AssetAssignment -> Employee.organizationId
  IF EXISTS (
    SELECT 1
    FROM "Asset" a
    WHERE a."organizationId" IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM "AssetAssignment" aa WHERE aa."assetId" = a.id
      )
  ) THEN
    RAISE EXCEPTION 'Cannot backfill Asset.organizationId: found unassigned Assets with NULL organizationId.';
  END IF;

  IF EXISTS (
    WITH inferred AS (
      SELECT
        a.id AS asset_id,
        MIN(e."organizationId") AS org_id,
        COUNT(DISTINCT e."organizationId") AS org_cnt
      FROM "Asset" a
      JOIN "AssetAssignment" aa ON aa."assetId" = a.id
      JOIN "Employee" e ON e.id = aa."employeeId"
      WHERE a."organizationId" IS NULL
      GROUP BY a.id
    )
    SELECT 1 FROM inferred WHERE org_id IS NULL OR org_cnt <> 1
  ) THEN
    RAISE EXCEPTION 'Cannot backfill Asset.organizationId: ambiguous tenant mapping (missing or multiple organizations found via assignments).';
  END IF;

  UPDATE "Asset" a
  SET "organizationId" = inferred.org_id
  FROM (
    SELECT
      a2.id AS asset_id,
      MIN(e2."organizationId") AS org_id
    FROM "Asset" a2
    JOIN "AssetAssignment" aa2 ON aa2."assetId" = a2.id
    JOIN "Employee" e2 ON e2.id = aa2."employeeId"
    WHERE a2."organizationId" IS NULL
    GROUP BY a2.id
  ) AS inferred
  WHERE a.id = inferred.asset_id AND a."organizationId" IS NULL;

  -- Backfill ComplianceRule.organizationId from ComplianceLog -> Employee.organizationId
  IF EXISTS (
    SELECT 1
    FROM "ComplianceRule" r
    WHERE r."organizationId" IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM "ComplianceLog" cl WHERE cl."ruleId" = r.id
      )
  ) THEN
    RAISE EXCEPTION 'Cannot backfill ComplianceRule.organizationId: found ComplianceRules with NULL organizationId and no logs to infer from.';
  END IF;

  IF EXISTS (
    WITH inferred AS (
      SELECT
        r.id AS rule_id,
        MIN(e."organizationId") AS org_id,
        COUNT(DISTINCT e."organizationId") AS org_cnt
      FROM "ComplianceRule" r
      JOIN "ComplianceLog" cl ON cl."ruleId" = r.id
      JOIN "Employee" e ON e.id = cl."employeeId"
      WHERE r."organizationId" IS NULL
      GROUP BY r.id
    )
    SELECT 1 FROM inferred WHERE org_id IS NULL OR org_cnt <> 1
  ) THEN
    RAISE EXCEPTION 'Cannot backfill ComplianceRule.organizationId: ambiguous tenant mapping (missing or multiple organizations found via logs).';
  END IF;

  UPDATE "ComplianceRule" r
  SET "organizationId" = inferred.org_id
  FROM (
    SELECT
      r2.id AS rule_id,
      MIN(e2."organizationId") AS org_id
    FROM "ComplianceRule" r2
    JOIN "ComplianceLog" cl2 ON cl2."ruleId" = r2.id
    JOIN "Employee" e2 ON e2.id = cl2."employeeId"
    WHERE r2."organizationId" IS NULL
    GROUP BY r2.id
  ) AS inferred
  WHERE r.id = inferred.rule_id AND r."organizationId" IS NULL;

  -- Final safety check
  IF EXISTS (SELECT 1 FROM "Asset" WHERE "organizationId" IS NULL) THEN
    RAISE EXCEPTION 'Asset.organizationId backfill incomplete: NULLs remain.';
  END IF;
  IF EXISTS (SELECT 1 FROM "ComplianceRule" WHERE "organizationId" IS NULL) THEN
    RAISE EXCEPTION 'ComplianceRule.organizationId backfill incomplete: NULLs remain.';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ComplianceRule" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ComplianceRule" ADD CONSTRAINT "ComplianceRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

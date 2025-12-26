const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const orgs = await prisma.organization.count()
  const assetNulls = await prisma.asset.count({ where: { organizationId: null } })
  const ruleNulls = await prisma.complianceRule.count({ where: { organizationId: null } })

  const cols = await prisma.$queryRawUnsafe(
    "SELECT table_name, column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('Asset','ComplianceRule') AND column_name = 'organizationId' ORDER BY table_name;"
  )

  const fks = await prisma.$queryRawUnsafe(
    "SELECT conname FROM pg_constraint WHERE conname IN ('Asset_organizationId_fkey','ComplianceRule_organizationId_fkey') ORDER BY conname;"
  )

  const assetDetails = await prisma.$queryRawUnsafe(
    'SELECT a.id, a."serialNumber" AS serial_number, COUNT(aa.id) AS assignment_count, COUNT(DISTINCT e."organizationId") AS inferred_org_count, MIN(e."organizationId") AS inferred_org_id ' +
      'FROM "Asset" a ' +
      'LEFT JOIN "AssetAssignment" aa ON aa."assetId" = a.id ' +
      'LEFT JOIN "Employee" e ON e.id = aa."employeeId" ' +
      'WHERE a."organizationId" IS NULL ' +
      'GROUP BY a.id, a."serialNumber" ' +
      'ORDER BY a."serialNumber";'
  )

  const ruleDetails = await prisma.$queryRawUnsafe(
    'SELECT r.id, r.name, COUNT(cl.id) AS log_count, COUNT(DISTINCT e."organizationId") AS inferred_org_count, MIN(e."organizationId") AS inferred_org_id ' +
      'FROM "ComplianceRule" r ' +
      'LEFT JOIN "ComplianceLog" cl ON cl."ruleId" = r.id ' +
      'LEFT JOIN "Employee" e ON e.id = cl."employeeId" ' +
      'WHERE r."organizationId" IS NULL ' +
      'GROUP BY r.id, r.name ' +
      'ORDER BY r.name;'
  )

  const mig = await prisma.$queryRawUnsafe(
    "SELECT migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations WHERE migration_name = '20251225215122_e3c_asset_compliance_org_required';"
  )

  const payload = {
    orgs,
    assetNulls,
    ruleNulls,
    cols,
    fks,
    mig,
    assetDetails,
    ruleDetails,
  }

  console.log(
    JSON.stringify(
      payload,
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

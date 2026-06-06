import { createPrismaClient, parseFlags } from "./template-ops-utils.mjs";

const { flags, positional } = parseFlags(process.argv.slice(2));
const componentKey = positional[0];
const detailSlot = flags.slot;
const publicTabKey = flags.tab;
const navLabel = flags.nav;
const anchorId = flags.anchor;
const order = flags.order === undefined ? null : Number(flags.order);

if (!componentKey || (!detailSlot && !publicTabKey && !navLabel && !anchorId && order === null)) {
  console.error(
    "Usage: npm run template:move-component -- <componentKey> --slot <slot> --tab <tab> --order <number>",
  );
  process.exit(1);
}

if (order !== null && !Number.isInteger(order)) {
  console.error("--order must be an integer.");
  process.exit(1);
}

const db = createPrismaClient();

try {
  const component = await db.villageComponentCatalog.findUnique({
    where: { componentKey },
    select: { id: true, componentKey: true, label: true },
  });

  if (!component) {
    throw new Error(`Component ${componentKey} is not registered in VillageComponentCatalog.`);
  }

  await db.$transaction(async (tx) => {
    await tx.villageComponentCatalog.update({
      where: { componentKey },
      data: {
        ...(detailSlot ? { detailSlot, publicGroupKey: detailSlot } : {}),
        ...(publicTabKey ? { publicTabKey } : {}),
        ...(navLabel ? { navLabel } : {}),
        ...(anchorId ? { anchorId } : {}),
        ...(order !== null ? { displayOrder: order } : {}),
      },
    });

    if (order !== null) {
      await tx.villageDetailComponent.updateMany({
        where: { componentKey, status: "ACTIVE" },
        data: { displayOrder: order },
      });
    }
  });

  console.log(
    `Moved component ${componentKey}: slot=${detailSlot ?? "(unchanged)"}, tab=${publicTabKey ?? "(unchanged)"}, order=${order ?? "(unchanged)"}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

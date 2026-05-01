require("dotenv").config();

const prisma = require("./src/config/prisma");

const allowedEmails = [
  "admin@comdis.local",
  "caisse1@comdis.local",
  "caisse2@comdis.local",
  "caisse3@comdis.local",
  "caisse4@comdis.local",
  "caisse5@comdis.local",
  "caisse6@comdis.local",
];

async function main() {
  try {
    const usersToClean = await prisma.utilisateur.findMany({
      where: {
        email: {
          notIn: allowedEmails,
        },
      },
      include: {
        _count: {
          select: {
            ventes: true,
          },
        },
      },
    });

    const userIdsToDelete = usersToClean
      .filter((user) => user._count.ventes === 0)
      .map((user) => user.id);
    const userIdsToDisable = usersToClean
      .filter((user) => user._count.ventes > 0)
      .map((user) => user.id);

    let deleteCount = 0;
    let disableCount = 0;

    if (userIdsToDelete.length > 0) {
      const deleteResult = await prisma.utilisateur.deleteMany({
        where: {
          id: {
            in: userIdsToDelete,
          },
        },
      });

      deleteCount = deleteResult.count;
    }

    if (userIdsToDisable.length > 0) {
      const disableResult = await prisma.utilisateur.updateMany({
        where: {
          id: {
            in: userIdsToDisable,
          },
        },
        data: {
          estActif: false,
        },
      });

      disableCount = disableResult.count;
    }

    await prisma.utilisateur.update({
      where: {
        email: "admin@comdis.local",
      },
      data: {
        approvalStatus: "APPROVED",
        estActif: true,
      },
    });

    console.log(`Utilisateurs supprimes: ${deleteCount}`);
    console.log(`Utilisateurs desactives: ${disableCount}`);
    console.log("Users cleaned successfully");
  } catch (error) {
    console.error("Delete unwanted users failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

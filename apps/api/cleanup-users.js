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
  const deleteResult = await prisma.utilisateur.deleteMany({
    where: {
      email: {
        notIn: allowedEmails,
      },
    },
  });

  await prisma.utilisateur.update({
    where: {
      email: "admin@comdis.local",
    },
    data: {
      approvalStatus: "APPROVED",
      estActif: true,
    },
  });

  console.log(`Utilisateurs supprimes: ${deleteResult.count}`);
  console.log("Cleanup completed");
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

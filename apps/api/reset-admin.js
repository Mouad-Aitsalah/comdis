require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("./src/config/prisma");

async function main() {
  const email = "admin@comdis.local";
  const plainPassword = "Admin12345";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const existingUser = await prisma.utilisateur.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (!existingUser) {
    throw new Error(`Utilisateur introuvable: ${email}`);
  }

  await prisma.utilisateur.update({
    where: {
      email,
    },
    data: {
      motDePasse: hashedPassword,
      estActif: true,
      approvalStatus: "APPROVED",
    },
  });

  console.log("Admin reset OK");
}

main()
  .catch((error) => {
    console.error("Admin reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

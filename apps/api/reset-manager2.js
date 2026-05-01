const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Manager212345", 10);

  await prisma.utilisateur.update({
    where: { email: "manager2@comdis.local" },
    data: { motDePasse: hash },
  });

  console.log("Password manager2 reset OK");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
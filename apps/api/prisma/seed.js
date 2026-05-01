require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MAIN_ORGANISATION_NAME = "Manager 1";
const PROTECTED_EMPLOYEE_EMAILS = [
  "caisse1@comdis.local",
  "caisse2@comdis.local",
  "caisse3@comdis.local",
  "caisse4@comdis.local",
  "caisse5@comdis.local",
  "caisse6@comdis.local",
];
const PROTECTED_EMAILS = ["admin@comdis.local", ...PROTECTED_EMPLOYEE_EMAILS];

const mainOrganisationConfig = {
  name: MAIN_ORGANISATION_NAME,
  admin: {
    nom: "Administrateur Principal",
    email: "admin@comdis.local",
    password: "Admin12345",
  },
  stores: [
    {
      nom: "Point de Vente Centre",
      adresse: "12 Avenue Hassan II",
      telephone: "0600000001",
    },
    {
      nom: "Point de Vente Nord",
      adresse: "25 Rue Atlas",
      telephone: "0600000002",
    },
    {
      nom: "Point de Vente Sud",
      adresse: "8 Boulevard Mohammed V",
      telephone: "0600000003",
    },
    {
      nom: "Point de Vente Est",
      adresse: "44 Rue Al Amal",
      telephone: "0600000004",
    },
  ],
  cashRegistersByStore: [
    [
      { nom: "Caisse 1", code: "M1-STORE1-CAISSE1" },
      { nom: "Caisse 2", code: "M1-STORE1-CAISSE2" },
    ],
    [
      { nom: "Caisse 1", code: "M1-STORE2-CAISSE1" },
      { nom: "Caisse 2", code: "M1-STORE2-CAISSE2" },
    ],
    [{ nom: "Caisse 1", code: "M1-STORE3-CAISSE1" }],
    [{ nom: "Caisse 1", code: "M1-STORE4-CAISSE1" }],
  ],
  employees: [
    {
      nom: "Employe Caisse 1",
      email: "caisse1@comdis.local",
      password: "Caisse12345",
      storeIndex: 0,
      cashRegisterIndex: 0,
    },
    {
      nom: "Employe Caisse 2",
      email: "caisse2@comdis.local",
      password: "Caisse12345",
      storeIndex: 0,
      cashRegisterIndex: 1,
    },
    {
      nom: "Employe Caisse 3",
      email: "caisse3@comdis.local",
      password: "Caisse12345",
      storeIndex: 1,
      cashRegisterIndex: 0,
    },
    {
      nom: "Employe Caisse 4",
      email: "caisse4@comdis.local",
      password: "Caisse12345",
      storeIndex: 1,
      cashRegisterIndex: 1,
    },
    {
      nom: "Employe Caisse 5",
      email: "caisse5@comdis.local",
      password: "Caisse12345",
      storeIndex: 2,
      cashRegisterIndex: 0,
    },
    {
      nom: "Employe Caisse 6",
      email: "caisse6@comdis.local",
      password: "Caisse12345",
      storeIndex: 3,
      cashRegisterIndex: 0,
    },
  ],
  supplierSeed: [
    {
      nom: "Atlas Boissons",
      email: "contact+manager1-atlas@comdis.local",
      telephone: "0611111111",
      adresse: "Casablanca",
    },
    {
      nom: "Marche Epicerie",
      email: "contact+manager1-epicerie@comdis.local",
      telephone: "0622222222",
      adresse: "Rabat",
    },
  ],
  productSeed: [
    {
      codeBarres: "6111000001011",
      nom: "Coca Cola 33cl",
      categorie: "Boissons",
      prixAchat: 4.5,
      prixVente: 6.5,
      seuilMinimum: 10,
      supplierIndex: 0,
    },
    {
      codeBarres: "6111000001012",
      nom: "Eau Minerale 1.5L",
      categorie: "Boissons",
      prixAchat: 2.5,
      prixVente: 4,
      seuilMinimum: 12,
      supplierIndex: 0,
    },
    {
      codeBarres: "6111000001013",
      nom: "Biscuits Chocolat",
      categorie: "Snacks",
      prixAchat: 3,
      prixVente: 5,
      seuilMinimum: 8,
      supplierIndex: 1,
    },
    {
      codeBarres: "6111000001014",
      nom: "Riz 1kg",
      categorie: "Epicerie",
      prixAchat: 10,
      prixVente: 14,
      seuilMinimum: 6,
      supplierIndex: 1,
    },
    {
      codeBarres: "6111000001015",
      nom: "Savon Liquide",
      categorie: "Hygiene",
      prixAchat: 12,
      prixVente: 18,
      seuilMinimum: 5,
      supplierIndex: 1,
    },
  ],
  stockSeed: [
    { productIndex: 0, storeIndex: 0, quantite: 50 },
    { productIndex: 1, storeIndex: 0, quantite: 80 },
    { productIndex: 2, storeIndex: 0, quantite: 30 },
    { productIndex: 3, storeIndex: 1, quantite: 25 },
    { productIndex: 4, storeIndex: 1, quantite: 20 },
    { productIndex: 0, storeIndex: 2, quantite: 40 },
    { productIndex: 2, storeIndex: 2, quantite: 18 },
    { productIndex: 1, storeIndex: 3, quantite: 60 },
    { productIndex: 3, storeIndex: 3, quantite: 15 },
    { productIndex: 4, storeIndex: 3, quantite: 10 },
  ],
};

const managerCleanupStoreWhere = {
  OR: [
    { nom: { contains: "Manager 2", mode: "insensitive" } },
    { nom: { contains: "Manager 3", mode: "insensitive" } },
  ],
};

const managerCleanupUserWhere = {
  OR: [
    { email: "manager2@comdis.local" },
    { email: "manager3@comdis.local" },
    { email: { startsWith: "m2-caisse" } },
    { email: { startsWith: "m3-caisse" } },
  ],
};

async function upsertOrganisation(name) {
  return prisma.organisation.upsert({
    where: { name },
    update: { name },
    create: { name },
  });
}

async function upsertPointDeVente(data) {
  const existingPointDeVente = await prisma.pointDeVente.findFirst({
    where: {
      organisationId: data.organisationId,
      OR: [
        { telephone: data.telephone },
        {
          nom: data.nom,
          adresse: data.adresse,
        },
      ],
    },
    orderBy: {
      id: "asc",
    },
  });

  if (existingPointDeVente) {
    return prisma.pointDeVente.update({
      where: { id: existingPointDeVente.id },
      data,
    });
  }

  return prisma.pointDeVente.create({ data });
}

async function upsertCaisse(data) {
  const existingCaisse = await prisma.caisse.findFirst({
    where: {
      organisationId: data.organisationId,
      code: data.code,
    },
  });

  if (existingCaisse) {
    return prisma.caisse.update({
      where: { id: existingCaisse.id },
      data,
    });
  }

  return prisma.caisse.create({ data });
}

async function upsertClient(data) {
  const existingClient = await prisma.client.findFirst({
    where: {
      organisationId: data.organisationId,
      numeroClient: data.numeroClient,
    },
  });

  if (existingClient) {
    return prisma.client.update({
      where: { id: existingClient.id },
      data,
    });
  }

  return prisma.client.create({ data });
}

async function upsertSupplier(data) {
  const existingSupplier = await prisma.fournisseur.findFirst({
    where: {
      organisationId: data.organisationId,
      email: data.email,
    },
  });

  if (existingSupplier) {
    return prisma.fournisseur.update({
      where: { id: existingSupplier.id },
      data,
    });
  }

  return prisma.fournisseur.create({ data });
}

async function upsertProduct(data) {
  const existingProduct = await prisma.produit.findFirst({
    where: {
      organisationId: data.organisationId,
      codeBarres: data.codeBarres,
    },
  });

  if (existingProduct) {
    return prisma.produit.update({
      where: { id: existingProduct.id },
      data,
    });
  }

  return prisma.produit.create({ data });
}

async function upsertStockEntry(data) {
  return prisma.stock.upsert({
    where: {
      organisationId_produitId_pointDeVenteId: {
        organisationId: data.organisationId,
        produitId: data.produitId,
        pointDeVenteId: data.pointDeVenteId,
      },
    },
    update: {
      quantite: data.quantite,
    },
    create: data,
  });
}

async function upsertUser(data) {
  return prisma.utilisateur.upsert({
    where: {
      email: data.email,
    },
    update: data,
    create: data,
  });
}

async function cleanupLegacyManagerOrganisations() {
  const organisationsToDelete = await prisma.organisation.findMany({
    where: {
      OR: [
        { name: "Manager 2" },
        { name: "Manager 3" },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organisationsToDelete.length) {
    return;
  }

  await prisma.organisation.deleteMany({
    where: {
      id: {
        in: organisationsToDelete.map((organisation) => organisation.id),
      },
    },
  });
}

async function cleanupLegacyManagerStoresAndUsers() {
  const leftoverStores = await prisma.pointDeVente.findMany({
    where: managerCleanupStoreWhere,
    select: {
      id: true,
    },
  });
  const leftoverStoreIds = leftoverStores.map((store) => store.id);

  const leftoverCashRegisters = leftoverStoreIds.length
    ? await prisma.caisse.findMany({
        where: {
          pointDeVenteId: {
            in: leftoverStoreIds,
          },
        },
        select: {
          id: true,
        },
      })
    : [];
  const leftoverCashRegisterIds = leftoverCashRegisters.map((caisse) => caisse.id);

  const protectedUsersToDetach = await prisma.utilisateur.findMany({
    where: {
      email: {
        in: PROTECTED_EMAILS,
      },
      OR: [
        leftoverStoreIds.length
          ? {
              pointDeVenteId: {
                in: leftoverStoreIds,
              },
            }
          : undefined,
        leftoverCashRegisterIds.length
          ? {
              caisseId: {
                in: leftoverCashRegisterIds,
              },
            }
          : undefined,
      ].filter(Boolean),
    },
    select: {
      id: true,
    },
  });

  if (protectedUsersToDetach.length) {
    await prisma.utilisateur.updateMany({
      where: {
        id: {
          in: protectedUsersToDetach.map((user) => user.id),
        },
      },
      data: {
        pointDeVenteId: null,
        caisseId: null,
      },
    });
  }

  const usersToDelete = await prisma.utilisateur.findMany({
    where: {
      email: {
        notIn: PROTECTED_EMAILS,
      },
      OR: [
        managerCleanupUserWhere,
        leftoverStoreIds.length
          ? {
              pointDeVenteId: {
                in: leftoverStoreIds,
              },
            }
          : undefined,
        leftoverCashRegisterIds.length
          ? {
              caisseId: {
                in: leftoverCashRegisterIds,
              },
            }
          : undefined,
      ].filter(Boolean),
    },
    select: {
      id: true,
    },
  });
  const userIdsToDelete = usersToDelete.map((user) => user.id);

  const salesToDelete = leftoverStoreIds.length
    ? await prisma.vente.findMany({
        where: {
          pointDeVenteId: {
            in: leftoverStoreIds,
          },
        },
        select: {
          id: true,
        },
      })
    : [];
  const saleIdsToDelete = salesToDelete.map((sale) => sale.id);

  if (userIdsToDelete.length) {
    await prisma.loginApprovalRequest.deleteMany({
      where: {
        userId: {
          in: userIdsToDelete,
        },
      },
    });
  }

  if (saleIdsToDelete.length) {
    await prisma.retour.deleteMany({
      where: {
        venteId: {
          in: saleIdsToDelete,
        },
      },
    });

    await prisma.venteLigne.deleteMany({
      where: {
        venteId: {
          in: saleIdsToDelete,
        },
      },
    });

    await prisma.vente.deleteMany({
      where: {
        id: {
          in: saleIdsToDelete,
        },
      },
    });
  }

  if (leftoverStoreIds.length) {
    await prisma.stockMovement.deleteMany({
      where: {
        pointDeVenteId: {
          in: leftoverStoreIds,
        },
      },
    });

    await prisma.stock.deleteMany({
      where: {
        pointDeVenteId: {
          in: leftoverStoreIds,
        },
      },
    });
  }

  if (userIdsToDelete.length) {
    await prisma.utilisateur.deleteMany({
      where: {
        id: {
          in: userIdsToDelete,
        },
      },
    });
  }

  if (leftoverCashRegisterIds.length) {
    await prisma.caisse.deleteMany({
      where: {
        id: {
          in: leftoverCashRegisterIds,
        },
      },
    });
  }

  if (leftoverStoreIds.length) {
    await prisma.pointDeVente.deleteMany({
      where: {
        id: {
          in: leftoverStoreIds,
        },
      },
    });
  }
}

async function cleanupLegacyManagerData() {
  console.log("Cleaning legacy Manager 2 / Manager 3 data...");
  await cleanupLegacyManagerOrganisations();
  await cleanupLegacyManagerStoresAndUsers();
}

async function seedMainOrganisation(config) {
  const organisation = await upsertOrganisation(config.name);
  const hashedAdminPassword = await bcrypt.hash(config.admin.password, 10);

  const stores = [];

  for (const storeData of config.stores) {
    const store = await upsertPointDeVente({
      organisationId: organisation.id,
      ...storeData,
    });
    stores.push(store);
  }

  const cashRegisters = [];

  for (const [storeIndex, store] of stores.entries()) {
    const cashRegistersForStore = [];

    for (const cashRegisterData of config.cashRegistersByStore[storeIndex]) {
      const cashRegister = await upsertCaisse({
        organisationId: organisation.id,
        pointDeVenteId: store.id,
        estActive: true,
        ...cashRegisterData,
      });

      cashRegistersForStore.push(cashRegister);
    }

    cashRegisters.push(cashRegistersForStore);
  }

  await upsertUser({
    organisationId: organisation.id,
    nom: config.admin.nom,
    email: config.admin.email,
    motDePasse: hashedAdminPassword,
    role: "ADMIN",
    estActif: true,
    approvalStatus: "APPROVED",
    pointDeVenteId: null,
    caisseId: null,
  });

  for (const employee of config.employees) {
    const hashedEmployeePassword = await bcrypt.hash(employee.password, 10);
    const store = stores[employee.storeIndex];
    const cashRegister = cashRegisters[employee.storeIndex][employee.cashRegisterIndex];

    await upsertUser({
      organisationId: organisation.id,
      nom: employee.nom,
      email: employee.email,
      motDePasse: hashedEmployeePassword,
      role: "EMPLOYE",
      estActif: true,
      approvalStatus: "APPROVED",
      pointDeVenteId: store.id,
      caisseId: cashRegister.id,
    });
  }

  await upsertClient({
    organisationId: organisation.id,
    numeroClient: 1,
    nom: "Client inconnu",
    telephone: null,
    email: null,
    credit: 0,
    estActif: true,
  });

  const suppliers = [];

  for (const supplierData of config.supplierSeed) {
    const supplier = await upsertSupplier({
      organisationId: organisation.id,
      ...supplierData,
    });
    suppliers.push(supplier);
  }

  const products = [];

  for (const productData of config.productSeed) {
    const product = await upsertProduct({
      organisationId: organisation.id,
      codeBarres: productData.codeBarres,
      nom: productData.nom,
      categorie: productData.categorie,
      prixAchat: productData.prixAchat,
      prixVente: productData.prixVente,
      seuilMinimum: productData.seuilMinimum,
      estActif: true,
      fournisseurId: suppliers[productData.supplierIndex].id,
    });
    products.push(product);
  }

  for (const stockEntry of config.stockSeed) {
    await upsertStockEntry({
      organisationId: organisation.id,
      produitId: products[stockEntry.productIndex].id,
      pointDeVenteId: stores[stockEntry.storeIndex].id,
      quantite: stockEntry.quantite,
    });
  }
}

async function main() {
  console.log("Starting single-organisation seed...");

  await cleanupLegacyManagerData();
  await seedMainOrganisation(mainOrganisationConfig);

  console.log("Seed completed successfully.");
  console.log("Admin: admin@comdis.local / Admin12345");
  console.log(
    "Employes: caisse1@comdis.local, caisse2@comdis.local, caisse3@comdis.local, caisse4@comdis.local, caisse5@comdis.local, caisse6@comdis.local"
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

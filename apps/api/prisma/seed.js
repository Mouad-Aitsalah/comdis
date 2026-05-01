require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const storeNameSuffixes = ["Centre", "Nord", "Sud", "Est"];

const organisationConfigs = [
  {
    name: "Manager 1",
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
  },
  {
    name: "Manager 2",
    admin: {
      nom: "Manager 2",
      email: "manager2@comdis.local",
      password: "Manager212345",
    },
    stores: storeNameSuffixes.map((suffix, index) => ({
      nom: `Manager 2 - ${suffix}`,
      adresse: `${20 + index} Boulevard Manager 2`,
      telephone: `070000000${index + 1}`,
    })),
    cashRegistersByStore: storeNameSuffixes.map((_, index) => [
      { nom: "Caisse 1", code: `M2-STORE${index + 1}-CAISSE1` },
    ]),
    employees: storeNameSuffixes.map((suffix, index) => ({
      nom: `Employe ${suffix} M2`,
      email: `m2-caisse${index + 1}@comdis.local`,
      password: "Caisse12345",
      storeIndex: index,
      cashRegisterIndex: 0,
    })),
    supplierSeed: [
      {
        nom: "Atlas Boissons M2",
        email: "contact+manager2-atlas@comdis.local",
        telephone: "0711111111",
        adresse: "Casablanca",
      },
      {
        nom: "Marche Epicerie M2",
        email: "contact+manager2-epicerie@comdis.local",
        telephone: "0722222222",
        adresse: "Rabat",
      },
    ],
    productSeed: [
      {
        codeBarres: "6111000002011",
        nom: "Coca Cola 33cl",
        categorie: "Boissons",
        prixAchat: 4.6,
        prixVente: 6.8,
        seuilMinimum: 10,
        supplierIndex: 0,
      },
      {
        codeBarres: "6111000002012",
        nom: "Eau Minerale 1.5L",
        categorie: "Boissons",
        prixAchat: 2.4,
        prixVente: 4,
        seuilMinimum: 12,
        supplierIndex: 0,
      },
      {
        codeBarres: "6111000002013",
        nom: "Biscuits Chocolat",
        categorie: "Snacks",
        prixAchat: 3.1,
        prixVente: 5.2,
        seuilMinimum: 8,
        supplierIndex: 1,
      },
      {
        codeBarres: "6111000002014",
        nom: "Riz 1kg",
        categorie: "Epicerie",
        prixAchat: 10.2,
        prixVente: 14.5,
        seuilMinimum: 6,
        supplierIndex: 1,
      },
      {
        codeBarres: "6111000002015",
        nom: "Savon Liquide",
        categorie: "Hygiene",
        prixAchat: 12.3,
        prixVente: 18.4,
        seuilMinimum: 5,
        supplierIndex: 1,
      },
    ],
    stockSeed: [
      { productIndex: 0, storeIndex: 0, quantite: 35 },
      { productIndex: 1, storeIndex: 0, quantite: 70 },
      { productIndex: 2, storeIndex: 1, quantite: 22 },
      { productIndex: 3, storeIndex: 2, quantite: 26 },
      { productIndex: 4, storeIndex: 3, quantite: 14 },
    ],
  },
  {
    name: "Manager 3",
    admin: {
      nom: "Manager 3",
      email: "manager3@comdis.local",
      password: "Manager312345",
    },
    stores: storeNameSuffixes.map((suffix, index) => ({
      nom: `Manager 3 - ${suffix}`,
      adresse: `${40 + index} Avenue Manager 3`,
      telephone: `080000000${index + 1}`,
    })),
    cashRegistersByStore: storeNameSuffixes.map((_, index) => [
      { nom: "Caisse 1", code: `M3-STORE${index + 1}-CAISSE1` },
    ]),
    employees: storeNameSuffixes.map((suffix, index) => ({
      nom: `Employe ${suffix} M3`,
      email: `m3-caisse${index + 1}@comdis.local`,
      password: "Caisse12345",
      storeIndex: index,
      cashRegisterIndex: 0,
    })),
    supplierSeed: [
      {
        nom: "Atlas Boissons M3",
        email: "contact+manager3-atlas@comdis.local",
        telephone: "0811111111",
        adresse: "Casablanca",
      },
      {
        nom: "Marche Epicerie M3",
        email: "contact+manager3-epicerie@comdis.local",
        telephone: "0822222222",
        adresse: "Rabat",
      },
    ],
    productSeed: [
      {
        codeBarres: "6111000003011",
        nom: "Coca Cola 33cl",
        categorie: "Boissons",
        prixAchat: 4.7,
        prixVente: 6.9,
        seuilMinimum: 10,
        supplierIndex: 0,
      },
      {
        codeBarres: "6111000003012",
        nom: "Eau Minerale 1.5L",
        categorie: "Boissons",
        prixAchat: 2.6,
        prixVente: 4.1,
        seuilMinimum: 12,
        supplierIndex: 0,
      },
      {
        codeBarres: "6111000003013",
        nom: "Biscuits Chocolat",
        categorie: "Snacks",
        prixAchat: 3.2,
        prixVente: 5.3,
        seuilMinimum: 8,
        supplierIndex: 1,
      },
      {
        codeBarres: "6111000003014",
        nom: "Riz 1kg",
        categorie: "Epicerie",
        prixAchat: 10.1,
        prixVente: 14.4,
        seuilMinimum: 6,
        supplierIndex: 1,
      },
      {
        codeBarres: "6111000003015",
        nom: "Savon Liquide",
        categorie: "Hygiene",
        prixAchat: 12.1,
        prixVente: 18.2,
        seuilMinimum: 5,
        supplierIndex: 1,
      },
    ],
    stockSeed: [
      { productIndex: 0, storeIndex: 0, quantite: 42 },
      { productIndex: 1, storeIndex: 1, quantite: 52 },
      { productIndex: 2, storeIndex: 1, quantite: 16 },
      { productIndex: 3, storeIndex: 2, quantite: 24 },
      { productIndex: 4, storeIndex: 3, quantite: 12 },
    ],
  },
];

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

async function seedOrganisation(config) {
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

  return {
    organisation,
    stores,
    cashRegisters,
  };
}

async function main() {
  console.log("Starting multi-tenant seed...");

  for (const config of organisationConfigs) {
    await seedOrganisation(config);
  }

  console.log("Seed completed successfully.");
  console.log("Manager 1: admin@comdis.local / Admin12345");
  console.log("Manager 2: manager2@comdis.local / Manager212345");
  console.log("Manager 3: manager3@comdis.local / Manager312345");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

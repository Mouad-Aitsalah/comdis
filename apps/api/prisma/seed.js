require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertPointDeVente(data) {
  // Until the schema has a dedicated unique field for PointDeVente,
  // we use the seeded telephone as a stable identifier for safe reruns.
  const existingPointDeVente = await prisma.pointDeVente.findFirst({
    where: {
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

async function upsertStockEntry(data) {
  return prisma.stock.upsert({
    where: {
      produitId_pointDeVenteId: {
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

async function upsertCaisse(data) {
  return prisma.caisse.upsert({
    where: {
      code: data.code,
    },
    update: data,
    create: data,
  });
}

async function upsertClient(data) {
  return prisma.client.upsert({
    where: {
      numeroClient: data.numeroClient,
    },
    update: data,
    create: data,
  });
}

async function ensureDefaultCustomerSlot() {
  const customerAtReservedNumber = await prisma.client.findUnique({
    where: {
      numeroClient: 1,
    },
  });

  if (!customerAtReservedNumber) {
    return null;
  }

  const isDefaultCustomer =
    customerAtReservedNumber.nom === "Client inconnu" &&
    customerAtReservedNumber.telephone === null &&
    customerAtReservedNumber.email === null;

  if (isDefaultCustomer) {
    return customerAtReservedNumber;
  }

  const lastRealCustomer = await prisma.client.findFirst({
    where: {
      numeroClient: {
        gt: 1,
      },
    },
    orderBy: {
      numeroClient: "desc",
    },
    select: {
      numeroClient: true,
    },
  });

  const nextNumeroClient = (lastRealCustomer?.numeroClient || 1) + 1;

  return prisma.client.update({
    where: {
      id: customerAtReservedNumber.id,
    },
    data: {
      numeroClient: nextNumeroClient,
    },
  });
}

async function main() {
  console.log("Starting seed...");

  const pointsDeVenteData = [
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
  ];

  const pointsDeVente = [];

  for (const pointDeVenteData of pointsDeVenteData) {
    const pointDeVente = await upsertPointDeVente(pointDeVenteData);
    pointsDeVente.push(pointDeVente);
  }

  const caissesParPointDeVente = [
    [
      { nom: "Caisse 1", code: "STORE1-CAISSE1" },
      { nom: "Caisse 2", code: "STORE1-CAISSE2" },
    ],
    [
      { nom: "Caisse 1", code: "STORE2-CAISSE1" },
      { nom: "Caisse 2", code: "STORE2-CAISSE2" },
    ],
    [{ nom: "Caisse 1", code: "STORE3-CAISSE1" }],
    [{ nom: "Caisse 1", code: "STORE4-CAISSE1" }],
  ];

  const caisses = [];

  for (const [index, pointDeVente] of pointsDeVente.entries()) {
    const caissesDuPointDeVente = [];

    for (const caisseData of caissesParPointDeVente[index]) {
      const caisse = await upsertCaisse({
        ...caisseData,
        pointDeVenteId: pointDeVente.id,
        estActive: true,
      });

      caissesDuPointDeVente.push(caisse);
    }

    caisses.push(caissesDuPointDeVente);
  }

  const adminPasswordHash = await bcrypt.hash("Admin12345", 10);
  const employeePasswordHash = await bcrypt.hash("Caisse12345", 10);

  const adminUser = await prisma.utilisateur.upsert({
    where: { email: "admin@comdis.local" },
    update: {
      nom: "Administrateur Principal",
      motDePasse: adminPasswordHash,
      role: "ADMIN",
      estActif: true,
      pointDeVenteId: null,
      caisseId: null,
    },
    create: {
      nom: "Administrateur Principal",
      email: "admin@comdis.local",
      motDePasse: adminPasswordHash,
      role: "ADMIN",
      estActif: true,
      pointDeVenteId: null,
      caisseId: null,
    },
  });

  const employes = [
    {
      nom: "Employe Caisse 1",
      email: "caisse1@comdis.local",
      pointDeVenteId: pointsDeVente[0].id,
      caisseId: caisses[0][0].id,
    },
    {
      nom: "Employe Caisse 2",
      email: "caisse2@comdis.local",
      pointDeVenteId: pointsDeVente[0].id,
      caisseId: caisses[0][1].id,
    },
    {
      nom: "Employe Caisse 3",
      email: "caisse3@comdis.local",
      pointDeVenteId: pointsDeVente[1].id,
      caisseId: caisses[1][0].id,
    },
    {
      nom: "Employe Caisse 4",
      email: "caisse4@comdis.local",
      pointDeVenteId: pointsDeVente[1].id,
      caisseId: caisses[1][1].id,
    },
    {
      nom: "Employe Caisse 5",
      email: "caisse5@comdis.local",
      pointDeVenteId: pointsDeVente[2].id,
      caisseId: caisses[2][0].id,
    },
    {
      nom: "Employe Caisse 6",
      email: "caisse6@comdis.local",
      pointDeVenteId: pointsDeVente[3].id,
      caisseId: caisses[3][0].id,
    },
  ];

  for (const employe of employes) {
    await prisma.utilisateur.upsert({
      where: { email: employe.email },
      update: {
        nom: employe.nom,
        motDePasse: employeePasswordHash,
        role: "EMPLOYE",
        estActif: true,
        pointDeVenteId: employe.pointDeVenteId,
        caisseId: employe.caisseId,
      },
      create: {
        nom: employe.nom,
        email: employe.email,
        motDePasse: employeePasswordHash,
        role: "EMPLOYE",
        estActif: true,
        pointDeVenteId: employe.pointDeVenteId,
        caisseId: employe.caisseId,
      },
    });
  }

  await ensureDefaultCustomerSlot();

  const clientInconnu = await upsertClient({
    numeroClient: 1,
    nom: "Client inconnu",
    telephone: null,
    email: null,
    credit: 0,
    estActif: true,
  });

  const fournisseurBoissons = await prisma.fournisseur.upsert({
    where: { email: "contact@atlas-boissons.ma" },
    update: {
      nom: "Atlas Boissons",
      telephone: "0611111111",
      adresse: "Casablanca",
    },
    create: {
      nom: "Atlas Boissons",
      email: "contact@atlas-boissons.ma",
      telephone: "0611111111",
      adresse: "Casablanca",
    },
  });

  const fournisseurEpicerie = await prisma.fournisseur.upsert({
    where: { email: "contact@marche-epicerie.ma" },
    update: {
      nom: "Marche Epicerie",
      telephone: "0622222222",
      adresse: "Rabat",
    },
    create: {
      nom: "Marche Epicerie",
      email: "contact@marche-epicerie.ma",
      telephone: "0622222222",
      adresse: "Rabat",
    },
  });

  const cocaCola = await prisma.produit.upsert({
    where: { codeBarres: "6111000000011" },
    update: {
      nom: "Coca Cola 33cl",
      categorie: "Boissons",
      prixAchat: 4.5,
      prixVente: 6.5,
      seuilMinimum: 10,
      estActif: true,
      fournisseurId: fournisseurBoissons.id,
    },
    create: {
      codeBarres: "6111000000011",
      nom: "Coca Cola 33cl",
      categorie: "Boissons",
      prixAchat: 4.5,
      prixVente: 6.5,
      seuilMinimum: 10,
      estActif: true,
      fournisseurId: fournisseurBoissons.id,
    },
  });

  const eauMinerale = await prisma.produit.upsert({
    where: { codeBarres: "6111000000012" },
    update: {
      nom: "Eau Minerale 1.5L",
      categorie: "Boissons",
      prixAchat: 2.5,
      prixVente: 4,
      seuilMinimum: 12,
      estActif: true,
      fournisseurId: fournisseurBoissons.id,
    },
    create: {
      codeBarres: "6111000000012",
      nom: "Eau Minerale 1.5L",
      categorie: "Boissons",
      prixAchat: 2.5,
      prixVente: 4,
      seuilMinimum: 12,
      estActif: true,
      fournisseurId: fournisseurBoissons.id,
    },
  });

  const biscuits = await prisma.produit.upsert({
    where: { codeBarres: "6111000000013" },
    update: {
      nom: "Biscuits Chocolat",
      categorie: "Snacks",
      prixAchat: 3,
      prixVente: 5,
      seuilMinimum: 8,
      estActif: true,
      fournisseurId: fournisseurEpicerie.id,
    },
    create: {
      codeBarres: "6111000000013",
      nom: "Biscuits Chocolat",
      categorie: "Snacks",
      prixAchat: 3,
      prixVente: 5,
      seuilMinimum: 8,
      estActif: true,
      fournisseurId: fournisseurEpicerie.id,
    },
  });

  const riz = await prisma.produit.upsert({
    where: { codeBarres: "6111000000014" },
    update: {
      nom: "Riz 1kg",
      categorie: "Epicerie",
      prixAchat: 10,
      prixVente: 14,
      seuilMinimum: 6,
      estActif: true,
      fournisseurId: fournisseurEpicerie.id,
    },
    create: {
      codeBarres: "6111000000014",
      nom: "Riz 1kg",
      categorie: "Epicerie",
      prixAchat: 10,
      prixVente: 14,
      seuilMinimum: 6,
      estActif: true,
      fournisseurId: fournisseurEpicerie.id,
    },
  });

  const savon = await prisma.produit.upsert({
    where: { codeBarres: "6111000000015" },
    update: {
      nom: "Savon Liquide",
      categorie: "Hygiene",
      prixAchat: 12,
      prixVente: 18,
      seuilMinimum: 5,
      estActif: true,
      fournisseurId: fournisseurEpicerie.id,
    },
    create: {
      codeBarres: "6111000000015",
      nom: "Savon Liquide",
      categorie: "Hygiene",
      prixAchat: 12,
      prixVente: 18,
      seuilMinimum: 5,
      estActif: true,
      fournisseurId: fournisseurEpicerie.id,
    },
  });

  const stockEntries = [
    { produitId: cocaCola.id, pointDeVenteId: pointsDeVente[0].id, quantite: 50 },
    { produitId: eauMinerale.id, pointDeVenteId: pointsDeVente[0].id, quantite: 80 },
    { produitId: biscuits.id, pointDeVenteId: pointsDeVente[0].id, quantite: 30 },
    { produitId: riz.id, pointDeVenteId: pointsDeVente[1].id, quantite: 25 },
    { produitId: savon.id, pointDeVenteId: pointsDeVente[1].id, quantite: 20 },
    { produitId: cocaCola.id, pointDeVenteId: pointsDeVente[2].id, quantite: 40 },
    { produitId: biscuits.id, pointDeVenteId: pointsDeVente[2].id, quantite: 18 },
    { produitId: eauMinerale.id, pointDeVenteId: pointsDeVente[3].id, quantite: 60 },
    { produitId: riz.id, pointDeVenteId: pointsDeVente[3].id, quantite: 15 },
    { produitId: savon.id, pointDeVenteId: pointsDeVente[3].id, quantite: 10 },
  ];

  for (const stockEntry of stockEntries) {
    await upsertStockEntry(stockEntry);
  }

  await prisma.vente.updateMany({
    where: {
      clientId: null,
    },
    data: {
      clientId: clientInconnu.id,
    },
  });

  console.log("Seed completed successfully.");
  console.log(`Admin email: ${adminUser.email}`);
  console.log("Admin password: Admin12345");
  console.log("Employee test email: caisse1@comdis.local");
  console.log("Employee test password: Caisse12345");
  console.log("Default customer: #1 Client inconnu");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

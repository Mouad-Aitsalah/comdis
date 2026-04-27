const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const DAILY_REPORT_STORE_NAME = "Point de Vente Est";

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const decimalToNumber = (value) => {
  if (value instanceof Prisma.Decimal) {
    return Number(value.toString());
  }

  return Number(value || 0);
};

const getDecimalValue = (value) => {
  if (value instanceof Prisma.Decimal) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return new Prisma.Decimal(0);
  }

  return new Prisma.Decimal(value);
};

const getLineNetProfit = (line) => {
  const unitSalePrice = getDecimalValue(line.prixUnitaire);
  const purchasePrice = getDecimalValue(line.produit?.prixAchat);
  const quantity = new Prisma.Decimal(line.quantite || 0);

  return unitSalePrice.minus(purchasePrice).times(quantity);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalToNumber(value));

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const getDailyReportStore = async () => {
  const store = await prisma.pointDeVente.findFirst({
    where: {
      nom: DAILY_REPORT_STORE_NAME,
    },
    select: {
      id: true,
      nom: true,
      adresse: true,
    },
  });

  if (!store) {
    throw new Error(`Point de vente introuvable: ${DAILY_REPORT_STORE_NAME}`);
  }

  return store;
};

const generateDailyReport = async () => {
  const store = await getDailyReportStore();
  const startOfToday = getStartOfToday();

  const sales = await prisma.vente.findMany({
    where: {
      pointDeVenteId: store.id,
      createdAt: {
        gte: startOfToday,
      },
    },
    include: {
      lignes: {
        include: {
          produit: {
            select: {
              nom: true,
              prixAchat: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + decimalToNumber(sale.total),
    0
  );
  const netProfit = sales.reduce((sum, sale) => {
    const saleProfit = sale.lignes.reduce(
      (lineSum, ligne) => lineSum.plus(getLineNetProfit(ligne)),
      new Prisma.Decimal(0)
    );

    return sum.plus(saleProfit);
  }, new Prisma.Decimal(0));
  const salesCount = sales.length;

  const salesRowsHtml = sales.length
    ? sales
        .map((sale) => {
          const itemsCount = sale.lignes.reduce(
            (sum, ligne) => sum + ligne.quantite,
            0
          );
          const products = sale.lignes
            .map((ligne) => `${ligne.produit?.nom || "Produit"} x${ligne.quantite}`)
            .join(", ");

          return `
            <tr>
              <td>${sale.numeroTicket}</td>
              <td>${formatDateTime(sale.createdAt)}</td>
              <td>${itemsCount}</td>
              <td>${formatCurrency(sale.total)} MAD</td>
              <td>${products || "-"}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="5" style="padding: 12px; text-align: center; color: #6a788d;">
          Aucune vente enregistree aujourd'hui.
        </td>
      </tr>
    `;

  return `
    <div style="font-family: Arial, sans-serif; color: #172235; line-height: 1.5;">
      <h1 style="margin-bottom: 8px;">Rapport journalier - ${store.nom}</h1>
      <p style="margin-top: 0; color: #6a788d;">${store.adresse || ""}</p>

      <div style="display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap;">
        <div style="padding: 16px; border: 1px solid #d7e1ec; border-radius: 12px; min-width: 180px;">
          <strong>Nombre de ventes</strong>
          <div style="font-size: 24px; margin-top: 6px;">${salesCount}</div>
        </div>
        <div style="padding: 16px; border: 1px solid #d7e1ec; border-radius: 12px; min-width: 180px;">
          <strong>Chiffre d'affaires</strong>
          <div style="font-size: 24px; margin-top: 6px;">${formatCurrency(totalRevenue)} MAD</div>
        </div>
        <div style="padding: 16px; border: 1px solid #d7e1ec; border-radius: 12px; min-width: 180px;">
          <strong>Benefice net</strong>
          <div style="font-size: 24px; margin-top: 6px;">${formatCurrency(netProfit)} MAD</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #d7e1ec;">
        <thead>
          <tr style="background: #1659b5; color: white;">
            <th style="padding: 12px; text-align: left;">Ticket</th>
            <th style="padding: 12px; text-align: left;">Date</th>
            <th style="padding: 12px; text-align: left;">Articles</th>
            <th style="padding: 12px; text-align: left;">Total</th>
            <th style="padding: 12px; text-align: left;">Produits</th>
          </tr>
        </thead>
        <tbody>
          ${salesRowsHtml}
        </tbody>
      </table>
    </div>
  `;
};

module.exports = {
  generateDailyReport,
};

const prisma = require("../config/prisma");
const { validateSchema } = require("../utils/validation");
const { getOrganisationIdFromUser } = require("../utils/organisationScope");
const {
  productCreateSchema,
  productUpdateSchema,
} = require("../utils/validationSchemas");

const parseId = (value) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const normalizeRequiredString = (value) => String(value || "").trim();

const parseOptionalPositiveInteger = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : NaN;
};

const parseOptionalNonNegativeInteger = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : NaN;
};

const parseRequiredNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

const normalizeInitialStocks = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  return value.map((entry) => ({
    storeId: parseOptionalPositiveInteger(entry?.storeId),
    quantity:
      entry?.quantity === undefined
        ? 0
        : parseOptionalNonNegativeInteger(entry?.quantity),
  }));
};

const parseOptionalBoolean = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
};

const productInclude = {
  fournisseur: {
    select: {
      id: true,
      nom: true,
      email: true,
      telephone: true,
    },
  },
};

const getAllProducts = async (req, res) => {
  try {
    const organisationId = getOrganisationIdFromUser(req.user);
    const produits = await prisma.produit.findMany({
      where: {
        organisationId,
      },
      include: productInclude,
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      products: produits,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la recuperation des produits.",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const organisationId = getOrganisationIdFromUser(req.user);
    const productId = parseId(req.params.id);

    if (!productId) {
      return res.status(400).json({
        message: "ID produit invalide.",
      });
    }

    const produit = await prisma.produit.findFirst({
      where: {
        organisationId,
        id: productId,
      },
      include: productInclude,
    });

    if (!produit) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.status(200).json({
      product: produit,
    });
  } catch (error) {
    console.error("Get product by id error:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la recuperation du produit.",
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const organisationId = getOrganisationIdFromUser(req.user);
    const {
      codeBarres,
      nom,
      categorie,
      prixAchat,
      prixVente,
      seuilMinimum,
      estActif,
      fournisseurId,
      initialStocks,
    } = validateSchema(productCreateSchema, req.body);
    const normalizedCodeBarres = normalizeRequiredString(codeBarres);
    const normalizedNom = normalizeRequiredString(nom);
    const normalizedCategorie = normalizeRequiredString(categorie);

    const parsedPrixAchat = parseRequiredNumber(prixAchat);
    const parsedPrixVente = parseRequiredNumber(prixVente);
    const parsedSeuilMinimum =
      seuilMinimum === undefined ? 0 : parseOptionalNonNegativeInteger(seuilMinimum);
    const parsedEstActif = parseOptionalBoolean(estActif, true);
    const parsedFournisseurId = parseOptionalPositiveInteger(fournisseurId);
    const normalizedInitialStocks = normalizeInitialStocks(initialStocks);

    if (
      Number.isNaN(parsedSeuilMinimum) ||
      parsedSeuilMinimum === null ||
      parsedSeuilMinimum < 0
    ) {
      return res.status(400).json({
        message: "seuilMinimum doit etre un entier positif ou egal a 0.",
      });
    }

    if (parsedEstActif === null) {
      return res.status(400).json({
        message: "estActif doit etre true ou false.",
      });
    }

    if (Number.isNaN(parsedFournisseurId)) {
      return res.status(400).json({
        message: "fournisseurId doit etre un entier valide.",
      });
    }

    if (normalizedInitialStocks === null) {
      return res.status(400).json({
        message: "initialStocks doit etre un tableau valide.",
      });
    }

    if (
      normalizedInitialStocks.some(
        (entry) =>
          Number.isNaN(entry.storeId) ||
          entry.storeId === null ||
          Number.isNaN(entry.quantity) ||
          entry.quantity === null
      )
    ) {
      return res.status(400).json({
        message:
          "Chaque stock initial doit contenir un storeId valide et une quantite superieure ou egale a 0.",
      });
    }

    const duplicateStoreIds = normalizedInitialStocks.reduce((duplicates, entry, index, array) => {
      if (array.findIndex((item) => item.storeId === entry.storeId) !== index) {
        duplicates.add(entry.storeId);
      }

      return duplicates;
    }, new Set());

    if (duplicateStoreIds.size > 0) {
      return res.status(400).json({
        message: `Les stocks initiaux contiennent des points de vente en doublon: ${Array.from(
          duplicateStoreIds
        ).join(", ")}.`,
      });
    }

    const existingProduct = await prisma.produit.findFirst({
      where: {
        organisationId,
        codeBarres: normalizedCodeBarres,
      },
    });

    if (existingProduct) {
      return res.status(409).json({
        message: "Un produit avec ce code-barres existe deja.",
      });
    }

    if (parsedFournisseurId) {
      const fournisseur = await prisma.fournisseur.findFirst({
        where: {
          organisationId,
          id: parsedFournisseurId,
        },
      });

      if (!fournisseur) {
        return res.status(404).json({
          message: "Fournisseur introuvable.",
        });
      }
    }

    const produit = await prisma.$transaction(async (tx) => {
      const pointsDeVente = await tx.pointDeVente.findMany({
        where: {
          organisationId,
        },
        select: {
          id: true,
        },
        orderBy: {
          id: "asc",
        },
      });

      const requestedStoreIds = normalizedInitialStocks.map((entry) => entry.storeId);
      const existingStoreIds = new Set(pointsDeVente.map((pointDeVente) => pointDeVente.id));
      const missingStoreIds = requestedStoreIds.filter((storeId) => !existingStoreIds.has(storeId));

      if (missingStoreIds.length > 0) {
        throw {
          status: 404,
          message: `Points de vente introuvables pour les stocks initiaux: ${missingStoreIds.join(
            ", "
          )}.`,
        };
      }

      const produitCree = await tx.produit.create({
        data: {
          organisationId,
          codeBarres: normalizedCodeBarres,
          nom: normalizedNom,
          categorie: normalizedCategorie,
          prixAchat: parsedPrixAchat,
          prixVente: parsedPrixVente,
          seuilMinimum: parsedSeuilMinimum,
          estActif: parsedEstActif,
          fournisseurId: parsedFournisseurId,
        },
      });

      const quantityByStoreId = new Map(
        normalizedInitialStocks.map((entry) => [entry.storeId, entry.quantity ?? 0])
      );

      await tx.stock.createMany({
        data: pointsDeVente.map((pointDeVente) => ({
          organisationId,
          produitId: produitCree.id,
          pointDeVenteId: pointDeVente.id,
          quantite: quantityByStoreId.get(pointDeVente.id) ?? 0,
        })),
        skipDuplicates: true,
      });

      return tx.produit.findUnique({
        where: { id: produitCree.id },
        include: productInclude,
      });
    });

    return res.status(201).json({
      message: "Produit cree avec succes.",
      product: produit,
    });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error("Create product error:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la creation du produit.",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const organisationId = getOrganisationIdFromUser(req.user);
    const productId = parseId(req.params.id);

    if (!productId) {
      return res.status(400).json({
        message: "ID produit invalide.",
      });
    }

    const existingProduct = await prisma.produit.findFirst({
      where: {
        organisationId,
        id: productId,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    const {
      codeBarres,
      nom,
      categorie,
      prixAchat,
      prixVente,
      seuilMinimum,
      estActif,
      fournisseurId,
    } = validateSchema(productUpdateSchema, req.body);

    const data = {};

    if (codeBarres !== undefined) {
      const normalizedCodeBarres = normalizeRequiredString(codeBarres);

      if (!normalizedCodeBarres) {
        return res.status(400).json({
          message: "codeBarres ne peut pas etre vide.",
        });
      }

      data.codeBarres = normalizedCodeBarres;
    }

    if (nom !== undefined) {
      const normalizedNom = normalizeRequiredString(nom);

      if (!normalizedNom) {
        return res.status(400).json({
          message: "nom ne peut pas etre vide.",
        });
      }

      data.nom = normalizedNom;
    }

    if (categorie !== undefined) {
      const normalizedCategorie = normalizeRequiredString(categorie);

      if (!normalizedCategorie) {
        return res.status(400).json({
          message: "categorie ne peut pas etre vide.",
        });
      }

      data.categorie = normalizedCategorie;
    }

    if (prixAchat !== undefined) {
      const parsedPrixAchat = parseRequiredNumber(prixAchat);

      data.prixAchat = parsedPrixAchat;
    }

    if (prixVente !== undefined) {
      const parsedPrixVente = parseRequiredNumber(prixVente);

      data.prixVente = parsedPrixVente;
    }

    if (seuilMinimum !== undefined) {
      const parsedSeuilMinimum = parseOptionalNonNegativeInteger(seuilMinimum);

      if (
        Number.isNaN(parsedSeuilMinimum) ||
        parsedSeuilMinimum === null ||
        parsedSeuilMinimum < 0
      ) {
        return res.status(400).json({
          message: "seuilMinimum doit etre un entier positif ou egal a 0.",
        });
      }

      data.seuilMinimum = parsedSeuilMinimum;
    }

    if (estActif !== undefined) {
      const parsedEstActif = parseOptionalBoolean(estActif);

      if (parsedEstActif === null) {
        return res.status(400).json({
          message: "estActif doit etre true ou false.",
        });
      }

      data.estActif = parsedEstActif;
    }

    if (fournisseurId !== undefined) {
      const parsedFournisseurId = parseOptionalPositiveInteger(fournisseurId);

      if (Number.isNaN(parsedFournisseurId)) {
        return res.status(400).json({
          message: "fournisseurId doit etre un entier valide.",
        });
      }

      if (parsedFournisseurId) {
        const fournisseur = await prisma.fournisseur.findFirst({
          where: {
            organisationId,
            id: parsedFournisseurId,
          },
        });

        if (!fournisseur) {
          return res.status(404).json({
            message: "Fournisseur introuvable.",
          });
        }
      }

      data.fournisseurId = parsedFournisseurId;
    }

    if (data.codeBarres) {
      const productWithSameBarcode = await prisma.produit.findFirst({
        where: {
          organisationId,
          codeBarres: data.codeBarres,
          id: {
            not: productId,
          },
        },
      });

      if (productWithSameBarcode) {
        return res.status(409).json({
          message: "Un autre produit avec ce code-barres existe deja.",
        });
      }
    }

    const produit = await prisma.produit.update({
      where: { id: productId },
      data,
      include: productInclude,
    });

    return res.status(200).json({
      message: "Produit mis a jour avec succes.",
      product: produit,
    });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error("Update product error:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la mise a jour du produit.",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const organisationId = getOrganisationIdFromUser(req.user);
    const productId = parseId(req.params.id);

    if (!productId) {
      return res.status(400).json({
        message: "ID produit invalide.",
      });
    }

    const existingProduct = await prisma.produit.findFirst({
      where: {
        organisationId,
        id: productId,
      },
      include: {
        _count: {
          select: {
            lignesVente: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    if (existingProduct._count.lignesVente > 0) {
      return res.status(409).json({
        message: "Impossible de supprimer ce produit car il a deja ete utilise dans des ventes.",
      });
    }

    await prisma.produit.delete({
      where: { id: productId },
    });

    return res.status(200).json({
      message: "Produit supprime avec succes.",
    });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "Impossible de supprimer ce produit car il est lie a des enregistrements existants.",
      });
    }

    console.error("Delete product error:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la suppression du produit.",
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

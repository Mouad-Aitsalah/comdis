const {
  z,
  requiredString,
  optionalString,
  emailString,
  optionalEmailString,
  optionalPhoneString,
  positiveNumber,
  nonNegativeNumber,
  positiveInt,
  optionalPositiveInt,
  nonNegativeInt,
  optionalBoolean,
} = require("./validation");

const loginSchema = z.object({
  email: emailString("L'email"),
  password: requiredString("Le mot de passe"),
});

const authLoginSchema = z.object({
  email: emailString("L'email"),
  motDePasse: requiredString("Le mot de passe"),
});

const customerCreateSchema = z.object({
  name: requiredString("Le nom du client"),
  phone: optionalPhoneString("Le telephone"),
  email: optionalEmailString("L'email"),
});

const customerCreditPaymentSchema = z.object({
  amount: positiveNumber("Le montant"),
  note: optionalString("La note"),
});

const saleItemSchema = z.object({
  productId: positiveInt("Le produit"),
  quantity: positiveInt("La quantite"),
  unitPrice: nonNegativeNumber("Le prix unitaire"),
});

const saleCreateSchema = z.object({
  storeId: optionalPositiveInt("Le magasin"),
  cashRegisterId: optionalPositiveInt("La caisse"),
  userId: optionalPositiveInt("L'utilisateur"),
  customerId: optionalPositiveInt("Le client"),
  paymentMethod: requiredString("Le mode de paiement"),
  total: nonNegativeNumber("Le total"),
  items: z
    .array(saleItemSchema, {
      invalid_type_error: "Les articles doivent etre un tableau valide.",
    })
    .min(1, "Au moins un article est obligatoire."),
});

const stockEntrySchema = z.object({
  productId: positiveInt("Le produit"),
  storeId: positiveInt("Le magasin"),
  quantity: positiveInt("La quantite"),
  reason: optionalString("La raison"),
});

const stockCorrectionSchema = z.object({
  productId: positiveInt("Le produit"),
  storeId: positiveInt("Le magasin"),
  quantity: nonNegativeInt("La quantite"),
  reason: optionalString("La raison"),
});

const initialStockSchema = z.object({
  storeId: positiveInt("Le point de vente"),
  quantity: nonNegativeInt("La quantite initiale"),
});

const productCreateSchema = z.object({
  codeBarres: requiredString("Le code-barres"),
  nom: requiredString("Le nom du produit"),
  categorie: requiredString("La categorie"),
  prixAchat: nonNegativeNumber("Le prix d'achat"),
  prixVente: nonNegativeNumber("Le prix de vente"),
  seuilMinimum: nonNegativeInt("Le seuil minimum").optional(),
  estActif: optionalBoolean("Le statut actif"),
  fournisseurId: optionalPositiveInt("Le fournisseur"),
  initialStocks: z
    .array(initialStockSchema, {
      invalid_type_error: "Les stocks initiaux doivent etre un tableau valide.",
    })
    .optional(),
});

const productUpdateSchema = z.object({
  codeBarres: requiredString("Le code-barres").optional(),
  nom: requiredString("Le nom du produit").optional(),
  categorie: requiredString("La categorie").optional(),
  prixAchat: nonNegativeNumber("Le prix d'achat").optional(),
  prixVente: nonNegativeNumber("Le prix de vente").optional(),
  seuilMinimum: nonNegativeInt("Le seuil minimum").optional(),
  estActif: optionalBoolean("Le statut actif"),
  fournisseurId: optionalPositiveInt("Le fournisseur"),
});

const supplierCreateSchema = z.object({
  nom: requiredString("Le nom du fournisseur"),
  email: optionalEmailString("L'email"),
  telephone: optionalPhoneString("Le telephone"),
  adresse: optionalString("L'adresse"),
});

const supplierUpdateSchema = z.object({
  nom: requiredString("Le nom du fournisseur").optional(),
  email: optionalEmailString("L'email"),
  telephone: optionalPhoneString("Le telephone"),
  adresse: optionalString("L'adresse"),
});

const userCreateSchema = z.object({
  nom: requiredString("Le nom"),
  email: emailString("L'email"),
  motDePasse: requiredString("Le mot de passe"),
  role: requiredString("Le role"),
  estActif: optionalBoolean("Le statut actif"),
  pointDeVenteId: optionalPositiveInt("Le point de vente"),
  caisseId: optionalPositiveInt("La caisse"),
});

const userUpdateSchema = z.object({
  nom: requiredString("Le nom").optional(),
  email: emailString("L'email").optional(),
  motDePasse: requiredString("Le mot de passe").optional(),
  role: requiredString("Le role").optional(),
  estActif: optionalBoolean("Le statut actif"),
  pointDeVenteId: optionalPositiveInt("Le point de vente"),
  caisseId: optionalPositiveInt("La caisse"),
});

const authRegisterSchema = z.object({
  nom: requiredString("Le nom"),
  email: emailString("L'email"),
  motDePasse: requiredString("Le mot de passe"),
  role: optionalString("Le role"),
  pointDeVenteId: optionalPositiveInt("Le point de vente"),
  caisseId: optionalPositiveInt("La caisse"),
});

module.exports = {
  loginSchema,
  authLoginSchema,
  customerCreateSchema,
  customerCreditPaymentSchema,
  saleCreateSchema,
  stockEntrySchema,
  stockCorrectionSchema,
  productCreateSchema,
  productUpdateSchema,
  supplierCreateSchema,
  supplierUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
  authRegisterSchema,
};

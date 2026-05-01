-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_name_key" ON "Organisation"("name");

-- Seed a legacy organisation for existing records before making organisationId mandatory.
INSERT INTO "Organisation" ("id", "name", "createdAt", "updatedAt")
VALUES ('organisation-legacy', 'Legacy Organisation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "PointDeVente" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "LoginApprovalRequest" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Caisse" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Fournisseur" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Produit" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Client" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "PaiementClient" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Stock" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Vente" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "VenteLigne" ADD COLUMN "organisationId" TEXT;
ALTER TABLE "Retour" ADD COLUMN "organisationId" TEXT;

-- Backfill existing rows
UPDATE "PointDeVente" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Utilisateur" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "LoginApprovalRequest" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Caisse" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Fournisseur" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Produit" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Client" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "PaiementClient" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Stock" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "StockMovement" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Vente" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "VenteLigne" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;
UPDATE "Retour" SET "organisationId" = 'organisation-legacy' WHERE "organisationId" IS NULL;

-- Make columns required
ALTER TABLE "PointDeVente" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "LoginApprovalRequest" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Caisse" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Fournisseur" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Produit" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "PaiementClient" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Stock" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "StockMovement" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Vente" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "VenteLigne" ALTER COLUMN "organisationId" SET NOT NULL;
ALTER TABLE "Retour" ALTER COLUMN "organisationId" SET NOT NULL;

-- Drop old global uniques to replace them with tenant-aware uniques
DROP INDEX IF EXISTS "Caisse_code_key";
DROP INDEX IF EXISTS "Fournisseur_email_key";
DROP INDEX IF EXISTS "Produit_codeBarres_key";
DROP INDEX IF EXISTS "Client_numeroClient_key";
DROP INDEX IF EXISTS "Stock_produitId_pointDeVenteId_key";

-- CreateIndex
CREATE INDEX "PointDeVente_organisationId_idx" ON "PointDeVente"("organisationId");
CREATE INDEX "Utilisateur_organisationId_idx" ON "Utilisateur"("organisationId");
CREATE INDEX "LoginApprovalRequest_organisationId_idx" ON "LoginApprovalRequest"("organisationId");
CREATE INDEX "Caisse_organisationId_idx" ON "Caisse"("organisationId");
CREATE INDEX "Fournisseur_organisationId_idx" ON "Fournisseur"("organisationId");
CREATE INDEX "Produit_organisationId_idx" ON "Produit"("organisationId");
CREATE INDEX "Client_organisationId_idx" ON "Client"("organisationId");
CREATE INDEX "PaiementClient_organisationId_idx" ON "PaiementClient"("organisationId");
CREATE INDEX "Stock_organisationId_idx" ON "Stock"("organisationId");
CREATE INDEX "StockMovement_organisationId_idx" ON "StockMovement"("organisationId");
CREATE INDEX "Vente_organisationId_idx" ON "Vente"("organisationId");
CREATE INDEX "VenteLigne_organisationId_idx" ON "VenteLigne"("organisationId");
CREATE INDEX "Retour_organisationId_idx" ON "Retour"("organisationId");

-- Create tenant-aware unique indexes
CREATE UNIQUE INDEX "Caisse_organisationId_code_key" ON "Caisse"("organisationId", "code");
CREATE UNIQUE INDEX "Fournisseur_organisationId_email_key" ON "Fournisseur"("organisationId", "email");
CREATE UNIQUE INDEX "Produit_organisationId_codeBarres_key" ON "Produit"("organisationId", "codeBarres");
CREATE UNIQUE INDEX "Client_organisationId_numeroClient_key" ON "Client"("organisationId", "numeroClient");
CREATE UNIQUE INDEX "Stock_organisationId_produitId_pointDeVenteId_key" ON "Stock"("organisationId", "produitId", "pointDeVenteId");

-- AddForeignKey
ALTER TABLE "PointDeVente" ADD CONSTRAINT "PointDeVente_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoginApprovalRequest" ADD CONSTRAINT "LoginApprovalRequest_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Caisse" ADD CONSTRAINT "Caisse_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fournisseur" ADD CONSTRAINT "Fournisseur_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaiementClient" ADD CONSTRAINT "PaiementClient_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenteLigne" ADD CONSTRAINT "VenteLigne_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Retour" ADD CONSTRAINT "Retour_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

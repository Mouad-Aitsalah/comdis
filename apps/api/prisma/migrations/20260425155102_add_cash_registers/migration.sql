/*
  Warnings:

  - Added the required column `caisseId` to the `Vente` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "caisseId" INTEGER;

-- AlterTable
ALTER TABLE "Vente" ADD COLUMN     "caisseId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Caisse" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pointDeVenteId" INTEGER NOT NULL,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caisse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Caisse_code_key" ON "Caisse"("code");

-- CreateIndex
CREATE INDEX "Caisse_pointDeVenteId_idx" ON "Caisse"("pointDeVenteId");

-- CreateIndex
CREATE INDEX "Caisse_estActive_idx" ON "Caisse"("estActive");

-- CreateIndex
CREATE UNIQUE INDEX "Caisse_pointDeVenteId_nom_key" ON "Caisse"("pointDeVenteId", "nom");

-- CreateIndex
CREATE INDEX "Utilisateur_caisseId_idx" ON "Utilisateur"("caisseId");

-- CreateIndex
CREATE INDEX "Vente_caisseId_idx" ON "Vente"("caisseId");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_caisseId_fkey" FOREIGN KEY ("caisseId") REFERENCES "Caisse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caisse" ADD CONSTRAINT "Caisse_pointDeVenteId_fkey" FOREIGN KEY ("pointDeVenteId") REFERENCES "PointDeVente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_caisseId_fkey" FOREIGN KEY ("caisseId") REFERENCES "Caisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockMovementType" ADD VALUE 'CANCEL';
ALTER TYPE "StockMovementType" ADD VALUE 'RETURN';

-- AlterTable
ALTER TABLE "Vente" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';

-- CreateTable
CREATE TABLE "Retour" (
    "id" SERIAL NOT NULL,
    "venteId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "raison" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Retour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Retour_venteId_idx" ON "Retour"("venteId");

-- CreateIndex
CREATE INDEX "Retour_produitId_idx" ON "Retour"("produitId");

-- AddForeignKey
ALTER TABLE "Retour" ADD CONSTRAINT "Retour_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retour" ADD CONSTRAINT "Retour_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

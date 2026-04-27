-- CreateTable
CREATE TABLE "PaiementClient" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaiementClient_clientId_idx" ON "PaiementClient"("clientId");

-- CreateIndex
CREATE INDEX "PaiementClient_createdAt_idx" ON "PaiementClient"("createdAt");

-- AddForeignKey
ALTER TABLE "PaiementClient" ADD CONSTRAINT "PaiementClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

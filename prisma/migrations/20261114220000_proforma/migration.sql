-- CreateTable
CREATE TABLE "Proforma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "orderId" TEXT,
    "quoteId" TEXT,
    "customerName" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "addressLine" TEXT NOT NULL DEFAULT '',
    "lines" TEXT NOT NULL DEFAULT '[]',
    "subtotalGnf" BIGINT,
    "shippingGnf" BIGINT,
    "shippingPending" BOOLEAN NOT NULL DEFAULT false,
    "totalGnf" BIGINT,
    "pricePending" BOOLEAN NOT NULL DEFAULT false,
    "includesDemo" BOOLEAN NOT NULL DEFAULT false,
    "deliveryName" TEXT NOT NULL DEFAULT '',
    "sourceReference" TEXT NOT NULL,
    "sentStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "sentError" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proforma_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proforma_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_number_key" ON "Proforma"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_orderId_key" ON "Proforma"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_quoteId_key" ON "Proforma"("quoteId");

-- CreateIndex
CREATE INDEX "Proforma_email_idx" ON "Proforma"("email");

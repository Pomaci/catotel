-- Create storage for admin pricing rules used by the dashboard
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL,
    "multiCatDiscountEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "multiCatDiscounts" JSONB,
    "sharedRoomDiscountEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "sharedRoomDiscountPercent" DECIMAL(5, 2),
    "sharedRoomDiscounts" JSONB,
    "longStayDiscountEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "longStayDiscounts" JSONB,
    "longStayDiscount" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

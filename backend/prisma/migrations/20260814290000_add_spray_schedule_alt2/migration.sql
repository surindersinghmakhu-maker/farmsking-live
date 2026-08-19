-- AlterTable
ALTER TABLE "spray_schedules"
  ADD COLUMN "alternativeOption2" TEXT;

-- CreateTable
CREATE TABLE "spray_product_catalog" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sprayType" "SprayType",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "spray_product_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spray_product_catalog_name_key" ON "spray_product_catalog"("name");

-- Seed common products
INSERT INTO "spray_product_catalog" ("id", "name", "sprayType") VALUES
  (gen_random_uuid(), 'Propiconazole 25% EC', 'FUNGICIDE'),
  (gen_random_uuid(), 'Mancozeb 75% WP', 'FUNGICIDE'),
  (gen_random_uuid(), 'Imidacloprid 17.8% SL', 'INSECTICIDE'),
  (gen_random_uuid(), 'Neem Oil 10000 PPM', 'PESTICIDE'),
  (gen_random_uuid(), 'Trichoderma Viride Bio-Fungicide', 'FUNGICIDE'),
  (gen_random_uuid(), 'Chlorpyrifos 20% EC', 'INSECTICIDE'),
  (gen_random_uuid(), 'Carbendazim 50% WP', 'FUNGICIDE'),
  (gen_random_uuid(), 'Copper Oxychloride 50% WP', 'FUNGICIDE'),
  (gen_random_uuid(), 'Sulphur 80% WP', 'FUNGICIDE'),
  (gen_random_uuid(), 'Zinc Sulphate', 'OTHER'),
  (gen_random_uuid(), 'Urea', 'OTHER'),
  (gen_random_uuid(), 'DAP (Di-Ammonium Phosphate)', 'OTHER'),
  (gen_random_uuid(), 'NPK 19:19:19', 'OTHER'),
  (gen_random_uuid(), 'Humic Acid & Bio-Stimulant', 'OTHER'),
  (gen_random_uuid(), 'Bavistin (Carbendazim)', 'FUNGICIDE');

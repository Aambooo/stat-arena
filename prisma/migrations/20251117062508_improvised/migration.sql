/*
  Warnings:

  - Added the required column `updated_at` to the `contact_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contact_requests" ADD COLUMN     "package" TEXT,
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "preferred_start_date" TIMESTAMP(3),
ADD COLUMN     "target_url" TEXT,
ADD COLUMN     "transaction_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;

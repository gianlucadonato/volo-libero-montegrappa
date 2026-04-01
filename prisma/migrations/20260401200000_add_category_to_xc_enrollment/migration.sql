-- Drop old unique constraint
ALTER TABLE "xc_enrollments" DROP CONSTRAINT IF EXISTS "xc_enrollments_user_id_edition_id_key";

-- Add category_id column (nullable initially)
ALTER TABLE "xc_enrollments" ADD COLUMN IF NOT EXISTS "category_id" TEXT;

-- We need to update existing rows with a valid category_id if any exist
-- Since enrollment started fresh, we can just delete any existing data
-- or provide a default. If there are no rows this is a no-op.
DELETE FROM "xc_enrollments" WHERE "category_id" IS NULL;

-- Make category_id NOT NULL
ALTER TABLE "xc_enrollments" ALTER COLUMN "category_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "xc_enrollments" ADD CONSTRAINT "xc_enrollments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "xc_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new unique constraint
ALTER TABLE "xc_enrollments" ADD CONSTRAINT "xc_enrollments_user_id_edition_id_category_id_key" UNIQUE ("user_id", "edition_id", "category_id");

-- Add new index
CREATE INDEX IF NOT EXISTS "xc_enrollments_user_id_edition_id_idx" ON "xc_enrollments"("user_id", "edition_id");

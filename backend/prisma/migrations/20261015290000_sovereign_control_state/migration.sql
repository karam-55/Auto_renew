CREATE TABLE IF NOT EXISTS "_sovereign_control" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "changed_by" TEXT,
  "changed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "_sovereign_control_pkey" PRIMARY KEY ("id")
);

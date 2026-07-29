-- Baselining SQL for Prisma migrations
-- Run this script ONCE on the production server before using `prisma migrate deploy`
-- It creates the _prisma_migrations table (if missing) and marks all existing migrations as already applied.

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                      VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum"                VARCHAR(64) NOT NULL,
  "finished_at"             TIMESTAMPTZ,
  "migration_name"          VARCHAR(255) NOT NULL,
  "logs"                    TEXT,
  "rolled_back_at"          TIMESTAMPTZ,
  "started_at"              TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count"     INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "_prisma_migrations_migration_name_key" ON "_prisma_migrations" ("migration_name");

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '2fa0cc5e-af0b-4636-8db8-45e6064850fa', 'e05b1eda900e55fa479ae7b04760a4644f5e8892b371418853d81d900348fb01', now(), '20250620194000_add_department_salary_and_service_department_relation', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '8bfaa19e-daff-49ea-87b8-dd2161f52aee', '2645a76ae453c1f4a7661db1e1a49cfb304a3698611d8f56871eb3392019cc7a', now(), '20260525181258_init', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'b64bf886-058a-4910-921b-17a2e1fd2d84', '852604cb4953e8ca4b5b26858aecaef9b27ca19bc77e6a13fcb8880e4a8f598f', now(), '20260526011048_init', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'bf7c9661-0a14-4af8-971b-ec67899ee86b', '864c855a2113d23a0cb4d8cb70b4f2b89f334c8f1e6c46e8499a9d3790065c66', now(), '20260526021238_init', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'b356333c-bbd6-4a3a-abe9-0b404f41920d', '6156a616f433aebbd51d4eb95d0262aca6f245b15878fb3f7adc891b8c7b86b9', now(), '20260528113938_add_service_to_invoice_item', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '6dfcc568-ffd0-4632-a8c8-b0f42f849acc', 'a909acee203fd986c28a6fcf12efd3c30d3fbefeadc92cc40b953c6207249e1c', now(), '20260528134430_add_invoice_integration_to_inventory_transaction', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '7c415cc8-ae67-4e18-86f8-9ff239f1e070', '26b9a026328afddd087d6ca5c6bf30a5720bf6c2edd878bb77b62fb9a5df991e', now(), '20260528135405_add_service_parts_model', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '65d72a6d-9120-40d9-9ad0-b2531c31ed5b', '76988abe68e94a72a22829bac51dc8738fe4dd4b6cd87a0a95bd609c851b32e8', now(), '20260528141108_add_auto_update_purchase_price', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'edd9532e-b0c0-4f44-a0c4-0bb16f85bcd7', '2f5ead75e7c1c7326ae89b3c7e88a98b4d8717c9a21e5575afe69de014f28c26', now(), '20260528152531_add_profitability_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '7634c138-9fd0-42ce-9095-756c71d2eeae', '939fec8411529e2ced7f0e57a5a8bbed62ef8a0f1d1bdf6358a02c2eca56b3f2', now(), '20260528154049_add_technician_schedule', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '21613b74-d382-43d8-9fc2-fa2c25888920', '4da7822ab136c75fbc0d57c80c1ac94f39122e176d10540b3be0d1e472404646', now(), '20260528160313_phase_h_vehicle_management', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '90a08a8d-2f05-4c62-b19d-eecd2b2c2cae', 'af82c59db57f371e8e762ff356678defdc9d262681ef4d71dedb3ae8612217b3', now(), '20260528161915_add_whatsapp_settings', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '49521a1b-8f41-4a10-aa29-3bae4c94ce41', '119f5b7164bba87db9ef6422e000b0355c3926710d22b6eff46d74b96bb4a0fb', now(), '20260528163114_add_membership_loyalty_wallet', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'bebb675b-6126-49bd-8943-3fd6b09835e4', 'c78cf90b6b4200f2fd65b5a059eee5fc6169117047d139c88f27f9b754feb71a', now(), '20260528165510_phase_k_multi_branch', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'ff04f1f5-8936-486e-ace1-893b4e0888e5', '2e2feed9f6f9a3c914c9cdd45bbbc09b48964927ee6e6cf5f7fd64f598b74111', now(), '20260528170747_add_employee_branch', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '1d0d11f0-7f84-48f6-bc06-389b0e68cf11', '3dcb5968b029b40fec858950a12f351eefac560b826d7263b8e3b718641820cb', now(), '20260528173040_phase_l_rbac', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '52648b35-bb8d-4a29-b37d-d2dacdf2821d', '00908f614562e87f0a2ee08aa9dfd86255ab024467430aa08e09faa50b054d5b', now(), '20260528174843_update_audit_log_model', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '205cd566-a614-44b1-9469-fb1b78aa86fb', '474401eb2c8516380b83a83f4e16373bb9e3ef28617b91fca78c0d53b6d3b9d3', now(), '20260528182433_add_company_settings_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'dcc241f3-75cc-4f23-a31f-955f21009c5e', '6133779d40be3185e9b6e97f26237778b7c91f58cc3cd146e72c461db79a25be', now(), '20260528223519_add_account_lockout_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '529a4403-8f09-4da5-9439-725b0a4d4a7a', 'eddeef01866a7ef0a8fa43b942489bf3ababa07bc8e036aa58e3d4b496b6e891', now(), '20260602102931_add_supplierid_to_inventory_transaction', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'ab8bde56-3b60-4c97-996c-758c5a67b220', '693b9ac3f2a55f55cec1158237e00942b293f20eeb76665b11603a1560106b8f', now(), '20260610031433_add_vehicle_categories', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '52a45480-a98e-42ca-b345-5c0c79fda915', 'a7bd250f7e04b0ec910797bce964537cdf3487b68cca24293ee3a14890d67050', now(), '20260610085608_add_service_categories', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '889e36a7-4d82-4a51-af8a-7e192fbca659', 'b2ede83e42966272bdc9c9225f838ba8a37e8571ac96dc3e5510a109d5711be5', now(), '20260612225050_add_vehicle_attachment_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '48da8bfc-396f-4a64-9a2a-bdc2571dc498', '5260ea5489a7b8b5c00f3afae04bf53e45756c53b9a05932dc242462630bc0da', now(), '20260615005420_add_soft_delete_and_relation_fixes', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'a88eacc0-91e0-4141-a747-df992c8e6072', '29c1c2d1acedc618b48bd037d3947a45ebf464f41ada5fe8974f4bf8d1678992', now(), '20260615010928_add_timestamps_and_final_relation_fixes', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '2acb6e88-aab9-4313-bc7d-6f08d61d5e9e', 'b7b5334356b7d38c0dc968aac60b75c253f247db8c00220736a2c1f87e16730b', now(), '20260615011241_add_missing_timestamps', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'b9a549e4-eca7-4f8d-8eed-f5cb01e96b8a', '9dadd8f4566cef4fd35d12409e07ced1b65125135c5a69111f736580575ce85a', now(), '20260617121013_add_dealer_document', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'a9583d21-6f04-4c35-9731-cc4041dc0018', 'b2ac71be710d47714accc66f62787ddd1bd0be9f68aea622dba500565ca4b42a', now(), '20260617225427_add_service_costs_warranty_loyalty_booking_payment_invoice_discounts', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '1fb2c7d2-4a4a-45c6-b22f-75a131ef9471', '19946506ab3f7adf8eea47dffd430d96d56a0b33e275e2fecaefcbb6bd55b523', now(), '20260618100532_add_vehicle_to_invoice', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '84112e81-a791-494a-82c0-d82f9d3fb6f4', '6c62f45e34587934f301f55090655da8893a7ce38889cd4611414cba85947dc5', now(), '20260618151931_add_cogs_account_category', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '58ecb32a-5f92-4dcc-ae7b-6e56793ce146', '2d108d06f31be685f34c49de1716324b947a9e93812e1b35f5a4baa609e94f06', now(), '20260618174916_add_exchange_rate_and_profit_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '6d913e1a-cd8e-4033-921b-564cb5d82422', '9a7d6cb223d70783f26218219540d5099fe25c32e88ac05b8726ad6979ff5601', now(), '20260618185319_add_cost_centers_assets_job_costing', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '4d73efa2-6990-4b0a-93b4-a5e408aa0375', '9c4b17ab012d49014dea3b19cd3428f1959b28a20502151ccd0d3d8d26a2cb91', now(), '20260618191930_add_costing_settings', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '5d1e3bc2-df2d-42d1-9c9c-76703b493703', '4368083db8b44485ffb9249f9b40070be3cc0f59f6b68878b06eb6043208c5b6', now(), '20260618193124_fix_service_cost_detail_relations', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'd53043c2-6689-412b-9c03-04513e4c86c6', 'c74e8f58205c2d4ab5a5e184aaf2bab091488b12a407454d621c34d0cfa4fd37', now(), '20260618201631_add_wizard_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '515d52e2-1f22-4907-90c8-a335b0dc122b', 'b9c675ef771a9ffdddf4c8e268fd379512b6b7af51ae533125efe66d6ebf6483', now(), '20260620003000_add_service_profit_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '6bbc5842-cf54-47dd-ade4-27a8c8e850bc', '8803cbfc61c36b3a39e75148a2763dd9f7a385a0ae63f15520081f5372e41fc6', now(), '20260622045545_add_warranty_currency', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

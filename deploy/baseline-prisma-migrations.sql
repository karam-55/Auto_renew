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
  '5346d28c-8b2c-426a-b4ee-5d218f661ea3', 'e05b1eda900e55fa479ae7b04760a4644f5e8892b371418853d81d900348fb01', now(), '20250620194000_add_department_salary_and_service_department_relation', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'fe47ed41-f7a5-4b8a-b835-2714f0821d4f', '2645a76ae453c1f4a7661db1e1a49cfb304a3698611d8f56871eb3392019cc7a', now(), '20260525181258_init', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '7d5c721f-0437-4087-a3b4-b236f358ee83', '852604cb4953e8ca4b5b26858aecaef9b27ca19bc77e6a13fcb8880e4a8f598f', now(), '20260526011048_init', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'cc6fc798-8c96-48a9-98f0-1e4829519d75', '864c855a2113d23a0cb4d8cb70b4f2b89f334c8f1e6c46e8499a9d3790065c66', now(), '20260526021238_init', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'f49dfe01-f64a-4471-88c6-781986973824', '6156a616f433aebbd51d4eb95d0262aca6f245b15878fb3f7adc891b8c7b86b9', now(), '20260528113938_add_service_to_invoice_item', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '46b39dba-5587-4951-8b2b-420959c542e9', 'a909acee203fd986c28a6fcf12efd3c30d3fbefeadc92cc40b953c6207249e1c', now(), '20260528134430_add_invoice_integration_to_inventory_transaction', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '6b1adaeb-590c-4f8b-973a-d53a08b26d90', '26b9a026328afddd087d6ca5c6bf30a5720bf6c2edd878bb77b62fb9a5df991e', now(), '20260528135405_add_service_parts_model', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '026701ac-795d-4eb9-9e1a-a206c3ac20ca', '76988abe68e94a72a22829bac51dc8738fe4dd4b6cd87a0a95bd609c851b32e8', now(), '20260528141108_add_auto_update_purchase_price', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'a1082a90-1c79-4f1d-a67f-a8c5b8979959', '2f5ead75e7c1c7326ae89b3c7e88a98b4d8717c9a21e5575afe69de014f28c26', now(), '20260528152531_add_profitability_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'd2c8bfae-b4f7-445c-981e-4a21e04cb0b7', '939fec8411529e2ced7f0e57a5a8bbed62ef8a0f1d1bdf6358a02c2eca56b3f2', now(), '20260528154049_add_technician_schedule', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'ef298df6-8a05-4721-9eb7-4eaca8ff85ed', '4da7822ab136c75fbc0d57c80c1ac94f39122e176d10540b3be0d1e472404646', now(), '20260528160313_phase_h_vehicle_management', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '8b2babd7-0818-42ee-bff6-c7ff7ba22f6d', 'af82c59db57f371e8e762ff356678defdc9d262681ef4d71dedb3ae8612217b3', now(), '20260528161915_add_whatsapp_settings', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '4731f0b9-183c-489a-92a6-70dfdd84a907', '119f5b7164bba87db9ef6422e000b0355c3926710d22b6eff46d74b96bb4a0fb', now(), '20260528163114_add_membership_loyalty_wallet', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '1abc709d-ca53-4395-9562-7f28531ac608', 'c78cf90b6b4200f2fd65b5a059eee5fc6169117047d139c88f27f9b754feb71a', now(), '20260528165510_phase_k_multi_branch', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '677b808c-628e-4933-b4ac-b564f4f3c3e9', '2e2feed9f6f9a3c914c9cdd45bbbc09b48964927ee6e6cf5f7fd64f598b74111', now(), '20260528170747_add_employee_branch', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '09c2b06f-46a3-4769-b224-9e7668e1525c', '3dcb5968b029b40fec858950a12f351eefac560b826d7263b8e3b718641820cb', now(), '20260528173040_phase_l_rbac', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'b9d71e19-94ff-44ca-bb38-0dee94aa217b', '00908f614562e87f0a2ee08aa9dfd86255ab024467430aa08e09faa50b054d5b', now(), '20260528174843_update_audit_log_model', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'aa0f67dc-2a81-42fb-a91a-3f3b79a4d4dd', '474401eb2c8516380b83a83f4e16373bb9e3ef28617b91fca78c0d53b6d3b9d3', now(), '20260528182433_add_company_settings_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '7303ba53-61e8-4f7b-baa3-701d03b5217b', '6133779d40be3185e9b6e97f26237778b7c91f58cc3cd146e72c461db79a25be', now(), '20260528223519_add_account_lockout_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '95e465f0-2144-4347-8636-4228a3caa790', 'eddeef01866a7ef0a8fa43b942489bf3ababa07bc8e036aa58e3d4b496b6e891', now(), '20260602102931_add_supplierid_to_inventory_transaction', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '3fa3b50f-ccd7-4a56-80f2-998135587a27', '693b9ac3f2a55f55cec1158237e00942b293f20eeb76665b11603a1560106b8f', now(), '20260610031433_add_vehicle_categories', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'dccfdd02-4844-47a3-af9e-c3007a742e73', 'a7bd250f7e04b0ec910797bce964537cdf3487b68cca24293ee3a14890d67050', now(), '20260610085608_add_service_categories', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'ccef6b54-6243-4b7f-aed0-494492175ccf', 'b2ede83e42966272bdc9c9225f838ba8a37e8571ac96dc3e5510a109d5711be5', now(), '20260612225050_add_vehicle_attachment_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '73268e67-9981-4646-88ad-781f08c0b453', '5260ea5489a7b8b5c00f3afae04bf53e45756c53b9a05932dc242462630bc0da', now(), '20260615005420_add_soft_delete_and_relation_fixes', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'b7ba8a32-23d0-4fba-aebe-20e812452b2e', '29c1c2d1acedc618b48bd037d3947a45ebf464f41ada5fe8974f4bf8d1678992', now(), '20260615010928_add_timestamps_and_final_relation_fixes', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '1c09a8b1-c355-4c4a-8fe1-c56b2f8667d8', 'b7b5334356b7d38c0dc968aac60b75c253f247db8c00220736a2c1f87e16730b', now(), '20260615011241_add_missing_timestamps', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '3c1a58e6-097c-49ba-aec5-49543351c88d', '9dadd8f4566cef4fd35d12409e07ced1b65125135c5a69111f736580575ce85a', now(), '20260617121013_add_dealer_document', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '39723470-0744-49c5-af52-6e9e16efb513', 'b2ac71be710d47714accc66f62787ddd1bd0be9f68aea622dba500565ca4b42a', now(), '20260617225427_add_service_costs_warranty_loyalty_booking_payment_invoice_discounts', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '2a4e4deb-0bde-486c-a2c4-45546598f331', '19946506ab3f7adf8eea47dffd430d96d56a0b33e275e2fecaefcbb6bd55b523', now(), '20260618100532_add_vehicle_to_invoice', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '561a0c5e-6477-46bf-8459-0f39004e748f', '6c62f45e34587934f301f55090655da8893a7ce38889cd4611414cba85947dc5', now(), '20260618151931_add_cogs_account_category', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '83dc0cc2-e10f-44e3-8d1e-5343ddbc2232', '2d108d06f31be685f34c49de1716324b947a9e93812e1b35f5a4baa609e94f06', now(), '20260618174916_add_exchange_rate_and_profit_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '4fa7173f-028b-4497-9ddc-fedb7bff3d5a', '9a7d6cb223d70783f26218219540d5099fe25c32e88ac05b8726ad6979ff5601', now(), '20260618185319_add_cost_centers_assets_job_costing', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'c4fd023d-483c-4b37-aad9-7349aa18faac', '9c4b17ab012d49014dea3b19cd3428f1959b28a20502151ccd0d3d8d26a2cb91', now(), '20260618191930_add_costing_settings', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '62a6dd1e-05ac-41db-b23b-34f83ba08260', '4368083db8b44485ffb9249f9b40070be3cc0f59f6b68878b06eb6043208c5b6', now(), '20260618193124_fix_service_cost_detail_relations', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  'd1de1f53-c93c-4b08-b449-90cc0d3ba075', 'c74e8f58205c2d4ab5a5e184aaf2bab091488b12a407454d621c34d0cfa4fd37', now(), '20260618201631_add_wizard_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '3e809548-9d22-41fe-a543-745bb7270fb5', 'b9c675ef771a9ffdddf4c8e268fd379512b6b7af51ae533125efe66d6ebf6483', now(), '20260620003000_add_service_profit_fields', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
) VALUES (
  '3895bcbb-400d-425e-8767-f39cbf70aae6', '8803cbfc61c36b3a39e75148a2763dd9f7a385a0ae63f15520081f5372e41fc6', now(), '20260622045545_add_warranty_currency', NULL, NULL, now(), 1
)
ON CONFLICT ("migration_name") DO NOTHING;

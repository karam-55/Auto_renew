-- Fixed service catalog: per-service pricing behaviour + per-service materials/panels.

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "serviceType" TEXT NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "BookingService" ADD COLUMN IF NOT EXISTS "customName" TEXT;
ALTER TABLE "BookingService" ADD COLUMN IF NOT EXISTS "panels" TEXT;

CREATE TABLE IF NOT EXISTS "BookingServiceMaterial" (
    "id" TEXT NOT NULL,
    "bookingServiceId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingServiceMaterial_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BookingServiceMaterial_bookingServiceId_fkey" FOREIGN KEY ("bookingServiceId") REFERENCES "BookingService"("id") ON DELETE CASCADE,
    CONSTRAINT "BookingServiceMaterial_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id")
);

CREATE INDEX IF NOT EXISTS "BookingServiceMaterial_bookingServiceId_idx" ON "BookingServiceMaterial"("bookingServiceId");
CREATE INDEX IF NOT EXISTS "BookingServiceMaterial_partId_idx" ON "BookingServiceMaterial"("partId");

-- Replace the free-form service list with the fixed 13-service catalog.
UPDATE "Service" SET "isActive" = false WHERE "tenantId" = 'default';

INSERT INTO "Service" ("id","tenantId","name","nameAr","nameEn","serviceType","priceSYP","priceUSD","isActive","createdAt","updatedAt") VALUES
('svc-oil-warranty',   'default','تغيير زيت كفالة','تغيير زيت كفالة','Warranty Oil Change','OIL_WARRANTY',0,0,true,NOW(),NOW()),
('svc-oil-regular',    'default','تغيير زيت دوري','تغيير زيت دوري','Regular Oil Change','OIL_PAID',0,0,true,NOW(),NOW()),
('svc-car-spray',      'default','بخ السيارة','بخ السيارة','Car Spray/Paint','JOB_BASED',0,0,true,NOW(),NOW()),
('svc-full-inspection','default','فحص شامل','فحص شامل','Full Inspection','FIXED',13900,100,true,NOW(),NOW()),
('svc-computer-scan',  'default','فحص كومبيوتر','فحص كومبيوتر','Computer Scan','FIXED',6950,50,true,NOW(),NOW()),
('svc-maintenance',    'default','صيانة السيارة','صيانة السيارة','Car Maintenance','JOB_BASED',0,0,true,NOW(),NOW()),
('svc-denting',        'default','تصويج','تصويج','Denting / Bodywork','PANELS',0,0,true,NOW(),NOW()),
('svc-wash-exterior',  'default','غسيل سيارة خارجي','غسيل سيارة خارجي','Exterior Wash','VARIABLE',0,NULL,true,NOW(),NOW()),
('svc-wash-both',      'default','غسيل خارجي داخلي','غسيل خارجي داخلي','Interior+Exterior Wash','VARIABLE',0,NULL,true,NOW(),NOW()),
('svc-ppf',            'default','حماية PPF','حماية PPF','PPF Protection','JOB_BASED',0,0,true,NOW(),NOW()),
('svc-custom',         'default','خدمة مخصصة','خدمة مخصصة','Custom Service','CUSTOM',0,0,true,NOW(),NOW()),
('svc-arabize',        'default','تعريب مع باكيج تطبيقات','تعريب مع باكيج تطبيقات','Arabize + Apps Package','EDITABLE',13900,100,true,NOW(),NOW()),
('svc-system-update',  'default','تحديث نظام السيارة','تحديث نظام السيارة','Car System Update','EDITABLE',3475,25,true,NOW(),NOW())
ON CONFLICT ("id") DO NOTHING;

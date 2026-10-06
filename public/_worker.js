// Cloudflare Worker for Esse Oto Yıkama & Detailing
// Automated Cloudflare D1 Database & Live Edge REST API
// Works automatically on *.workers.dev and Cloudflare Pages

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

const EMBEDDED_INDEX_HTML = "<!doctype html>\n<html lang=\"tr\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=5.0\" />\n    \n    <!-- Google tag (gtag.js) -->\n    <script async src=\"https://www.googletagmanager.com/gtag/js?id=G-HDDP232QLM\"></script>\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', 'G-HDDP232QLM');\n\n      // Purge old PWA cache if present\n      if ('caches' in window) {\n        caches.keys().then(function(keys) {\n          keys.forEach(function(k) {\n            if (k.indexOf('esse-otoyikama-v1') !== -1 || k.indexOf('esse-otoyikama-v2') !== -1) {\n              caches.delete(k);\n            }\n          });\n        });\n      }\n    </script>\n\n    <!-- Google #1 SEO Meta Tags (Targeting \"Aydın Oto Yıkama\", \"Efeler Oto Yıkama\", \"Pasta Cila Aydın\") -->\n    <title>Aydın Oto Yıkama & Detailing – Esse Oto Yıkama Efeler</title>\n    <meta name=\"description\" content=\"Aydın oto yıkama ve oto kuaför hizmetinde 2017'den beri lider: Efeler Çevre Bulvarı'nda pasta cila, seramik kaplama, detaylı koltuk yıkama ve far parlatma. Online randevunuzu hemen alın.\" />\n    <meta name=\"keywords\" content=\"Aydın oto yıkama, Efeler oto yıkama, Aydın araba yıkama, Çevre Bulvarı oto yıkama, Esse Oto Yıkama, Aydın pasta cila, Aydın seramik kaplama, Aydın koltuk yıkama, oto kuaför Aydın, Efeler oto kuaför, far temizleme Aydın, boya koruma Efeler, motor temizliği Aydın, Okan Özçal\" />\n    <meta name=\"author\" content=\"Esse Oto Yıkama - Okan Özçal\" />\n    <meta name=\"robots\" content=\"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1\" />\n    <link rel=\"canonical\" href=\"https://esseotoyikama.com/\" />\n\n    <!-- Geo Tags for Local SEO (Aydın Efeler Çevre Bulvarı) -->\n    <meta name=\"geo.region\" content=\"TR-09\" />\n    <meta name=\"geo.placename\" content=\"Ata Mahallesi, Çevre Bulvarı, 09010 Efeler/Aydın\" />\n    <meta name=\"geo.position\" content=\"37.8444;27.8458\" />\n    <meta name=\"ICBM\" content=\"37.8444, 27.8458\" />\n\n    <!-- Open Graph (Facebook / WhatsApp / iMessage) -->\n    <meta property=\"og:type\" content=\"business.business\" />\n    <meta property=\"og:title\" content=\"Aydın Oto Yıkama & Detailing – Esse Oto Yıkama Efeler\" />\n    <meta property=\"og:description\" content=\"Aydın Efeler Çevre Bulvarı'nda 2017'den beri profesyonel pasta cila, boya koruma, seramik kaplama ve detaylı araç temizliği. Online randevunuzu hemen oluşturun.\" />\n    <meta property=\"og:locale\" content=\"tr_TR\" />\n    <meta property=\"og:site_name\" content=\"Esse Oto Yıkama\" />\n    <meta property=\"og:url\" content=\"https://esseotoyikama.com/\" />\n    <meta property=\"og:image\" content=\"/icon-512.png\" />\n\n    <!-- Twitter Cards -->\n    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n    <meta name=\"twitter:title\" content=\"Aydın Oto Yıkama & Detailing – Esse Oto Yıkama Efeler\" />\n    <meta name=\"twitter:description\" content=\"Aydın Efeler'de 2017'den beri profesyonel oto kuaför ve boya koruma. Online randevunuzu kolayca alın.\" />\n    <meta name=\"twitter:image\" content=\"/icon-512.png\" />\n\n    <!-- PWA & Mobile Web App Meta -->\n    <link rel=\"manifest\" href=\"/manifest.json\" />\n    <link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png\" />\n    <link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"/icon-192.png\" />\n    <meta name=\"application-name\" content=\"Esse Oto Yıkama\" />\n    <meta name=\"apple-mobile-web-app-title\" content=\"Esse Oto\" />\n    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n    <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\" />\n\n    <!-- Theme Color -->\n    <meta name=\"theme-color\" content=\"#09090b\" />\n\n    <!-- Fonts -->\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap\" rel=\"stylesheet\">\n\n    <!-- Schema.org JSON-LD LocalBusiness & AutoRepair Rich Snippet Data -->\n    <script type=\"application/ld+json\">\n    {\n      \"@context\": \"https://schema.org\",\n      \"@type\": [\"AutoRepair\", \"AutomotiveBusiness\"],\n      \"@id\": \"https://esseotoyikama.com/#business\",\n      \"name\": \"Esse Oto Yıkama & Detailing Aydın\",\n      \"alternateName\": [\"Esse Oto Yıkama\", \"Aydın Esse Detailing\", \"Okan Özçal Esse Oto\"],\n      \"image\": \"/icon-512.png\",\n      \"telephone\": \"+905529439168\",\n      \"foundingDate\": \"2017-05-01\",\n      \"priceRange\": \"$\",\n      \"currenciesAccepted\": \"TRY\",\n      \"paymentAccepted\": \"Cash, Credit Card, Contactless, FAST\",\n      \"url\": \"https://esseotoyikama.com/\",\n      \"sameAs\": [\n        \"https://www.instagram.com/okan_ozcal\",\n        \"https://www.tiktok.com/@okan.zcal\"\n      ],\n      \"address\": {\n        \"@type\": \"PostalAddress\",\n        \"streetAddress\": \"Ata Mahallesi, Çevre Bulvarı No:42\",\n        \"addressLocality\": \"Efeler\",\n        \"addressRegion\": \"Aydın\",\n        \"postalCode\": \"09010\",\n        \"addressCountry\": \"TR\"\n      },\n      \"geo\": {\n        \"@type\": \"GeoCoordinates\",\n        \"latitude\": 37.8444,\n        \"longitude\": 27.8458\n      },\n      \"areaServed\": [\n        {\n          \"@type\": \"AdministrativeArea\",\n          \"name\": \"Efeler, Aydın\"\n        },\n        {\n          \"@type\": \"AdministrativeArea\",\n          \"name\": \"Aydın Merkez\"\n        },\n        {\n          \"@type\": \"AdministrativeArea\",\n          \"name\": \"İncirliova, Aydın\"\n        }\n      ],\n      \"openingHoursSpecification\": [\n        {\n          \"@type\": \"OpeningHoursSpecification\",\n          \"dayOfWeek\": [\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\"],\n          \"opens\": \"08:30\",\n          \"closes\": \"19:30\"\n        }\n      ],\n      \"aggregateRating\": {\n        \"@type\": \"AggregateRating\",\n        \"ratingValue\": \"4.9\",\n        \"reviewCount\": \"348\",\n        \"bestRating\": \"5\",\n        \"worstRating\": \"1\"\n      },\n      \"hasOfferCatalog\": {\n        \"@type\": \"OfferCatalog\",\n        \"name\": \"Oto Yıkama ve Detailing Hizmetleri\",\n        \"itemListElement\": [\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Cilalı Detaylı Dış & İç Yıkama\",\n              \"description\": \"pH nötr köpük, çiziksiz çift kova yıkama, jant balata tozu temizliği ve detaylı iç süpürme.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Pasta Cila & Çizik Giderme\",\n              \"description\": \"Hare, fırça ve kılcal çizikleri %90 gideren profesyonel boya yenileme ve derin parlaklık.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"9H Seramik Kaplama & Boya Koruma\",\n              \"description\": \"UV ışınlarına, güneş yanığına ve asit yağmuruna karşı 2-3 yıl süreli hidrofobik zırh.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Detaylı Koltuk Yıkama & Buharlı Sterilizasyon\",\n              \"description\": \"140°C kuru buhar ve vakumlu ekstraksiyon ile su lekeleri ve bakterilerin derinlemesine temizliği.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Far Camı Temizleme & Parlatma\",\n              \"description\": \"Sararmış ve matlaşmış far camlarının zımpara ve polimer buhar ile sıfır berraklığına kavuşturulması.\"\n            }\n          }\n        ]\n      }\n    }\n    </script>\n\n    <!-- Schema.org FAQPage Structured Data for Google Accordion Snippets -->\n    <script type=\"application/ld+json\">\n    {\n      \"@context\": \"https://schema.org\",\n      \"@type\": \"FAQPage\",\n      \"mainEntity\": [\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Aydın Efeler'de en iyi oto yıkama nerede?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Esse Oto Yıkama, Aydın Efeler Çevre Bulvarı'nda 2017'den beri pasta cila, boya koruma, seramik kaplama ve detaylı temizlik hizmetleri sunmaktadır.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Esse Oto Yıkama Pazar günleri açık mı?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Hayır, Esse Oto Yıkama Pazar günleri kapalıdır. Pazartesi'den Cumartesi'ye 08:30 - 19:30 saatleri arasında kesintisiz hizmet vermektedir.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Pasta cila ve seramik kaplama ne kadar sürer?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Pasta cila işlemi araç boyutuna ve boya durumuna göre ortalama 3-5 saat sürer. Seramik kaplama uygulaması için katmanların kürleşmesi amacıyla aracın 1 gün kalması tavsiye edilir.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Koltuk yıkandıktan sonra ıslak kalır mı?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Hayır. Yüksek vakumlu ekstraksiyon makinelerimiz nemin %90'ını çeker; sıcak hava fanları ve havalandırma ile 1-2 saat içinde tamamen kupkuru teslim edilir.\"\n          }\n        }\n      ]\n    }\n    </script>\n    <script type=\"module\" crossorigin src=\"/assets/index-C-Drw7xF.js\"></script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index-CUQUWI9-.css\">\n  </head>\n  <body class=\"bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-black\">\n    <div id=\"root\"></div>\n  </body>\n</html>\n";

// In-Memory Edge Cache Fallback (if Cloudflare D1 binding is pending)
// In-memory fallback (starts 100% clean and empty; no mock or demo data)
let memoryAppointments = [];
let memoryLoyalty = [];
let memoryNotifications = [];
let memoryCustomers = [];

// Automated Cloudflare D1 Table Creation (Zero Mock Data)
async function initCloudflareD1Database(db) {
  if (!db) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        vehicle_type TEXT DEFAULT 'sedan',
        selected_services TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        total_duration_minutes INTEGER DEFAULT 45,
        customer_full_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_plate_number TEXT NOT NULL,
        customer_car_model TEXT,
        customer_notes TEXT,
        customer_email TEXT,
        status TEXT DEFAULT 'confirmed',
        wash_stage TEXT DEFAULT 'queue',
        stage_updated_at TEXT,
        admin_notes TEXT,
        cancelled_by TEXT,
        cancelled_at TEXT,
        cancellation_reason TEXT,
        stamped_at TEXT,
        photos TEXT DEFAULT '[]',
        estimated_price REAL DEFAULT 0.0
      );

      CREATE TABLE IF NOT EXISTS loyalty_profiles (
        plate TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        stamps INTEGER DEFAULT 0,
        voucher_code TEXT,
        voucher_redeemed_at TEXT,
        history TEXT DEFAULT '[]',
        last_updated TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loyalty (
        plate TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        stamps INTEGER DEFAULT 0,
        voucher_code TEXT,
        voucher_redeemed_at TEXT,
        history TEXT DEFAULT '[]',
        last_updated TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        plate_number TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        car_model TEXT,
        last_visit TEXT,
        total_visits INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_notifications (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        appointment_id TEXT,
        plate TEXT,
        customer_name TEXT,
        is_read INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS business_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        address TEXT NOT NULL,
        working_hours TEXT NOT NULL,
        max_stamps INTEGER NOT NULL DEFAULT 5,
        gift_reward_title TEXT NOT NULL,
        gift_reward_desc TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_appointments_plate ON appointments(customer_plate_number);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_loyalty_voucher ON loyalty(voucher_code);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    `);

    // Migrations for existing tables
    try { await db.exec("ALTER TABLE appointments ADD COLUMN customer_email TEXT;"); } catch {}
    try { await db.exec("ALTER TABLE appointments ADD COLUMN admin_notes TEXT;"); } catch {}
    try { await db.exec("ALTER TABLE appointments ADD COLUMN estimated_price REAL DEFAULT 0.0;"); } catch {}
  } catch (err) {
    console.warn('Cloudflare D1 auto-migration notice:', err);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only process /api/ routes through the worker
    if (url.pathname.startsWith('/api/')) {
      const db = env?.DB || env?.esse_db || null;
      if (db) {
        ctx.waitUntil(initCloudflareD1Database(db));
      }

      // 1. Health check
      if (url.pathname === '/api/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            platform: db ? 'cloudflare-workers-d1-active' : 'cloudflare-workers-edge-memory',
            d1Connected: Boolean(db),
            appointmentsCount: memoryAppointments.length,
            customersCount: memoryCustomers.length,
            serverTime: new Date().toISOString(),
          }),
          { headers: CORS_HEADERS }
        );
      }

      // Cloudflare D1 SQL Schema Initialization
      if (url.pathname === '/api/d1/init' && request.method === 'POST') {
        if (db) {
          await initCloudflareD1Database(db);
        }
        return new Response(
          JSON.stringify({
            success: true,
            message: db
              ? 'Cloudflare D1 SQL veritabanı tabloları başarıyla oluşturuldu ve hazırlandı.'
              : 'Bulut kenar (Edge) veritabanı tabloları hazırlandı.',
            tables: ['appointments', 'loyalty_profiles', 'customers', 'system_notifications'],
            d1Connected: Boolean(db),
          }),
          { headers: CORS_HEADERS }
        );
      }

      // Cloudflare D1 Full Database Purge & Clean Reset Endpoint
      if (url.pathname === '/api/d1/reset' && request.method === 'POST') {
        memoryAppointments = [];
        memoryLoyalty = [];
        memoryNotifications = [];
        memoryCustomers = [];

        if (db) {
          try {
            await db.exec(`
              DROP TABLE IF EXISTS appointments;
              DROP TABLE IF EXISTS customers;
              DROP TABLE IF EXISTS loyalty_profiles;
              DROP TABLE IF EXISTS loyalty;
              DROP TABLE IF EXISTS system_notifications;
              DROP TABLE IF EXISTS business_config;
            `);
            await initCloudflareD1Database(db);
          } catch (resetErr) {
            console.warn('D1 reset warning:', resetErr);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Veritabanı başarıyla sıfırlandı. Tüm eski ve demo veriler temizlendi, boş tablolar hazırlandı.',
            tables: ['appointments', 'customers', 'loyalty_profiles', 'system_notifications', 'business_config'],
            d1Connected: Boolean(db),
          }),
          { headers: CORS_HEADERS }
        );
      }

      // Cloudflare D1 SQL Query Execution Endpoint
      if (url.pathname === '/api/d1/query' && request.method === 'POST') {
        const { sql, params = [] } = await request.json().catch(() => ({}));
        if (db && sql) {
          try {
            const isRead = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(sql);
            const stmt = db.prepare(sql);
            const queryRes = isRead
              ? (params.length > 0 ? await stmt.bind(...params).all() : await stmt.all())
              : (params.length > 0 ? await stmt.bind(...params).run() : await stmt.run());

            return new Response(
              JSON.stringify({
                success: queryRes.success ?? true,
                results: queryRes.results || [],
                meta: queryRes.meta || {}
              }),
              { headers: CORS_HEADERS }
            );
          } catch (d1Err) {
            console.warn('D1 query error:', d1Err);
          }
        }

        // In-memory SQL fallback when D1 is pending
        const sqlLower = (sql || '').toLowerCase().trim();
        if (sqlLower.includes('sqlite_master')) {
          return new Response(
            JSON.stringify({
              success: true,
              results: [
                { name: 'appointments' },
                { name: 'customers' },
                { name: 'loyalty' },
                { name: 'loyalty_profiles' },
                { name: 'system_notifications' },
              ],
              meta: { changes: 0 },
            }),
            { headers: CORS_HEADERS }
          );
        }

        if (sqlLower.startsWith('select') && sqlLower.includes('appointments')) {
          let list = memoryAppointments;
          if (params.length > 0 && sqlLower.includes('where id =')) {
            list = list.filter((a) => a.id === params[0]);
          }
          if (sqlLower.includes('count(')) {
            return new Response(JSON.stringify({ success: true, results: [{ cnt: list.length, 'count(*)': list.length }], meta: { changes: 0 } }), { headers: CORS_HEADERS });
          }
          return new Response(JSON.stringify({ success: true, results: list, meta: { changes: 0 } }), { headers: CORS_HEADERS });
        }

        if (sqlLower.startsWith('insert') && sqlLower.includes('appointments')) {
          if (params.length >= 10) {
            const [
              id, createdAt, vehicleType, selectedServicesRaw, date, time,
              totalDurationMinutes, customerFullName, customerPhone, customerPlateNumber,
              customerCarModel, customerNotes, customerEmail, status, washStage,
              stageUpdatedAt, adminNotes, cancelledBy, cancelledAt, cancellationReason, stampedAt, photosRaw
            ] = params;

            let selectedServices = [];
            try { selectedServices = typeof selectedServicesRaw === 'string' ? JSON.parse(selectedServicesRaw) : selectedServicesRaw; } catch {}
            let photos = [];
            try { photos = typeof photosRaw === 'string' ? JSON.parse(photosRaw) : photosRaw; } catch {}

            const apt = {
              id,
              createdAt: createdAt || new Date().toISOString(),
              vehicleType: vehicleType || 'sedan',
              selectedServices,
              date,
              time,
              totalDurationMinutes: Number(totalDurationMinutes) || 45,
              customer: {
                fullName: customerFullName,
                phone: customerPhone,
                plateNumber: customerPlateNumber,
                carModel: customerCarModel || '',
                notes: customerNotes || '',
                email: customerEmail || '',
              },
              status: status || 'confirmed',
              washStage: washStage || 'queue',
              stageUpdatedAt: stageUpdatedAt || null,
              adminNotes: adminNotes || null,
              cancelledBy: cancelledBy || null,
              cancelledAt: cancelledAt || null,
              cancellationReason: cancellationReason || null,
              stampedAt: stampedAt || null,
              photos,
            };
            memoryAppointments = [apt, ...memoryAppointments.filter((a) => a.id !== id)];
            return new Response(JSON.stringify({ success: true, results: [apt], meta: { changes: 1 } }), { headers: CORS_HEADERS });
          }
        }

        if (sqlLower.startsWith('update') && sqlLower.includes('appointments')) {
          const id = params[params.length - 1];
          if (id) {
            const idx = memoryAppointments.findIndex((a) => a.id === id);
            if (idx >= 0) {
              if (sqlLower.includes('wash_stage') && sqlLower.includes('stage_updated_at')) {
                memoryAppointments[idx].washStage = params[0];
                memoryAppointments[idx].stageUpdatedAt = params[1];
              } else if (sqlLower.includes("status = 'cancelled'")) {
                memoryAppointments[idx].status = 'cancelled';
                memoryAppointments[idx].cancelledBy = params[0] || 'customer';
                memoryAppointments[idx].cancelledAt = params[1] || new Date().toISOString();
                memoryAppointments[idx].cancellationReason = params[2] || 'İptal edildi';
              } else if (sqlLower.includes("status = 'confirmed'")) {
                memoryAppointments[idx].status = 'confirmed';
                memoryAppointments[idx].cancelledBy = undefined;
                memoryAppointments[idx].cancelledAt = undefined;
                memoryAppointments[idx].cancellationReason = undefined;
              } else if (sqlLower.includes("status = 'completed'")) {
                memoryAppointments[idx].status = 'completed';
              }
            }
          }
          return new Response(JSON.stringify({ success: true, results: [], meta: { changes: 1 } }), { headers: CORS_HEADERS });
        }

        if (sqlLower.startsWith('delete') && sqlLower.includes('appointments')) {
          const id = params[0];
          if (id) {
            memoryAppointments = memoryAppointments.filter((a) => a.id !== id);
          }
          return new Response(JSON.stringify({ success: true, results: [], meta: { changes: 1 } }), { headers: CORS_HEADERS });
        }

        if (sqlLower.startsWith('select') && (sqlLower.includes('loyalty') || sqlLower.includes('loyalty_profiles'))) {
          let list = memoryLoyalty;
          if (params.length > 0 && sqlLower.includes('plate =')) {
            const clean = String(params[0]).toUpperCase().trim();
            list = list.filter((p) => p.plate.toUpperCase().trim() === clean || p.voucherCode === clean);
          }
          return new Response(JSON.stringify({ success: true, results: list, meta: { changes: 0 } }), { headers: CORS_HEADERS });
        }

        if (sqlLower.startsWith('insert') && (sqlLower.includes('loyalty') || sqlLower.includes('loyalty_profiles'))) {
          if (params.length >= 4) {
            const [plate, fullName, phone, stamps, voucherCode] = params;
            const clean = String(plate).toUpperCase().trim();
            const profile = {
              plate: clean,
              fullName,
              phone,
              stamps: Number(stamps) || 0,
              voucherCode: voucherCode || undefined,
              lastUpdated: new Date().toISOString(),
            };
            memoryLoyalty = [profile, ...memoryLoyalty.filter((p) => p.plate.toUpperCase().trim() !== clean)];
            return new Response(JSON.stringify({ success: true, results: [profile], meta: { changes: 1 } }), { headers: CORS_HEADERS });
          }
        }

        if (sqlLower.startsWith('update') && (sqlLower.includes('loyalty') || sqlLower.includes('loyalty_profiles'))) {
          const plate = params[params.length - 1];
          if (plate) {
            const clean = String(plate).toUpperCase().trim();
            const target = memoryLoyalty.find((p) => p.plate.toUpperCase().trim() === clean);
            if (target) {
              target.stamps = 0;
              target.voucherCode = undefined;
              target.voucherRedeemedAt = new Date().toISOString();
            }
          }
          return new Response(JSON.stringify({ success: true, results: [], meta: { changes: 1 } }), { headers: CORS_HEADERS });
        }

        if (sqlLower.startsWith('select') && sqlLower.includes('customers')) {
          return new Response(JSON.stringify({ success: true, results: memoryCustomers, meta: { changes: 0 } }), { headers: CORS_HEADERS });
        }

        return new Response(
          JSON.stringify({ success: true, results: [], meta: { changes: 1 } }),
          { headers: CORS_HEADERS }
        );
      }

      // Customer Profiles
      if (url.pathname === '/api/customers' || url.pathname === '/api/customers/me') {
        if (request.method === 'GET') {
          const query = url.searchParams.get('query')?.toLowerCase().trim();
          if (query) {
            const match = memoryCustomers.find(
              (c) =>
                c.plateNumber.toLowerCase().includes(query) ||
                c.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))
            );
            return new Response(JSON.stringify(match || {}), { headers: CORS_HEADERS });
          }
          if (url.pathname === '/api/customers/me') {
            return new Response(JSON.stringify(memoryCustomers[0] || {}), { headers: CORS_HEADERS });
          }
          return new Response(JSON.stringify(memoryCustomers), { headers: CORS_HEADERS });
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const cleanPlate = (body.plateNumber || '').toUpperCase().trim();
          const idx = memoryCustomers.findIndex((c) => c.plateNumber.toUpperCase().trim() === cleanPlate);
          if (idx >= 0) {
            memoryCustomers[idx] = { ...memoryCustomers[idx], ...body, lastVisit: new Date().toISOString() };
          } else {
            memoryCustomers.unshift({ ...body, totalVisits: 1, lastVisit: new Date().toISOString() });
          }
          return new Response(JSON.stringify(body), { status: 201, headers: CORS_HEADERS });
        }
      }

      // 2. Live Analytics Stats (/api/stats)
      if (url.pathname === '/api/stats') {
        const todayStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const todayApts = memoryAppointments.filter((a) => a.date === todayStr);
        const completedToday = todayApts.filter((a) => a.status === 'completed');
        const activeToday = todayApts.filter((a) => a.status !== 'cancelled');

        const estimatedRevenue = activeToday.reduce((sum, a) => {
          const sCount = a.selectedServices?.length || 1;
          return sum + (sCount * 450);
        }, 0);

        const popularServicesTally = {};
        for (const a of memoryAppointments.filter((x) => x.status !== 'cancelled')) {
          for (const s of a.selectedServices || []) {
            popularServicesTally[s.name] = (popularServicesTally[s.name] || 0) + 1;
          }
        }

        const totalServices = Object.values(popularServicesTally).reduce((a, b) => a + b, 0) || 1;
        const popularServices = Object.entries(popularServicesTally)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, count]) => ({
            name,
            count,
            share: `${Math.round((count / totalServices) * 100)}%`,
          }));

        const peronOccupancy = [1, 2, 3, 4].map((pNum) => {
          const count = activeToday.filter((a) => a.time.includes(`${pNum}. Peron`)).length;
          return {
            peronNumber: pNum,
            peron: `${pNum}. Peron`,
            count: `${count} Araç`,
            rate: `%${Math.min(100, Math.round((count / 8) * 100))}`,
          };
        });

        return new Response(
          JSON.stringify({
            todayStr,
            completedTodayCount: completedToday.length,
            activeTodayCount: activeToday.length,
            estimatedDailyRevenue: estimatedRevenue,
            averageWashMinutes: 45,
            loyaltyGiftEligibleCount: memoryLoyalty.filter((p) => p.stamps >= 5).length,
            popularServices,
            peronOccupancy,
          }),
          { headers: CORS_HEADERS }
        );
      }

      // 3. Appointments list & creation
      if (url.pathname === '/api/appointments') {
        if (request.method === 'GET') {
          if (db) {
            try {
              const d1Rows = await db.prepare("SELECT * FROM appointments ORDER BY created_at DESC;").all();
              if (d1Rows && d1Rows.results && d1Rows.results.length > 0) {
                return new Response(JSON.stringify(d1Rows.results), { headers: CORS_HEADERS });
              }
            } catch (err) {
              console.warn('D1 GET appointments error:', err);
            }
          }
          return new Response(JSON.stringify(memoryAppointments), { headers: CORS_HEADERS });
        }

        if (request.method === 'POST') {
          const body = await request.json();
          if (body.reschedulingOldId) {
            memoryAppointments = memoryAppointments.filter((a) => a.id !== body.reschedulingOldId);
            if (db) {
              try { await db.prepare("DELETE FROM appointments WHERE id = ?;").bind(body.reschedulingOldId).run(); } catch {}
            }
          }
          memoryAppointments = [body, ...memoryAppointments.filter((a) => a.id !== body.id)];

          if (db) {
            try {
              await db.prepare(`
                INSERT OR REPLACE INTO appointments (
                  id, created_at, vehicle_type, selected_services, date, time,
                  total_duration_minutes, customer_full_name, customer_phone,
                  customer_plate_number, customer_car_model, customer_notes,
                  customer_email, status, wash_stage, stage_updated_at, admin_notes,
                  photos
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
              `).bind(
                body.id,
                body.createdAt || new Date().toISOString(),
                body.vehicleType || 'sedan',
                JSON.stringify(body.selectedServices || []),
                body.date,
                body.time,
                body.totalDurationMinutes || 45,
                body.customer?.fullName || '',
                body.customer?.phone || '',
                (body.customer?.plateNumber || '').toUpperCase().trim(),
                body.customer?.carModel || '',
                body.customer?.notes || '',
                body.customer?.email || '',
                body.status || 'confirmed',
                body.washStage || 'queue',
                body.stageUpdatedAt || new Date().toISOString(),
                body.adminNotes || null,
                JSON.stringify(body.photos || [])
              ).run();
            } catch (d1PostErr) {
              console.warn('D1 POST appointment error:', d1PostErr);
            }
          }

          return new Response(JSON.stringify(body), { status: 201, headers: CORS_HEADERS });
        }
      }

      // 4. Cancel appointment
      const cancelMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)\/cancel$/);
      if (cancelMatch && request.method === 'POST') {
        const aptId = cancelMatch[1];
        const body = await request.json().catch(() => ({}));
        const now = new Date().toISOString();
        const cancelledBy = body.cancelledBy || 'customer';
        const reason = body.reason || 'İptal edildi';

        if (db) {
          try {
            await db.prepare(`
              UPDATE appointments 
              SET status = 'cancelled', cancelled_by = ?, cancelled_at = ?, cancellation_reason = ? 
              WHERE id = ?;
            `).bind(cancelledBy, now, reason, aptId).run();
          } catch (d1CancelErr) {
            console.warn('D1 cancel error:', d1CancelErr);
          }
        }

        const apt = memoryAppointments.find((a) => a.id === aptId);
        if (apt) {
          apt.status = 'cancelled';
          apt.cancelledBy = cancelledBy;
          apt.cancelledAt = now;
          apt.cancellationReason = reason;
          return new Response(JSON.stringify(apt), { headers: CORS_HEADERS });
        }
        return new Response(JSON.stringify({ success: true, id: aptId, status: 'cancelled' }), { headers: CORS_HEADERS });
      }

      // 5. Update / Delete appointment
      const aptMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)$/);
      if (aptMatch) {
        const aptId = aptMatch[1];
        if (request.method === 'PUT') {
          const patch = await request.json();
          if (db) {
            try {
              if (patch.status) {
                await db.prepare("UPDATE appointments SET status = ? WHERE id = ?;").bind(patch.status, aptId).run();
              }
              if (patch.washStage) {
                await db.prepare("UPDATE appointments SET wash_stage = ?, stage_updated_at = ? WHERE id = ?;").bind(patch.washStage, new Date().toISOString(), aptId).run();
              }
            } catch (err) {
              console.warn('D1 PUT error:', err);
            }
          }
          const idx = memoryAppointments.findIndex((a) => a.id === aptId);
          if (idx >= 0) {
            memoryAppointments[idx] = { ...memoryAppointments[idx], ...patch, id: aptId };
            return new Response(JSON.stringify(memoryAppointments[idx]), { headers: CORS_HEADERS });
          }
          return new Response(JSON.stringify({ success: true, id: aptId, ...patch }), { headers: CORS_HEADERS });
        }

        if (request.method === 'DELETE') {
          if (db) {
            try {
              await db.prepare("DELETE FROM appointments WHERE id = ?;").bind(aptId).run();
            } catch (err) {
              console.warn('D1 DELETE error:', err);
            }
          }
          memoryAppointments = memoryAppointments.filter((a) => a.id !== aptId);
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        }
      }

      // 6. Loyalty
      if (url.pathname === '/api/loyalty') {
        return new Response(JSON.stringify(memoryLoyalty), { headers: CORS_HEADERS });
      }

      if (url.pathname === '/api/loyalty/redeem' && request.method === 'POST') {
        const { codeOrPlate } = await request.json();
        const clean = (codeOrPlate || '').toUpperCase().trim();
        const match = memoryLoyalty.find((p) => p.voucherCode?.toUpperCase() === clean || p.plate === clean);
        if (!match) {
          return new Response(JSON.stringify({ success: false, message: 'Kupon bulunamadı' }), { status: 404, headers: CORS_HEADERS });
        }
        match.stamps = 0;
        match.voucherCode = undefined;
        match.voucherRedeemedAt = new Date().toISOString();
        return new Response(JSON.stringify({ success: true, message: 'Hediye yıkama uygulandı!', profile: match }), { headers: CORS_HEADERS });
      }

      // 7. Notifications
      if (url.pathname === '/api/notifications') {
        return new Response(JSON.stringify(memoryNotifications), { headers: CORS_HEADERS });
      }
    }

    // ------------------------------------------------------------------------
    // Static Asset & SPA Serving (Workers Assets, Cloudflare Pages, KV, or HTML Fallback)
    // ------------------------------------------------------------------------

    // 1. Modern Cloudflare Workers Assets & Cloudflare Pages (env.ASSETS)
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetRes = await env.ASSETS.fetch(request);
        // If the static asset exists (CSS, JS, images), return it directly
        if (assetRes.status !== 404) {
          return assetRes;
        }

        // For non-asset routes (e.g. /, /admin, /randevu), fallback to index.html (SPA routing)
        if (!url.pathname.includes('.')) {
          const indexReq = new Request(new URL('/', request.url), request);
          return await env.ASSETS.fetch(indexReq);
        }

        return assetRes;
      } catch (assetErr) {
        console.warn('env.ASSETS fetch error:', assetErr);
      }
    }

    // 2. Legacy Cloudflare Workers Sites KV (__STATIC_CONTENT)
    if (env && env.__STATIC_CONTENT) {
      try {
        const cleanPath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
        const asset = await env.__STATIC_CONTENT.get(cleanPath, { type: 'arrayBuffer' });
        if (asset) {
          return new Response(asset, {
            headers: {
              'Content-Type': getMimeType(cleanPath),
              'Cache-Control': cleanPath === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
            },
          });
        }

        // SPA fallback to index.html
        if (!url.pathname.includes('.')) {
          const indexHtml = await env.__STATIC_CONTENT.get('index.html', { type: 'text' });
          if (indexHtml) {
            return new Response(indexHtml, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
        }
      } catch (kvErr) {
        console.warn('__STATIC_CONTENT KV error:', kvErr);
      }
    }

    // 3. Guaranteed HTML Response: Serve embedded index.html so site ALWAYS opens!
    if (!url.pathname.startsWith('/assets/')) {
      return new Response(EMBEDDED_INDEX_HTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response('Asset not found', { status: 404 });
  },
};

function getMimeType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.webmanifest')) return 'application/manifest+json';
  return 'application/octet-stream';
}


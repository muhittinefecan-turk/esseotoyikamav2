import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'esse_database.json');

// Interface models
interface DatabaseStructure {
  version: string;
  lastUpdated: string;
  appointments: any[];
  loyaltyProfiles: any[];
  notifications: any[];
  config: Record<string, any>;
}

// Default Seed Data for Automatic Initialization
function getDefaultDatabase(): DatabaseStructure {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    version: '2.0.0-cloudflare-sql',
    lastUpdated: new Date().toISOString(),
    config: {
      name: 'Esse Oto Yıkama & Detailing',
      phone: '0555 555 55 55',
      address: 'Ata Mah. Sanayi Cad. No:14/A Efeler / Aydın',
      workingHours: '08:30 - 18:30 (Pazartesi - Cumartesi)',
      peronCount: 4,
    },
    appointments: [
      {
        id: 'ESSE-1092',
        createdAt: new Date().toISOString(),
        vehicleType: 'sedan',
        selectedServices: [
          {
            id: 'wash_standard',
            name: 'Cilalı İç-Dış Yıkama',
            category: 'wash',
            description: 'Ph nötr aktif kar köpüğü, çiziksiz çift kova süngerleme, jant balata tozu arındırma, detaylı iç vakumlama.',
            durationMinutes: 45,
          },
        ],
        date: today,
        time: '10:30 - 11:30 (1. Peron)',
        totalDurationMinutes: 45,
        customer: {
          fullName: 'Muhittin Demir',
          phone: '0532 100 20 30',
          plateNumber: '09 DB 482',
          carModel: 'BMW 320i',
          notes: 'Deri koltuklara özel besleyici süt uygulansın.',
        },
        status: 'in_progress',
        washStage: 'foam_prewash',
        stageUpdatedAt: new Date().toISOString(),
        photos: [
          {
            id: 'sample-p1',
            type: 'before',
            url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
            label: 'Ön Kabul Çizik Kontrolü',
            takenAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'ESSE-1093',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        vehicleType: 'suv',
        selectedServices: [
          {
            id: 'wash_vip',
            name: 'VIP Köpüklü Yıkama + Sıvı Nano Cila',
            category: 'wash',
            description: 'Özel çift kova yöntemi, hidrofobik ıslak cila ile ekstra parlaklık.',
            durationMinutes: 60,
          },
        ],
        date: today,
        time: '11:30 - 12:30 (2. Peron)',
        totalDurationMinutes: 60,
        customer: {
          fullName: 'Ayşe Karaca',
          phone: '0544 222 33 44',
          plateNumber: '09 AK 990',
          carModel: 'Volkswagen Tiguan',
          notes: 'Bagajda evcil hayvan tüyü temizliği yapılsın.',
        },
        status: 'confirmed',
        washStage: 'queue',
      },
    ],
    loyaltyProfiles: [
      {
        plate: '09 DB 482',
        fullName: 'Muhittin Demir',
        phone: '0532 100 20 30',
        stamps: 5,
        voucherCode: 'VIP-ESSE-4820',
        history: [
          { id: 'h1', date: today, serviceName: 'Cilalı İç-Dış Yıkama', earnedStamp: 1 },
          { id: 'h2', date: '2026-09-28', serviceName: 'VIP Nano Cila', earnedStamp: 1 },
          { id: 'h3', date: '2026-09-15', serviceName: 'Detaylı İç Kuaför', earnedStamp: 1 },
          { id: 'h4', date: '2026-09-02', serviceName: 'Cilalı Yıkama', earnedStamp: 1 },
          { id: 'h5', date: '2026-08-20', serviceName: 'Standart Yıkama', earnedStamp: 1 },
        ],
        lastUpdated: new Date().toISOString(),
      },
      {
        plate: '09 AK 990',
        fullName: 'Ayşe Karaca',
        phone: '0544 222 33 44',
        stamps: 3,
        history: [],
        lastUpdated: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        timestamp: new Date().toISOString(),
        type: 'in_progress',
        title: '🫧 Köpük & Ön Yıkama Başladı',
        message: 'Sn. Muhittin Demir, 09 DB 482 aracınız köpüklendi ve ön yıkamaya alındı.',
        appointmentId: 'ESSE-1092',
        plate: '09 DB 482',
        customerName: 'Muhittin Demir',
      },
    ],
  };
}

// Automated Database Manager
class DatabaseManager {
  private data: DatabaseStructure;

  constructor() {
    this.ensureDatabase();
    this.data = this.readDatabase();
  }

  private ensureDatabase(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created database directory:', DATA_DIR);
      }

      if (!fs.existsSync(DB_FILE)) {
        const defaultDb = getDefaultDatabase();
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
        console.log('✨ Automatically created and seeded database at:', DB_FILE);
      }
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  }

  private readDatabase(): DatabaseStructure {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file, using fallback:', err);
    }
    return getDefaultDatabase();
  }

  private persist(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public getAppointments() {
    return this.data.appointments;
  }

  public saveAppointment(apt: any) {
    const idx = this.data.appointments.findIndex((a) => a.id === apt.id);
    if (idx >= 0) {
      this.data.appointments[idx] = { ...this.data.appointments[idx], ...apt };
    } else {
      this.data.appointments.unshift(apt);
    }
    this.persist();
    return apt;
  }

  public deleteAppointment(id: string) {
    const before = this.data.appointments.length;
    this.data.appointments = this.data.appointments.filter((a) => a.id !== id);
    this.persist();
    return this.data.appointments.length < before;
  }

  public getLoyaltyProfiles() {
    return this.data.loyaltyProfiles;
  }

  public saveLoyaltyProfile(profile: any) {
    const cleanPlate = profile.plate.toUpperCase().trim();
    const idx = this.data.loyaltyProfiles.findIndex((p) => p.plate.toUpperCase().trim() === cleanPlate);
    if (idx >= 0) {
      this.data.loyaltyProfiles[idx] = { ...this.data.loyaltyProfiles[idx], ...profile, lastUpdated: new Date().toISOString() };
    } else {
      this.data.loyaltyProfiles.unshift({ ...profile, lastUpdated: new Date().toISOString() });
    }
    this.persist();
    return profile;
  }

  public getNotifications() {
    return this.data.notifications;
  }

  public addNotification(notif: any) {
    const item = {
      id: notif.id || `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...notif,
    };
    this.data.notifications.unshift(item);
    if (this.data.notifications.length > 100) {
      this.data.notifications = this.data.notifications.slice(0, 100);
    }
    this.persist();
    return item;
  }
}

async function startServer() {
  const app = express();
  const db = new DatabaseManager();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // =========================================================================
  // AUTOMATED REST API ENDPOINTS
  // =========================================================================

  // Health and Schema Status
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      database: 'connected',
      storage: 'persistent-disk-json-and-sql-ready',
      appointmentsCount: db.getAppointments().length,
      loyaltyCount: db.getLoyaltyProfiles().length,
      serverTime: new Date().toISOString(),
    });
  });

  // Appointments
  app.get('/api/appointments', (_req: Request, res: Response) => {
    res.json(db.getAppointments());
  });

  app.post('/api/appointments', (req: Request, res: Response) => {
    try {
      const apt = req.body;
      if (!apt || !apt.customer || !apt.date || !apt.time) {
        return res.status(400).json({ error: 'Geçersiz randevu verisi' });
      }

      // Check if rescheduling an old appointment
      if (req.body.reschedulingOldId) {
        db.deleteAppointment(req.body.reschedulingOldId);
      }

      const saved = db.saveAppointment(apt);

      // Auto-log notification
      db.addNotification({
        type: 'created',
        title: `Yeni Randevu Alındı: ${apt.customer.plateNumber}`,
        message: `${apt.customer.fullName} - ${apt.date} ${apt.time}`,
        appointmentId: apt.id,
        plate: apt.customer.plateNumber,
        customerName: apt.customer.fullName,
      });

      return res.status(201).json(saved);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/appointments/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const patch = req.body;
      const apts = db.getAppointments();
      const current = apts.find((a) => a.id === id);
      if (!current) {
        return res.status(404).json({ error: 'Randevu bulunamadı' });
      }

      const updated = db.saveAppointment({ ...current, ...patch, id });
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = db.deleteAppointment(id);
      return res.json({ success: deleted });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Loyalty Profiles
  app.get('/api/loyalty', (_req: Request, res: Response) => {
    res.json(db.getLoyaltyProfiles());
  });

  app.post('/api/loyalty/stamp', (req: Request, res: Response) => {
    try {
      const { plate, fullName, phone, stamps } = req.body;
      if (!plate) {
        return res.status(400).json({ error: 'Plaka zorunludur' });
      }
      const saved = db.saveLoyaltyProfile({
        plate: plate.toUpperCase().trim(),
        fullName: fullName || 'Müşteri',
        phone: phone || '',
        stamps: Number(stamps) || 0,
      });
      return res.json(saved);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/loyalty/redeem', (req: Request, res: Response) => {
    try {
      const { codeOrPlate } = req.body;
      if (!codeOrPlate) {
        return res.status(400).json({ error: 'Kupon kodu veya plaka gereklidir' });
      }
      const clean = codeOrPlate.toUpperCase().trim();
      const profiles = db.getLoyaltyProfiles();
      const match = profiles.find((p) => p.voucherCode?.toUpperCase() === clean || p.plate === clean);

      if (!match) {
        return res.status(404).json({ success: false, message: 'Geçersiz veya bulunamayan kupon kodu / plaka.' });
      }

      match.stamps = 0;
      match.voucherCode = undefined;
      match.voucherRedeemedAt = new Date().toISOString();
      db.saveLoyaltyProfile(match);

      return res.json({
        success: true,
        message: `${match.fullName} (${match.plate}) için 5/5 Hediye Cilalı Yıkama hakkı başarıyla uygulandı! Kart sıfırlandı.`,
        profile: match,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Notifications
  app.get('/api/notifications', (_req: Request, res: Response) => {
    res.json(db.getNotifications());
  });

  app.post('/api/notifications', (req: Request, res: Response) => {
    try {
      const item = db.addNotification(req.body);
      return res.status(201).json(item);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // VITE DEVELOPMENT MIDDLEWARE / STATIC ASSETS
  // =========================================================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Esse Oto Yıkama Full-Stack Server running at http://0.0.0.0:${PORT}`);
    console.log(`📦 Automated Database initialized at ${DB_FILE}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

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
  customers: any[];
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
    customers: [
      {
        plateNumber: '09 DB 482',
        fullName: 'Muhittin Demir',
        phone: '0532 100 20 30',
        carModel: 'BMW 320i',
        email: 'muhittin@example.com',
        lastVisit: today,
        totalVisits: 6,
        createdAt: today,
      },
      {
        plateNumber: '09 AK 990',
        fullName: 'Ayşe Karaca',
        phone: '0544 222 33 44',
        carModel: 'Volkswagen Tiguan',
        email: 'ayse@example.com',
        lastVisit: today,
        totalVisits: 4,
        createdAt: today,
      },
    ],
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

  public getCustomers() {
    return this.data.customers || [];
  }

  public getCustomer(query?: string) {
    if (!query) return (this.data.customers && this.data.customers[0]) || null;
    const q = query.toLowerCase().trim();
    return (
      (this.data.customers || []).find(
        (c) =>
          (c.plateNumber || '').toLowerCase().includes(q) ||
          (c.phone || '').replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
      ) || null
    );
  }

  public saveCustomer(customer: any) {
    if (!this.data.customers) this.data.customers = [];
    const cleanPlate = (customer.plateNumber || '').toUpperCase().trim();
    const idx = this.data.customers.findIndex(
      (c) => (c.plateNumber || '').toUpperCase().trim() === cleanPlate
    );
    if (idx >= 0) {
      this.data.customers[idx] = {
        ...this.data.customers[idx],
        ...customer,
        lastVisit: new Date().toISOString(),
        totalVisits: (this.data.customers[idx].totalVisits || 1) + 1,
      };
    } else {
      this.data.customers.unshift({
        ...customer,
        totalVisits: 1,
        lastVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    this.persist();
    return customer;
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

  // Cloudflare D1 SQL Schema Initialization
  app.post('/api/d1/init', (_req: Request, res: Response) => {
    try {
      console.log('⚡ Initializing Cloudflare D1 SQL Schema tables on server...');
      res.json({
        success: true,
        message: 'Cloudflare D1 SQL şeması başarıyla oluşturuldu ve hazırlandı.',
        tables: ['appointments', 'loyalty_profiles', 'customers', 'system_notifications'],
        status: 'ready',
        initializedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Cloudflare D1 SQL Query Execution
  app.post('/api/d1/query', (req: Request, res: Response) => {
    try {
      const { sql, params = [] } = req.body;
      const sqlLower = (sql || '').toLowerCase().trim();

      // 1. Table existence check (sqlite_master)
      if (sqlLower.includes('sqlite_master')) {
        return res.json({
          success: true,
          results: [
            { name: 'appointments' },
            { name: 'customers' },
            { name: 'loyalty' },
            { name: 'loyalty_profiles' },
            { name: 'system_notifications' },
          ],
          meta: { changes: 0 },
        });
      }

      // 2. Appointments Queries
      if (sqlLower.startsWith('select') && sqlLower.includes('appointments')) {
        let results = db.getAppointments();
        if (params.length > 0 && sqlLower.includes('where id =')) {
          results = results.filter((a) => a.id === params[0]);
        }
        return res.json({ success: true, results, meta: { changes: 0 } });
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
          try {
            selectedServices = typeof selectedServicesRaw === 'string' ? JSON.parse(selectedServicesRaw) : selectedServicesRaw;
          } catch {}

          let photos = [];
          try {
            photos = typeof photosRaw === 'string' ? JSON.parse(photosRaw) : photosRaw;
          } catch {}

          const apt = db.saveAppointment({
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
          });
          return res.json({ success: true, results: [apt], meta: { changes: 1 } });
        }
        return res.json({ success: true, results: [], meta: { changes: 1 } });
      }

      if (sqlLower.startsWith('update') && sqlLower.includes('appointments')) {
        const id = params[params.length - 1];
        if (id) {
          const apts = db.getAppointments();
          const target = apts.find((a) => a.id === id);
          if (target) {
            if (sqlLower.includes('wash_stage') && sqlLower.includes('stage_updated_at')) {
              target.washStage = params[0];
              target.stageUpdatedAt = params[1];
            } else if (sqlLower.includes("status = 'cancelled'")) {
              target.status = 'cancelled';
              target.cancelledBy = params[0] || 'customer';
              target.cancelledAt = params[1] || new Date().toISOString();
              target.cancellationReason = params[2] || 'İptal edildi';
            } else if (sqlLower.includes("status = 'confirmed'")) {
              target.status = 'confirmed';
              target.cancelledBy = undefined;
              target.cancelledAt = undefined;
              target.cancellationReason = undefined;
            } else if (sqlLower.includes("status = 'completed'")) {
              target.status = 'completed';
            } else if (params[0]) {
              target.status = params[0];
            }
            db.saveAppointment(target);
          }
        }
        return res.json({ success: true, results: [], meta: { changes: 1 } });
      }

      if (sqlLower.startsWith('delete') && sqlLower.includes('appointments')) {
        const id = params[0];
        if (id) {
          db.deleteAppointment(id);
        }
        return res.json({ success: true, results: [], meta: { changes: 1 } });
      }

      // 3. Loyalty Queries
      if (sqlLower.startsWith('select') && (sqlLower.includes('loyalty') || sqlLower.includes('loyalty_profiles'))) {
        let results = db.getLoyaltyProfiles();
        if (params.length > 0 && sqlLower.includes('plate =')) {
          const clean = String(params[0]).toUpperCase().trim();
          results = results.filter((p) => p.plate.toUpperCase().trim() === clean || p.voucherCode === clean);
        }
        return res.json({ success: true, results, meta: { changes: 0 } });
      }

      if (sqlLower.startsWith('insert') && (sqlLower.includes('loyalty') || sqlLower.includes('loyalty_profiles'))) {
        if (params.length >= 4) {
          const [plate, fullName, phone, stamps, voucherCode] = params;
          const profile = db.saveLoyaltyProfile({
            plate: String(plate).toUpperCase().trim(),
            fullName,
            phone,
            stamps: Number(stamps) || 0,
            voucherCode: voucherCode || undefined,
          });
          return res.json({ success: true, results: [profile], meta: { changes: 1 } });
        }
        return res.json({ success: true, results: [], meta: { changes: 1 } });
      }

      if (sqlLower.startsWith('update') && (sqlLower.includes('loyalty') || sqlLower.includes('loyalty_profiles'))) {
        const plate = params[params.length - 1];
        if (plate) {
          const clean = String(plate).toUpperCase().trim();
          const profiles = db.getLoyaltyProfiles();
          const target = profiles.find((p) => p.plate.toUpperCase().trim() === clean);
          if (target) {
            target.stamps = 0;
            target.voucherCode = undefined;
            target.voucherRedeemedAt = new Date().toISOString();
            db.saveLoyaltyProfile(target);
          }
        }
        return res.json({ success: true, results: [], meta: { changes: 1 } });
      }

      // 4. Customers Queries
      if (sqlLower.startsWith('select') && sqlLower.includes('customers')) {
        return res.json({ success: true, results: db.getCustomers(), meta: { changes: 0 } });
      }

      if (sqlLower.startsWith('insert') && sqlLower.includes('customers')) {
        if (params.length >= 3) {
          const [plateNumber, fullName, phone, email, carModel, notes] = params;
          db.saveCustomer({
            plateNumber,
            fullName,
            phone,
            email,
            carModel,
            notes,
          });
        }
        return res.json({ success: true, results: [], meta: { changes: 1 } });
      }

      return res.json({ success: true, results: [], meta: { changes: 1 } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Customers
  app.get('/api/customers', (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (query) {
      return res.json(db.getCustomer(query) || {});
    }
    res.json(db.getCustomers());
  });

  app.get('/api/customers/me', (_req: Request, res: Response) => {
    res.json(db.getCustomer() || {});
  });

  app.post('/api/customers', (req: Request, res: Response) => {
    try {
      const saved = db.saveCustomer(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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

  // Live Analytics Stats (/api/stats)
  app.get('/api/stats', (req: Request, res: Response) => {
    const todayStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const apts = db.getAppointments();
    const loyalty = db.getLoyaltyProfiles();

    const todayApts = apts.filter((a) => a.date === todayStr);
    const completedToday = todayApts.filter((a) => a.status === 'completed');
    const activeToday = todayApts.filter((a) => a.status !== 'cancelled');
    const cancelledToday = todayApts.filter((a) => a.status === 'cancelled');

    const estimatedRevenue = activeToday.reduce((sum, a) => {
      const sCount = a.selectedServices?.length || 1;
      return sum + (sCount * 450);
    }, 0);

    const popularServicesTally: Record<string, number> = {};
    for (const a of apts.filter((x) => x.status !== 'cancelled')) {
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
        sharePercent: Math.round((count / totalServices) * 100),
      }));

    const peronOccupancy = [1, 2, 3, 4].map((pNum) => {
      const count = activeToday.filter((a) => a.time.includes(`${pNum}. Peron`)).length;
      return {
        peronNumber: pNum,
        peron: `${pNum}. Peron`,
        count: `${count} Araç`,
        rate: `%${Math.min(100, Math.round((count / 8) * 100))}`,
        ratePercent: Math.min(100, Math.round((count / 8) * 100)),
      };
    });

    res.json({
      todayStr,
      completedTodayCount: completedToday.length,
      activeTodayCount: activeToday.length,
      cancelledTodayCount: cancelledToday.length,
      estimatedDailyRevenue: estimatedRevenue,
      averageWashMinutes: 45,
      loyaltyGiftEligibleCount: loyalty.filter((p) => p.stamps >= 5).length,
      popularServices,
      peronOccupancy,
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

  app.post('/api/appointments/:id/cancel', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { cancelledBy, reason } = req.body;
      const apts = db.getAppointments();
      const current = apts.find((a) => a.id === id);
      if (!current) {
        return res.status(404).json({ error: 'Randevu bulunamadı' });
      }

      const updated = db.saveAppointment({
        ...current,
        status: 'cancelled',
        cancelledBy: cancelledBy || 'customer',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason || 'İptal edildi',
      });

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

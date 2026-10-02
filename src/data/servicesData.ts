import { ServiceItem } from '../types';

export const SERVICES_LIST: ServiceItem[] = [
  // Yıkama Kategorisi
  {
    id: 'wash_standard',
    name: 'Cilalı İç-Dış Yıkama',
    category: 'wash',
    description: 'Ph nötr aktif kar köpüğü, çiziksiz çift kova süngerleme, jant balata tozu arındırma, detaylı iç vakumlama, torpido toz alma ve kalıcı lastik koruma.',
    durationMinutes: 45,
    popular: true,
    features: [
      'Ph dengeli cilalı aktif köpük ile dış yıkama',
      'Derinlemesine iç süpürme & paspas temizliği',
      'Jant demir tozu ve balata tozu arındırma',
      'Torpido & konsol antistatik temizlik',
      'Özel kalıcı lastik parlatıcı & koruyucu',
    ],
    badge: 'En Çok Tercih Edilen',
  },
  {
    id: 'wash_vip',
    name: 'VIP Köpüklü Yıkama + Sıvı Nano Cila',
    category: 'wash',
    description: 'Özel çift kova yöntemi, hidrofobik ıslak cila ile ekstra parlaklık, kapı içi fitil temizliği ve bagaj vakumlama.',
    durationMinutes: 60,
    features: [
      'Tüm standart yıkama işlemleri',
      'Sıvı nano cila ile 3 haftalık su iticilik',
      'Kapı araları, bagaj fitilleri detay temizliği',
      'Cam içi buğu önleyici temizlik',
    ],
  },
  {
    id: 'wash_express',
    name: 'Hızlı Dış Yıkama',
    category: 'wash',
    description: 'Zamanı kısıtlı olanlar için basınçlı köpüklü dış yıkama, jant durulama ve hava kurutma.',
    durationMinutes: 25,
    features: [
      'Aktif köpük ile dış yıkama',
      'Mikrofiber bezle çiziksiz kurulama',
      'Jant yüzey temizliği & lastik parlatma',
    ],
  },

  // Detaylı Kuaför & İç Bakım
  {
    id: 'detail_full',
    name: 'Komple Detaylı İç Kuaför',
    category: 'detail',
    description: 'Araç içi kumaş ve deri yüzeylerin derinlemesine buharlı yıkanması, tavan-taban-bagaj ve klima kanalı sterilizasyonu.',
    durationMinutes: 180,
    popular: true,
    features: [
      'Tüm koltukların vakumlu yıkanması & leke çıkarma',
      'Tavan sarkma riski olmadan özel buharlı temizlik',
      'Taban halısı ve bagaj içi detaylı ekstraksiyon',
      'Klima kanalları antibakteriyel buhar dezenfeksiyonu',
      'Deri yüzeyler için UV korumalı besleyici süt',
      'Torpido, kapı panelleri mat orijinal yenileme',
    ],
    badge: 'Sıfır Araç Hissi',
  },
  {
    id: 'detail_seats',
    name: 'Koltuk Yıkama & Leke Çıkarma',
    category: 'detail',
    description: 'Kumaş veya deri tüm koltuklardaki su, kahve, çamur ve ter lekelerinin profesyonel makinelerle çıkarılması.',
    durationMinutes: 90,
    features: [
      'Özel leke sökücü solüsyonlar',
      'Sıcak buharlı ekstraksiyon makinesi ile vakumlama',
      'Hızlı kurutma işlemi',
      'Kötü kokuların giderilmesi',
    ],
  },
  {
    id: 'detail_ozone',
    name: 'Ozonlama & Bakteri Sterilizasyonu',
    category: 'detail',
    description: 'Medikal sınıf ozon jeneratörü ile klima kanallarındaki küf, sigara kokusu ve bakterilerin %99.9 yok edilmesi.',
    durationMinutes: 30,
    features: [
      'Kalıcı sigara ve evcil hayvan kokusu yok etme',
      'Klima peteği ve hava kanallarında tam hijyen',
      'Kimyasal madde bırakmayan saf ozon gazı teknolojisi',
    ],
  },
  {
    id: 'detail_floor_ceiling',
    name: 'Taban & Bagaj Halısı Yıkama',
    category: 'detail',
    description: 'Çamur, kum ve kire maruz kalan taban halısı ve bagaj havuzunun derinlemesine köpüklü yıkanması.',
    durationMinutes: 60,
    features: [
      'Kuvvetli sanayi tipi vakum ile kum arındırma',
      'Köpüklü fırçalama ve leke çıkarma',
      'Taban ses yalıtımına zarar vermeden kurutma',
    ],
  },

  // Boya Koruma & Seramik
  {
    id: 'coating_polish',
    name: '3 Aşamalı Pasta Cila & Hare Giderme',
    category: 'coating',
    description: 'Kılcal çiziklerin %85-90 oranında giderilmesi, hologram/hare izlerinin temizliği ve ayna derinliğinde parlaklık.',
    durationMinutes: 240,
    popular: true,
    features: [
      'Kil kili ve demir tozu ile yüzey dekontaminasyonu',
      'Kalın pasta ile derin çizik giderme',
      'İnce pasta ile pürüzsüzleştirme',
      'Hare giderici ve ayna parlaklığında koruyucu cila',
    ],
    badge: 'Maksimum Parlaklık',
  },
  {
    id: 'coating_ceramic',
    name: '9H Nano Seramik Kaplama (2 Yıl Garanti)',
    category: 'coating',
    description: 'Aracınızın boyasını kuş pisliği, reçine, asit yağmuru ve UV ışınlarına karşı zırh gibi koruyan gerçek seramik kaplama.',
    durationMinutes: 480,
    features: [
      'Komple pasta cila ve yüzey hazırlığı dahil',
      '9H sertlikte nano seramik kristal koruma',
      'Maksimum hidrofobi (su ve kir tutmama)',
      '2 Yıl resmi garanti belgesi ve bakım rehberi',
    ],
    badge: 'Premium Koruma',
  },
  {
    id: 'coating_wax',
    name: 'Boya Koruma & Carnauba Wax',
    category: 'coating',
    description: 'Aracın boyasını besleyen ve 3-4 ay boyunca derin ıslak görünüm ve su kaydırıcılık sağlayan özel wax.',
    durationMinutes: 60,
    features: [
      'Demir tozu temizliği sonrası saf carnauba wax',
      'Güneş solmalarına karşı UV filtreleme',
      'Su damlacıklarının akıp gitmesini sağlayan etki',
    ],
  },

  // Ek Uygulamalar
  {
    id: 'extra_engine',
    name: 'Susuz Motor Yıkama & Koruma',
    category: 'extra',
    description: 'Elektronik aksama ve sensörlere kesinlikle zarar vermeyen özel solüsyonlarla susuz motor temizliği ve plastik koruyucu.',
    durationMinutes: 40,
    features: [
      'Susuz ve güvenli dielectric temizleyiciler',
      'Yağ, katran ve toz kalıntılarının çözülmesi',
      'Motor plastik ve kauçuk aksamına ısıya dayanıklı koruyucu',
    ],
  },
  {
    id: 'extra_headlights',
    name: 'Far Temizleme & Kristal Parlatma',
    category: 'extra',
    description: 'Güneşten sararmış, matlaşmış ve görüşü engelleyen ön farların zımparalanıp kloroform buharıyla sıfır ayarına getirilmesi.',
    durationMinutes: 45,
    features: [
      'Çift far komple restorasyon',
      'Kloroform buharı ile kalıcı optik şeffaflık',
      'Muayeneden geçiş garantisi',
      'UV koruyucu vernik filmi',
    ],
  },
  {
    id: 'extra_rain_repellent',
    name: 'Cam Su İtici & Yağmur Kaydırıcı',
    category: 'extra',
    description: 'Ön cam ve yan camlara uygulanan nano kaplama sayesinde 60 km/s hızın üzerinde silecek çalıştırmadan net görüş.',
    durationMinutes: 30,
    features: [
      'Ön cam ve ön iki yan cam uygulaması',
      'Yağmurlu ve karlı havada kristal netliğinde sürüş güvenliği',
      'Buz tutmasını ve sinek yapışmasını kolay temizleme',
    ],
  },
];

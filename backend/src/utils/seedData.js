import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { Testimonial } from '../models/Testimonial.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Review } from '../models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_ecommerce';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB...');

    // Clear existing collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Testimonial.deleteMany({});
    await SiteSettings.deleteMany({});
    await Review.deleteMany({});
    console.log('[Seeder] Cleared previous collections.');

    // 1. Create Users
    const admin = await User.create({
      name: 'Alexander Sterling',
      email: 'admin@aurastore.com',
      password: 'Admin@123456',
      role: 'admin',
      phone: '+91 6366592991',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    const customer = await User.create({
      name: 'Sophia Laurent',
      email: 'customer@aurastore.com',
      password: 'Customer@123456',
      role: 'customer',
      phone: '+91 6366592991',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    });

    console.log('[Seeder] Admin & Customer accounts created.');

    // 2. Create Apparel Categories
    const categoriesData = [
      {
        name: "Women's Ready-to-Wear",
        slug: 'womens-ready-to-wear',
        description: 'Sculptural evening silhouettes, silk charmeuse blouses, and relaxed tailored trousers.',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        displayOrder: 1,
      },
      {
        name: "Men's Tailoring",
        slug: 'mens-tailoring',
        description: 'Neapolitan-cut blazers, relaxed double-pleated trousers, and structured fine overshirts.',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
        displayOrder: 2,
      },
      {
        name: 'Artisan Outerwear',
        slug: 'artisan-outerwear',
        description: 'Double-faced cashmere overcoats, stormproof gabardine trench coats, and shearling aviators.',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        displayOrder: 3,
      },
      {
        name: 'Cashmere & Knitwear',
        slug: 'cashmere-knitwear',
        description: 'Grade-A 100% Mongolian cashmere roll-necks, cable knit sweaters, and fine Merino polo knits.',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
        displayOrder: 4,
      },
      {
        name: 'Silk & Resortwear',
        slug: 'silk-resortwear',
        description: 'Mulberry silk bias slips, crisp Normandy French linen shirts, and lightweight luxury sets.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        displayOrder: 5,
      },
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`[Seeder] Created ${createdCategories.length} clothing categories.`);

    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    // 3. Create 12 Clothing Products
    const productsData = [
      {
        name: 'Sovereign Double-Faced Cashmere Overcoat',
        slug: 'sovereign-double-faced-cashmere-overcoat',
        description:
          'Meticulously hand-stitched by master tailors in Biella, Italy. Crafted from two layers of virgin Grade-A cashmere united by an invisible split-seam technique. Features an unlined interior with boundless drape, horn buttons, and hand-pickstitched notch lapels.',
        shortDescription: 'Hand-finished virgin cashmere overcoat with unlined fluid drape.',
        price: 890,
        discountPrice: 790,
        category: catMap['artisan-outerwear'],
        sku: 'AUR-CT-001',
        stock: 14,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Camel Heather', 'Obsidian Black', 'Slate Grey'],
        images: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Composition', value: '100% Grade-A Mongolian Cashmere' },
          { key: 'Weight', value: '480 gsm (Mid-heavy winter weight)' },
          { key: 'Construction', value: 'Hand-split double-face seam, unlined body' },
          { key: 'Hardware', value: 'Natural buffalo horn buttons' },
          { key: 'Care Instruction', value: 'Specialist Dry Clean Only. Store on cedar contour hanger.' },
          { key: 'Tailored Fit', value: 'Relaxed tailored silhouette with room for layering.' },
        ],
        tags: ['outerwear', 'cashmere', 'luxury coat', 'winter', 'runway'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.95, count: 28 },
      },
      {
        name: 'Milano Ribbed Cashmere Turtleneck',
        slug: 'milano-ribbed-cashmere-turtleneck',
        description:
          'Spun from 2-ply high-twist Mongolian cashmere yarn to eliminate pilling while providing unmatched thermoregulation. A sculptural high collar with snug ribbed cuffs and an architectural raglan sleeve.',
        shortDescription: '2-ply high-twist cashmere turtleneck with seamless raglan drape.',
        price: 380,
        discountPrice: 320,
        category: catMap['cashmere-knitwear'],
        sku: 'AUR-KN-002',
        stock: 26,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Oatmeal Heather', 'Midnight Navy', 'Pure Ivory'],
        images: [
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Composition', value: '100% Pure Mongolian Cashmere' },
          { key: 'Gauge', value: '7-Gauge Chunky Milano Knit' },
          { key: 'Collar', value: 'Ribbed roll turtleneck' },
          { key: 'Care Instruction', value: 'Hand wash cold with wool wash or green dry clean.' },
          { key: 'Fit', value: 'Classic regular drape.' },
        ],
        tags: ['knitwear', 'cashmere', 'sweater', 'turtleneck', 'winter'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.9, count: 42 },
      },
      {
        name: 'Verona Silk Charmeuse Bias-Cut Slip Dress',
        slug: 'verona-silk-charmeuse-bias-cut-slip-dress',
        description:
          'A modern atelier icon. Cut on the bias from heavy 22mm Mulberry silk charmeuse, allowing the fabric to skim the natural contours of the body with liquid movement. Features delicate adjustable French straps and french seams throughout.',
        shortDescription: 'Heavy 22mm Mulberry silk slip dress with fluid bias-cut silhouette.',
        price: 520,
        discountPrice: 460,
        category: catMap['womens-ready-to-wear'],
        sku: 'AUR-DR-003',
        stock: 18,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Champagne Luster', 'Noir Obsidian', 'Emerald Deep'],
        images: [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Composition', value: '100% Grade 6A Mulberry Silk Charmeuse (22 momme)' },
          { key: 'Cut', value: 'Traditional 45-degree True Bias Cut' },
          { key: 'Straps', value: 'Adjustable rolled-edge silk straps with discreet metal hardware' },
          { key: 'Care Instruction', value: 'Dry Clean or hand wash in cold water with silk detergent.' },
          { key: 'Length', value: 'Midi (hits at mid-calf)' },
        ],
        tags: ['dress', 'silk', 'evening', 'slip dress', 'haute'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 5.0, count: 19 },
      },
      {
        name: 'Florentine Structured Wool Blazer',
        slug: 'florentine-structured-wool-blazer',
        description:
          'Crafted from high-twist tropical wool woven by Vitale Barberis Canonico. Cut with soft Neapolitan shoulders (spalla camicia), high armholes for effortless mobility, patch pockets, and peak lapels.',
        shortDescription: 'Vitale Barberis wool blazer with soft Neapolitan shoulder construction.',
        price: 680,
        discountPrice: null,
        category: catMap['mens-tailoring'],
        sku: 'AUR-BL-004',
        stock: 15,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Charcoal Melange', 'Deep Sartorial Navy'],
        images: [
          'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '100% Super 130s Merino Wool (Italy)' },
          { key: 'Canvas', value: 'Half-canvas floating chest piece for breathable structure' },
          { key: 'Lining', value: 'Cupro Bemberg breathable lining' },
          { key: 'Lapel', value: '8.5cm Hand-rolled peak lapel' },
          { key: 'Care Instruction', value: 'Professional Dry Clean Only' },
        ],
        tags: ['blazer', 'tailoring', 'menswear', 'suit', 'wool'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.88, count: 16 },
      },
      {
        name: 'Atelier Relaxed Pleated Wool Trousers',
        slug: 'atelier-relaxed-pleated-wool-trousers',
        description:
          'Engineered with double forward pleats and a relaxed taper. Side waist adjusters replace belt loops for an uninterrupted waistline. Features extended tab waistband and generous 2-inch cuff hems.',
        shortDescription: 'Double-pleated tropical wool trousers with side tab adjusters.',
        price: 310,
        discountPrice: 265,
        category: catMap['mens-tailoring'],
        sku: 'AUR-TR-005',
        stock: 22,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Taupe Melange', 'Anthracite Grey'],
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '100% High-Twist Merino Fresco Wool (Crease-resistant)' },
          { key: 'Waistband', value: 'Curved curtained waistband with brass buckle side tabs' },
          { key: 'Pleats', value: 'Twin deep forward pleats' },
          { key: 'Rise', value: 'High-rise tailoring' },
          { key: 'Care Instruction', value: 'Dry clean only' },
        ],
        tags: ['trousers', 'pleated', 'tailoring', 'pants'],
        isFeatured: false,
        isActive: true,
        ratings: { average: 4.85, count: 21 },
      },
      {
        name: 'Stormproof Gabardine Raglan Trench Coat',
        slug: 'stormproof-gabardine-raglan-trench-coat',
        description:
          'Woven from dense 100% organic cotton gabardine, engineered to deflect wind and driving rain without synthetic coatings. Complete with storm shield, belted waist with leather buckle, and detachable buttoned wool lining for four-season versatility.',
        shortDescription: 'Dense weather-resistant cotton gabardine trench with raglan cut.',
        price: 750,
        discountPrice: 640,
        category: catMap['artisan-outerwear'],
        sku: 'AUR-TR-006',
        stock: 12,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Classic Honey Beige', 'Olive Drab', 'Obsidian'],
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Material', value: '100% Water-repellent Egyptian Cotton Gabardine' },
          { key: 'Lining', value: 'Detachable 80% Wool / 20% Cashmere thermal vest lining' },
          { key: 'Hardware', value: 'Hand-wrapped calfskin buckles' },
          { key: 'Closure', value: 'Double-breasted ten-button closure' },
          { key: 'Care Instruction', value: 'Professional dry clean only' },
        ],
        tags: ['trench', 'outerwear', 'waterproof', 'gabardine'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.96, count: 33 },
      },
      {
        name: 'Kurashiki 14.5oz Raw Selvedge Denim Overshirt',
        slug: 'kurashiki-14-5oz-raw-selvedge-denim-overshirt',
        description:
          'Shuttle-loomed in Kojima, Okayama on vintage 1960s Toyoda looms. Features red selvedge ticker along the placket, solid copper hardware, and natural indigo rope dye that fades into a personalized patina with every wear.',
        shortDescription: 'Okayama shuttle-loomed red-line selvedge jacket with raw indigo dye.',
        price: 420,
        discountPrice: null,
        category: catMap['artisan-outerwear'],
        sku: 'AUR-DN-007',
        stock: 19,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Raw Deep Indigo'],
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Denim', value: '14.5oz Sanforized Kurashiki Selvedge Denim' },
          { key: 'Dye', value: '100% Natural Rope-Dyed Indigo' },
          { key: 'Hardware', value: 'Solid unlacquered raw copper rivets' },
          { key: 'Care Instruction', value: 'Wear raw for 6 months before first cold soak. Hang dry.' },
        ],
        tags: ['denim', 'selvedge', 'japan', 'jacket', 'overshirt'],
        isFeatured: false,
        isActive: true,
        ratings: { average: 4.82, count: 14 },
      },
      {
        name: 'Normandy Pure French Linen Resort Shirt',
        slug: 'normandy-pure-french-linen-resort-shirt',
        description:
          'Crafted from certified Normandy flax linen, pre-washed with volcanic stones for an immediately soft hand that grows softer with every wash. Designed with a relaxed camp collar, mother-of-pearl buttons, and a straight hem with side vents.',
        shortDescription: 'Stone-washed French flax linen resort shirt with Cuban camp collar.',
        price: 220,
        discountPrice: 185,
        category: catMap['silk-resortwear'],
        sku: 'AUR-SH-008',
        stock: 35,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Optic Chalk White', 'Dune Sand', 'Sage Mist'],
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '100% European Certified Normandy Flax Linen' },
          { key: 'Weight', value: '165 gsm Breathable Summer Weight' },
          { key: 'Buttons', value: 'Genuine Australian Mother-of-Pearl' },
          { key: 'Collar', value: 'Camp Cuban revere collar' },
          { key: 'Care Instruction', value: 'Machine wash delicate cold. Hang dry in shade.' },
        ],
        tags: ['linen', 'shirt', 'summer', 'resortwear', 'casual'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.79, count: 39 },
      },
      {
        name: 'Sienna Sunburst Pleated Silk Midi Skirt',
        slug: 'sienna-sunburst-pleated-silk-midi-skirt',
        description:
          'Dramatic permanent accordion sunburst pleats expand fluidly with movement. Cut from heavy silk crepe de chine with an elasticized Grosgrain waist for effortless day-to-evening dressing.',
        shortDescription: 'Sunburst accordion pleated crepe de chine silk midi skirt.',
        price: 360,
        discountPrice: 295,
        category: catMap['womens-ready-to-wear'],
        sku: 'AUR-SK-009',
        stock: 20,
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Terracotta Sun', 'Ivory Lustre'],
        images: [
          'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '100% Silk Crepe de Chine (18 momme)' },
          { key: 'Waistband', value: 'Encased Italian Grosgrain with subtle stretch' },
          { key: 'Length', value: '82cm Midi cut' },
          { key: 'Care Instruction', value: 'Dry Clean Only to preserve pleat permanence.' },
        ],
        tags: ['skirt', 'silk', 'pleated', 'womens'],
        isFeatured: false,
        isActive: true,
        ratings: { average: 4.92, count: 25 },
      },
      {
        name: 'Merino Wool Fine-Gauge Mock Neck Sweater',
        slug: 'merino-wool-fine-gauge-mock-neck-sweater',
        description:
          'Knit from 19.5-micron ultra-fine Australian Merino wool. Lightweight enough to layer seamlessly under tailoring, yet remarkably warm and breathable. Features micro-ribbed cuffs and neck trim.',
        shortDescription: 'Ultra-fine 19.5 micron merino knit engineered for tailored layering.',
        price: 260,
        discountPrice: null,
        category: catMap['cashmere-knitwear'],
        sku: 'AUR-KN-010',
        stock: 30,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Espresso Dark', 'Ice Melange Grey', 'Noir'],
        images: [
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '100% Extra-Fine Australian Merino Wool' },
          { key: 'Gauge', value: '18-Gauge Fine Knit' },
          { key: 'Collar', value: 'Minimalist 3cm Mock Neck' },
          { key: 'Care Instruction', value: 'Hand wash cold flat dry or dry clean.' },
        ],
        tags: ['knitwear', 'merino', 'sweater', 'minimal'],
        isFeatured: false,
        isActive: true,
        ratings: { average: 4.86, count: 18 },
      },
      {
        name: 'Sculptural Tailored Trench Vest',
        slug: 'sculptural-tailored-trench-vest',
        description:
          'An architectural layering centerpiece. Blending the traditional double-breasted storm flap of a trench coat with sleeveless evening versatility. Includes an oversized tie sash and inverted back pleat.',
        shortDescription: 'Architectural sleeveless trench vest in heavy structured twill.',
        price: 490,
        discountPrice: 415,
        category: catMap['womens-ready-to-wear'],
        sku: 'AUR-VT-011',
        stock: 16,
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Stone Beige', 'Ebony Shadow'],
        images: [
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '65% Virgin Wool, 35% Cotton Heavy Twill' },
          { key: 'Lining', value: '100% Silk Habotai' },
          { key: 'Belt', value: 'Matching self-fabric belt with covered buckle' },
          { key: 'Care Instruction', value: 'Dry Clean Only' },
        ],
        tags: ['vest', 'trench', 'outerwear', 'womens'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.9, count: 11 },
      },
      {
        name: 'Mulberry Silk Pajama Lounge Set',
        slug: 'mulberry-silk-pajama-lounge-set',
        description:
          'Elevated loungewear crafted from liquid-drape 22mm silk charmeuse with contrast piping. Features mother-of-pearl buttons, a chest patch pocket, and relaxed wide-leg trousers with an elasticized silk drawstring waist.',
        shortDescription: '22mm Mulberry silk matching button-down shirt and lounge trousers.',
        price: 340,
        discountPrice: 290,
        category: catMap['silk-resortwear'],
        sku: 'AUR-PJ-012',
        stock: 25,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Pearl White with Noir Piping', 'Dusty Rose', 'Nightfall Navy'],
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80',
        ],
        specifications: [
          { key: 'Fabric', value: '100% Grade 6A Pure Mulberry Silk (22 momme)' },
          { key: 'Details', value: 'Contrast hand-stitched piping and French seams' },
          { key: 'Pockets', value: 'Chest pocket on top; side seam pockets on bottoms' },
          { key: 'Care Instruction', value: 'Delicate cold hand wash or eco dry clean' },
        ],
        tags: ['silk', 'loungewear', 'pajama', 'resortwear'],
        isFeatured: true,
        isActive: true,
        ratings: { average: 4.94, count: 35 },
      },
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`[Seeder] Created ${createdProducts.length} clothing products.`);

    // 4. Create Coupons
    const couponsData = [
      {
        code: 'AURA20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 150,
        maxDiscountAmount: 300,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        usageLimit: 500,
        perUserLimit: 2,
        isActive: true,
        description: '20% off all clothing orders over $150 up to $300 savings.',
      },
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 100,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true,
        description: 'Welcome 10% discount on your first atelier garment purchase.',
      },
      {
        code: 'COUTURE50',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 350,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        usageLimit: 200,
        perUserLimit: 1,
        isActive: true,
        description: '$50 instant savings on clothing orders exceeding $350.',
      },
    ];
    await Coupon.insertMany(couponsData);
    console.log('[Seeder] Clothing coupons created.');

    // 5. Create Testimonials
    const testimonialsData = [
      {
        clientName: 'Elena Rostova',
        roleOrCompany: 'Fashion Stylist & Editor, Paris',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        reviewText: 'The Sovereign Double-Faced Cashmere Overcoat is a revelation. The drape is effortless and the hand-finished split seams showcase haute couture craftsmanship at its finest.',
        isFeatured: true,
        isActive: true,
        displayOrder: 1,
      },
      {
        clientName: 'Julian Vance',
        roleOrCompany: 'Creative Partner, London',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        reviewText: 'From concierge sizing advice to unboxing, the atelier experience is immaculate. The Florentine blazer fits like bespoke Neapolitan tailoring without the 8-week wait.',
        isFeatured: true,
        isActive: true,
        displayOrder: 2,
      },
      {
        clientName: 'Clara Delacroix',
        roleOrCompany: 'Art Curator, Milan',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        reviewText: 'The Verona Silk Charmeuse slip dress flows like water. Incredible 22-momme weight that never clings or wrinkles easily. A permanent fixture in my capsule wardrobe.',
        isFeatured: true,
        isActive: true,
        displayOrder: 3,
      },
    ];
    await Testimonial.insertMany(testimonialsData);
    console.log('[Seeder] Clothing testimonials created.');

    // 6. Create Reviews for first product
    await Review.create({
      product: createdProducts[0]._id,
      user: customer._id,
      rating: 5,
      comment: 'An absolute masterpiece of tailoring. Soft, warm yet lightweight, and the hand-finished lapels exude quiet luxury. True to size—my Size M fits like a glove over sweaters.',
      isApproved: true,
      isVerifiedPurchase: true,
    });

    // 7. Create Clothing SiteSettings
    await SiteSettings.create({
      brandName: 'AURA ATELIER',
      tagline: 'Modern Haute Couture • Pure Natural Fibres • Uncompromising Tailoring',
      logoUrl: '',
      hero: {
        badge: '✨ SPRING / SUMMER 2026 COUTURE EDIT',
        title: 'Modern Tailoring & Pure Natural Fibres',
        subtitle: 'Hand-finished virgin cashmere overcoats, Italian Vitale Barberis tailoring, and fluid Mulberry silk silhouettes designed for timeless elegance.',
        ctaText: 'SHOP NOW',
        ctaLink: '/products',
        secondaryCtaText: 'View Atelier Privileges',
        secondaryCtaLink: '/offers',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
      },
      specialOfferBanner: {
        isEnabled: true,
        badge: 'ATELIER PRIVILEGE',
        title: 'Enjoy 20% Off Your Wardrobe Investment',
        subtitle: 'Apply code AURA20 at checkout. Complimentary worldwide express courier & bespoke garment bag included.',
        couponCode: 'AURA20',
        discountText: '20% OFF',
        buttonText: 'Shop New Arrivals',
        buttonLink: '/products',
      },
      features: [
        {
          icon: 'Sparkles',
          title: 'Pure Natural Fibres',
          description: 'Sourced exclusively from Grade-A Mongolian cashmere, Biella wool, and heavy French linen.',
        },
        {
          icon: 'Truck',
          title: 'Complimentary Express Courier',
          description: 'Carbon-neutral worldwide express delivery with bespoke garment hanger and dust cover.',
        },
        {
          icon: 'Scissors',
          title: 'Complimentary Tailoring Concierge',
          description: 'Enjoy complimentary hem adjustments and bespoke sizing consultations on all outerwear.',
        },
        {
          icon: 'ShieldCheck',
          title: 'Lifetime Craftsmanship Guarantee',
          description: 'Every garment is backed by our dedicated atelier repair and rejuvenation guarantee.',
        },
      ],
      stats: [
        { label: 'Active Discerning Clients', value: '45,000+' },
        { label: 'Natural Fibre Purity', value: '100%' },
        { label: 'Client Satisfaction Rating', value: '4.95 / 5' },
        { label: 'Countries Served', value: '68' },
      ],
      contactInfo: {
        email: 'atelier@auraclothing.com',
        phone: '+18008922872',
        whatsappNumber: '+18008922872',
        address: '450 Lexington Avenue, Haute Couture Floor 18, New York, NY 10017',
        workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM EST',
      },
      socialLinks: {
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        twitter: 'https://x.com',
        linkedin: 'https://linkedin.com',
        youtube: 'https://youtube.com',
      },
      announcementBar: {
        isEnabled: true,
        text: 'Complimentary Worldwide Express Courier on Orders Over $150 • 30-Day Effortless Returns & Exchanges',
        link: '/products',
      },
    });

    console.log('[Seeder] Clothing site settings initialized.');
    console.log('\n======================================================');
    console.log(' SEEDING COMPLETE FOR CLOTHING BRAND! ');
    console.log(' Admin Credentials: admin@aurastore.com / Admin@123456');
    console.log(' Customer Credentials: customer@aurastore.com / Customer@123456');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedDatabase();

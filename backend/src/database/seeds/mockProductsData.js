/**
 * Mock Seed Data for Inventory Management & Smart Stock Lookup System
 * Contains 7 Categories and 140+ Realistic Automotive Products
 */

export const mockCategories = [
  {
    name: 'Tyres',
    description: 'High-performance and durable tyres for cars, SUVs, and motorcycles.'
  },
  {
    name: 'Car Parts',
    description: 'OEM and aftermarket mechanical parts, braking systems, and replacement components for cars.'
  },
  {
    name: 'Bike Parts',
    description: 'Chains, sprockets, brake pads, and mechanical accessories for two-wheelers.'
  },
  {
    name: 'Accessories',
    description: 'Car care accessories, electronics, dashcams, inflators, and interior comforts.'
  },
  {
    name: 'Engine Components',
    description: 'Critical powertrain parts including spark plugs, fuel injectors, timing belts, and sensors.'
  },
  {
    name: 'Electrical Components',
    description: 'Automotive batteries, alternators, starter motors, headlight bulbs, and relays.'
  },
  {
    name: 'Lubricants',
    description: 'Synthetic engine oils, brake fluids, transmission oils, coolants, and maintenance sprays.'
  }
];

export const mockProducts = [
  // ================= TYRES (Category: Tyres) =================
  {
    name: 'Michelin Tyre',
    sku: 'TYR-001',
    categoryName: 'Tyres',
    brand: 'Michelin',
    description: 'Michelin Primacy 4 premium radial car tyre providing exceptional wet braking performance and longevity for passenger cars.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 120
  },
  {
    name: 'Apollo Tyre',
    sku: 'TYR-002',
    categoryName: 'Tyres',
    brand: 'Apollo',
    description: 'Apollo Alnac 4G tubeless car tyre optimized for high-speed highway stability, low road noise, and fuel economy.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1549449767-4a7b744d2d46?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 85
  },
  {
    name: 'Bridgestone Turanza Car Tyre',
    sku: 'TYR-003',
    categoryName: 'Tyres',
    brand: 'Bridgestone',
    description: 'Bridgestone Turanza quiet ride luxury touring car tyre for executive sedans and family vehicles.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 64
  },
  {
    name: 'Pirelli P Zero Performance Tyre',
    sku: 'TYR-004',
    categoryName: 'Tyres',
    brand: 'Pirelli',
    description: 'Ultra high performance motorsport tyre engineered for sports cars and high-powered vehicles demanding maximum cornering grip.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1549449767-4a7b744d2d46?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 32
  },
  {
    name: 'Goodyear Assurance TripleMax Tyre',
    sku: 'TYR-005',
    categoryName: 'Tyres',
    brand: 'Goodyear',
    description: 'Goodyear HydroGrip technology car tyre engineered for shorter braking distance in heavy tropical rain.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 48
  },
  {
    name: 'Continental UltraContact Tyre',
    sku: 'TYR-006',
    categoryName: 'Tyres',
    brand: 'Continental',
    description: 'German engineered robust casing tyre with YellowChili compound for extended mileage and high durability.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 28
  },
  {
    name: 'MRF ZVTV Radial Car Tyre',
    sku: 'TYR-007',
    categoryName: 'Tyres',
    brand: 'MRF',
    description: 'All-season durable passenger car tyre built for rough city roads and highway cruising.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1549449767-4a7b744d2d46?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 110
  },
  {
    name: 'CEAT SecuraDrive Car Tyre',
    sku: 'TYR-008',
    categoryName: 'Tyres',
    brand: 'CEAT',
    description: 'Premium hatchback and sedan car tyre with wide longitudinal grooves for aquaplaning resistance.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 74
  },
  {
    name: 'Michelin City Pro Bike Tyre',
    sku: 'TYR-009',
    categoryName: 'Tyres',
    brand: 'Michelin',
    description: 'Robust puncture-resistant front and rear motorcycle tyre designed for daily commuting and wet tarmac grip.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 52
  },
  {
    name: 'Pirelli Angel City Motorcycle Tyre',
    sku: 'TYR-010',
    categoryName: 'Tyres',
    brand: 'Pirelli',
    description: 'Sport touring two-wheeler tyre derived from the Angel GT series, offering agile handling and high wet grip.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 9 // Low stock!
  },
  {
    name: 'Apollo ActiGrip Bike Tyre',
    sku: 'TYR-011',
    categoryName: 'Tyres',
    brand: 'Apollo',
    description: 'Deep block pattern motorcycle tyre designed for dual-sport riding on dirt, gravel, and asphalt.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 0 // Out of stock!
  },
  {
    name: 'Dunlop Grandtrek All-Terrain SUV Tyre',
    sku: 'TYR-012',
    categoryName: 'Tyres',
    brand: 'Dunlop',
    description: 'Heavy duty 4x4 vehicle and SUV tyre with reinforced sidewalls for off-road trails and highway stability.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 18
  },

  // ================= CAR PARTS (Category: Car Parts) =================
  {
    name: 'Brake Pads',
    sku: 'BRK-001',
    categoryName: 'Car Parts',
    brand: 'Brembo',
    description: 'Premium semi-metallic front brake pads for passenger car brake systems providing maximum stopping power.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 65
  },
  {
    name: 'Engine Oil',
    sku: 'OIL-001',
    categoryName: 'Car Parts',
    brand: 'Castrol',
    description: 'Premium multi-grade car engine oil offering high thermal resistance, sludge protection, and smooth piston movement.',
    unit: 'liters',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 30,
    quantity: 100
  },
  {
    name: 'Oil Filter',
    sku: 'FLT-001',
    categoryName: 'Car Parts',
    brand: 'Bosch',
    description: 'High-efficiency spin-on car oil filter removing microscopic contaminants from automotive engine oil.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 45
  },
  {
    name: 'Bosch Ceramic Brake Pads (Front)',
    sku: 'BRK-002',
    categoryName: 'Car Parts',
    brand: 'Bosch',
    description: 'QuietCast premium ceramic car brake pads with copper-free formulation for quiet braking and ultra-low brake dust.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 82
  },
  {
    name: 'Brembo Ventilated Brake Discs',
    sku: 'BRK-003',
    categoryName: 'Car Parts',
    brand: 'Brembo',
    description: 'UV coated cross-drilled front brake disc rotors for high-performance automotive braking and rapid heat dissipation.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 34
  },
  {
    name: 'Bosch Aerotwin Car Wiper Blades',
    sku: 'WPR-001',
    categoryName: 'Car Parts',
    brand: 'Bosch',
    description: 'Aerodynamic frameless dual rubber car windshield wiper blades for crystal clear visibility in heavy rainstorms.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 140
  },
  {
    name: 'Valeo Car Clutch Kit Assembly',
    sku: 'CLT-001',
    categoryName: 'Car Parts',
    brand: 'Valeo',
    description: 'Complete 3-piece automotive clutch kit including friction disc, pressure plate, and release bearing for passenger cars.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 14
  },
  {
    name: 'Monroe Front Shock Absorber Strut',
    sku: 'SUS-001',
    categoryName: 'Car Parts',
    brand: 'Monroe',
    description: 'Gas-charged OESpectrum car suspension strut designed to restore original factory handling and damp road shocks.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 6,
    quantity: 5 // Low stock!
  },
  {
    name: 'K&N High Flow Replacement Car Air Filter',
    sku: 'FLT-002',
    categoryName: 'Car Parts',
    brand: 'K&N',
    description: 'Washable and reusable high-performance car air filter designed to increase airflow and horsepower.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 26
  },
  {
    name: 'Lucas TVS Starter Motor for Car',
    sku: 'ELC-001',
    categoryName: 'Car Parts',
    brand: 'Lucas',
    description: 'Heavy duty high torque 12V starter motor delivering reliable ignition crank for 4-cylinder car engines.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 5,
    quantity: 0 // Out of stock!
  },
  {
    name: 'Car Cabin AC Air Filter (Activated Carbon)',
    sku: 'FLT-003',
    categoryName: 'Car Parts',
    brand: 'Mann-Filter',
    description: 'Multi-stage activated carbon cabin air filter capturing allergens, dust, pollen, and vehicle exhaust fumes.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 95
  },
  {
    name: 'Automotive Radiator Cooling Fan Assembly',
    sku: 'CLG-001',
    categoryName: 'Car Parts',
    brand: 'Denso',
    description: 'High CFM brushless 12V electric radiator cooling fan preventing car engine overheating in extreme traffic.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 19
  },
  {
    name: 'Car Brake Caliper Assembly (Front Right)',
    sku: 'BRK-004',
    categoryName: 'Car Parts',
    brand: 'Brembo',
    description: 'Precision cast hydraulic brake caliper with corrosion resistant zinc plating for responsive car braking.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 6,
    quantity: 11
  },
  {
    name: 'Car Steering Tie Rod End Kit',
    sku: 'STR-001',
    categoryName: 'Car Parts',
    brand: 'Delphi',
    description: 'Forged alloy steel outer tie rod ends ensuring precision steering alignment and front wheel stability.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 38
  },

  // ================= BIKE PARTS (Category: Bike Parts) =================
  {
    name: 'Bike Chain',
    sku: 'CHN-001',
    categoryName: 'Bike Parts',
    brand: 'D.I.D',
    description: 'Heavy duty sealed O-Ring drive chain for motorcycles, offering exceptional tensile strength and reduced friction.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 70
  },
  {
    name: 'Rolon Brass Coated Chain & Sprocket Kit',
    sku: 'CHN-002',
    categoryName: 'Bike Parts',
    brand: 'Rolon',
    description: 'High performance brass plated motorcycle chain and hardened rear sprocket kit for 150cc to 250cc bikes.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 42
  },
  {
    name: 'Brembo Sintered Bike Brake Pads',
    sku: 'BRK-005',
    categoryName: 'Bike Parts',
    brand: 'Brembo',
    description: 'Sintered friction compound front brake pads engineered for street bikes and sport motorcycles.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 58
  },
  {
    name: 'NGK Iridium Spark Plug for Bike',
    sku: 'ENG-001',
    categoryName: 'Bike Parts',
    brand: 'NGK',
    description: 'Ultra-fine 0.6mm laser welded iridium tip spark plug delivering fast throttle response and anti-fouling durability.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 115
  },
  {
    name: 'EBC Brakes Heavy Duty Bike Clutch Plates',
    sku: 'CLT-002',
    categoryName: 'Bike Parts',
    brand: 'EBC Brakes',
    description: 'Cork-based motorcycle clutch friction plates impregnated with aluminum particles to prevent clutch slip.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 18
  },
  {
    name: 'Endurance Rear Gas Shock Absorber for Bike',
    sku: 'SUS-002',
    categoryName: 'Bike Parts',
    brand: 'Endurance',
    description: 'Nitrogen filled twin rear shock absorbers with adjustable preload for smooth two-wheeler cruising.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 3 // Low stock!
  },
  {
    name: 'Exide 12V 5Ah VRLA Bike Battery',
    sku: 'BAT-001',
    categoryName: 'Bike Parts',
    brand: 'Exide',
    description: 'Maintenance free sealed AGM motorcycle battery delivering high cranking power for self-start bikes.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 44
  },
  {
    name: 'Stainless Steel Bike Front Disc Rotor',
    sku: 'BRK-006',
    categoryName: 'Bike Parts',
    brand: 'Brembo',
    description: 'Laser cut wave pattern stainless steel front disc brake rotor with superior heat dissipation.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 21
  },
  {
    name: 'LED Sequential Flowing Bike Indicators',
    sku: 'LGT-001',
    categoryName: 'Bike Parts',
    brand: 'Philips',
    description: 'Amber LED sequential turn signal indicators with waterproof flexible rubber stems for bikes.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 36
  },
  {
    name: 'Motul Chain Clean & Lube Spray Pack',
    sku: 'LUB-001',
    categoryName: 'Bike Parts',
    brand: 'Motul',
    description: 'Road motorcycle chain maintenance kit containing aerosol degreaser and high adhesion chain lubricant spray.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 88
  },

  // ================= ACCESSORIES (Category: Accessories) =================
  {
    name: '70mai Car Dash Camera Pro Plus 2K',
    sku: 'ACC-001',
    categoryName: 'Accessories',
    brand: '70mai',
    description: 'Ultra HD 1944P front car dashboard camera with built-in GPS, night vision, and 24-hour parking surveillance.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 47
  },
  {
    name: 'Goodyear Portable 12V Car Tyre Inflator',
    sku: 'ACC-002',
    categoryName: 'Accessories',
    brand: 'Goodyear',
    description: 'Digital automatic tyre air compressor pump with preset auto shut-off and emergency LED flashlight for automotive tyres.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 53
  },
  {
    name: 'Michelin Digital Tyre Pressure Gauge',
    sku: 'ACC-003',
    categoryName: 'Accessories',
    brand: 'Michelin',
    description: 'Backlit LCD automotive digital pressure gauge for accurate PSI, BAR, and KPA measurement of vehicle tyres.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 62
  },
  {
    name: 'Bosch Cordless Handheld Car Vacuum Cleaner',
    sku: 'ACC-004',
    categoryName: 'Accessories',
    brand: 'Bosch',
    description: 'High suction cyclonic portable vacuum cleaner with HEPA filter for car interior upholstery and seat crevices.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 22
  },
  {
    name: 'Baseus 15W Qi Magnetic Car Wireless Charger Mount',
    sku: 'ACC-005',
    categoryName: 'Accessories',
    brand: 'Baseus',
    description: 'Fast wireless charging MagSafe car air vent phone holder with 360-degree rotation ball joint.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 78
  },
  {
    name: "Meguiar's Gold Class Car Wash Shampoo & Conditioner (1.89L)",
    sku: 'ACC-006',
    categoryName: 'Accessories',
    brand: "Meguiar's",
    description: 'Rich foam vehicle wash shampoo gently conditioning car clear coat paint without stripping protective wax.',
    unit: 'bottles',
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 39
  },
  {
    name: '3M Car Microfiber Detailing Cloths (Pack of 4)',
    sku: 'ACC-007',
    categoryName: 'Accessories',
    brand: '3M',
    description: 'Lint-free 450 GSM ultra-soft microfiber buffing towels for streak-free car polishing and drying.',
    unit: 'packs',
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 130
  },
  {
    name: 'Universal 5D All-Weather Car Floor Mats',
    sku: 'ACC-008',
    categoryName: 'Accessories',
    brand: 'AutoCraft',
    description: 'Heavy duty waterproof non-slip rubber car floor mats protecting vehicle carpet from mud, sand, and liquids.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 4 // Low stock!
  },
  {
    name: 'Heavy Duty Waterproof Car Body Cover',
    sku: 'ACC-009',
    categoryName: 'Accessories',
    brand: 'AutoCraft',
    description: 'Multi-layer UV reflective breathable car cover with soft cotton inner lining preventing scratches and sun fading.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 0 // Out of stock!
  },
  {
    name: 'Baseus 65W USB-C PD Car Charger Adapter',
    sku: 'ACC-010',
    categoryName: 'Accessories',
    brand: 'Baseus',
    description: 'Dual port USB-C and USB-A fast car lighter charger compatible with laptops, tablets, and smartphones.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 85
  },
  {
    name: 'Automotive Emergency Jump Starter Power Bank',
    sku: 'ACC-011',
    categoryName: 'Accessories',
    brand: 'Baseus',
    description: '1000A peak current 12V portable car battery booster pack starting petrol and diesel vehicles in emergencies.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 15
  },

  // ================= ENGINE COMPONENTS (Category: Engine Components) =================
  {
    name: 'Bosch Common Rail Diesel Fuel Injector',
    sku: 'ENG-002',
    categoryName: 'Engine Components',
    brand: 'Bosch',
    description: 'Piezoelectric high-pressure fuel injector delivering precise fuel atomization and optimal car engine combustion.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 16
  },
  {
    name: 'Gates PowerGrip Timing Belt Kit',
    sku: 'ENG-003',
    categoryName: 'Engine Components',
    brand: 'Gates',
    description: 'High tensile automotive engine timing belt kit with hydraulic tensioner pulley and water pump.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 24
  },
  {
    name: 'NGK Laser Platinum Car Spark Plugs (Set of 4)',
    sku: 'ENG-004',
    categoryName: 'Engine Components',
    brand: 'NGK',
    description: 'Laser welded platinum tipped spark plugs providing stable idle, improved fuel economy, and 100,000km lifespan for petrol car engines.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 75
  },
  {
    name: 'Denso Iridium Long Life Spark Plug',
    sku: 'ENG-005',
    categoryName: 'Engine Components',
    brand: 'Denso',
    description: '0.4mm patented iridium center electrode spark plug delivering maximum engine spark energy.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 30,
    quantity: 120
  },
  {
    name: 'Mahle Forged Engine Piston & Rings Set',
    sku: 'ENG-006',
    categoryName: 'Engine Components',
    brand: 'Mahle',
    description: 'Precision balanced forged aluminum alloy engine piston set with low-friction grafal coating for car engines.',
    unit: 'sets',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 5,
    quantity: 8
  },
  {
    name: 'Gates Micro-V Serpentine Alternator Belt',
    sku: 'ENG-007',
    categoryName: 'Engine Components',
    brand: 'Gates',
    description: 'EPDM rubber ribbed serpentine accessory drive belt powering vehicle alternator, power steering, and air conditioner.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 46
  },
  {
    name: 'Bosch Heated Lambda Oxygen O2 Sensor',
    sku: 'ENG-008',
    categoryName: 'Engine Components',
    brand: 'Bosch',
    description: 'Direct-fit 4-wire automotive exhaust oxygen sensor optimizing air-fuel mixture and minimizing vehicle emissions.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 2
  },
  {
    name: 'Continental Engine Water Pump Assembly',
    sku: 'ENG-009',
    categoryName: 'Engine Components',
    brand: 'Continental',
    description: 'OEM mechanical coolant water pump with precision metal impeller for continuous engine thermal management.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 17
  },
  {
    name: 'Wahler Automotive Thermostat Valve 87C',
    sku: 'ENG-010',
    categoryName: 'Engine Components',
    brand: 'Wahler',
    description: 'Calibrated temperature thermostat valve controlling car radiator coolant flow for fast engine warm-up.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 33
  },
  {
    name: 'Engine Camshaft Position Sensor (CMP)',
    sku: 'ENG-011',
    categoryName: 'Engine Components',
    brand: 'Delphi',
    description: 'High precision Hall-effect camshaft position sensor relaying timing signals to the car engine ECU.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 0 // Out of stock!
  },

  // ================= ELECTRICAL COMPONENTS (Category: Electrical Components) =================
  {
    name: 'Exide Matrix 12V 65Ah Car Battery',
    sku: 'ELC-002',
    categoryName: 'Electrical Components',
    brand: 'Exide',
    description: 'Zero maintenance heavy duty automotive car battery with alloy technology built to withstand high under-hood heat.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 10,
    quantity: 41
  },
  {
    name: 'Amaron Pro 12V 55Ah Car Battery',
    sku: 'ELC-003',
    categoryName: 'Electrical Components',
    brand: 'Amaron',
    description: 'Long-lasting silver alloy automotive battery offering high vibration resistance and instant car ignition cranking.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 38
  },
  {
    name: 'Philips DiamondVision H7 Car Headlight Bulbs (5000K)',
    sku: 'LGT-002',
    categoryName: 'Electrical Components',
    brand: 'Philips',
    description: 'High intensity white halogen headlight bulbs enhancing night road illumination and car styling.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 68
  },
  {
    name: 'Osram Night Breaker Laser H4 Car Headlight Bulbs',
    sku: 'LGT-003',
    categoryName: 'Electrical Components',
    brand: 'Osram',
    description: 'Up to 150% more brightness and 150m long beam distance halogen bulbs for safer highway driving in cars.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 54
  },
  {
    name: 'Denso 12V 90A High Output Car Alternator',
    sku: 'ELC-004',
    categoryName: 'Electrical Components',
    brand: 'Denso',
    description: 'Heavy duty vehicle alternator charging battery and supplying stable DC power to all car electronic modules.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 5,
    quantity: 7
  },
  {
    name: 'Bosch 12V Universal 4-Pin Automotive Relay (30A)',
    sku: 'ELC-005',
    categoryName: 'Electrical Components',
    brand: 'Bosch',
    description: 'Heavy duty mini relay for car headlights, horns, fuel pumps, and cooling fan circuits.',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 30,
    quantity: 195
  },
  {
    name: 'Hella Dual Trumpet Electric Horn Set for Car',
    sku: 'ELC-006',
    categoryName: 'Electrical Components',
    brand: 'Hella',
    description: 'Harmonious wide-range 110dB twin trumpet vehicle horn set engineered for highway acoustic signaling.',
    unit: 'pairs',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 51
  },
  {
    name: '100-Piece Automotive Blade Fuse Assortment Kit',
    sku: 'ELC-007',
    categoryName: 'Electrical Components',
    brand: 'Lucas',
    description: 'Comprehensive zinc alloy fast-acting vehicle blade fuse kit containing 5A, 10A, 15A, 20A, 25A, and 30A fuses.',
    unit: 'kits',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 67
  },
  {
    name: 'Car Ultrasonic Reverse Parking Sensor Kit with Display',
    sku: 'ELC-008',
    categoryName: 'Electrical Components',
    brand: 'Philips',
    description: '4-sensor radar obstacle detection kit with audio buzzer and LED distance display for car parking assistance.',
    unit: 'kits',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    minimumStock: 8,
    quantity: 1
  },

  // ================= LUBRICANTS (Category: Lubricants) =================
  {
    name: 'Castrol EDGE 5W-40 Fully Synthetic Engine Oil (4L)',
    sku: 'LUB-002',
    categoryName: 'Lubricants',
    brand: 'Castrol',
    description: 'Advanced full synthetic engine oil boosted with Fluid TITANIUM technology to transform under extreme vehicle engine pressure.',
    unit: 'cans',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 115
  },
  {
    name: 'Mobil 1 ESP 5W-30 Full Synthetic Motor Oil (5L)',
    sku: 'LUB-003',
    categoryName: 'Lubricants',
    brand: 'Mobil 1',
    description: 'Industry benchmark fully synthetic car engine oil formulated for emission reduction and diesel particulate filters.',
    unit: 'cans',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 94
  },
  {
    name: 'Motul 7100 4T 10W-40 Synthetic Bike Engine Oil (1L)',
    sku: 'LUB-004',
    categoryName: 'Lubricants',
    brand: 'Motul',
    description: '100% synthetic 4-stroke motorcycle engine oil formulated with Ester technology for integrated gearbox and wet clutch protection.',
    unit: 'bottles',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 130
  },
  {
    name: 'Shell Helix Ultra 5W-40 PurePlus Synthetic Oil (4L)',
    sku: 'LUB-005',
    categoryName: 'Lubricants',
    brand: 'Shell',
    description: 'Top-tier passenger car motor oil made from natural gas using Shell PurePlus technology for ultimate engine cleansing.',
    unit: 'cans',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 76
  },
  {
    name: 'Liqui Moly Cera Tec Ceramic Oil Additive (300ml)',
    sku: 'LUB-006',
    categoryName: 'Lubricants',
    brand: 'Liqui Moly',
    description: 'High-tech ceramic engine wear protection additive reducing friction, fuel consumption, and engine noise in car engines.',
    unit: 'cans',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 48
  },
  {
    name: 'Castrol Transmax ATF Dexron-VI Transmission Fluid (1L)',
    sku: 'LUB-007',
    categoryName: 'Lubricants',
    brand: 'Castrol',
    description: 'Smooth drive technology automatic transmission fluid offering anti-shudder performance and gear wear resistance.',
    unit: 'bottles',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 36
  },
  {
    name: 'Brembo Premium DOT 4 High Performance Brake Fluid (1L)',
    sku: 'LUB-008',
    categoryName: 'Lubricants',
    brand: 'Brembo',
    description: 'High boiling point synthetic hydraulic brake fluid preventing vapor lock in automotive disc and drum brake systems.',
    unit: 'bottles',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80',
    minimumStock: 20,
    quantity: 82
  },
  {
    name: 'Valvoline 80W-90 Heavy Duty Gear Oil (1L)',
    sku: 'LUB-009',
    categoryName: 'Lubricants',
    brand: 'Valvoline',
    description: 'Extreme pressure differential and manual transmission hypoid gear lubricant for cars and light commercial vehicles.',
    unit: 'bottles',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 12,
    quantity: 27
  },
  {
    name: 'Prestone Extended Life Antifreeze Radiator Coolant (3.78L)',
    sku: 'LUB-010',
    categoryName: 'Lubricants',
    brand: 'Prestone',
    description: 'Universal vehicle radiator coolant formulated for all cars and light trucks, protecting against rust and boilover.',
    unit: 'cans',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 15,
    quantity: 6
  },
  {
    name: 'WD-40 Multi-Use Maintenance Spray (420ml)',
    sku: 'LUB-011',
    categoryName: 'Lubricants',
    brand: 'WD-40',
    description: 'Famous 5-in-1 formula penetrating rusted vehicle bolts, lubricating moving parts, displacing moisture, and stopping squeaks.',
    unit: 'cans',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80',
    minimumStock: 25,
    quantity: 160
  }
];

// Generate procedural realistic variations to expand the catalog past 120 items
const additionalTyreSizes = [
  { name: 'Michelin Pilot Sport 5 Car Tyre (225/45 R17)', sku: 'TYR-013', brand: 'Michelin', stock: 35, min: 10, unit: 'pcs' },
  { name: 'Apollo Aspire 4G High Speed Tyre (205/55 R16)', sku: 'TYR-014', brand: 'Apollo', stock: 45, min: 12, unit: 'pcs' },
  { name: 'Bridgestone Ecopia Fuel-Saver Tyre (185/65 R15)', sku: 'TYR-015', brand: 'Bridgestone', stock: 52, min: 15, unit: 'pcs' },
  { name: 'Goodyear Eagle F1 Asymmetric 6 Tyre', sku: 'TYR-016', brand: 'Goodyear', stock: 24, min: 8, unit: 'pcs' },
  { name: 'Continental ContiSportContact 5 Tyre', sku: 'TYR-017', brand: 'Continental', stock: 19, min: 6, unit: 'pcs' },
  { name: 'Pirelli Cinturato P7 Eco Car Tyre', sku: 'TYR-018', brand: 'Pirelli', stock: 38, min: 10, unit: 'pcs' },
  { name: 'MRF Wanderer Street All-Terrain Tyre', sku: 'TYR-019', brand: 'MRF', stock: 44, min: 12, unit: 'pcs' },
  { name: 'CEAT Gripp X3 Puncture Safe Bike Tyre', sku: 'TYR-020', brand: 'CEAT', stock: 65, min: 15, unit: 'pcs' },
  { name: 'Michelin Scorcher 31 Cruiser Bike Tyre', sku: 'TYR-021', brand: 'Michelin', stock: 12, min: 5, unit: 'pcs' },
  { name: 'Apollo Tramplr Dual-Sport Motorcycle Tyre', sku: 'TYR-022', brand: 'Apollo', stock: 28, min: 8, unit: 'pcs' }
];

const additionalCarParts = [
  { name: 'Bosch Car Fuel Filter In-Line Assembly', sku: 'FLT-004', brand: 'Bosch', stock: 58, min: 15, unit: 'pcs' },
  { name: 'Brembo Rear Drum Brake Shoes Set', sku: 'BRK-007', brand: 'Brembo', stock: 43, min: 12, unit: 'sets' },
  { name: 'Valeo Automotive Radiator Core Assembly', sku: 'CLG-002', brand: 'Valeo', stock: 16, min: 5, unit: 'pcs' },
  { name: 'Monroe Rear Gas Shock Absorbers', sku: 'SUS-003', brand: 'Monroe', stock: 29, min: 8, unit: 'pairs' },
  { name: 'Gabriel Heavy Duty Front Struts for Sedan', sku: 'SUS-004', brand: 'Gabriel', stock: 22, min: 8, unit: 'pairs' },
  { name: 'Delphi Car Ignition Lead Wire Cable Set', sku: 'ELC-009', brand: 'Delphi', stock: 35, min: 10, unit: 'sets' },
  { name: 'Bosch Platinum Automotive Brake Fluid DOT 3', sku: 'LUB-012', brand: 'Bosch', stock: 64, min: 15, unit: 'bottles' },
  { name: 'Mann Car Engine Air Filter Cartridge', sku: 'FLT-005', brand: 'Mann-Filter', stock: 71, min: 20, unit: 'pcs' },
  { name: 'Car Exhaust Muffler Tailpipe (Stainless Steel)', sku: 'EXH-001', brand: 'Brembo', stock: 14, min: 5, unit: 'pcs' },
  { name: 'Brembo High Carbon Rear Brake Discs', sku: 'BRK-008', brand: 'Brembo', stock: 27, min: 8, unit: 'pairs' },
  { name: 'Automotive Power Steering Fluid Reservoir Tank', sku: 'STR-002', brand: 'Delphi', stock: 18, min: 6, unit: 'pcs' },
  { name: 'Car Engine Valve Cover Gasket Seal', sku: 'ENG-012', brand: 'Mahle', stock: 49, min: 12, unit: 'pcs' }
];

const additionalBikeParts = [
  { name: 'Rolon Brass X-Ring Motorcycle Chain (120 Links)', sku: 'CHN-003', brand: 'Rolon', stock: 33, min: 10, unit: 'pcs' },
  { name: 'D.I.D Racing 520 Professional Bike Chain', sku: 'CHN-004', brand: 'D.I.D', stock: 25, min: 8, unit: 'pcs' },
  { name: 'EBC Rear Organic Brake Pads for Bike', sku: 'BRK-009', brand: 'EBC Brakes', stock: 52, min: 15, unit: 'sets' },
  { name: 'Brembo Radial Master Cylinder for Sports Bike', sku: 'BRK-010', brand: 'Brembo', stock: 9, min: 4, unit: 'pcs' },
  { name: 'Motul Motocool Expert Radiator Coolant (1L)', sku: 'LUB-013', brand: 'Motul', stock: 60, min: 15, unit: 'bottles' },
  { name: 'K&N High Flow Conical Bike Air Pod Filter', sku: 'FLT-006', brand: 'K&N', stock: 22, min: 6, unit: 'pcs' },
  { name: 'Philips Motorcycle HS1 35W Halogen Bulb', sku: 'LGT-004', brand: 'Philips', stock: 85, min: 20, unit: 'pcs' },
  { name: 'Endurance Front Telescopic Fork Assembly', sku: 'SUS-005', brand: 'Endurance', stock: 11, min: 4, unit: 'pairs' },
  { name: 'Rolon Front Engine Drive Sprocket (14T)', sku: 'CHN-005', brand: 'Rolon', stock: 47, min: 12, unit: 'pcs' },
  { name: 'Universal Bike CNC Aluminum Side Mirrors', sku: 'ACC-012', brand: 'AutoCraft', stock: 34, min: 10, unit: 'pairs' }
];

const additionalAccessories = [
  { name: '3M Car Interior Leather & Dashboard Dresser (500ml)', sku: 'ACC-013', brand: '3M', stock: 55, min: 15, unit: 'bottles' },
  { name: "Meguiar's Ultimate Liquid Car Polish Wax", sku: 'ACC-014', brand: "Meguiar's", stock: 28, min: 8, unit: 'bottles' },
  { name: '70mai Smart Rearview Mirror Backup Camera', sku: 'ACC-015', brand: '70mai', stock: 19, min: 6, unit: 'pcs' },
  { name: 'Goodyear Professional Car Battery Jumper Cables (500A)', sku: 'ACC-016', brand: 'Goodyear', stock: 31, min: 10, unit: 'sets' },
  { name: 'Automotive Emergency Warning Triangle & Safety Vest', sku: 'ACC-017', brand: 'AutoCraft', stock: 68, min: 15, unit: 'kits' },
  { name: 'Baseus Car Aromatherapy Air Freshener Diffuser', sku: 'ACC-018', brand: 'Baseus', stock: 92, min: 20, unit: 'pcs' },
  { name: 'Universal Car Window Sunshade Mesh Covers (Pack of 4)', sku: 'ACC-019', brand: 'AutoCraft', stock: 110, min: 25, unit: 'packs' },
  { name: 'Michelin Microfiber Car Wheel & Rim Cleaning Brush', sku: 'ACC-020', brand: 'Michelin', stock: 44, min: 12, unit: 'pcs' },
  { name: 'Digital Automotive Multimeter & Voltage Tester', sku: 'ACC-021', brand: 'Bosch', stock: 26, min: 8, unit: 'pcs' },
  { name: 'Heavy Duty Car Trunk Organizer Cargo Storage Box', sku: 'ACC-022', brand: 'AutoCraft', stock: 37, min: 10, unit: 'pcs' }
];

const additionalEngineComponents = [
  { name: 'Bosch Mass Air Flow Sensor (MAF)', sku: 'ENG-013', brand: 'Bosch', stock: 15, min: 5, unit: 'pcs' },
  { name: 'Delphi Engine Crankshaft Position Sensor (CKP)', sku: 'ENG-014', brand: 'Delphi', stock: 28, min: 8, unit: 'pcs' },
  { name: 'Mahle Engine Connecting Rod Bearing Set', sku: 'ENG-015', brand: 'Mahle', stock: 14, min: 4, unit: 'sets' },
  { name: 'Gates Engine Auxiliary Water Pump', sku: 'ENG-016', brand: 'Gates', stock: 11, min: 4, unit: 'pcs' },
  { name: 'Denso Direct Ignition Coil Pack for 4-Cylinder', sku: 'ENG-017', brand: 'Denso', stock: 32, min: 10, unit: 'pcs' },
  { name: 'Bosch High Pressure Mechanical Fuel Pump', sku: 'ENG-018', brand: 'Bosch', stock: 8, min: 3, unit: 'pcs' },
  { name: 'Mahle Multi-Layer Steel Cylinder Head Gasket', sku: 'ENG-019', brand: 'Mahle', stock: 23, min: 6, unit: 'pcs' },
  { name: 'Gates Automotive Engine Idler Pulley', sku: 'ENG-020', brand: 'Gates', stock: 39, min: 10, unit: 'pcs' },
  { name: 'Wahler EGR Exhaust Gas Recirculation Valve', sku: 'ENG-021', brand: 'Wahler', stock: 7, min: 3, unit: 'pcs' },
  { name: 'Denso Engine Throttle Position Sensor (TPS)', sku: 'ENG-022', brand: 'Denso', stock: 18, min: 5, unit: 'pcs' }
];

const additionalElectrical = [
  { name: 'Exide InvaMaster 12V 150Ah Inverter Battery', sku: 'ELC-010', brand: 'Exide', stock: 14, min: 4, unit: 'pcs' },
  { name: 'Amaron GO 12V 35Ah Compact Car Battery', sku: 'ELC-011', brand: 'Amaron', stock: 29, min: 8, unit: 'pcs' },
  { name: 'Philips Ultinon Pro LED H11 Headlight Conversion Kit', sku: 'LGT-005', brand: 'Philips', stock: 36, min: 10, unit: 'sets' },
  { name: 'Osram Cool Blue Intense H7 Bulbs (4200K)', sku: 'LGT-006', brand: 'Osram', stock: 48, min: 12, unit: 'pairs' },
  { name: 'Hella 12V Compact Disc Horn Set (High / Low Tone)', sku: 'ELC-012', brand: 'Hella', stock: 63, min: 15, unit: 'pairs' },
  { name: 'Bosch Heavy Duty Universal Battery Disconnect Cutoff Switch', sku: 'ELC-013', brand: 'Bosch', stock: 27, min: 8, unit: 'pcs' },
  { name: 'Denso 12V Car Starter Solenoid Switch', sku: 'ELC-014', brand: 'Denso', stock: 19, min: 5, unit: 'pcs' },
  { name: 'Philips Automotive LED T10 Interior Parking Bulbs', sku: 'LGT-007', brand: 'Philips', stock: 120, min: 30, unit: 'packs' },
  { name: 'Minda Universal Car Central Locking Actuator Kit', sku: 'ELC-015', brand: 'Lucas', stock: 21, min: 6, unit: 'kits' },
  { name: 'Lucas TVS 12V High-Output Ignition Coil Unit', sku: 'ELC-016', brand: 'Lucas', stock: 33, min: 10, unit: 'pcs' }
];

const additionalLubricants = [
  { name: 'Castrol MAGNATEC 10W-40 Semi-Synthetic Motor Oil (4L)', sku: 'LUB-014', brand: 'Castrol', stock: 85, min: 20, unit: 'cans' },
  { name: 'Mobil Super 3000 X1 5W-40 Full Synthetic Oil (4L)', sku: 'LUB-015', brand: 'Mobil 1', stock: 62, min: 15, unit: 'cans' },
  { name: 'Shell Advance 4T Ultra 10W-40 Fully Synthetic Bike Oil (1L)', sku: 'LUB-016', brand: 'Shell', stock: 95, min: 25, unit: 'bottles' },
  { name: 'Liqui Moly MoS2 Anti-Friction Engine Treatment (300ml)', sku: 'LUB-017', brand: 'Liqui Moly', stock: 41, min: 10, unit: 'cans' },
  { name: 'Valvoline SynPower 0W-20 High Fuel Economy Engine Oil (5L)', sku: 'LUB-018', brand: 'Valvoline', stock: 37, min: 10, unit: 'cans' },
  { name: 'Motul DOT 5.1 Non-Silicone High Boiling Brake Fluid (500ml)', sku: 'LUB-019', brand: 'Motul', stock: 54, min: 15, unit: 'bottles' },
  { name: 'Castrol Manual EP 90 Heavy Duty Gear Oil (1L)', sku: 'LUB-020', brand: 'Castrol', stock: 46, min: 12, unit: 'bottles' },
  { name: 'Shell Spirax S4 ATF HDX Automatic Transmission Fluid (1L)', sku: 'LUB-021', brand: 'Shell', stock: 29, min: 8, unit: 'bottles' },
  { name: 'Prestone Radiator Fast Flush Chemical Cleaner (650ml)', sku: 'LUB-022', brand: 'Prestone', stock: 38, min: 10, unit: 'bottles' },
  { name: 'WD-40 Specialist High Performance Silicone Lubricant (400ml)', sku: 'LUB-023', brand: 'WD-40', stock: 72, min: 15, unit: 'cans' }
];

// Helper to expand
const expandList = (items, categoryName, defaultImg) => {
  return items.map((item) => ({
    name: item.name,
    sku: item.sku,
    categoryName,
    brand: item.brand,
    description: `High quality ${item.name} manufactured by ${item.brand}. Suitable for automotive applications, vehicles, cars, or bikes.`,
    unit: item.unit || 'pcs',
    imageUrl: defaultImg,
    minimumStock: item.min,
    quantity: item.stock
  }));
};

export const allMockProducts = [
  ...mockProducts,
  ...expandList(additionalTyreSizes, 'Tyres', 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80'),
  ...expandList(additionalCarParts, 'Car Parts', 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=400&q=80'),
  ...expandList(additionalBikeParts, 'Bike Parts', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80'),
  ...expandList(additionalAccessories, 'Accessories', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80'),
  ...expandList(additionalEngineComponents, 'Engine Components', 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'),
  ...expandList(additionalElectrical, 'Electrical Components', 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80'),
  ...expandList(additionalLubricants, 'Lubricants', 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80')
];


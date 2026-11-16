import crypto from 'crypto';
import { mockCategories, allMockProducts } from './seeds/mockProductsData.js';

class MockStore {
  constructor() {
    this.categories = [];
    this.products = [];
    this.inventory = new Map(); // productId -> { id, product_id, quantity, updated_at }
    this.stockMovements = [];
    this.stockRequests = [];
    this.vehiclePackages = [];
    this.requestCounter = 1000;

    this.initialize();
  }

  initialize() {
    const now = new Date().toISOString();

    // 1. Seed Categories
    const categoryMap = new Map();
    this.categories = mockCategories.map((c) => {
      const id = crypto.randomUUID();
      categoryMap.set(c.name, id);
      return {
        id,
        name: c.name,
        description: c.description,
        created_at: now,
        updated_at: now
      };
    });

    // 2. Seed Products & Inventory
    this.products = allMockProducts.map((p) => {
      const id = crypto.randomUUID();
      const catId = categoryMap.get(p.categoryName) || this.categories[0].id;
      const initialQty = p.quantity !== undefined ? p.quantity : p.stock !== undefined ? p.stock : 25;
      const minStock = p.minimumStock || p.min || 10;

      const prod = {
        id,
        name: p.name,
        sku: p.sku,
        category_id: catId,
        category_name: p.categoryName,
        brand: p.brand || 'Generic',
        description: p.description || `${p.brand || 'Quality'} automotive component engineered to OEM specifications.`,
        unit: p.unit || 'pcs',
        image_url: p.imageUrl || null,
        minimum_stock: minStock,
        is_active: true,
        created_at: now,
        updated_at: now
      };

      this.inventory.set(id, {
        id: crypto.randomUUID(),
        product_id: id,
        quantity: initialQty,
        updated_at: now
      });

      return prod;
    });

    // 3. Initial Movements for Dashboard
    this.products.slice(0, 15).forEach((p, idx) => {
      const inv = this.inventory.get(p.id);
      const qty = inv ? inv.quantity : 25;
      this.stockMovements.push({
        id: crypto.randomUUID(),
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        unit: p.unit,
        movement_type: idx % 3 === 0 ? 'ADJUSTMENT' : 'IN',
        quantity: Math.min(20, qty),
        previous_quantity: 0,
        new_quantity: qty,
        reason: 'Initial warehouse intake & calibration',
        stock_request_id: null,
        created_at: new Date(Date.now() - (idx + 1) * 3600000).toISOString()
      });
    });

    // 4. Seed Predefined Vehicle Packages
    const findProd = (skuOrName) =>
      this.products.find((p) => p.sku === skuOrName || p.name.toLowerCase().includes(skuOrName.toLowerCase()));

    const pBrakePads = findProd('BRK-001') || this.products[0];
    const pTyre = findProd('TYR-001') || this.products[1];
    const pBrakeDiscs = findProd('BRK-003') || this.products[2];
    const pAirFilter = findProd('FLT-002') || this.products[3];
    const pOilFilter = findProd('FLT-001') || this.products[4];
    const pSparkPlug = findProd('ENG-005') || this.products[5];
    const pEngineOil = findProd('OIL-001') || this.products[6];
    const pWipers = findProd('WPR-001') || this.products[7];
    const pBikeTyre = findProd('TYR-009') || this.products[8];
    const pBikeBrake = findProd('BRK-005') || this.products[9];
    const pBikePlug = findProd('ENG-001') || this.products[10];

    this.vehiclePackages = [
      {
        id: crypto.randomUUID(),
        name: 'Car Complete Parts Package',
        description: 'All-in-one comprehensive mechanical, braking, and powertrain overhaul kit for standard passenger cars.',
        is_active: true,
        created_at: now,
        updated_at: now,
        items: [
          { product_id: pBrakePads.id, required_quantity: 1 },
          { product_id: pTyre.id, required_quantity: 4 },
          { product_id: pBrakeDiscs.id, required_quantity: 4 },
          { product_id: pAirFilter.id, required_quantity: 1 },
          { product_id: pOilFilter.id, required_quantity: 1 },
          { product_id: pSparkPlug.id, required_quantity: 4 }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Car Periodic Maintenance & Lube Kit',
        description: 'Essential 10,000 km regular car service kit including full synthetic engine oil, oil filter, and wiper blades.',
        is_active: true,
        created_at: now,
        updated_at: now,
        items: [
          { product_id: pEngineOil.id, required_quantity: 4 },
          { product_id: pOilFilter.id, required_quantity: 1 },
          { product_id: pWipers.id, required_quantity: 1 }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Motorcycle Performance Tune-Up Kit',
        description: 'Pre-assembled two-wheeler maintenance bundle with premium tyres, sintered brake pads, and laser iridium spark plugs.',
        is_active: true,
        created_at: now,
        updated_at: now,
        items: [
          { product_id: pBikeTyre.id, required_quantity: 2 },
          { product_id: pBikeBrake.id, required_quantity: 1 },
          { product_id: pBikePlug.id, required_quantity: 2 }
        ]
      }
    ];
  }

  // ================= CATEGORIES =================
  getAllCategories(withStats = false) {
    if (!withStats) {
      return this.categories;
    }
    return this.categories.map((c) => {
      const prods = this.products.filter((p) => p.category_id === c.id && p.is_active);
      const stock = prods.reduce((sum, p) => {
        const inv = this.inventory.get(p.id);
        return sum + (inv ? inv.quantity : 0);
      }, 0);
      return {
        ...c,
        product_count: prods.length,
        total_stock_units: stock
      };
    });
  }

  getCategoryById(id) {
    return this.categories.find((c) => c.id === id) || null;
  }

  getCategoryByName(name) {
    return this.categories.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
  }

  createCategory({ name, description }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cat = { id, name, description: description || null, created_at: now, updated_at: now };
    this.categories.push(cat);
    return cat;
  }

  updateCategory(id, { name, description }) {
    const cat = this.getCategoryById(id);
    if (!cat) return null;
    if (name) cat.name = name;
    if (description !== undefined) cat.description = description;
    cat.updated_at = new Date().toISOString();
    return cat;
  }

  deleteCategory(id) {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const deleted = this.categories.splice(idx, 1)[0];
    return { id: deleted.id, name: deleted.name };
  }

  // ================= PRODUCTS & SEARCH =================
  getAllProducts({ page = 1, limit = 20, category, brand, status = 'all', search, sort = 'created_at', order = 'desc' }) {
    let filtered = this.products.filter((p) => p.is_active);

    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        filtered = filtered.filter((p) => p.category_id === category);
      } else {
        filtered = filtered.filter((p) => p.category_name.toLowerCase() === category.toLowerCase());
      }
    }

    if (brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter((p) => {
        const inv = this.inventory.get(p.id);
        const qty = inv ? inv.quantity : 0;
        if (status === 'out_of_stock') return qty === 0;
        if (status === 'low_stock') return qty > 0 && qty <= p.minimum_stock;
        if (status === 'in_stock') return qty > p.minimum_stock;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sort] || '';
      let valB = b[sort] || '';
      if (sort === 'quantity') {
        valA = this.inventory.get(a.id)?.quantity || 0;
        valB = this.inventory.get(b.id)?.quantity || 0;
      }
      if (order === 'desc') return valA < valB ? 1 : -1;
      return valA > valB ? 1 : -1;
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit).map((p) => {
      const inv = this.inventory.get(p.id);
      const qty = inv ? inv.quantity : 0;
      return {
        ...p,
        category: p.category_name,
        quantity: qty,
        stock_status: qty === 0 ? 'out_of_stock' : qty <= p.minimum_stock ? 'low_stock' : 'in_stock'
      };
    });

    return {
      products: paginated,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  getProductById(id) {
    const p = this.products.find((prod) => prod.id === id && prod.is_active);
    if (!p) return null;
    const inv = this.inventory.get(p.id);
    const qty = inv ? inv.quantity : 0;
    return {
      ...p,
      category: p.category_name,
      quantity: qty,
      stock_status: qty === 0 ? 'out_of_stock' : qty <= p.minimum_stock ? 'low_stock' : 'in_stock'
    };
  }

  getProductBySku(sku) {
    const p = this.products.find((prod) => prod.sku.toLowerCase() === sku.toLowerCase());
    if (!p) return null;
    const inv = this.inventory.get(p.id);
    const qty = inv ? inv.quantity : 0;
    return {
      ...p,
      category: p.category_name,
      quantity: qty,
      stock_status: qty === 0 ? 'out_of_stock' : qty <= p.minimum_stock ? 'low_stock' : 'in_stock'
    };
  }

  createProduct(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cat = this.getCategoryById(data.categoryId);

    const prod = {
      id,
      name: data.name,
      sku: data.sku,
      category_id: data.categoryId,
      category_name: cat ? cat.name : 'General',
      brand: data.brand || 'Generic',
      description: data.description || null,
      unit: data.unit || 'pcs',
      image_url: data.imageUrl || null,
      minimum_stock: data.minimumStock || 10,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    this.products.push(prod);

    const initialStock = data.initialStock !== undefined ? Number(data.initialStock) : 0;
    this.inventory.set(id, {
      id: crypto.randomUUID(),
      product_id: id,
      quantity: initialStock,
      updated_at: now
    });

    if (initialStock > 0) {
      this.stockMovements.push({
        id: crypto.randomUUID(),
        product_id: id,
        product_name: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        movement_type: 'IN',
        quantity: initialStock,
        previous_quantity: 0,
        new_quantity: initialStock,
        reason: 'Initial stock on product creation',
        stock_request_id: null,
        created_at: now
      });
    }

    return this.getProductById(id);
  }

  updateProduct(id, data) {
    const p = this.products.find((prod) => prod.id === id);
    if (!p) return null;
    if (data.name) p.name = data.name;
    if (data.sku) p.sku = data.sku;
    if (data.brand) p.brand = data.brand;
    if (data.description !== undefined) p.description = data.description;
    if (data.unit) p.unit = data.unit;
    if (data.imageUrl !== undefined) p.image_url = data.imageUrl;
    if (data.minimumStock !== undefined) p.minimum_stock = data.minimumStock;
    if (data.categoryId) {
      p.category_id = data.categoryId;
      const cat = this.getCategoryById(data.categoryId);
      if (cat) p.category_name = cat.name;
    }
    p.updated_at = new Date().toISOString();
    return this.getProductById(id);
  }

  deleteProduct(id) {
    const p = this.products.find((prod) => prod.id === id);
    if (!p) return null;
    p.is_active = false;
    return { id: p.id, name: p.name };
  }

  // ================= SMART SEARCH =================
  searchProducts({ searchTerm = '', category, brand, status = 'all', page = 1, limit = 20 }) {
    const startTime = performance.now();
    let filtered = this.products.filter((p) => p.is_active);

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q)
      );
    }

    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        filtered = filtered.filter((p) => p.category_id === category);
      } else {
        filtered = filtered.filter((p) => p.category_name.toLowerCase() === category.toLowerCase());
      }
    }

    if (brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    if (status !== 'all') {
      filtered = filtered.filter((p) => {
        const inv = this.inventory.get(p.id);
        const qty = inv ? inv.quantity : 0;
        if (status === 'out_of_stock') return qty === 0;
        if (status === 'low_stock') return qty > 0 && qty <= p.minimum_stock;
        if (status === 'in_stock') return qty > p.minimum_stock;
        return true;
      });
    }

    const totalProducts = filtered.length;
    const totalStockUnits = filtered.reduce((sum, p) => {
      const inv = this.inventory.get(p.id);
      return sum + (inv ? inv.quantity : 0);
    }, 0);

    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit).map((p) => {
      const inv = this.inventory.get(p.id);
      const qty = inv ? inv.quantity : 0;
      return {
        ...p,
        category: p.category_name,
        quantity: qty,
        stock_status: qty === 0 ? 'out_of_stock' : qty <= p.minimum_stock ? 'low_stock' : 'in_stock'
      };
    });

    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

    return {
      products: paginated,
      totalProducts,
      totalStockUnits,
      query: searchTerm,
      executionTimeMs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalProducts / limit) || 1
      }
    };
  }

  // ================= INVENTORY & MOVEMENTS =================
  getInventoryList({ page = 1, limit = 20, category, status = 'all', search, sort = 'updated_at', order = 'desc' }) {
    const res = this.getAllProducts({ page, limit, category, status, search, sort, order });
    const items = res.products.map((p) => {
      const inv = this.inventory.get(p.id);
      return {
        inventory_id: inv ? inv.id : p.id,
        id: inv ? inv.id : p.id,
        product_id: p.id,
        quantity: p.quantity,
        updated_at: inv ? inv.updated_at : p.updated_at,
        product_name: p.name,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        unit: p.unit,
        image_url: p.image_url,
        minimum_stock: p.minimum_stock,
        category_id: p.category_id,
        category_name: p.category_name,
        stock_status: p.stock_status
      };
    });
    return {
      items,
      meta: res.meta
    };
  }

  getInventoryByProductId(productId) {
    const prod = this.getProductById(productId);
    if (!prod) return null;
    const inv = this.inventory.get(productId);
    return {
      inventory_id: inv ? inv.id : prod.id,
      id: inv ? inv.id : prod.id,
      product_id: prod.id,
      quantity: prod.quantity,
      updated_at: inv ? inv.updated_at : prod.updated_at,
      product_name: prod.name,
      name: prod.name,
      sku: prod.sku,
      brand: prod.brand,
      unit: prod.unit,
      image_url: prod.image_url,
      minimum_stock: prod.minimum_stock,
      is_active: prod.is_active,
      category_id: prod.category_id,
      category_name: prod.category_name,
      stock_status: prod.stock_status
    };
  }

  updateStockQuantity(productId, newQuantity) {
    const inv = this.inventory.get(productId);
    if (!inv) return null;
    inv.quantity = Number(newQuantity);
    inv.updated_at = new Date().toISOString();
    return inv;
  }

  recordStockMovement({ productId, movementType, quantity, previousQuantity, newQuantity, reason, stockRequestId = null }) {
    const prod = this.getProductById(productId);
    const mov = {
      id: crypto.randomUUID(),
      product_id: productId,
      product_name: prod?.name || 'Unknown',
      sku: prod?.sku || '',
      unit: prod?.unit || 'pcs',
      movement_type: movementType,
      quantity: Number(quantity),
      previous_quantity: Number(previousQuantity),
      new_quantity: Number(newQuantity),
      reason,
      stock_request_id: stockRequestId,
      created_at: new Date().toISOString()
    };
    this.stockMovements.unshift(mov);
    return mov;
  }

  getMovements({ page = 1, limit = 20, productId, movementType, stockRequestId }) {
    let filtered = [...this.stockMovements];
    if (productId) filtered = filtered.filter((m) => m.product_id === productId);
    if (movementType) filtered = filtered.filter((m) => m.movement_type === movementType);
    if (stockRequestId) filtered = filtered.filter((m) => m.stock_request_id === stockRequestId);

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      movements: paginated,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  // ================= DASHBOARD =================
  getDashboardSummary() {
    const active = this.products.filter((p) => p.is_active);
    let totalStock = 0;
    let inStock = 0;
    let lowStock = 0;
    let outStock = 0;

    active.forEach((p) => {
      const inv = this.inventory.get(p.id);
      const qty = inv ? inv.quantity : 0;
      totalStock += qty;
      if (qty === 0) outStock++;
      else if (qty <= p.minimum_stock) lowStock++;
      else inStock++;
    });

    return {
      totalProducts: active.length,
      totalCategories: this.categories.length,
      totalStockUnits: totalStock,
      inStockCount: inStock,
      lowStockCount: lowStock,
      outOfStockCount: outStock
    };
  }

  getDashboardCategoryDistribution() {
    const active = this.products.filter((p) => p.is_active);
    let grandTotal = 0;

    const stats = this.categories.map((c) => {
      const prods = active.filter((p) => p.category_id === c.id);
      const totalQty = prods.reduce((sum, p) => {
        const inv = this.inventory.get(p.id);
        return sum + (inv ? inv.quantity : 0);
      }, 0);
      grandTotal += totalQty;
      return {
        categoryId: c.id,
        categoryName: c.name,
        productCount: prods.length,
        totalQuantity: totalQty
      };
    });

    return stats.map((s) => ({
      ...s,
      percentage: grandTotal > 0 ? parseFloat(((s.totalQuantity / grandTotal) * 100).toFixed(2)) : 0
    }));
  }

  getDashboardRecentMovements(limit = 10) {
    return this.stockMovements.slice(0, limit).map((m) => {
      const prod = this.getProductById(m.product_id);
      return {
        ...m,
        brand: prod?.brand || 'Generic',
        category_name: prod?.category_name || prod?.category || 'General'
      };
    });
  }

  getDashboardLowStock(limit = 10) {
    const active = this.products.filter((p) => p.is_active);
    const low = [];

    active.forEach((p) => {
      const inv = this.inventory.get(p.id);
      const qty = inv ? inv.quantity : 0;
      if (qty <= p.minimum_stock) {
        low.push({
          id: p.id,
          product_id: p.id,
          name: p.name,
          product_name: p.name,
          sku: p.sku,
          brand: p.brand,
          category_name: p.category_name,
          categoryName: p.category_name,
          quantity: qty,
          minimum_stock: p.minimum_stock,
          minimumStock: p.minimum_stock,
          unit: p.unit,
          image_url: p.image_url,
          imageUrl: p.image_url,
          stock_status: qty === 0 ? 'out_of_stock' : 'low_stock',
          stockStatus: qty === 0 ? 'out_of_stock' : 'low_stock',
          deficit: p.minimum_stock - qty
        });
      }
    });

    low.sort((a, b) => b.deficit - a.deficit);
    return low.slice(0, limit);
  }

  // ================= VEHICLE PACKAGES =================
  getVehiclePackages({ page = 1, limit = 20, search, isActive }) {
    let filtered = [...this.vehiclePackages];
    if (isActive !== undefined) {
      filtered = filtered.filter((p) => p.is_active === isActive);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit).map((pkg) => {
      const totalUnits = (pkg.items || []).reduce((sum, i) => sum + i.required_quantity, 0);
      const preview = (pkg.items || []).map((i) => {
        const prod = this.getProductById(i.product_id);
        return {
          productId: i.product_id,
          name: prod?.name || 'Unknown',
          sku: prod?.sku || '',
          unit: prod?.unit || 'pcs',
          imageUrl: prod?.image_url || null,
          requiredQuantity: i.required_quantity,
          availableQuantity: prod?.quantity || 0
        };
      });

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        is_active: pkg.is_active,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
        item_count: (pkg.items || []).length,
        total_parts_quantity: totalUnits,
        preview_items: preview
      };
    });

    return {
      packages: paginated,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  getVehiclePackageById(id) {
    const pkg = this.vehiclePackages.find((p) => p.id === id);
    if (!pkg) return null;
    const items = (pkg.items || []).map((i) => {
      const prod = this.getProductById(i.product_id);
      return {
        item_id: crypto.randomUUID(),
        package_id: pkg.id,
        product_id: i.product_id,
        required_quantity: i.required_quantity,
        product_name: prod?.name || 'Unknown',
        sku: prod?.sku || '',
        brand: prod?.brand || 'Generic',
        unit: prod?.unit || 'pcs',
        image_url: prod?.image_url || null,
        minimum_stock: prod?.minimum_stock || 10,
        product_is_active: prod ? prod.is_active : false,
        category_name: prod?.category || 'General',
        available_quantity: prod?.quantity || 0,
        stock_status: prod?.stock_status || 'in_stock'
      };
    });

    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      is_active: pkg.is_active,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
      item_count: items.length,
      total_parts_quantity: items.reduce((sum, i) => sum + i.required_quantity, 0),
      items
    };
  }

  expandVehiclePackage(id, multiplier = 1) {
    const pkg = this.getVehiclePackageById(id);
    if (!pkg) return null;
    const mult = Math.max(1, Number(multiplier) || 1);

    const items = pkg.items.map((i) => {
      const req = i.required_quantity * mult;
      const avail = Number(i.available_quantity);
      const sufficient = avail >= req;
      return {
        productId: i.product_id,
        name: i.product_name,
        sku: i.sku,
        brand: i.brand,
        category: i.category_name,
        unit: i.unit,
        imageUrl: i.image_url,
        requiredPerVehicle: i.required_quantity,
        requestedQuantity: req,
        availableQuantity: avail,
        sufficientStock: sufficient,
        deficit: sufficient ? 0 : req - avail,
        stockStatus: i.stock_status,
        packageId: pkg.id,
        packageName: pkg.name
      };
    });

    return {
      packageId: pkg.id,
      packageName: pkg.name,
      description: pkg.description,
      multiplier: mult,
      totalItems: items.length,
      totalUnits: items.reduce((acc, curr) => acc + curr.requestedQuantity, 0),
      allSufficient: items.every((i) => i.sufficientStock),
      items
    };
  }

  createVehiclePackage(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pkg = {
      id,
      name: data.name,
      description: data.description || null,
      is_active: data.isActive !== undefined ? data.isActive : true,
      created_at: now,
      updated_at: now,
      items: (data.items || []).map((i) => ({ product_id: i.productId, required_quantity: Number(i.requiredQuantity) }))
    };
    this.vehiclePackages.push(pkg);
    return this.getVehiclePackageById(id);
  }

  updateVehiclePackage(id, data) {
    const pkg = this.vehiclePackages.find((p) => p.id === id);
    if (!pkg) return null;
    if (data.name) pkg.name = data.name;
    if (data.description !== undefined) pkg.description = data.description;
    if (data.isActive !== undefined) pkg.is_active = data.isActive;
    if (data.items) {
      pkg.items = data.items.map((i) => ({ product_id: i.productId, required_quantity: Number(i.requiredQuantity) }));
    }
    pkg.updated_at = new Date().toISOString();
    return this.getVehiclePackageById(id);
  }

  deleteVehiclePackage(id) {
    const idx = this.vehiclePackages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const deleted = this.vehiclePackages.splice(idx, 1)[0];
    return { id: deleted.id, name: deleted.name };
  }

  // ================= STOCK REQUESTS =================
  verifyStockAvailability(items) {
    const verified = items.map((i) => {
      const prod = this.getProductById(i.productId);
      const avail = prod ? prod.quantity : 0;
      const req = Number(i.requestedQuantity);
      const sufficient = Boolean(prod && prod.is_active && avail >= req);
      return {
        productId: i.productId,
        name: prod?.name || 'Unknown',
        sku: prod?.sku || '',
        brand: prod?.brand || '',
        category: prod?.category || '',
        unit: prod?.unit || 'pcs',
        imageUrl: prod?.image_url || null,
        requestedQuantity: req,
        availableQuantity: avail,
        sufficientStock: sufficient,
        deficit: sufficient ? 0 : req - avail,
        message: sufficient ? 'Stock available' : `Only ${avail} ${prod?.unit || 'pcs'} currently available.`
      };
    });

    const allSufficient = verified.every((i) => i.sufficientStock);
    return {
      verified: allSufficient,
      totalItems: verified.length,
      totalRequestedUnits: verified.reduce((acc, curr) => acc + curr.requestedQuantity, 0),
      hasInsufficientStock: !allSufficient,
      items: verified
    };
  }

  createStockRequest({ notes, items }) {
    this.requestCounter++;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const requestNumber = `REQ-${dateStr}-${String(this.requestCounter).slice(-4)}`;
    const id = crypto.randomUUID();

    const reqItems = items.map((i) => {
      const prod = this.getProductById(i.productId);
      return {
        item_id: crypto.randomUUID(),
        product_id: i.productId,
        product_name: prod?.name || 'Unknown',
        sku: prod?.sku || '',
        unit: prod?.unit || 'pcs',
        category_name: prod?.category || 'General',
        requested_quantity: Number(i.requestedQuantity),
        available_quantity_at_confirmation: null
      };
    });

    const req = {
      id,
      request_number: requestNumber,
      status: 'DRAFT',
      notes: notes || null,
      total_items: items.length,
      total_quantity: items.reduce((sum, i) => sum + Number(i.requestedQuantity), 0),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      confirmed_at: null,
      items: reqItems
    };

    this.stockRequests.unshift(req);
    return req;
  }

  getStockRequests({ page = 1, limit = 20, status = 'all', search }) {
    let filtered = [...this.stockRequests];
    if (status !== 'all') filtered = filtered.filter((r) => r.status === status);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => r.request_number.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q)));
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      requests: paginated,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  getStockRequestById(id) {
    const req = this.stockRequests.find((r) => r.id === id);
    if (!req) return null;
    const items = (req.items || []).map((item) => {
      const prod = this.getProductById(item.product_id);
      const qty = prod ? prod.quantity : 0;
      const min = prod ? prod.minimum_stock : 10;
      return {
        ...item,
        current_available_quantity: qty,
        current_stock_status: qty === 0 ? 'out_of_stock' : qty <= min ? 'low_stock' : 'in_stock'
      };
    });
    return {
      ...req,
      items
    };
  }

  updateStockRequest(id, { notes, items }) {
    const req = this.stockRequests.find((r) => r.id === id);
    if (!req) return null;
    if (req.status !== 'DRAFT') {
      const err = new Error(`Only DRAFT stock requests can be edited. Current status: ${req.status}`);
      err.statusCode = 400;
      throw err;
    }

    const reqItems = items.map((i) => {
      const prod = this.getProductById(i.productId);
      return {
        item_id: crypto.randomUUID(),
        product_id: i.productId,
        product_name: prod?.name || 'Unknown',
        sku: prod?.sku || '',
        unit: prod?.unit || 'pcs',
        category_name: prod?.category || 'General',
        requested_quantity: Number(i.requestedQuantity),
        available_quantity_at_confirmation: null
      };
    });

    req.notes = notes || null;
    req.total_items = items.length;
    req.total_quantity = items.reduce((sum, i) => sum + Number(i.requestedQuantity), 0);
    req.items = reqItems;
    req.updated_at = new Date().toISOString();
    return this.getStockRequestById(id);
  }

  confirmStockRequest(id) {
    const req = this.stockRequests.find((r) => r.id === id);
    if (!req) return null;
    if (req.status === 'CONFIRMED') {
      const err = new Error(`Stock request '${req.request_number}' is already confirmed`);
      err.statusCode = 409;
      throw err;
    }
    if (req.status === 'CANCELLED') {
      const err = new Error(`Cannot confirm cancelled stock request '${req.request_number}'`);
      err.statusCode = 400;
      throw err;
    }
    if (req.status !== 'DRAFT') {
      const err = new Error(`Stock request cannot be confirmed from status '${req.status}'`);
      err.statusCode = 400;
      throw err;
    }

    // Validate stock sufficiency
    const validationFailures = [];
    (req.items || []).forEach((item) => {
      const prod = this.getProductById(item.product_id);
      const currentQty = prod ? prod.quantity : 0;
      if (!prod) {
        validationFailures.push({ productId: item.product_id, reason: 'Product record missing from inventory' });
      } else if (!prod.is_active) {
        validationFailures.push({ productId: item.product_id, reason: 'Product is marked inactive in catalogue' });
      } else if (currentQty < item.requested_quantity) {
        validationFailures.push({
          productId: item.product_id,
          productName: prod.name,
          sku: prod.sku,
          requestedQuantity: item.requested_quantity,
          availableQuantity: currentQty,
          reason: `Insufficient inventory: requested ${item.requested_quantity} ${prod.unit}, only ${currentQty} available`
        });
      }
    });

    if (validationFailures.length > 0) {
      const err = new Error(`Stock request '${req.request_number}' cannot be confirmed due to inventory constraints`);
      err.statusCode = 400;
      err.errors = validationFailures;
      throw err;
    }

    // Deduct stock for all items
    req.items.forEach((item) => {
      const prod = this.getProductById(item.product_id);
      const currentQty = prod ? prod.quantity : 0;
      const deduct = item.requested_quantity;
      const newQty = Math.max(0, currentQty - deduct);

      this.updateStockQuantity(item.product_id, newQty);
      item.available_quantity_at_confirmation = currentQty;

      this.recordStockMovement({
        productId: item.product_id,
        movementType: 'OUT',
        quantity: deduct,
        previousQuantity: currentQty,
        newQuantity: newQty,
        reason: `Stock Request ${req.request_number}`,
        stockRequestId: req.id
      });
    });

    req.status = 'CONFIRMED';
    req.confirmed_at = new Date().toISOString();
    req.updated_at = req.confirmed_at;

    return this.getStockRequestById(id);
  }

  cancelStockRequest(id) {
    const req = this.getStockRequestById(id);
    if (!req) return null;
    if (req.status === 'CONFIRMED') throw new Error('Cannot cancel an already confirmed stock request');
    req.status = 'CANCELLED';
    req.updated_at = new Date().toISOString();
    return req;
  }
}

export const mockStore = new MockStore();

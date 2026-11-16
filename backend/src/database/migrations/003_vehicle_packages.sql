-- 003_vehicle_packages.sql
-- Migration for Vehicle Packages / Predefined Parts Bundles

-- 1. Vehicle Packages Master Table
CREATE TABLE IF NOT EXISTS vehicle_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trigger_vehicle_packages_updated_at ON vehicle_packages;
CREATE TRIGGER trigger_vehicle_packages_updated_at
    BEFORE UPDATE ON vehicle_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Vehicle Package Components Table
CREATE TABLE IF NOT EXISTS vehicle_package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES vehicle_packages(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    required_quantity INTEGER NOT NULL CHECK (required_quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vehicle_package_item UNIQUE (package_id, product_id)
);

DROP TRIGGER IF EXISTS trigger_vehicle_package_items_updated_at ON vehicle_package_items;
CREATE TRIGGER trigger_vehicle_package_items_updated_at
    BEFORE UPDATE ON vehicle_package_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_packages_is_active ON vehicle_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicle_packages_name_trgm ON vehicle_packages USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vehicle_packages_created_at ON vehicle_packages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_package_items_package_id ON vehicle_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_package_items_product_id ON vehicle_package_items(product_id);

-- 4. Seed Standard Default Packages using existing inventory products
DO $$
DECLARE
    pkg_car_complete UUID;
    pkg_car_service UUID;
    pkg_bike_tuneup UUID;
    
    prod_brake_pads UUID;
    prod_michelin_tyre UUID;
    prod_brake_discs UUID;
    prod_air_filter UUID;
    prod_oil_filter UUID;
    prod_spark_plug UUID;
    prod_engine_oil UUID;
    prod_wiper_blades UUID;
    prod_bike_tyre UUID;
    prod_bike_brake UUID;
    prod_bike_plug UUID;
BEGIN
    -- Query matching existing product IDs by SKU or Name
    SELECT id INTO prod_brake_pads FROM products WHERE sku = 'BRK-001' LIMIT 1;
    SELECT id INTO prod_michelin_tyre FROM products WHERE sku = 'TYR-001' LIMIT 1;
    SELECT id INTO prod_brake_discs FROM products WHERE sku = 'BRK-003' LIMIT 1;
    SELECT id INTO prod_air_filter FROM products WHERE sku = 'FLT-002' LIMIT 1;
    SELECT id INTO prod_oil_filter FROM products WHERE sku = 'FLT-001' LIMIT 1;
    SELECT id INTO prod_spark_plug FROM products WHERE sku = 'ENG-005' LIMIT 1;
    SELECT id INTO prod_engine_oil FROM products WHERE sku = 'OIL-001' LIMIT 1;
    SELECT id INTO prod_wiper_blades FROM products WHERE sku = 'WPR-001' LIMIT 1;
    SELECT id INTO prod_bike_tyre FROM products WHERE sku = 'TYR-009' LIMIT 1;
    SELECT id INTO prod_bike_brake FROM products WHERE sku = 'BRK-005' LIMIT 1;
    SELECT id INTO prod_bike_plug FROM products WHERE sku = 'ENG-001' LIMIT 1;

    -- Package 1: Car Complete Parts Package
    IF NOT EXISTS (SELECT 1 FROM vehicle_packages WHERE name = 'Car Complete Parts Package') THEN
        INSERT INTO vehicle_packages (name, description, is_active)
        VALUES (
            'Car Complete Parts Package',
            'All-in-one comprehensive mechanical, braking, and powertrain overhaul kit for standard passenger cars.',
            true
        ) RETURNING id INTO pkg_car_complete;

        IF prod_brake_pads IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_complete, prod_brake_pads, 1) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_michelin_tyre IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_complete, prod_michelin_tyre, 4) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_brake_discs IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_complete, prod_brake_discs, 4) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_air_filter IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_complete, prod_air_filter, 1) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_oil_filter IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_complete, prod_oil_filter, 1) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_spark_plug IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_complete, prod_spark_plug, 4) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Package 2: Car Periodic Maintenance & Lube Kit
    IF NOT EXISTS (SELECT 1 FROM vehicle_packages WHERE name = 'Car Periodic Maintenance & Lube Kit') THEN
        INSERT INTO vehicle_packages (name, description, is_active)
        VALUES (
            'Car Periodic Maintenance & Lube Kit',
            'Essential 10,000 km regular car service kit including full synthetic engine oil, oil filter, and wiper blades.',
            true
        ) RETURNING id INTO pkg_car_service;

        IF prod_engine_oil IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_service, prod_engine_oil, 4) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_oil_filter IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_service, prod_oil_filter, 1) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_wiper_blades IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_car_service, prod_wiper_blades, 1) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Package 3: Motorcycle Performance Tune-Up Kit
    IF NOT EXISTS (SELECT 1 FROM vehicle_packages WHERE name = 'Motorcycle Performance Tune-Up Kit') THEN
        INSERT INTO vehicle_packages (name, description, is_active)
        VALUES (
            'Motorcycle Performance Tune-Up Kit',
            'Pre-assembled two-wheeler maintenance bundle with premium tyres, sintered brake pads, and laser iridium spark plugs.',
            true
        ) RETURNING id INTO pkg_bike_tuneup;

        IF prod_bike_tyre IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_bike_tuneup, prod_bike_tyre, 2) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_bike_brake IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_bike_tuneup, prod_bike_brake, 1) ON CONFLICT DO NOTHING;
        END IF;

        IF prod_bike_plug IS NOT NULL THEN
            INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
            VALUES (pkg_bike_tuneup, prod_bike_plug, 2) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;


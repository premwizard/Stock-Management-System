-- 002_stock_requests.sql
-- Migration for Stock Request & Automatic Inventory Deduction

-- 1. Stock Requests Master Table
CREATE TABLE IF NOT EXISTS stock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    notes TEXT,
    total_items INTEGER NOT NULL DEFAULT 0 CHECK (total_items >= 0),
    total_quantity INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trigger_stock_requests_updated_at ON stock_requests;
CREATE TRIGGER trigger_stock_requests_updated_at
    BEFORE UPDATE ON stock_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Stock Request Line Items Table
CREATE TABLE IF NOT EXISTS stock_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES stock_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    available_quantity_at_confirmation INTEGER CHECK (available_quantity_at_confirmation >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stock_request_item UNIQUE(request_id, product_id)
);

DROP TRIGGER IF EXISTS trigger_stock_request_items_updated_at ON stock_request_items;
CREATE TRIGGER trigger_stock_request_items_updated_at
    BEFORE UPDATE ON stock_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Extend stock_movements with optional stock_request_id reference
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS stock_request_id UUID REFERENCES stock_requests(id) ON DELETE SET NULL;

-- 4. B-Tree Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stock_requests_status ON stock_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_requests_created_at ON stock_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_requests_req_num ON stock_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_stock_request_items_request_id ON stock_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_stock_request_items_product_id ON stock_request_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_request_id ON stock_movements(stock_request_id);


-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE service_type AS ENUM ('here', 'to_go');
CREATE TYPE payment_status AS ENUM ('paid', 'pending_payment');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered');

-- MESAS TABLE
CREATE TABLE mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'available'
);

-- EMPLEADOS TABLE
CREATE TABLE empleados (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- PRODUCTOS TABLE
CREATE TABLE productos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  category_id TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  emoji TEXT,
  color TEXT,
  border_color TEXT
);

-- CATEGORIAS TABLE
CREATE TABLE categorias (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL
);

-- PEDIDOS TABLE (Cabecera de la Orden)
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  service_type service_type NOT NULL,
  payment_status payment_status NOT NULL,
  payment_method TEXT,
  amount_received DECIMAL(10, 2),
  change_given DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  discount_reason TEXT,
  status order_status DEFAULT 'pending',
  customer_info TEXT, -- Nombre si es to_go, Mesa si es here
  total_amount DECIMAL(10, 2) NOT NULL,
  waiter_name TEXT NOT NULL,
  waiter_id TEXT
);

-- DETALLES PEDIDO TABLE (Ítems individuales con modificadores)
CREATE TABLE detalles_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  modifiers JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

-- PRINT_JOBS TABLE (Para el daemon de Raspberry Pi)
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  printed_at TIMESTAMP WITH TIME ZONE,
  job_type TEXT NOT NULL, -- 'kitchen_ticket' o 'customer_receipt'
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'printed', 'failed'
  error_message TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Public Read/Write para desarrollo, se deben restringir a roles autenticados en produccion)
CREATE POLICY "Public Read/Write Mesas" ON mesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Empleados" ON empleados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Detalles Pedido" ON detalles_pedido FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Print Jobs" ON print_jobs FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para pedidos y print_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE print_jobs;

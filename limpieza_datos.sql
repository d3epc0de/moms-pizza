-- =============================================
-- LIMPIEZA DE DATOS DE PRUEBA - Mom's Pizza POS
-- =============================================
-- Este script elimina SOLO los datos transaccionales (pedidos, detalles, print jobs).
-- NO afecta el esquema de la base de datos ni las tablas de productos/empleados.
-- Ejecutar en el panel de Supabase: SQL Editor > New Query > Pegar > Run

-- 1. Eliminar detalles de pedidos (dependencia FK, va primero)
TRUNCATE TABLE detalles_pedido CASCADE;

-- 2. Eliminar pedidos
TRUNCATE TABLE pedidos CASCADE;

-- 3. Eliminar trabajos de impresión
TRUNCATE TABLE print_jobs CASCADE;

-- Verificación: Contar registros restantes (todos deben ser 0)
SELECT 'detalles_pedido' AS tabla, COUNT(*) AS registros FROM detalles_pedido
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'print_jobs', COUNT(*) FROM print_jobs;

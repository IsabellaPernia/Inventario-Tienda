-- Datos de ejemplo para desarrollo. Ejecutar despues de schema.sql.
USE catalogo;

INSERT INTO categories (name) VALUES
  ('Bebidas'),
  ('Snacks'),
  ('Lacteos'),
  ('Limpieza'),
  ('Papeleria');

INSERT INTO products (name, sku, description, price, stock, categoryId, isActive) VALUES
  ('Agua mineral 500 ml',     'BEB-001', 'Botella de agua mineral sin gas',            0.90, 240, 1, TRUE),
  ('Jugo de naranja 1 L',     'BEB-002', 'Jugo natural en caja',                       2.50,  80, 1, TRUE),
  ('Papas fritas 150 g',      'SNK-001', 'Bolsa de papas fritas clasicas',             1.75, 120, 2, TRUE),
  ('Galletas de avena',       'SNK-002', 'Paquete de 12 galletas',                     2.10,  60, 2, TRUE),
  ('Leche entera 1 L',        'LAC-001', 'Leche entera pasteurizada',                  1.40, 150, 3, TRUE),
  ('Yogur natural 200 g',     'LAC-002', NULL,                                         0.85,   0, 3, FALSE),
  ('Detergente liquido 2 L',  'LIM-001', 'Detergente concentrado para ropa',           6.90,  35, 4, TRUE),
  ('Cuaderno rayado 100 h',   'PAP-001', 'Cuaderno universitario tapa dura',           3.20,  90, 5, TRUE);

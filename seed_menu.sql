SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM MenuItems;
DELETE FROM MenuCategories;
DELETE FROM InventoryItems;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE MenuItems AUTO_INCREMENT = 1;
ALTER TABLE MenuCategories AUTO_INCREMENT = 1;
ALTER TABLE InventoryItems AUTO_INCREMENT = 1;

INSERT INTO MenuCategories (Name, Description, CreatedAt) VALUES
('Burgers', 'Classic and specialty burgers', NOW()),
('Chicken', 'Fried and grilled chicken meals', NOW()),
('Sides', 'Fries, rings, and snacks', NOW()),
('Beverages', 'Cold and hot drinks', NOW()),
('Desserts', 'Sweet treats and ice cream', NOW()),
('Combos', 'Value meal combos', NOW());

INSERT INTO InventoryItems (Name, Unit, CurrentStock, MinimumStock, LastUpdated, CreatedAt) VALUES
('Beef Patties', 'pcs', 80.00, 15.00, NOW(), NOW()),
('Chicken Fillet', 'pcs', 60.00, 12.00, NOW(), NOW()),
('Chicken Wings', 'pcs', 50.00, 10.00, NOW(), NOW()),
('Burger Buns', 'pcs', 90.00, 20.00, NOW(), NOW()),
('Hotdog Buns', 'pcs', 30.00, 8.00, NOW(), NOW()),
('Lettuce', 'heads', 25.00, 6.00, NOW(), NOW()),
('Tomatoes', 'pcs', 35.00, 10.00, NOW(), NOW()),
('Onions', 'pcs', 30.00, 8.00, NOW(), NOW()),
('Cheese Slices', 'slices', 100.00, 20.00, NOW(), NOW()),
('Bacon Strips', 'pcs', 40.00, 10.00, NOW(), NOW()),
('Potatoes', 'kg', 40.00, 10.00, NOW(), NOW()),
('Onion Rings Batter', 'kg', 15.00, 5.00, NOW(), NOW()),
('Cooking Oil', 'liters', 20.00, 6.00, NOW(), NOW()),
('Cola Syrup', 'liters', 12.00, 4.00, NOW(), NOW()),
('Lemonade Mix', 'liters', 10.00, 3.00, NOW(), NOW()),
('Coffee Beans', 'kg', 8.00, 2.00, NOW(), NOW()),
('Ice Cream', 'liters', 15.00, 4.00, NOW(), NOW()),
('Apple Filling', 'kg', 10.00, 3.00, NOW(), NOW()),
('Chocolate Syrup', 'liters', 6.00, 2.00, NOW(), NOW()),
('Hotdog Sausage', 'pcs', 35.00, 8.00, NOW(), NOW());

INSERT INTO MenuItems (Name, Description, Price, CategoryId, InventoryItemId, IsAvailable, IsDeleted, CreatedAt, UpdatedAt) VALUES
('Classic Burger', 'Beef patty with lettuce, tomato, and onion', 95.00, 1, 1, 1, 0, NOW(), NOW()),
('Cheeseburger', 'Classic burger topped with melted cheese', 110.00, 1, 1, 1, 0, NOW(), NOW()),
('Double Cheeseburger', 'Two beef patties with double cheese', 145.00, 1, 1, 1, 0, NOW(), NOW()),
('Bacon Cheeseburger', 'Beef patty with bacon, cheese, and fresh veggies', 135.00, 1, 1, 1, 0, NOW(), NOW()),
('Chicken Burger', 'Crispy chicken fillet with lettuce and mayo', 105.00, 1, 2, 1, 0, NOW(), NOW()),
('Spicy Chicken Burger', 'Spicy crispy chicken fillet with jalapenos', 115.00, 1, 2, 1, 0, NOW(), NOW()),
('Hotdog Classic', 'Grilled sausage on a soft bun with toppings', 75.00, 1, 20, 1, 0, NOW(), NOW());

INSERT INTO MenuItems (Name, Description, Price, CategoryId, InventoryItemId, IsAvailable, IsDeleted, CreatedAt, UpdatedAt) VALUES
('2pc Fried Chicken', 'Two pieces of crispy fried chicken', 130.00, 2, 2, 1, 0, NOW(), NOW()),
('3pc Fried Chicken', 'Three pieces of crispy fried chicken', 175.00, 2, 2, 1, 0, NOW(), NOW()),
('Chicken Wings (6pc)', 'Six crispy chicken wings with dip', 140.00, 2, 3, 1, 0, NOW(), NOW()),
('Chicken Wings (12pc)', 'Twelve crispy chicken wings with dip', 250.00, 2, 3, 1, 0, NOW(), NOW()),
('Grilled Chicken Fillet', 'Grilled chicken fillet with house sauce', 145.00, 2, 2, 1, 0, NOW(), NOW());

INSERT INTO MenuItems (Name, Description, Price, CategoryId, InventoryItemId, IsAvailable, IsDeleted, CreatedAt, UpdatedAt) VALUES
('Regular Fries', 'Crispy golden fries', 55.00, 3, 11, 1, 0, NOW(), NOW()),
('Large Fries', 'Bigger serving of crispy fries', 75.00, 3, 11, 1, 0, NOW(), NOW()),
('Cheese Fries', 'Fries topped with melted cheese', 85.00, 3, 11, 1, 0, NOW(), NOW()),
('Onion Rings', 'Crispy battered onion rings', 70.00, 3, 12, 1, 0, NOW(), NOW()),
('Mozzarella Sticks', 'Breaded mozzarella sticks with marinara dip', 95.00, 3, 9, 1, 0, NOW(), NOW()),
('Garden Salad', 'Fresh lettuce, tomato, and onion salad', 65.00, 3, 6, 1, 0, NOW(), NOW());

INSERT INTO MenuItems (Name, Description, Price, CategoryId, InventoryItemId, IsAvailable, IsDeleted, CreatedAt, UpdatedAt) VALUES
('Cola (Regular)', 'Ice-cold cola', 45.00, 4, 14, 1, 0, NOW(), NOW()),
('Cola (Large)', 'Bigger ice-cold cola', 60.00, 4, 14, 1, 0, NOW(), NOW()),
('Iced Tea', 'Refreshing iced tea', 45.00, 4, 14, 1, 0, NOW(), NOW()),
('Lemonade', 'Freshly made lemonade', 55.00, 4, 15, 1, 0, NOW(), NOW()),
('Bottled Water', 'Purified bottled water', 30.00, 4, NULL, 1, 0, NOW(), NOW()),
('Iced Coffee', 'Cold brewed iced coffee', 65.00, 4, 16, 1, 0, NOW(), NOW()),
('Hot Coffee', 'Freshly brewed hot coffee', 60.00, 4, 16, 1, 0, NOW(), NOW());

INSERT INTO MenuItems (Name, Description, Price, CategoryId, InventoryItemId, IsAvailable, IsDeleted, CreatedAt, UpdatedAt) VALUES
('Vanilla Sundae', 'Classic vanilla soft serve sundae', 50.00, 5, 17, 1, 0, NOW(), NOW()),
('Chocolate Sundae', 'Chocolate syrup drizzled soft serve', 55.00, 5, 19, 1, 0, NOW(), NOW()),
('Apple Pie', 'Warm apple pie with cinnamon', 60.00, 5, 18, 1, 0, NOW(), NOW());

INSERT INTO MenuItems (Name, Description, Price, CategoryId, InventoryItemId, IsAvailable, IsDeleted, CreatedAt, UpdatedAt) VALUES
('Classic Combo', 'Classic Burger + Regular Fries + Cola', 165.00, 6, 1, 1, 0, NOW(), NOW()),
('Cheeseburger Combo', 'Cheeseburger + Regular Fries + Cola', 180.00, 6, 1, 1, 0, NOW(), NOW()),
('Chicken Combo', '2pc Fried Chicken + Regular Fries + Cola', 195.00, 6, 2, 1, 0, NOW(), NOW()),
('Family Bucket', '6pc Fried Chicken + Large Fries x2 + Cola (Large) x4', 550.00, 6, 2, 1, 0, NOW(), NOW());

SELECT 'Categories' AS Type, COUNT(*) AS Total FROM MenuCategories
UNION ALL
SELECT 'Menu Items', COUNT(*) FROM MenuItems
UNION ALL
SELECT 'Inventory Items', COUNT(*) FROM InventoryItems
UNION ALL
SELECT 'Linked Items', COUNT(*) FROM MenuItems WHERE InventoryItemId IS NOT NULL;

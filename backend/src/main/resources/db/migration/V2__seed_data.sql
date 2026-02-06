-- V2: Seed data for Tennis Club application

-- Insert default admin user (password: Admin123!)
-- BCrypt hash of "Admin123!" with strength 10
INSERT INTO users (id, username, email, password_hash, role, account_status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Amministratore',
    'admin@tennisclub.it',
    '$2a$10$UcUCCkbev3pYOZO7tO1Xbu7aTGfyO2QS/kxNkTapKxyLYD7MR.J32',
    'ROLE_ADMIN',
    'ATTIVO'
);

-- Insert default site pages
INSERT INTO site_pages (id, slug, title, content_html) VALUES
('b0000000-0000-0000-0000-000000000001', 'home', 'Benvenuti al Tennis Club',
 '<h2>Benvenuti al Tennis Club</h2><p>Il nostro circolo offre campi da tennis e padel di alta qualita''. Prenota il tuo campo e vieni a giocare con noi!</p><p>Disponiamo di campi moderni, illuminazione serale e un ambiente accogliente per tutti gli appassionati di tennis e padel.</p>'),

('b0000000-0000-0000-0000-000000000002', 'about', 'Chi Siamo',
 '<h2>Chi Siamo</h2><p>Il Tennis Club e'' stato fondato con la passione per lo sport e l''obiettivo di offrire strutture di eccellenza per il tennis e il padel.</p><p>Con anni di esperienza, il nostro circolo e'' diventato un punto di riferimento per giocatori di tutti i livelli.</p>'),

('b0000000-0000-0000-0000-000000000003', 'contatti', 'Contatti',
 '<h2>Contatti</h2><p>Non esitare a contattarci per qualsiasi informazione. Siamo a tua disposizione!</p>');

-- Insert default contact info
INSERT INTO contact_info (id, address, phone, email, opening_hours, welcome_message)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Via dello Sport, 1 - 00100 Roma',
    '+39 06 1234567',
    'info@tennisclub.it',
    'Lunedi - Venerdi: 08:00 - 22:00, Sabato - Domenica: 09:00 - 20:00',
    'Benvenuti al Tennis Club! Siamo lieti di accogliervi nei nostri campi.'
);

-- Insert sample courts
INSERT INTO courts (id, name, type, description, status, base_price, member_price, opening_time, closing_time, slot_duration_minutes, display_order) VALUES
('d0000000-0000-0000-0000-000000000001', 'Campo Centrale', 'TENNIS', 'Campo in terra rossa con illuminazione serale. Dimensioni regolamentari per competizioni.', 'ATTIVO', 25.00, 18.00, '08:00', '22:00', 60, 1),
('d0000000-0000-0000-0000-000000000002', 'Campo 2', 'TENNIS', 'Campo in erba sintetica ideale per allenamenti e partite amatoriali.', 'ATTIVO', 20.00, 15.00, '08:00', '22:00', 60, 2),
('d0000000-0000-0000-0000-000000000003', 'Campo 3', 'TENNIS', 'Campo in cemento con copertura per le giornate di pioggia.', 'ATTIVO', 22.00, 16.00, '09:00', '21:00', 60, 3),
('d0000000-0000-0000-0000-000000000004', 'Padel 1', 'PADEL', 'Campo da padel panoramico con pareti in vetro e illuminazione LED.', 'ATTIVO', 30.00, 22.00, '08:00', '22:00', 60, 4),
('d0000000-0000-0000-0000-000000000005', 'Padel 2', 'PADEL', 'Campo da padel indoor con superficie in erba sintetica.', 'ATTIVO', 28.00, 20.00, '09:00', '21:00', 60, 5);

-- ============================================================
-- Script de INSERTs - Dados Reais do Sistema
-- Sistema de Controle de Diaristas
-- Criado em: 2026-04-25
-- Migração de: PostgreSQL/Supabase para MySQL
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. DIARISTAS (Profissionais de Limpeza)
-- ============================================================
INSERT INTO diaristas (id, name, pin, phone, active, photo_url, heavy_cleaning_value, light_cleaning_value, washing_value, ironing_value, transport_value, work_schedule, laundry_assignments, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Diarista Principal', '1234', NULL, TRUE, NULL, 200.00, 150.00, 75.00, 40.00, 30.00, 
'{"sunday":{"isWorkDay":false,"dayType":"heavy_cleaning"},"monday":{"isWorkDay":true,"dayType":"heavy_cleaning"},"tuesday":{"isWorkDay":false,"dayType":"light_cleaning"},"wednesday":{"isWorkDay":true,"dayType":"light_cleaning"},"thursday":{"isWorkDay":false,"dayType":"heavy_cleaning"},"friday":{"isWorkDay":false,"dayType":"light_cleaning"},"saturday":{"isWorkDay":false,"dayType":"heavy_cleaning"}}',
'{}', '2026-02-19 00:00:00');

-- ============================================================
-- 2. CONFIG (Configurações do Sistema)
-- ============================================================
INSERT INTO config (id, `key`, value, label, description, created_at) VALUES
(UUID(), 'admin_pin', 7212, 'PIN do Administrador', 'PIN para acesso à área administrativa', NOW()),
(UUID(), 'heavy_cleaning_value', 200.00, 'Valor Faxina Pesada', 'Valor pago por dia de faxina pesada', NOW()),
(UUID(), 'light_cleaning_value', 150.00, 'Valor Faxina Leve', 'Valor pago por dia de faxina leve', NOW()),
(UUID(), 'laundry_value', 75.00, 'Valor Lavanderia', 'Valor pago por semana de lavanderia', NOW()),
(UUID(), 'ironing_value', 40.00, 'Valor Passar Roupa', 'Valor adicional por passar roupa', NOW()),
(UUID(), 'transport_value', 30.00, 'Valor Transporte', 'Valor pago por semana de transporte', NOW()),
(UUID(), 'award_value', 300.00, 'Valor do Prêmio', 'Valor do prêmio trimestral por desempenho', NOW());

-- ============================================================
-- 3. CLIENTS (Clientes)
-- Se não houver clientes cadastrados, inserir um cliente padrão
-- ============================================================
-- INSERT INTO clients (id, name, address, neighborhood, phone, notes, active, created_at) VALUES
-- (UUID(), 'Cliente Exemplo', 'Rua Exemplo, 123', 'Centro', '(11) 99999-9999', 'Cliente de exemplo', TRUE, NOW());

-- ============================================================
-- 4. ATTENDANCE (Registro de Presença)
-- ============================================================
INSERT INTO attendance (id, date, day_type, present, diarista_id, created_at) VALUES
('991d671f-3474-4c7c-b0c0-5b5a127245ae', '2026-03-09', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('8cd413ab-cfbf-4f27-94f2-fac3de836ebd', '2026-03-12', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('534770b7-467d-413c-9816-33627d5057ac', '2026-03-16', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('87bb41cc-9152-44e4-81c9-fe52643bca30', '2026-03-19', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('985456e6-cb5f-4521-93df-af579d46ba29', '2026-03-23', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('456a09dc-f5cf-4c93-9ca3-a2bfb807ef15', '2026-03-26', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('7e6eb77e-5eb2-4748-a2cd-00de24504a8d', '2026-03-30', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('ac4fed38-a92a-4223-a7c8-2fc8e6ada649', '2026-04-02', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('0129165d-0307-411b-be88-a1a160b2874e', '2026-04-06', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('28b80738-9624-4778-b05c-1b7b5924c093', '2026-04-09', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('e3fd9f85-b91c-4e03-9cf1-9ecab000ef3c', '2026-04-13', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('bdc1e8db-6c7e-453f-b5a6-0c5b1e6d5c6a', '2026-04-16', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('d5a2c7e4-8b3f-4a9c-b2d1-3e4f5a6b7c8d', '2026-04-20', 'heavy_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW()),
('f6b3d8e5-9c4a-5b0d-c3e2-4f5a6b7c8d9e', '2026-04-23', 'light_cleaning', TRUE, '00000000-0000-0000-0000-000000000001', NOW());

-- ============================================================
-- 5. LAUNDRY_WEEKS (Semanas de Lavanderia)
-- ============================================================
INSERT INTO laundry_weeks (id, week_number, month, year, value, washed, ironed, transport_fee, transport_paid_amount, diarista_id, created_at) VALUES
-- Fevereiro 2026
('42030023-c950-494c-8725-6b613c8b9d1c', 1, 2, 2026, 0.00, FALSE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('bc558be3-fcac-4679-97fc-caecda8b552b', 2, 2, 2026, 0.00, FALSE, FALSE, 30.00, 0.00, '00000000-0000-0000-0000-000000000001', NOW()),
('73e366ec-e983-4919-b430-6b0c365a8682', 3, 2, 2026, 0.00, FALSE, FALSE, 30.00, 0.00, '00000000-0000-0000-0000-000000000001', NOW()),
('b6361b4a-ac3b-49ac-b39b-5a5ebc4b6c33', 4, 2, 2026, 0.00, FALSE, FALSE, 30.00, 0.00, '00000000-0000-0000-0000-000000000001', NOW()),
-- Março 2026
('2a7df5e7-e14e-4229-be75-e9a3bc295f7b', 2, 3, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('6e6b9976-32ea-4ded-a880-8eb97c43a5ed', 3, 3, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('7ce1d252-88a1-4b05-b805-4bbf3d209233', 4, 3, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 3, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
-- Abril 2026
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 1, 4, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 2, 4, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('d4e5f6a7-b8c9-0123-defa-234567890123', 3, 4, 2026, 75.00, TRUE, FALSE, 30.00, 30.00, '00000000-0000-0000-0000-000000000001', NOW()),
('e5f6a7b8-c9d0-1234-efab-345678901234', 4, 4, 2026, 0.00, FALSE, FALSE, 30.00, 0.00, '00000000-0000-0000-0000-000000000001', NOW());

-- ============================================================
-- 6. MONTHLY_PAYMENTS (Pagamentos Mensais)
-- ============================================================
INSERT INTO monthly_payments (id, month, year, payment_date, payment_due_date, monthly_value, receipt_url, paid_at, hour_limit, notes, diarista_id, created_at) VALUES
-- Março 2026
(UUID(), 3, 2026, '2026-04-05', '2026-04-05', 1100.00, NULL, '2026-04-05 10:00:00', '10:00', 'Pagamento referente a Março/2026', '00000000-0000-0000-0000-000000000001', NOW()),
-- Abril 2026
(UUID(), 4, 2026, NULL, '2026-05-05', 0.00, NULL, NULL, '10:00', 'Pagamento referente a Abril/2026', '00000000-0000-0000-0000-000000000001', NOW());

-- ============================================================
-- 7. NOTES (Anotações/Notificações)
-- ============================================================
INSERT INTO notifications (id, diarista_id, title, message, type, `read`, created_at) VALUES
('ae575d22-d21c-4249-9cc0-cd2e08d76cda', '00000000-0000-0000-0000-000000000001', 'Nova Anotacao', 
 'Observação: Nos dias 02/03/2026 e 05/03/2026 foram pagos no dia 09/03/2026', 
 'note', TRUE, '2026-03-09 21:34:25'),
('6193c6a9-9c30-439f-a198-85c78574d9a1', '00000000-0000-0000-0000-000000000001', 'Nova Anotacao', 
 'Nota Geral: No dia 09/03/2026 foi pago 30,00 referente o transporte. Porém a diarista foi de carona e não irá utilizar este valor para transporte.', 
 'note', TRUE, '2026-03-09 21:36:02'),
('356c3e48-05ef-4d89-bc50-8f4826e50794', '00000000-0000-0000-0000-000000000001', 'Nova Anotacao', 
 'Nota Geral: No pagamento será descontado:\n\n100,00 de pedido de empréstimo no dia: 27/03/2026\n25,00 porque solicitou adiantamento', 
 'note', TRUE, '2026-03-31 01:16:38'),
('6ba40508-1a99-4f61-bf09-4236b0333524', '00000000-0000-0000-0000-000000000001', 'Anotacao Atualizada', 
 'Nota Geral: No pagamento será descontado:\n\n1 - 100,00 de pedido de empréstimo no dia: 27/03/2026\n2 - 25,00 porque solicitou adiantamento', 
 'note', TRUE, '2026-03-31 01:17:19'),
('ae625fd8-bd12-47dd-8cc9-4e2bbaa44e2a', '00000000-0000-0000-0000-000000000001', 'Anotacao Atualizada', 
 'Nota Geral: No pagamento será descontado:\n\n1 - 100,00 de pedido de empréstimo no dia: 27/03/2026;\n2 - 25,00 porque solicitou adiantamento.', 
 'note', TRUE, '2026-03-31 01:17:34');

-- ============================================================
-- 8. AWARDS (Premiações)
-- ============================================================
INSERT INTO awards (id, period_start, period_end, status, value, warnings_count, attendance_score, performance_score, conduct_score, disqualification_reason, awarded_at, diarista_id, created_at) VALUES
('48b3f947-6927-4e2a-b69f-e8c3887fee80', '2025-11-01', '2026-02-28', 'pending', 300.00, 0, 0.00, 0.00, 0.00, NULL, NULL, '00000000-0000-0000-0000-000000000001', '2026-02-21 01:28:07');

-- ============================================================
-- 9. CONTRACT_AGREEMENTS (Acordos de Contrato)
-- ============================================================
INSERT INTO contract_agreements (id, agreed_at, ip_address, user_agent, diarista_id, created_at) VALUES
('cc407d46-d8b7-40e2-8a43-e2a9f00984c7', '2026-04-01 09:12:14', NULL, NULL, '00000000-0000-0000-0000-000000000001', '2026-04-01 09:12:14');

-- ============================================================
-- 10. WORK_DAYS (Dias de Trabalho - Tabela adicional)
-- ============================================================
-- Esta tabela foi encontrada no banco mas não há dados disponíveis
-- CREATE TABLE IF NOT EXISTS work_days (
--     id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
--     day_of_week ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') NOT NULL,
--     is_work_day BOOLEAN DEFAULT FALSE,
--     day_type ENUM('heavy_cleaning', 'light_cleaning') DEFAULT 'heavy_cleaning',
--     diarista_id CHAR(36),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     
--     CONSTRAINT fk_work_days_diarista 
--         FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Reabilitar verificação de chaves estrangeiras
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- FIM DO SCRIPT DE INSERTS
-- ============================================================

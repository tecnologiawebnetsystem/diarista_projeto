-- ============================================================
-- Script de Inserção de Dados Iniciais - MySQL
-- Sistema de Controle de Diaristas
-- Criado em: 2026-04-25
-- ============================================================

-- USE diarista_db;

-- ============================================================
-- CONFIGURAÇÕES DO SISTEMA (config)
-- ============================================================
INSERT INTO config (id, `key`, value, label, description) VALUES
    (UUID(), 'admin_pin', 1234, 'PIN Administrador', 'PIN de acesso ao painel admin'),
    (UUID(), 'heavy_cleaning_value', 180.00, 'Valor Faxina Pesada', 'Valor padrão para faxina pesada (segunda-feira)'),
    (UUID(), 'light_cleaning_value', 150.00, 'Valor Faxina Leve', 'Valor padrão para faxina leve (quinta-feira)'),
    (UUID(), 'washing_value', 35.00, 'Valor Lavagem', 'Valor padrão por lavagem de roupa'),
    (UUID(), 'ironing_value', 35.00, 'Valor Passar', 'Valor padrão por passar roupa'),
    (UUID(), 'transport_value', 20.00, 'Valor Transporte', 'Valor padrão do transporte por semana'),
    (UUID(), 'award_value', 100.00, 'Valor Premiação', 'Valor da premiação mensal por bom desempenho'),
    (UUID(), 'payment_due_day', 5, 'Dia de Vencimento', 'Dia do mês para vencimento do pagamento');

-- ============================================================
-- CLIENTES DE EXEMPLO (clients)
-- ============================================================
-- Descomente e ajuste conforme necessário

-- INSERT INTO clients (id, name, address, neighborhood, phone, notes, active) VALUES
--     (UUID(), 'Maria Silva', 'Rua das Flores, 123', 'Centro', '(11) 99999-1111', 'Cliente desde 2024', TRUE),
--     (UUID(), 'João Santos', 'Av. Brasil, 456', 'Jardim Europa', '(11) 99999-2222', 'Prefere segundas-feiras', TRUE),
--     (UUID(), 'Ana Oliveira', 'Rua do Sol, 789', 'Vila Nova', '(11) 99999-3333', 'Casa grande, 3 quartos', TRUE);

-- ============================================================
-- DIARISTAS DE EXEMPLO (diaristas)
-- ============================================================
-- IMPORTANTE: Altere os dados abaixo com as informações reais

-- Exemplo de work_schedule em JSON:
-- [
--   {"day": "monday", "type": "heavy_cleaning", "client_id": null},
--   {"day": "thursday", "type": "light_cleaning", "client_id": null}
-- ]

-- Exemplo de laundry_assignments em JSON:
-- [
--   {"client_id": "uuid-do-cliente", "services": ["washing", "ironing"]}
-- ]

INSERT INTO diaristas (
    id, 
    name, 
    pin, 
    phone, 
    active, 
    photo_url,
    heavy_cleaning_value, 
    light_cleaning_value, 
    washing_value, 
    ironing_value, 
    transport_value,
    work_schedule,
    laundry_assignments
) VALUES
(
    UUID(),
    'Diarista Exemplo',
    '1234',
    '(11) 99999-0000',
    TRUE,
    NULL,
    180.00,
    150.00,
    35.00,
    35.00,
    20.00,
    '[{"day": "monday", "type": "heavy_cleaning", "client_id": null}, {"day": "thursday", "type": "light_cleaning", "client_id": null}]',
    '[]'
);

-- ============================================================
-- SCRIPT PARA INSERIR MAIS CONFIGURAÇÕES SE NECESSÁRIO
-- ============================================================

-- Para adicionar configuração de hora limite de chegada:
-- INSERT INTO config (id, `key`, value, label, description) VALUES
--     (UUID(), 'arrival_time_limit', 10, 'Hora Limite Chegada', 'Hora limite para chegada (formato 24h)');

-- ============================================================
-- DADOS DE PAGAMENTOS MENSAIS (monthly_payments)
-- ============================================================
-- Insira após ter os IDs das diaristas cadastradas

-- SET @diarista_id = (SELECT id FROM diaristas WHERE name = 'Diarista Exemplo' LIMIT 1);

-- INSERT INTO monthly_payments (
--     id,
--     month,
--     year,
--     payment_due_date,
--     monthly_value,
--     hour_limit,
--     diarista_id
-- ) VALUES
--     (UUID(), 4, 2026, '2026-05-05', 0.00, '10:00', @diarista_id);

-- ============================================================
-- DADOS DE SEMANAS DE LAVANDERIA (laundry_weeks)
-- ============================================================
-- Insira após ter os IDs das diaristas cadastradas

-- SET @diarista_id = (SELECT id FROM diaristas WHERE name = 'Diarista Exemplo' LIMIT 1);

-- INSERT INTO laundry_weeks (
--     id,
--     week_number,
--     month,
--     year,
--     value,
--     ironed,
--     washed,
--     transport_fee,
--     diarista_id
-- ) VALUES
--     (UUID(), 1, 4, 2026, 70.00, FALSE, FALSE, 20.00, @diarista_id),
--     (UUID(), 2, 4, 2026, 70.00, FALSE, FALSE, 20.00, @diarista_id),
--     (UUID(), 3, 4, 2026, 70.00, FALSE, FALSE, 20.00, @diarista_id),
--     (UUID(), 4, 4, 2026, 70.00, FALSE, FALSE, 20.00, @diarista_id);

-- ============================================================
-- DADOS DE PRESENÇA (attendance)
-- ============================================================
-- Insira após ter os IDs das diaristas cadastradas

-- SET @diarista_id = (SELECT id FROM diaristas WHERE name = 'Diarista Exemplo' LIMIT 1);

-- INSERT INTO attendance (
--     id,
--     date,
--     day_type,
--     present,
--     start_time,
--     end_time,
--     notes,
--     diarista_id
-- ) VALUES
--     (UUID(), '2026-04-21', 'heavy_cleaning', TRUE, '08:00:00', '16:00:00', NULL, @diarista_id),
--     (UUID(), '2026-04-24', 'light_cleaning', TRUE, '08:30:00', '15:00:00', NULL, @diarista_id);

-- ============================================================
-- NOTAS/ADVERTÊNCIAS (notes)
-- ============================================================
-- Insira após ter os IDs das diaristas cadastradas

-- SET @diarista_id = (SELECT id FROM diaristas WHERE name = 'Diarista Exemplo' LIMIT 1);

-- INSERT INTO notes (
--     id,
--     date,
--     note_type,
--     content,
--     is_warning,
--     diarista_id
-- ) VALUES
--     (UUID(), '2026-04-25', 'observation', 'Excelente trabalho esta semana', FALSE, @diarista_id);

-- ============================================================
-- PREMIAÇÕES (awards)
-- ============================================================
-- Insira após ter os IDs das diaristas cadastradas

-- SET @diarista_id = (SELECT id FROM diaristas WHERE name = 'Diarista Exemplo' LIMIT 1);

-- INSERT INTO awards (
--     id,
--     period_start,
--     period_end,
--     status,
--     value,
--     warnings_count,
--     attendance_score,
--     performance_score,
--     conduct_score,
--     diarista_id
-- ) VALUES
--     (UUID(), '2026-04-01', '2026-04-30', 'pending', 100.00, 0, 100.00, 100.00, 100.00, @diarista_id);

-- ============================================================
-- HISTÓRICO DE PAGAMENTOS (payment_history)
-- ============================================================
-- Insira após ter os IDs das diaristas cadastradas

-- SET @diarista_id = (SELECT id FROM diaristas WHERE name = 'Diarista Exemplo' LIMIT 1);

-- INSERT INTO payment_history (
--     id,
--     diarista_id,
--     month,
--     year,
--     type,
--     description,
--     amount,
--     status
-- ) VALUES
--     (UUID(), @diarista_id, 4, 2026, 'salary', 'Pagamento mensal Abril/2026', 1200.00, 'pending'),
--     (UUID(), @diarista_id, 4, 2026, 'laundry', 'Lavanderia Abril/2026', 280.00, 'pending'),
--     (UUID(), @diarista_id, 4, 2026, 'transport', 'Transporte Abril/2026', 80.00, 'pending');

-- ============================================================
-- FIM DO SCRIPT DE INSERÇÃO DE DADOS
-- ============================================================

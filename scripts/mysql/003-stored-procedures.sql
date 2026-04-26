-- ============================================================
-- Stored Procedures e Functions - MySQL
-- Sistema de Controle de Diaristas
-- Criado em: 2026-04-25
-- ============================================================

-- USE diarista_db;

DELIMITER //

-- ============================================================
-- FUNCTION: Calcular total de dias trabalhados no mês
-- ============================================================
CREATE FUNCTION IF NOT EXISTS fn_total_work_days(
    p_diarista_id CHAR(36),
    p_month INT,
    p_year INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(
        CASE 
            WHEN a.day_type = 'heavy_cleaning' THEN d.heavy_cleaning_value
            WHEN a.day_type = 'light_cleaning' THEN d.light_cleaning_value
            ELSE 0
        END
    ), 0) INTO v_total
    FROM attendance a
    JOIN diaristas d ON d.id = a.diarista_id
    WHERE a.diarista_id = p_diarista_id
    AND a.present = TRUE
    AND MONTH(a.date) = p_month
    AND YEAR(a.date) = p_year;
    
    RETURN v_total;
END//

-- ============================================================
-- FUNCTION: Calcular total de lavanderia no mês
-- ============================================================
CREATE FUNCTION IF NOT EXISTS fn_total_laundry(
    p_diarista_id CHAR(36),
    p_month INT,
    p_year INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(
        CASE WHEN washed THEN (SELECT value FROM config WHERE `key` = 'washing_value') ELSE 0 END +
        CASE WHEN ironed THEN (SELECT value FROM config WHERE `key` = 'ironing_value') ELSE 0 END
    ), 0) INTO v_total
    FROM laundry_weeks
    WHERE diarista_id = p_diarista_id
    AND month = p_month
    AND year = p_year;
    
    RETURN v_total;
END//

-- ============================================================
-- FUNCTION: Calcular total de transporte no mês
-- ============================================================
CREATE FUNCTION IF NOT EXISTS fn_total_transport(
    p_diarista_id CHAR(36),
    p_month INT,
    p_year INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(transport_fee), 0) INTO v_total
    FROM laundry_weeks
    WHERE diarista_id = p_diarista_id
    AND month = p_month
    AND year = p_year;
    
    RETURN v_total;
END//

-- ============================================================
-- PROCEDURE: Obter resumo mensal da diarista
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_monthly_summary(
    IN p_diarista_id CHAR(36),
    IN p_month INT,
    IN p_year INT
)
BEGIN
    SELECT 
        d.id,
        d.name,
        p_month AS month,
        p_year AS year,
        fn_total_work_days(p_diarista_id, p_month, p_year) AS total_work_days,
        fn_total_laundry(p_diarista_id, p_month, p_year) AS total_laundry,
        fn_total_transport(p_diarista_id, p_month, p_year) AS total_transport,
        (
            fn_total_work_days(p_diarista_id, p_month, p_year) +
            fn_total_laundry(p_diarista_id, p_month, p_year) +
            fn_total_transport(p_diarista_id, p_month, p_year)
        ) AS grand_total,
        (SELECT COUNT(*) FROM notes WHERE diarista_id = p_diarista_id AND is_warning = TRUE 
         AND MONTH(date) = p_month AND YEAR(date) = p_year) AS warnings_count,
        (SELECT COUNT(*) FROM attendance WHERE diarista_id = p_diarista_id AND present = TRUE 
         AND MONTH(date) = p_month AND YEAR(date) = p_year) AS days_worked
    FROM diaristas d
    WHERE d.id = p_diarista_id;
END//

-- ============================================================
-- PROCEDURE: Criar semanas de lavanderia para o mês
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_create_laundry_weeks(
    IN p_diarista_id CHAR(36),
    IN p_month INT,
    IN p_year INT
)
BEGIN
    DECLARE v_week INT DEFAULT 1;
    DECLARE v_transport_value DECIMAL(10,2);
    
    -- Obter valor de transporte da configuração
    SELECT COALESCE(value, 20.00) INTO v_transport_value 
    FROM config WHERE `key` = 'transport_value' LIMIT 1;
    
    -- Inserir 4 semanas se não existirem
    WHILE v_week <= 4 DO
        INSERT IGNORE INTO laundry_weeks (
            id, week_number, month, year, value, 
            ironed, washed, transport_fee, diarista_id
        ) VALUES (
            UUID(), v_week, p_month, p_year, 70.00,
            FALSE, FALSE, v_transport_value, p_diarista_id
        );
        SET v_week = v_week + 1;
    END WHILE;
END//

-- ============================================================
-- PROCEDURE: Criar pagamento mensal para todas as diaristas
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_create_monthly_payments(
    IN p_month INT,
    IN p_year INT
)
BEGIN
    DECLARE v_due_day INT;
    DECLARE v_due_date DATE;
    
    -- Obter dia de vencimento da configuração
    SELECT COALESCE(value, 5) INTO v_due_day 
    FROM config WHERE `key` = 'payment_due_day' LIMIT 1;
    
    -- Calcular data de vencimento (próximo mês)
    SET v_due_date = DATE_ADD(
        STR_TO_DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'), '%Y-%m-%d'),
        INTERVAL 1 MONTH
    );
    SET v_due_date = DATE_ADD(v_due_date, INTERVAL (v_due_day - 1) DAY);
    
    -- Inserir para todas as diaristas ativas
    INSERT IGNORE INTO monthly_payments (
        id, month, year, payment_due_date, monthly_value, hour_limit, diarista_id
    )
    SELECT 
        UUID(), p_month, p_year, v_due_date, 0.00, '10:00', id
    FROM diaristas
    WHERE active = TRUE;
END//

-- ============================================================
-- PROCEDURE: Marcar presença
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_mark_attendance(
    IN p_diarista_id CHAR(36),
    IN p_date DATE,
    IN p_day_type VARCHAR(20),
    IN p_present BOOLEAN,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_notes TEXT
)
BEGIN
    INSERT INTO attendance (
        id, date, day_type, present, start_time, end_time, notes, diarista_id
    ) VALUES (
        UUID(), p_date, p_day_type, p_present, p_start_time, p_end_time, p_notes, p_diarista_id
    )
    ON DUPLICATE KEY UPDATE
        present = p_present,
        start_time = p_start_time,
        end_time = p_end_time,
        notes = p_notes;
END//

-- ============================================================
-- PROCEDURE: Adicionar notificação
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_add_notification(
    IN p_diarista_id CHAR(36),
    IN p_title VARCHAR(255),
    IN p_message TEXT,
    IN p_type VARCHAR(20)
)
BEGIN
    INSERT INTO notifications (id, diarista_id, title, message, type)
    VALUES (UUID(), p_diarista_id, p_title, p_message, COALESCE(p_type, 'info'));
END//

-- ============================================================
-- PROCEDURE: Obter configuração por chave
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_config(
    IN p_key VARCHAR(100)
)
BEGIN
    SELECT * FROM config WHERE `key` = p_key LIMIT 1;
END//

-- ============================================================
-- PROCEDURE: Atualizar configuração
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_update_config(
    IN p_key VARCHAR(100),
    IN p_value DECIMAL(15,2)
)
BEGIN
    UPDATE config SET value = p_value WHERE `key` = p_key;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Configuração não encontrada';
    END IF;
END//

-- ============================================================
-- PROCEDURE: Contar advertências no período
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_count_warnings(
    IN p_diarista_id CHAR(36),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_count INT
)
BEGIN
    SELECT COUNT(*) INTO p_count
    FROM notes
    WHERE diarista_id = p_diarista_id
    AND is_warning = TRUE
    AND date BETWEEN p_start_date AND p_end_date;
END//

DELIMITER ;

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View: Resumo das diaristas ativas
CREATE OR REPLACE VIEW vw_diaristas_summary AS
SELECT 
    d.id,
    d.name,
    d.phone,
    d.active,
    d.heavy_cleaning_value,
    d.light_cleaning_value,
    (SELECT COUNT(*) FROM attendance a WHERE a.diarista_id = d.id AND a.present = TRUE 
     AND MONTH(a.date) = MONTH(CURRENT_DATE) AND YEAR(a.date) = YEAR(CURRENT_DATE)) AS days_this_month,
    (SELECT COUNT(*) FROM notes n WHERE n.diarista_id = d.id AND n.is_warning = TRUE 
     AND MONTH(n.date) = MONTH(CURRENT_DATE) AND YEAR(n.date) = YEAR(CURRENT_DATE)) AS warnings_this_month
FROM diaristas d
WHERE d.active = TRUE;

-- View: Pagamentos pendentes
CREATE OR REPLACE VIEW vw_pending_payments AS
SELECT 
    ph.*,
    d.name AS diarista_name
FROM payment_history ph
JOIN diaristas d ON d.id = ph.diarista_id
WHERE ph.status = 'pending'
ORDER BY ph.year DESC, ph.month DESC, ph.created_at DESC;

-- View: Notificações não lidas
CREATE OR REPLACE VIEW vw_unread_notifications AS
SELECT 
    n.*,
    d.name AS diarista_name
FROM notifications n
JOIN diaristas d ON d.id = n.diarista_id
WHERE n.`read` = FALSE
ORDER BY n.created_at DESC;

-- ============================================================
-- FIM DO SCRIPT DE STORED PROCEDURES
-- ============================================================

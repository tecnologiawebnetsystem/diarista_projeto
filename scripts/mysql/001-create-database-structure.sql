-- ============================================================
-- Script de Criação da Estrutura do Banco de Dados MySQL
-- Sistema de Controle de Diaristas
-- Criado em: 2026-04-25
-- ============================================================

-- Criar o banco de dados (descomente se necessário)
-- CREATE DATABASE IF NOT EXISTS diarista_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE diarista_db;

-- ============================================================
-- TABELA: clients (Clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    neighborhood VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clients_name (name),
    INDEX idx_clients_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: diaristas (Profissionais de Limpeza)
-- ============================================================
CREATE TABLE IF NOT EXISTS diaristas (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    photo_url TEXT,
    heavy_cleaning_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    light_cleaning_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    washing_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ironing_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    transport_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    work_schedule JSON,
    laundry_assignments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_diaristas_name (name),
    INDEX idx_diaristas_active (active),
    INDEX idx_diaristas_pin (pin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: config (Configurações do Sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS config (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value DECIMAL(15, 2) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: attendance (Registro de Presença)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    date DATE NOT NULL,
    day_type ENUM('heavy_cleaning', 'light_cleaning') NOT NULL,
    present BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_attendance_date (date),
    INDEX idx_attendance_diarista (diarista_id),
    INDEX idx_attendance_present (present),
    
    CONSTRAINT fk_attendance_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: laundry_weeks (Semanas de Lavanderia)
-- ============================================================
CREATE TABLE IF NOT EXISTS laundry_weeks (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    week_number INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    value DECIMAL(10, 2) NOT NULL DEFAULT 70.00,
    ironed BOOLEAN DEFAULT FALSE,
    washed BOOLEAN DEFAULT FALSE,
    transport_fee DECIMAL(10, 2) DEFAULT 0.00,
    transport_paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    receipt_url TEXT,
    paid_at TIMESTAMP NULL,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_laundry_weeks_period (year, month, week_number),
    INDEX idx_laundry_weeks_diarista (diarista_id),
    UNIQUE KEY uk_laundry_week_period_diarista (week_number, month, year, diarista_id),
    
    CONSTRAINT fk_laundry_weeks_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: monthly_payments (Pagamentos Mensais)
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_payments (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    month INT NOT NULL,
    year INT NOT NULL,
    payment_date DATE,
    payment_due_date DATE NOT NULL,
    monthly_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    receipt_url TEXT,
    paid_at TIMESTAMP NULL,
    hour_limit VARCHAR(10) DEFAULT '10:00',
    notes TEXT,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_monthly_payments_period (year, month),
    INDEX idx_monthly_payments_diarista (diarista_id),
    UNIQUE KEY uk_monthly_payment_period_diarista (month, year, diarista_id),
    
    CONSTRAINT fk_monthly_payments_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: notes (Anotações/Advertências)
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    date DATE NOT NULL,
    note_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_warning BOOLEAN DEFAULT FALSE,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_notes_date (date),
    INDEX idx_notes_diarista (diarista_id),
    INDEX idx_notes_warning (is_warning),
    
    CONSTRAINT fk_notes_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: awards (Premiações)
-- ============================================================
CREATE TABLE IF NOT EXISTS awards (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status ENUM('pending', 'awarded', 'disqualified') DEFAULT 'pending',
    value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    warnings_count INT DEFAULT 0,
    attendance_score DECIMAL(5, 2) DEFAULT 0.00,
    performance_score DECIMAL(5, 2) DEFAULT 0.00,
    conduct_score DECIMAL(5, 2) DEFAULT 0.00,
    disqualification_reason TEXT,
    awarded_at TIMESTAMP NULL,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_awards_period (period_start, period_end),
    INDEX idx_awards_diarista (diarista_id),
    INDEX idx_awards_status (status),
    
    CONSTRAINT fk_awards_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: performance_metrics (Métricas de Desempenho)
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    date DATE NOT NULL,
    punctuality BOOLEAN DEFAULT TRUE,
    tasks_completed BOOLEAN DEFAULT TRUE,
    requires_rework BOOLEAN DEFAULT FALSE,
    notes TEXT,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_performance_metrics_date (date),
    INDEX idx_performance_metrics_diarista (diarista_id),
    
    CONSTRAINT fk_performance_metrics_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: contract_agreements (Acordos de Contrato)
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_agreements (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    agreed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_contract_agreements_diarista (diarista_id),
    
    CONSTRAINT fk_contract_agreements_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: payment_history (Histórico de Pagamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_history (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    diarista_id CHAR(36) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    type ENUM('salary', 'laundry', 'transport', 'bonus') NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payment_history_period (year, month),
    INDEX idx_payment_history_diarista (diarista_id),
    INDEX idx_payment_history_status (status),
    INDEX idx_payment_history_type (type),
    
    CONSTRAINT fk_payment_history_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: notifications (Notificações)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    diarista_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'note') DEFAULT 'info',
    `read` BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notifications_diarista (diarista_id),
    INDEX idx_notifications_read (diarista_id, `read`),
    
    CONSTRAINT fk_notifications_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: work_days (Dias de Trabalho)
-- ============================================================
CREATE TABLE IF NOT EXISTS work_days (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    day_of_week ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') NOT NULL,
    is_work_day BOOLEAN DEFAULT FALSE,
    day_type ENUM('heavy_cleaning', 'light_cleaning') DEFAULT 'heavy_cleaning',
    diarista_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_work_days_diarista (diarista_id),
    INDEX idx_work_days_day (day_of_week),
    UNIQUE KEY uk_work_days_diarista_day (diarista_id, day_of_week),
    
    CONSTRAINT fk_work_days_diarista 
        FOREIGN KEY (diarista_id) REFERENCES diaristas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- (MySQL já faz isso com ON UPDATE CURRENT_TIMESTAMP, mas
-- criamos triggers para compatibilidade se necessário)
-- ============================================================

-- Nota: O MySQL com "ON UPDATE CURRENT_TIMESTAMP" já atualiza 
-- automaticamente o campo updated_at, então triggers não são
-- estritamente necessários. Mas se precisar de lógica adicional:

-- DELIMITER //
-- CREATE TRIGGER tr_clients_before_update BEFORE UPDATE ON clients
-- FOR EACH ROW BEGIN
--     SET NEW.updated_at = CURRENT_TIMESTAMP;
-- END//
-- DELIMITER ;

-- ============================================================
-- FIM DO SCRIPT DE ESTRUTURA
-- ============================================================

-- Migration: adiciona coluna checked_in_by_diarista na tabela attendance
-- Execute este script no phpMyAdmin caso a coluna não exista ainda

ALTER TABLE `attendance`
  ADD COLUMN IF NOT EXISTS `checked_in_by_diarista` TINYINT(1) NOT NULL DEFAULT 0;

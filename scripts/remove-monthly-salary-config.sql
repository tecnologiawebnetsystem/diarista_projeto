-- Remove a configuração de salário mensal do banco de dados
-- Diaristas não têm salário mensal fixo, então essa opção não faz sentido

DELETE FROM config WHERE key = 'monthly_salary';

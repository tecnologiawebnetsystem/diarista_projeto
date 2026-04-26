# Scripts MySQL - Sistema de Controle de Diaristas

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `001-create-database-structure.sql` | Cria todas as tabelas do sistema |
| `002-insert-initial-data.sql` | Insere dados iniciais e configurações |
| `003-stored-procedures.sql` | Procedures, functions e views úteis |

## Ordem de Execução

Execute os scripts na seguinte ordem:

```bash
mysql -u seu_usuario -p < 001-create-database-structure.sql
mysql -u seu_usuario -p < 002-insert-initial-data.sql
mysql -u seu_usuario -p < 003-stored-procedures.sql
```

Ou via MySQL Workbench/phpMyAdmin, execute cada arquivo na ordem numérica.

## Requisitos

- MySQL 8.0+ (necessário para `UUID()` e `JSON` nativos)
- Charset: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

## Tabelas Criadas

### Principais
- **diaristas** - Cadastro das profissionais de limpeza
- **clients** - Cadastro de clientes
- **config** - Configurações do sistema

### Operacionais
- **attendance** - Registro de presença diária
- **laundry_weeks** - Controle de lavanderia semanal
- **monthly_payments** - Pagamentos mensais
- **payment_history** - Histórico completo de pagamentos

### Complementares
- **notes** - Anotações e advertências
- **awards** - Premiações por desempenho
- **performance_metrics** - Métricas de desempenho
- **contract_agreements** - Acordos de contrato
- **notifications** - Notificações do sistema

## Configurações Padrão

O script de inserção cria as seguintes configurações:

| Chave | Valor | Descrição |
|-------|-------|-----------|
| admin_pin | 1234 | PIN de acesso admin |
| heavy_cleaning_value | 180.00 | Valor faxina pesada |
| light_cleaning_value | 150.00 | Valor faxina leve |
| washing_value | 35.00 | Valor lavagem |
| ironing_value | 35.00 | Valor passar roupa |
| transport_value | 20.00 | Valor transporte |
| award_value | 100.00 | Valor premiação |
| payment_due_day | 5 | Dia vencimento |

## Stored Procedures Disponíveis

```sql
-- Obter resumo mensal
CALL sp_get_monthly_summary('diarista_id', 4, 2026);

-- Criar semanas de lavanderia
CALL sp_create_laundry_weeks('diarista_id', 4, 2026);

-- Criar pagamentos mensais para todas
CALL sp_create_monthly_payments(4, 2026);

-- Marcar presença
CALL sp_mark_attendance('diarista_id', '2026-04-25', 'heavy_cleaning', TRUE, '08:00:00', '16:00:00', NULL);

-- Adicionar notificação
CALL sp_add_notification('diarista_id', 'Título', 'Mensagem', 'info');
```

## Views Disponíveis

```sql
-- Resumo das diaristas ativas
SELECT * FROM vw_diaristas_summary;

-- Pagamentos pendentes
SELECT * FROM vw_pending_payments;

-- Notificações não lidas
SELECT * FROM vw_unread_notifications;
```

## Migração do Supabase

Se você está migrando do Supabase, considere:

1. **UUIDs**: MySQL 8.0 suporta `UUID()` nativamente
2. **JSON**: Campos JSON são totalmente suportados
3. **Timestamps**: Use `TIMESTAMP` com `ON UPDATE CURRENT_TIMESTAMP`
4. **RLS**: MySQL não tem Row Level Security nativo - implemente via aplicação ou views

## Conexão na Aplicação

Atualize as variáveis de ambiente:

```env
MYSQL_HOST=seu_host
MYSQL_PORT=3306
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=diarista_db
```

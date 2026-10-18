-- Часовий пояс сесії за замовчуванням для цієї БД: pgAdmin / psql показуватимуть
-- timestamptz у київському часі. Самі дані не змінюються — вони зберігаються як момент часу (UTC).
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'Europe/Kyiv');
END
$$;

-- Salt Lake Platform PostgreSQL 16 Schema
-- Phase 2: Precision constraints, type safety, auditing

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN CREATE TYPE well_status AS ENUM ('normal','abnormal','stopped','abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE well_tech AS ENUM ('luo_kong','quan_guan','shuang_guan'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maint_status AS ENUM ('pending','processing','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_role_type AS ENUM ('admin','lab','brine','maintenance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fault_type_enum AS ENUM ('fault_repair','scheduled','emergency'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. well_lines
CREATE TABLE IF NOT EXISTS well_lines (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    short_name  VARCHAR(10) NOT NULL UNIQUE,
    region      CHAR(1) NOT NULL CHECK (region IN ('N','C','E','S','W')),
    region_seq  INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. wells (water level: NUMERIC(8,2), negative)
CREATE TABLE IF NOT EXISTS wells (
    well_id             VARCHAR(10) PRIMARY KEY,
    line_id             INTEGER NOT NULL REFERENCES well_lines(id),
    completion_date     DATE,
    technology          well_tech,
    tech_note           TEXT,
    well_size           VARCHAR(10),
    initial_water_level NUMERIC(8,2),
    design_depth        NUMERIC(8,2),
    coord_x             NUMERIC(12,3),
    coord_y             NUMERIC(12,3),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_water_negative CHECK (initial_water_level IS NULL OR initial_water_level < 0)
);

-- 3. dynamic_monitoring (water: NUMERIC(8,2), flow: NUMERIC(8,2))
CREATE TABLE IF NOT EXISTS dynamic_monitoring (
    id              SERIAL PRIMARY KEY,
    well_id         VARCHAR(10) NOT NULL REFERENCES wells(well_id) ON DELETE CASCADE,
    collect_date    DATE NOT NULL,
    static_water    NUMERIC(8,2),
    dynamic_water   NUMERIC(8,2),
    well_depth      NUMERIC(8,2),
    flow_rate       NUMERIC(8,2),
    pump_depth      NUMERIC(8,2),
    pump_flow       NUMERIC(8,2),
    motor_power     NUMERIC(8,2),
    manufacturer    VARCHAR(100),
    status          well_status NOT NULL DEFAULT 'normal',
    fault_note      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mon_well_date ON dynamic_monitoring(well_id, collect_date DESC);
CREATE INDEX IF NOT EXISTS idx_mon_date ON dynamic_monitoring(collect_date DESC);
CREATE INDEX IF NOT EXISTS idx_mon_status ON dynamic_monitoring(status);

-- 4. lab_data (density: NUMERIC(6,4), salinity: NUMERIC(8,3), ions: NUMERIC(8,3), li: NUMERIC(10,4))
CREATE TABLE IF NOT EXISTS lab_data (
    id          SERIAL PRIMARY KEY,
    well_id     VARCHAR(10) NOT NULL REFERENCES wells(well_id) ON DELETE CASCADE,
    test_date   DATE NOT NULL,
    tester      VARCHAR(50),
    viscosity   NUMERIC(8,2),
    density     NUMERIC(6,4),
    ph          NUMERIC(4,2),
    salinity    NUMERIC(8,3),
    k_plus      NUMERIC(8,3),
    mg2_plus    NUMERIC(8,3),
    cl_minus    NUMERIC(8,3),
    so42_minus  NUMERIC(8,3),
    ca2_plus    NUMERIC(8,3),
    na_plus     NUMERIC(8,3),
    li_plus     NUMERIC(10,4),
    b2o3        NUMERIC(8,3),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lab_well_date ON lab_data(well_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_date ON lab_data(test_date DESC);

-- 5. maintenance_records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id                   SERIAL PRIMARY KEY,
    well_id              VARCHAR(10) NOT NULL REFERENCES wells(well_id) ON DELETE CASCADE,
    report_time          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fault_type           fault_type_enum,
    status               maint_status NOT NULL DEFAULT 'pending',
    handler              VARCHAR(50),
    description          TEXT,
    image_urls           TEXT[] DEFAULT '{}',
    resolved_at          TIMESTAMPTZ,
    source_monitoring_id INTEGER REFERENCES dynamic_monitoring(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maint_well ON maintenance_records(well_id, report_time DESC);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_records(status);

-- 6. users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    display_name  VARCHAR(50) NOT NULL,
    role          user_role_type NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO users (username, display_name, role, password_hash)
VALUES ('admin', 'Admin', 'admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- 7. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,
    table_name  VARCHAR(50) NOT NULL,
    record_id   VARCHAR(100),
    old_data    JSONB,
    new_data    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at DESC);

-- 8. auto updated_at trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_well_lines_updated') THEN
    CREATE TRIGGER trg_well_lines_updated BEFORE UPDATE ON well_lines FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wells_updated') THEN
    CREATE TRIGGER trg_wells_updated BEFORE UPDATE ON wells FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_monitoring_updated') THEN
    CREATE TRIGGER trg_monitoring_updated BEFORE UPDATE ON dynamic_monitoring FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lab_updated') THEN
    CREATE TRIGGER trg_lab_updated BEFORE UPDATE ON lab_data FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_maintenance_updated') THEN
    CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- Partial indexes for performance (created by application on startup)

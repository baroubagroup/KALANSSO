-- ==============================================================================
-- PROJET : kalansso os
-- MODULE : SCHÉMA DE BASE DE DONNÉES RELATIONNELLE (POSTGRESQL 16+)
-- FICHIER : database/schema.sql
-- DESCRIPTION :
--   Modèle physique de données complet, hautement performant, multi-tenant et sécurisé.
--   Couvre l'ensemble des cycles (Crèche, Maternelle, Primaire, Collège, Lycée, Supérieur),
--   l'administration, la caisse & mobile money, la pédagogie, le péri-scolaire et l'audit.
-- ==============================================================================

-- Activation des extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. DÉFINITION DES TYPES ÉNUMÉRÉS (ENUMS)
-- ==============================================================================

-- Types d'établissements
CREATE TYPE school_type_enum AS ENUM (
    'PUBLIC',
    'PRIVATE_LAIC',
    'CONFESSIONAL_CATHOLIC',
    'CONFESSIONAL_PROTESTANT',
    'FRANCO_ARABE',
    'INTERNATIONAL'
);

-- Cycles éducatifs pris en charge par le moteur universel
CREATE TYPE school_cycle_enum AS ENUM (
    'CRECHE_GARDERIE',           -- 0 à 3 ans (Carnet de vie quotidien)
    'MATERNELLE',                -- TPS, PS, MS, GS (Évaluation par compétences)
    'PRIMAIRE',                  -- CP1 au CM2 (Notation sur 10 ou 20, CEP)
    'POST_PRIMAIRE_COLLEGE',     -- 6ème à 3ème (BEPC)
    'SECONDAIRE_LYCEE_GENERAL',  -- 2nde à Tle Séries A, C, D (BAC)
    'TECHNIQUE_PROFESSIONNEL',   -- BEP, BAC Pro, Séries F, G
    'SUPERIEUR_UNIVERSITE'       -- BTS, Licence, Master (Système LMD)
);

-- Rôles utilisateurs avec permissions strictes
CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN',        -- Administrateur technique plateforme
    'FOUNDER_DG',         -- Fondateur / Directeur Général (accès financier consolidé)
    'PROVISEUR_DIR',      -- Chef d'établissement / Directeur pédagogique
    'CENSEUR_DE',         -- Directeur des Études / Censeur (examens, délibérations)
    'SURVEILLANT_GEN',    -- Surveillant Général / Éducateur (vie scolaire, discipline)
    'COMPTABLE_CAISSE',   -- Économe / Caissier (gestion financière, reçus)
    'SECRETAIRE',         -- Secrétaire administratif (inscriptions, attestations)
    'ENSEIGNANT',         -- Professeur / Maître titulaire
    'PARENT',             -- Parent / Tuteur légal
    'ELEVE',              -- Apprenant
    'INFIRMIER',          -- Personnel de santé scolaire
    'CHAUFFEUR_BUS'       -- Chauffeur de navette de ramassage
);

-- Canaux d'encaissement et passerelles de paiement
CREATE TYPE payment_channel_enum AS ENUM (
    'CASH',               -- Espèces au guichet
    'MOOV_MONEY',         -- Moov Money Burkina (Onatel)
    'ORANGE_MONEY',       -- Orange Money Burkina
    'CORIS_MONEY',        -- Coris Money
    'WAVE',               -- Wave UEMOA
    'CHECK',              -- Chèque de banque
    'BANK_TRANSFER'       -- Virement bancaire / Dépôt guichet
);

-- Statut des transactions financières
CREATE TYPE payment_status_enum AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);

-- Types de découpage temporel
CREATE TYPE period_type_enum AS ENUM (
    'TRIMESTER',          -- 1er, 2ème, 3ème Trimestre
    'SEMESTER',           -- 1er, 2ème Semestre
    'CUSTOM'              -- Période libre
);

-- Niveaux d'acquisition de compétences (Maternelle)
CREATE TYPE skill_acquisition_level_enum AS ENUM (
    'ACQUIS',
    'EN_COURS',
    'NON_ACQUIS',
    'DEPASSE'
);

-- Statut de présence d'un élève
CREATE TYPE attendance_status_enum AS ENUM (
    'PRESENT',
    'ABSENT_UNJUSTIFIED',
    'ABSENT_JUSTIFIED',
    'LATE',
    'EXEMPT'
);

-- Canaux de communication sortante
CREATE TYPE communication_channel_enum AS ENUM (
    'WHATSAPP',
    'SMS',
    'PUSH_NOTIFICATION',
    'EMAIL'
);

-- ==============================================================================
-- 2. ÉTABLISSEMENTS, STRUCTURE SCOLAIRE & MULTI-TENANCY
-- ==============================================================================

-- Table des Établissements (Tenant racine)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_menapln VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    school_type school_type_enum NOT NULL DEFAULT 'PRIVATE_LAIC',
    active_cycles school_cycle_enum[] NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Ouagadougou',
    country_code VARCHAR(2) NOT NULL DEFAULT 'BF',
    address TEXT,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    website VARCHAR(150),
    logo_url TEXT,
    stamp_signature_url TEXT,
    primary_color VARCHAR(10) DEFAULT '#1B4D3E', -- Vert Nature et Sécurité
    watermark_pattern VARCHAR(50) DEFAULT 'FASO_DAN_FANI',
    grading_rules JSONB NOT NULL DEFAULT '{}',   -- Moteur No-Code : mentions, seuils, tableaux d'honneur
    fee_settings JSONB NOT NULL DEFAULT '{}',    -- Paramètres d'échéances et acomptes
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Années Académiques
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL, -- Ex: "2026-2027"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_school_academic_year UNIQUE (school_id, name)
);

-- Périodes Académiques (Trimestres ou Semestres)
CREATE TABLE academic_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- Ex: "1er Trimestre", "Semestre 1"
    period_type period_type_enum NOT NULL DEFAULT 'TRIMESTER',
    sequence_number INT NOT NULL, -- 1, 2, ou 3
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weight NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_school_period UNIQUE (school_id, academic_year_id, sequence_number)
);

-- Classes Physiques & Pédagogiques
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    cycle school_cycle_enum NOT NULL,
    name VARCHAR(100) NOT NULL, -- Ex: "Terminale D1", "Petite Section A", "CP1 B"
    level_code VARCHAR(50) NOT NULL, -- Ex: "TLE_D", "PS", "CP1", "3EME"
    room_number VARCHAR(50),
    capacity INT NOT NULL DEFAULT 60,
    head_teacher_id UUID, -- Enseignant titulaire référent
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matières Enseignées
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    cycle school_cycle_enum NOT NULL,
    name VARCHAR(100) NOT NULL, -- Ex: "Mathématiques", "Français", "Éveil Scientifique"
    code VARCHAR(30) NOT NULL,  -- Ex: "MATH", "FRAN", "EVEIL"
    category VARCHAR(50) DEFAULT 'GENERAL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_school_subject_code UNIQUE (school_id, cycle, code)
);

-- Affectation des Matières par Classe (avec coefficients et barèmes sur-mesure)
CREATE TABLE classroom_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id UUID, -- Professeur assigné pour cette matière dans cette classe
    coefficient NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    grading_scale NUMERIC(5, 2) NOT NULL DEFAULT 20.00, -- Barème max (20.00 ou 10.00)
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    include_in_rank BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_classroom_subject UNIQUE (classroom_id, subject_id)
);

-- ==============================================================================
-- 3. UTILISATEURS, PROFESSEURS, PERSONNELS & PARENTS
-- ==============================================================================

-- Table Centrale des Utilisateurs (RBAC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profil Spécifique Enseignants
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    employment_status VARCHAR(50) DEFAULT 'PERMANENT', -- 'PERMANENT', 'VACATAIRE_HOURLY'
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    diploma VARCHAR(100),
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profil Spécifique Parents & Tuteurs
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    profession VARCHAR(100),
    secondary_phone VARCHAR(30),
    whatsapp_phone VARCHAR(30) NOT NULL, -- Pour le bot conversationnel
    address TEXT,
    national_id_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. ÉLÈVES, DOSSIERS & INSCRIPTIONS
-- ==============================================================================

-- Table des Élèves (Registre Permanent)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    matricule VARCHAR(50) UNIQUE NOT NULL, -- Ex: "KLS-2026-0042"
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    birth_date DATE NOT NULL,
    birth_place VARCHAR(150) NOT NULL,
    nationality VARCHAR(80) DEFAULT 'Burkinabè',
    birth_certificate_number VARCHAR(100),
    photo_url TEXT,
    qr_code_signature VARCHAR(128) UNIQUE NOT NULL, -- Empreinte cryptographique de la carte scolaire
    regime VARCHAR(30) DEFAULT 'EXTERNE',           -- 'EXTERNE', 'DEMI_PENSIONNAIRE', 'INTERNE'
    status VARCHAR(30) DEFAULT 'ACTIVE',            -- 'ACTIVE', 'TRANSFERRED', 'EXPELLED', 'DROPOUT'
    blood_type VARCHAR(10) DEFAULT 'UNKNOWN',       -- 'A+', 'O+', etc.
    allergies TEXT,
    emergency_contact_name VARCHAR(150) NOT NULL,
    emergency_contact_phone VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Association Parent-Élève (Relations familiales)
CREATE TABLE student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL DEFAULT 'TUTEUR_LEGAL', -- 'PERE', 'MERE', 'TUTEUR_LEGAL'
    is_primary_contact BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_parent UNIQUE (student_id, parent_id)
);

-- Historique des Inscriptions / Réinscriptions par Année Scolaire
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_type VARCHAR(30) DEFAULT 'NOUVEAU', -- 'NOUVEAU', 'ANCIEN', 'REDOUBLANT', 'TRANSFERE'
    previous_school VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_academic_year UNIQUE (student_id, academic_year_id)
);

-- ==============================================================================
-- 5. PÉDAGOGIE, ÉVALUATIONS, NOTES & BULLETINS SCELLÉS
-- ==============================================================================

-- Sessions d'Évaluations (Devoirs, Interrogations, Compositions)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(150) NOT NULL, -- Ex: "Devoir Surveillé N°1"
    evaluation_type VARCHAR(50) NOT NULL, -- 'INTERROGATION', 'DEVOIR', 'COMPOSITION', 'TP'
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    date_conducted DATE NOT NULL DEFAULT CURRENT_DATE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes Individuelles des Élèves
CREATE TABLE student_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    numerical_score NUMERIC(5, 2), -- Note chiffrée (null si absent ou compétence)
    skill_level skill_acquisition_level_enum, -- Compétence maternelle
    status attendance_status_enum NOT NULL DEFAULT 'PRESENT',
    appreciation VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_evaluation_student UNIQUE (evaluation_id, student_id)
);

-- Bulletins Périodiques Scellés (Résultats Consolidés)
CREATE TABLE report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT,
    total_points NUMERIC(8, 2) NOT NULL,
    total_coefficients NUMERIC(6, 2) NOT NULL,
    general_average NUMERIC(5, 2) NOT NULL,
    class_rank INT NOT NULL,
    class_size INT NOT NULL,
    highest_average NUMERIC(5, 2) NOT NULL,
    lowest_average NUMERIC(5, 2) NOT NULL,
    class_median NUMERIC(5, 2) NOT NULL,
    conduct_score NUMERIC(5, 2) DEFAULT 20.00,
    absences_count INT NOT NULL DEFAULT 0,
    unjustified_absences_count INT NOT NULL DEFAULT 0,
    honors_mention VARCHAR(150), -- Mention calculée selon les règles sur-mesure de l'école
    council_decision TEXT,        -- Décision textuelle du conseil des professeurs
    digital_signature_hash VARCHAR(128) NOT NULL, -- HASH CRYPTOGRAPHIQUE ANTI-FRAUDE
    pdf_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_period_report UNIQUE (student_id, period_id)
);

-- ==============================================================================
-- 6. CRÈCHE & PETITE ENFANCE (JOURNAL QUOTIDIEN 0 - 3 ANS)
-- ==============================================================================

CREATE TABLE creche_daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meals_summary JSONB NOT NULL DEFAULT '[]',     -- Repas, biberons en ml, fruits
    sleep_summary JSONB NOT NULL DEFAULT '[]',     -- Heure début/fin de sieste, qualité
    hygiene_summary JSONB NOT NULL DEFAULT '[]',   -- Changes, selles, soins
    activities_summary JSONB NOT NULL DEFAULT '[]',-- Jeux, motricité, chants
    health_temperature NUMERIC(4, 1),              -- Prise de température
    health_notes TEXT,                             -- Bobos, médicaments donnés
    mood VARCHAR(50) DEFAULT 'JOYEUX',
    caregiver_id UUID NOT NULL REFERENCES users(id),
    parent_viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_creche_log_day UNIQUE (student_id, log_date)
);

-- ==============================================================================
-- 7. FINANCES, FACTURATION, CAISSE & MULTI-MOBILE MONEY
-- ==============================================================================

-- Rubriques Tarifaires de l'Établissement
CREATE TABLE fee_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Ex: "Frais de Scolarité 1ère Tranche", "Cantine Trimestre 1"
    category VARCHAR(50) NOT NULL, -- 'TUITION', 'REGISTRATION', 'CANTEEN', 'TRANSPORT', 'UNIFORM'
    target_cycle school_cycle_enum,
    target_level VARCHAR(50),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Factures Élèves (Compte individuel)
CREATE TABLE student_fee_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    fee_item_id UUID NOT NULL REFERENCES fee_items(id) ON DELETE RESTRICT,
    amount_due NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PARTIAL', 'PAID', 'WAIVED'
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_fee_item UNIQUE (student_id, fee_item_id)
);

-- Transactions Financières Réelles (Paiements Caisse & Mobile Money)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES users(id),
    receipt_number VARCHAR(60) UNIQUE NOT NULL, -- Ex: "REC-2026-000841"
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    channel payment_channel_enum NOT NULL,
    operator_reference VARCHAR(150), -- Réf Moov Money, Orange Money, N° chèque
    status payment_status_enum NOT NULL DEFAULT 'COMPLETED',
    payer_name VARCHAR(150) NOT NULL,
    payer_phone VARCHAR(30) NOT NULL,
    note TEXT,
    audit_hash VARCHAR(128) NOT NULL, -- Hash cryptographique scellant le reçu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clôtures Journalières de Caisse Inviolables
CREATE TABLE daily_cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    closing_date DATE NOT NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    supervisor_id UUID REFERENCES users(id),
    theoretical_cash NUMERIC(12, 2) NOT NULL,
    counted_cash NUMERIC(12, 2) NOT NULL,
    cash_difference NUMERIC(12, 2) NOT NULL,
    mobile_money_total NUMERIC(12, 2) NOT NULL,
    checks_total NUMERIC(12, 2) NOT NULL,
    denominations JSONB NOT NULL DEFAULT '{}', -- Billetage exact (10k, 5k, etc.)
    status VARCHAR(30) NOT NULL DEFAULT 'BALANCED', -- 'BALANCED', 'DISCREPANCY', 'APPROVED'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_school_cashier_closing UNIQUE (school_id, closing_date, cashier_id)
);

-- ==============================================================================
-- 8. VIE SCOLAIRE, ASSIDUITÉ & DISCIPLINE
-- ==============================================================================

-- Registre d'Assiduité (Pointage Quotidien ou par Créneau)
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot VARCHAR(50), -- Ex: "08h00 - 10h00"
    status attendance_status_enum NOT NULL DEFAULT 'PRESENT',
    late_minutes INT DEFAULT 0,
    justification_reason TEXT,
    justification_document_url TEXT,
    parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
    parent_notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sanctions & Dossier Disciplinaire
CREATE TABLE disciplinary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'MINEUR', -- 'MINEUR', 'MOYEN', 'GRAVE'
    sanction VARCHAR(100) NOT NULL,
    conduct_points_deducted NUMERIC(4, 2) DEFAULT 0.00,
    reported_by UUID NOT NULL REFERENCES users(id),
    decision_by UUID REFERENCES users(id),
    parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 9. SERVICES PÉRI-SCOLAIRES (CANTINE, INTERNAT, TRANSPORT, INFIRMERIE, BIBLIO)
-- ==============================================================================

-- Cantine : Abonnements & Portefeuille
CREATE TABLE canteen_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    plan_type VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- 'MONTHLY', 'TRIMESTER', 'TICKETS'
    tickets_remaining INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cantine : Pointages Repas (Borne de scan réfectoire anti-fraude)
CREATE TABLE canteen_meal_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scanned_by UUID NOT NULL REFERENCES users(id),
    is_duplicate_attempt BOOLEAN NOT NULL DEFAULT FALSE
);

-- Transport : Circuits & Lignes de Navettes
CREATE TABLE transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Ex: "Ligne 1 : Tampouy - Somgandé"
    bus_license_plate VARCHAR(50) NOT NULL,
    driver_id UUID REFERENCES users(id),
    capacity INT NOT NULL DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transport : Arrêts de ramassage
CREATE TABLE transport_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(150) NOT NULL,
    pickup_time TIME NOT NULL,
    dropoff_time TIME NOT NULL,
    monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Infirmerie Scolaire (Consultations & Soins d'Urgence)
CREATE TABLE infirmary_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    visit_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    symptoms TEXT NOT NULL,
    diagnosis TEXT,
    care_administered TEXT NOT NULL,
    temperature NUMERIC(4, 1),
    decision VARCHAR(50) NOT NULL, -- 'RETURN_CLASS', 'REST_INFIRMARY', 'SEND_HOME', 'EMERGENCY_HOSPITAL'
    nurse_id UUID NOT NULL REFERENCES users(id),
    parent_notified BOOLEAN NOT NULL DEFAULT FALSE
);

-- Bibliothèque : Fonds documentaire & Manuels
CREATE TABLE library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    isbn VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(150),
    category VARCHAR(100),
    copies_total INT NOT NULL DEFAULT 1,
    copies_available INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bibliothèque : Prêts de Livres
CREATE TABLE library_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'BORROWED', -- 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST'
    librarian_id UUID NOT NULL REFERENCES users(id)
);

-- ==============================================================================
-- 10. COMMUNICATION OMNICANALE (WHATSAPP BOT, SMS, PUSH)
-- ==============================================================================

CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(30) NOT NULL,
    channel communication_channel_enum NOT NULL DEFAULT 'WHATSAPP',
    message_type VARCHAR(50) NOT NULL, -- 'ABSENCE_ALERT', 'RECEIPT', 'REPORT_CARD_PDF', 'BROADCAST'
    content TEXT NOT NULL,
    external_message_id VARCHAR(150), -- ID Meta Cloud API WhatsApp ou Passerelle SMS
    status VARCHAR(30) NOT NULL DEFAULT 'SENT', -- 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 11. AUDIT LOGS IMMUABLES (JOURNAL ANTI-FRAUDE)
-- ==============================================================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,       -- 'UPDATE_GRADE', 'VOID_RECEIPT', 'MODIFY_SETTINGS'
    target_table VARCHAR(100) NOT NULL, -- 'student_grades', 'payment_transactions'
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 12. INDEXATION DE HAUTE PERFORMANCE
-- ==============================================================================

-- Indexation Multi-Tenant & Clés de filtrage fréquent
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_classrooms_school_academic ON classrooms(school_id, academic_year_id);
CREATE INDEX idx_students_school_matricule ON students(school_id, matricule);
CREATE INDEX idx_students_qr_signature ON students(qr_code_signature);
CREATE INDEX idx_student_enrollments_classroom ON student_enrollments(classroom_id, academic_year_id);
CREATE INDEX idx_evaluations_class_period ON evaluations(classroom_id, period_id);
CREATE INDEX idx_student_grades_eval ON student_grades(evaluation_id, student_id);
CREATE INDEX idx_report_cards_hash ON report_cards(digital_signature_hash);
CREATE INDEX idx_payments_receipt ON payment_transactions(receipt_number);
CREATE INDEX idx_payments_school_date ON payment_transactions(school_id, created_at);
CREATE INDEX idx_attendance_student_date ON attendance_records(student_id, date);
CREATE INDEX idx_creche_student_date ON creche_daily_logs(student_id, log_date);
CREATE INDEX idx_audit_school_date ON audit_logs(school_id, created_at DESC);

-- ==============================================================================
-- FIN DU SCHÉMA DE RÉFÉRENCE kalansso os
-- ==============================================================================

-- ==============================================================================
-- KALANSSO OS — SCHÉMA SQL MAÎTRE DE PRODUCTION (POSTGRESQL / SUPABASE)
-- Conforme aux directives MENAPLN du Burkina Faso et de l'Afrique de l'Ouest
-- ==============================================================================

-- 0. EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE DES ÉTABLISSEMENTS SCOLAIRES (MULTI-TENANT OU ÉCOLE UNIQUE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code_menapln VARCHAR(64) NOT NULL UNIQUE,
    approval_number VARCHAR(128),
    motto VARCHAR(255) DEFAULT 'Discipline - Travail - Succès',
    city VARCHAR(100) NOT NULL DEFAULT 'Ouagadougou',
    address TEXT,
    phone VARCHAR(32) NOT NULL,
    phones JSONB DEFAULT '[]'::jsonb, -- Numéros multiples: [{"id": "1", "label": "Standard", "phone": "..."}]
    email VARCHAR(255),
    director_name VARCHAR(150),
    director_title VARCHAR(150) DEFAULT 'Le Chef d’Établissement / Proviseur',
    logo_url TEXT,
    watermark_pattern VARCHAR(64) DEFAULT 'faso_dan_fani',
    grading_scale JSONB DEFAULT '[]'::jsonb, -- Barème d'appréciation configurable
    modules_config JSONB DEFAULT '{"canteen_enabled": false, "transport_enabled": false, "infirmary_enabled": false, "boarding_enabled": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. ANNÉES ACADÉMIQUES / SCOLAIRES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    year_label VARCHAR(32) NOT NULL, -- Ex: '2026 – 2027'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. CLASSES & PALIERS PÉDAGOGIQUES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ex: '6ème', '3ème', 'Terminale D', 'CM2'
    level VARCHAR(50) NOT NULL, -- Ex: '6EME', '3EME', 'TLE_D', 'CM2'
    cycle VARCHAR(50) NOT NULL, -- 'MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE'
    capacity INTEGER DEFAULT 50,
    tuition_fee NUMERIC(12, 2) DEFAULT 60000.00, -- Frais annuels en FCFA
    room_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ÉLÈVES & INSCRIPTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    matricule VARCHAR(64) NOT NULL UNIQUE, -- Ex: 'KLS-2026-0042'
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    birth_date DATE,
    birth_place VARCHAR(150),
    regime VARCHAR(32) DEFAULT 'Externat' CHECK (regime IN ('Externat', 'Internat', 'Demi-Pension')),
    status VARCHAR(32) DEFAULT 'VALIDE' CHECK (status IN ('VALIDE', 'EN_ATTENTE', 'NON_VALIDE', 'RADIE')),
    photo_url TEXT,
    qr_code_hash VARCHAR(255),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(64),
    guardian_phones JSONB DEFAULT '[]'::jsonb,
    guardian_email VARCHAR(255),
    guardian_address TEXT,
    medical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. MATIÈRES, PROGRAMMES & COEFFICIENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Ex: 'Mathématiques', 'Français'
    code VARCHAR(32) NOT NULL, -- Ex: 'MATH', 'FRAN'
    category VARCHAR(64) DEFAULT 'SCIENTIFIQUE', -- 'LITTERAIRE', 'SCIENTIFIQUE', 'SCIENCES_HUMAINES', 'ARTS_SPORT'
    cycle VARCHAR(32) NOT NULL, -- 'PRIMAIRE', 'COLLEGE', 'LYCEE'
    coefficient NUMERIC(4, 2) DEFAULT 2.00,
    max_score NUMERIC(5, 2) DEFAULT 20.00, -- 20 au secondaire, 10 ou 20 au primaire
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. ÉVALUATIONS & NOTES SCOLAIRES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_year VARCHAR(32) NOT NULL,
    term VARCHAR(16) NOT NULL CHECK (term IN ('T1', 'T2', 'T3')), -- 1er, 2ème, 3ème Trimestre
    eval_type VARCHAR(32) NOT NULL CHECK (eval_type IN ('INTERRO', 'DEVOIR_1', 'DEVOIR_2', 'COMPOSITION')),
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0),
    max_score NUMERIC(5, 2) DEFAULT 20.00,
    teacher_name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. FINANCES, TRANCHES & ENCAISSEMENTS (GUICHET EXPRESS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    academic_year VARCHAR(32) NOT NULL,
    tranche_number INTEGER NOT NULL CHECK (tranche_number IN (1, 2, 3)),
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    receipt_number VARCHAR(64) NOT NULL UNIQUE, -- Ex: 'REC-2026-0089'
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(32) DEFAULT 'ESPECES' CHECK (payment_method IN ('ESPECES', 'ORANGE_MONEY', 'MOOV_MONEY', 'VIREMENT', 'CHEQUE')),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    tranche_applied VARCHAR(32) DEFAULT 'TRANCHE_1',
    cashier_name VARCHAR(150) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. VIE SCOLAIRE & DISCIPLINE (CONTEXTE BURKINABÈ AUTHENTIQUE)
-- ==============================================================================
-- 8.1. Billets d'entrée (retard) et billets de sortie
CREATE TABLE IF NOT EXISTS public.passage_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    ticket_number VARCHAR(64) NOT NULL UNIQUE,
    ticket_type VARCHAR(32) NOT NULL CHECK (ticket_type IN ('ENTREE_RETARD', 'SORTIE_EXCEPTIONNELLE')),
    date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
    time_observed VARCHAR(16) NOT NULL,
    motif TEXT NOT NULL,
    is_justified BOOLEAN DEFAULT false,
    teacher_name VARCHAR(150),
    supervisor_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2. Corvées disciplinaires & travaux de salubrité citoyenne
CREATE TABLE IF NOT EXISTS public.corvees_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    task_type VARCHAR(64) NOT NULL, -- 'BALAYAGE_COUR', 'RAMASSAGE_SACHETS', 'DESHERBAGE_JARDIN', 'NETTOYAGE_TABLEAUX_BANCS'
    task_label TEXT NOT NULL,
    motif TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    timing VARCHAR(64) NOT NULL, -- 'Après les cours (17h00 - 18h00)', 'Pause midi'
    supervised_by VARCHAR(150) NOT NULL,
    status VARCHAR(32) DEFAULT 'A_EXECUTER' CHECK (status IN ('A_EXECUTER', 'EFFECTUEE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.3. Sanctions disciplinaires & déductions note de conduite
CREATE TABLE IF NOT EXISTS public.sanctions_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    sanction_type VARCHAR(64) NOT NULL CHECK (sanction_type IN ('AVERTISSEMENT_VERBAL', 'AVERTISSEMENT_ECRIT', 'BLAME_CONDUITE', 'EXCLUSION_TEMPORAIRE', 'CONSEIL_DISCIPLINE')),
    motif TEXT NOT NULL,
    date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
    points_deducted NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    conduct_score NUMERIC(4, 2) NOT NULL DEFAULT 19.00, -- Barème MENAPLN sur 20
    status VARCHAR(32) DEFAULT 'ACTIF' CHECK (status IN ('ACTIF', 'LEVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.4. Présences journalières & appels de classe (Feuilles d'appel)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session VARCHAR(32) NOT NULL DEFAULT 'MATIN', -- 'MATIN', 'SOIR'
    status VARCHAR(32) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABS', 'ABJ', 'RETARD')),
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. CORPS ENSEIGNANT, RH & DÉCOMPTE DES VACATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    matricule VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    role VARCHAR(150) NOT NULL, -- Entièrement personnalisable
    diploma VARCHAR(150) NOT NULL,
    contract_type VARCHAR(32) NOT NULL CHECK (contract_type IN ('TITULAIRE', 'CONTRACTUEL', 'VACATAIRE')),
    hourly_rate NUMERIC(10, 2) DEFAULT 3500.00, -- FCFA/h pour vacataires
    salary_base NUMERIC(12, 2) DEFAULT 250000.00, -- FCFA/mois pour titulaires
    main_subject VARCHAR(150) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    phones JSONB DEFAULT '[]'::jsonb, -- Coordonnées téléphoniques multiples
    email VARCHAR(255),
    date_joined DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(32) DEFAULT 'ACTIF' CHECK (status IN ('ACTIF', 'CONGE', 'DEMISSION')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affectations multi-classes & multi-matières avec taux horaire spécifique négociable
CREATE TABLE IF NOT EXISTS public.teaching_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    weekly_hours NUMERIC(4, 2) NOT NULL DEFAULT 4.00,
    hourly_rate NUMERIC(10, 2), -- Taux négocié pour cette matière/classe
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relevé d'émargement mensuel des cours dispensés
CREATE TABLE IF NOT EXISTS public.staff_timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    teaching_date DATE NOT NULL,
    time_slot VARCHAR(64) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    hours_taught NUMERIC(4, 2) NOT NULL DEFAULT 2.00,
    rate_applied NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    signed_by_teacher BOOLEAN DEFAULT true,
    signed_by_censor BOOLEAN DEFAULT true,
    month_period VARCHAR(32) NOT NULL, -- Ex: 'Novembre 2026'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. INDEX DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_students_matricule ON public.students(matricule);
CREATE INDEX IF NOT EXISTS idx_students_classroom ON public.students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON public.grades(student_id, subject_id, term);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_staff_matricule ON public.staff_members(matricule);
CREATE INDEX IF NOT EXISTS idx_assignments_staff ON public.teaching_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.teaching_assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_date ON public.attendances(student_id, date);

-- ==============================================================================
-- 11. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passage_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corvees_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_assignments ENABLE ROW LEVEL SECURITY;

-- Lecture et écriture accordées au service Kalansso
CREATE POLICY "Full access to authenticated users" ON public.schools FOR ALL USING (true);
CREATE POLICY "Full access to classrooms" ON public.classrooms FOR ALL USING (true);
CREATE POLICY "Full access to students" ON public.students FOR ALL USING (true);
CREATE POLICY "Full access to subjects" ON public.subjects FOR ALL USING (true);
CREATE POLICY "Full access to grades" ON public.grades FOR ALL USING (true);
CREATE POLICY "Full access to payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Full access to passage_tickets" ON public.passage_tickets FOR ALL USING (true);
CREATE POLICY "Full access to corvees_records" ON public.corvees_records FOR ALL USING (true);
CREATE POLICY "Full access to sanctions_records" ON public.sanctions_records FOR ALL USING (true);
CREATE POLICY "Full access to attendances" ON public.attendances FOR ALL USING (true);
CREATE POLICY "Full access to staff_members" ON public.staff_members FOR ALL USING (true);
CREATE POLICY "Full access to teaching_assignments" ON public.teaching_assignments FOR ALL USING (true);

-- ==============================================================================
-- FIN DU SCHÉMA MAÎTRE KALANSSO OS
-- ==============================================================================

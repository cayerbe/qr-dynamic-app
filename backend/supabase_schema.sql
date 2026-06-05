-- Supabase Database Schema for QR Dynamic App

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    qr_code_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "language": "en"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE
);

-- QR Codes Table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    type TEXT,
    content_type TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    intensity NUMERIC,
    physical_properties JSONB DEFAULT '{}'::jsonb,
    security_features JSONB DEFAULT '{}'::jsonb,
    scan_statistics JSONB DEFAULT '{"total_scans": 0, "total_scan_attempts": 0}'::jsonb,
    model_config JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    usage_guidelines JSONB DEFAULT '{}'::jsonb,
    forensic_profile JSONB DEFAULT '{}'::jsonb,
    generation_stats JSONB DEFAULT '{}'::jsonb,
    ipzs_compliance JSONB DEFAULT '{}'::jsonb,
    campaign TEXT,
    tags TEXT[],
    short_code TEXT UNIQUE,
    verification_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QR Scan Logs
CREATE TABLE IF NOT EXISTS public.qr_scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_id TEXT REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    user_id TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    location_info JSONB DEFAULT '{}'::jsonb,
    qr_type TEXT,
    content_type TEXT,
    scan_type TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    anti_forgery_analysis JSONB DEFAULT '{}'::jsonb
);

-- Forgery Detection Logs
CREATE TABLE IF NOT EXISTS public.forgery_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_id TEXT REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    scan_id TEXT,
    forgery_score NUMERIC,
    is_potential_forgery BOOLEAN DEFAULT false,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QR Forgery Logs
CREATE TABLE IF NOT EXISTS public.qr_forgery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_id TEXT REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QR Verifications
CREATE TABLE IF NOT EXISTS public.qr_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id TEXT UNIQUE NOT NULL,
    qr_id TEXT REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pre Scan Logs
CREATE TABLE IF NOT EXISTS public.pre_scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id TEXT,
    qr_id TEXT REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    short_code TEXT,
    scan_type TEXT,
    token_expiry BIGINT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    qr_count INTEGER DEFAULT 0,
    associated_qr_codes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Dashboard Stats
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
    date DATE PRIMARY KEY,
    stats JSONB DEFAULT '{}'::jsonb
);

-- Scan Trends
CREATE TABLE IF NOT EXISTS public.scan_trends (
    time_range TEXT PRIMARY KEY,
    trend_data JSONB DEFAULT '{}'::jsonb
);

-- RPC for incrementing scan statistics easily
CREATE OR REPLACE FUNCTION increment_qr_scans(p_qr_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.qr_codes
  SET scan_statistics = jsonb_set(
        jsonb_set(scan_statistics, '{total_scans}', ((scan_statistics->>'total_scans')::int + 1)::text::jsonb),
        '{last_scanned_at}',
        to_jsonb(now())
      )
  WHERE id = p_qr_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_qr_scan_attempts(p_qr_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.qr_codes
  SET scan_statistics = jsonb_set(
        jsonb_set(scan_statistics, '{total_scan_attempts}', ((scan_statistics->>'total_scan_attempts')::int + 1)::text::jsonb),
        '{last_scan_attempt}',
        to_jsonb(now())
      )
  WHERE id = p_qr_id;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own data
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Allow users to read and manage their own QR codes
CREATE POLICY "Users can view their own QR codes." ON public.qr_codes FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own QR codes." ON public.qr_codes FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow public to read QR codes for scanning
CREATE POLICY "Public can view QR codes." ON public.qr_codes FOR SELECT USING (true);

-- Similar policies for campaigns
CREATE POLICY "Users can view their own campaigns." ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own campaigns." ON public.campaigns FOR ALL USING (auth.uid() = user_id);

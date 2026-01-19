-- TimeTracker Pro Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'employee');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'approved', 'fulfilled');
CREATE TYPE public.leave_status AS ENUM ('approved', 'pending', 'rejected');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  employee_id UUID,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  employee_code TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  status employee_status NOT NULL DEFAULT 'active',
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  profile_photo_path TEXT,
  address TEXT,
  bank_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from profiles to employees
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Shifts table (one row per work session)
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  device_info TEXT NOT NULL,
  clock_in_photo_path TEXT,
  clock_out_photo_path TEXT,
  break_minutes INT NOT NULL DEFAULT 0,
  work_minutes INT,
  standard_minutes INT,
  overtime_minutes INT,
  notes TEXT,
  is_auto_created BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  week_number INT NOT NULL,
  year INT NOT NULL,
  total_minutes INT NOT NULL DEFAULT 0,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'pending',
  status_changed_by TEXT,
  status_note TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  original_minutes INT NOT NULL,
  edited_minutes INT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  rate NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitors table
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  car_reg TEXT,
  signed_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'signed_in',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin corrections log
CREATE TABLE public.admin_corrections_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_by UUID NOT NULL,
  rule_name TEXT NOT NULL,
  affected_rows INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_corrections_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Employees policies
CREATE POLICY "Admins can manage employees"
  ON public.employees FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view all employees"
  ON public.employees FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Shifts policies
CREATE POLICY "Employees can insert their own shifts"
  ON public.shifts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND employee_id = shifts.employee_id
    )
  );

CREATE POLICY "Employees can view their own shifts"
  ON public.shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND employee_id = shifts.employee_id
    )
  );

CREATE POLICY "Admins can manage all shifts"
  ON public.shifts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Invoices policies
CREATE POLICY "Admins can manage invoices"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND employee_id = invoices.employee_id
    )
  );

-- Invoice items policies
CREATE POLICY "Admins can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.profiles p ON p.employee_id = i.employee_id
      WHERE i.id = invoice_items.invoice_id
        AND p.user_id = auth.uid()
    )
  );

-- Visitors policies
CREATE POLICY "Anyone can insert visitors"
  ON public.visitors FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view visitors"
  ON public.visitors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage visitors"
  ON public.visitors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Leave requests policies
CREATE POLICY "Employees can view their own leave requests"
  ON public.leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND employee_id = leave_requests.employee_id
    )
  );

CREATE POLICY "Employees can insert their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND employee_id = leave_requests.employee_id
    )
  );

CREATE POLICY "Admins can manage all leave requests"
  ON public.leave_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin corrections log policies
CREATE POLICY "Only admins can access corrections log"
  ON public.admin_corrections_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for verification photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-photos', 'verification-photos', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can view all photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-photos'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER invoice_items_updated_at
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

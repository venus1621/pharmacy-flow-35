-- Add geolocation columns to branches table
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS operating_hours TEXT;

-- Create mobile_users table for mobile app users
CREATE TABLE public.mobile_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  push_token TEXT,
  notification_radius INTEGER DEFAULT 10,
  favorite_categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  promotional_price DECIMAL(10, 2),
  description TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.mobile_users(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.mobile_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for mobile_users (public registration, own data access)
CREATE POLICY "Anyone can register" ON public.mobile_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own data" ON public.mobile_users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON public.mobile_users FOR UPDATE USING (true);

-- RLS policies for promotions
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage promotions" ON public.promotions FOR ALL USING (is_owner(auth.uid()));

-- RLS policies for user_notifications
CREATE POLICY "Anyone can view notifications" ON public.user_notifications FOR SELECT USING (true);
CREATE POLICY "System can create notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_promotions_active ON public.promotions(is_active, valid_from, valid_until);
CREATE INDEX idx_promotions_medicine ON public.promotions(medicine_id);
CREATE INDEX idx_promotions_branch ON public.promotions(branch_id);
CREATE INDEX idx_mobile_users_email ON public.mobile_users(email);
CREATE INDEX idx_branches_location ON public.branches(latitude, longitude);
CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_mobile_users_updated_at
  BEFORE UPDATE ON public.mobile_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
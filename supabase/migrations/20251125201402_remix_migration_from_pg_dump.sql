CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: transfer_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transfer_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'owner',
    'pharmacist'
);


--
-- Name: get_pharmacist_branches(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pharmacist_branches(user_id uuid) RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT branch_id
  FROM public.pharmacist_assignments
  WHERE pharmacist_id = user_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'pharmacist')
  );
  RETURN NEW;
END;
$$;


--
-- Name: is_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_owner(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'owner'
  );
$$;


--
-- Name: is_pharmacist(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_pharmacist(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'pharmacist'
  );
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: branch_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    medicine_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    batch_number text,
    expire_date date NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT branch_stock_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: main_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.main_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    medicine_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    batch_number text,
    manufacture_date date,
    expire_date date NOT NULL,
    purchase_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT main_stock_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: medicines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    unit text DEFAULT 'box'::text NOT NULL,
    manufacturer text,
    requires_prescription boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pharmacies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pharmacies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    plan text DEFAULT 'testing'::text,
    has_subscription boolean DEFAULT false,
    subscription_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pharmacist_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pharmacist_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    role public.user_role DEFAULT 'pharmacist'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    medicine_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    quantity integer NOT NULL,
    status public.transfer_status DEFAULT 'pending'::public.transfer_status NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stock_transfers_quantity_check CHECK ((quantity > 0))
);


--
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    medicine_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transaction_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    pharmacist_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payment_method text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: branch_stock branch_stock_branch_id_medicine_id_batch_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_branch_id_medicine_id_batch_number_key UNIQUE (branch_id, medicine_id, batch_number);


--
-- Name: branch_stock branch_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: main_stock main_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_stock
    ADD CONSTRAINT main_stock_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: pharmacies pharmacies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_pkey PRIMARY KEY (id);


--
-- Name: pharmacist_assignments pharmacist_assignments_pharmacist_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacist_assignments
    ADD CONSTRAINT pharmacist_assignments_pharmacist_id_branch_id_key UNIQUE (pharmacist_id, branch_id);


--
-- Name: pharmacist_assignments pharmacist_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacist_assignments
    ADD CONSTRAINT pharmacist_assignments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: branch_stock update_branch_stock_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_branch_stock_updated_at BEFORE UPDATE ON public.branch_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branches update_branches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: main_stock update_main_stock_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_main_stock_updated_at BEFORE UPDATE ON public.main_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: medicines update_medicines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pharmacies update_pharmacies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branch_stock branch_stock_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: branch_stock branch_stock_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;


--
-- Name: main_stock main_stock_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_stock
    ADD CONSTRAINT main_stock_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;


--
-- Name: pharmacies pharmacies_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pharmacist_assignments pharmacist_assignments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacist_assignments
    ADD CONSTRAINT pharmacist_assignments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: pharmacist_assignments pharmacist_assignments_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacist_assignments
    ADD CONSTRAINT pharmacist_assignments_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);


--
-- Name: stock_transfers stock_transfers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: transaction_items transaction_items_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;


--
-- Name: transaction_items transaction_items_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pharmacies Owners can insert their own pharmacy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can insert their own pharmacy" ON public.pharmacies FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: pharmacist_assignments Owners can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage assignments" ON public.pharmacist_assignments USING (public.is_owner(auth.uid()));


--
-- Name: branch_stock Owners can manage branch stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage branch stock" ON public.branch_stock USING (public.is_owner(auth.uid()));


--
-- Name: branches Owners can manage branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage branches" ON public.branches USING (public.is_owner(auth.uid()));


--
-- Name: main_stock Owners can manage main stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage main stock" ON public.main_stock USING (public.is_owner(auth.uid()));


--
-- Name: medicines Owners can manage medicines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage medicines" ON public.medicines USING (public.is_owner(auth.uid()));


--
-- Name: stock_transfers Owners can manage transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage transfers" ON public.stock_transfers USING (public.is_owner(auth.uid()));


--
-- Name: pharmacies Owners can update their own pharmacy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update their own pharmacy" ON public.pharmacies FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: profiles Owners can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view all profiles" ON public.profiles FOR SELECT USING (public.is_owner(auth.uid()));


--
-- Name: transaction_items Owners can view all transaction items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view all transaction items" ON public.transaction_items FOR SELECT USING (public.is_owner(auth.uid()));


--
-- Name: transactions Owners can view all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view all transactions" ON public.transactions FOR SELECT USING (public.is_owner(auth.uid()));


--
-- Name: pharmacies Owners can view their own pharmacy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their own pharmacy" ON public.pharmacies FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: transaction_items Pharmacists can create transaction items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can create transaction items" ON public.transaction_items FOR INSERT WITH CHECK ((public.is_pharmacist(auth.uid()) AND (transaction_id IN ( SELECT transactions.id
   FROM public.transactions
  WHERE (transactions.pharmacist_id = auth.uid())))));


--
-- Name: transactions Pharmacists can create transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can create transactions" ON public.transactions FOR INSERT WITH CHECK ((public.is_pharmacist(auth.uid()) AND (branch_id IN ( SELECT public.get_pharmacist_branches(auth.uid()) AS get_pharmacist_branches)) AND (pharmacist_id = auth.uid())));


--
-- Name: stock_transfers Pharmacists can create transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can create transfers" ON public.stock_transfers FOR INSERT WITH CHECK ((public.is_pharmacist(auth.uid()) AND (branch_id IN ( SELECT public.get_pharmacist_branches(auth.uid()) AS get_pharmacist_branches)) AND (requested_by = auth.uid())));


--
-- Name: branch_stock Pharmacists can update their branch stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can update their branch stock" ON public.branch_stock FOR UPDATE USING ((public.is_pharmacist(auth.uid()) AND (branch_id IN ( SELECT public.get_pharmacist_branches(auth.uid()) AS get_pharmacist_branches))));


--
-- Name: branches Pharmacists can view assigned branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view assigned branches" ON public.branches FOR SELECT USING ((public.is_pharmacist(auth.uid()) AND (id IN ( SELECT public.get_pharmacist_branches(auth.uid()) AS get_pharmacist_branches))));


--
-- Name: medicines Pharmacists can view medicines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view medicines" ON public.medicines FOR SELECT USING (public.is_pharmacist(auth.uid()));


--
-- Name: pharmacist_assignments Pharmacists can view own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view own assignments" ON public.pharmacist_assignments FOR SELECT USING ((auth.uid() = pharmacist_id));


--
-- Name: transaction_items Pharmacists can view own transaction items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view own transaction items" ON public.transaction_items FOR SELECT USING ((public.is_pharmacist(auth.uid()) AND (transaction_id IN ( SELECT transactions.id
   FROM public.transactions
  WHERE (transactions.pharmacist_id = auth.uid())))));


--
-- Name: transactions Pharmacists can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view own transactions" ON public.transactions FOR SELECT USING ((public.is_pharmacist(auth.uid()) AND (pharmacist_id = auth.uid())));


--
-- Name: stock_transfers Pharmacists can view own transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view own transfers" ON public.stock_transfers FOR SELECT USING ((public.is_pharmacist(auth.uid()) AND ((requested_by = auth.uid()) OR (branch_id IN ( SELECT public.get_pharmacist_branches(auth.uid()) AS get_pharmacist_branches)))));


--
-- Name: branch_stock Pharmacists can view their branch stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pharmacists can view their branch stock" ON public.branch_stock FOR SELECT USING ((public.is_pharmacist(auth.uid()) AND (branch_id IN ( SELECT public.get_pharmacist_branches(auth.uid()) AS get_pharmacist_branches))));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: branch_stock; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branch_stock ENABLE ROW LEVEL SECURITY;

--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: main_stock; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.main_stock ENABLE ROW LEVEL SECURITY;

--
-- Name: medicines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacist_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pharmacist_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: transaction_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



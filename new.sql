--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 17.5

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: artifact_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.artifact_type AS ENUM (
    'invoice',
    'pod',
    'poc',
    'receipt',
    'vehicle_photo',
    'damage_photo',
    'customer_po',
    'note'
);


ALTER TYPE public.artifact_type OWNER TO postgres;

--
-- Name: bundle_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.bundle_status AS ENUM (
    'draft',
    'sent',
    'paid'
);


ALTER TYPE public.bundle_status OWNER TO postgres;

--
-- Name: customer_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.customer_type AS ENUM (
    'business',
    'individual'
);


ALTER TYPE public.customer_type OWNER TO postgres;

--
-- Name: damage_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.damage_type AS ENUM (
    'light_scratch',
    'deep_scratch',
    'small_dent',
    'large_dent',
    'paintwork_damage',
    'rust',
    'crack',
    'chip',
    'generic_damage'
);


ALTER TYPE public.damage_type OWNER TO postgres;

--
-- Name: email_template_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.email_template_type AS ENUM (
    'job_assignment',
    'poc_ready',
    'pod_ready',
    'invoice_ready',
    'job_completed',
    'payment_required',
    'bundle_invoice_ready',
    'bundle_payment_confirmation'
);


ALTER TYPE public.email_template_type OWNER TO postgres;

--
-- Name: expense_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expense_category AS ENUM (
    'fuel',
    'train',
    'uber',
    'parking',
    'toll',
    'misc'
);


ALTER TYPE public.expense_category OWNER TO postgres;

--
-- Name: expense_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expense_type AS ENUM (
    'fuel',
    'train',
    'bus',
    'taxi',
    'other'
);


ALTER TYPE public.expense_type OWNER TO postgres;

--
-- Name: job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.job_status AS ENUM (
    'created',
    'assigned',
    'collected',
    'delivered',
    'invoiced',
    'bundled',
    'paid',
    'aborted',
    'cancelled'
);


ALTER TYPE public.job_status OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'card',
    'cash',
    'bank_transfer',
    'fuel_card',
    'company_account'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: photo_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.photo_category AS ENUM (
    'front',
    'rear',
    'side',
    'interior',
    'odometer',
    'signature',
    'damage',
    'keys',
    'v5',
    'wheels'
);


ALTER TYPE public.photo_category OWNER TO postgres;

--
-- Name: stage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.stage AS ENUM (
    'collection',
    'delivery'
);


ALTER TYPE public.stage OWNER TO postgres;

--
-- Name: vehicle_panel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehicle_panel AS ENUM (
    'front_bumper',
    'bonnet',
    'windscreen',
    'front_grille',
    'ns_front_headlight',
    'os_front_headlight',
    'os_front_wing',
    'os_front_door',
    'os_rear_door',
    'os_rear_panel',
    'os_side_mirror',
    'ns_front_wing',
    'ns_front_door',
    'ns_rear_door',
    'ns_rear_panel',
    'ns_side_mirror',
    'rear_bumper',
    'tailgate_boot',
    'rear_windscreen',
    'ns_rear_light',
    'os_rear_light',
    'roof_panel',
    'roof_rails',
    'nsf_wheel',
    'nsr_wheel',
    'osf_wheel',
    'osr_wheel'
);


ALTER TYPE public.vehicle_panel OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artifacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artifacts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    stage text,
    type text NOT NULL,
    category text,
    related_id character varying,
    file_path text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes integer NOT NULL,
    sha256 text NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.artifacts OWNER TO postgres;

--
-- Name: bundle_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bundle_invoices (
    bundle_id character varying NOT NULL,
    invoice_id character varying NOT NULL
);


ALTER TABLE public.bundle_invoices OWNER TO postgres;

--
-- Name: checklist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checklist_items (
    id text DEFAULT gen_random_uuid() NOT NULL,
    job_id text NOT NULL,
    stage public.stage NOT NULL,
    number_of_keys integer,
    keys_photo_path character varying(500),
    has_v5 boolean,
    v5_photo_path character varying(500),
    has_locking_wheel_nut boolean,
    locking_wheel_nut_photo_path character varying(500),
    has_service_history boolean,
    service_history_photo_path character varying(500),
    has_parcel_shelf boolean,
    parcel_shelf_photo_path character varying(500),
    additional_notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.checklist_items OWNER TO postgres;

--
-- Name: collection_drafts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_drafts (
    job_id character varying NOT NULL,
    collection_data jsonb NOT NULL,
    current_step text NOT NULL,
    last_saved timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.collection_drafts OWNER TO postgres;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_addresses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    address jsonb NOT NULL,
    contact jsonb NOT NULL,
    notes text,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customer_addresses OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    customer_type public.customer_type DEFAULT 'business'::public.customer_type NOT NULL,
    address jsonb,
    billing_company_name text NOT NULL,
    billing_address jsonb NOT NULL,
    default_poc_emails jsonb DEFAULT '[]'::jsonb,
    default_pod_emails jsonb DEFAULT '[]'::jsonb,
    default_invoice_emails jsonb DEFAULT '[]'::jsonb,
    cost_per_mile numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: damage_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.damage_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    panel public.vehicle_panel NOT NULL,
    damage_type public.damage_type NOT NULL,
    stage text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.damage_reports OWNER TO postgres;

--
-- Name: delivery_drafts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_drafts (
    job_id character varying NOT NULL,
    delivery_data jsonb NOT NULL,
    current_step text NOT NULL,
    last_saved timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.delivery_drafts OWNER TO postgres;

--
-- Name: driver_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_availability (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    driver_id character varying NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.driver_availability OWNER TO postgres;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    trade_plate_number text,
    username text,
    pin text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_settings (
    id text DEFAULT gen_random_uuid() NOT NULL,
    smtp_host character varying(255) NOT NULL,
    smtp_port integer NOT NULL,
    smtp_user character varying(255) NOT NULL,
    smtp_password character varying(255) NOT NULL,
    from_email character varying(255) NOT NULL,
    from_name character varying(255) NOT NULL,
    is_enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_settings OWNER TO postgres;

--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    type public.email_template_type NOT NULL,
    html_content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_used timestamp without time zone
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- Name: environmental_conditions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.environmental_conditions (
    id text DEFAULT gen_random_uuid() NOT NULL,
    job_id text NOT NULL,
    stage public.stage NOT NULL,
    is_wet boolean NOT NULL,
    is_dark boolean NOT NULL,
    is_dirty boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.environmental_conditions OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    driver_id character varying NOT NULL,
    type public.expense_type NOT NULL,
    category text,
    fuel_type text,
    amount numeric(10,2) NOT NULL,
    merchant text,
    location text,
    purchased_at date,
    vat_rate numeric(5,4),
    vat_amount numeric(10,2),
    net_amount numeric(10,2),
    gross_amount numeric(10,2),
    payment_method text,
    receipt_artifact_id character varying,
    stage text,
    notes text,
    receipt_photo_path character varying(500),
    is_approved boolean,
    charge_to_customer boolean,
    submitted_at timestamp without time zone DEFAULT now(),
    approved_at timestamp without time zone,
    approved_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    description text
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: invoice_bundles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_bundles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    bundle_number text NOT NULL,
    customer_id character varying NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.bundle_status DEFAULT 'draft'::public.bundle_status NOT NULL,
    payment_intent_id text,
    paid_amount numeric(10,2),
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoice_bundles OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    invoice_number text NOT NULL,
    customer_id character varying NOT NULL,
    bundle_id character varying,
    movement_fee numeric(10,2) NOT NULL,
    expenses_total numeric(10,2) DEFAULT '0'::numeric,
    total_amount numeric(10,2) NOT NULL,
    is_paid boolean DEFAULT false,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: job_process_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_process_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    stage text NOT NULL,
    mileage_reading character varying,
    fuel_level integer,
    charge_level integer,
    is_wet boolean,
    is_dark boolean,
    weather_condition character varying,
    locking_wheel_nut_present boolean,
    spare_wheel_present boolean,
    jack_present boolean,
    tools_present boolean,
    charging_cables_present boolean,
    number_of_charging_cables integer,
    sat_nav_working boolean,
    vehicle_delivery_pack_present boolean,
    number_plates_match boolean,
    warning_lights_on boolean,
    headrests_present boolean,
    parcel_shelf_present boolean,
    v5_present boolean,
    service_history_present boolean,
    number_of_keys integer,
    vehicle_clean_internally boolean,
    vehicle_clean_externally boolean,
    vehicle_free_damage_internally boolean,
    vehicle_free_damage_externally boolean,
    collected_right_place_time boolean,
    handbook_service_book_present boolean,
    mats_in_place boolean,
    handover_accepted boolean,
    photo_left_side_taken boolean,
    photo_right_side_taken boolean,
    photo_front_taken boolean,
    photo_back_taken boolean,
    photo_dashboard_taken boolean,
    photo_keys_taken boolean,
    additional_notes text,
    customer_name text,
    customer_signature text,
    customer_satisfaction_rating integer,
    inspection_data jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_process_records OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_number text NOT NULL,
    customer_id character varying,
    driver_id character varying,
    vehicle_id character varying,
    collection_address jsonb NOT NULL,
    delivery_address jsonb NOT NULL,
    collection_contact jsonb NOT NULL,
    delivery_contact jsonb NOT NULL,
    calculated_mileage numeric(10,2),
    rate_per_mile numeric(10,2),
    total_movement_fee numeric(10,2),
    requested_collection_date timestamp without time zone,
    requested_delivery_date timestamp without time zone,
    status public.job_status DEFAULT 'created'::public.job_status,
    created_at timestamp without time zone DEFAULT now(),
    assigned_at timestamp without time zone,
    collected_at timestamp without time zone,
    delivered_at timestamp without time zone,
    invoiced_at timestamp without time zone,
    paid_at timestamp without time zone,
    aborted_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    abort_fee numeric(10,2),
    cancellation_fee numeric(10,2),
    abort_reason text,
    cancellation_reason text,
    payment_status text DEFAULT 'pending'::text,
    payment_intent_id text,
    paid_amount numeric(10,2),
    override_poc_emails jsonb,
    override_pod_emails jsonb,
    override_invoice_emails jsonb
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: miscellaneous_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.miscellaneous_photos (
    id text DEFAULT gen_random_uuid() NOT NULL,
    job_id text NOT NULL,
    stage public.stage NOT NULL,
    photo_path character varying(500) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.miscellaneous_photos OWNER TO postgres;

--
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying,
    damage_report_id character varying,
    expense_id character varying,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    category text NOT NULL,
    stage text,
    inspection_item text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: user_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_credentials (
    id character varying NOT NULL,
    username character varying(255) NOT NULL,
    hashed_password text NOT NULL,
    role character varying(50) NOT NULL,
    driver_id character varying(255),
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    last_login_ip character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_credentials OWNER TO postgres;

--
-- Name: vehicle_inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_inspections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    job_number text NOT NULL,
    inspection_type text NOT NULL,
    data jsonb,
    completed_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vehicle_inspections OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    registration text NOT NULL,
    make text NOT NULL,
    colour text,
    fuel_type text,
    year integer,
    mot_status text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: wage_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wage_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    driver_id character varying NOT NULL,
    week_start_date date NOT NULL,
    week_end_date date NOT NULL,
    total_earnings numeric(10,2) NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    paid_at timestamp without time zone,
    paid_by character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wage_payments OWNER TO postgres;

--
-- Data for Name: artifacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artifacts (id, job_id, stage, type, category, related_id, file_path, original_name, mime_type, size_bytes, sha256, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: bundle_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bundle_invoices (bundle_id, invoice_id) FROM stdin;
\.


--
-- Data for Name: checklist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.checklist_items (id, job_id, stage, number_of_keys, keys_photo_path, has_v5, v5_photo_path, has_locking_wheel_nut, locking_wheel_nut_photo_path, has_service_history, service_history_photo_path, has_parcel_shelf, parcel_shelf_photo_path, additional_notes, created_at) FROM stdin;
\.


--
-- Data for Name: collection_drafts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collection_drafts (job_id, collection_data, current_step, last_saved) FROM stdin;
03f3447b-f3ff-45fd-96de-94537f16d9f3	{"vehicleDetails": {"fuelLevel": 75, "mileageReading": "12500"}, "customerDetails": {"name": "Test Customer"}}	vehicle-details	2025-10-05 20:24:49.931
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_addresses (id, customer_id, name, type, address, contact, notes, is_default, created_at) FROM stdin;
009bf5d0-45ca-4244-a535-b669c6a3a3f6	39cb9099-a539-4991-8fc9-63ecb43bce1a	Yard	collection	{"city": "Shotts", "line1": "27 Bute Crescent", "line2": "", "postcode": "ML7 4HF"}	{"name": "Gary O'Neill", "email": "shotts@bcaauto.com", "phone": "07752679982"}	Always ask for Gary	f	2025-10-01 16:36:18.5364
dbd94527-cf1e-4b18-adbf-c318fd5ea63e	39cb9099-a539-4991-8fc9-63ecb43bce1a	Office	delivery	{"city": "Shotts", "line1": "11 Erskine Way", "line2": "", "postcode": "ML7 4AY"}	{"name": "William", "email": "depot@testmotorco.com", "phone": "0121 456 7890"}	Testing Bill	f	2025-10-01 16:37:03.376645
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, email, phone, customer_type, address, billing_company_name, billing_address, default_poc_emails, default_pod_emails, default_invoice_emails, cost_per_mile, created_at) FROM stdin;
39cb9099-a539-4991-8fc9-63ecb43bce1a	Henson Motor Group	garyjamesoneill@live.com	07752679982	business	{"city": "Newcastle", "line1": "Henson House", "line2": "Ponteland Road", "postcode": "NE5 3DF"}	Henson Motor Group	{"city": "Newcastle", "line1": "Henson House", "line2": "Ponteland Road", "postcode": "NE5 3DF"}	[]	[]	[]	0.80	2025-09-22 20:09:23.976259
8ea425af-df2b-4f61-b686-9fd9778074b8	Gary James	garyjamesoneill@live.com	07752679982	individual	{"city": "Shotts", "line1": "11 Bute Crescent", "postcode": "ML7 4HF"}	Gary James	{"city": "Shotts", "line1": "11 Bute Crescent", "postcode": "ML7 4HF"}	[]	[]	[]	1.00	2025-09-27 20:37:37.785672
\.


--
-- Data for Name: damage_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.damage_reports (id, job_id, panel, damage_type, stage, notes, created_at) FROM stdin;
\.


--
-- Data for Name: delivery_drafts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_drafts (job_id, delivery_data, current_step, last_saved) FROM stdin;
03f3447b-f3ff-45fd-96de-94537f16d9f3	{"vehicleDetails": {"fuelLevel": 50, "mileageReading": "12650"}, "customerDetails": {"name": "William", "signature": ""}}	vehicle-details	2025-10-05 20:26:01.763
\.


--
-- Data for Name: driver_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.driver_availability (id, driver_id, start_date, end_date, reason, created_at) FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (id, name, email, phone, trade_plate_number, username, pin, is_active, created_at) FROM stdin;
814a7c0d-7c37-4724-ad49-6c7d3b1c21c9	Gary O'Neill	garyjamesoneill@live.com	07752679982	L6981	gary	2412	t	2025-09-22 19:40:13.416752
\.


--
-- Data for Name: email_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_settings (id, smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (id, name, subject, type, html_content, is_active, created_at, updated_at, last_used) FROM stdin;
bedd535b-d9db-43be-96b1-5ec305042b43	Invoice Notification	Invoice {invoiceNumber}	invoice_ready	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"\n  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"\n      xmlns:o="urn:schemas-microsoft-com:office:office">\n<head>\n  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n  <meta name="x-apple-disable-message-reformatting" />\n  <meta http-equiv="X-UA-Compatible" content="IE=edge" />\n  <meta name="color-scheme" content="light dark">\n  <meta name="supported-color-schemes" content="light dark">\n  <title>Invoice {invoiceNumber} – OVM Transport</title>\n  <!--[if gte mso 9]>\n  <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>\n  <![endif]-->\n  <style>\n    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}\n    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse!important}\n    img{border:0;outline:0;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;height:auto;line-height:100%}\n    body{margin:0!important;padding:0!important;width:100%!important;background:#F6F6F6}\n    .container{width:600px;margin:0 auto}\n    .px{padding-left:24px;padding-right:24px}\n    .py24{padding-top:24px;padding-bottom:24px}\n    .py32{padding-top:32px;padding-bottom:32px}\n    .py40{padding-top:40px;padding-bottom:40px}\n    .h1{font:700 22px/28px Arial,sans-serif}\n    .h2{font:700 24px/32px Arial,sans-serif}\n    .h3{font:700 18px/24px Arial,sans-serif}\n    .p{font:400 16px/24px Arial,sans-serif}\n    .muted{color:#6B7280!important}\n    .heading{color:#111827!important}\n    .bodytxt{color:#374151!important}\n    .card{background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px}\n    .cardhead{background:#F9FAFB;border-bottom:1px solid #E5E7EB;padding:14px 20px}\n    .cardbody{padding:20px}\n    .pill{background:#3B82F6;border-radius:12px}\n    .amount{font:800 30px/34px Arial,sans-serif;color:#FFFFFF;padding:14px 18px;background:rgba(255,255,255,0.18);border-radius:10px;display:inline-block}\n    @media only screen and (max-width:600px){\n      .container{width:100%!important}\n      .px{padding-left:16px!important;padding-right:16px!important}\n      .py40{padding-top:28px!important;padding-bottom:28px!important}\n      .h2{font-size:22px!important;line-height:30px!important}\n      .h1{font-size:20px!important;line-height:26px!important}\n      .amount{font-size:28px!important;line-height:32px!important}\n    }\n    @media (prefers-color-scheme: dark){\n      body{background:#111827!important}\n      .card{background:#0F172A!important;border-color:#1F2937!important}\n      .cardhead{background:#111827!important;border-color:#1F2937!important}\n      .heading{color:#E5E7EB!important}\n      .bodytxt{color:#D1D5DB!important}\n      .muted{color:#9CA3AF!important}\n      /* lock brand areas */\n      .lock-blue{background:#3B82F6!important}\n    }\n    [data-ogsc] .lock-blue{background:#3B82F6!important}\n    [data-ogsc] .card{background:#0F172A!important;border-color:#1F2937!important}\n    [data-ogsc] .cardhead{background:#111827!important;border-color:#1F2937!important}\n  </style>\n</head>\n<body id="body">\n  <!-- preheader -->\n  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">\n    Invoice {invoiceNumber} for {customerName}. Vehicle: {vehicleDetails}. Total £{totalAmount}.\n  </div>\n\n  <!-- HEADER (VML to lock blue in Outlook) -->\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n    <tr>\n      <td align="center">\n        <!--[if mso]>\n        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="t" stroke="f" style="width:600px;height:auto;">\n          <v:fill type="solid" color="#3B82F6"/>\n          <v:textbox inset="0,0,0,0">\n        <![endif]-->\n        <table role="presentation" width="600" class="container lock-blue" cellpadding="0" cellspacing="0" style="background:#3B82F6">\n          <tr>\n            <td class="px py32" align="center" style="padding:32px 24px">\n              <!-- Logo: CID for Outlook; HTTPS for others -->\n              <!--[if mso]>\n                <img src="cid:ovm-logo" width="192" alt="OVM" style="display:block;border:0;outline:0;text-decoration:none;">\n              <![endif]-->\n              <!--[if !mso]><!-- -->\n                <img src="https://ovmtransport.com/ovm.png" width="192" alt="OVM" style="margin:0 auto;border:0;outline:0;text-decoration:none">\n              <!--<![endif]-->\n\n              <!-- Company name (locked white) -->\n              <div class="h1" style="color:#FFFFFF!important;margin:14px 0 4px 0;font-family:Arial,sans-serif">\n                <font color="#ffffff">OVM Professional Transport</font>\n              </div>\n\n              <!-- Tagline EXACT text; locked white for Gmail dark mode -->\n              <div style="font:600 13px/18px Arial,sans-serif;letter-spacing:.6px;text-transform:uppercase;color:#FFFFFF!important;margin:0;opacity:.98">\n                <font color="#ffffff">Nationwide Vehicle Movements</font>\n              </div>\n            </td>\n          </tr>\n        </table>\n        <!--[if mso]></v:textbox></v:rect><![endif]-->\n      </td>\n    </tr>\n  </table>\n\n  <!-- CONTENT -->\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n    <tr>\n      <td align="center">\n        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" style="background:#FFFFFF">\n          <tr>\n            <td class="px py40" style="padding:40px 24px">\n              <div class="h2 heading" style="margin:0 0 16px 0;font-family:Arial,sans-serif">Hi {customerName},</div>\n              <p class="p bodytxt" style="margin:0 0 28px 0;font-family:Arial,sans-serif">\n                Thank you for choosing OVM Professional Transport. Please find your invoice attached to this email.\n              </p>\n\n              <!-- Invoice summary -->\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="pill lock-blue" style="border-radius:12px;background:#3B82F6">\n                <tr>\n                  <td align="center" style="padding:28px 20px">\n                    <div class="h3" style="color:#FFFFFF!important;margin:0 0 6px 0;font-family:Arial,sans-serif">\n                      <font color="#ffffff">Invoice {invoiceNumber}</font>\n                    </div>\n                    <div class="p" style="color:#E2E8F0;margin:0 0 16px 0;font-family:Arial,sans-serif">{vehicleDetails}</div>\n                    <span class="amount">£{totalAmount}</span>\n                  </td>\n                </tr>\n              </table>\n\n              <!-- spacer -->\n              <div style="height:30px;line-height:30px;font-size:0">&nbsp;</div>\n\n              <!-- Service details -->\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="border-radius:12px">\n                <tr>\n                  <td class="cardhead">\n                    <div style="font:700 14px/20px Arial,sans-serif;letter-spacing:.3px;text-transform:uppercase;color:#374151">Service Details</div>\n                  </td>\n                </tr>\n                <tr>\n                  <td class="cardbody">\n                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n                      <tr>\n                        <td width="32%" style="padding:10px 0 6px 0;font:600 15px/22px Arial,sans-serif;color:#6B7280">Collection</td>\n                        <td style="padding:10px 0 6px 0;font:700 15px/22px Arial,sans-serif;color:#1F2937">{collectionAddress}</td>\n                      </tr>\n                      <tr>\n                        <td width="32%" style="padding:8px 0 6px 0;font:600 15px/22px Arial,sans-serif;color:#6B7280">Delivery</td>\n                        <td style="padding:8px 0 6px 0;font:700 15px/22px Arial,sans-serif;color:#1F2937">{deliveryAddress}</td>\n                      </tr>\n                      <tr>\n                        <td width="32%" style="padding:8px 0 6px 0;font:600 15px/22px Arial,sans-serif;color:#6B7280">Collected</td>\n                        <td style="padding:8px 0 6px 0;font:700 15px/22px Arial,sans-serif;color:#1F2937">{collectedAt}</td>\n                      </tr>\n                      <tr>\n                        <td width="32%" style="padding:8px 0 0 0;font:600 15px/22px Arial,sans-serif;color:#6B7280">Delivered</td>\n                        <td style="padding:8px 0 0 0;font:700 15px/22px Arial,sans-serif;color:#1F2937">{deliveredAt}</td>\n                      </tr>\n                    </table>\n                  </td>\n                </tr>\n              </table>\n\n              <p class="p bodytxt" style="margin:28px 0 0 0;font-family:Arial,sans-serif">\n                We appreciate your business. If you have any questions about this invoice, just reply to this email.\n              </p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n\n  <!-- FOOTER -->\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n    <tr>\n      <td align="center">\n        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-top:1px solid #E5E7EB">\n          <tr>\n            <td class="px py24" align="center" style="padding:24px 24px">\n              <div class="h3 heading" style="margin:0 0 6px 0;font-family:Arial,sans-serif">OVM Professional Transport</div>\n              <div class="p muted" style="margin:0 0 4px 0;font-family:Arial,sans-serif">movements@ovmtransport.com</div>\n              <div class="p muted" style="margin:0;font-family:Arial,sans-serif">Professional vehicle transport services across the UK</div>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>	t	2025-08-16 20:57:37.4824	2025-08-21 19:10:19.277	\N
2dd07d12-ea09-4687-b690-4302c06be1f8	Proof of Collection Notification	POC: Job {jobNumber} Collection Completed - {vehicleRegistration}	poc_ready	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Vehicle Collection Completed</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">\n    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">\n        <div style="background-color: #1a73e8; color: white; padding: 20px; text-align: center;">\n            <h1 style="margin: 0; font-size: 24px;">OVM Transport Solutions</h1>\n            <p style="margin: 10px 0 0 0;">Vehicle Movement Specialists</p>\n        </div>\n        \n        <div style="padding: 30px; background-color: #f9f9f9;">\n            <h2 style="color: #1a73e8; margin-bottom: 20px;">Vehicle Collection Completed</h2>\n            \n            <p>Dear {customerName},</p>\n            \n            <p>We are pleased to confirm that your vehicle has been successfully collected and is now in our secure transport system.</p>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #1a73e8; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #1a73e8;">Collection Details</h3>\n                <p><strong>Job Number:</strong> {jobNumber}</p>\n                <p><strong>Vehicle:</strong> {vehicleDetails}</p>\n                <p><strong>Registration:</strong> {vehicleRegistration}</p>\n                <p><strong>Collected From:</strong> {collectionAddress}</p>\n                <p><strong>Collection Date:</strong> {collectionDate}</p>\n                <p><strong>Driver:</strong> {driverName}</p>\n            </div>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #10B981;">Next Steps</h3>\n                <p>Your vehicle is now being transported to:</p>\n                <p><strong>{deliveryAddress}</strong></p>\n                <p>We will send you another notification when the delivery is completed.</p>\n            </div>\n            \n            <p>Please find the Proof of Collection (POC) document attached to this email for your records.</p>\n            \n            <p>If you have any questions about this collection or need to contact us, please don''t hesitate to reach out.</p>\n            \n            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">\n                <p style="margin: 0;"><strong>OVM Transport Solutions</strong></p>\n                <p style="margin: 5px 0;">Tel: 0161 123 4567</p>\n                <p style="margin: 5px 0;">Email: info@ovmtransport.co.uk</p>\n            </div>\n        </div>\n    </div>\n</body>\n</html>	t	2025-08-20 10:27:45.747755	2025-08-20 10:27:45.747755	\N
2e16b505-3f6d-4e41-a078-a6c9a08172aa	Payment Required - Individual Customer	PAYMENT REQUIRED: Job {jobNumber} - {vehicleRegistration} - £{totalAmount}	payment_required	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Payment Required - OVM Transport</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">\n    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">\n        <div style="background-color: #1a73e8; color: white; padding: 20px; text-align: center;">\n            <h1 style="margin: 0; font-size: 24px;">OVM Transport Solutions</h1>\n            <p style="margin: 10px 0 0 0;">Vehicle Movement Specialists</p>\n        </div>\n        \n        <div style="padding: 30px; background-color: #f9f9f9;">\n            <div style="background-color: #ff6b35; color: white; padding: 15px; text-align: center; margin-bottom: 30px; border-radius: 8px;">\n                <h2 style="margin: 0; font-size: 20px;">⚠️ PAYMENT REQUIRED ⚠️</h2>\n                <p style="margin: 10px 0 0 0; font-size: 16px;">Complete payment to schedule your vehicle transport</p>\n            </div>\n            \n            <p>Dear {customerName},</p>\n            \n            <p>Thank you for choosing OVM Transport Solutions! Your vehicle transport job has been created and is ready for scheduling.</p>\n            \n            <p><strong style="color: #ff6b35;">Payment is required before we can assign a driver and begin your vehicle transport.</strong></p>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #1a73e8; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #1a73e8;">Job Details</h3>\n                <p><strong>Job Number:</strong> {jobNumber}</p>\n                <p><strong>Vehicle:</strong> {vehicleDetails}</p>\n                <p><strong>Registration:</strong> {vehicleRegistration}</p>\n                <p><strong>Collection Address:</strong> {collectionAddress}</p>\n                <p><strong>Delivery Address:</strong> {deliveryAddress}</p>\n                <p><strong>Distance:</strong> {calculatedMileage} miles</p>\n                <p><strong>Rate:</strong> £{ratePerMile} per mile</p>\n            </div>\n            \n            <div style="background-color: #10B981; color: white; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px;">\n                <h3 style="margin-top: 0; font-size: 24px;">Amount Due: £{totalAmount}</h3>\n                <p style="margin: 10px 0; font-size: 16px;">Secure payment via Stripe - All major cards accepted</p>\n                \n                <div style="margin-top: 25px;">\n                    <a href="{paymentUrl}" style="display: inline-block; background-color: #ffffff; color: #10B981; text-decoration: none; padding: 15px 40px; font-size: 18px; font-weight: bold; border-radius: 8px; border: 2px solid #ffffff;">\n                        💳 PAY NOW - £{totalAmount}\n                    </a>\n                </div>\n                \n                <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9;">Click the button above to complete your secure payment</p>\n            </div>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #10B981;">What Happens Next?</h3>\n                <p>✅ <strong>Step 1:</strong> Complete payment using the button above</p>\n                <p>✅ <strong>Step 2:</strong> We will immediately assign an experienced driver</p>\n                <p>✅ <strong>Step 3:</strong> Your driver will contact you to arrange collection</p>\n                <p>✅ <strong>Step 4:</strong> Professional transport with full documentation</p>\n            </div>\n            \n            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">\n                <p style="margin: 0;"><strong>⏰ Important:</strong> Your vehicle transport will not be scheduled until payment is completed. Pay now to ensure the fastest possible service.</p>\n            </div>\n            \n            <p>Our secure payment system is powered by Stripe, ensuring your payment information is fully protected.</p>\n            \n            <p>If you have any questions about this payment or need assistance, please contact us immediately.</p>\n            \n            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">\n                <p style="margin: 0;"><strong>OVM Transport Solutions</strong></p>\n                <p style="margin: 5px 0;">Tel: 0161 123 4567</p>\n                <p style="margin: 5px 0;">Email: info@ovmtransport.co.uk</p>\n                <p style="margin: 5px 0;"><strong>Job Reference: {jobNumber}</strong></p>\n            </div>\n        </div>\n    </div>\n</body>\n</html>	t	2025-09-28 19:41:48.434559	2025-09-28 19:41:48.434559	\N
096a5468-7184-4846-b34f-c42c0a29f515	Bundle Invoice Ready	Invoice Bundle {{bundleNumber}} - {{customerName}} - {{totalAmount}}	bundle_invoice_ready	<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice Bundle {{bundleNumber}}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:white;padding:30px;text-align:center}.content{padding:40px}.amount{font-size:36px;font-weight:bold;color:#1e3a8a}</style></head><body><div class="container"><div class="header"><h1>🚗 OVM Transport</h1><p>Invoice Bundle {{bundleNumber}}</p></div><div class="content"><p>Dear {{customerName}},</p><p>Please find attached your consolidated invoice bundle <strong>{{bundleNumber}}</strong> containing {{invoiceCount}} invoices.</p><div style="text-align:center"><div class="amount">{{totalAmount}}</div></div><h3>Invoices Included:</h3><div>{{invoicesList}}</div><p><strong>Payment due within 30 days.</strong></p></div></div></body></html>	t	2025-09-29 09:52:16.270806	2025-09-29 09:52:16.270806	\N
0d3db502-0e46-4ea4-9123-9f241b63b9dc	Bundle Payment Confirmation	Payment Confirmed: Bundle {{bundleNumber}} - {{paidAmount}}	bundle_payment_confirmation	<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment Confirmed - {{bundleNumber}}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:30px;text-align:center}.content{padding:40px}.amount{font-size:36px;font-weight:bold;color:#10b981}</style></head><body><div class="container"><div class="header"><h1>✅ Payment Confirmed</h1><p>Bundle {{bundleNumber}}</p></div><div class="content"><p>Dear {{customerName}},</p><p>Thank you! Your payment for bundle <strong>{{bundleNumber}}</strong> has been confirmed.</p><div style="text-align:center"><div class="amount">{{paidAmount}}</div><p>Paid on {{paymentDate}} at {{paymentTime}}</p></div><h3>Invoices Paid:</h3><div>{{invoicesList}}</div><p>All invoices are now marked as paid.</p></div></div></body></html>	t	2025-09-29 09:52:21.279589	2025-09-29 09:52:21.279589	\N
a9f83be0-7507-49e7-9793-531e2e12568d	Job Assignment Notification	New Job Assignment - {jobNumber}	job_assignment	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>New Job Assignment</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">\n    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">\n        <div style="background-color: #EC4899; color: white; padding: 20px; text-align: center;">\n            <h1 style="margin: 0; font-size: 42px;">OVM</h1>\n            <p style="margin: 0px 0 0 0;">New Job Assignment</p>\n        </div>\n        \n        <div style="padding: 30px; background-color: #f9f9f9;">\n            \n            <p>Hi {driverName},</p>\n            \n            <p>You have been assigned to transport the following vehicle:</p>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #EC4899; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #EC4899;">Job Details</h3>\n                <p><strong>Job Number:</strong> {jobNumber}</p>\n                <p><strong>Vehicle:</strong> {vehicleDetails}</p>\n                <p><strong>Customer:</strong> {customerName}</p>\n            </div>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #1a73e8; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #1a73e8;">Collection</h3>\n                <p>{collectionAddress}</p>\n                <p><strong>Contact:</strong> {collectionContact}</p>\n                <p><strong>Release Code:</strong> {releaseCode}</p>\n                 <p><strong>MoDel Pin:</strong> {modelPin}</p>\n                <p><strong>Notes:</strong> {collectionNotes}</p>\n            </div>\n            \n            <div style="background-color: white; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0;">\n                <h3 style="margin-top: 0; color: #10B981;">Delivery</h3>\n                <p>{deliveryAddress}</p>\n                <p><strong>Contact:</strong> {deliveryContact}</p>\n                <p><strong>Notes:</strong> {deliveryNotes}</p>\n            </div>\n            \n            <p>Please use the app to manage this job and complete the collection and delivery processes.</p>\n            \n            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">\n                <p style="margin: 0;"><strong>OVM Ltd (SC834621)</strong></p>\n                <p style="margin: 5px 0;">Tel: 0141 459 1302</p>\n                <p style="margin: 5px 0;">Email: info@ovmtransport.com</p>\n            </div>\n        </div>\n    </div>\n</body>\n</html>	t	2025-08-20 10:27:45.747755	2025-09-30 17:59:05.701	\N
\.


--
-- Data for Name: environmental_conditions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.environmental_conditions (id, job_id, stage, is_wet, is_dark, is_dirty, created_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, job_id, driver_id, type, category, fuel_type, amount, merchant, location, purchased_at, vat_rate, vat_amount, net_amount, gross_amount, payment_method, receipt_artifact_id, stage, notes, receipt_photo_path, is_approved, charge_to_customer, submitted_at, approved_at, approved_by, created_at, description) FROM stdin;
78e29a15-5d72-400f-afec-c815936ad753	03f3447b-f3ff-45fd-96de-94537f16d9f3	814a7c0d-7c37-4724-ad49-6c7d3b1c21c9	fuel	fuel	petrol	12.00	\N	\N	2025-10-05	\N	\N	\N	\N	\N	\N	expenses	\N	Jobs/October 2025/051025001/Expenses/Collection/fuel_receipt_051025001 (P7DGO).jpg	\N	\N	2025-10-05 15:32:13.131277	\N	\N	2025-10-05 15:32:13.131277	\N
\.


--
-- Data for Name: invoice_bundles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_bundles (id, bundle_number, customer_id, total_amount, status, payment_intent_id, paid_amount, paid_at, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, job_id, invoice_number, customer_id, bundle_id, movement_fee, expenses_total, total_amount, is_paid, paid_at, created_at) FROM stdin;
86f1e594-4c18-41b4-8727-93bfbefee2e3	03f3447b-f3ff-45fd-96de-94537f16d9f3	051025001	39cb9099-a539-4991-8fc9-63ecb43bce1a	\N	118.40	0.00	118.40	f	\N	2025-10-05 20:27:00.208155
\.


--
-- Data for Name: job_process_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_process_records (id, job_id, stage, mileage_reading, fuel_level, charge_level, is_wet, is_dark, weather_condition, locking_wheel_nut_present, spare_wheel_present, jack_present, tools_present, charging_cables_present, number_of_charging_cables, sat_nav_working, vehicle_delivery_pack_present, number_plates_match, warning_lights_on, headrests_present, parcel_shelf_present, v5_present, service_history_present, number_of_keys, vehicle_clean_internally, vehicle_clean_externally, vehicle_free_damage_internally, vehicle_free_damage_externally, collected_right_place_time, handbook_service_book_present, mats_in_place, handover_accepted, photo_left_side_taken, photo_right_side_taken, photo_front_taken, photo_back_taken, photo_dashboard_taken, photo_keys_taken, additional_notes, customer_name, customer_signature, customer_satisfaction_rating, inspection_data, created_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, job_number, customer_id, driver_id, vehicle_id, collection_address, delivery_address, collection_contact, delivery_contact, calculated_mileage, rate_per_mile, total_movement_fee, requested_collection_date, requested_delivery_date, status, created_at, assigned_at, collected_at, delivered_at, invoiced_at, paid_at, aborted_at, cancelled_at, abort_fee, cancellation_fee, abort_reason, cancellation_reason, payment_status, payment_intent_id, paid_amount, override_poc_emails, override_pod_emails, override_invoice_emails) FROM stdin;
03f3447b-f3ff-45fd-96de-94537f16d9f3	051025001	39cb9099-a539-4991-8fc9-63ecb43bce1a	814a7c0d-7c37-4724-ad49-6c7d3b1c21c9	f296775a-0d12-4f51-a801-92deb79b20dd	{"city": "Shotts", "line1": "27 Bute Crescent", "line2": "", "postcode": "ML7 4HF"}	{"city": "Shotts", "line1": "11 Erskine Way", "line2": "", "postcode": "NE5 3DF"}	{"name": "Gary O'Neill", "email": "shotts@bcaauto.com", "notes": "Always ask for Gary", "phone": "07752679982", "modelPin": "", "releaseCode": ""}	{"name": "William", "email": "depot@testmotorco.com", "notes": "Testing Bill", "phone": "0121 456 7890"}	148.00	0.80	118.40	2025-10-06 00:00:00	2025-10-06 00:00:00	invoiced	2025-10-05 15:13:22.72735	2025-10-05 15:13:43.671	\N	\N	2025-10-05 20:27:00.212	\N	\N	\N	\N	\N	\N	\N	not_required	\N	0.00	\N	\N	\N
\.


--
-- Data for Name: miscellaneous_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.miscellaneous_photos (id, job_id, stage, photo_path, description, created_at) FROM stdin;
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photos (id, job_id, damage_report_id, expense_id, filename, original_name, mime_type, size, url, category, stage, inspection_item, created_at) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, description, created_at, updated_at) FROM stdin;
aafce79f-1edb-467a-80c7-c0a92d38954e	smtp_host	smtp.office365.com	Microsoft 365 SMTP server	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
b36596cc-15b0-4fba-bec7-5c884e899a78	smtp_port	587	SMTP port for Microsoft 365	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
03e5eecd-3847-439d-86d8-5f1f100f4c7c	smtp_secure	false	Use STARTTLS instead of SSL	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
11077beb-3433-4b98-937b-ce64694ed2f9	smtp_user	info@ovmtransport.com	Email address for sending emails	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
1e9be003-1829-4266-ad17-e4d2fcc349bd	smtp_from_name	OVM Transport Solutions	Display name for outgoing emails	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
e01e3543-96cb-429c-a0bd-6d65fbf2843f	imap_host	outlook.office365.com	Microsoft 365 IMAP server for sent folder	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
96bb5fbd-f952-41fc-ad2c-2fc677054004	imap_port	993	IMAP port for Microsoft 365	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
26c63d99-714b-442c-a04f-39f0db81e615	imap_secure	true	Use SSL for IMAP connection	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
c7e0cc6a-3c23-4884-9d91-ec0f4255f62b	smtp_password	${EMAIL_PASSWORD}	Email password (update with real password)	2025-09-28 19:46:06.988878	2025-09-28 19:46:06.988878
\.


--
-- Data for Name: user_credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_credentials (id, username, hashed_password, role, driver_id, is_active, last_login, last_login_ip, created_at, updated_at) FROM stdin;
2d248878-3bf0-475a-8b38-c011cc6ba34e	admin	$2b$12$kCs9YiTh4GUkTJQA9UXrpeFTGYwq.YQWwTEzqsKOEtBQb42Dx4DlG	admin	\N	t	2025-10-05 20:51:08.745	10.82.10.110	2025-09-22 17:34:41.294309	2025-10-05 20:51:08.745
\.


--
-- Data for Name: vehicle_inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_inspections (id, job_id, job_number, inspection_type, data, completed_at, created_at) FROM stdin;
inspection_1759695909353	03f3447b-f3ff-45fd-96de-94537f16d9f3	051025001	collection	{"signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "completedAt": "2025-10-05T20:25:09.000Z", "customerName": "Test Customer", "photoSummary": {"total": 8, "categories": {"v5": 1, "keys": 1, "rear": 1, "front": 1, "odometer": 1, "driverSide": 1, "passengerSide": 1}}, "damageMarkers": []}	2025-10-05 20:25:09	2025-10-05 20:25:09.357
inspection_1759695972921	03f3447b-f3ff-45fd-96de-94537f16d9f3	051025001	delivery	{"signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "completedAt": "2025-10-05T20:26:12.000Z", "customerName": "William", "photoSummary": {"total": 6, "categories": {"rear": 1, "front": 1, "odometer": 1, "driverSide": 1, "passengerSide": 1}}, "damageMarkers": []}	2025-10-05 20:26:12	2025-10-05 20:26:12.921
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, registration, make, colour, fuel_type, year, mot_status, created_at) FROM stdin;
81b43ccd-6d76-4a62-b8ff-2d9e39c756cf	SA16WYM	VAUXHALL	WHITE	PETROL	2016	Valid	2025-09-23 21:05:46.222801
6e0d1317-17f6-44cc-a5b6-93ab6305b554	HK67LUL	FORD	GREY	HYBRID ELECTRIC	2017	Valid	2025-09-28 07:58:27.656209
40a86738-12be-4ee2-be61-6bb9a53cf99e	YF23XMT	NISSAN	WHITE	PETROL	2023	No details held by DVLA	2025-09-28 08:32:44.289656
e57f10d2-bf9e-487f-820e-63bef06eb745	NH21EXO	VOLKSWAGEN	GREY	ELECTRICITY	2021	Valid	2025-09-28 08:32:44.855917
83508023-b09d-4d7b-8ab5-12f43e0dd019	MJ20CMO	FORD	RED	PETROL	2020	Valid	2025-09-28 08:32:45.744271
7a9747ca-4927-4d7e-b8b5-c0f3c0373a38	YD68KHK	BMW	WHITE	PETROL	2018	Valid	2025-09-28 08:32:54.301731
bad4e18c-a406-40d7-9ffe-338b8e0436a7	SH67LSO	NISSAN	BLACK	PETROL	2017	Valid	2025-09-28 08:32:55.122638
4fe09eab-c5d9-4019-8503-d7cd5e85b7c9	AK71JOA	FORD	BLACK	ELECTRICITY	2021	Valid	2025-09-28 08:32:56.257772
7fad302c-c63a-484c-9753-2a63daebb826	SK71UEL	KIA	WHITE	ELECTRICITY	2021	Valid	2025-09-28 08:32:57.243471
6c1e9e46-94d4-4352-b866-26f58eecb627	AB12CDE	VAUXHALL	WHITE	PETROL	2017	Valid	2025-09-28 19:17:33.963382
d7270d4e-c77e-40b6-a4a2-cf947b905b32	KV18RXH	CITROEN	BLUE	PETROL	2018	Valid	2025-09-22 20:10:49.834827
1035f44f-fa0a-425d-8745-998dace0f1a1	SC04GAS	CITROEN	RED	DIESEL	2012	Valid	2025-09-23 20:30:44.936451
f296775a-0d12-4f51-a801-92deb79b20dd	P7DGO	HYUNDAI	WHITE	PETROL	2023	No details held by DVLA	2025-09-28 07:09:37.25843
\.


--
-- Data for Name: wage_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wage_payments (id, driver_id, week_start_date, week_end_date, total_earnings, is_paid, paid_at, paid_by, notes, created_at, updated_at) FROM stdin;
\.


--
-- Name: artifacts artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_pkey PRIMARY KEY (id);


--
-- Name: checklist_items checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_pkey PRIMARY KEY (id);


--
-- Name: collection_drafts collection_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_drafts
    ADD CONSTRAINT collection_drafts_pkey PRIMARY KEY (job_id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: damage_reports damage_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_pkey PRIMARY KEY (id);


--
-- Name: delivery_drafts delivery_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_drafts
    ADD CONSTRAINT delivery_drafts_pkey PRIMARY KEY (job_id);


--
-- Name: driver_availability driver_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_availability
    ADD CONSTRAINT driver_availability_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_email_unique UNIQUE (email);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_username_unique UNIQUE (username);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: environmental_conditions environmental_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environmental_conditions
    ADD CONSTRAINT environmental_conditions_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: invoice_bundles invoice_bundles_bundle_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_bundles
    ADD CONSTRAINT invoice_bundles_bundle_number_unique UNIQUE (bundle_number);


--
-- Name: invoice_bundles invoice_bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_bundles
    ADD CONSTRAINT invoice_bundles_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_process_records job_process_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_process_records
    ADD CONSTRAINT job_process_records_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_job_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_job_number_unique UNIQUE (job_number);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: miscellaneous_photos miscellaneous_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.miscellaneous_photos
    ADD CONSTRAINT miscellaneous_photos_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_unique UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: user_credentials user_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_pkey PRIMARY KEY (id);


--
-- Name: user_credentials user_credentials_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_username_unique UNIQUE (username);


--
-- Name: vehicle_inspections vehicle_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_inspections
    ADD CONSTRAINT vehicle_inspections_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_registration_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_registration_unique UNIQUE (registration);


--
-- Name: wage_payments wage_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_payments
    ADD CONSTRAINT wage_payments_pkey PRIMARY KEY (id);


--
-- Name: artifacts artifacts_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: bundle_invoices bundle_invoices_bundle_id_invoice_bundles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundle_invoices
    ADD CONSTRAINT bundle_invoices_bundle_id_invoice_bundles_id_fk FOREIGN KEY (bundle_id) REFERENCES public.invoice_bundles(id);


--
-- Name: bundle_invoices bundle_invoices_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundle_invoices
    ADD CONSTRAINT bundle_invoices_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: checklist_items checklist_items_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: collection_drafts collection_drafts_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_drafts
    ADD CONSTRAINT collection_drafts_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: customer_addresses customer_addresses_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: damage_reports damage_reports_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: delivery_drafts delivery_drafts_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_drafts
    ADD CONSTRAINT delivery_drafts_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: driver_availability driver_availability_driver_id_drivers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_availability
    ADD CONSTRAINT driver_availability_driver_id_drivers_id_fk FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: environmental_conditions environmental_conditions_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environmental_conditions
    ADD CONSTRAINT environmental_conditions_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: expenses expenses_driver_id_drivers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_driver_id_drivers_id_fk FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: expenses expenses_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: expenses expenses_receipt_artifact_id_artifacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_receipt_artifact_id_artifacts_id_fk FOREIGN KEY (receipt_artifact_id) REFERENCES public.artifacts(id);


--
-- Name: invoice_bundles invoice_bundles_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_bundles
    ADD CONSTRAINT invoice_bundles_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: invoices invoices_bundle_id_invoice_bundles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_bundle_id_invoice_bundles_id_fk FOREIGN KEY (bundle_id) REFERENCES public.invoice_bundles(id);


--
-- Name: invoices invoices_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: invoices invoices_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: job_process_records job_process_records_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_process_records
    ADD CONSTRAINT job_process_records_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: jobs jobs_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: jobs jobs_driver_id_drivers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_driver_id_drivers_id_fk FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: jobs jobs_vehicle_id_vehicles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_vehicle_id_vehicles_id_fk FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: miscellaneous_photos miscellaneous_photos_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.miscellaneous_photos
    ADD CONSTRAINT miscellaneous_photos_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: photos photos_damage_report_id_damage_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_damage_report_id_damage_reports_id_fk FOREIGN KEY (damage_report_id) REFERENCES public.damage_reports(id);


--
-- Name: photos photos_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: user_credentials user_credentials_driver_id_drivers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_driver_id_drivers_id_fk FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: vehicle_inspections vehicle_inspections_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_inspections
    ADD CONSTRAINT vehicle_inspections_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: wage_payments wage_payments_driver_id_drivers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_payments
    ADD CONSTRAINT wage_payments_driver_id_drivers_id_fk FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--


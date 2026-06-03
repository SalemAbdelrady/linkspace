--
-- PostgreSQL database dump
--

\restrict UOf0e75Nz5bPKtdNO8jKLBch0hijihfS7tb7i63AMsCcXC20eSjSW9nleJ6SbQB

-- Dumped from database version 17.10 (6a49db4)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)

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

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    user_id integer,
    code character varying(30) NOT NULL,
    discount_pct integer DEFAULT 20 NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    max_uses integer DEFAULT 1,
    used_count integer DEFAULT 0
);


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number character varying(20) NOT NULL,
    session_id integer,
    user_id integer,
    client_name character varying(100) NOT NULL,
    client_phone character varying(20) NOT NULL,
    session_cost numeric(10,2) DEFAULT 0 NOT NULL,
    duration_min integer,
    price_per_hr numeric(10,2),
    services jsonb DEFAULT '[]'::jsonb NOT NULL,
    services_cost numeric(10,2) DEFAULT 0 NOT NULL,
    coupon_code character varying(30),
    discount_pct integer DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    payment_method character varying(20) DEFAULT 'cash'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    wallet_paid numeric(10,2) DEFAULT 0 NOT NULL,
    cash_paid numeric(10,2) DEFAULT 0 NOT NULL,
    space_key character varying(30) DEFAULT 'cowork'::character varying NOT NULL,
    space_name character varying(100) DEFAULT 'منطقة العمل المشتركة'::character varying NOT NULL,
    invoice_type character varying(20) DEFAULT 'session'::character varying NOT NULL,
    subscription_id integer,
    created_by integer
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: playing_with_neon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playing_with_neon (
    id integer NOT NULL,
    name text NOT NULL,
    value real
);


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.playing_with_neon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playing_with_neon_id_seq OWNED BY public.playing_with_neon.id;


--
-- Name: price_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_settings (
    id integer NOT NULL,
    period_name character varying(30) NOT NULL,
    start_hour integer NOT NULL,
    end_hour integer NOT NULL,
    price_per_hr numeric(10,2) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_settings_id_seq OWNED BY public.price_settings.id;


--
-- Name: referral_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_logs (
    id integer NOT NULL,
    referrer_id integer,
    referred_id integer,
    points_given integer DEFAULT 0,
    reason character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: referral_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referral_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referral_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referral_logs_id_seq OWNED BY public.referral_logs.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer DEFAULT 0,
    hidden_from_client boolean DEFAULT false
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: session_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_orders (
    id integer NOT NULL,
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    service_id integer,
    service_name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    added_by character varying(20) DEFAULT 'staff'::character varying NOT NULL,
    added_by_name character varying(100),
    can_remove boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_orders_id_seq OWNED BY public.session_orders.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    check_in timestamp with time zone DEFAULT now() NOT NULL,
    check_out timestamp with time zone,
    duration_min integer,
    price_per_hr numeric(10,2) NOT NULL,
    cost numeric(10,2),
    payment_method character varying(20) DEFAULT 'wallet'::character varying,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    space_key character varying(30) DEFAULT 'cowork'::character varying NOT NULL,
    space_name character varying(100) DEFAULT 'منطقة العمل المشتركة'::character varying NOT NULL,
    max_hours integer DEFAULT 4 NOT NULL,
    subscription_id integer,
    is_subscription_session boolean DEFAULT false NOT NULL,
    created_by integer,
    guest_count integer DEFAULT 1 NOT NULL
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: space_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.space_settings (
    id integer NOT NULL,
    space_key character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    first_hour numeric(10,2) DEFAULT 0 NOT NULL,
    extra_hour numeric(10,2) DEFAULT 0 NOT NULL,
    max_hours integer DEFAULT 4 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: space_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.space_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: space_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.space_settings_id_seq OWNED BY public.space_settings.id;


--
-- Name: staff_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    can_view_all boolean DEFAULT false NOT NULL,
    can_edit_prices boolean DEFAULT false NOT NULL,
    can_charge_wallet boolean DEFAULT true NOT NULL,
    can_add_points boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: staff_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staff_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staff_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staff_permissions_id_seq OWNED BY public.staff_permissions.id;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    features text,
    discount_rooms integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    covers_cowork boolean DEFAULT true NOT NULL
);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_plans_id_seq OWNED BY public.subscription_plans.id;


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_id integer NOT NULL,
    plan_name character varying(100) NOT NULL,
    plan_price numeric(10,2) NOT NULL,
    discount_rooms integer DEFAULT 0 NOT NULL,
    covers_cowork boolean DEFAULT true NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    payment_method character varying(20) DEFAULT 'cash'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    cancel_reason text,
    cancelled_at timestamp with time zone
);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_subscriptions_id_seq OWNED BY public.user_subscriptions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'client'::character varying NOT NULL,
    balance numeric(10,2) DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    qr_code character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    qr_image text,
    email character varying(150),
    email_verified boolean DEFAULT false NOT NULL,
    reset_otp character varying(6),
    reset_otp_expires timestamp with time zone,
    can_charge_wallet boolean DEFAULT false,
    can_add_points boolean DEFAULT false,
    can_edit_prices boolean DEFAULT false,
    can_create_coupons boolean DEFAULT false,
    can_view_reports boolean DEFAULT false,
    avatar_url text,
    referral_code character varying(20),
    referred_by integer,
    referral_count integer DEFAULT 0,
    referral_earned_points integer DEFAULT 0
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: playing_with_neon id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playing_with_neon ALTER COLUMN id SET DEFAULT nextval('public.playing_with_neon_id_seq'::regclass);


--
-- Name: price_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_settings ALTER COLUMN id SET DEFAULT nextval('public.price_settings_id_seq'::regclass);


--
-- Name: referral_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_logs ALTER COLUMN id SET DEFAULT nextval('public.referral_logs_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: session_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_orders ALTER COLUMN id SET DEFAULT nextval('public.session_orders_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: space_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_settings ALTER COLUMN id SET DEFAULT nextval('public.space_settings_id_seq'::regclass);


--
-- Name: staff_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions ALTER COLUMN id SET DEFAULT nextval('public.staff_permissions_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


--
-- Name: user_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.user_subscriptions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wallet_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (id, user_id, code, discount_pct, is_used, expires_at, created_at, max_uses, used_count) FROM stdin;
5	\N	PROMO-QNS2HC	20	t	2026-05-10 11:41:13.711+00	2026-04-10 11:41:13.714235+00	1	0
4	\N	LINK20	20	t	2026-05-10 09:29:42.669+00	2026-04-10 09:29:42.670308+00	1	0
7	73	LINK20-A2J29W	20	t	2026-05-12 00:04:36.229+00	2026-04-12 00:04:36.233726+00	1	0
6	\N	LINK10	10	t	2026-05-10 22:46:25.952+00	2026-04-10 22:46:25.954184+00	1	0
8	631	LINK20-EDH9HD	20	t	2026-05-15 09:47:09.062+00	2026-04-15 09:47:09.066834+00	1	0
9	\N	LINK50	50	t	2026-05-15 10:32:04.027+00	2026-04-15 10:32:04.028553+00	1	0
11	65	LINK20-GWVY9U	20	f	2026-05-15 18:42:54.976+00	2026-04-15 18:42:54.98182+00	1	0
12	74	LINK20-JVPW6L	20	t	2026-05-24 09:56:09.697+00	2026-04-24 09:56:09.82076+00	1	0
10	161	LINK20-F4F7W3	20	t	2026-05-15 18:36:36.664+00	2026-04-15 18:36:36.667288+00	1	0
13	161	LINK20-YPJ8KZ	20	f	2026-06-09 15:46:53.332+00	2026-05-10 15:46:53.453316+00	1	0
15	73	LINK20-BYXT4B	20	f	2026-06-15 12:21:45.92+00	2026-05-16 12:21:46.038655+00	1	0
16	4515	LINK20-EF8J8E	20	t	2026-06-15 14:08:25.727+00	2026-05-16 14:08:25.847277+00	1	0
17	4515	LINK60-0606	60	t	2026-06-15 14:13:51.262+00	2026-05-16 14:13:51.300952+00	1	0
18	\N	عشان لؤي	20	t	2026-06-16 20:26:59.079+00	2026-05-17 20:26:59.119553+00	1	0
14	161	LINK20-V2TKGK	20	t	2026-06-15 12:03:15.278+00	2026-05-16 12:03:15.39798+00	1	0
19	\N	PROMO-6ZBGZY	20	t	2026-06-17 23:37:27.609+00	2026-05-18 23:37:27.648315+00	1	0
20	\N	عشان لؤي 20	20	t	2026-06-17 23:53:50.929+00	2026-05-18 23:53:50.96717+00	1	1
22	73	LINK20-ZP4S3R	20	f	2026-06-22 14:59:45.062+00	2026-05-23 14:59:45.181004+00	1	0
21	\N	لؤي 20	20	f	2026-06-18 00:04:26.766+00	2026-05-19 00:04:26.804085+00	100	4
23	\N	مصطفى15	15	f	2026-06-22 15:17:52.866+00	2026-05-23 15:17:52.904172+00	50	0
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, session_id, user_id, client_name, client_phone, session_cost, duration_min, price_per_hr, services, services_cost, coupon_code, discount_pct, discount_amount, subtotal, total, payment_method, note, created_at, wallet_paid, cash_paid, space_key, space_name, invoice_type, subscription_id, created_by) FROM stdin;
1	INV-955988	31	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 21:19:20.951721+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
2	INV-825759	28	75	احمد عبد الرحيم ربيع	01019839140	120.00	576	30.00	[]	0.00	LINK20	20	24.00	120.00	96.00	wallet	\N	2026-04-10 22:40:58.188692+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
3	INV-649706	33	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 23:29:39.240654+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
4	INV-805401	34	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 23:40:21.583648+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
5	INV-477916	35	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-10 23:41:52.081479+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
6	INV-579604	36	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-10 23:43:17.87553+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
7	INV-656022	42	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-11 23:21:02.116635+00	20.00	10.00	cowork	منطقة العمل المشتركة	session	\N	\N
8	INV-668037	43	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	LINK20-A2J29W	20	6.00	30.00	24.00	cash	\N	2026-04-12 00:28:36.157587+00	0.00	24.00	cowork	منطقة العمل المشتركة	session	\N	\N
9	INV-332301	44	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 18:25:40.120932+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	\N
10	INV-377818	45	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	30.00	\N	0	0.00	60.00	60.00	cash	\N	2026-04-12 18:44:31.585508+00	0.00	60.00	cowork	منطقة العمل المشتركة	session	\N	\N
11	INV-564721	46	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	25.00	\N	0	0.00	55.00	55.00	partial	\N	2026-04-12 18:46:17.487396+00	20.00	35.00	cowork	منطقة العمل المشتركة	session	\N	\N
12	INV-861371	47	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-04-12 19:08:38.474168+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	\N
13	INV-300521	48	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "عصير", "price": "15.00"}]	15.00	\N	0	0.00	45.00	45.00	partial	\N	2026-04-12 19:15:14.712254+00	0.00	45.00	cowork	منطقة العمل المشتركة	session	\N	\N
14	INV-548751	49	75	احمد عبد الرحيم ربيع	01019839140	30.00	53	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 20:09:29.302803+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	\N
15	INV-598838	50	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	12.00	\N	0	0.00	42.00	42.00	partial	\N	2026-04-12 20:10:40.727295+00	0.00	42.00	cowork	منطقة العمل المشتركة	session	\N	\N
16	INV-322318	51	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 3, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	10.00	\N	0	0.00	40.00	40.00	partial	\N	2026-04-12 20:22:48.123108+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	\N
17	INV-933880	52	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	partial	\N	2026-04-12 20:32:25.871545+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	\N
18	INV-424343	53	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	34.00	\N	0	0.00	64.00	64.00	partial	\N	2026-04-12 20:57:22.609694+00	5.00	59.00	cowork	منطقة العمل المشتركة	session	\N	\N
19	INV-581138	54	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 21:00:49.023983+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	\N
20	INV-455050	55	74	محمد عبد الراضي	01096267021	30.00	1	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	10.00	\N	0	0.00	40.00	40.00	wallet	\N	2026-04-12 21:15:07.618786+00	10.00	30.00	cowork	منطقة العمل المشتركة	session	\N	\N
21	INV-538308	56	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-12 21:32:27.147514+00	10.00	20.00	cowork	منطقة العمل المشتركة	session	\N	\N
22	INV-805429	57	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	35.00	\N	0	0.00	65.00	65.00	wallet	\N	2026-04-13 07:37:22.154201+00	65.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
23	INV-756585	58	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	25.00	\N	0	0.00	55.00	55.00	wallet	\N	2026-04-13 12:52:56.085048+00	55.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
24	INV-187271	60	74	محمد عبد الراضي	01096267021	120.00	288	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}]	30.00	\N	0	0.00	150.00	150.00	cash	\N	2026-04-13 17:43:33.557715+00	0.00	150.00	cowork	منطقة العمل المشتركة	session	\N	\N
25	INV-542239	61	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-04-13 17:49:49.186706+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	\N
26	INV-776787	63	76	Salah mohamed	01000984633	150.00	1	150.00	[]	0.00	\N	0	0.00	150.00	150.00	cash	\N	2026-04-13 22:53:34.542397+00	0.00	150.00	cowork	منطقة العمل المشتركة	session	\N	\N
27	INV-838656	62	161	سالم عبدالواحد	01029947834	30.00	2	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-13 22:54:10.583511+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	\N
28	INV-874484	64	161	سالم عبدالواحد	01029947834	200.00	1	200.00	[]	0.00	\N	0	0.00	200.00	200.00	cash	\N	2026-04-13 23:03:49.400936+00	0.00	200.00	cowork	منطقة العمل المشتركة	session	\N	\N
29	INV-524407	59	75	احمد عبد الرحيم ربيع	01019839140	120.00	661	30.00	[]	0.00	\N	0	0.00	120.00	120.00	partial	\N	2026-04-13 23:55:35.48046+00	15.00	105.00	cowork	منطقة العمل المشتركة	session	\N	\N
30	INV-484944	65	73	سالم علي	01029947833	1500.00	583	150.00	[]	0.00	\N	0	0.00	1500.00	1500.00	cash	\N	2026-04-14 09:41:38.623469+00	0.00	1500.00	cowork	منطقة العمل المشتركة	session	\N	\N
31	INV-561134	66	76	Salah mohamed	01000984633	2400.00	883	200.00	[]	0.00	\N	0	0.00	2400.00	2400.00	cash	\N	2026-04-14 14:39:30.006198+00	0.00	2400.00	cowork	منطقة العمل المشتركة	session	\N	\N
32	INV-600646	68	161	سالم عبدالواحد	01029947834	120.00	228	30.00	[]	0.00	\N	0	0.00	120.00	120.00	cash	\N	2026-04-14 14:40:06.048391+00	0.00	120.00	cowork	منطقة العمل المشتركة	session	\N	\N
33	INV-645449	67	65	سالم راضي	01029947832	2400.00	884	200.00	[]	0.00	\N	0	0.00	2400.00	2400.00	cash	\N	2026-04-14 14:40:52.606161+00	0.00	2400.00	cowork	منطقة العمل المشتركة	session	\N	\N
34	INV-978067	69	75	احمد عبد الرحيم ربيع	01019839140	1200.00	441	150.00	[]	0.00	\N	0	0.00	1200.00	1200.00	cash	\N	2026-04-14 21:59:47.828236+00	0.00	1200.00	cowork	منطقة العمل المشتركة	session	\N	\N
35	INV-090600	70	161	سالم عبدالواحد	01029947834	1600.00	440	200.00	[]	0.00	\N	0	0.00	1600.00	1600.00	cash	\N	2026-04-14 22:01:33.190935+00	0.00	1600.00	cowork	منطقة العمل المشتركة	session	\N	\N
36	INV-509677	73	631	A. Sh	01045326581	30.00	2	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-04-15 09:40:30.698155+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	\N
37	INV-144070	74	631	A. Sh	01045326581	30.00	1	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	5.00	LINK10	10	3.50	35.00	31.50	cash	\N	2026-04-15 09:43:43.335528+00	0.00	31.50	cowork	منطقة العمل المشتركة	session	\N	\N
38	INV-629739	75	631	A. Sh	01045326581	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 3, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	88.00	LINK20-EDH9HD	20	23.60	118.00	94.40	cash	\N	2026-04-15 09:52:24.543779+00	0.00	94.40	cowork	منطقة العمل المشتركة	session	\N	\N
39	INV-438375	72	73	سالم علي	01029947833	800.00	708	200.00	[]	0.00	\N	0	0.00	800.00	800.00	cash	\N	2026-04-15 10:04:25.382052+00	0.00	800.00	cowork	منطقة العمل المشتركة	session	\N	\N
40	INV-490654	71	74	محمد عبد الراضي	01096267021	600.00	711	150.00	[]	0.00	\N	0	0.00	600.00	600.00	cash	\N	2026-04-15 10:05:09.81444+00	0.00	600.00	cowork	منطقة العمل المشتركة	session	\N	\N
41	INV-764896	76	631	A. Sh	01045326581	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-15 10:09:44.811077+00	20.00	10.00	cowork	منطقة العمل المشتركة	session	\N	\N
42	INV-984981	77	631	A. Sh	01045326581	25.00	1	25.00	[]	0.00	LINK50	50	12.50	25.00	12.50	cash	\N	2026-04-15 10:34:05.450862+00	0.00	12.50	cowork	منطقة العمل المشتركة	session	\N	\N
43	INV-052481	80	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-15 18:01:09.533373+00	30.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
44	INV-238223	78	631	A. Sh	01045326581	150.00	5	150.00	[]	0.00	\N	0	0.00	150.00	150.00	partial	\N	2026-04-15 18:04:08.052042+00	20.00	130.00	meeting	غرفة الاجتماعات	session	\N	\N
45	INV-418642	82	65	سالم راضي	01029947832	200.00	1	200.00	[]	0.00	\N	0	0.00	200.00	200.00	cash	\N	2026-04-15 18:23:45.104257+00	0.00	200.00	lessons	غرفة الدروس	session	\N	\N
46	INV-380504	83	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}]	84.00	\N	0	0.00	114.00	114.00	partial	\N	2026-04-15 18:40:00.674801+00	5.00	109.00	cowork	منطقة العمل المشتركة	session	\N	\N
47	INV-663752	84	631	A. Sh	01045326581	200.00	1	200.00	[{"qty": 5, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	45.00	\N	0	0.00	245.00	245.00	partial	\N	2026-04-15 18:44:47.401095+00	100.00	145.00	lessons	غرفة الدروس	session	\N	\N
48	INV-529131	81	75	احمد عبد الرحيم ربيع	01019839140	600.00	238	150.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}]	45.00	\N	0	0.00	645.00	645.00	partial	\N	2026-04-15 22:02:43.960532+00	20.00	625.00	meeting	غرفة الاجتماعات	session	\N	\N
49	INV-472609	85	631	A. Sh	01045326581	600.00	11767	150.00	[]	0.00	\N	0	0.00	600.00	600.00	cash	\N	2026-04-24 02:24:38.813351+00	0.00	600.00	meeting	غرفة الاجتماعات	session	\N	\N
50	INV-492362	79	74	محمد عبد الراضي	01096267021	800.00	12026	200.00	[]	0.00	\N	0	0.00	800.00	800.00	cash	\N	2026-04-24 02:24:54.002196+00	0.00	800.00	lessons	غرفة الدروس	session	\N	\N
51	INV-736966	86	74	محمد عبد الراضي	01096267021	150.00	1	150.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 5, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}]	90.00	LINK20-JVPW6L	20	48.00	240.00	192.00	partial	\N	2026-04-24 10:02:26.509391+00	0.00	192.00	meeting	غرفة الاجتماعات	session	\N	\N
52	INV-322979	87	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-25 13:05:52.869368+00	30.00	0.00	cowork	منطقة العمل المشتركة	session	\N	\N
53	INV-523774	88	73	سالم علي	01029947833	200.00	1	200.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 2, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}]	40.00	\N	0	0.00	240.00	240.00	partial	\N	2026-04-25 13:09:04.971667+00	20.00	220.00	lessons	غرفة الدروس	session	\N	\N
54	INV-745005	89	73	سالم علي	01029947833	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	نسيت اضيف المشروب الغازي على الفاتروة السابقة 	2026-04-25 13:30:31.277606+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	\N
55	SUB-016729	\N	73	سالم علي	01029947833	1200.00	\N	\N	[]	0.00	\N	0	0.00	1200.00	1200.00	cash	اشتراك باقة أساسية — ٢٥‏/٤‏/٢٠٢٦	2026-04-25 14:06:56.366856+00	0.00	1200.00	cowork	اشتراك شهري	subscription	1	\N
56	INV-347266	90	161	سالم عبدالواحد	01029947834	90.00	136	30.00	[]	0.00	\N	0	0.00	90.00	90.00	cash	\N	2026-04-25 22:32:56.868966+00	0.00	90.00	cowork	منطقة العمل المشتركة	session	\N	\N
57	INV-886255	91	161	سالم عبدالواحد	01029947834	30.00	15	30.00	[{"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "عصير", "price": 15}]	35.00	\N	0	0.00	65.00	65.00	cash	\N	2026-04-26 18:25:13.796006+00	0.00	65.00	cowork	منطقة العمل المشتركة	session	\N	\N
58	INV-044022	92	161	سالم عبدالواحد	01029947834	600.00	252	150.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "مياه صغيرة ", "price": 5}, {"qty": 1, "name": "مشروب غازي ", "price": 20}, {"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "شاي", "price": 10}]	65.00	\N	0	0.00	665.00	665.00	cash	\N	2026-04-26 22:37:39.834405+00	0.00	665.00	meeting	غرفة الاجتماعات	session	\N	\N
59	INV-142684	93	161	سالم عبدالواحد	01029947834	200.00	1	200.00	[{"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "عصير", "price": 15}, {"qty": 2, "name": "مياه صغيرة ", "price": 5}]	55.00	\N	0	0.00	255.00	255.00	cash	\N	2026-04-26 22:39:15.118596+00	0.00	255.00	lessons	غرفة الدروس	session	\N	\N
60	INV-327042	94	73	سالم علي	01029947833	0.00	1	0.00	[{"qty": 1, "name": "عصير", "price": 15}, {"qty": 3, "name": "طباعة (ورقة)", "price": 1}, {"qty": 1, "name": "طباعة ورق ألوان ", "price": 2}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-04-27 15:05:37.482156+00	0.00	20.00	cowork	منطقة العمل المشتركة	session	\N	\N
61	INV-711487	95	161	سالم عبدالواحد	01029947834	30.00	18	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": 2}, {"qty": 1, "name": "مياه صغيرة ", "price": 5}, {"qty": 1, "name": "عصير", "price": 15}, {"qty": 1, "name": "قهوة", "price": 20}]	42.00	\N	0	0.00	72.00	72.00	cash	\N	2026-04-27 19:05:33.5316+00	0.00	72.00	cowork	منطقة العمل المشتركة	session	\N	\N
62	INV-966578	96	161	سالم عبدالواحد	01029947834	600.00	204	150.00	[{"qty": 1, "name": "مياه صغيرة ", "price": 5}, {"qty": 1, "name": "عصير", "price": 15}]	20.00	\N	0	0.00	620.00	620.00	cash	\N	2026-04-27 22:29:36.35177+00	0.00	620.00	meeting	غرفة الاجتماعات	session	\N	\N
63	INV-998376	97	75	احمد عبد الرحيم ربيع	01019839140	120.00	201	30.00	[{"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "عصير", "price": 15}, {"qty": 1, "name": "شاي", "price": 10}]	55.00	\N	0	0.00	175.00	175.00	cash	\N	2026-04-27 22:30:10.283681+00	0.00	175.00	cowork	منطقة العمل المشتركة	session	\N	\N
64	INV-329146	98	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-30 18:22:26.9755+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	\N
65	INV-217898	100	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-04-30 18:37:21.243269+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	\N
66	INV-889299	101	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": 2}]	2.00	\N	0	0.00	32.00	32.00	cash	\N	2026-05-01 16:11:39.420307+00	0.00	32.00	cowork	منطقة العمل المشتركة	session	\N	\N
67	INV-998581	102	161	سالم عبدالواحد	01029947834	200.00	1	200.00	[{"qty": 1, "name": "بيج شبسي ", "price": 10}]	10.00	\N	0	0.00	210.00	210.00	cash	\N	2026-05-02 22:13:38.624131+00	0.00	210.00	lessons	غرفة الدروس	session	\N	1
68	INV-186691	103	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "مياه صغيرة ", "price": 5}]	15.00	\N	0	0.00	45.00	45.00	cash	\N	2026-05-02 22:16:36.979871+00	0.00	45.00	cowork	منطقة العمل المشتركة	session	\N	2
69	INV-076725	104	73	سالم علي	01029947833	0.00	1	0.00	[{"qty": 1, "name": "مياه صغيرة ", "price": 5}]	5.00	\N	0	0.00	5.00	5.00	cash	\N	2026-05-03 06:01:23.576667+00	0.00	5.00	cowork	منطقة العمل المشتركة	session	\N	1
70	INV-792565	105	73	سالم علي	01029947833	0.00	1	0.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "بيج شبسي ", "price": 10}, {"qty": 1, "name": "طباعة (ورقة)", "price": 1}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": 2}, {"qty": 1, "name": "قهوة", "price": 20}]	45.00	\N	0	0.00	45.00	45.00	cash	\N	2026-05-03 06:13:16.876305+00	0.00	45.00	cowork	منطقة العمل المشتركة	session	\N	2291
71	INV-725052	106	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-05-03 13:08:47.631762+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	2
72	INV-474746	107	631	A. Sh	01045326581	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "شاي", "price": 10}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-05-06 11:04:37.062892+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	2291
73	INV-543606	108	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-05-06 11:05:45.552099+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	1
74	INV-949823	109	2887	Abd Sh	01000000001	30.00	3	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": 5}, {"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "عصير", "price": 15}]	40.00	\N	0	0.00	70.00	70.00	cash	\N	2026-05-07 00:15:59.400958+00	0.00	70.00	cowork	منطقة العمل المشتركة	session	\N	1
75	INV-187984	111	76	Salah mohamed	01000984633	30.00	3	30.00	[{"qty": 1, "name": "طربيزة هندسة ", "price": 5}, {"qty": 1, "name": "طباعة (ورقة)", "price": 1}, {"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	46.00	\N	0	0.00	76.00	76.00	cash	\N	2026-05-09 16:14:58.138709+00	0.00	76.00	cowork	منطقة العمل المشتركة	session	\N	1
76	INV-441501	110	161	سالم عبدالواحد	01029947834	30.00	11	30.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	LINK20-F4F7W3	20	10.00	50.00	40.00	cash	\N	2026-05-09 16:18:59.308318+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	1
77	INV-672683	112	76	Salah mohamed	01000984633	150.00	1	150.00	[{"qty": 1, "name": "مياه صغيرة ", "price": 5}, {"qty": 1, "name": "طباعة (ورقة)", "price": 1}, {"qty": 1, "name": "طربيزة هندسة ", "price": "5.00"}]	11.00	\N	0	0.00	161.00	161.00	partial	\N	2026-05-09 16:23:18.153129+00	24.00	137.00	meeting	غرفة الاجتماعات	session	\N	1
78	INV-245626	113	73	سالم علي	01029947833	0.00	1	0.00	[{"qty": 1, "name": "طربيزة هندسة ", "price": "5.00"}, {"qty": 1, "name": "بيج شبسي ", "price": "10.00"}]	15.00	\N	0	0.00	15.00	15.00	cash	\N	2026-05-09 16:30:58.215623+00	0.00	15.00	cowork	منطقة العمل المشتركة	session	\N	1
79	INV-007937	114	50	سالم عبدالراضي	01029947831	30.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-05-10 01:36:55.040603+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	1
80	INV-274650	115	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-05-10 13:38:09.743564+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	1
81	INV-606975	118	161	سالم عبدالواحد	01029947834	120.00	191	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "شاي", "price": 10}]	20.00	\N	0	0.00	140.00	140.00	cash	\N	2026-05-10 18:43:44.719128+00	0.00	140.00	cowork	منطقة العمل المشتركة	session	\N	1
82	INV-658209	116	74	محمد عبد الراضي	01096267021	120.00	243	30.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	140.00	140.00	cash	\N	2026-05-10 18:44:25.266063+00	0.00	140.00	cowork	منطقة العمل المشتركة	session	\N	1
83	INV-686799	117	2887	Abd Sh	01000000001	200.00	243	200.00	[{"qty": 3, "name": "ساعة إضافية ", "price": "100.00"}]	300.00	\N	0	0.00	500.00	500.00	cash	\N	2026-05-10 18:45:34.862214+00	0.00	500.00	lessons	غرفة الدروس	session	\N	1
84	QS-1778525638138-763	\N	161	سالم عبدالواحد	01029947834	0.00	\N	\N	[{"qty": 1, "name": "شاي", "price": 10}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-11 18:53:58.177777+00	0.00	10.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
92	QS-1778526750034-176	\N	\N	عميل		0.00	0	0.00	[{"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "بيج شبسي ", "price": 10}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-11 19:12:30.072658+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
93	QS-1778527417987-242	\N	\N	-		0.00	0	0.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-11 19:23:38.027284+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
94	QS-1778528905509-549	\N	\N	عميل		0.00	0	0.00	[{"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "عصير", "price": 15}, {"qty": 1, "name": "بيج شبسي ", "price": 10}]	35.00	\N	0	0.00	35.00	35.00	cash	\N	2026-05-11 19:48:25.549065+00	0.00	35.00	quick_sale	⚡ بيع سريع	quick_sale	\N	2291
95	INV-628050	119	2887	Abd Sh	01000000001	30.00	1	30.00	[{"qty": 1, "name": "بيج شبسي ", "price": 10}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-05-11 20:17:16.617555+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	2291
96	QS-1778544221559-201	\N	\N	عميل		0.00	0	0.00	[{"qty": 1, "name": "مياه صغيرة ", "price": 5}]	5.00	\N	0	0.00	5.00	5.00	cash	\N	2026-05-12 00:03:41.599302+00	0.00	5.00	quick_sale	⚡ بيع سريع	quick_sale	\N	2291
97	INV-716242	120	4515	محمود فتحي	01029947836	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-05-12 17:26:01.454906+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	1
98	INV-178389	121	4213	Yousef	01111750379	30.00	2	30.00	[{"qty": 1, "name": "شاي", "price": 10}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-05-13 09:59:36.86482+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	1
99	INV-481913	122	4515	محمود فتحي	01029947836	30.00	8	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-05-13 13:58:17.493655+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	1
100	INV-358423	126	4515	محمود فتحي	01029947836	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-05-13 21:06:38.677332+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	1
101	QS-1778706675691-708	\N	\N	عميل		0.00	0	0.00	[{"qty": 1, "name": "مشروب غازي ", "price": 20}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-13 21:11:15.730437+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
102	INV-131962	127	4515	محمود فتحي	01029947836	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-05-13 22:59:01.101031+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	1
103	QS-1778791256914-255	\N	4515	محمود فتحي	01029947836	0.00	0	0.00	[{"qty": 2, "name": "مياه صغيرة ", "price": 5}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-14 20:40:56.953198+00	0.00	10.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
104	QS-1778791276024-887	\N	\N	.		0.00	0	0.00	[{"qty": 1, "name": "مشروب غازي ", "price": 20}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-14 20:41:16.06313+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
105	INV-054031	128	4213	Yousef	01111750379	120.00	1436	30.00	[{"qty": 1, "name": "عصير", "price": 15}, {"qty": 1, "name": "بيج شبسي ", "price": 10}]	25.00	\N	0	0.00	145.00	145.00	cash	\N	2026-05-14 23:40:58.972623+00	0.00	145.00	cowork	منطقة العمل المشتركة	session	\N	1
106	INV-996124	129	4515	محمود فتحي	01029947836	90.00	1	30.00	[{"qty": 1, "name": "طربيزة هندسة ", "price": "5.00"}]	5.00	\N	0	0.00	95.00	95.00	cash	\N	2026-05-15 08:50:21.479641+00	0.00	95.00	cowork	منطقة العمل المشتركة	session	\N	1
107	INV-629206	130	4515	محمود فتحي	01029947836	30.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-05-15 15:07:19.18654+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	1
108	INV-040804	131	75	احمد عبد الرحيم ربيع	01019839140	150.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "بتيه بالجبنة ", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	55.00	\N	0	0.00	205.00	205.00	cash	\N	2026-05-15 15:14:53.215144+00	0.00	205.00	cowork	منطقة العمل المشتركة	session	\N	1
109	INV-867108	133	4515	محمود فتحي	01029947836	30.00	1	30.00	[{"qty": 1, "name": "بيج شبسي ", "price": 10}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-05-15 22:41:25.252238+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N	1
110	INV-918602	134	161	سالم عبدالواحد	01029947834	60.00	1	30.00	[]	0.00	\N	0	0.00	60.00	60.00	cash	\N	2026-05-15 22:42:52.349551+00	0.00	60.00	cowork	منطقة العمل المشتركة	session	\N	1
111	INV-712734	135	161	سالم عبدالواحد	01029947834	90.00	179	30.00	[{"qty": 1, "name": "بتيه بالجبنة ", "price": "10.00"}]	10.00	\N	0	0.00	100.00	100.00	cash	\N	2026-05-16 01:42:05.666099+00	0.00	100.00	cowork	منطقة العمل المشتركة	session	\N	1
112	QS-1778895894864-886	\N	\N	عميل		0.00	0	0.00	[{"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 1, "name": "عصير", "price": 15}]	25.00	\N	0	0.00	25.00	25.00	cash	\N	2026-05-16 01:44:54.903449+00	0.00	25.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
113	QS-1778919638928-325	\N	161	سالم عبدالواحد	01029947834	0.00	0	0.00	[{"qty": 1, "name": "شاي", "price": 10}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-16 08:20:38.96699+00	0.00	10.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
114	INV-574321	136	4515	محمود فتحي	01029947836	210.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "ينسون ", "price": 10}, {"qty": 1, "name": "عصير", "price": 15}, {"qty": 1, "name": "مشروب غازي ", "price": 20}, {"qty": 1, "name": "بتيه بالجبنة ", "price": 10}]	75.00	\N	0	0.00	285.00	285.00	cash	\N	2026-05-16 11:25:50.771135+00	0.00	285.00	cowork	منطقة العمل المشتركة	session	\N	1
115	INV-806043	137	4213	Yousef	01111750379	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-05-16 11:26:51.550055+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N	1
116	INV-318843	138	2887	Abd Sh	01000000001	90.00	1	30.00	[]	0.00	\N	0	0.00	90.00	90.00	cash	\N	2026-05-16 11:36:31.519651+00	0.00	90.00	cowork	منطقة العمل المشتركة	session	\N	1
117	INV-229496	139	161	سالم عبدالواحد	01029947834	60.00	1	30.00	[{"qty": 2, "name": "طربيزة هندسة ", "price": "5.00"}]	10.00	\N	0	0.00	70.00	70.00	cash	\N	2026-05-16 11:50:48.275332+00	0.00	70.00	cowork	منطقة العمل المشتركة	session	\N	1
118	INV-766879	140	75	احمد عبد الرحيم ربيع	01019839140	150.00	2	30.00	[{"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "بيج شبسي ", "price": "10.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "مياه", "price": "5.00"}]	30.00	\N	0	0.00	180.00	180.00	cash	\N	2026-05-16 12:00:07.108806+00	0.00	180.00	cowork	منطقة العمل المشتركة	session	\N	1
119	INV-285621	141	161	سالم عبدالواحد	01029947834	30.00	6	30.00	[{"qty": 2, "name": "قهوة", "price": 20}]	40.00	\N	0	0.00	70.00	70.00	cash	\N	2026-05-16 12:08:55.537479+00	0.00	70.00	cowork	منطقة العمل المشتركة	session	\N	1
120	INV-240789	143	73	سالم علي	01029947833	0.00	2	0.00	[{"qty": 1, "name": "مياه", "price": 5}, {"qty": 1, "name": "ينسون ", "price": 10}]	15.00	\N	0	0.00	15.00	15.00	cash	\N	2026-05-16 12:25:04.616416+00	0.00	15.00	cowork	منطقة العمل المشتركة	session	\N	1
122	INV-814044	142	4515	محمود فتحي	01029947836	60.00	102	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": 5}]	5.00	\N	0	0.00	65.00	65.00	cash	\N	2026-05-16 13:57:06.899839+00	0.00	65.00	cowork	منطقة العمل المشتركة	session	\N	2291
123	INV-862302	144	4515	محمود فتحي	01029947836	180.00	3	30.00	[{"qty": 1, "name": "بيج شبسي ", "price": 10}, {"qty": 1, "name": "مشروب غازي ", "price": 20}, {"qty": 1, "name": "بتيه بالجبنة ", "price": 10}, {"qty": 1, "name": "مياه كبيرة ", "price": 10}, {"qty": 4, "name": "طباعة ورق ألوان ", "price": 2}, {"qty": 2, "name": "طباعة (ورقة)", "price": 1}, {"qty": 1, "name": "ينسون ", "price": 10}, {"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 1, "name": "مياه", "price": "5.00"}, {"qty": 1, "name": "قهوة ", "price": "10.00"}, {"qty": 1, "name": "طربيزة هندسة ", "price": "5.00"}]	141.00	LINK60-0606	60	192.60	321.00	128.40	cash	\N	2026-05-16 14:15:23.960314+00	0.00	128.40	cowork	منطقة العمل المشتركة	session	\N	1
124	QS-1778941488068-967	\N	\N	طالب		0.00	0	0.00	[{"qty": 1, "name": "عصير", "price": 15}]	15.00	\N	0	0.00	15.00	15.00	cash	\N	2026-05-16 14:24:48.107749+00	0.00	15.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
125	QS-1778945649250-588	\N	\N	طالب		0.00	0	0.00	[{"qty": 1, "name": "بيج شبسي ", "price": 10}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-16 15:34:09.289466+00	0.00	10.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
126	INV-256568	145	4213	Yousef	01111750379	60.00	1	30.00	[{"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "بيج شبسي ", "price": "10.00"}, {"qty": 1, "name": "بتيه بالجبنة ", "price": "10.00"}]	35.00	\N	0	0.00	95.00	95.00	cash	\N	2026-05-16 23:47:46.453463+00	0.00	95.00	cowork	منطقة العمل المشتركة	session	\N	1
149	INV-498432	168	161	سالم عبدالواحد	01029947834	25.00	2	25.00	[{"qty": 1, "name": "عصير معلب", "price": 17}]	17.00	\N	0	0.00	42.00	42.00	cash	\N	2026-05-23 23:21:54.640889+00	0.00	42.00	cowork	منطقة العمل المشتركة	session	\N	1
127	INV-833810	146	2887	Abd Sh	01000000001	30.00	1	30.00	[{"qty": 1, "name": "ينسون ", "price": "10.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	40.00	\N	0	0.00	70.00	70.00	cash	\N	2026-05-17 00:14:00.467192+00	0.00	70.00	cowork	منطقة العمل المشتركة	session	\N	1
128	QS-1778976860083-832	\N	\N	عميل		0.00	0	0.00	[{"qty": 1, "name": "بيج شبسي ", "price": 10}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-17 00:14:20.122517+00	0.00	10.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
129	INV-403320	147	9011	قمر قمر	01029947838	120.00	6	30.00	[]	0.00	\N	0	0.00	120.00	120.00	cash	\N	2026-05-17 20:23:48.672181+00	0.00	120.00	cowork	منطقة العمل المشتركة	session	\N	1
130	INV-445411	148	9011	قمر قمر	01029947838	25.00	1	25.00	[{"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	20.00	\N	0	0.00	45.00	45.00	cash	\N	2026-05-17 20:24:13.590055+00	0.00	45.00	cowork	منطقة العمل المشتركة	session	\N	1
131	QS-1779049505703-751	\N	9011	قمر قمر	01029947838	0.00	0	0.00	[{"qty": 1, "name": "ينسون ", "price": 10}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-17 20:25:05.740954+00	0.00	10.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
132	INV-691794	149	8996	مصطفى قمر	01029947837	25.00	1	25.00	[{"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 1, "name": "ينسون ", "price": "10.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "بتيه بالجبنة ", "price": "10.00"}]	47.00	\N	0	0.00	72.00	72.00	cash	\N	2026-05-17 20:28:27.392192+00	0.00	72.00	cowork	منطقة العمل المشتركة	session	\N	1
133	INV-723333	150	8996	مصطفى قمر	01029947837	25.00	1	25.00	[{"qty": 1, "name": "مياه", "price": "5.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "قهوة ", "price": "10.00"}, {"qty": 1, "name": "طربيزة هندسة ", "price": "5.00"}, {"qty": 1, "name": "بتيه بالجبنة ", "price": "10.00"}, {"qty": 1, "name": "بيج شبسي ", "price": "10.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}]	90.00	عشان لؤي	20	23.00	115.00	92.00	cash	\N	2026-05-17 20:30:17.082646+00	0.00	92.00	cowork	منطقة العمل المشتركة	session	\N	1
134	QS-1779060222861-527	\N	9124	الكبير أوي	01029947839	0.00	0	0.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-17 23:23:42.900171+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
135	SUB-284319	\N	9124	الكبير أوي	01029947839	1600.00	\N	\N	[]	0.00	\N	0	0.00	1600.00	1600.00	cash	اشتراك باقة بريميوم — ١٧‏/٥‏/٢٠٢٦	2026-05-17 23:24:43.959035+00	0.00	1600.00	cowork	اشتراك شهري	subscription	2	\N
136	INV-407514	152	161	سالم عبدالواحد	01029947834	25.00	2	25.00	[{"qty": 1, "name": "بتيه بالجبنة ", "price": "10.00"}, {"qty": 1, "name": "مياه", "price": "5.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}]	30.00	LINK20-V2TKGK	20	5.00	55.00	50.00	cash	\N	2026-05-18 13:54:34.423687+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N	1
137	INV-465845	151	9011	قمر قمر	01029947838	100.00	609	25.00	[{"qty": 1, "name": "مشروب مجاني ", "price": 0}]	0.00	عشان لؤي 20	20	20.00	100.00	80.00	cash	\N	2026-05-18 23:54:45.584232+00	0.00	80.00	cowork	منطقة العمل المشتركة	session	\N	1
138	INV-135389	153	76	Salah mohamed	01000984633	100.00	385	25.00	[{"qty": 1, "name": "بيج شبسي ", "price": "10.00"}, {"qty": 1, "name": "قهوة ", "price": "10.00"}]	20.00	\N	0	0.00	120.00	120.00	cash	\N	2026-05-19 00:06:14.09934+00	0.00	120.00	cowork	منطقة العمل المشتركة	session	\N	1
139	INV-229357	154	8996	مصطفى قمر	01029947837	25.00	1	25.00	[{"qty": 1, "name": "Ahmed tea", "price": "15.00"}]	15.00	لؤي 20	20	5.00	40.00	35.00	cash	\N	2026-05-19 00:07:27.609714+00	0.00	35.00	cowork	منطقة العمل المشتركة	session	\N	1
140	INV-314963	157	9011	قمر قمر	01029947838	25.00	1	25.00	[]	0.00	\N	0	0.00	25.00	25.00	cash	\N	2026-05-19 14:02:19.933332+00	0.00	25.00	cowork	منطقة العمل المشتركة	session	\N	1
141	INV-426595	158	9011	قمر قمر	01029947838	100.00	1	25.00	[]	0.00	\N	0	0.00	100.00	100.00	cash	\N	2026-05-19 14:04:09.122272+00	0.00	100.00	cowork	منطقة العمل المشتركة	session	\N	1
142	INV-605879	159	9011	قمر قمر	01029947838	300.00	123	25.00	[]	0.00	\N	0	0.00	300.00	300.00	cash	\N	2026-05-20 00:57:08.861948+00	0.00	300.00	cowork	منطقة العمل المشتركة	session	\N	1
143	INV-646275	155	9124	الكبير أوي	01029947839	0.00	780	0.00	[{"qty": 1, "name": "شاي العروسة ", "price": 10}]	10.00	\N	0	0.00	10.00	10.00	cash	\N	2026-05-20 00:57:28.995378+00	0.00	10.00	cowork	منطقة العمل المشتركة	session	\N	1
144	INV-884479	161	8996	مصطفى قمر	01029947837	75.00	1	25.00	[{"qty": 1, "name": "ينسون ", "price": 10}]	10.00	\N	0	0.00	85.00	85.00	cash	\N	2026-05-20 23:51:29.381647+00	0.00	85.00	cowork	منطقة العمل المشتركة	session	\N	1
145	INV-051329	164	8996	مصطفى قمر	01029947837	25.00	1	25.00	[]	0.00	لؤي 20	20	5.00	25.00	20.00	cash	\N	2026-05-21 21:32:02.406607+00	0.00	20.00	cowork	منطقة العمل المشتركة	session	\N	1
146	INV-049389	165	4213	Yousef	01111750379	75.00	17	25.00	[{"qty": 1, "name": "بتيه بالجبنة ", "price": 10}, {"qty": 1, "name": "قهوة ", "price": 10}]	20.00	لؤي 20	20	15.00	95.00	80.00	cash	\N	2026-05-22 00:35:19.146022+00	0.00	80.00	cowork	منطقة العمل المشتركة	session	\N	1
147	INV-043999	166	8996	مصطفى قمر	01029947837	50.00	7	25.00	[{"qty": 1, "name": "شاي", "price": 10}, {"qty": 1, "name": "ينسون ", "price": 10}, {"qty": 1, "name": "مياه كبيرة ", "price": 12}]	32.00	لؤي 20	20	10.00	82.00	72.00	cash	\N	2026-05-23 15:13:05.300361+00	0.00	72.00	cowork	منطقة العمل المشتركة	session	\N	1
148	QS-1779549755739-775	\N	9124	الكبير أوي	01029947839	0.00	0	0.00	[{"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "مياة", "price": 5}]	25.00	\N	0	0.00	25.00	25.00	cash	\N	2026-05-23 15:22:35.779012+00	0.00	25.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
150	INV-870399	170	73	سالم علي	01029947833	0.00	10	0.00	[{"qty": 1, "name": "قهوة", "price": 20}, {"qty": 1, "name": "بيج شبسي ", "price": 10}, {"qty": 1, "name": "بتيه بالجبنة ", "price": 10}, {"qty": 1, "name": "عصير معلب", "price": 17}, {"qty": 1, "name": "زبادو", "price": "18.00"}]	75.00	\N	0	0.00	75.00	75.00	cash	\N	2026-05-24 12:57:07.38093+00	0.00	75.00	cowork	منطقة العمل المشتركة	session	\N	1
151	QS-1779627801193-673	\N	73	سالم علي	01029947833	0.00	0	0.00	[{"qty": 2, "name": "باتيه بالجبنة ", "price": 10}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-24 13:03:21.232416+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
152	QS-1779627847320-834	\N	\N	.		0.00	0	0.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-24 13:04:07.359128+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
153	QS-1779641061614-214	\N	\N	طالب مستر احمد		0.00	0	0.00	[{"qty": 1, "name": "قهوة", "price": 20}]	20.00	\N	0	0.00	20.00	20.00	cash	\N	2026-05-24 16:44:21.654084+00	0.00	20.00	quick_sale	⚡ بيع سريع	quick_sale	\N	1
154	INV-690885	167	8996	مصطفى قمر	01029947837	100.00	1514	25.00	[{"qty": 1, "name": "مشروب مجاني ", "price": 0}]	0.00	\N	0	0.00	100.00	100.00	cash	\N	2026-05-24 16:45:13.94928+00	0.00	100.00	cowork	منطقة العمل المشتركة	session	\N	1
155	INV-736245	169	9011	قمر قمر	01029947838	100.00	1020	25.00	[{"qty": 1, "name": "مياه", "price": 5}]	5.00	\N	0	0.00	105.00	105.00	cash	\N	2026-05-24 16:46:00.152946+00	0.00	105.00	cowork	منطقة العمل المشتركة	session	\N	1
156	INV-120496	171	73	سالم علي	01029947833	200.00	2744	25.00	[{"qty": 1, "name": "زبادو", "price": 18}]	18.00	\N	0	0.00	218.00	218.00	cash	\N	2026-05-26 22:06:35.2641+00	0.00	218.00	cowork	منطقة العمل المشتركة	session	\N	1
157	SUB-123543	\N	73	سالم علي	01029947833	2300.00	\N	\N	[]	0.00	\N	0	0.00	2300.00	2300.00	cash	اشتراك باقة VIP — ٢٦‏/٥‏/٢٠٢٦	2026-05-26 22:38:43.195518+00	0.00	2300.00	cowork	اشتراك شهري	subscription	3	\N
\.


--
-- Data for Name: playing_with_neon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playing_with_neon (id, name, value) FROM stdin;
1	c4ca4238a0	0.8648771
2	c81e728d9d	0.8778053
3	eccbc87e4b	0.38610253
4	a87ff679a2	0.99947613
5	e4da3b7fbb	0.31941566
6	1679091c5a	0.0043152594
7	8f14e45fce	0.6215219
8	c9f0f895fb	0.6689985
9	45c48cce2e	0.3126893
10	d3d9446802	0.2297176
\.


--
-- Data for Name: price_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_settings (id, period_name, start_hour, end_hour, price_per_hr, updated_at) FROM stdin;
2	evening	14	22	15.00	2026-03-21 13:11:58.622963+00
3	night	22	6	12.00	2026-03-21 13:11:58.622963+00
4	morning	6	14	10.00	2026-03-21 14:01:29.287982+00
5	evening	14	22	15.00	2026-03-21 14:01:29.287982+00
6	night	22	6	12.00	2026-03-21 14:01:29.287982+00
7	morning	6	14	10.00	2026-03-21 15:11:55.949482+00
8	evening	14	22	15.00	2026-03-21 15:11:55.949482+00
9	night	22	6	12.00	2026-03-21 15:11:55.949482+00
10	morning	6	14	10.00	2026-03-21 15:53:05.046344+00
11	evening	14	22	15.00	2026-03-21 15:53:05.046344+00
12	night	22	6	12.00	2026-03-21 15:53:05.046344+00
13	morning	6	14	10.00	2026-03-21 15:58:10.380937+00
14	evening	14	22	15.00	2026-03-21 15:58:10.380937+00
15	night	22	6	12.00	2026-03-21 15:58:10.380937+00
16	morning	6	14	10.00	2026-03-21 16:06:51.864952+00
17	evening	14	22	15.00	2026-03-21 16:06:51.864952+00
18	night	22	6	12.00	2026-03-21 16:06:51.864952+00
19	morning	6	14	10.00	2026-03-21 16:14:20.642433+00
20	evening	14	22	15.00	2026-03-21 16:14:20.642433+00
21	night	22	6	12.00	2026-03-21 16:14:20.642433+00
22	morning	6	14	10.00	2026-03-21 17:32:18.440561+00
23	evening	14	22	15.00	2026-03-21 17:32:18.440561+00
24	night	22	6	12.00	2026-03-21 17:32:18.440561+00
25	morning	6	14	10.00	2026-03-21 17:50:28.64242+00
26	evening	14	22	15.00	2026-03-21 17:50:28.64242+00
27	night	22	6	12.00	2026-03-21 17:50:28.64242+00
28	morning	6	14	10.00	2026-03-21 22:11:45.638606+00
29	evening	14	22	15.00	2026-03-21 22:11:45.638606+00
30	night	22	6	12.00	2026-03-21 22:11:45.638606+00
64	morning	6	14	10.00	2026-03-22 17:29:42.712429+00
65	evening	14	22	15.00	2026-03-22 17:29:42.712429+00
66	night	22	6	12.00	2026-03-22 17:29:42.712429+00
67	morning	6	14	10.00	2026-03-22 17:49:34.698696+00
68	evening	14	22	15.00	2026-03-22 17:49:34.698696+00
69	night	22	6	12.00	2026-03-22 17:49:34.698696+00
70	morning	6	14	10.00	2026-03-22 17:57:39.877221+00
71	evening	14	22	15.00	2026-03-22 17:57:39.877221+00
72	night	22	6	12.00	2026-03-22 17:57:39.877221+00
73	morning	6	14	10.00	2026-03-23 23:51:52.730166+00
74	evening	14	22	15.00	2026-03-23 23:51:52.730166+00
75	night	22	6	12.00	2026-03-23 23:51:52.730166+00
76	morning	6	14	10.00	2026-03-24 00:02:31.284569+00
77	evening	14	22	15.00	2026-03-24 00:02:31.284569+00
78	night	22	6	12.00	2026-03-24 00:02:31.284569+00
79	morning	6	14	10.00	2026-03-24 00:36:53.03909+00
80	evening	14	22	15.00	2026-03-24 00:36:53.03909+00
81	night	22	6	12.00	2026-03-24 00:36:53.03909+00
82	morning	6	14	10.00	2026-03-24 22:25:43.38638+00
83	evening	14	22	15.00	2026-03-24 22:25:43.38638+00
84	night	22	6	12.00	2026-03-24 22:25:43.38638+00
85	morning	6	14	10.00	2026-03-24 22:39:49.164776+00
86	evening	14	22	15.00	2026-03-24 22:39:49.164776+00
87	night	22	6	12.00	2026-03-24 22:39:49.164776+00
88	morning	6	14	10.00	2026-03-24 23:05:15.998052+00
89	evening	14	22	15.00	2026-03-24 23:05:15.998052+00
90	night	22	6	12.00	2026-03-24 23:05:15.998052+00
91	morning	6	14	10.00	2026-03-25 10:38:09.221881+00
92	evening	14	22	15.00	2026-03-25 10:38:09.221881+00
93	night	22	6	12.00	2026-03-25 10:38:09.221881+00
94	morning	6	14	10.00	2026-03-28 17:02:36.316444+00
95	evening	14	22	15.00	2026-03-28 17:02:36.316444+00
96	night	22	6	12.00	2026-03-28 17:02:36.316444+00
97	morning	6	14	10.00	2026-03-28 17:07:39.114876+00
98	evening	14	22	15.00	2026-03-28 17:07:39.114876+00
99	night	22	6	12.00	2026-03-28 17:07:39.114876+00
100	morning	6	14	10.00	2026-03-30 21:11:13.202057+00
101	evening	14	22	15.00	2026-03-30 21:11:13.202057+00
102	night	22	6	12.00	2026-03-30 21:11:13.202057+00
103	morning	6	14	10.00	2026-04-09 17:30:39.651144+00
104	evening	14	22	15.00	2026-04-09 17:30:39.651144+00
105	night	22	6	12.00	2026-04-09 17:30:39.651144+00
106	morning	6	14	10.00	2026-04-09 23:41:32.412908+00
107	evening	14	22	15.00	2026-04-09 23:41:32.412908+00
108	night	22	6	12.00	2026-04-09 23:41:32.412908+00
1	morning	6	14	30.00	2026-03-21 23:07:09.180982+00
31	morning	6	14	10.00	2026-03-22 12:22:56.620032+00
32	evening	14	22	15.00	2026-03-22 12:22:56.620032+00
33	night	22	6	12.00	2026-03-22 12:22:56.620032+00
34	morning	6	14	10.00	2026-03-22 12:31:26.151155+00
35	evening	14	22	15.00	2026-03-22 12:31:26.151155+00
36	night	22	6	12.00	2026-03-22 12:31:26.151155+00
37	morning	6	14	10.00	2026-03-22 12:53:15.956456+00
38	evening	14	22	15.00	2026-03-22 12:53:15.956456+00
39	night	22	6	12.00	2026-03-22 12:53:15.956456+00
40	morning	6	14	10.00	2026-03-22 13:45:25.323524+00
41	evening	14	22	15.00	2026-03-22 13:45:25.323524+00
42	night	22	6	12.00	2026-03-22 13:45:25.323524+00
43	morning	6	14	10.00	2026-03-22 13:47:07.059152+00
44	evening	14	22	15.00	2026-03-22 13:47:07.059152+00
45	night	22	6	12.00	2026-03-22 13:47:07.059152+00
46	morning	6	14	10.00	2026-03-22 15:45:55.608983+00
47	evening	14	22	15.00	2026-03-22 15:45:55.608983+00
48	night	22	6	12.00	2026-03-22 15:45:55.608983+00
49	morning	6	14	10.00	2026-03-22 15:50:40.34579+00
50	evening	14	22	15.00	2026-03-22 15:50:40.34579+00
51	night	22	6	12.00	2026-03-22 15:50:40.34579+00
52	morning	6	14	10.00	2026-03-22 16:00:42.489366+00
53	evening	14	22	15.00	2026-03-22 16:00:42.489366+00
54	night	22	6	12.00	2026-03-22 16:00:42.489366+00
55	morning	6	14	10.00	2026-03-22 16:31:22.383951+00
56	evening	14	22	15.00	2026-03-22 16:31:22.383951+00
57	night	22	6	12.00	2026-03-22 16:31:22.383951+00
58	morning	6	14	10.00	2026-03-22 16:42:27.58534+00
59	evening	14	22	15.00	2026-03-22 16:42:27.58534+00
60	night	22	6	12.00	2026-03-22 16:42:27.58534+00
61	morning	6	14	10.00	2026-03-22 16:53:53.393649+00
62	evening	14	22	15.00	2026-03-22 16:53:53.393649+00
63	night	22	6	12.00	2026-03-22 16:53:53.393649+00
109	morning	6	14	10.00	2026-04-09 23:51:15.451164+00
110	evening	14	22	15.00	2026-04-09 23:51:15.451164+00
111	night	22	6	12.00	2026-04-09 23:51:15.451164+00
112	morning	6	14	10.00	2026-04-10 00:11:25.549212+00
113	evening	14	22	15.00	2026-04-10 00:11:25.549212+00
114	night	22	6	12.00	2026-04-10 00:11:25.549212+00
115	morning	6	14	10.00	2026-04-10 09:15:46.611141+00
116	evening	14	22	15.00	2026-04-10 09:15:46.611141+00
117	night	22	6	12.00	2026-04-10 09:15:46.611141+00
118	morning	6	14	10.00	2026-04-10 09:18:22.150228+00
119	evening	14	22	15.00	2026-04-10 09:18:22.150228+00
120	night	22	6	12.00	2026-04-10 09:18:22.150228+00
121	morning	6	14	10.00	2026-04-10 09:28:45.32926+00
122	evening	14	22	15.00	2026-04-10 09:28:45.32926+00
123	night	22	6	12.00	2026-04-10 09:28:45.32926+00
124	morning	6	14	10.00	2026-04-10 11:27:31.410191+00
125	evening	14	22	15.00	2026-04-10 11:27:31.410191+00
126	night	22	6	12.00	2026-04-10 11:27:31.410191+00
127	morning	6	14	10.00	2026-04-10 21:03:48.362687+00
128	evening	14	22	15.00	2026-04-10 21:03:48.362687+00
129	night	22	6	12.00	2026-04-10 21:03:48.362687+00
130	morning	6	14	10.00	2026-04-10 21:17:31.76213+00
131	evening	14	22	15.00	2026-04-10 21:17:31.76213+00
132	night	22	6	12.00	2026-04-10 21:17:31.76213+00
133	morning	6	14	10.00	2026-04-10 21:45:39.145896+00
134	evening	14	22	15.00	2026-04-10 21:45:39.145896+00
135	night	22	6	12.00	2026-04-10 21:45:39.145896+00
136	morning	6	14	10.00	2026-04-10 22:37:44.796577+00
137	evening	14	22	15.00	2026-04-10 22:37:44.796577+00
138	night	22	6	12.00	2026-04-10 22:37:44.796577+00
139	morning	6	14	10.00	2026-04-10 23:22:52.752525+00
140	evening	14	22	15.00	2026-04-10 23:22:52.752525+00
141	night	22	6	12.00	2026-04-10 23:22:52.752525+00
142	morning	6	14	10.00	2026-04-10 23:39:58.11818+00
143	evening	14	22	15.00	2026-04-10 23:39:58.11818+00
144	night	22	6	12.00	2026-04-10 23:39:58.11818+00
145	morning	6	14	10.00	2026-04-11 06:50:19.91695+00
146	evening	14	22	15.00	2026-04-11 06:50:19.91695+00
147	night	22	6	12.00	2026-04-11 06:50:19.91695+00
148	morning	6	14	10.00	2026-04-11 07:01:24.650682+00
149	evening	14	22	15.00	2026-04-11 07:01:24.650682+00
150	night	22	6	12.00	2026-04-11 07:01:24.650682+00
151	morning	6	14	10.00	2026-04-11 07:10:48.769315+00
152	evening	14	22	15.00	2026-04-11 07:10:48.769315+00
153	night	22	6	12.00	2026-04-11 07:10:48.769315+00
154	morning	6	14	10.00	2026-04-11 07:14:02.200193+00
155	evening	14	22	15.00	2026-04-11 07:14:02.200193+00
156	night	22	6	12.00	2026-04-11 07:14:02.200193+00
157	morning	6	14	10.00	2026-04-11 13:28:19.90505+00
158	evening	14	22	15.00	2026-04-11 13:28:19.90505+00
159	night	22	6	12.00	2026-04-11 13:28:19.90505+00
160	morning	6	14	10.00	2026-04-11 13:53:27.046742+00
161	evening	14	22	15.00	2026-04-11 13:53:27.046742+00
162	night	22	6	12.00	2026-04-11 13:53:27.046742+00
163	morning	6	14	10.00	2026-04-11 22:44:41.86706+00
164	evening	14	22	15.00	2026-04-11 22:44:41.86706+00
165	night	22	6	12.00	2026-04-11 22:44:41.86706+00
166	morning	6	14	10.00	2026-04-11 22:52:12.734221+00
167	evening	14	22	15.00	2026-04-11 22:52:12.734221+00
168	night	22	6	12.00	2026-04-11 22:52:12.734221+00
169	morning	6	14	10.00	2026-04-11 22:59:23.512472+00
170	evening	14	22	15.00	2026-04-11 22:59:23.512472+00
171	night	22	6	12.00	2026-04-11 22:59:23.512472+00
172	morning	6	14	10.00	2026-04-11 23:07:50.684076+00
173	evening	14	22	15.00	2026-04-11 23:07:50.684076+00
174	night	22	6	12.00	2026-04-11 23:07:50.684076+00
175	morning	6	14	10.00	2026-04-11 23:13:28.503105+00
176	evening	14	22	15.00	2026-04-11 23:13:28.503105+00
177	night	22	6	12.00	2026-04-11 23:13:28.503105+00
178	morning	6	14	10.00	2026-04-12 00:47:41.819041+00
179	evening	14	22	15.00	2026-04-12 00:47:41.819041+00
180	night	22	6	12.00	2026-04-12 00:47:41.819041+00
181	morning	6	14	10.00	2026-04-12 00:58:22.871606+00
182	evening	14	22	15.00	2026-04-12 00:58:22.871606+00
183	night	22	6	12.00	2026-04-12 00:58:22.871606+00
184	morning	6	14	10.00	2026-04-12 01:01:16.804096+00
185	evening	14	22	15.00	2026-04-12 01:01:16.804096+00
186	night	22	6	12.00	2026-04-12 01:01:16.804096+00
187	morning	6	14	10.00	2026-04-12 01:08:15.622883+00
188	evening	14	22	15.00	2026-04-12 01:08:15.622883+00
189	night	22	6	12.00	2026-04-12 01:08:15.622883+00
190	morning	6	14	10.00	2026-04-12 01:18:16.325799+00
191	evening	14	22	15.00	2026-04-12 01:18:16.325799+00
192	night	22	6	12.00	2026-04-12 01:18:16.325799+00
193	morning	6	14	10.00	2026-04-12 01:22:22.203277+00
194	evening	14	22	15.00	2026-04-12 01:22:22.203277+00
195	night	22	6	12.00	2026-04-12 01:22:22.203277+00
196	morning	6	14	10.00	2026-04-12 14:07:47.417513+00
197	evening	14	22	15.00	2026-04-12 14:07:47.417513+00
198	night	22	6	12.00	2026-04-12 14:07:47.417513+00
199	morning	6	14	10.00	2026-04-12 14:36:07.767258+00
200	evening	14	22	15.00	2026-04-12 14:36:07.767258+00
201	night	22	6	12.00	2026-04-12 14:36:07.767258+00
202	morning	6	14	10.00	2026-04-12 15:10:08.251769+00
203	evening	14	22	15.00	2026-04-12 15:10:08.251769+00
204	night	22	6	12.00	2026-04-12 15:10:08.251769+00
205	morning	6	14	10.00	2026-04-12 18:17:28.532697+00
206	evening	14	22	15.00	2026-04-12 18:17:28.532697+00
207	night	22	6	12.00	2026-04-12 18:17:28.532697+00
208	morning	6	14	10.00	2026-04-12 18:38:56.399165+00
209	evening	14	22	15.00	2026-04-12 18:38:56.399165+00
210	night	22	6	12.00	2026-04-12 18:38:56.399165+00
211	morning	6	14	10.00	2026-04-12 19:05:01.523266+00
212	evening	14	22	15.00	2026-04-12 19:05:01.523266+00
213	night	22	6	12.00	2026-04-12 19:05:01.523266+00
214	morning	6	14	10.00	2026-04-12 19:13:45.922484+00
215	evening	14	22	15.00	2026-04-12 19:13:45.922484+00
216	night	22	6	12.00	2026-04-12 19:13:45.922484+00
217	morning	6	14	10.00	2026-04-12 20:20:41.346639+00
218	evening	14	22	15.00	2026-04-12 20:20:41.346639+00
219	night	22	6	12.00	2026-04-12 20:20:41.346639+00
220	morning	6	14	10.00	2026-04-12 20:29:26.224734+00
221	evening	14	22	15.00	2026-04-12 20:29:26.224734+00
222	night	22	6	12.00	2026-04-12 20:29:26.224734+00
223	morning	6	14	10.00	2026-04-12 20:46:12.971521+00
224	evening	14	22	15.00	2026-04-12 20:46:12.971521+00
225	night	22	6	12.00	2026-04-12 20:46:12.971521+00
226	morning	6	14	10.00	2026-04-12 21:11:56.256106+00
227	evening	14	22	15.00	2026-04-12 21:11:56.256106+00
228	night	22	6	12.00	2026-04-12 21:11:56.256106+00
229	morning	6	14	10.00	2026-04-13 05:20:21.334142+00
230	evening	14	22	15.00	2026-04-13 05:20:21.334142+00
231	night	22	6	12.00	2026-04-13 05:20:21.334142+00
232	morning	6	14	10.00	2026-04-13 07:34:30.237118+00
233	evening	14	22	15.00	2026-04-13 07:34:30.237118+00
234	night	22	6	12.00	2026-04-13 07:34:30.237118+00
235	morning	6	14	10.00	2026-04-13 07:49:56.422152+00
236	evening	14	22	15.00	2026-04-13 07:49:56.422152+00
237	night	22	6	12.00	2026-04-13 07:49:56.422152+00
238	morning	6	14	10.00	2026-04-13 08:24:11.453922+00
239	evening	14	22	15.00	2026-04-13 08:24:11.453922+00
240	night	22	6	12.00	2026-04-13 08:24:11.453922+00
241	morning	6	14	10.00	2026-04-13 10:33:19.495782+00
242	evening	14	22	15.00	2026-04-13 10:33:19.495782+00
243	night	22	6	12.00	2026-04-13 10:33:19.495782+00
244	morning	6	14	10.00	2026-04-13 12:47:49.137269+00
245	evening	14	22	15.00	2026-04-13 12:47:49.137269+00
246	night	22	6	12.00	2026-04-13 12:47:49.137269+00
247	morning	6	14	10.00	2026-04-13 22:16:23.310964+00
248	evening	14	22	15.00	2026-04-13 22:16:23.310964+00
249	night	22	6	12.00	2026-04-13 22:16:23.310964+00
250	morning	6	14	10.00	2026-04-13 22:29:33.942006+00
251	evening	14	22	15.00	2026-04-13 22:29:33.942006+00
252	night	22	6	12.00	2026-04-13 22:29:33.942006+00
253	morning	6	14	10.00	2026-04-13 22:42:00.545988+00
254	evening	14	22	15.00	2026-04-13 22:42:00.545988+00
255	night	22	6	12.00	2026-04-13 22:42:00.545988+00
256	morning	6	14	10.00	2026-04-14 04:50:40.686165+00
257	evening	14	22	15.00	2026-04-14 04:50:40.686165+00
258	night	22	6	12.00	2026-04-14 04:50:40.686165+00
259	morning	6	14	10.00	2026-04-14 14:33:58.778187+00
260	evening	14	22	15.00	2026-04-14 14:33:58.778187+00
261	night	22	6	12.00	2026-04-14 14:33:58.778187+00
262	morning	6	14	10.00	2026-04-15 04:50:55.781601+00
263	evening	14	22	15.00	2026-04-15 04:50:55.781601+00
264	night	22	6	12.00	2026-04-15 04:50:55.781601+00
265	morning	6	14	10.00	2026-04-15 09:09:44.99495+00
266	evening	14	22	15.00	2026-04-15 09:09:44.99495+00
267	night	22	6	12.00	2026-04-15 09:09:44.99495+00
268	morning	6	14	10.00	2026-04-15 09:40:15.258815+00
269	evening	14	22	15.00	2026-04-15 09:40:15.258815+00
270	night	22	6	12.00	2026-04-15 09:40:15.258815+00
271	morning	6	14	10.00	2026-04-15 17:49:47.697823+00
272	evening	14	22	15.00	2026-04-15 17:49:47.697823+00
273	night	22	6	12.00	2026-04-15 17:49:47.697823+00
274	morning	6	14	10.00	2026-04-15 18:35:27.31808+00
275	evening	14	22	15.00	2026-04-15 18:35:27.31808+00
276	night	22	6	12.00	2026-04-15 18:35:27.31808+00
277	morning	6	14	10.00	2026-04-24 02:22:31.708478+00
278	evening	14	22	15.00	2026-04-24 02:22:31.708478+00
279	night	22	6	12.00	2026-04-24 02:22:31.708478+00
280	morning	6	14	10.00	2026-04-24 02:22:31.93091+00
281	evening	14	22	15.00	2026-04-24 02:22:31.93091+00
282	night	22	6	12.00	2026-04-24 02:22:31.93091+00
283	morning	6	14	10.00	2026-04-24 08:01:18.593464+00
284	evening	14	22	15.00	2026-04-24 08:01:18.593464+00
285	night	22	6	12.00	2026-04-24 08:01:18.593464+00
286	morning	6	14	10.00	2026-04-24 09:53:33.141457+00
287	evening	14	22	15.00	2026-04-24 09:53:33.141457+00
288	night	22	6	12.00	2026-04-24 09:53:33.141457+00
289	morning	6	14	10.00	2026-04-24 09:53:46.216719+00
290	evening	14	22	15.00	2026-04-24 09:53:46.216719+00
291	night	22	6	12.00	2026-04-24 09:53:46.216719+00
292	morning	6	14	10.00	2026-04-24 09:53:46.334127+00
293	evening	14	22	15.00	2026-04-24 09:53:46.334127+00
294	night	22	6	12.00	2026-04-24 09:53:46.334127+00
295	morning	6	14	10.00	2026-04-24 09:54:14.635873+00
296	evening	14	22	15.00	2026-04-24 09:54:14.635873+00
297	night	22	6	12.00	2026-04-24 09:54:14.635873+00
298	morning	6	14	10.00	2026-04-24 13:50:09.929376+00
299	evening	14	22	15.00	2026-04-24 13:50:09.929376+00
300	night	22	6	12.00	2026-04-24 13:50:09.929376+00
301	morning	6	14	10.00	2026-04-25 12:42:28.758947+00
302	evening	14	22	15.00	2026-04-25 12:42:28.758947+00
303	night	22	6	12.00	2026-04-25 12:42:28.758947+00
304	morning	6	14	10.00	2026-04-25 12:55:07.636538+00
305	evening	14	22	15.00	2026-04-25 12:55:07.636538+00
306	night	22	6	12.00	2026-04-25 12:55:07.636538+00
307	morning	6	14	10.00	2026-04-25 12:55:59.866132+00
308	evening	14	22	15.00	2026-04-25 12:55:59.866132+00
309	night	22	6	12.00	2026-04-25 12:55:59.866132+00
310	morning	6	14	10.00	2026-04-25 12:55:59.934947+00
311	evening	14	22	15.00	2026-04-25 12:55:59.934947+00
312	night	22	6	12.00	2026-04-25 12:55:59.934947+00
313	morning	6	14	10.00	2026-04-25 12:56:00.41506+00
314	evening	14	22	15.00	2026-04-25 12:56:00.41506+00
315	night	22	6	12.00	2026-04-25 12:56:00.41506+00
316	morning	6	14	10.00	2026-04-25 12:56:00.418634+00
317	evening	14	22	15.00	2026-04-25 12:56:00.418634+00
318	night	22	6	12.00	2026-04-25 12:56:00.418634+00
319	morning	6	14	10.00	2026-04-25 12:56:00.497298+00
320	evening	14	22	15.00	2026-04-25 12:56:00.497298+00
321	night	22	6	12.00	2026-04-25 12:56:00.497298+00
322	morning	6	14	10.00	2026-04-25 13:04:53.727612+00
323	evening	14	22	15.00	2026-04-25 13:04:53.727612+00
324	night	22	6	12.00	2026-04-25 13:04:53.727612+00
325	morning	6	14	10.00	2026-04-25 13:05:02.762091+00
326	evening	14	22	15.00	2026-04-25 13:05:02.762091+00
327	night	22	6	12.00	2026-04-25 13:05:02.762091+00
328	morning	6	14	10.00	2026-04-25 13:05:02.934962+00
329	evening	14	22	15.00	2026-04-25 13:05:02.934962+00
330	night	22	6	12.00	2026-04-25 13:05:02.934962+00
331	morning	6	14	10.00	2026-04-25 13:05:11.720234+00
332	evening	14	22	15.00	2026-04-25 13:05:11.720234+00
333	night	22	6	12.00	2026-04-25 13:05:11.720234+00
334	morning	6	14	10.00	2026-04-25 13:05:12.659767+00
335	evening	14	22	15.00	2026-04-25 13:05:12.659767+00
336	night	22	6	12.00	2026-04-25 13:05:12.659767+00
337	morning	6	14	10.00	2026-04-25 13:05:18.398067+00
338	evening	14	22	15.00	2026-04-25 13:05:18.398067+00
339	night	22	6	12.00	2026-04-25 13:05:18.398067+00
340	morning	6	14	10.00	2026-04-25 13:09:10.746955+00
341	evening	14	22	15.00	2026-04-25 13:09:10.746955+00
342	night	22	6	12.00	2026-04-25 13:09:10.746955+00
343	morning	6	14	10.00	2026-04-25 13:23:25.59959+00
344	evening	14	22	15.00	2026-04-25 13:23:25.59959+00
345	night	22	6	12.00	2026-04-25 13:23:25.59959+00
346	morning	6	14	10.00	2026-04-25 13:23:36.727104+00
347	evening	14	22	15.00	2026-04-25 13:23:36.727104+00
348	night	22	6	12.00	2026-04-25 13:23:36.727104+00
349	morning	6	14	10.00	2026-04-25 13:23:36.87598+00
350	evening	14	22	15.00	2026-04-25 13:23:36.87598+00
351	night	22	6	12.00	2026-04-25 13:23:36.87598+00
352	morning	6	14	10.00	2026-04-25 13:54:34.10779+00
353	evening	14	22	15.00	2026-04-25 13:54:34.10779+00
354	night	22	6	12.00	2026-04-25 13:54:34.10779+00
355	morning	6	14	10.00	2026-04-25 14:03:11.416596+00
356	evening	14	22	15.00	2026-04-25 14:03:11.416596+00
357	night	22	6	12.00	2026-04-25 14:03:11.416596+00
358	morning	6	14	10.00	2026-04-25 14:03:11.450137+00
359	evening	14	22	15.00	2026-04-25 14:03:11.450137+00
360	night	22	6	12.00	2026-04-25 14:03:11.450137+00
361	morning	6	14	10.00	2026-04-25 14:03:23.173596+00
362	evening	14	22	15.00	2026-04-25 14:03:23.173596+00
363	night	22	6	12.00	2026-04-25 14:03:23.173596+00
364	morning	6	14	10.00	2026-04-25 14:03:55.228639+00
365	evening	14	22	15.00	2026-04-25 14:03:55.228639+00
366	night	22	6	12.00	2026-04-25 14:03:55.228639+00
367	morning	6	14	10.00	2026-04-25 16:53:38.138277+00
368	evening	14	22	15.00	2026-04-25 16:53:38.138277+00
369	night	22	6	12.00	2026-04-25 16:53:38.138277+00
370	morning	6	14	10.00	2026-04-25 16:53:57.037138+00
371	evening	14	22	15.00	2026-04-25 16:53:57.037138+00
372	night	22	6	12.00	2026-04-25 16:53:57.037138+00
373	morning	6	14	10.00	2026-04-25 16:58:03.181888+00
374	evening	14	22	15.00	2026-04-25 16:58:03.181888+00
375	night	22	6	12.00	2026-04-25 16:58:03.181888+00
376	morning	6	14	10.00	2026-04-25 16:58:03.250692+00
377	evening	14	22	15.00	2026-04-25 16:58:03.250692+00
378	night	22	6	12.00	2026-04-25 16:58:03.250692+00
380	morning	6	14	10.00	2026-04-25 19:08:08.930369+00
381	evening	14	22	15.00	2026-04-25 19:08:08.930369+00
382	night	22	6	12.00	2026-04-25 19:08:08.930369+00
379	morning	6	14	10.00	2026-04-25 19:08:08.935589+00
383	evening	14	22	15.00	2026-04-25 19:08:08.935589+00
384	night	22	6	12.00	2026-04-25 19:08:08.935589+00
385	morning	6	14	10.00	2026-04-25 19:08:09.374208+00
386	evening	14	22	15.00	2026-04-25 19:08:09.374208+00
387	night	22	6	12.00	2026-04-25 19:08:09.374208+00
388	morning	6	14	10.00	2026-04-25 19:08:09.414752+00
389	evening	14	22	15.00	2026-04-25 19:08:09.414752+00
390	night	22	6	12.00	2026-04-25 19:08:09.414752+00
391	morning	6	14	10.00	2026-04-25 19:08:09.437918+00
392	evening	14	22	15.00	2026-04-25 19:08:09.437918+00
393	night	22	6	12.00	2026-04-25 19:08:09.437918+00
394	morning	6	14	10.00	2026-04-25 19:08:09.438607+00
395	evening	14	22	15.00	2026-04-25 19:08:09.438607+00
396	night	22	6	12.00	2026-04-25 19:08:09.438607+00
397	morning	6	14	10.00	2026-04-25 19:08:09.647563+00
398	evening	14	22	15.00	2026-04-25 19:08:09.647563+00
399	night	22	6	12.00	2026-04-25 19:08:09.647563+00
400	morning	6	14	10.00	2026-04-25 19:47:32.133159+00
401	evening	14	22	15.00	2026-04-25 19:47:32.133159+00
402	night	22	6	12.00	2026-04-25 19:47:32.133159+00
403	morning	6	14	10.00	2026-04-25 19:47:40.595271+00
404	evening	14	22	15.00	2026-04-25 19:47:40.595271+00
405	night	22	6	12.00	2026-04-25 19:47:40.595271+00
406	morning	6	14	10.00	2026-04-25 19:57:00.921016+00
407	evening	14	22	15.00	2026-04-25 19:57:00.921016+00
408	night	22	6	12.00	2026-04-25 19:57:00.921016+00
409	morning	6	14	10.00	2026-04-25 20:11:43.198537+00
411	evening	14	22	15.00	2026-04-25 20:11:43.198537+00
412	night	22	6	12.00	2026-04-25 20:11:43.198537+00
410	morning	6	14	10.00	2026-04-25 20:11:43.196303+00
413	evening	14	22	15.00	2026-04-25 20:11:43.196303+00
414	night	22	6	12.00	2026-04-25 20:11:43.196303+00
415	morning	6	14	10.00	2026-04-25 20:11:45.048864+00
416	evening	14	22	15.00	2026-04-25 20:11:45.048864+00
417	night	22	6	12.00	2026-04-25 20:11:45.048864+00
418	morning	6	14	10.00	2026-04-25 20:12:06.269351+00
419	evening	14	22	15.00	2026-04-25 20:12:06.269351+00
420	night	22	6	12.00	2026-04-25 20:12:06.269351+00
421	morning	6	14	10.00	2026-04-25 20:18:15.621369+00
422	evening	14	22	15.00	2026-04-25 20:18:15.621369+00
423	night	22	6	12.00	2026-04-25 20:18:15.621369+00
424	morning	6	14	10.00	2026-04-25 20:55:12.483013+00
425	evening	14	22	15.00	2026-04-25 20:55:12.483013+00
426	night	22	6	12.00	2026-04-25 20:55:12.483013+00
427	morning	6	14	10.00	2026-04-25 20:55:28.883549+00
428	evening	14	22	15.00	2026-04-25 20:55:28.883549+00
429	night	22	6	12.00	2026-04-25 20:55:28.883549+00
430	morning	6	14	10.00	2026-04-25 20:55:37.423455+00
431	evening	14	22	15.00	2026-04-25 20:55:37.423455+00
432	night	22	6	12.00	2026-04-25 20:55:37.423455+00
433	morning	6	14	10.00	2026-04-25 20:55:39.00748+00
434	evening	14	22	15.00	2026-04-25 20:55:39.00748+00
435	night	22	6	12.00	2026-04-25 20:55:39.00748+00
436	morning	6	14	10.00	2026-04-25 20:56:15.181442+00
437	evening	14	22	15.00	2026-04-25 20:56:15.181442+00
438	night	22	6	12.00	2026-04-25 20:56:15.181442+00
439	morning	6	14	10.00	2026-04-25 21:41:38.053448+00
440	evening	14	22	15.00	2026-04-25 21:41:38.053448+00
441	night	22	6	12.00	2026-04-25 21:41:38.053448+00
442	morning	6	14	10.00	2026-04-25 21:41:38.438091+00
443	evening	14	22	15.00	2026-04-25 21:41:38.438091+00
444	night	22	6	12.00	2026-04-25 21:41:38.438091+00
446	morning	6	14	10.00	2026-04-25 22:32:21.766582+00
447	evening	14	22	15.00	2026-04-25 22:32:21.766582+00
448	night	22	6	12.00	2026-04-25 22:32:21.766582+00
445	morning	6	14	10.00	2026-04-25 22:32:21.764105+00
449	evening	14	22	15.00	2026-04-25 22:32:21.764105+00
450	night	22	6	12.00	2026-04-25 22:32:21.764105+00
451	morning	6	14	10.00	2026-04-25 22:32:27.707552+00
452	evening	14	22	15.00	2026-04-25 22:32:27.707552+00
453	night	22	6	12.00	2026-04-25 22:32:27.707552+00
454	morning	6	14	10.00	2026-04-25 22:37:57.357244+00
455	evening	14	22	15.00	2026-04-25 22:37:57.357244+00
456	night	22	6	12.00	2026-04-25 22:37:57.357244+00
457	morning	6	14	10.00	2026-04-25 22:53:13.967228+00
458	evening	14	22	15.00	2026-04-25 22:53:13.967228+00
459	night	22	6	12.00	2026-04-25 22:53:13.967228+00
460	morning	6	14	10.00	2026-04-25 22:53:22.724604+00
461	evening	14	22	15.00	2026-04-25 22:53:22.724604+00
462	night	22	6	12.00	2026-04-25 22:53:22.724604+00
463	morning	6	14	10.00	2026-04-25 22:53:22.751981+00
464	evening	14	22	15.00	2026-04-25 22:53:22.751981+00
465	night	22	6	12.00	2026-04-25 22:53:22.751981+00
466	morning	6	14	10.00	2026-04-26 13:21:34.609989+00
467	evening	14	22	15.00	2026-04-26 13:21:34.609989+00
468	night	22	6	12.00	2026-04-26 13:21:34.609989+00
469	morning	6	14	10.00	2026-04-26 13:21:48.847201+00
470	evening	14	22	15.00	2026-04-26 13:21:48.847201+00
471	night	22	6	12.00	2026-04-26 13:21:48.847201+00
472	morning	6	14	10.00	2026-04-26 13:21:48.939956+00
473	evening	14	22	15.00	2026-04-26 13:21:48.939956+00
474	night	22	6	12.00	2026-04-26 13:21:48.939956+00
475	morning	6	14	10.00	2026-04-26 18:08:49.981864+00
476	evening	14	22	15.00	2026-04-26 18:08:49.981864+00
477	night	22	6	12.00	2026-04-26 18:08:49.981864+00
478	morning	6	14	10.00	2026-04-26 18:08:58.771693+00
479	evening	14	22	15.00	2026-04-26 18:08:58.771693+00
480	night	22	6	12.00	2026-04-26 18:08:58.771693+00
481	morning	6	14	10.00	2026-04-26 18:08:58.856605+00
482	evening	14	22	15.00	2026-04-26 18:08:58.856605+00
483	night	22	6	12.00	2026-04-26 18:08:58.856605+00
484	morning	6	14	10.00	2026-04-26 18:10:35.854859+00
485	evening	14	22	15.00	2026-04-26 18:10:35.854859+00
486	night	22	6	12.00	2026-04-26 18:10:35.854859+00
487	morning	6	14	10.00	2026-04-26 18:19:02.226191+00
488	evening	14	22	15.00	2026-04-26 18:19:02.226191+00
489	night	22	6	12.00	2026-04-26 18:19:02.226191+00
490	morning	6	14	10.00	2026-04-26 18:19:02.312641+00
491	evening	14	22	15.00	2026-04-26 18:19:02.312641+00
492	night	22	6	12.00	2026-04-26 18:19:02.312641+00
493	morning	6	14	10.00	2026-04-26 18:19:02.338481+00
494	evening	14	22	15.00	2026-04-26 18:19:02.338481+00
495	night	22	6	12.00	2026-04-26 18:19:02.338481+00
496	morning	6	14	10.00	2026-04-26 18:19:02.345332+00
497	evening	14	22	15.00	2026-04-26 18:19:02.345332+00
498	night	22	6	12.00	2026-04-26 18:19:02.345332+00
499	morning	6	14	10.00	2026-04-26 18:19:02.346907+00
500	evening	14	22	15.00	2026-04-26 18:19:02.346907+00
501	night	22	6	12.00	2026-04-26 18:19:02.346907+00
502	morning	6	14	10.00	2026-04-26 18:19:02.359373+00
503	evening	14	22	15.00	2026-04-26 18:19:02.359373+00
504	night	22	6	12.00	2026-04-26 18:19:02.359373+00
505	morning	6	14	10.00	2026-04-26 18:19:02.394505+00
506	evening	14	22	15.00	2026-04-26 18:19:02.394505+00
507	night	22	6	12.00	2026-04-26 18:19:02.394505+00
508	morning	6	14	10.00	2026-04-26 18:19:02.424214+00
509	evening	14	22	15.00	2026-04-26 18:19:02.424214+00
510	night	22	6	12.00	2026-04-26 18:19:02.424214+00
511	morning	6	14	10.00	2026-04-26 18:19:03.082218+00
512	evening	14	22	15.00	2026-04-26 18:19:03.082218+00
513	night	22	6	12.00	2026-04-26 18:19:03.082218+00
514	morning	6	14	10.00	2026-04-26 22:31:14.617833+00
515	evening	14	22	15.00	2026-04-26 22:31:14.617833+00
516	night	22	6	12.00	2026-04-26 22:31:14.617833+00
517	morning	6	14	10.00	2026-04-26 22:31:50.633729+00
518	evening	14	22	15.00	2026-04-26 22:31:50.633729+00
519	night	22	6	12.00	2026-04-26 22:31:50.633729+00
520	morning	6	14	10.00	2026-04-26 22:32:06.31506+00
521	evening	14	22	15.00	2026-04-26 22:32:06.31506+00
522	night	22	6	12.00	2026-04-26 22:32:06.31506+00
523	morning	6	14	10.00	2026-04-26 22:32:06.462239+00
524	evening	14	22	15.00	2026-04-26 22:32:06.462239+00
525	night	22	6	12.00	2026-04-26 22:32:06.462239+00
526	morning	6	14	10.00	2026-04-27 13:33:06.0264+00
527	evening	14	22	15.00	2026-04-27 13:33:06.0264+00
528	night	22	6	12.00	2026-04-27 13:33:06.0264+00
529	morning	6	14	10.00	2026-04-27 13:33:14.315177+00
530	evening	14	22	15.00	2026-04-27 13:33:14.315177+00
531	night	22	6	12.00	2026-04-27 13:33:14.315177+00
532	morning	6	14	10.00	2026-04-27 15:04:29.082574+00
534	evening	14	22	15.00	2026-04-27 15:04:29.082574+00
535	night	22	6	12.00	2026-04-27 15:04:29.082574+00
533	morning	6	14	10.00	2026-04-27 15:04:29.087838+00
536	evening	14	22	15.00	2026-04-27 15:04:29.087838+00
537	night	22	6	12.00	2026-04-27 15:04:29.087838+00
538	morning	6	14	10.00	2026-04-27 15:04:29.100794+00
539	evening	14	22	15.00	2026-04-27 15:04:29.100794+00
540	night	22	6	12.00	2026-04-27 15:04:29.100794+00
541	morning	6	14	10.00	2026-04-27 15:04:29.222673+00
542	evening	14	22	15.00	2026-04-27 15:04:29.222673+00
543	night	22	6	12.00	2026-04-27 15:04:29.222673+00
544	morning	6	14	10.00	2026-04-27 18:47:40.788978+00
545	evening	14	22	15.00	2026-04-27 18:47:40.788978+00
546	night	22	6	12.00	2026-04-27 18:47:40.788978+00
547	morning	6	14	10.00	2026-04-27 18:47:40.814699+00
548	evening	14	22	15.00	2026-04-27 18:47:40.814699+00
549	night	22	6	12.00	2026-04-27 18:47:40.814699+00
550	morning	6	14	10.00	2026-04-27 18:48:10.513773+00
551	evening	14	22	15.00	2026-04-27 18:48:10.513773+00
552	night	22	6	12.00	2026-04-27 18:48:10.513773+00
553	morning	6	14	10.00	2026-04-27 18:48:10.652712+00
554	evening	14	22	15.00	2026-04-27 18:48:10.652712+00
555	night	22	6	12.00	2026-04-27 18:48:10.652712+00
556	morning	6	14	10.00	2026-04-27 19:02:01.383423+00
557	evening	14	22	15.00	2026-04-27 19:02:01.383423+00
558	night	22	6	12.00	2026-04-27 19:02:01.383423+00
559	morning	6	14	10.00	2026-04-27 19:02:10.399733+00
560	evening	14	22	15.00	2026-04-27 19:02:10.399733+00
561	night	22	6	12.00	2026-04-27 19:02:10.399733+00
562	morning	6	14	10.00	2026-04-27 19:02:20.159505+00
563	evening	14	22	15.00	2026-04-27 19:02:20.159505+00
564	night	22	6	12.00	2026-04-27 19:02:20.159505+00
565	morning	6	14	10.00	2026-04-27 19:02:20.86004+00
566	evening	14	22	15.00	2026-04-27 19:02:20.86004+00
567	night	22	6	12.00	2026-04-27 19:02:20.86004+00
568	morning	6	14	10.00	2026-04-27 19:02:29.073984+00
569	evening	14	22	15.00	2026-04-27 19:02:29.073984+00
570	night	22	6	12.00	2026-04-27 19:02:29.073984+00
571	morning	6	14	10.00	2026-04-27 19:05:04.61974+00
572	evening	14	22	15.00	2026-04-27 19:05:04.61974+00
573	night	22	6	12.00	2026-04-27 19:05:04.61974+00
574	morning	6	14	10.00	2026-04-27 19:14:17.711776+00
575	evening	14	22	15.00	2026-04-27 19:14:17.711776+00
576	night	22	6	12.00	2026-04-27 19:14:17.711776+00
577	morning	6	14	10.00	2026-04-27 19:14:17.750792+00
578	evening	14	22	15.00	2026-04-27 19:14:17.750792+00
579	night	22	6	12.00	2026-04-27 19:14:17.750792+00
580	morning	6	14	10.00	2026-04-27 19:22:49.944153+00
581	evening	14	22	15.00	2026-04-27 19:22:49.944153+00
582	night	22	6	12.00	2026-04-27 19:22:49.944153+00
583	morning	6	14	10.00	2026-04-27 19:23:43.918445+00
584	evening	14	22	15.00	2026-04-27 19:23:43.918445+00
585	night	22	6	12.00	2026-04-27 19:23:43.918445+00
586	morning	6	14	10.00	2026-04-27 19:33:32.050637+00
587	evening	14	22	15.00	2026-04-27 19:33:32.050637+00
588	night	22	6	12.00	2026-04-27 19:33:32.050637+00
589	morning	6	14	10.00	2026-04-27 19:33:32.094283+00
590	evening	14	22	15.00	2026-04-27 19:33:32.094283+00
591	night	22	6	12.00	2026-04-27 19:33:32.094283+00
592	morning	6	14	10.00	2026-04-27 22:28:17.059919+00
593	evening	14	22	15.00	2026-04-27 22:28:17.059919+00
594	night	22	6	12.00	2026-04-27 22:28:17.059919+00
595	morning	6	14	10.00	2026-04-27 22:28:31.261451+00
596	evening	14	22	15.00	2026-04-27 22:28:31.261451+00
597	night	22	6	12.00	2026-04-27 22:28:31.261451+00
598	morning	6	14	10.00	2026-04-27 22:28:52.262725+00
599	evening	14	22	15.00	2026-04-27 22:28:52.262725+00
600	night	22	6	12.00	2026-04-27 22:28:52.262725+00
601	morning	6	14	10.00	2026-04-27 22:30:16.827883+00
602	evening	14	22	15.00	2026-04-27 22:30:16.827883+00
603	night	22	6	12.00	2026-04-27 22:30:16.827883+00
604	morning	6	14	10.00	2026-04-28 20:49:37.080086+00
605	evening	14	22	15.00	2026-04-28 20:49:37.080086+00
606	night	22	6	12.00	2026-04-28 20:49:37.080086+00
607	morning	6	14	10.00	2026-04-28 20:49:37.268016+00
608	evening	14	22	15.00	2026-04-28 20:49:37.268016+00
609	night	22	6	12.00	2026-04-28 20:49:37.268016+00
610	morning	6	14	10.00	2026-04-28 20:49:42.799281+00
611	evening	14	22	15.00	2026-04-28 20:49:42.799281+00
612	night	22	6	12.00	2026-04-28 20:49:42.799281+00
613	morning	6	14	10.00	2026-04-28 20:51:23.787683+00
614	evening	14	22	15.00	2026-04-28 20:51:23.787683+00
615	night	22	6	12.00	2026-04-28 20:51:23.787683+00
616	morning	6	14	10.00	2026-04-28 20:51:33.404792+00
617	evening	14	22	15.00	2026-04-28 20:51:33.404792+00
618	night	22	6	12.00	2026-04-28 20:51:33.404792+00
619	morning	6	14	10.00	2026-04-28 20:51:33.437927+00
620	evening	14	22	15.00	2026-04-28 20:51:33.437927+00
621	night	22	6	12.00	2026-04-28 20:51:33.437927+00
622	morning	6	14	10.00	2026-04-28 20:51:57.982594+00
623	evening	14	22	15.00	2026-04-28 20:51:57.982594+00
624	night	22	6	12.00	2026-04-28 20:51:57.982594+00
625	morning	6	14	10.00	2026-04-28 20:59:44.97636+00
626	evening	14	22	15.00	2026-04-28 20:59:44.97636+00
627	night	22	6	12.00	2026-04-28 20:59:44.97636+00
628	morning	6	14	10.00	2026-04-28 20:59:45.334989+00
629	evening	14	22	15.00	2026-04-28 20:59:45.334989+00
630	night	22	6	12.00	2026-04-28 20:59:45.334989+00
631	morning	6	14	10.00	2026-04-28 21:00:13.603759+00
632	evening	14	22	15.00	2026-04-28 21:00:13.603759+00
633	night	22	6	12.00	2026-04-28 21:00:13.603759+00
635	morning	6	14	10.00	2026-04-29 07:30:04.037531+00
636	evening	14	22	15.00	2026-04-29 07:30:04.037531+00
637	night	22	6	12.00	2026-04-29 07:30:04.037531+00
634	morning	6	14	10.00	2026-04-29 07:30:04.034471+00
638	evening	14	22	15.00	2026-04-29 07:30:04.034471+00
639	night	22	6	12.00	2026-04-29 07:30:04.034471+00
640	morning	6	14	10.00	2026-04-29 22:08:09.822738+00
641	evening	14	22	15.00	2026-04-29 22:08:09.822738+00
642	night	22	6	12.00	2026-04-29 22:08:09.822738+00
643	morning	6	14	10.00	2026-04-29 22:08:10.073325+00
644	evening	14	22	15.00	2026-04-29 22:08:10.073325+00
645	night	22	6	12.00	2026-04-29 22:08:10.073325+00
646	morning	6	14	10.00	2026-04-29 22:13:26.997963+00
647	evening	14	22	15.00	2026-04-29 22:13:26.997963+00
648	night	22	6	12.00	2026-04-29 22:13:26.997963+00
649	morning	6	14	10.00	2026-04-29 22:13:27.904652+00
650	evening	14	22	15.00	2026-04-29 22:13:27.904652+00
651	night	22	6	12.00	2026-04-29 22:13:27.904652+00
652	morning	6	14	10.00	2026-04-29 22:13:30.27923+00
653	evening	14	22	15.00	2026-04-29 22:13:30.27923+00
654	night	22	6	12.00	2026-04-29 22:13:30.27923+00
655	morning	6	14	10.00	2026-04-29 22:15:17.690623+00
656	evening	14	22	15.00	2026-04-29 22:15:17.690623+00
657	night	22	6	12.00	2026-04-29 22:15:17.690623+00
658	morning	6	14	10.00	2026-04-29 22:31:43.124807+00
659	evening	14	22	15.00	2026-04-29 22:31:43.124807+00
660	night	22	6	12.00	2026-04-29 22:31:43.124807+00
661	morning	6	14	10.00	2026-04-29 22:31:43.46092+00
662	evening	14	22	15.00	2026-04-29 22:31:43.46092+00
663	night	22	6	12.00	2026-04-29 22:31:43.46092+00
664	morning	6	14	10.00	2026-04-29 22:32:57.195432+00
665	evening	14	22	15.00	2026-04-29 22:32:57.195432+00
666	night	22	6	12.00	2026-04-29 22:32:57.195432+00
667	morning	6	14	10.00	2026-04-29 22:34:47.320143+00
668	evening	14	22	15.00	2026-04-29 22:34:47.320143+00
669	night	22	6	12.00	2026-04-29 22:34:47.320143+00
670	morning	6	14	10.00	2026-04-29 22:34:49.600739+00
671	evening	14	22	15.00	2026-04-29 22:34:49.600739+00
672	night	22	6	12.00	2026-04-29 22:34:49.600739+00
673	morning	6	14	10.00	2026-04-29 22:46:41.960996+00
674	evening	14	22	15.00	2026-04-29 22:46:41.960996+00
675	night	22	6	12.00	2026-04-29 22:46:41.960996+00
676	morning	6	14	10.00	2026-04-29 22:46:41.981743+00
677	evening	14	22	15.00	2026-04-29 22:46:41.981743+00
678	night	22	6	12.00	2026-04-29 22:46:41.981743+00
679	morning	6	14	10.00	2026-04-29 22:46:42.086546+00
680	evening	14	22	15.00	2026-04-29 22:46:42.086546+00
681	night	22	6	12.00	2026-04-29 22:46:42.086546+00
682	morning	6	14	10.00	2026-04-29 23:05:29.064535+00
683	evening	14	22	15.00	2026-04-29 23:05:29.064535+00
684	night	22	6	12.00	2026-04-29 23:05:29.064535+00
685	morning	6	14	10.00	2026-04-29 23:05:29.423423+00
686	evening	14	22	15.00	2026-04-29 23:05:29.423423+00
687	night	22	6	12.00	2026-04-29 23:05:29.423423+00
688	morning	6	14	10.00	2026-04-29 23:05:29.777256+00
689	evening	14	22	15.00	2026-04-29 23:05:29.777256+00
690	night	22	6	12.00	2026-04-29 23:05:29.777256+00
691	morning	6	14	10.00	2026-04-29 23:05:29.787107+00
692	evening	14	22	15.00	2026-04-29 23:05:29.787107+00
693	night	22	6	12.00	2026-04-29 23:05:29.787107+00
694	morning	6	14	10.00	2026-04-29 23:05:29.867466+00
695	evening	14	22	15.00	2026-04-29 23:05:29.867466+00
696	night	22	6	12.00	2026-04-29 23:05:29.867466+00
697	morning	6	14	10.00	2026-04-29 23:17:44.661+00
698	evening	14	22	15.00	2026-04-29 23:17:44.661+00
699	night	22	6	12.00	2026-04-29 23:17:44.661+00
700	morning	6	14	10.00	2026-04-29 23:17:44.977749+00
701	evening	14	22	15.00	2026-04-29 23:17:44.977749+00
702	night	22	6	12.00	2026-04-29 23:17:44.977749+00
703	morning	6	14	10.00	2026-04-29 23:17:45.025502+00
704	evening	14	22	15.00	2026-04-29 23:17:45.025502+00
705	night	22	6	12.00	2026-04-29 23:17:45.025502+00
706	morning	6	14	10.00	2026-04-29 23:18:05.898023+00
707	evening	14	22	15.00	2026-04-29 23:18:05.898023+00
708	night	22	6	12.00	2026-04-29 23:18:05.898023+00
709	morning	6	14	10.00	2026-04-29 23:28:25.317842+00
710	evening	14	22	15.00	2026-04-29 23:28:25.317842+00
711	night	22	6	12.00	2026-04-29 23:28:25.317842+00
713	morning	6	14	10.00	2026-04-29 23:45:25.745984+00
714	evening	14	22	15.00	2026-04-29 23:45:25.745984+00
715	night	22	6	12.00	2026-04-29 23:45:25.745984+00
712	morning	6	14	10.00	2026-04-29 23:45:25.752819+00
716	evening	14	22	15.00	2026-04-29 23:45:25.752819+00
717	night	22	6	12.00	2026-04-29 23:45:25.752819+00
718	morning	6	14	10.00	2026-04-29 23:45:25.980433+00
719	evening	14	22	15.00	2026-04-29 23:45:25.980433+00
720	night	22	6	12.00	2026-04-29 23:45:25.980433+00
721	morning	6	14	10.00	2026-04-29 23:45:25.989009+00
722	evening	14	22	15.00	2026-04-29 23:45:25.989009+00
723	night	22	6	12.00	2026-04-29 23:45:25.989009+00
724	morning	6	14	10.00	2026-04-29 23:45:25.997616+00
725	evening	14	22	15.00	2026-04-29 23:45:25.997616+00
726	night	22	6	12.00	2026-04-29 23:45:25.997616+00
727	morning	6	14	10.00	2026-04-29 23:45:26.000942+00
728	evening	14	22	15.00	2026-04-29 23:45:26.000942+00
729	night	22	6	12.00	2026-04-29 23:45:26.000942+00
730	morning	6	14	10.00	2026-04-29 23:45:26.038493+00
731	evening	14	22	15.00	2026-04-29 23:45:26.038493+00
732	night	22	6	12.00	2026-04-29 23:45:26.038493+00
733	morning	6	14	10.00	2026-04-29 23:45:26.072076+00
734	evening	14	22	15.00	2026-04-29 23:45:26.072076+00
735	night	22	6	12.00	2026-04-29 23:45:26.072076+00
736	morning	6	14	10.00	2026-04-29 23:51:41.246132+00
737	evening	14	22	15.00	2026-04-29 23:51:41.246132+00
738	night	22	6	12.00	2026-04-29 23:51:41.246132+00
739	morning	6	14	10.00	2026-04-29 23:51:41.424838+00
740	evening	14	22	15.00	2026-04-29 23:51:41.424838+00
741	night	22	6	12.00	2026-04-29 23:51:41.424838+00
742	morning	6	14	10.00	2026-04-29 23:53:27.309691+00
743	evening	14	22	15.00	2026-04-29 23:53:27.309691+00
744	night	22	6	12.00	2026-04-29 23:53:27.309691+00
745	morning	6	14	10.00	2026-04-29 23:53:27.398854+00
746	evening	14	22	15.00	2026-04-29 23:53:27.398854+00
747	night	22	6	12.00	2026-04-29 23:53:27.398854+00
748	morning	6	14	10.00	2026-04-29 23:58:49.486683+00
749	evening	14	22	15.00	2026-04-29 23:58:49.486683+00
750	night	22	6	12.00	2026-04-29 23:58:49.486683+00
751	morning	6	14	10.00	2026-04-29 23:58:50.453276+00
752	evening	14	22	15.00	2026-04-29 23:58:50.453276+00
753	night	22	6	12.00	2026-04-29 23:58:50.453276+00
754	morning	6	14	10.00	2026-04-29 23:58:55.534009+00
755	evening	14	22	15.00	2026-04-29 23:58:55.534009+00
756	night	22	6	12.00	2026-04-29 23:58:55.534009+00
757	morning	6	14	10.00	2026-04-30 00:03:08.292455+00
758	evening	14	22	15.00	2026-04-30 00:03:08.292455+00
759	night	22	6	12.00	2026-04-30 00:03:08.292455+00
761	morning	6	14	10.00	2026-04-30 08:24:16.095128+00
762	evening	14	22	15.00	2026-04-30 08:24:16.095128+00
763	night	22	6	12.00	2026-04-30 08:24:16.095128+00
760	morning	6	14	10.00	2026-04-30 08:24:16.087434+00
764	evening	14	22	15.00	2026-04-30 08:24:16.087434+00
765	night	22	6	12.00	2026-04-30 08:24:16.087434+00
766	morning	6	14	10.00	2026-04-30 08:24:16.394246+00
767	evening	14	22	15.00	2026-04-30 08:24:16.394246+00
768	night	22	6	12.00	2026-04-30 08:24:16.394246+00
769	morning	6	14	10.00	2026-04-30 08:24:16.395904+00
770	evening	14	22	15.00	2026-04-30 08:24:16.395904+00
771	night	22	6	12.00	2026-04-30 08:24:16.395904+00
772	morning	6	14	10.00	2026-04-30 08:24:23.216113+00
773	evening	14	22	15.00	2026-04-30 08:24:23.216113+00
774	night	22	6	12.00	2026-04-30 08:24:23.216113+00
775	morning	6	14	10.00	2026-04-30 08:39:40.686725+00
776	evening	14	22	15.00	2026-04-30 08:39:40.686725+00
777	night	22	6	12.00	2026-04-30 08:39:40.686725+00
778	morning	6	14	10.00	2026-04-30 08:39:41.046598+00
779	evening	14	22	15.00	2026-04-30 08:39:41.046598+00
780	night	22	6	12.00	2026-04-30 08:39:41.046598+00
781	morning	6	14	10.00	2026-04-30 16:59:36.711035+00
782	evening	14	22	15.00	2026-04-30 16:59:36.711035+00
783	night	22	6	12.00	2026-04-30 16:59:36.711035+00
784	morning	6	14	10.00	2026-04-30 16:59:37.062018+00
785	evening	14	22	15.00	2026-04-30 16:59:37.062018+00
786	night	22	6	12.00	2026-04-30 16:59:37.062018+00
787	morning	6	14	10.00	2026-04-30 16:59:46.004985+00
788	evening	14	22	15.00	2026-04-30 16:59:46.004985+00
789	night	22	6	12.00	2026-04-30 16:59:46.004985+00
790	morning	6	14	10.00	2026-04-30 16:59:46.853316+00
791	evening	14	22	15.00	2026-04-30 16:59:46.853316+00
792	night	22	6	12.00	2026-04-30 16:59:46.853316+00
793	morning	6	14	10.00	2026-04-30 16:59:48.907854+00
794	evening	14	22	15.00	2026-04-30 16:59:48.907854+00
795	night	22	6	12.00	2026-04-30 16:59:48.907854+00
796	morning	6	14	10.00	2026-04-30 16:59:49.136887+00
797	evening	14	22	15.00	2026-04-30 16:59:49.136887+00
798	night	22	6	12.00	2026-04-30 16:59:49.136887+00
799	morning	6	14	10.00	2026-04-30 17:23:33.086576+00
800	evening	14	22	15.00	2026-04-30 17:23:33.086576+00
801	night	22	6	12.00	2026-04-30 17:23:33.086576+00
802	morning	6	14	10.00	2026-04-30 17:23:33.501381+00
803	evening	14	22	15.00	2026-04-30 17:23:33.501381+00
804	night	22	6	12.00	2026-04-30 17:23:33.501381+00
805	morning	6	14	10.00	2026-04-30 17:23:39.994003+00
806	evening	14	22	15.00	2026-04-30 17:23:39.994003+00
807	night	22	6	12.00	2026-04-30 17:23:39.994003+00
808	morning	6	14	10.00	2026-04-30 17:24:48.715769+00
809	evening	14	22	15.00	2026-04-30 17:24:48.715769+00
810	night	22	6	12.00	2026-04-30 17:24:48.715769+00
811	morning	6	14	10.00	2026-04-30 17:48:05.324308+00
812	evening	14	22	15.00	2026-04-30 17:48:05.324308+00
813	night	22	6	12.00	2026-04-30 17:48:05.324308+00
814	morning	6	14	10.00	2026-04-30 17:48:05.66742+00
815	evening	14	22	15.00	2026-04-30 17:48:05.66742+00
816	night	22	6	12.00	2026-04-30 17:48:05.66742+00
817	morning	6	14	10.00	2026-04-30 17:48:12.488328+00
818	evening	14	22	15.00	2026-04-30 17:48:12.488328+00
819	night	22	6	12.00	2026-04-30 17:48:12.488328+00
820	morning	6	14	10.00	2026-04-30 17:48:21.047891+00
821	evening	14	22	15.00	2026-04-30 17:48:21.047891+00
822	night	22	6	12.00	2026-04-30 17:48:21.047891+00
823	morning	6	14	10.00	2026-04-30 17:48:32.25506+00
824	evening	14	22	15.00	2026-04-30 17:48:32.25506+00
825	night	22	6	12.00	2026-04-30 17:48:32.25506+00
826	morning	6	14	10.00	2026-04-30 17:49:24.014424+00
827	evening	14	22	15.00	2026-04-30 17:49:24.014424+00
828	night	22	6	12.00	2026-04-30 17:49:24.014424+00
829	morning	6	14	10.00	2026-04-30 17:50:08.056046+00
830	evening	14	22	15.00	2026-04-30 17:50:08.056046+00
831	night	22	6	12.00	2026-04-30 17:50:08.056046+00
832	morning	6	14	10.00	2026-04-30 18:20:59.752994+00
833	evening	14	22	15.00	2026-04-30 18:20:59.752994+00
834	night	22	6	12.00	2026-04-30 18:20:59.752994+00
835	morning	6	14	10.00	2026-04-30 18:20:59.996951+00
836	evening	14	22	15.00	2026-04-30 18:20:59.996951+00
837	night	22	6	12.00	2026-04-30 18:20:59.996951+00
838	morning	6	14	10.00	2026-04-30 18:21:29.322915+00
839	evening	14	22	15.00	2026-04-30 18:21:29.322915+00
840	night	22	6	12.00	2026-04-30 18:21:29.322915+00
841	morning	6	14	10.00	2026-04-30 18:22:32.57848+00
842	evening	14	22	15.00	2026-04-30 18:22:32.57848+00
843	night	22	6	12.00	2026-04-30 18:22:32.57848+00
844	morning	6	14	10.00	2026-04-30 18:35:27.462903+00
845	evening	14	22	15.00	2026-04-30 18:35:27.462903+00
846	night	22	6	12.00	2026-04-30 18:35:27.462903+00
847	morning	6	14	10.00	2026-04-30 18:35:27.767996+00
848	evening	14	22	15.00	2026-04-30 18:35:27.767996+00
849	night	22	6	12.00	2026-04-30 18:35:27.767996+00
850	morning	6	14	10.00	2026-04-30 18:36:02.150005+00
851	evening	14	22	15.00	2026-04-30 18:36:02.150005+00
852	night	22	6	12.00	2026-04-30 18:36:02.150005+00
853	morning	6	14	10.00	2026-04-30 18:36:09.76356+00
854	evening	14	22	15.00	2026-04-30 18:36:09.76356+00
855	night	22	6	12.00	2026-04-30 18:36:09.76356+00
856	morning	6	14	10.00	2026-04-30 18:36:23.703173+00
857	evening	14	22	15.00	2026-04-30 18:36:23.703173+00
858	night	22	6	12.00	2026-04-30 18:36:23.703173+00
859	morning	6	14	10.00	2026-04-30 21:51:50.388545+00
860	evening	14	22	15.00	2026-04-30 21:51:50.388545+00
861	night	22	6	12.00	2026-04-30 21:51:50.388545+00
862	morning	6	14	10.00	2026-04-30 21:51:58.834238+00
863	evening	14	22	15.00	2026-04-30 21:51:58.834238+00
864	night	22	6	12.00	2026-04-30 21:51:58.834238+00
865	morning	6	14	10.00	2026-04-30 21:51:58.989974+00
866	evening	14	22	15.00	2026-04-30 21:51:58.989974+00
867	night	22	6	12.00	2026-04-30 21:51:58.989974+00
868	morning	6	14	10.00	2026-04-30 21:51:59.195567+00
869	evening	14	22	15.00	2026-04-30 21:51:59.195567+00
870	night	22	6	12.00	2026-04-30 21:51:59.195567+00
871	morning	6	14	10.00	2026-04-30 22:12:14.254999+00
872	evening	14	22	15.00	2026-04-30 22:12:14.254999+00
873	night	22	6	12.00	2026-04-30 22:12:14.254999+00
874	morning	6	14	10.00	2026-04-30 22:12:43.181716+00
875	evening	14	22	15.00	2026-04-30 22:12:43.181716+00
876	night	22	6	12.00	2026-04-30 22:12:43.181716+00
877	morning	6	14	10.00	2026-04-30 22:12:43.188948+00
878	evening	14	22	15.00	2026-04-30 22:12:43.188948+00
879	night	22	6	12.00	2026-04-30 22:12:43.188948+00
880	morning	6	14	10.00	2026-04-30 22:12:43.430821+00
881	evening	14	22	15.00	2026-04-30 22:12:43.430821+00
882	night	22	6	12.00	2026-04-30 22:12:43.430821+00
883	morning	6	14	10.00	2026-05-01 11:33:01.498658+00
885	morning	6	14	10.00	2026-05-01 11:33:01.457264+00
887	evening	14	22	15.00	2026-05-01 11:33:01.457264+00
888	night	22	6	12.00	2026-05-01 11:33:01.457264+00
886	morning	6	14	10.00	2026-05-01 11:33:01.499065+00
889	evening	14	22	15.00	2026-05-01 11:33:01.499065+00
890	night	22	6	12.00	2026-05-01 11:33:01.499065+00
891	evening	14	22	15.00	2026-05-01 11:33:01.498658+00
892	night	22	6	12.00	2026-05-01 11:33:01.498658+00
884	morning	6	14	10.00	2026-05-01 11:33:01.498934+00
893	evening	14	22	15.00	2026-05-01 11:33:01.498934+00
894	night	22	6	12.00	2026-05-01 11:33:01.498934+00
895	morning	6	14	10.00	2026-05-01 11:43:53.18303+00
896	evening	14	22	15.00	2026-05-01 11:43:53.18303+00
897	night	22	6	12.00	2026-05-01 11:43:53.18303+00
898	morning	6	14	10.00	2026-05-01 13:09:20.515001+00
899	evening	14	22	15.00	2026-05-01 13:09:20.515001+00
900	night	22	6	12.00	2026-05-01 13:09:20.515001+00
901	morning	6	14	10.00	2026-05-01 13:09:29.617353+00
902	evening	14	22	15.00	2026-05-01 13:09:29.617353+00
903	night	22	6	12.00	2026-05-01 13:09:29.617353+00
904	morning	6	14	10.00	2026-05-01 13:09:29.620141+00
905	evening	14	22	15.00	2026-05-01 13:09:29.620141+00
906	night	22	6	12.00	2026-05-01 13:09:29.620141+00
907	morning	6	14	10.00	2026-05-01 14:56:50.267049+00
908	evening	14	22	15.00	2026-05-01 14:56:50.267049+00
909	night	22	6	12.00	2026-05-01 14:56:50.267049+00
910	morning	6	14	10.00	2026-05-01 14:56:50.89091+00
911	evening	14	22	15.00	2026-05-01 14:56:50.89091+00
912	night	22	6	12.00	2026-05-01 14:56:50.89091+00
913	morning	6	14	10.00	2026-05-01 14:57:07.899787+00
914	evening	14	22	15.00	2026-05-01 14:57:07.899787+00
915	night	22	6	12.00	2026-05-01 14:57:07.899787+00
916	morning	6	14	10.00	2026-05-01 14:57:16.293839+00
917	evening	14	22	15.00	2026-05-01 14:57:16.293839+00
918	night	22	6	12.00	2026-05-01 14:57:16.293839+00
919	morning	6	14	10.00	2026-05-01 14:57:17.181158+00
920	evening	14	22	15.00	2026-05-01 14:57:17.181158+00
921	night	22	6	12.00	2026-05-01 14:57:17.181158+00
922	morning	6	14	10.00	2026-05-01 16:11:00.875371+00
923	evening	14	22	15.00	2026-05-01 16:11:00.875371+00
924	night	22	6	12.00	2026-05-01 16:11:00.875371+00
925	morning	6	14	10.00	2026-05-01 16:11:00.902341+00
926	evening	14	22	15.00	2026-05-01 16:11:00.902341+00
927	night	22	6	12.00	2026-05-01 16:11:00.902341+00
928	morning	6	14	10.00	2026-05-01 16:11:06.514028+00
929	evening	14	22	15.00	2026-05-01 16:11:06.514028+00
930	night	22	6	12.00	2026-05-01 16:11:06.514028+00
931	morning	6	14	10.00	2026-05-01 16:11:07.068694+00
932	evening	14	22	15.00	2026-05-01 16:11:07.068694+00
933	night	22	6	12.00	2026-05-01 16:11:07.068694+00
934	morning	6	14	10.00	2026-05-01 22:04:40.323209+00
935	evening	14	22	15.00	2026-05-01 22:04:40.323209+00
936	night	22	6	12.00	2026-05-01 22:04:40.323209+00
937	morning	6	14	10.00	2026-05-01 22:05:06.159304+00
938	evening	14	22	15.00	2026-05-01 22:05:06.159304+00
939	night	22	6	12.00	2026-05-01 22:05:06.159304+00
940	morning	6	14	10.00	2026-05-01 22:05:06.163109+00
941	evening	14	22	15.00	2026-05-01 22:05:06.163109+00
942	night	22	6	12.00	2026-05-01 22:05:06.163109+00
943	morning	6	14	10.00	2026-05-02 14:29:24.598673+00
944	evening	14	22	15.00	2026-05-02 14:29:24.598673+00
945	night	22	6	12.00	2026-05-02 14:29:24.598673+00
946	morning	6	14	10.00	2026-05-02 14:29:28.250171+00
947	evening	14	22	15.00	2026-05-02 14:29:28.250171+00
948	night	22	6	12.00	2026-05-02 14:29:28.250171+00
949	morning	6	14	10.00	2026-05-02 14:29:30.639991+00
950	evening	14	22	15.00	2026-05-02 14:29:30.639991+00
951	night	22	6	12.00	2026-05-02 14:29:30.639991+00
952	morning	6	14	10.00	2026-05-02 15:48:29.8461+00
953	evening	14	22	15.00	2026-05-02 15:48:29.8461+00
954	night	22	6	12.00	2026-05-02 15:48:29.8461+00
955	morning	6	14	10.00	2026-05-02 15:48:30.051073+00
956	evening	14	22	15.00	2026-05-02 15:48:30.051073+00
957	night	22	6	12.00	2026-05-02 15:48:30.051073+00
958	morning	6	14	10.00	2026-05-02 15:48:30.598174+00
959	evening	14	22	15.00	2026-05-02 15:48:30.598174+00
960	night	22	6	12.00	2026-05-02 15:48:30.598174+00
961	morning	6	14	10.00	2026-05-02 15:48:30.675518+00
962	evening	14	22	15.00	2026-05-02 15:48:30.675518+00
963	night	22	6	12.00	2026-05-02 15:48:30.675518+00
964	morning	6	14	10.00	2026-05-02 15:58:32.435197+00
965	evening	14	22	15.00	2026-05-02 15:58:32.435197+00
966	night	22	6	12.00	2026-05-02 15:58:32.435197+00
967	morning	6	14	10.00	2026-05-02 21:45:13.252758+00
968	evening	14	22	15.00	2026-05-02 21:45:13.252758+00
969	night	22	6	12.00	2026-05-02 21:45:13.252758+00
970	morning	6	14	10.00	2026-05-02 21:45:13.709165+00
971	evening	14	22	15.00	2026-05-02 21:45:13.709165+00
972	night	22	6	12.00	2026-05-02 21:45:13.709165+00
973	morning	6	14	10.00	2026-05-02 21:45:32.397171+00
974	evening	14	22	15.00	2026-05-02 21:45:32.397171+00
975	night	22	6	12.00	2026-05-02 21:45:32.397171+00
976	morning	6	14	10.00	2026-05-02 21:45:51.680652+00
977	evening	14	22	15.00	2026-05-02 21:45:51.680652+00
978	night	22	6	12.00	2026-05-02 21:45:51.680652+00
979	morning	6	14	10.00	2026-05-02 21:49:23.335864+00
980	evening	14	22	15.00	2026-05-02 21:49:23.335864+00
981	night	22	6	12.00	2026-05-02 21:49:23.335864+00
982	morning	6	14	10.00	2026-05-02 21:49:24.082355+00
983	evening	14	22	15.00	2026-05-02 21:49:24.082355+00
984	night	22	6	12.00	2026-05-02 21:49:24.082355+00
985	morning	6	14	10.00	2026-05-02 21:58:31.103293+00
986	evening	14	22	15.00	2026-05-02 21:58:31.103293+00
987	night	22	6	12.00	2026-05-02 21:58:31.103293+00
988	morning	6	14	10.00	2026-05-02 21:58:59.906642+00
989	evening	14	22	15.00	2026-05-02 21:58:59.906642+00
990	night	22	6	12.00	2026-05-02 21:58:59.906642+00
991	morning	6	14	10.00	2026-05-02 21:59:00.711349+00
992	evening	14	22	15.00	2026-05-02 21:59:00.711349+00
993	night	22	6	12.00	2026-05-02 21:59:00.711349+00
994	morning	6	14	10.00	2026-05-02 21:59:00.939112+00
995	evening	14	22	15.00	2026-05-02 21:59:00.939112+00
996	night	22	6	12.00	2026-05-02 21:59:00.939112+00
997	morning	6	14	10.00	2026-05-02 22:12:12.287352+00
998	evening	14	22	15.00	2026-05-02 22:12:12.287352+00
999	night	22	6	12.00	2026-05-02 22:12:12.287352+00
1000	morning	6	14	10.00	2026-05-02 22:12:25.542185+00
1001	evening	14	22	15.00	2026-05-02 22:12:25.542185+00
1002	night	22	6	12.00	2026-05-02 22:12:25.542185+00
1003	morning	6	14	10.00	2026-05-02 22:13:44.026489+00
1004	evening	14	22	15.00	2026-05-02 22:13:44.026489+00
1005	night	22	6	12.00	2026-05-02 22:13:44.026489+00
1006	morning	6	14	10.00	2026-05-02 22:14:32.319132+00
1007	evening	14	22	15.00	2026-05-02 22:14:32.319132+00
1008	night	22	6	12.00	2026-05-02 22:14:32.319132+00
1009	morning	6	14	10.00	2026-05-03 05:32:13.785131+00
1010	evening	14	22	15.00	2026-05-03 05:32:13.785131+00
1011	night	22	6	12.00	2026-05-03 05:32:13.785131+00
1012	morning	6	14	10.00	2026-05-03 05:32:27.74324+00
1013	evening	14	22	15.00	2026-05-03 05:32:27.74324+00
1014	night	22	6	12.00	2026-05-03 05:32:27.74324+00
1015	morning	6	14	10.00	2026-05-03 05:32:35.826253+00
1016	evening	14	22	15.00	2026-05-03 05:32:35.826253+00
1017	night	22	6	12.00	2026-05-03 05:32:35.826253+00
1018	morning	6	14	10.00	2026-05-03 05:32:36.698114+00
1019	evening	14	22	15.00	2026-05-03 05:32:36.698114+00
1020	night	22	6	12.00	2026-05-03 05:32:36.698114+00
1021	morning	6	14	10.00	2026-05-03 05:58:44.011469+00
1022	evening	14	22	15.00	2026-05-03 05:58:44.011469+00
1023	night	22	6	12.00	2026-05-03 05:58:44.011469+00
1024	morning	6	14	10.00	2026-05-03 06:00:49.721158+00
1025	evening	14	22	15.00	2026-05-03 06:00:49.721158+00
1026	night	22	6	12.00	2026-05-03 06:00:49.721158+00
1027	morning	6	14	10.00	2026-05-03 06:09:49.404809+00
1028	evening	14	22	15.00	2026-05-03 06:09:49.404809+00
1029	night	22	6	12.00	2026-05-03 06:09:49.404809+00
1030	morning	6	14	10.00	2026-05-03 06:11:56.175077+00
1031	evening	14	22	15.00	2026-05-03 06:11:56.175077+00
1032	night	22	6	12.00	2026-05-03 06:11:56.175077+00
1033	morning	6	14	10.00	2026-05-03 06:13:36.813155+00
1034	evening	14	22	15.00	2026-05-03 06:13:36.813155+00
1035	night	22	6	12.00	2026-05-03 06:13:36.813155+00
1036	morning	6	14	10.00	2026-05-03 13:03:55.690786+00
1037	evening	14	22	15.00	2026-05-03 13:03:55.690786+00
1038	night	22	6	12.00	2026-05-03 13:03:55.690786+00
1039	morning	6	14	10.00	2026-05-03 13:03:55.98067+00
1040	evening	14	22	15.00	2026-05-03 13:03:55.98067+00
1041	night	22	6	12.00	2026-05-03 13:03:55.98067+00
1042	morning	6	14	10.00	2026-05-03 13:04:16.703954+00
1043	evening	14	22	15.00	2026-05-03 13:04:16.703954+00
1044	night	22	6	12.00	2026-05-03 13:04:16.703954+00
1045	morning	6	14	10.00	2026-05-03 13:04:26.288145+00
1046	evening	14	22	15.00	2026-05-03 13:04:26.288145+00
1047	night	22	6	12.00	2026-05-03 13:04:26.288145+00
1048	morning	6	14	10.00	2026-05-03 13:05:15.17952+00
1049	evening	14	22	15.00	2026-05-03 13:05:15.17952+00
1050	night	22	6	12.00	2026-05-03 13:05:15.17952+00
1051	morning	6	14	10.00	2026-05-03 13:05:24.601812+00
1052	evening	14	22	15.00	2026-05-03 13:05:24.601812+00
1053	night	22	6	12.00	2026-05-03 13:05:24.601812+00
1054	morning	6	14	10.00	2026-05-03 13:06:13.295139+00
1055	evening	14	22	15.00	2026-05-03 13:06:13.295139+00
1056	night	22	6	12.00	2026-05-03 13:06:13.295139+00
1057	morning	6	14	10.00	2026-05-03 13:16:57.24957+00
1058	evening	14	22	15.00	2026-05-03 13:16:57.24957+00
1059	night	22	6	12.00	2026-05-03 13:16:57.24957+00
1060	morning	6	14	10.00	2026-05-03 13:16:57.511483+00
1061	evening	14	22	15.00	2026-05-03 13:16:57.511483+00
1062	night	22	6	12.00	2026-05-03 13:16:57.511483+00
1063	morning	6	14	10.00	2026-05-03 13:18:24.711384+00
1064	evening	14	22	15.00	2026-05-03 13:18:24.711384+00
1065	night	22	6	12.00	2026-05-03 13:18:24.711384+00
1066	morning	6	14	10.00	2026-05-03 13:18:34.333195+00
1067	evening	14	22	15.00	2026-05-03 13:18:34.333195+00
1068	night	22	6	12.00	2026-05-03 13:18:34.333195+00
1069	morning	6	14	10.00	2026-05-03 13:31:39.979587+00
1070	evening	14	22	15.00	2026-05-03 13:31:39.979587+00
1071	night	22	6	12.00	2026-05-03 13:31:39.979587+00
1072	morning	6	14	10.00	2026-05-03 13:32:15.753105+00
1073	evening	14	22	15.00	2026-05-03 13:32:15.753105+00
1074	night	22	6	12.00	2026-05-03 13:32:15.753105+00
1075	morning	6	14	10.00	2026-05-03 13:41:11.028033+00
1076	evening	14	22	15.00	2026-05-03 13:41:11.028033+00
1077	night	22	6	12.00	2026-05-03 13:41:11.028033+00
1078	morning	6	14	10.00	2026-05-03 13:41:33.879323+00
1079	evening	14	22	15.00	2026-05-03 13:41:33.879323+00
1080	night	22	6	12.00	2026-05-03 13:41:33.879323+00
1081	morning	6	14	10.00	2026-05-03 13:41:44.779956+00
1083	evening	14	22	15.00	2026-05-03 13:41:44.779956+00
1084	night	22	6	12.00	2026-05-03 13:41:44.779956+00
1243	morning	6	14	10.00	2026-05-07 15:14:21.384823+00
1244	evening	14	22	15.00	2026-05-07 15:14:21.384823+00
1245	night	22	6	12.00	2026-05-07 15:14:21.384823+00
1249	morning	6	14	10.00	2026-05-07 15:14:40.694832+00
1250	evening	14	22	15.00	2026-05-07 15:14:40.694832+00
1251	night	22	6	12.00	2026-05-07 15:14:40.694832+00
1255	morning	6	14	10.00	2026-05-07 15:16:10.538583+00
1256	evening	14	22	15.00	2026-05-07 15:16:10.538583+00
1257	night	22	6	12.00	2026-05-07 15:16:10.538583+00
1261	morning	6	14	10.00	2026-05-07 15:16:15.126492+00
1262	evening	14	22	15.00	2026-05-07 15:16:15.126492+00
1263	night	22	6	12.00	2026-05-07 15:16:15.126492+00
1267	morning	6	14	10.00	2026-05-07 15:16:58.111095+00
1268	evening	14	22	15.00	2026-05-07 15:16:58.111095+00
1269	night	22	6	12.00	2026-05-07 15:16:58.111095+00
1270	morning	6	14	10.00	2026-05-07 15:35:29.037523+00
1271	evening	14	22	15.00	2026-05-07 15:35:29.037523+00
1272	night	22	6	12.00	2026-05-07 15:35:29.037523+00
1276	morning	6	14	10.00	2026-05-07 15:36:15.849392+00
1277	evening	14	22	15.00	2026-05-07 15:36:15.849392+00
1278	night	22	6	12.00	2026-05-07 15:36:15.849392+00
1282	morning	6	14	10.00	2026-05-07 15:36:35.364911+00
1283	evening	14	22	15.00	2026-05-07 15:36:35.364911+00
1284	night	22	6	12.00	2026-05-07 15:36:35.364911+00
1288	morning	6	14	10.00	2026-05-07 22:24:02.398254+00
1289	evening	14	22	15.00	2026-05-07 22:24:02.398254+00
1290	night	22	6	12.00	2026-05-07 22:24:02.398254+00
1294	morning	6	14	10.00	2026-05-07 22:24:08.754265+00
1295	evening	14	22	15.00	2026-05-07 22:24:08.754265+00
1296	night	22	6	12.00	2026-05-07 22:24:08.754265+00
1300	morning	6	14	10.00	2026-05-07 22:24:08.853692+00
1301	evening	14	22	15.00	2026-05-07 22:24:08.853692+00
1302	night	22	6	12.00	2026-05-07 22:24:08.853692+00
1306	morning	6	14	10.00	2026-05-07 22:30:10.697341+00
1307	evening	14	22	15.00	2026-05-07 22:30:10.697341+00
1308	night	22	6	12.00	2026-05-07 22:30:10.697341+00
1312	morning	6	14	10.00	2026-05-08 14:20:05.861718+00
1313	evening	14	22	15.00	2026-05-08 14:20:05.861718+00
1314	night	22	6	12.00	2026-05-08 14:20:05.861718+00
1318	morning	6	14	10.00	2026-05-08 14:20:06.199905+00
1319	evening	14	22	15.00	2026-05-08 14:20:06.199905+00
1320	night	22	6	12.00	2026-05-08 14:20:06.199905+00
1324	morning	6	14	10.00	2026-05-08 14:26:18.83121+00
1325	evening	14	22	15.00	2026-05-08 14:26:18.83121+00
1326	night	22	6	12.00	2026-05-08 14:26:18.83121+00
1327	morning	6	14	10.00	2026-05-09 00:07:59.332838+00
1328	evening	14	22	15.00	2026-05-09 00:07:59.332838+00
1329	night	22	6	12.00	2026-05-09 00:07:59.332838+00
1333	morning	6	14	10.00	2026-05-09 00:08:17.445485+00
1334	evening	14	22	15.00	2026-05-09 00:08:17.445485+00
1335	night	22	6	12.00	2026-05-09 00:08:17.445485+00
1339	morning	6	14	10.00	2026-05-09 00:08:24.470768+00
1340	evening	14	22	15.00	2026-05-09 00:08:24.470768+00
1341	night	22	6	12.00	2026-05-09 00:08:24.470768+00
1345	morning	6	14	10.00	2026-05-09 00:14:02.212249+00
1346	evening	14	22	15.00	2026-05-09 00:14:02.212249+00
1347	night	22	6	12.00	2026-05-09 00:14:02.212249+00
1351	morning	6	14	10.00	2026-05-09 00:14:11.661777+00
1352	evening	14	22	15.00	2026-05-09 00:14:11.661777+00
1353	night	22	6	12.00	2026-05-09 00:14:11.661777+00
1357	morning	6	14	10.00	2026-05-09 10:29:49.696314+00
1358	evening	14	22	15.00	2026-05-09 10:29:49.696314+00
1359	night	22	6	12.00	2026-05-09 10:29:49.696314+00
1360	morning	6	14	10.00	2026-05-09 11:52:58.907881+00
1361	evening	14	22	15.00	2026-05-09 11:52:58.907881+00
1362	night	22	6	12.00	2026-05-09 11:52:58.907881+00
1363	morning	6	14	10.00	2026-05-09 13:10:36.846012+00
1364	evening	14	22	15.00	2026-05-09 13:10:36.846012+00
1365	night	22	6	12.00	2026-05-09 13:10:36.846012+00
1369	morning	6	14	10.00	2026-05-09 13:11:07.888433+00
1370	evening	14	22	15.00	2026-05-09 13:11:07.888433+00
1371	night	22	6	12.00	2026-05-09 13:11:07.888433+00
1375	morning	6	14	10.00	2026-05-09 13:11:29.679399+00
1376	evening	14	22	15.00	2026-05-09 13:11:29.679399+00
1377	night	22	6	12.00	2026-05-09 13:11:29.679399+00
1381	morning	6	14	10.00	2026-05-09 14:59:35.968413+00
1382	evening	14	22	15.00	2026-05-09 14:59:35.968413+00
1383	night	22	6	12.00	2026-05-09 14:59:35.968413+00
1387	morning	6	14	10.00	2026-05-09 14:59:52.88248+00
1388	evening	14	22	15.00	2026-05-09 14:59:52.88248+00
1389	night	22	6	12.00	2026-05-09 14:59:52.88248+00
1393	morning	6	14	10.00	2026-05-09 15:25:49.075085+00
1394	evening	14	22	15.00	2026-05-09 15:25:49.075085+00
1395	night	22	6	12.00	2026-05-09 15:25:49.075085+00
1399	morning	6	14	10.00	2026-05-09 15:25:49.631568+00
1400	evening	14	22	15.00	2026-05-09 15:25:49.631568+00
1401	night	22	6	12.00	2026-05-09 15:25:49.631568+00
1405	morning	6	14	10.00	2026-05-09 15:51:42.165694+00
1406	evening	14	22	15.00	2026-05-09 15:51:42.165694+00
1407	night	22	6	12.00	2026-05-09 15:51:42.165694+00
1409	morning	6	14	10.00	2026-05-09 15:51:42.5379+00
1410	evening	14	22	15.00	2026-05-09 15:51:42.5379+00
1411	night	22	6	12.00	2026-05-09 15:51:42.5379+00
1417	morning	6	14	10.00	2026-05-09 16:08:52.765768+00
1418	evening	14	22	15.00	2026-05-09 16:08:52.765768+00
1419	night	22	6	12.00	2026-05-09 16:08:52.765768+00
1420	morning	6	14	10.00	2026-05-09 16:15:04.474344+00
1421	evening	14	22	15.00	2026-05-09 16:15:04.474344+00
1422	night	22	6	12.00	2026-05-09 16:15:04.474344+00
1423	morning	6	14	10.00	2026-05-09 16:30:08.64576+00
1424	evening	14	22	15.00	2026-05-09 16:30:08.64576+00
1425	night	22	6	12.00	2026-05-09 16:30:08.64576+00
1426	morning	6	14	10.00	2026-05-09 16:47:33.195493+00
1427	evening	14	22	15.00	2026-05-09 16:47:33.195493+00
1428	night	22	6	12.00	2026-05-09 16:47:33.195493+00
1429	morning	6	14	10.00	2026-05-09 16:52:34.194143+00
1430	evening	14	22	15.00	2026-05-09 16:52:34.194143+00
1431	night	22	6	12.00	2026-05-09 16:52:34.194143+00
1432	morning	6	14	10.00	2026-05-09 16:52:34.207628+00
1433	evening	14	22	15.00	2026-05-09 16:52:34.207628+00
1434	night	22	6	12.00	2026-05-09 16:52:34.207628+00
1435	morning	6	14	10.00	2026-05-09 16:56:34.431688+00
1436	evening	14	22	15.00	2026-05-09 16:56:34.431688+00
1437	night	22	6	12.00	2026-05-09 16:56:34.431688+00
1438	morning	6	14	10.00	2026-05-09 18:12:41.854477+00
1439	evening	14	22	15.00	2026-05-09 18:12:41.854477+00
1440	night	22	6	12.00	2026-05-09 18:12:41.854477+00
1082	morning	6	14	10.00	2026-05-03 13:41:44.781139+00
1085	evening	14	22	15.00	2026-05-03 13:41:44.781139+00
1086	night	22	6	12.00	2026-05-03 13:41:44.781139+00
1087	morning	6	14	10.00	2026-05-03 13:41:49.564839+00
1088	evening	14	22	15.00	2026-05-03 13:41:49.564839+00
1089	night	22	6	12.00	2026-05-03 13:41:49.564839+00
1090	morning	6	14	10.00	2026-05-03 13:51:54.420164+00
1091	evening	14	22	15.00	2026-05-03 13:51:54.420164+00
1092	night	22	6	12.00	2026-05-03 13:51:54.420164+00
1093	morning	6	14	10.00	2026-05-03 18:01:11.656686+00
1094	evening	14	22	15.00	2026-05-03 18:01:11.656686+00
1095	night	22	6	12.00	2026-05-03 18:01:11.656686+00
1096	morning	6	14	10.00	2026-05-03 18:01:35.400122+00
1097	evening	14	22	15.00	2026-05-03 18:01:35.400122+00
1098	night	22	6	12.00	2026-05-03 18:01:35.400122+00
1099	morning	6	14	10.00	2026-05-03 18:01:35.411528+00
1100	evening	14	22	15.00	2026-05-03 18:01:35.411528+00
1101	night	22	6	12.00	2026-05-03 18:01:35.411528+00
1102	morning	6	14	10.00	2026-05-03 18:03:48.700515+00
1103	evening	14	22	15.00	2026-05-03 18:03:48.700515+00
1104	night	22	6	12.00	2026-05-03 18:03:48.700515+00
1105	morning	6	14	10.00	2026-05-03 18:35:29.835761+00
1106	evening	14	22	15.00	2026-05-03 18:35:29.835761+00
1107	night	22	6	12.00	2026-05-03 18:35:29.835761+00
1108	morning	6	14	10.00	2026-05-03 18:36:32.705778+00
1109	evening	14	22	15.00	2026-05-03 18:36:32.705778+00
1110	night	22	6	12.00	2026-05-03 18:36:32.705778+00
1111	morning	6	14	10.00	2026-05-03 18:36:33.502842+00
1112	evening	14	22	15.00	2026-05-03 18:36:33.502842+00
1113	night	22	6	12.00	2026-05-03 18:36:33.502842+00
1114	morning	6	14	10.00	2026-05-03 18:36:52.66407+00
1115	evening	14	22	15.00	2026-05-03 18:36:52.66407+00
1116	night	22	6	12.00	2026-05-03 18:36:52.66407+00
1117	morning	6	14	10.00	2026-05-03 20:50:23.007219+00
1118	evening	14	22	15.00	2026-05-03 20:50:23.007219+00
1119	night	22	6	12.00	2026-05-03 20:50:23.007219+00
1120	morning	6	14	10.00	2026-05-03 23:17:35.803782+00
1121	evening	14	22	15.00	2026-05-03 23:17:35.803782+00
1122	night	22	6	12.00	2026-05-03 23:17:35.803782+00
1123	morning	6	14	10.00	2026-05-03 23:17:56.303289+00
1124	evening	14	22	15.00	2026-05-03 23:17:56.303289+00
1125	night	22	6	12.00	2026-05-03 23:17:56.303289+00
1126	morning	6	14	10.00	2026-05-03 23:18:23.443783+00
1127	evening	14	22	15.00	2026-05-03 23:18:23.443783+00
1128	night	22	6	12.00	2026-05-03 23:18:23.443783+00
1129	morning	6	14	10.00	2026-05-03 23:18:28.547049+00
1130	evening	14	22	15.00	2026-05-03 23:18:28.547049+00
1131	night	22	6	12.00	2026-05-03 23:18:28.547049+00
1132	morning	6	14	10.00	2026-05-04 06:29:11.803578+00
1133	evening	14	22	15.00	2026-05-04 06:29:11.803578+00
1134	night	22	6	12.00	2026-05-04 06:29:11.803578+00
1135	morning	6	14	10.00	2026-05-04 06:31:21.984659+00
1136	evening	14	22	15.00	2026-05-04 06:31:21.984659+00
1137	night	22	6	12.00	2026-05-04 06:31:21.984659+00
1138	morning	6	14	10.00	2026-05-04 06:48:35.091291+00
1139	evening	14	22	15.00	2026-05-04 06:48:35.091291+00
1140	night	22	6	12.00	2026-05-04 06:48:35.091291+00
1141	morning	6	14	10.00	2026-05-04 06:49:24.718154+00
1142	evening	14	22	15.00	2026-05-04 06:49:24.718154+00
1143	night	22	6	12.00	2026-05-04 06:49:24.718154+00
1144	morning	6	14	10.00	2026-05-04 06:49:24.840856+00
1145	evening	14	22	15.00	2026-05-04 06:49:24.840856+00
1146	night	22	6	12.00	2026-05-04 06:49:24.840856+00
1147	morning	6	14	10.00	2026-05-04 06:49:33.632376+00
1148	evening	14	22	15.00	2026-05-04 06:49:33.632376+00
1149	night	22	6	12.00	2026-05-04 06:49:33.632376+00
1150	morning	6	14	10.00	2026-05-05 21:37:33.622839+00
1151	evening	14	22	15.00	2026-05-05 21:37:33.622839+00
1152	night	22	6	12.00	2026-05-05 21:37:33.622839+00
1153	morning	6	14	10.00	2026-05-05 21:38:43.168947+00
1154	evening	14	22	15.00	2026-05-05 21:38:43.168947+00
1155	night	22	6	12.00	2026-05-05 21:38:43.168947+00
1156	morning	6	14	10.00	2026-05-05 21:38:57.430279+00
1157	evening	14	22	15.00	2026-05-05 21:38:57.430279+00
1158	night	22	6	12.00	2026-05-05 21:38:57.430279+00
1159	morning	6	14	10.00	2026-05-05 21:38:57.531449+00
1160	evening	14	22	15.00	2026-05-05 21:38:57.531449+00
1161	night	22	6	12.00	2026-05-05 21:38:57.531449+00
1162	morning	6	14	10.00	2026-05-06 10:42:50.72564+00
1163	evening	14	22	15.00	2026-05-06 10:42:50.72564+00
1164	night	22	6	12.00	2026-05-06 10:42:50.72564+00
1165	morning	6	14	10.00	2026-05-06 10:42:50.98948+00
1166	evening	14	22	15.00	2026-05-06 10:42:50.98948+00
1167	night	22	6	12.00	2026-05-06 10:42:50.98948+00
1168	morning	6	14	10.00	2026-05-06 10:43:09.322701+00
1169	evening	14	22	15.00	2026-05-06 10:43:09.322701+00
1170	night	22	6	12.00	2026-05-06 10:43:09.322701+00
1171	morning	6	14	10.00	2026-05-06 10:43:17.842819+00
1172	evening	14	22	15.00	2026-05-06 10:43:17.842819+00
1173	night	22	6	12.00	2026-05-06 10:43:17.842819+00
1174	morning	6	14	10.00	2026-05-06 10:45:38.469852+00
1175	evening	14	22	15.00	2026-05-06 10:45:38.469852+00
1176	night	22	6	12.00	2026-05-06 10:45:38.469852+00
1177	morning	6	14	10.00	2026-05-06 10:46:53.843999+00
1178	evening	14	22	15.00	2026-05-06 10:46:53.843999+00
1179	night	22	6	12.00	2026-05-06 10:46:53.843999+00
1180	morning	6	14	10.00	2026-05-06 11:02:58.013097+00
1181	evening	14	22	15.00	2026-05-06 11:02:58.013097+00
1182	night	22	6	12.00	2026-05-06 11:02:58.013097+00
1183	morning	6	14	10.00	2026-05-06 11:02:58.101249+00
1184	evening	14	22	15.00	2026-05-06 11:02:58.101249+00
1185	night	22	6	12.00	2026-05-06 11:02:58.101249+00
1186	morning	6	14	10.00	2026-05-06 11:05:46.284926+00
1187	evening	14	22	15.00	2026-05-06 11:05:46.284926+00
1188	night	22	6	12.00	2026-05-06 11:05:46.284926+00
1189	morning	6	14	10.00	2026-05-06 16:12:04.638895+00
1190	evening	14	22	15.00	2026-05-06 16:12:04.638895+00
1191	night	22	6	12.00	2026-05-06 16:12:04.638895+00
1192	morning	6	14	10.00	2026-05-06 16:12:23.410152+00
1193	evening	14	22	15.00	2026-05-06 16:12:23.410152+00
1194	night	22	6	12.00	2026-05-06 16:12:23.410152+00
1195	morning	6	14	10.00	2026-05-06 16:12:35.926043+00
1196	evening	14	22	15.00	2026-05-06 16:12:35.926043+00
1197	night	22	6	12.00	2026-05-06 16:12:35.926043+00
1198	morning	6	14	10.00	2026-05-06 16:16:33.679367+00
1199	evening	14	22	15.00	2026-05-06 16:16:33.679367+00
1200	night	22	6	12.00	2026-05-06 16:16:33.679367+00
1201	morning	6	14	10.00	2026-05-06 16:16:56.151224+00
1202	evening	14	22	15.00	2026-05-06 16:16:56.151224+00
1203	night	22	6	12.00	2026-05-06 16:16:56.151224+00
1204	morning	6	14	10.00	2026-05-06 16:18:33.358706+00
1205	evening	14	22	15.00	2026-05-06 16:18:33.358706+00
1206	night	22	6	12.00	2026-05-06 16:18:33.358706+00
1207	morning	6	14	10.00	2026-05-06 16:18:34.231277+00
1208	evening	14	22	15.00	2026-05-06 16:18:34.231277+00
1209	night	22	6	12.00	2026-05-06 16:18:34.231277+00
1210	morning	6	14	10.00	2026-05-06 17:56:19.75192+00
1211	evening	14	22	15.00	2026-05-06 17:56:19.75192+00
1212	night	22	6	12.00	2026-05-06 17:56:19.75192+00
1213	morning	6	14	10.00	2026-05-06 17:56:31.718355+00
1214	evening	14	22	15.00	2026-05-06 17:56:31.718355+00
1215	night	22	6	12.00	2026-05-06 17:56:31.718355+00
1216	morning	6	14	10.00	2026-05-06 17:56:32.04625+00
1217	evening	14	22	15.00	2026-05-06 17:56:32.04625+00
1218	night	22	6	12.00	2026-05-06 17:56:32.04625+00
1219	morning	6	14	10.00	2026-05-06 23:03:51.91317+00
1220	evening	14	22	15.00	2026-05-06 23:03:51.91317+00
1221	night	22	6	12.00	2026-05-06 23:03:51.91317+00
1222	morning	6	14	10.00	2026-05-06 23:46:05.849308+00
1223	evening	14	22	15.00	2026-05-06 23:46:05.849308+00
1224	night	22	6	12.00	2026-05-06 23:46:05.849308+00
1225	morning	6	14	10.00	2026-05-06 23:46:17.283971+00
1226	evening	14	22	15.00	2026-05-06 23:46:17.283971+00
1227	night	22	6	12.00	2026-05-06 23:46:17.283971+00
1228	morning	6	14	10.00	2026-05-06 23:46:17.318602+00
1229	evening	14	22	15.00	2026-05-06 23:46:17.318602+00
1230	night	22	6	12.00	2026-05-06 23:46:17.318602+00
1231	morning	6	14	10.00	2026-05-07 00:10:07.04404+00
1232	evening	14	22	15.00	2026-05-07 00:10:07.04404+00
1233	night	22	6	12.00	2026-05-07 00:10:07.04404+00
1234	morning	6	14	10.00	2026-05-07 00:11:48.389065+00
1235	evening	14	22	15.00	2026-05-07 00:11:48.389065+00
1236	night	22	6	12.00	2026-05-07 00:11:48.389065+00
1237	morning	6	14	10.00	2026-05-07 00:11:48.461299+00
1238	evening	14	22	15.00	2026-05-07 00:11:48.461299+00
1239	night	22	6	12.00	2026-05-07 00:11:48.461299+00
1240	morning	6	14	10.00	2026-05-07 00:12:29.179167+00
1241	evening	14	22	15.00	2026-05-07 00:12:29.179167+00
1242	night	22	6	12.00	2026-05-07 00:12:29.179167+00
1246	morning	6	14	10.00	2026-05-07 15:14:21.496808+00
1247	evening	14	22	15.00	2026-05-07 15:14:21.496808+00
1248	night	22	6	12.00	2026-05-07 15:14:21.496808+00
1252	morning	6	14	10.00	2026-05-07 15:16:01.537923+00
1253	evening	14	22	15.00	2026-05-07 15:16:01.537923+00
1254	night	22	6	12.00	2026-05-07 15:16:01.537923+00
1258	morning	6	14	10.00	2026-05-07 15:16:15.062434+00
1259	evening	14	22	15.00	2026-05-07 15:16:15.062434+00
1260	night	22	6	12.00	2026-05-07 15:16:15.062434+00
1264	morning	6	14	10.00	2026-05-07 15:16:20.460473+00
1265	evening	14	22	15.00	2026-05-07 15:16:20.460473+00
1266	night	22	6	12.00	2026-05-07 15:16:20.460473+00
1273	morning	6	14	10.00	2026-05-07 15:35:29.304439+00
1274	evening	14	22	15.00	2026-05-07 15:35:29.304439+00
1275	night	22	6	12.00	2026-05-07 15:35:29.304439+00
1279	morning	6	14	10.00	2026-05-07 15:36:25.780882+00
1280	evening	14	22	15.00	2026-05-07 15:36:25.780882+00
1281	night	22	6	12.00	2026-05-07 15:36:25.780882+00
1285	morning	6	14	10.00	2026-05-07 15:36:40.20441+00
1286	evening	14	22	15.00	2026-05-07 15:36:40.20441+00
1287	night	22	6	12.00	2026-05-07 15:36:40.20441+00
1291	morning	6	14	10.00	2026-05-07 22:24:08.601796+00
1292	evening	14	22	15.00	2026-05-07 22:24:08.601796+00
1293	night	22	6	12.00	2026-05-07 22:24:08.601796+00
1297	morning	6	14	10.00	2026-05-07 22:24:08.79583+00
1298	evening	14	22	15.00	2026-05-07 22:24:08.79583+00
1299	night	22	6	12.00	2026-05-07 22:24:08.79583+00
1303	morning	6	14	10.00	2026-05-07 22:24:08.882103+00
1304	evening	14	22	15.00	2026-05-07 22:24:08.882103+00
1305	night	22	6	12.00	2026-05-07 22:24:08.882103+00
1309	morning	6	14	10.00	2026-05-07 22:30:11.509356+00
1310	evening	14	22	15.00	2026-05-07 22:30:11.509356+00
1311	night	22	6	12.00	2026-05-07 22:30:11.509356+00
1315	morning	6	14	10.00	2026-05-08 14:20:06.192638+00
1316	evening	14	22	15.00	2026-05-08 14:20:06.192638+00
1317	night	22	6	12.00	2026-05-08 14:20:06.192638+00
1321	morning	6	14	10.00	2026-05-08 14:23:09.418967+00
1322	evening	14	22	15.00	2026-05-08 14:23:09.418967+00
1323	night	22	6	12.00	2026-05-08 14:23:09.418967+00
1330	morning	6	14	10.00	2026-05-09 00:07:59.792413+00
1331	evening	14	22	15.00	2026-05-09 00:07:59.792413+00
1332	night	22	6	12.00	2026-05-09 00:07:59.792413+00
1336	morning	6	14	10.00	2026-05-09 00:08:17.451791+00
1337	evening	14	22	15.00	2026-05-09 00:08:17.451791+00
1338	night	22	6	12.00	2026-05-09 00:08:17.451791+00
1342	morning	6	14	10.00	2026-05-09 00:08:25.290918+00
1343	evening	14	22	15.00	2026-05-09 00:08:25.290918+00
1344	night	22	6	12.00	2026-05-09 00:08:25.290918+00
1348	morning	6	14	10.00	2026-05-09 00:14:11.498597+00
1349	evening	14	22	15.00	2026-05-09 00:14:11.498597+00
1350	night	22	6	12.00	2026-05-09 00:14:11.498597+00
1354	morning	6	14	10.00	2026-05-09 00:15:00.036172+00
1355	evening	14	22	15.00	2026-05-09 00:15:00.036172+00
1356	night	22	6	12.00	2026-05-09 00:15:00.036172+00
1366	morning	6	14	10.00	2026-05-09 13:10:37.056979+00
1367	evening	14	22	15.00	2026-05-09 13:10:37.056979+00
1368	night	22	6	12.00	2026-05-09 13:10:37.056979+00
1372	morning	6	14	10.00	2026-05-09 13:11:29.597923+00
1373	evening	14	22	15.00	2026-05-09 13:11:29.597923+00
1374	night	22	6	12.00	2026-05-09 13:11:29.597923+00
1378	morning	6	14	10.00	2026-05-09 13:11:29.877621+00
1379	evening	14	22	15.00	2026-05-09 13:11:29.877621+00
1380	night	22	6	12.00	2026-05-09 13:11:29.877621+00
1384	morning	6	14	10.00	2026-05-09 14:59:52.877607+00
1385	evening	14	22	15.00	2026-05-09 14:59:52.877607+00
1386	night	22	6	12.00	2026-05-09 14:59:52.877607+00
1390	morning	6	14	10.00	2026-05-09 14:59:53.021267+00
1391	evening	14	22	15.00	2026-05-09 14:59:53.021267+00
1392	night	22	6	12.00	2026-05-09 14:59:53.021267+00
1396	morning	6	14	10.00	2026-05-09 15:25:49.185723+00
1397	evening	14	22	15.00	2026-05-09 15:25:49.185723+00
1398	night	22	6	12.00	2026-05-09 15:25:49.185723+00
1402	morning	6	14	10.00	2026-05-09 15:25:56.90466+00
1403	evening	14	22	15.00	2026-05-09 15:25:56.90466+00
1404	night	22	6	12.00	2026-05-09 15:25:56.90466+00
1408	morning	6	14	10.00	2026-05-09 15:51:42.536425+00
1412	evening	14	22	15.00	2026-05-09 15:51:42.536425+00
1413	night	22	6	12.00	2026-05-09 15:51:42.536425+00
1414	morning	6	14	10.00	2026-05-09 16:08:52.730971+00
1415	evening	14	22	15.00	2026-05-09 16:08:52.730971+00
1416	night	22	6	12.00	2026-05-09 16:08:52.730971+00
1441	morning	6	14	10.00	2026-05-09 18:12:42.322252+00
1442	evening	14	22	15.00	2026-05-09 18:12:42.322252+00
1443	night	22	6	12.00	2026-05-09 18:12:42.322252+00
1444	morning	6	14	10.00	2026-05-09 18:24:18.153851+00
1445	evening	14	22	15.00	2026-05-09 18:24:18.153851+00
1446	night	22	6	12.00	2026-05-09 18:24:18.153851+00
1447	morning	6	14	10.00	2026-05-09 18:24:32.549388+00
1448	evening	14	22	15.00	2026-05-09 18:24:32.549388+00
1449	night	22	6	12.00	2026-05-09 18:24:32.549388+00
1450	morning	6	14	10.00	2026-05-09 18:24:51.543416+00
1451	evening	14	22	15.00	2026-05-09 18:24:51.543416+00
1452	night	22	6	12.00	2026-05-09 18:24:51.543416+00
1453	morning	6	14	10.00	2026-05-09 20:26:38.708972+00
1454	evening	14	22	15.00	2026-05-09 20:26:38.708972+00
1455	night	22	6	12.00	2026-05-09 20:26:38.708972+00
1456	morning	6	14	10.00	2026-05-09 21:22:09.303588+00
1457	evening	14	22	15.00	2026-05-09 21:22:09.303588+00
1458	night	22	6	12.00	2026-05-09 21:22:09.303588+00
1459	morning	6	14	10.00	2026-05-10 00:40:32.195085+00
1460	evening	14	22	15.00	2026-05-10 00:40:32.195085+00
1461	night	22	6	12.00	2026-05-10 00:40:32.195085+00
1462	morning	6	14	10.00	2026-05-10 00:40:56.360365+00
1463	evening	14	22	15.00	2026-05-10 00:40:56.360365+00
1464	night	22	6	12.00	2026-05-10 00:40:56.360365+00
1465	morning	6	14	10.00	2026-05-10 00:40:56.380568+00
1466	evening	14	22	15.00	2026-05-10 00:40:56.380568+00
1467	night	22	6	12.00	2026-05-10 00:40:56.380568+00
1468	morning	6	14	10.00	2026-05-10 00:40:56.388107+00
1469	evening	14	22	15.00	2026-05-10 00:40:56.388107+00
1470	night	22	6	12.00	2026-05-10 00:40:56.388107+00
1471	morning	6	14	10.00	2026-05-10 00:41:35.503946+00
1472	evening	14	22	15.00	2026-05-10 00:41:35.503946+00
1473	night	22	6	12.00	2026-05-10 00:41:35.503946+00
1474	morning	6	14	10.00	2026-05-10 00:41:36.619169+00
1475	evening	14	22	15.00	2026-05-10 00:41:36.619169+00
1476	night	22	6	12.00	2026-05-10 00:41:36.619169+00
1477	morning	6	14	10.00	2026-05-10 00:41:43.462205+00
1478	evening	14	22	15.00	2026-05-10 00:41:43.462205+00
1479	night	22	6	12.00	2026-05-10 00:41:43.462205+00
1480	morning	6	14	10.00	2026-05-10 00:41:58.157148+00
1481	evening	14	22	15.00	2026-05-10 00:41:58.157148+00
1482	night	22	6	12.00	2026-05-10 00:41:58.157148+00
1483	morning	6	14	10.00	2026-05-10 00:41:59.237855+00
1484	evening	14	22	15.00	2026-05-10 00:41:59.237855+00
1485	night	22	6	12.00	2026-05-10 00:41:59.237855+00
1486	morning	6	14	10.00	2026-05-10 00:42:19.163187+00
1487	evening	14	22	15.00	2026-05-10 00:42:19.163187+00
1488	night	22	6	12.00	2026-05-10 00:42:19.163187+00
1489	morning	6	14	10.00	2026-05-10 00:42:19.204269+00
1490	evening	14	22	15.00	2026-05-10 00:42:19.204269+00
1491	night	22	6	12.00	2026-05-10 00:42:19.204269+00
1492	morning	6	14	10.00	2026-05-10 00:50:24.332357+00
1493	evening	14	22	15.00	2026-05-10 00:50:24.332357+00
1494	night	22	6	12.00	2026-05-10 00:50:24.332357+00
1495	morning	6	14	10.00	2026-05-10 00:50:25.340084+00
1496	evening	14	22	15.00	2026-05-10 00:50:25.340084+00
1497	night	22	6	12.00	2026-05-10 00:50:25.340084+00
1498	morning	6	14	10.00	2026-05-10 00:54:31.72088+00
1499	evening	14	22	15.00	2026-05-10 00:54:31.72088+00
1500	night	22	6	12.00	2026-05-10 00:54:31.72088+00
1501	morning	6	14	10.00	2026-05-10 00:54:32.674611+00
1502	evening	14	22	15.00	2026-05-10 00:54:32.674611+00
1503	night	22	6	12.00	2026-05-10 00:54:32.674611+00
1504	morning	6	14	10.00	2026-05-10 00:55:11.09002+00
1505	evening	14	22	15.00	2026-05-10 00:55:11.09002+00
1506	night	22	6	12.00	2026-05-10 00:55:11.09002+00
1507	morning	6	14	10.00	2026-05-10 00:55:12.084095+00
1508	evening	14	22	15.00	2026-05-10 00:55:12.084095+00
1509	night	22	6	12.00	2026-05-10 00:55:12.084095+00
1510	morning	6	14	10.00	2026-05-10 01:17:16.006885+00
1511	evening	14	22	15.00	2026-05-10 01:17:16.006885+00
1512	night	22	6	12.00	2026-05-10 01:17:16.006885+00
1513	morning	6	14	10.00	2026-05-10 01:17:38.926301+00
1514	evening	14	22	15.00	2026-05-10 01:17:38.926301+00
1515	night	22	6	12.00	2026-05-10 01:17:38.926301+00
1516	morning	6	14	10.00	2026-05-10 01:17:49.299126+00
1517	evening	14	22	15.00	2026-05-10 01:17:49.299126+00
1518	night	22	6	12.00	2026-05-10 01:17:49.299126+00
1519	morning	6	14	10.00	2026-05-10 01:17:49.325859+00
1520	evening	14	22	15.00	2026-05-10 01:17:49.325859+00
1521	night	22	6	12.00	2026-05-10 01:17:49.325859+00
1522	morning	6	14	10.00	2026-05-10 01:18:01.293919+00
1523	evening	14	22	15.00	2026-05-10 01:18:01.293919+00
1524	night	22	6	12.00	2026-05-10 01:18:01.293919+00
1525	morning	6	14	10.00	2026-05-10 01:18:27.782222+00
1526	evening	14	22	15.00	2026-05-10 01:18:27.782222+00
1527	night	22	6	12.00	2026-05-10 01:18:27.782222+00
1528	morning	6	14	10.00	2026-05-10 01:33:25.224385+00
1529	evening	14	22	15.00	2026-05-10 01:33:25.224385+00
1530	night	22	6	12.00	2026-05-10 01:33:25.224385+00
1531	morning	6	14	10.00	2026-05-10 01:33:33.581326+00
1532	evening	14	22	15.00	2026-05-10 01:33:33.581326+00
1533	night	22	6	12.00	2026-05-10 01:33:33.581326+00
1534	morning	6	14	10.00	2026-05-10 01:34:01.93119+00
1535	evening	14	22	15.00	2026-05-10 01:34:01.93119+00
1536	night	22	6	12.00	2026-05-10 01:34:01.93119+00
1537	morning	6	14	10.00	2026-05-10 01:34:02.036307+00
1538	evening	14	22	15.00	2026-05-10 01:34:02.036307+00
1539	night	22	6	12.00	2026-05-10 01:34:02.036307+00
1540	morning	6	14	10.00	2026-05-10 01:34:10.430198+00
1541	evening	14	22	15.00	2026-05-10 01:34:10.430198+00
1542	night	22	6	12.00	2026-05-10 01:34:10.430198+00
1543	morning	6	14	10.00	2026-05-10 01:56:46.4902+00
1544	evening	14	22	15.00	2026-05-10 01:56:46.4902+00
1545	night	22	6	12.00	2026-05-10 01:56:46.4902+00
1546	morning	6	14	10.00	2026-05-10 01:56:54.215763+00
1547	evening	14	22	15.00	2026-05-10 01:56:54.215763+00
1548	night	22	6	12.00	2026-05-10 01:56:54.215763+00
1549	morning	6	14	10.00	2026-05-10 01:56:54.269565+00
1550	evening	14	22	15.00	2026-05-10 01:56:54.269565+00
1551	night	22	6	12.00	2026-05-10 01:56:54.269565+00
1552	morning	6	14	10.00	2026-05-10 11:26:17.777285+00
1553	evening	14	22	15.00	2026-05-10 11:26:17.777285+00
1554	night	22	6	12.00	2026-05-10 11:26:17.777285+00
1555	morning	6	14	10.00	2026-05-10 11:58:12.570913+00
1556	evening	14	22	15.00	2026-05-10 11:58:12.570913+00
1557	night	22	6	12.00	2026-05-10 11:58:12.570913+00
1558	morning	6	14	10.00	2026-05-10 11:59:11.878029+00
1559	evening	14	22	15.00	2026-05-10 11:59:11.878029+00
1560	night	22	6	12.00	2026-05-10 11:59:11.878029+00
1561	morning	6	14	10.00	2026-05-10 11:59:12.013954+00
1562	evening	14	22	15.00	2026-05-10 11:59:12.013954+00
1563	night	22	6	12.00	2026-05-10 11:59:12.013954+00
1564	morning	6	14	10.00	2026-05-10 12:02:50.332219+00
1565	evening	14	22	15.00	2026-05-10 12:02:50.332219+00
1566	night	22	6	12.00	2026-05-10 12:02:50.332219+00
1567	morning	6	14	10.00	2026-05-10 12:28:01.865712+00
1568	evening	14	22	15.00	2026-05-10 12:28:01.865712+00
1569	night	22	6	12.00	2026-05-10 12:28:01.865712+00
1570	morning	6	14	10.00	2026-05-10 12:28:09.79082+00
1571	evening	14	22	15.00	2026-05-10 12:28:09.79082+00
1572	night	22	6	12.00	2026-05-10 12:28:09.79082+00
1573	morning	6	14	10.00	2026-05-10 12:28:30.830002+00
1574	evening	14	22	15.00	2026-05-10 12:28:30.830002+00
1575	night	22	6	12.00	2026-05-10 12:28:30.830002+00
1576	morning	6	14	10.00	2026-05-10 12:28:41.159516+00
1577	evening	14	22	15.00	2026-05-10 12:28:41.159516+00
1578	night	22	6	12.00	2026-05-10 12:28:41.159516+00
1579	morning	6	14	10.00	2026-05-10 12:28:41.235737+00
1580	evening	14	22	15.00	2026-05-10 12:28:41.235737+00
1581	night	22	6	12.00	2026-05-10 12:28:41.235737+00
1582	morning	6	14	10.00	2026-05-10 12:29:02.386587+00
1583	evening	14	22	15.00	2026-05-10 12:29:02.386587+00
1584	night	22	6	12.00	2026-05-10 12:29:02.386587+00
1585	morning	6	14	10.00	2026-05-10 12:52:38.631705+00
1586	evening	14	22	15.00	2026-05-10 12:52:38.631705+00
1587	night	22	6	12.00	2026-05-10 12:52:38.631705+00
1588	morning	6	14	10.00	2026-05-10 12:52:39.035696+00
1589	evening	14	22	15.00	2026-05-10 12:52:39.035696+00
1590	night	22	6	12.00	2026-05-10 12:52:39.035696+00
1591	morning	6	14	10.00	2026-05-10 12:54:22.358861+00
1592	evening	14	22	15.00	2026-05-10 12:54:22.358861+00
1593	night	22	6	12.00	2026-05-10 12:54:22.358861+00
1594	morning	6	14	10.00	2026-05-10 12:54:23.369629+00
1595	evening	14	22	15.00	2026-05-10 12:54:23.369629+00
1596	night	22	6	12.00	2026-05-10 12:54:23.369629+00
1597	morning	6	14	10.00	2026-05-10 12:54:29.4682+00
1598	evening	14	22	15.00	2026-05-10 12:54:29.4682+00
1599	night	22	6	12.00	2026-05-10 12:54:29.4682+00
1600	morning	6	14	10.00	2026-05-10 12:54:38.848166+00
1601	evening	14	22	15.00	2026-05-10 12:54:38.848166+00
1602	night	22	6	12.00	2026-05-10 12:54:38.848166+00
1603	morning	6	14	10.00	2026-05-10 12:54:56.800329+00
1604	evening	14	22	15.00	2026-05-10 12:54:56.800329+00
1605	night	22	6	12.00	2026-05-10 12:54:56.800329+00
1606	morning	6	14	10.00	2026-05-10 13:06:35.487375+00
1607	evening	14	22	15.00	2026-05-10 13:06:35.487375+00
1608	night	22	6	12.00	2026-05-10 13:06:35.487375+00
1609	morning	6	14	10.00	2026-05-10 13:06:51.538207+00
1610	evening	14	22	15.00	2026-05-10 13:06:51.538207+00
1611	night	22	6	12.00	2026-05-10 13:06:51.538207+00
1612	morning	6	14	10.00	2026-05-10 13:06:51.627718+00
1613	evening	14	22	15.00	2026-05-10 13:06:51.627718+00
1614	night	22	6	12.00	2026-05-10 13:06:51.627718+00
1615	morning	6	14	10.00	2026-05-10 13:07:33.887422+00
1616	evening	14	22	15.00	2026-05-10 13:07:33.887422+00
1617	night	22	6	12.00	2026-05-10 13:07:33.887422+00
1618	morning	6	14	10.00	2026-05-10 13:07:34.04397+00
1619	evening	14	22	15.00	2026-05-10 13:07:34.04397+00
1620	night	22	6	12.00	2026-05-10 13:07:34.04397+00
1621	morning	6	14	10.00	2026-05-10 13:37:41.664999+00
1622	evening	14	22	15.00	2026-05-10 13:37:41.664999+00
1623	night	22	6	12.00	2026-05-10 13:37:41.664999+00
1624	morning	6	14	10.00	2026-05-10 13:37:49.675949+00
1625	evening	14	22	15.00	2026-05-10 13:37:49.675949+00
1626	night	22	6	12.00	2026-05-10 13:37:49.675949+00
1627	morning	6	14	10.00	2026-05-10 13:38:29.443554+00
1628	evening	14	22	15.00	2026-05-10 13:38:29.443554+00
1629	night	22	6	12.00	2026-05-10 13:38:29.443554+00
1630	morning	6	14	10.00	2026-05-10 13:38:29.469641+00
1631	evening	14	22	15.00	2026-05-10 13:38:29.469641+00
1632	night	22	6	12.00	2026-05-10 13:38:29.469641+00
1633	morning	6	14	10.00	2026-05-10 13:38:29.515683+00
1634	evening	14	22	15.00	2026-05-10 13:38:29.515683+00
1635	night	22	6	12.00	2026-05-10 13:38:29.515683+00
1637	morning	6	14	10.00	2026-05-10 14:03:50.256075+00
1638	evening	14	22	15.00	2026-05-10 14:03:50.256075+00
1639	night	22	6	12.00	2026-05-10 14:03:50.256075+00
1636	morning	6	14	10.00	2026-05-10 14:03:50.255608+00
1640	evening	14	22	15.00	2026-05-10 14:03:50.255608+00
1641	night	22	6	12.00	2026-05-10 14:03:50.255608+00
1642	morning	6	14	10.00	2026-05-10 14:03:58.593059+00
1643	evening	14	22	15.00	2026-05-10 14:03:58.593059+00
1644	night	22	6	12.00	2026-05-10 14:03:58.593059+00
1645	morning	6	14	10.00	2026-05-10 14:05:22.587917+00
1646	evening	14	22	15.00	2026-05-10 14:05:22.587917+00
1647	night	22	6	12.00	2026-05-10 14:05:22.587917+00
1648	morning	6	14	10.00	2026-05-10 14:20:14.500058+00
1649	evening	14	22	15.00	2026-05-10 14:20:14.500058+00
1650	night	22	6	12.00	2026-05-10 14:20:14.500058+00
1651	morning	6	14	10.00	2026-05-10 14:28:23.469418+00
1652	evening	14	22	15.00	2026-05-10 14:28:23.469418+00
1653	night	22	6	12.00	2026-05-10 14:28:23.469418+00
1654	morning	6	14	10.00	2026-05-10 14:30:17.228734+00
1655	evening	14	22	15.00	2026-05-10 14:30:17.228734+00
1656	night	22	6	12.00	2026-05-10 14:30:17.228734+00
1657	morning	6	14	10.00	2026-05-10 14:30:17.276181+00
1658	evening	14	22	15.00	2026-05-10 14:30:17.276181+00
1659	night	22	6	12.00	2026-05-10 14:30:17.276181+00
1660	morning	6	14	10.00	2026-05-10 14:30:17.354575+00
1661	evening	14	22	15.00	2026-05-10 14:30:17.354575+00
1662	night	22	6	12.00	2026-05-10 14:30:17.354575+00
1663	morning	6	14	10.00	2026-05-10 14:30:17.373893+00
1664	evening	14	22	15.00	2026-05-10 14:30:17.373893+00
1665	night	22	6	12.00	2026-05-10 14:30:17.373893+00
1666	morning	6	14	10.00	2026-05-10 14:38:01.92399+00
1667	evening	14	22	15.00	2026-05-10 14:38:01.92399+00
1668	night	22	6	12.00	2026-05-10 14:38:01.92399+00
1669	morning	6	14	10.00	2026-05-10 14:38:02.085257+00
1670	evening	14	22	15.00	2026-05-10 14:38:02.085257+00
1671	night	22	6	12.00	2026-05-10 14:38:02.085257+00
1672	morning	6	14	10.00	2026-05-10 14:38:10.071188+00
1673	evening	14	22	15.00	2026-05-10 14:38:10.071188+00
1674	night	22	6	12.00	2026-05-10 14:38:10.071188+00
1675	morning	6	14	10.00	2026-05-10 14:42:13.684493+00
1676	evening	14	22	15.00	2026-05-10 14:42:13.684493+00
1677	night	22	6	12.00	2026-05-10 14:42:13.684493+00
1678	morning	6	14	10.00	2026-05-10 14:42:32.030042+00
1679	evening	14	22	15.00	2026-05-10 14:42:32.030042+00
1680	night	22	6	12.00	2026-05-10 14:42:32.030042+00
1681	morning	6	14	10.00	2026-05-10 15:15:52.78535+00
1682	evening	14	22	15.00	2026-05-10 15:15:52.78535+00
1683	night	22	6	12.00	2026-05-10 15:15:52.78535+00
1684	morning	6	14	10.00	2026-05-10 15:16:04.108288+00
1685	evening	14	22	15.00	2026-05-10 15:16:04.108288+00
1686	night	22	6	12.00	2026-05-10 15:16:04.108288+00
1687	morning	6	14	10.00	2026-05-10 15:16:04.120213+00
1688	evening	14	22	15.00	2026-05-10 15:16:04.120213+00
1689	night	22	6	12.00	2026-05-10 15:16:04.120213+00
1690	morning	6	14	10.00	2026-05-10 15:16:04.467371+00
1691	evening	14	22	15.00	2026-05-10 15:16:04.467371+00
1692	night	22	6	12.00	2026-05-10 15:16:04.467371+00
1693	morning	6	14	10.00	2026-05-10 15:29:22.78314+00
1696	evening	14	22	15.00	2026-05-10 15:29:22.78314+00
1697	night	22	6	12.00	2026-05-10 15:29:22.78314+00
1694	morning	6	14	10.00	2026-05-10 15:29:22.78037+00
1698	evening	14	22	15.00	2026-05-10 15:29:22.78037+00
1699	night	22	6	12.00	2026-05-10 15:29:22.78037+00
1695	morning	6	14	10.00	2026-05-10 15:29:22.793553+00
1700	evening	14	22	15.00	2026-05-10 15:29:22.793553+00
1701	night	22	6	12.00	2026-05-10 15:29:22.793553+00
1702	morning	6	14	10.00	2026-05-10 15:29:23.284876+00
1703	evening	14	22	15.00	2026-05-10 15:29:23.284876+00
1704	night	22	6	12.00	2026-05-10 15:29:23.284876+00
1705	morning	6	14	10.00	2026-05-10 15:29:23.318162+00
1706	evening	14	22	15.00	2026-05-10 15:29:23.318162+00
1707	night	22	6	12.00	2026-05-10 15:29:23.318162+00
1708	morning	6	14	10.00	2026-05-10 15:46:55.37746+00
1709	evening	14	22	15.00	2026-05-10 15:46:55.37746+00
1710	night	22	6	12.00	2026-05-10 15:46:55.37746+00
1711	morning	6	14	10.00	2026-05-10 15:47:09.11239+00
1712	evening	14	22	15.00	2026-05-10 15:47:09.11239+00
1713	night	22	6	12.00	2026-05-10 15:47:09.11239+00
1714	morning	6	14	10.00	2026-05-10 15:47:09.220802+00
1715	evening	14	22	15.00	2026-05-10 15:47:09.220802+00
1716	night	22	6	12.00	2026-05-10 15:47:09.220802+00
1717	morning	6	14	10.00	2026-05-10 18:06:09.097136+00
1718	evening	14	22	15.00	2026-05-10 18:06:09.097136+00
1719	night	22	6	12.00	2026-05-10 18:06:09.097136+00
1720	morning	6	14	10.00	2026-05-10 18:37:34.610454+00
1721	evening	14	22	15.00	2026-05-10 18:37:34.610454+00
1722	night	22	6	12.00	2026-05-10 18:37:34.610454+00
1723	morning	6	14	10.00	2026-05-10 18:37:34.926518+00
1724	evening	14	22	15.00	2026-05-10 18:37:34.926518+00
1725	night	22	6	12.00	2026-05-10 18:37:34.926518+00
1726	morning	6	14	10.00	2026-05-10 18:42:58.933642+00
1727	evening	14	22	15.00	2026-05-10 18:42:58.933642+00
1728	night	22	6	12.00	2026-05-10 18:42:58.933642+00
1729	morning	6	14	10.00	2026-05-10 18:43:16.76121+00
1730	evening	14	22	15.00	2026-05-10 18:43:16.76121+00
1731	night	22	6	12.00	2026-05-10 18:43:16.76121+00
1732	morning	6	14	10.00	2026-05-10 18:43:17.065018+00
1733	evening	14	22	15.00	2026-05-10 18:43:17.065018+00
1734	night	22	6	12.00	2026-05-10 18:43:17.065018+00
1735	morning	6	14	10.00	2026-05-10 19:00:51.640477+00
1736	evening	14	22	15.00	2026-05-10 19:00:51.640477+00
1737	night	22	6	12.00	2026-05-10 19:00:51.640477+00
1738	morning	6	14	10.00	2026-05-10 19:00:59.028075+00
1739	evening	14	22	15.00	2026-05-10 19:00:59.028075+00
1740	night	22	6	12.00	2026-05-10 19:00:59.028075+00
1741	morning	6	14	10.00	2026-05-10 19:09:43.553368+00
1742	evening	14	22	15.00	2026-05-10 19:09:43.553368+00
1743	night	22	6	12.00	2026-05-10 19:09:43.553368+00
1744	morning	6	14	10.00	2026-05-10 20:54:39.133841+00
1745	evening	14	22	15.00	2026-05-10 20:54:39.133841+00
1746	night	22	6	12.00	2026-05-10 20:54:39.133841+00
1747	morning	6	14	10.00	2026-05-10 20:59:54.447289+00
1748	evening	14	22	15.00	2026-05-10 20:59:54.447289+00
1749	night	22	6	12.00	2026-05-10 20:59:54.447289+00
1750	morning	6	14	10.00	2026-05-10 21:00:40.680304+00
1751	evening	14	22	15.00	2026-05-10 21:00:40.680304+00
1752	night	22	6	12.00	2026-05-10 21:00:40.680304+00
1753	morning	6	14	10.00	2026-05-10 21:00:40.690582+00
1754	evening	14	22	15.00	2026-05-10 21:00:40.690582+00
1755	night	22	6	12.00	2026-05-10 21:00:40.690582+00
1756	morning	6	14	10.00	2026-05-10 21:00:40.691269+00
1757	evening	14	22	15.00	2026-05-10 21:00:40.691269+00
1758	night	22	6	12.00	2026-05-10 21:00:40.691269+00
1759	morning	6	14	10.00	2026-05-10 22:43:09.109456+00
1760	evening	14	22	15.00	2026-05-10 22:43:09.109456+00
1761	night	22	6	12.00	2026-05-10 22:43:09.109456+00
1762	morning	6	14	10.00	2026-05-10 22:43:09.609239+00
1763	evening	14	22	15.00	2026-05-10 22:43:09.609239+00
1764	night	22	6	12.00	2026-05-10 22:43:09.609239+00
1765	morning	6	14	10.00	2026-05-10 23:03:07.736446+00
1767	evening	14	22	15.00	2026-05-10 23:03:07.736446+00
1768	night	22	6	12.00	2026-05-10 23:03:07.736446+00
1766	morning	6	14	10.00	2026-05-10 23:03:07.737391+00
1769	evening	14	22	15.00	2026-05-10 23:03:07.737391+00
1770	night	22	6	12.00	2026-05-10 23:03:07.737391+00
1771	morning	6	14	10.00	2026-05-10 23:03:16.015752+00
1772	evening	14	22	15.00	2026-05-10 23:03:16.015752+00
1773	night	22	6	12.00	2026-05-10 23:03:16.015752+00
1774	morning	6	14	10.00	2026-05-10 23:03:16.070732+00
1775	evening	14	22	15.00	2026-05-10 23:03:16.070732+00
1776	night	22	6	12.00	2026-05-10 23:03:16.070732+00
1777	morning	6	14	10.00	2026-05-10 23:03:16.091381+00
1778	evening	14	22	15.00	2026-05-10 23:03:16.091381+00
1779	night	22	6	12.00	2026-05-10 23:03:16.091381+00
1780	morning	6	14	10.00	2026-05-10 23:03:16.106856+00
1781	evening	14	22	15.00	2026-05-10 23:03:16.106856+00
1782	night	22	6	12.00	2026-05-10 23:03:16.106856+00
1783	morning	6	14	10.00	2026-05-10 23:03:16.168245+00
1784	evening	14	22	15.00	2026-05-10 23:03:16.168245+00
1785	night	22	6	12.00	2026-05-10 23:03:16.168245+00
1786	morning	6	14	10.00	2026-05-11 10:38:13.376682+00
1787	evening	14	22	15.00	2026-05-11 10:38:13.376682+00
1788	night	22	6	12.00	2026-05-11 10:38:13.376682+00
1789	morning	6	14	10.00	2026-05-11 13:42:26.425258+00
1790	evening	14	22	15.00	2026-05-11 13:42:26.425258+00
1791	night	22	6	12.00	2026-05-11 13:42:26.425258+00
1792	morning	6	14	10.00	2026-05-11 16:40:59.003166+00
1793	evening	14	22	15.00	2026-05-11 16:40:59.003166+00
1794	night	22	6	12.00	2026-05-11 16:40:59.003166+00
1795	morning	6	14	10.00	2026-05-11 16:41:21.873366+00
1796	evening	14	22	15.00	2026-05-11 16:41:21.873366+00
1797	night	22	6	12.00	2026-05-11 16:41:21.873366+00
1798	morning	6	14	10.00	2026-05-11 16:41:21.992431+00
1799	evening	14	22	15.00	2026-05-11 16:41:21.992431+00
1800	night	22	6	12.00	2026-05-11 16:41:21.992431+00
1801	morning	6	14	10.00	2026-05-11 16:44:37.233971+00
1802	evening	14	22	15.00	2026-05-11 16:44:37.233971+00
1803	night	22	6	12.00	2026-05-11 16:44:37.233971+00
1804	morning	6	14	10.00	2026-05-11 16:52:41.10555+00
1805	evening	14	22	15.00	2026-05-11 16:52:41.10555+00
1806	night	22	6	12.00	2026-05-11 16:52:41.10555+00
1807	morning	6	14	10.00	2026-05-11 16:52:41.211784+00
1808	evening	14	22	15.00	2026-05-11 16:52:41.211784+00
1809	night	22	6	12.00	2026-05-11 16:52:41.211784+00
1810	morning	6	14	10.00	2026-05-11 16:52:41.37999+00
1811	evening	14	22	15.00	2026-05-11 16:52:41.37999+00
1812	night	22	6	12.00	2026-05-11 16:52:41.37999+00
1813	morning	6	14	10.00	2026-05-11 18:52:25.762479+00
1814	evening	14	22	15.00	2026-05-11 18:52:25.762479+00
1815	night	22	6	12.00	2026-05-11 18:52:25.762479+00
1816	morning	6	14	10.00	2026-05-11 18:52:34.218009+00
1817	evening	14	22	15.00	2026-05-11 18:52:34.218009+00
1818	night	22	6	12.00	2026-05-11 18:52:34.218009+00
1819	morning	6	14	10.00	2026-05-11 18:52:42.890426+00
1820	evening	14	22	15.00	2026-05-11 18:52:42.890426+00
1821	night	22	6	12.00	2026-05-11 18:52:42.890426+00
1822	morning	6	14	10.00	2026-05-11 18:52:51.953651+00
1823	evening	14	22	15.00	2026-05-11 18:52:51.953651+00
1824	night	22	6	12.00	2026-05-11 18:52:51.953651+00
1825	morning	6	14	10.00	2026-05-11 18:52:52.109739+00
1826	evening	14	22	15.00	2026-05-11 18:52:52.109739+00
1827	night	22	6	12.00	2026-05-11 18:52:52.109739+00
1828	morning	6	14	10.00	2026-05-11 18:52:52.183747+00
1829	evening	14	22	15.00	2026-05-11 18:52:52.183747+00
1830	night	22	6	12.00	2026-05-11 18:52:52.183747+00
1831	morning	6	14	10.00	2026-05-11 18:52:52.227028+00
1832	evening	14	22	15.00	2026-05-11 18:52:52.227028+00
1833	night	22	6	12.00	2026-05-11 18:52:52.227028+00
1834	morning	6	14	10.00	2026-05-11 18:52:52.539812+00
1835	evening	14	22	15.00	2026-05-11 18:52:52.539812+00
1836	night	22	6	12.00	2026-05-11 18:52:52.539812+00
1837	morning	6	14	10.00	2026-05-11 19:07:12.30503+00
1838	evening	14	22	15.00	2026-05-11 19:07:12.30503+00
1839	night	22	6	12.00	2026-05-11 19:07:12.30503+00
1840	morning	6	14	10.00	2026-05-11 19:08:20.750582+00
1841	evening	14	22	15.00	2026-05-11 19:08:20.750582+00
1842	night	22	6	12.00	2026-05-11 19:08:20.750582+00
1843	morning	6	14	10.00	2026-05-11 19:08:31.066189+00
1844	evening	14	22	15.00	2026-05-11 19:08:31.066189+00
1845	night	22	6	12.00	2026-05-11 19:08:31.066189+00
1846	morning	6	14	10.00	2026-05-11 19:08:31.131712+00
1847	evening	14	22	15.00	2026-05-11 19:08:31.131712+00
1848	night	22	6	12.00	2026-05-11 19:08:31.131712+00
1849	morning	6	14	10.00	2026-05-11 19:08:31.142884+00
1850	evening	14	22	15.00	2026-05-11 19:08:31.142884+00
1851	night	22	6	12.00	2026-05-11 19:08:31.142884+00
1852	morning	6	14	10.00	2026-05-11 19:20:26.558022+00
1853	evening	14	22	15.00	2026-05-11 19:20:26.558022+00
1854	night	22	6	12.00	2026-05-11 19:20:26.558022+00
1855	morning	6	14	10.00	2026-05-11 19:22:29.716492+00
1856	evening	14	22	15.00	2026-05-11 19:22:29.716492+00
1857	night	22	6	12.00	2026-05-11 19:22:29.716492+00
1858	morning	6	14	10.00	2026-05-11 19:22:29.724474+00
1859	evening	14	22	15.00	2026-05-11 19:22:29.724474+00
1860	night	22	6	12.00	2026-05-11 19:22:29.724474+00
1861	morning	6	14	10.00	2026-05-11 19:22:29.728097+00
1862	evening	14	22	15.00	2026-05-11 19:22:29.728097+00
1863	night	22	6	12.00	2026-05-11 19:22:29.728097+00
1864	morning	6	14	10.00	2026-05-11 19:22:29.875143+00
1865	evening	14	22	15.00	2026-05-11 19:22:29.875143+00
1866	night	22	6	12.00	2026-05-11 19:22:29.875143+00
1867	morning	6	14	10.00	2026-05-11 19:43:27.029523+00
1868	evening	14	22	15.00	2026-05-11 19:43:27.029523+00
1869	night	22	6	12.00	2026-05-11 19:43:27.029523+00
1870	morning	6	14	10.00	2026-05-11 19:51:24.018978+00
1871	evening	14	22	15.00	2026-05-11 19:51:24.018978+00
1872	night	22	6	12.00	2026-05-11 19:51:24.018978+00
1873	morning	6	14	10.00	2026-05-11 19:51:36.557218+00
1874	evening	14	22	15.00	2026-05-11 19:51:36.557218+00
1875	night	22	6	12.00	2026-05-11 19:51:36.557218+00
1876	morning	6	14	10.00	2026-05-11 19:51:36.584957+00
1877	evening	14	22	15.00	2026-05-11 19:51:36.584957+00
1878	night	22	6	12.00	2026-05-11 19:51:36.584957+00
1879	morning	6	14	10.00	2026-05-11 20:12:45.8905+00
1880	evening	14	22	15.00	2026-05-11 20:12:45.8905+00
1881	night	22	6	12.00	2026-05-11 20:12:45.8905+00
1882	morning	6	14	10.00	2026-05-11 20:12:45.916367+00
1883	evening	14	22	15.00	2026-05-11 20:12:45.916367+00
1884	night	22	6	12.00	2026-05-11 20:12:45.916367+00
1885	morning	6	14	10.00	2026-05-11 20:17:25.033406+00
1886	evening	14	22	15.00	2026-05-11 20:17:25.033406+00
1887	night	22	6	12.00	2026-05-11 20:17:25.033406+00
1888	morning	6	14	10.00	2026-05-11 20:30:43.742714+00
1889	evening	14	22	15.00	2026-05-11 20:30:43.742714+00
1890	night	22	6	12.00	2026-05-11 20:30:43.742714+00
1891	morning	6	14	10.00	2026-05-11 20:32:10.884122+00
1892	evening	14	22	15.00	2026-05-11 20:32:10.884122+00
1893	night	22	6	12.00	2026-05-11 20:32:10.884122+00
1894	morning	6	14	10.00	2026-05-11 20:32:54.725168+00
1895	evening	14	22	15.00	2026-05-11 20:32:54.725168+00
1896	night	22	6	12.00	2026-05-11 20:32:54.725168+00
1897	morning	6	14	10.00	2026-05-11 21:22:58.03785+00
1898	evening	14	22	15.00	2026-05-11 21:22:58.03785+00
1899	night	22	6	12.00	2026-05-11 21:22:58.03785+00
1900	morning	6	14	10.00	2026-05-11 21:22:58.067437+00
1901	evening	14	22	15.00	2026-05-11 21:22:58.067437+00
1902	night	22	6	12.00	2026-05-11 21:22:58.067437+00
1903	morning	6	14	10.00	2026-05-11 21:23:05.155411+00
1904	evening	14	22	15.00	2026-05-11 21:23:05.155411+00
1905	night	22	6	12.00	2026-05-11 21:23:05.155411+00
1906	morning	6	14	10.00	2026-05-11 21:23:05.559131+00
1907	evening	14	22	15.00	2026-05-11 21:23:05.559131+00
1908	night	22	6	12.00	2026-05-11 21:23:05.559131+00
1909	morning	6	14	10.00	2026-05-11 21:23:06.216003+00
1910	evening	14	22	15.00	2026-05-11 21:23:06.216003+00
1911	night	22	6	12.00	2026-05-11 21:23:06.216003+00
1912	morning	6	14	10.00	2026-05-11 21:23:06.316517+00
1913	evening	14	22	15.00	2026-05-11 21:23:06.316517+00
1914	night	22	6	12.00	2026-05-11 21:23:06.316517+00
1915	morning	6	14	10.00	2026-05-11 21:37:33.86932+00
1917	evening	14	22	15.00	2026-05-11 21:37:33.86932+00
1918	night	22	6	12.00	2026-05-11 21:37:33.86932+00
1916	morning	6	14	10.00	2026-05-11 21:37:33.886444+00
1919	evening	14	22	15.00	2026-05-11 21:37:33.886444+00
1920	night	22	6	12.00	2026-05-11 21:37:33.886444+00
1921	morning	6	14	10.00	2026-05-11 21:37:58.069531+00
1922	evening	14	22	15.00	2026-05-11 21:37:58.069531+00
1923	night	22	6	12.00	2026-05-11 21:37:58.069531+00
1924	morning	6	14	10.00	2026-05-11 21:44:54.708424+00
1925	evening	14	22	15.00	2026-05-11 21:44:54.708424+00
1926	night	22	6	12.00	2026-05-11 21:44:54.708424+00
1927	morning	6	14	10.00	2026-05-12 00:01:25.59732+00
1928	evening	14	22	15.00	2026-05-12 00:01:25.59732+00
1929	night	22	6	12.00	2026-05-12 00:01:25.59732+00
1930	morning	6	14	10.00	2026-05-12 00:01:36.092244+00
1931	evening	14	22	15.00	2026-05-12 00:01:36.092244+00
1932	night	22	6	12.00	2026-05-12 00:01:36.092244+00
1933	morning	6	14	10.00	2026-05-12 00:01:36.144217+00
1934	evening	14	22	15.00	2026-05-12 00:01:36.144217+00
1935	night	22	6	12.00	2026-05-12 00:01:36.144217+00
1936	morning	6	14	10.00	2026-05-12 00:01:59.763663+00
1937	evening	14	22	15.00	2026-05-12 00:01:59.763663+00
1938	night	22	6	12.00	2026-05-12 00:01:59.763663+00
1939	morning	6	14	10.00	2026-05-12 00:04:03.730037+00
1940	evening	14	22	15.00	2026-05-12 00:04:03.730037+00
1941	night	22	6	12.00	2026-05-12 00:04:03.730037+00
1942	morning	6	14	10.00	2026-05-12 00:10:32.186462+00
1943	evening	14	22	15.00	2026-05-12 00:10:32.186462+00
1944	night	22	6	12.00	2026-05-12 00:10:32.186462+00
1945	morning	6	14	10.00	2026-05-12 00:10:54.882012+00
1946	evening	14	22	15.00	2026-05-12 00:10:54.882012+00
1947	night	22	6	12.00	2026-05-12 00:10:54.882012+00
1948	morning	6	14	10.00	2026-05-12 00:10:55.105072+00
1949	evening	14	22	15.00	2026-05-12 00:10:55.105072+00
1950	night	22	6	12.00	2026-05-12 00:10:55.105072+00
1951	morning	6	14	10.00	2026-05-12 00:35:26.959094+00
1952	evening	14	22	15.00	2026-05-12 00:35:26.959094+00
1953	night	22	6	12.00	2026-05-12 00:35:26.959094+00
1954	morning	6	14	10.00	2026-05-12 00:35:44.549341+00
1955	evening	14	22	15.00	2026-05-12 00:35:44.549341+00
1956	night	22	6	12.00	2026-05-12 00:35:44.549341+00
1957	morning	6	14	10.00	2026-05-12 00:35:44.579722+00
1958	evening	14	22	15.00	2026-05-12 00:35:44.579722+00
1959	night	22	6	12.00	2026-05-12 00:35:44.579722+00
1960	morning	6	14	10.00	2026-05-12 00:36:38.56633+00
1961	evening	14	22	15.00	2026-05-12 00:36:38.56633+00
1962	night	22	6	12.00	2026-05-12 00:36:38.56633+00
1963	morning	6	14	10.00	2026-05-12 00:43:38.009096+00
1964	evening	14	22	15.00	2026-05-12 00:43:38.009096+00
1965	night	22	6	12.00	2026-05-12 00:43:38.009096+00
1966	morning	6	14	10.00	2026-05-12 00:44:02.505826+00
1967	evening	14	22	15.00	2026-05-12 00:44:02.505826+00
1968	night	22	6	12.00	2026-05-12 00:44:02.505826+00
1969	morning	6	14	10.00	2026-05-12 00:44:29.474861+00
1970	evening	14	22	15.00	2026-05-12 00:44:29.474861+00
1971	night	22	6	12.00	2026-05-12 00:44:29.474861+00
1972	morning	6	14	10.00	2026-05-12 00:44:29.480756+00
1973	evening	14	22	15.00	2026-05-12 00:44:29.480756+00
1974	night	22	6	12.00	2026-05-12 00:44:29.480756+00
1975	morning	6	14	10.00	2026-05-12 10:02:07.017023+00
1976	evening	14	22	15.00	2026-05-12 10:02:07.017023+00
1977	night	22	6	12.00	2026-05-12 10:02:07.017023+00
1978	morning	6	14	10.00	2026-05-12 11:54:20.831527+00
1979	evening	14	22	15.00	2026-05-12 11:54:20.831527+00
1980	night	22	6	12.00	2026-05-12 11:54:20.831527+00
1981	morning	6	14	10.00	2026-05-12 11:56:16.783005+00
1982	evening	14	22	15.00	2026-05-12 11:56:16.783005+00
1983	night	22	6	12.00	2026-05-12 11:56:16.783005+00
1984	morning	6	14	10.00	2026-05-12 11:56:17.005413+00
1985	evening	14	22	15.00	2026-05-12 11:56:17.005413+00
1986	night	22	6	12.00	2026-05-12 11:56:17.005413+00
1987	morning	6	14	10.00	2026-05-12 12:01:33.980624+00
1988	evening	14	22	15.00	2026-05-12 12:01:33.980624+00
1989	night	22	6	12.00	2026-05-12 12:01:33.980624+00
1990	morning	6	14	10.00	2026-05-12 12:02:35.078578+00
1991	evening	14	22	15.00	2026-05-12 12:02:35.078578+00
1992	night	22	6	12.00	2026-05-12 12:02:35.078578+00
1993	morning	6	14	10.00	2026-05-12 12:02:53.997564+00
1994	evening	14	22	15.00	2026-05-12 12:02:53.997564+00
1995	night	22	6	12.00	2026-05-12 12:02:53.997564+00
1996	morning	6	14	10.00	2026-05-12 12:04:25.181363+00
1997	evening	14	22	15.00	2026-05-12 12:04:25.181363+00
1998	night	22	6	12.00	2026-05-12 12:04:25.181363+00
1999	morning	6	14	10.00	2026-05-12 12:44:23.256342+00
2000	evening	14	22	15.00	2026-05-12 12:44:23.256342+00
2001	night	22	6	12.00	2026-05-12 12:44:23.256342+00
2002	morning	6	14	10.00	2026-05-12 12:44:44.273443+00
2003	evening	14	22	15.00	2026-05-12 12:44:44.273443+00
2004	night	22	6	12.00	2026-05-12 12:44:44.273443+00
2005	morning	6	14	10.00	2026-05-12 12:44:44.277945+00
2006	evening	14	22	15.00	2026-05-12 12:44:44.277945+00
2007	night	22	6	12.00	2026-05-12 12:44:44.277945+00
2008	morning	6	14	10.00	2026-05-12 12:44:55.881522+00
2009	evening	14	22	15.00	2026-05-12 12:44:55.881522+00
2010	night	22	6	12.00	2026-05-12 12:44:55.881522+00
2011	morning	6	14	10.00	2026-05-12 13:42:24.819142+00
2012	evening	14	22	15.00	2026-05-12 13:42:24.819142+00
2013	night	22	6	12.00	2026-05-12 13:42:24.819142+00
2014	morning	6	14	10.00	2026-05-12 13:42:49.463654+00
2015	evening	14	22	15.00	2026-05-12 13:42:49.463654+00
2016	night	22	6	12.00	2026-05-12 13:42:49.463654+00
2017	morning	6	14	10.00	2026-05-12 13:50:49.722017+00
2018	evening	14	22	15.00	2026-05-12 13:50:49.722017+00
2019	night	22	6	12.00	2026-05-12 13:50:49.722017+00
2020	morning	6	14	10.00	2026-05-12 13:50:58.631647+00
2021	evening	14	22	15.00	2026-05-12 13:50:58.631647+00
2022	night	22	6	12.00	2026-05-12 13:50:58.631647+00
2023	morning	6	14	10.00	2026-05-12 14:54:42.835827+00
2024	evening	14	22	15.00	2026-05-12 14:54:42.835827+00
2025	night	22	6	12.00	2026-05-12 14:54:42.835827+00
2026	morning	6	14	10.00	2026-05-12 14:54:42.879359+00
2027	evening	14	22	15.00	2026-05-12 14:54:42.879359+00
2028	night	22	6	12.00	2026-05-12 14:54:42.879359+00
2029	morning	6	14	10.00	2026-05-12 14:54:48.526419+00
2030	evening	14	22	15.00	2026-05-12 14:54:48.526419+00
2031	night	22	6	12.00	2026-05-12 14:54:48.526419+00
2032	morning	6	14	10.00	2026-05-12 14:54:48.560612+00
2033	evening	14	22	15.00	2026-05-12 14:54:48.560612+00
2034	night	22	6	12.00	2026-05-12 14:54:48.560612+00
2035	morning	6	14	10.00	2026-05-12 14:54:48.566162+00
2036	evening	14	22	15.00	2026-05-12 14:54:48.566162+00
2037	night	22	6	12.00	2026-05-12 14:54:48.566162+00
2038	morning	6	14	10.00	2026-05-12 14:54:48.649943+00
2039	evening	14	22	15.00	2026-05-12 14:54:48.649943+00
2040	night	22	6	12.00	2026-05-12 14:54:48.649943+00
2041	morning	6	14	10.00	2026-05-12 15:17:47.269057+00
2042	evening	14	22	15.00	2026-05-12 15:17:47.269057+00
2043	night	22	6	12.00	2026-05-12 15:17:47.269057+00
2044	morning	6	14	10.00	2026-05-12 15:29:57.908895+00
2045	evening	14	22	15.00	2026-05-12 15:29:57.908895+00
2046	night	22	6	12.00	2026-05-12 15:29:57.908895+00
2047	morning	6	14	10.00	2026-05-12 15:30:10.307636+00
2048	evening	14	22	15.00	2026-05-12 15:30:10.307636+00
2049	night	22	6	12.00	2026-05-12 15:30:10.307636+00
2050	morning	6	14	10.00	2026-05-12 15:30:10.439189+00
2051	evening	14	22	15.00	2026-05-12 15:30:10.439189+00
2052	night	22	6	12.00	2026-05-12 15:30:10.439189+00
2053	morning	6	14	10.00	2026-05-12 15:30:27.490713+00
2054	evening	14	22	15.00	2026-05-12 15:30:27.490713+00
2055	night	22	6	12.00	2026-05-12 15:30:27.490713+00
2056	morning	6	14	10.00	2026-05-12 15:46:35.463266+00
2057	evening	14	22	15.00	2026-05-12 15:46:35.463266+00
2058	night	22	6	12.00	2026-05-12 15:46:35.463266+00
2059	morning	6	14	10.00	2026-05-12 16:15:12.775775+00
2060	evening	14	22	15.00	2026-05-12 16:15:12.775775+00
2061	night	22	6	12.00	2026-05-12 16:15:12.775775+00
2062	morning	6	14	10.00	2026-05-12 16:15:49.187234+00
2063	evening	14	22	15.00	2026-05-12 16:15:49.187234+00
2064	night	22	6	12.00	2026-05-12 16:15:49.187234+00
2065	morning	6	14	10.00	2026-05-12 16:15:49.282156+00
2066	evening	14	22	15.00	2026-05-12 16:15:49.282156+00
2067	night	22	6	12.00	2026-05-12 16:15:49.282156+00
2068	morning	6	14	10.00	2026-05-12 17:07:19.429642+00
2069	evening	14	22	15.00	2026-05-12 17:07:19.429642+00
2070	night	22	6	12.00	2026-05-12 17:07:19.429642+00
2071	morning	6	14	10.00	2026-05-12 17:07:42.149739+00
2072	evening	14	22	15.00	2026-05-12 17:07:42.149739+00
2073	night	22	6	12.00	2026-05-12 17:07:42.149739+00
2074	morning	6	14	10.00	2026-05-12 17:07:42.170229+00
2075	evening	14	22	15.00	2026-05-12 17:07:42.170229+00
2076	night	22	6	12.00	2026-05-12 17:07:42.170229+00
2077	morning	6	14	10.00	2026-05-12 17:07:42.380987+00
2078	evening	14	22	15.00	2026-05-12 17:07:42.380987+00
2079	night	22	6	12.00	2026-05-12 17:07:42.380987+00
2081	morning	6	14	10.00	2026-05-12 17:18:17.56732+00
2082	evening	14	22	15.00	2026-05-12 17:18:17.56732+00
2083	night	22	6	12.00	2026-05-12 17:18:17.56732+00
2080	morning	6	14	10.00	2026-05-12 17:18:17.551547+00
2084	evening	14	22	15.00	2026-05-12 17:18:17.551547+00
2085	night	22	6	12.00	2026-05-12 17:18:17.551547+00
2086	morning	6	14	10.00	2026-05-12 17:19:10.606411+00
2087	evening	14	22	15.00	2026-05-12 17:19:10.606411+00
2088	night	22	6	12.00	2026-05-12 17:19:10.606411+00
2089	morning	6	14	10.00	2026-05-12 17:19:11.573457+00
2090	evening	14	22	15.00	2026-05-12 17:19:11.573457+00
2091	night	22	6	12.00	2026-05-12 17:19:11.573457+00
2092	morning	6	14	10.00	2026-05-12 17:19:27.600955+00
2093	evening	14	22	15.00	2026-05-12 17:19:27.600955+00
2094	night	22	6	12.00	2026-05-12 17:19:27.600955+00
2095	morning	6	14	10.00	2026-05-12 17:20:04.435316+00
2096	evening	14	22	15.00	2026-05-12 17:20:04.435316+00
2097	night	22	6	12.00	2026-05-12 17:20:04.435316+00
2098	morning	6	14	10.00	2026-05-12 17:23:42.370922+00
2099	evening	14	22	15.00	2026-05-12 17:23:42.370922+00
2100	night	22	6	12.00	2026-05-12 17:23:42.370922+00
2101	morning	6	14	10.00	2026-05-12 17:23:43.388344+00
2102	evening	14	22	15.00	2026-05-12 17:23:43.388344+00
2103	night	22	6	12.00	2026-05-12 17:23:43.388344+00
2104	morning	6	14	10.00	2026-05-12 17:23:49.401687+00
2105	evening	14	22	15.00	2026-05-12 17:23:49.401687+00
2106	night	22	6	12.00	2026-05-12 17:23:49.401687+00
2107	morning	6	14	10.00	2026-05-12 17:23:57.860578+00
2108	evening	14	22	15.00	2026-05-12 17:23:57.860578+00
2109	night	22	6	12.00	2026-05-12 17:23:57.860578+00
2110	morning	6	14	10.00	2026-05-12 17:23:57.920262+00
2111	evening	14	22	15.00	2026-05-12 17:23:57.920262+00
2112	night	22	6	12.00	2026-05-12 17:23:57.920262+00
2113	morning	6	14	10.00	2026-05-12 17:36:55.159679+00
2114	evening	14	22	15.00	2026-05-12 17:36:55.159679+00
2115	night	22	6	12.00	2026-05-12 17:36:55.159679+00
2116	morning	6	14	10.00	2026-05-12 17:37:09.306564+00
2117	evening	14	22	15.00	2026-05-12 17:37:09.306564+00
2118	night	22	6	12.00	2026-05-12 17:37:09.306564+00
2119	morning	6	14	10.00	2026-05-12 17:47:05.771697+00
2120	evening	14	22	15.00	2026-05-12 17:47:05.771697+00
2121	night	22	6	12.00	2026-05-12 17:47:05.771697+00
2122	morning	6	14	10.00	2026-05-12 17:47:05.838063+00
2123	evening	14	22	15.00	2026-05-12 17:47:05.838063+00
2124	night	22	6	12.00	2026-05-12 17:47:05.838063+00
2125	morning	6	14	10.00	2026-05-12 17:47:37.054724+00
2126	evening	14	22	15.00	2026-05-12 17:47:37.054724+00
2127	night	22	6	12.00	2026-05-12 17:47:37.054724+00
2128	morning	6	14	10.00	2026-05-12 18:12:12.274501+00
2129	evening	14	22	15.00	2026-05-12 18:12:12.274501+00
2130	night	22	6	12.00	2026-05-12 18:12:12.274501+00
2131	morning	6	14	10.00	2026-05-12 18:12:12.558875+00
2132	evening	14	22	15.00	2026-05-12 18:12:12.558875+00
2133	night	22	6	12.00	2026-05-12 18:12:12.558875+00
2134	morning	6	14	10.00	2026-05-12 18:12:12.770151+00
2135	evening	14	22	15.00	2026-05-12 18:12:12.770151+00
2136	night	22	6	12.00	2026-05-12 18:12:12.770151+00
2137	morning	6	14	10.00	2026-05-12 18:12:12.794164+00
2138	evening	14	22	15.00	2026-05-12 18:12:12.794164+00
2139	night	22	6	12.00	2026-05-12 18:12:12.794164+00
2141	morning	6	14	10.00	2026-05-12 18:22:36.220646+00
2142	evening	14	22	15.00	2026-05-12 18:22:36.220646+00
2143	night	22	6	12.00	2026-05-12 18:22:36.220646+00
2140	morning	6	14	10.00	2026-05-12 18:22:36.202042+00
2144	evening	14	22	15.00	2026-05-12 18:22:36.202042+00
2145	night	22	6	12.00	2026-05-12 18:22:36.202042+00
2146	morning	6	14	10.00	2026-05-12 20:44:21.561465+00
2147	evening	14	22	15.00	2026-05-12 20:44:21.561465+00
2148	night	22	6	12.00	2026-05-12 20:44:21.561465+00
2149	morning	6	14	10.00	2026-05-12 21:15:59.288765+00
2150	evening	14	22	15.00	2026-05-12 21:15:59.288765+00
2151	night	22	6	12.00	2026-05-12 21:15:59.288765+00
2152	morning	6	14	10.00	2026-05-12 21:16:12.405132+00
2153	evening	14	22	15.00	2026-05-12 21:16:12.405132+00
2154	night	22	6	12.00	2026-05-12 21:16:12.405132+00
2155	morning	6	14	10.00	2026-05-12 21:16:12.412401+00
2156	evening	14	22	15.00	2026-05-12 21:16:12.412401+00
2157	night	22	6	12.00	2026-05-12 21:16:12.412401+00
2158	morning	6	14	10.00	2026-05-12 21:56:15.370551+00
2159	evening	14	22	15.00	2026-05-12 21:56:15.370551+00
2160	night	22	6	12.00	2026-05-12 21:56:15.370551+00
2161	morning	6	14	10.00	2026-05-12 21:56:15.873608+00
2162	evening	14	22	15.00	2026-05-12 21:56:15.873608+00
2163	night	22	6	12.00	2026-05-12 21:56:15.873608+00
2164	morning	6	14	10.00	2026-05-12 21:56:37.836652+00
2165	evening	14	22	15.00	2026-05-12 21:56:37.836652+00
2166	night	22	6	12.00	2026-05-12 21:56:37.836652+00
2167	morning	6	14	10.00	2026-05-12 21:56:37.850392+00
2168	evening	14	22	15.00	2026-05-12 21:56:37.850392+00
2169	night	22	6	12.00	2026-05-12 21:56:37.850392+00
2170	morning	6	14	10.00	2026-05-12 21:56:37.89992+00
2171	evening	14	22	15.00	2026-05-12 21:56:37.89992+00
2172	night	22	6	12.00	2026-05-12 21:56:37.89992+00
2173	morning	6	14	10.00	2026-05-12 21:56:37.925148+00
2174	evening	14	22	15.00	2026-05-12 21:56:37.925148+00
2175	night	22	6	12.00	2026-05-12 21:56:37.925148+00
2176	morning	6	14	10.00	2026-05-12 21:56:37.928192+00
2177	evening	14	22	15.00	2026-05-12 21:56:37.928192+00
2178	night	22	6	12.00	2026-05-12 21:56:37.928192+00
2179	morning	6	14	10.00	2026-05-12 22:26:26.097986+00
2180	evening	14	22	15.00	2026-05-12 22:26:26.097986+00
2181	night	22	6	12.00	2026-05-12 22:26:26.097986+00
2182	morning	6	14	10.00	2026-05-12 22:26:26.55964+00
2183	evening	14	22	15.00	2026-05-12 22:26:26.55964+00
2184	night	22	6	12.00	2026-05-12 22:26:26.55964+00
2185	morning	6	14	10.00	2026-05-12 22:26:32.24458+00
2186	evening	14	22	15.00	2026-05-12 22:26:32.24458+00
2187	night	22	6	12.00	2026-05-12 22:26:32.24458+00
2188	morning	6	14	10.00	2026-05-12 22:26:32.258306+00
2189	evening	14	22	15.00	2026-05-12 22:26:32.258306+00
2190	night	22	6	12.00	2026-05-12 22:26:32.258306+00
2191	morning	6	14	10.00	2026-05-12 22:26:32.291296+00
2192	evening	14	22	15.00	2026-05-12 22:26:32.291296+00
2193	night	22	6	12.00	2026-05-12 22:26:32.291296+00
2194	morning	6	14	10.00	2026-05-12 22:26:32.469389+00
2195	evening	14	22	15.00	2026-05-12 22:26:32.469389+00
2196	night	22	6	12.00	2026-05-12 22:26:32.469389+00
2197	morning	6	14	10.00	2026-05-12 22:26:32.534561+00
2198	evening	14	22	15.00	2026-05-12 22:26:32.534561+00
2199	night	22	6	12.00	2026-05-12 22:26:32.534561+00
2200	morning	6	14	10.00	2026-05-12 22:26:53.340152+00
2201	evening	14	22	15.00	2026-05-12 22:26:53.340152+00
2202	night	22	6	12.00	2026-05-12 22:26:53.340152+00
2203	morning	6	14	10.00	2026-05-12 22:32:30.647321+00
2204	evening	14	22	15.00	2026-05-12 22:32:30.647321+00
2205	night	22	6	12.00	2026-05-12 22:32:30.647321+00
2206	morning	6	14	10.00	2026-05-12 22:32:31.010671+00
2207	evening	14	22	15.00	2026-05-12 22:32:31.010671+00
2208	night	22	6	12.00	2026-05-12 22:32:31.010671+00
2209	morning	6	14	10.00	2026-05-12 22:33:03.781631+00
2210	evening	14	22	15.00	2026-05-12 22:33:03.781631+00
2211	night	22	6	12.00	2026-05-12 22:33:03.781631+00
2212	morning	6	14	10.00	2026-05-12 22:33:13.527002+00
2213	evening	14	22	15.00	2026-05-12 22:33:13.527002+00
2214	night	22	6	12.00	2026-05-12 22:33:13.527002+00
2215	morning	6	14	10.00	2026-05-12 22:33:13.68235+00
2216	evening	14	22	15.00	2026-05-12 22:33:13.68235+00
2217	night	22	6	12.00	2026-05-12 22:33:13.68235+00
2218	morning	6	14	10.00	2026-05-12 22:33:13.824365+00
2219	evening	14	22	15.00	2026-05-12 22:33:13.824365+00
2220	night	22	6	12.00	2026-05-12 22:33:13.824365+00
2221	morning	6	14	10.00	2026-05-12 22:34:35.624584+00
2222	evening	14	22	15.00	2026-05-12 22:34:35.624584+00
2223	night	22	6	12.00	2026-05-12 22:34:35.624584+00
2224	morning	6	14	10.00	2026-05-13 00:03:04.333951+00
2225	evening	14	22	15.00	2026-05-13 00:03:04.333951+00
2226	night	22	6	12.00	2026-05-13 00:03:04.333951+00
2227	morning	6	14	10.00	2026-05-13 00:03:24.321643+00
2228	evening	14	22	15.00	2026-05-13 00:03:24.321643+00
2229	night	22	6	12.00	2026-05-13 00:03:24.321643+00
2230	morning	6	14	10.00	2026-05-13 00:03:31.671836+00
2231	evening	14	22	15.00	2026-05-13 00:03:31.671836+00
2232	night	22	6	12.00	2026-05-13 00:03:31.671836+00
2233	morning	6	14	10.00	2026-05-13 00:03:57.820381+00
2234	evening	14	22	15.00	2026-05-13 00:03:57.820381+00
2235	night	22	6	12.00	2026-05-13 00:03:57.820381+00
2236	morning	6	14	10.00	2026-05-13 00:04:06.452077+00
2237	evening	14	22	15.00	2026-05-13 00:04:06.452077+00
2238	night	22	6	12.00	2026-05-13 00:04:06.452077+00
2239	morning	6	14	10.00	2026-05-13 06:35:30.265804+00
2240	evening	14	22	15.00	2026-05-13 06:35:30.265804+00
2241	night	22	6	12.00	2026-05-13 06:35:30.265804+00
2242	morning	6	14	10.00	2026-05-13 06:35:40.982152+00
2243	evening	14	22	15.00	2026-05-13 06:35:40.982152+00
2244	night	22	6	12.00	2026-05-13 06:35:40.982152+00
2245	morning	6	14	10.00	2026-05-13 06:35:41.003522+00
2246	evening	14	22	15.00	2026-05-13 06:35:41.003522+00
2247	night	22	6	12.00	2026-05-13 06:35:41.003522+00
2248	morning	6	14	10.00	2026-05-13 06:35:41.034174+00
2249	evening	14	22	15.00	2026-05-13 06:35:41.034174+00
2250	night	22	6	12.00	2026-05-13 06:35:41.034174+00
2251	morning	6	14	10.00	2026-05-13 06:37:23.527013+00
2252	evening	14	22	15.00	2026-05-13 06:37:23.527013+00
2253	night	22	6	12.00	2026-05-13 06:37:23.527013+00
2254	morning	6	14	10.00	2026-05-13 07:14:12.561282+00
2255	evening	14	22	15.00	2026-05-13 07:14:12.561282+00
2256	night	22	6	12.00	2026-05-13 07:14:12.561282+00
2257	morning	6	14	10.00	2026-05-13 09:48:44.502549+00
2258	evening	14	22	15.00	2026-05-13 09:48:44.502549+00
2259	night	22	6	12.00	2026-05-13 09:48:44.502549+00
2260	morning	6	14	10.00	2026-05-13 09:48:56.072083+00
2261	evening	14	22	15.00	2026-05-13 09:48:56.072083+00
2262	night	22	6	12.00	2026-05-13 09:48:56.072083+00
2263	morning	6	14	10.00	2026-05-13 09:48:56.1265+00
2264	evening	14	22	15.00	2026-05-13 09:48:56.1265+00
2265	night	22	6	12.00	2026-05-13 09:48:56.1265+00
2266	morning	6	14	10.00	2026-05-13 09:49:17.441128+00
2267	evening	14	22	15.00	2026-05-13 09:49:17.441128+00
2268	night	22	6	12.00	2026-05-13 09:49:17.441128+00
2269	morning	6	14	10.00	2026-05-13 09:54:34.824804+00
2270	evening	14	22	15.00	2026-05-13 09:54:34.824804+00
2271	night	22	6	12.00	2026-05-13 09:54:34.824804+00
2272	morning	6	14	10.00	2026-05-13 10:59:14.943865+00
2273	evening	14	22	15.00	2026-05-13 10:59:14.943865+00
2274	night	22	6	12.00	2026-05-13 10:59:14.943865+00
2275	morning	6	14	10.00	2026-05-13 12:05:45.575534+00
2276	evening	14	22	15.00	2026-05-13 12:05:45.575534+00
2277	night	22	6	12.00	2026-05-13 12:05:45.575534+00
2278	morning	6	14	10.00	2026-05-13 13:34:45.216304+00
2279	evening	14	22	15.00	2026-05-13 13:34:45.216304+00
2280	night	22	6	12.00	2026-05-13 13:34:45.216304+00
2281	morning	6	14	10.00	2026-05-13 13:34:45.607673+00
2282	evening	14	22	15.00	2026-05-13 13:34:45.607673+00
2283	night	22	6	12.00	2026-05-13 13:34:45.607673+00
2284	morning	6	14	10.00	2026-05-13 13:34:52.87052+00
2285	evening	14	22	15.00	2026-05-13 13:34:52.87052+00
2286	night	22	6	12.00	2026-05-13 13:34:52.87052+00
2287	morning	6	14	10.00	2026-05-13 13:34:52.876495+00
2288	evening	14	22	15.00	2026-05-13 13:34:52.876495+00
2289	night	22	6	12.00	2026-05-13 13:34:52.876495+00
2290	morning	6	14	10.00	2026-05-13 13:34:52.879975+00
2291	evening	14	22	15.00	2026-05-13 13:34:52.879975+00
2292	night	22	6	12.00	2026-05-13 13:34:52.879975+00
2293	morning	6	14	10.00	2026-05-13 13:34:52.948226+00
2294	evening	14	22	15.00	2026-05-13 13:34:52.948226+00
2295	night	22	6	12.00	2026-05-13 13:34:52.948226+00
2296	morning	6	14	10.00	2026-05-13 13:34:52.958193+00
2297	evening	14	22	15.00	2026-05-13 13:34:52.958193+00
2298	night	22	6	12.00	2026-05-13 13:34:52.958193+00
2299	morning	6	14	10.00	2026-05-13 13:37:02.039825+00
2300	evening	14	22	15.00	2026-05-13 13:37:02.039825+00
2301	night	22	6	12.00	2026-05-13 13:37:02.039825+00
2302	morning	6	14	10.00	2026-05-13 13:37:08.273297+00
2303	evening	14	22	15.00	2026-05-13 13:37:08.273297+00
2304	night	22	6	12.00	2026-05-13 13:37:08.273297+00
2305	morning	6	14	10.00	2026-05-13 13:43:45.114493+00
2306	evening	14	22	15.00	2026-05-13 13:43:45.114493+00
2307	night	22	6	12.00	2026-05-13 13:43:45.114493+00
2308	morning	6	14	10.00	2026-05-13 13:43:55.211163+00
2309	evening	14	22	15.00	2026-05-13 13:43:55.211163+00
2310	night	22	6	12.00	2026-05-13 13:43:55.211163+00
2311	morning	6	14	10.00	2026-05-13 13:44:25.097201+00
2312	evening	14	22	15.00	2026-05-13 13:44:25.097201+00
2313	night	22	6	12.00	2026-05-13 13:44:25.097201+00
2314	morning	6	14	10.00	2026-05-13 13:44:25.137839+00
2315	evening	14	22	15.00	2026-05-13 13:44:25.137839+00
2316	night	22	6	12.00	2026-05-13 13:44:25.137839+00
2317	morning	6	14	10.00	2026-05-13 13:44:25.328395+00
2318	evening	14	22	15.00	2026-05-13 13:44:25.328395+00
2319	night	22	6	12.00	2026-05-13 13:44:25.328395+00
2320	morning	6	14	10.00	2026-05-13 13:54:37.946109+00
2321	evening	14	22	15.00	2026-05-13 13:54:37.946109+00
2322	night	22	6	12.00	2026-05-13 13:54:37.946109+00
2323	morning	6	14	10.00	2026-05-13 13:54:38.059758+00
2324	evening	14	22	15.00	2026-05-13 13:54:38.059758+00
2325	night	22	6	12.00	2026-05-13 13:54:38.059758+00
2326	morning	6	14	10.00	2026-05-13 14:05:17.854122+00
2327	evening	14	22	15.00	2026-05-13 14:05:17.854122+00
2328	night	22	6	12.00	2026-05-13 14:05:17.854122+00
2329	morning	6	14	10.00	2026-05-13 14:05:17.914075+00
2330	evening	14	22	15.00	2026-05-13 14:05:17.914075+00
2331	night	22	6	12.00	2026-05-13 14:05:17.914075+00
2332	morning	6	14	10.00	2026-05-13 14:10:56.734451+00
2333	evening	14	22	15.00	2026-05-13 14:10:56.734451+00
2334	night	22	6	12.00	2026-05-13 14:10:56.734451+00
2335	morning	6	14	10.00	2026-05-13 14:11:06.846736+00
2336	evening	14	22	15.00	2026-05-13 14:11:06.846736+00
2337	night	22	6	12.00	2026-05-13 14:11:06.846736+00
2338	morning	6	14	10.00	2026-05-13 14:11:06.905249+00
2339	evening	14	22	15.00	2026-05-13 14:11:06.905249+00
2340	night	22	6	12.00	2026-05-13 14:11:06.905249+00
2341	morning	6	14	10.00	2026-05-13 14:24:42.365817+00
2343	evening	14	22	15.00	2026-05-13 14:24:42.365817+00
2344	night	22	6	12.00	2026-05-13 14:24:42.365817+00
2342	morning	6	14	10.00	2026-05-13 14:24:42.373337+00
2345	evening	14	22	15.00	2026-05-13 14:24:42.373337+00
2346	night	22	6	12.00	2026-05-13 14:24:42.373337+00
2347	morning	6	14	10.00	2026-05-13 14:24:42.490021+00
2348	evening	14	22	15.00	2026-05-13 14:24:42.490021+00
2349	night	22	6	12.00	2026-05-13 14:24:42.490021+00
2350	morning	6	14	10.00	2026-05-13 15:31:00.368201+00
2351	evening	14	22	15.00	2026-05-13 15:31:00.368201+00
2352	night	22	6	12.00	2026-05-13 15:31:00.368201+00
2353	morning	6	14	10.00	2026-05-13 15:31:00.425974+00
2354	evening	14	22	15.00	2026-05-13 15:31:00.425974+00
2355	night	22	6	12.00	2026-05-13 15:31:00.425974+00
2356	morning	6	14	10.00	2026-05-13 15:31:37.053188+00
2357	evening	14	22	15.00	2026-05-13 15:31:37.053188+00
2358	night	22	6	12.00	2026-05-13 15:31:37.053188+00
2359	morning	6	14	10.00	2026-05-13 15:31:37.087122+00
2360	evening	14	22	15.00	2026-05-13 15:31:37.087122+00
2361	night	22	6	12.00	2026-05-13 15:31:37.087122+00
2362	morning	6	14	10.00	2026-05-13 15:31:37.189536+00
2363	evening	14	22	15.00	2026-05-13 15:31:37.189536+00
2364	night	22	6	12.00	2026-05-13 15:31:37.189536+00
2365	morning	6	14	10.00	2026-05-13 16:55:07.593583+00
2366	evening	14	22	15.00	2026-05-13 16:55:07.593583+00
2367	night	22	6	12.00	2026-05-13 16:55:07.593583+00
2368	morning	6	14	10.00	2026-05-13 16:55:30.952376+00
2369	evening	14	22	15.00	2026-05-13 16:55:30.952376+00
2370	night	22	6	12.00	2026-05-13 16:55:30.952376+00
2371	morning	6	14	10.00	2026-05-13 16:55:31.0413+00
2372	evening	14	22	15.00	2026-05-13 16:55:31.0413+00
2373	night	22	6	12.00	2026-05-13 16:55:31.0413+00
2374	morning	6	14	10.00	2026-05-13 16:56:03.126965+00
2375	evening	14	22	15.00	2026-05-13 16:56:03.126965+00
2376	night	22	6	12.00	2026-05-13 16:56:03.126965+00
2377	morning	6	14	10.00	2026-05-13 16:56:03.139255+00
2378	evening	14	22	15.00	2026-05-13 16:56:03.139255+00
2379	night	22	6	12.00	2026-05-13 16:56:03.139255+00
2380	morning	6	14	10.00	2026-05-13 17:06:25.239519+00
2381	evening	14	22	15.00	2026-05-13 17:06:25.239519+00
2382	night	22	6	12.00	2026-05-13 17:06:25.239519+00
2383	morning	6	14	10.00	2026-05-13 17:06:25.422259+00
2384	evening	14	22	15.00	2026-05-13 17:06:25.422259+00
2385	night	22	6	12.00	2026-05-13 17:06:25.422259+00
2386	morning	6	14	10.00	2026-05-13 17:06:25.441579+00
2387	evening	14	22	15.00	2026-05-13 17:06:25.441579+00
2388	night	22	6	12.00	2026-05-13 17:06:25.441579+00
2389	morning	6	14	10.00	2026-05-13 17:09:18.504459+00
2390	evening	14	22	15.00	2026-05-13 17:09:18.504459+00
2391	night	22	6	12.00	2026-05-13 17:09:18.504459+00
2392	morning	6	14	10.00	2026-05-13 17:09:19.4772+00
2393	evening	14	22	15.00	2026-05-13 17:09:19.4772+00
2394	night	22	6	12.00	2026-05-13 17:09:19.4772+00
2395	morning	6	14	10.00	2026-05-13 17:09:33.871229+00
2396	evening	14	22	15.00	2026-05-13 17:09:33.871229+00
2397	night	22	6	12.00	2026-05-13 17:09:33.871229+00
2398	morning	6	14	10.00	2026-05-13 17:09:33.957414+00
2399	evening	14	22	15.00	2026-05-13 17:09:33.957414+00
2400	night	22	6	12.00	2026-05-13 17:09:33.957414+00
2401	morning	6	14	10.00	2026-05-13 17:09:40.408147+00
2402	evening	14	22	15.00	2026-05-13 17:09:40.408147+00
2403	night	22	6	12.00	2026-05-13 17:09:40.408147+00
2405	morning	6	14	10.00	2026-05-13 17:30:54.503822+00
2406	evening	14	22	15.00	2026-05-13 17:30:54.503822+00
2407	night	22	6	12.00	2026-05-13 17:30:54.503822+00
2404	morning	6	14	10.00	2026-05-13 17:30:54.502121+00
2408	evening	14	22	15.00	2026-05-13 17:30:54.502121+00
2409	night	22	6	12.00	2026-05-13 17:30:54.502121+00
2410	morning	6	14	10.00	2026-05-13 17:30:55.90508+00
2411	evening	14	22	15.00	2026-05-13 17:30:55.90508+00
2412	night	22	6	12.00	2026-05-13 17:30:55.90508+00
2413	morning	6	14	10.00	2026-05-13 17:30:55.987679+00
2414	evening	14	22	15.00	2026-05-13 17:30:55.987679+00
2415	night	22	6	12.00	2026-05-13 17:30:55.987679+00
2416	morning	6	14	10.00	2026-05-13 21:04:23.928477+00
2417	evening	14	22	15.00	2026-05-13 21:04:23.928477+00
2418	night	22	6	12.00	2026-05-13 21:04:23.928477+00
2419	morning	6	14	10.00	2026-05-13 21:04:24.693547+00
2420	evening	14	22	15.00	2026-05-13 21:04:24.693547+00
2421	night	22	6	12.00	2026-05-13 21:04:24.693547+00
2422	morning	6	14	10.00	2026-05-13 21:04:44.823841+00
2423	evening	14	22	15.00	2026-05-13 21:04:44.823841+00
2424	night	22	6	12.00	2026-05-13 21:04:44.823841+00
2425	morning	6	14	10.00	2026-05-13 21:04:55.533694+00
2426	evening	14	22	15.00	2026-05-13 21:04:55.533694+00
2427	night	22	6	12.00	2026-05-13 21:04:55.533694+00
2428	morning	6	14	10.00	2026-05-13 21:05:40.902125+00
2429	evening	14	22	15.00	2026-05-13 21:05:40.902125+00
2430	night	22	6	12.00	2026-05-13 21:05:40.902125+00
2431	morning	6	14	10.00	2026-05-13 21:14:57.445877+00
2432	evening	14	22	15.00	2026-05-13 21:14:57.445877+00
2433	night	22	6	12.00	2026-05-13 21:14:57.445877+00
2434	morning	6	14	10.00	2026-05-13 21:14:57.475322+00
2435	evening	14	22	15.00	2026-05-13 21:14:57.475322+00
2436	night	22	6	12.00	2026-05-13 21:14:57.475322+00
2437	morning	6	14	10.00	2026-05-13 21:14:57.4812+00
2438	evening	14	22	15.00	2026-05-13 21:14:57.4812+00
2439	night	22	6	12.00	2026-05-13 21:14:57.4812+00
2440	morning	6	14	10.00	2026-05-13 22:08:21.354903+00
2441	evening	14	22	15.00	2026-05-13 22:08:21.354903+00
2442	night	22	6	12.00	2026-05-13 22:08:21.354903+00
2443	morning	6	14	10.00	2026-05-13 22:08:42.175178+00
2444	evening	14	22	15.00	2026-05-13 22:08:42.175178+00
2445	night	22	6	12.00	2026-05-13 22:08:42.175178+00
2446	morning	6	14	10.00	2026-05-13 22:08:42.243497+00
2447	evening	14	22	15.00	2026-05-13 22:08:42.243497+00
2448	night	22	6	12.00	2026-05-13 22:08:42.243497+00
2449	morning	6	14	10.00	2026-05-13 22:08:42.249333+00
2450	evening	14	22	15.00	2026-05-13 22:08:42.249333+00
2451	night	22	6	12.00	2026-05-13 22:08:42.249333+00
2455	morning	6	14	10.00	2026-05-13 22:40:55.217489+00
2456	evening	14	22	15.00	2026-05-13 22:40:55.217489+00
2457	night	22	6	12.00	2026-05-13 22:40:55.217489+00
2452	morning	6	14	10.00	2026-05-13 22:40:55.204655+00
2458	evening	14	22	15.00	2026-05-13 22:40:55.204655+00
2459	night	22	6	12.00	2026-05-13 22:40:55.204655+00
2453	morning	6	14	10.00	2026-05-13 22:40:55.208256+00
2460	evening	14	22	15.00	2026-05-13 22:40:55.208256+00
2461	night	22	6	12.00	2026-05-13 22:40:55.208256+00
2462	morning	6	14	10.00	2026-05-13 22:40:55.224355+00
2463	evening	14	22	15.00	2026-05-13 22:40:55.224355+00
2464	night	22	6	12.00	2026-05-13 22:40:55.224355+00
2454	morning	6	14	10.00	2026-05-13 22:40:55.212687+00
2465	evening	14	22	15.00	2026-05-13 22:40:55.212687+00
2466	night	22	6	12.00	2026-05-13 22:40:55.212687+00
2468	morning	6	14	10.00	2026-05-13 22:57:30.783904+00
2469	evening	14	22	15.00	2026-05-13 22:57:30.783904+00
2470	night	22	6	12.00	2026-05-13 22:57:30.783904+00
2467	morning	6	14	10.00	2026-05-13 22:57:30.789409+00
2471	evening	14	22	15.00	2026-05-13 22:57:30.789409+00
2472	night	22	6	12.00	2026-05-13 22:57:30.789409+00
2473	morning	6	14	10.00	2026-05-13 22:57:50.35274+00
2474	evening	14	22	15.00	2026-05-13 22:57:50.35274+00
2475	night	22	6	12.00	2026-05-13 22:57:50.35274+00
2476	morning	6	14	10.00	2026-05-13 22:57:51.359364+00
2477	evening	14	22	15.00	2026-05-13 22:57:51.359364+00
2478	night	22	6	12.00	2026-05-13 22:57:51.359364+00
2479	morning	6	14	10.00	2026-05-13 22:58:28.161865+00
2480	evening	14	22	15.00	2026-05-13 22:58:28.161865+00
2481	night	22	6	12.00	2026-05-13 22:58:28.161865+00
2482	morning	6	14	10.00	2026-05-13 22:58:29.131561+00
2483	evening	14	22	15.00	2026-05-13 22:58:29.131561+00
2484	night	22	6	12.00	2026-05-13 22:58:29.131561+00
2485	morning	6	14	10.00	2026-05-13 23:43:37.893715+00
2486	evening	14	22	15.00	2026-05-13 23:43:37.893715+00
2487	night	22	6	12.00	2026-05-13 23:43:37.893715+00
2488	morning	6	14	10.00	2026-05-13 23:43:38.043827+00
2489	evening	14	22	15.00	2026-05-13 23:43:38.043827+00
2490	night	22	6	12.00	2026-05-13 23:43:38.043827+00
2491	morning	6	14	10.00	2026-05-13 23:43:59.908201+00
2492	evening	14	22	15.00	2026-05-13 23:43:59.908201+00
2493	night	22	6	12.00	2026-05-13 23:43:59.908201+00
2494	morning	6	14	10.00	2026-05-13 23:44:00.186809+00
2495	evening	14	22	15.00	2026-05-13 23:44:00.186809+00
2496	night	22	6	12.00	2026-05-13 23:44:00.186809+00
2497	morning	6	14	10.00	2026-05-13 23:44:31.109431+00
2498	evening	14	22	15.00	2026-05-13 23:44:31.109431+00
2499	night	22	6	12.00	2026-05-13 23:44:31.109431+00
2500	morning	6	14	10.00	2026-05-13 23:51:20.32854+00
2501	evening	14	22	15.00	2026-05-13 23:51:20.32854+00
2502	night	22	6	12.00	2026-05-13 23:51:20.32854+00
2503	morning	6	14	10.00	2026-05-13 23:51:20.453662+00
2504	evening	14	22	15.00	2026-05-13 23:51:20.453662+00
2505	night	22	6	12.00	2026-05-13 23:51:20.453662+00
2506	morning	6	14	10.00	2026-05-13 23:51:25.750324+00
2507	evening	14	22	15.00	2026-05-13 23:51:25.750324+00
2508	night	22	6	12.00	2026-05-13 23:51:25.750324+00
2510	morning	6	14	10.00	2026-05-14 00:02:26.496534+00
2511	evening	14	22	15.00	2026-05-14 00:02:26.496534+00
2512	night	22	6	12.00	2026-05-14 00:02:26.496534+00
2509	morning	6	14	10.00	2026-05-14 00:02:26.494533+00
2513	evening	14	22	15.00	2026-05-14 00:02:26.494533+00
2514	night	22	6	12.00	2026-05-14 00:02:26.494533+00
2515	morning	6	14	10.00	2026-05-14 00:03:38.839262+00
2516	evening	14	22	15.00	2026-05-14 00:03:38.839262+00
2517	night	22	6	12.00	2026-05-14 00:03:38.839262+00
2518	morning	6	14	10.00	2026-05-14 00:12:06.151746+00
2519	evening	14	22	15.00	2026-05-14 00:12:06.151746+00
2520	night	22	6	12.00	2026-05-14 00:12:06.151746+00
2521	morning	6	14	10.00	2026-05-14 00:12:36.604573+00
2522	evening	14	22	15.00	2026-05-14 00:12:36.604573+00
2523	night	22	6	12.00	2026-05-14 00:12:36.604573+00
2524	morning	6	14	10.00	2026-05-14 00:12:36.660903+00
2525	evening	14	22	15.00	2026-05-14 00:12:36.660903+00
2526	night	22	6	12.00	2026-05-14 00:12:36.660903+00
2527	morning	6	14	10.00	2026-05-14 00:12:36.677688+00
2528	evening	14	22	15.00	2026-05-14 00:12:36.677688+00
2529	night	22	6	12.00	2026-05-14 00:12:36.677688+00
2530	morning	6	14	10.00	2026-05-14 00:13:13.133171+00
2531	evening	14	22	15.00	2026-05-14 00:13:13.133171+00
2532	night	22	6	12.00	2026-05-14 00:13:13.133171+00
2534	morning	6	14	10.00	2026-05-14 00:18:54.933657+00
2535	evening	14	22	15.00	2026-05-14 00:18:54.933657+00
2536	night	22	6	12.00	2026-05-14 00:18:54.933657+00
2533	morning	6	14	10.00	2026-05-14 00:18:54.926277+00
2537	evening	14	22	15.00	2026-05-14 00:18:54.926277+00
2538	night	22	6	12.00	2026-05-14 00:18:54.926277+00
2539	morning	6	14	10.00	2026-05-14 00:19:11.569698+00
2540	evening	14	22	15.00	2026-05-14 00:19:11.569698+00
2541	night	22	6	12.00	2026-05-14 00:19:11.569698+00
2542	morning	6	14	10.00	2026-05-14 00:19:11.652491+00
2543	evening	14	22	15.00	2026-05-14 00:19:11.652491+00
2544	night	22	6	12.00	2026-05-14 00:19:11.652491+00
2545	morning	6	14	10.00	2026-05-14 00:19:11.685853+00
2546	evening	14	22	15.00	2026-05-14 00:19:11.685853+00
2547	night	22	6	12.00	2026-05-14 00:19:11.685853+00
2548	morning	6	14	10.00	2026-05-14 00:29:36.542754+00
2549	evening	14	22	15.00	2026-05-14 00:29:36.542754+00
2550	night	22	6	12.00	2026-05-14 00:29:36.542754+00
2551	morning	6	14	10.00	2026-05-14 00:29:37.427577+00
2552	evening	14	22	15.00	2026-05-14 00:29:37.427577+00
2553	night	22	6	12.00	2026-05-14 00:29:37.427577+00
2554	morning	6	14	10.00	2026-05-14 00:33:55.637237+00
2555	evening	14	22	15.00	2026-05-14 00:33:55.637237+00
2556	night	22	6	12.00	2026-05-14 00:33:55.637237+00
2557	morning	6	14	10.00	2026-05-14 09:19:21.369576+00
2558	evening	14	22	15.00	2026-05-14 09:19:21.369576+00
2559	night	22	6	12.00	2026-05-14 09:19:21.369576+00
2560	morning	6	14	10.00	2026-05-14 09:29:10.328764+00
2561	evening	14	22	15.00	2026-05-14 09:29:10.328764+00
2562	night	22	6	12.00	2026-05-14 09:29:10.328764+00
2563	morning	6	14	10.00	2026-05-14 09:29:10.834427+00
2564	evening	14	22	15.00	2026-05-14 09:29:10.834427+00
2565	night	22	6	12.00	2026-05-14 09:29:10.834427+00
2566	morning	6	14	10.00	2026-05-14 09:29:46.186149+00
2567	evening	14	22	15.00	2026-05-14 09:29:46.186149+00
2568	night	22	6	12.00	2026-05-14 09:29:46.186149+00
2569	morning	6	14	10.00	2026-05-14 09:29:47.398579+00
2570	evening	14	22	15.00	2026-05-14 09:29:47.398579+00
2571	night	22	6	12.00	2026-05-14 09:29:47.398579+00
2572	morning	6	14	10.00	2026-05-14 09:29:50.727833+00
2573	evening	14	22	15.00	2026-05-14 09:29:50.727833+00
2574	night	22	6	12.00	2026-05-14 09:29:50.727833+00
2575	morning	6	14	10.00	2026-05-14 09:29:50.864462+00
2576	evening	14	22	15.00	2026-05-14 09:29:50.864462+00
2577	night	22	6	12.00	2026-05-14 09:29:50.864462+00
2578	morning	6	14	10.00	2026-05-14 09:29:50.904543+00
2579	evening	14	22	15.00	2026-05-14 09:29:50.904543+00
2580	night	22	6	12.00	2026-05-14 09:29:50.904543+00
2581	morning	6	14	10.00	2026-05-14 09:42:29.652681+00
2582	evening	14	22	15.00	2026-05-14 09:42:29.652681+00
2583	night	22	6	12.00	2026-05-14 09:42:29.652681+00
2584	morning	6	14	10.00	2026-05-14 09:42:30.097494+00
2585	evening	14	22	15.00	2026-05-14 09:42:30.097494+00
2586	night	22	6	12.00	2026-05-14 09:42:30.097494+00
2587	morning	6	14	10.00	2026-05-14 09:42:31.01045+00
2588	evening	14	22	15.00	2026-05-14 09:42:31.01045+00
2589	night	22	6	12.00	2026-05-14 09:42:31.01045+00
2590	morning	6	14	10.00	2026-05-14 09:42:31.020321+00
2591	evening	14	22	15.00	2026-05-14 09:42:31.020321+00
2592	night	22	6	12.00	2026-05-14 09:42:31.020321+00
2593	morning	6	14	10.00	2026-05-14 09:42:31.097264+00
2594	evening	14	22	15.00	2026-05-14 09:42:31.097264+00
2595	night	22	6	12.00	2026-05-14 09:42:31.097264+00
2596	morning	6	14	10.00	2026-05-14 09:44:14.034466+00
2597	evening	14	22	15.00	2026-05-14 09:44:14.034466+00
2598	night	22	6	12.00	2026-05-14 09:44:14.034466+00
2599	morning	6	14	10.00	2026-05-14 09:44:32.385044+00
2600	evening	14	22	15.00	2026-05-14 09:44:32.385044+00
2601	night	22	6	12.00	2026-05-14 09:44:32.385044+00
2602	morning	6	14	10.00	2026-05-14 12:31:33.476032+00
2603	evening	14	22	15.00	2026-05-14 12:31:33.476032+00
2604	night	22	6	12.00	2026-05-14 12:31:33.476032+00
2605	morning	6	14	10.00	2026-05-14 12:48:30.626265+00
2606	evening	14	22	15.00	2026-05-14 12:48:30.626265+00
2607	night	22	6	12.00	2026-05-14 12:48:30.626265+00
2608	morning	6	14	10.00	2026-05-14 12:49:01.308011+00
2609	evening	14	22	15.00	2026-05-14 12:49:01.308011+00
2610	night	22	6	12.00	2026-05-14 12:49:01.308011+00
2611	morning	6	14	10.00	2026-05-14 12:49:01.46006+00
2612	evening	14	22	15.00	2026-05-14 12:49:01.46006+00
2613	night	22	6	12.00	2026-05-14 12:49:01.46006+00
2614	morning	6	14	10.00	2026-05-14 12:49:01.506005+00
2615	evening	14	22	15.00	2026-05-14 12:49:01.506005+00
2616	night	22	6	12.00	2026-05-14 12:49:01.506005+00
2617	morning	6	14	10.00	2026-05-14 12:49:01.654328+00
2618	evening	14	22	15.00	2026-05-14 12:49:01.654328+00
2619	night	22	6	12.00	2026-05-14 12:49:01.654328+00
2620	morning	6	14	10.00	2026-05-14 13:24:42.309397+00
2621	evening	14	22	15.00	2026-05-14 13:24:42.309397+00
2622	night	22	6	12.00	2026-05-14 13:24:42.309397+00
2623	morning	6	14	10.00	2026-05-14 14:13:31.959232+00
2624	evening	14	22	15.00	2026-05-14 14:13:31.959232+00
2625	night	22	6	12.00	2026-05-14 14:13:31.959232+00
2626	morning	6	14	10.00	2026-05-14 14:14:20.803628+00
2627	evening	14	22	15.00	2026-05-14 14:14:20.803628+00
2628	night	22	6	12.00	2026-05-14 14:14:20.803628+00
2629	morning	6	14	10.00	2026-05-14 14:14:20.844613+00
2630	evening	14	22	15.00	2026-05-14 14:14:20.844613+00
2631	night	22	6	12.00	2026-05-14 14:14:20.844613+00
2632	morning	6	14	10.00	2026-05-14 14:14:20.853054+00
2633	evening	14	22	15.00	2026-05-14 14:14:20.853054+00
2634	night	22	6	12.00	2026-05-14 14:14:20.853054+00
2635	morning	6	14	10.00	2026-05-14 14:14:21.10188+00
2636	evening	14	22	15.00	2026-05-14 14:14:21.10188+00
2637	night	22	6	12.00	2026-05-14 14:14:21.10188+00
2638	morning	6	14	10.00	2026-05-14 14:51:21.580714+00
2639	evening	14	22	15.00	2026-05-14 14:51:21.580714+00
2640	night	22	6	12.00	2026-05-14 14:51:21.580714+00
2641	morning	6	14	10.00	2026-05-14 14:51:22.32811+00
2642	evening	14	22	15.00	2026-05-14 14:51:22.32811+00
2643	night	22	6	12.00	2026-05-14 14:51:22.32811+00
2644	morning	6	14	10.00	2026-05-14 14:51:47.65115+00
2645	evening	14	22	15.00	2026-05-14 14:51:47.65115+00
2646	night	22	6	12.00	2026-05-14 14:51:47.65115+00
2647	morning	6	14	10.00	2026-05-14 14:51:47.699946+00
2648	evening	14	22	15.00	2026-05-14 14:51:47.699946+00
2649	night	22	6	12.00	2026-05-14 14:51:47.699946+00
2650	morning	6	14	10.00	2026-05-14 15:02:12.702395+00
2651	evening	14	22	15.00	2026-05-14 15:02:12.702395+00
2652	night	22	6	12.00	2026-05-14 15:02:12.702395+00
2653	morning	6	14	10.00	2026-05-14 15:02:12.857744+00
2654	evening	14	22	15.00	2026-05-14 15:02:12.857744+00
2655	night	22	6	12.00	2026-05-14 15:02:12.857744+00
2656	morning	6	14	10.00	2026-05-14 15:02:13.346045+00
2657	evening	14	22	15.00	2026-05-14 15:02:13.346045+00
2658	night	22	6	12.00	2026-05-14 15:02:13.346045+00
2659	morning	6	14	10.00	2026-05-14 15:52:47.273168+00
2660	evening	14	22	15.00	2026-05-14 15:52:47.273168+00
2661	night	22	6	12.00	2026-05-14 15:52:47.273168+00
2662	morning	6	14	10.00	2026-05-14 15:54:42.111692+00
2663	evening	14	22	15.00	2026-05-14 15:54:42.111692+00
2664	night	22	6	12.00	2026-05-14 15:54:42.111692+00
2665	morning	6	14	10.00	2026-05-14 15:54:53.828681+00
2666	evening	14	22	15.00	2026-05-14 15:54:53.828681+00
2667	night	22	6	12.00	2026-05-14 15:54:53.828681+00
2668	morning	6	14	10.00	2026-05-14 15:54:53.865246+00
2669	evening	14	22	15.00	2026-05-14 15:54:53.865246+00
2670	night	22	6	12.00	2026-05-14 15:54:53.865246+00
2671	morning	6	14	10.00	2026-05-14 15:54:53.899745+00
2672	evening	14	22	15.00	2026-05-14 15:54:53.899745+00
2673	night	22	6	12.00	2026-05-14 15:54:53.899745+00
2674	morning	6	14	10.00	2026-05-14 15:57:03.137333+00
2675	evening	14	22	15.00	2026-05-14 15:57:03.137333+00
2676	night	22	6	12.00	2026-05-14 15:57:03.137333+00
2677	morning	6	14	10.00	2026-05-14 16:15:57.23009+00
2678	evening	14	22	15.00	2026-05-14 16:15:57.23009+00
2679	night	22	6	12.00	2026-05-14 16:15:57.23009+00
2680	morning	6	14	10.00	2026-05-14 16:16:24.614817+00
2681	evening	14	22	15.00	2026-05-14 16:16:24.614817+00
2682	night	22	6	12.00	2026-05-14 16:16:24.614817+00
2683	morning	6	14	10.00	2026-05-14 16:16:24.764329+00
2684	evening	14	22	15.00	2026-05-14 16:16:24.764329+00
2685	night	22	6	12.00	2026-05-14 16:16:24.764329+00
2686	morning	6	14	10.00	2026-05-14 16:16:24.809965+00
2687	evening	14	22	15.00	2026-05-14 16:16:24.809965+00
2688	night	22	6	12.00	2026-05-14 16:16:24.809965+00
2689	morning	6	14	10.00	2026-05-14 16:36:16.827863+00
2690	evening	14	22	15.00	2026-05-14 16:36:16.827863+00
2691	night	22	6	12.00	2026-05-14 16:36:16.827863+00
2692	morning	6	14	10.00	2026-05-14 16:36:16.852798+00
2693	evening	14	22	15.00	2026-05-14 16:36:16.852798+00
2694	night	22	6	12.00	2026-05-14 16:36:16.852798+00
2695	morning	6	14	10.00	2026-05-14 16:39:37.892472+00
2696	evening	14	22	15.00	2026-05-14 16:39:37.892472+00
2697	night	22	6	12.00	2026-05-14 16:39:37.892472+00
2698	morning	6	14	10.00	2026-05-14 16:39:39.034833+00
2699	evening	14	22	15.00	2026-05-14 16:39:39.034833+00
2700	night	22	6	12.00	2026-05-14 16:39:39.034833+00
2701	morning	6	14	10.00	2026-05-14 16:39:45.785133+00
2702	evening	14	22	15.00	2026-05-14 16:39:45.785133+00
2703	night	22	6	12.00	2026-05-14 16:39:45.785133+00
2704	morning	6	14	10.00	2026-05-14 16:40:03.809842+00
2705	evening	14	22	15.00	2026-05-14 16:40:03.809842+00
2706	night	22	6	12.00	2026-05-14 16:40:03.809842+00
2707	morning	6	14	10.00	2026-05-14 17:03:44.391228+00
2708	evening	14	22	15.00	2026-05-14 17:03:44.391228+00
2709	night	22	6	12.00	2026-05-14 17:03:44.391228+00
2710	morning	6	14	10.00	2026-05-14 17:03:57.028612+00
2711	evening	14	22	15.00	2026-05-14 17:03:57.028612+00
2712	night	22	6	12.00	2026-05-14 17:03:57.028612+00
2713	morning	6	14	10.00	2026-05-14 17:03:57.057643+00
2714	evening	14	22	15.00	2026-05-14 17:03:57.057643+00
2715	night	22	6	12.00	2026-05-14 17:03:57.057643+00
2716	morning	6	14	10.00	2026-05-14 17:23:05.099462+00
2717	evening	14	22	15.00	2026-05-14 17:23:05.099462+00
2718	night	22	6	12.00	2026-05-14 17:23:05.099462+00
2719	morning	6	14	10.00	2026-05-14 17:23:14.985921+00
2720	evening	14	22	15.00	2026-05-14 17:23:14.985921+00
2721	night	22	6	12.00	2026-05-14 17:23:14.985921+00
2722	morning	6	14	10.00	2026-05-14 17:23:15.127358+00
2723	evening	14	22	15.00	2026-05-14 17:23:15.127358+00
2724	night	22	6	12.00	2026-05-14 17:23:15.127358+00
2725	morning	6	14	10.00	2026-05-14 17:23:15.131182+00
2726	evening	14	22	15.00	2026-05-14 17:23:15.131182+00
2727	night	22	6	12.00	2026-05-14 17:23:15.131182+00
2728	morning	6	14	10.00	2026-05-14 17:23:15.148565+00
2729	evening	14	22	15.00	2026-05-14 17:23:15.148565+00
2730	night	22	6	12.00	2026-05-14 17:23:15.148565+00
2731	morning	6	14	10.00	2026-05-14 18:25:45.311167+00
2732	evening	14	22	15.00	2026-05-14 18:25:45.311167+00
2733	night	22	6	12.00	2026-05-14 18:25:45.311167+00
2734	morning	6	14	10.00	2026-05-14 20:33:17.044015+00
2735	evening	14	22	15.00	2026-05-14 20:33:17.044015+00
2736	night	22	6	12.00	2026-05-14 20:33:17.044015+00
2737	morning	6	14	10.00	2026-05-14 20:33:28.10537+00
2738	evening	14	22	15.00	2026-05-14 20:33:28.10537+00
2739	night	22	6	12.00	2026-05-14 20:33:28.10537+00
2740	morning	6	14	10.00	2026-05-14 20:33:28.164393+00
2741	evening	14	22	15.00	2026-05-14 20:33:28.164393+00
2742	night	22	6	12.00	2026-05-14 20:33:28.164393+00
2743	morning	6	14	10.00	2026-05-14 20:33:28.183442+00
2744	evening	14	22	15.00	2026-05-14 20:33:28.183442+00
2745	night	22	6	12.00	2026-05-14 20:33:28.183442+00
2746	morning	6	14	10.00	2026-05-14 20:38:57.772572+00
2747	evening	14	22	15.00	2026-05-14 20:38:57.772572+00
2748	night	22	6	12.00	2026-05-14 20:38:57.772572+00
2749	morning	6	14	10.00	2026-05-14 20:59:22.424937+00
2752	evening	14	22	15.00	2026-05-14 20:59:22.424937+00
2753	night	22	6	12.00	2026-05-14 20:59:22.424937+00
2751	morning	6	14	10.00	2026-05-14 20:59:22.43965+00
2754	evening	14	22	15.00	2026-05-14 20:59:22.43965+00
2755	night	22	6	12.00	2026-05-14 20:59:22.43965+00
2750	morning	6	14	10.00	2026-05-14 20:59:22.43666+00
2756	evening	14	22	15.00	2026-05-14 20:59:22.43666+00
2757	night	22	6	12.00	2026-05-14 20:59:22.43666+00
2758	morning	6	14	10.00	2026-05-14 20:59:22.450578+00
2759	evening	14	22	15.00	2026-05-14 20:59:22.450578+00
2760	night	22	6	12.00	2026-05-14 20:59:22.450578+00
2761	morning	6	14	10.00	2026-05-14 20:59:22.453558+00
2762	evening	14	22	15.00	2026-05-14 20:59:22.453558+00
2763	night	22	6	12.00	2026-05-14 20:59:22.453558+00
2764	morning	6	14	10.00	2026-05-14 20:59:22.461961+00
2765	evening	14	22	15.00	2026-05-14 20:59:22.461961+00
2766	night	22	6	12.00	2026-05-14 20:59:22.461961+00
2767	morning	6	14	10.00	2026-05-14 20:59:22.470927+00
2768	evening	14	22	15.00	2026-05-14 20:59:22.470927+00
2769	night	22	6	12.00	2026-05-14 20:59:22.470927+00
2770	morning	6	14	10.00	2026-05-14 20:59:22.495813+00
2771	evening	14	22	15.00	2026-05-14 20:59:22.495813+00
2772	night	22	6	12.00	2026-05-14 20:59:22.495813+00
2773	morning	6	14	10.00	2026-05-14 20:59:22.512211+00
2774	evening	14	22	15.00	2026-05-14 20:59:22.512211+00
2775	night	22	6	12.00	2026-05-14 20:59:22.512211+00
2776	morning	6	14	10.00	2026-05-14 20:59:22.554479+00
2777	evening	14	22	15.00	2026-05-14 20:59:22.554479+00
2778	night	22	6	12.00	2026-05-14 20:59:22.554479+00
2780	morning	6	14	10.00	2026-05-14 21:10:29.885901+00
2781	evening	14	22	15.00	2026-05-14 21:10:29.885901+00
2782	night	22	6	12.00	2026-05-14 21:10:29.885901+00
2779	morning	6	14	10.00	2026-05-14 21:10:29.871558+00
2783	evening	14	22	15.00	2026-05-14 21:10:29.871558+00
2784	night	22	6	12.00	2026-05-14 21:10:29.871558+00
2785	morning	6	14	10.00	2026-05-14 21:20:36.397702+00
2786	evening	14	22	15.00	2026-05-14 21:20:36.397702+00
2787	night	22	6	12.00	2026-05-14 21:20:36.397702+00
2788	morning	6	14	10.00	2026-05-14 21:20:36.499984+00
2789	evening	14	22	15.00	2026-05-14 21:20:36.499984+00
2790	night	22	6	12.00	2026-05-14 21:20:36.499984+00
2791	morning	6	14	10.00	2026-05-14 21:20:36.634885+00
2792	evening	14	22	15.00	2026-05-14 21:20:36.634885+00
2793	night	22	6	12.00	2026-05-14 21:20:36.634885+00
2794	morning	6	14	10.00	2026-05-14 21:26:54.086511+00
2795	evening	14	22	15.00	2026-05-14 21:26:54.086511+00
2796	night	22	6	12.00	2026-05-14 21:26:54.086511+00
2797	morning	6	14	10.00	2026-05-14 21:26:54.185144+00
2798	evening	14	22	15.00	2026-05-14 21:26:54.185144+00
2799	night	22	6	12.00	2026-05-14 21:26:54.185144+00
2800	morning	6	14	10.00	2026-05-14 21:26:54.210049+00
2801	evening	14	22	15.00	2026-05-14 21:26:54.210049+00
2802	night	22	6	12.00	2026-05-14 21:26:54.210049+00
2803	morning	6	14	10.00	2026-05-14 21:42:47.641191+00
2804	evening	14	22	15.00	2026-05-14 21:42:47.641191+00
2805	night	22	6	12.00	2026-05-14 21:42:47.641191+00
2806	morning	6	14	10.00	2026-05-14 21:43:59.742441+00
2807	evening	14	22	15.00	2026-05-14 21:43:59.742441+00
2808	night	22	6	12.00	2026-05-14 21:43:59.742441+00
2809	morning	6	14	10.00	2026-05-14 21:44:08.249487+00
2810	evening	14	22	15.00	2026-05-14 21:44:08.249487+00
2811	night	22	6	12.00	2026-05-14 21:44:08.249487+00
2812	morning	6	14	10.00	2026-05-14 21:45:09.242722+00
2813	evening	14	22	15.00	2026-05-14 21:45:09.242722+00
2814	night	22	6	12.00	2026-05-14 21:45:09.242722+00
2815	morning	6	14	10.00	2026-05-14 21:45:09.342278+00
2816	evening	14	22	15.00	2026-05-14 21:45:09.342278+00
2817	night	22	6	12.00	2026-05-14 21:45:09.342278+00
2818	morning	6	14	10.00	2026-05-14 21:45:09.48709+00
2819	evening	14	22	15.00	2026-05-14 21:45:09.48709+00
2820	night	22	6	12.00	2026-05-14 21:45:09.48709+00
2821	morning	6	14	10.00	2026-05-14 23:31:51.495564+00
2822	evening	14	22	15.00	2026-05-14 23:31:51.495564+00
2823	night	22	6	12.00	2026-05-14 23:31:51.495564+00
2824	morning	6	14	10.00	2026-05-14 23:31:51.88548+00
2825	evening	14	22	15.00	2026-05-14 23:31:51.88548+00
2826	night	22	6	12.00	2026-05-14 23:31:51.88548+00
2827	morning	6	14	10.00	2026-05-14 23:40:31.22348+00
2828	evening	14	22	15.00	2026-05-14 23:40:31.22348+00
2829	night	22	6	12.00	2026-05-14 23:40:31.22348+00
2830	morning	6	14	10.00	2026-05-14 23:40:33.792099+00
2831	evening	14	22	15.00	2026-05-14 23:40:33.792099+00
2832	night	22	6	12.00	2026-05-14 23:40:33.792099+00
2833	morning	6	14	10.00	2026-05-14 23:40:33.828488+00
2834	evening	14	22	15.00	2026-05-14 23:40:33.828488+00
2835	night	22	6	12.00	2026-05-14 23:40:33.828488+00
2836	morning	6	14	10.00	2026-05-14 23:40:33.885559+00
2837	evening	14	22	15.00	2026-05-14 23:40:33.885559+00
2838	night	22	6	12.00	2026-05-14 23:40:33.885559+00
2839	morning	6	14	10.00	2026-05-14 23:41:26.037768+00
2840	evening	14	22	15.00	2026-05-14 23:41:26.037768+00
2841	night	22	6	12.00	2026-05-14 23:41:26.037768+00
2842	morning	6	14	10.00	2026-05-14 23:41:36.713149+00
2843	evening	14	22	15.00	2026-05-14 23:41:36.713149+00
2844	night	22	6	12.00	2026-05-14 23:41:36.713149+00
2845	morning	6	14	10.00	2026-05-14 23:41:36.896877+00
2846	evening	14	22	15.00	2026-05-14 23:41:36.896877+00
2847	night	22	6	12.00	2026-05-14 23:41:36.896877+00
2848	morning	6	14	10.00	2026-05-14 23:43:25.329478+00
2849	evening	14	22	15.00	2026-05-14 23:43:25.329478+00
2850	night	22	6	12.00	2026-05-14 23:43:25.329478+00
2851	morning	6	14	10.00	2026-05-14 23:43:35.279843+00
2852	evening	14	22	15.00	2026-05-14 23:43:35.279843+00
2853	night	22	6	12.00	2026-05-14 23:43:35.279843+00
2854	morning	6	14	10.00	2026-05-14 23:43:35.471885+00
2855	evening	14	22	15.00	2026-05-14 23:43:35.471885+00
2856	night	22	6	12.00	2026-05-14 23:43:35.471885+00
2857	morning	6	14	10.00	2026-05-14 23:43:35.535961+00
2858	evening	14	22	15.00	2026-05-14 23:43:35.535961+00
2859	night	22	6	12.00	2026-05-14 23:43:35.535961+00
2860	morning	6	14	10.00	2026-05-14 23:43:57.595832+00
2861	evening	14	22	15.00	2026-05-14 23:43:57.595832+00
2862	night	22	6	12.00	2026-05-14 23:43:57.595832+00
2863	morning	6	14	10.00	2026-05-15 00:11:32.355239+00
2864	evening	14	22	15.00	2026-05-15 00:11:32.355239+00
2865	night	22	6	12.00	2026-05-15 00:11:32.355239+00
2866	morning	6	14	10.00	2026-05-15 00:11:54.621359+00
2867	evening	14	22	15.00	2026-05-15 00:11:54.621359+00
2868	night	22	6	12.00	2026-05-15 00:11:54.621359+00
2869	morning	6	14	10.00	2026-05-15 00:11:54.833661+00
2870	evening	14	22	15.00	2026-05-15 00:11:54.833661+00
2871	night	22	6	12.00	2026-05-15 00:11:54.833661+00
2872	morning	6	14	10.00	2026-05-15 00:11:54.984206+00
2873	evening	14	22	15.00	2026-05-15 00:11:54.984206+00
2874	night	22	6	12.00	2026-05-15 00:11:54.984206+00
2875	morning	6	14	10.00	2026-05-15 00:11:59.802305+00
2876	evening	14	22	15.00	2026-05-15 00:11:59.802305+00
2877	night	22	6	12.00	2026-05-15 00:11:59.802305+00
2878	morning	6	14	10.00	2026-05-15 00:12:00.802463+00
2879	evening	14	22	15.00	2026-05-15 00:12:00.802463+00
2880	night	22	6	12.00	2026-05-15 00:12:00.802463+00
2881	morning	6	14	10.00	2026-05-15 00:12:07.687473+00
2882	evening	14	22	15.00	2026-05-15 00:12:07.687473+00
2883	night	22	6	12.00	2026-05-15 00:12:07.687473+00
2884	morning	6	14	10.00	2026-05-15 00:12:34.087694+00
2885	evening	14	22	15.00	2026-05-15 00:12:34.087694+00
2886	night	22	6	12.00	2026-05-15 00:12:34.087694+00
2887	morning	6	14	10.00	2026-05-15 00:12:34.171686+00
2888	evening	14	22	15.00	2026-05-15 00:12:34.171686+00
2889	night	22	6	12.00	2026-05-15 00:12:34.171686+00
2890	morning	6	14	10.00	2026-05-15 00:22:10.233958+00
2891	evening	14	22	15.00	2026-05-15 00:22:10.233958+00
2892	night	22	6	12.00	2026-05-15 00:22:10.233958+00
2893	morning	6	14	10.00	2026-05-15 00:22:10.255927+00
2894	evening	14	22	15.00	2026-05-15 00:22:10.255927+00
2895	night	22	6	12.00	2026-05-15 00:22:10.255927+00
2896	morning	6	14	10.00	2026-05-15 00:22:11.188169+00
2897	evening	14	22	15.00	2026-05-15 00:22:11.188169+00
2898	night	22	6	12.00	2026-05-15 00:22:11.188169+00
2899	morning	6	14	10.00	2026-05-15 00:39:17.103301+00
2900	evening	14	22	15.00	2026-05-15 00:39:17.103301+00
2901	night	22	6	12.00	2026-05-15 00:39:17.103301+00
2902	morning	6	14	10.00	2026-05-15 00:39:45.202985+00
2903	evening	14	22	15.00	2026-05-15 00:39:45.202985+00
2904	night	22	6	12.00	2026-05-15 00:39:45.202985+00
2905	morning	6	14	10.00	2026-05-15 00:39:55.502236+00
2906	evening	14	22	15.00	2026-05-15 00:39:55.502236+00
2907	night	22	6	12.00	2026-05-15 00:39:55.502236+00
2908	morning	6	14	10.00	2026-05-15 00:39:55.574757+00
2909	evening	14	22	15.00	2026-05-15 00:39:55.574757+00
2910	night	22	6	12.00	2026-05-15 00:39:55.574757+00
2911	morning	6	14	10.00	2026-05-15 00:39:55.834619+00
2912	evening	14	22	15.00	2026-05-15 00:39:55.834619+00
2913	night	22	6	12.00	2026-05-15 00:39:55.834619+00
2914	morning	6	14	10.00	2026-05-15 00:48:26.970206+00
2915	evening	14	22	15.00	2026-05-15 00:48:26.970206+00
2916	night	22	6	12.00	2026-05-15 00:48:26.970206+00
2917	morning	6	14	10.00	2026-05-15 00:48:28.008831+00
2918	evening	14	22	15.00	2026-05-15 00:48:28.008831+00
2919	night	22	6	12.00	2026-05-15 00:48:28.008831+00
2920	morning	6	14	10.00	2026-05-15 00:48:28.140284+00
2921	evening	14	22	15.00	2026-05-15 00:48:28.140284+00
2922	night	22	6	12.00	2026-05-15 00:48:28.140284+00
2923	morning	6	14	10.00	2026-05-15 01:01:25.79067+00
2925	evening	14	22	15.00	2026-05-15 01:01:25.79067+00
2926	night	22	6	12.00	2026-05-15 01:01:25.79067+00
2924	morning	6	14	10.00	2026-05-15 01:01:25.809312+00
2927	evening	14	22	15.00	2026-05-15 01:01:25.809312+00
2928	night	22	6	12.00	2026-05-15 01:01:25.809312+00
2929	morning	6	14	10.00	2026-05-15 01:04:40.490138+00
2930	evening	14	22	15.00	2026-05-15 01:04:40.490138+00
2931	night	22	6	12.00	2026-05-15 01:04:40.490138+00
2932	morning	6	14	10.00	2026-05-15 01:04:41.363683+00
2933	evening	14	22	15.00	2026-05-15 01:04:41.363683+00
2934	night	22	6	12.00	2026-05-15 01:04:41.363683+00
2935	morning	6	14	10.00	2026-05-15 01:04:46.294613+00
2936	evening	14	22	15.00	2026-05-15 01:04:46.294613+00
2937	night	22	6	12.00	2026-05-15 01:04:46.294613+00
2938	morning	6	14	10.00	2026-05-15 01:04:46.312254+00
2939	evening	14	22	15.00	2026-05-15 01:04:46.312254+00
2940	night	22	6	12.00	2026-05-15 01:04:46.312254+00
2941	morning	6	14	10.00	2026-05-15 01:04:46.434915+00
2942	evening	14	22	15.00	2026-05-15 01:04:46.434915+00
2943	night	22	6	12.00	2026-05-15 01:04:46.434915+00
2944	morning	6	14	10.00	2026-05-15 01:13:29.519066+00
2945	evening	14	22	15.00	2026-05-15 01:13:29.519066+00
2946	night	22	6	12.00	2026-05-15 01:13:29.519066+00
2947	morning	6	14	10.00	2026-05-15 01:13:53.537014+00
2948	evening	14	22	15.00	2026-05-15 01:13:53.537014+00
2949	night	22	6	12.00	2026-05-15 01:13:53.537014+00
2950	morning	6	14	10.00	2026-05-15 01:14:03.731286+00
2951	evening	14	22	15.00	2026-05-15 01:14:03.731286+00
2952	night	22	6	12.00	2026-05-15 01:14:03.731286+00
2953	morning	6	14	10.00	2026-05-15 01:14:03.767253+00
2954	evening	14	22	15.00	2026-05-15 01:14:03.767253+00
2955	night	22	6	12.00	2026-05-15 01:14:03.767253+00
2956	morning	6	14	10.00	2026-05-15 01:14:03.946019+00
2957	evening	14	22	15.00	2026-05-15 01:14:03.946019+00
2958	night	22	6	12.00	2026-05-15 01:14:03.946019+00
2959	morning	6	14	10.00	2026-05-15 01:15:00.265588+00
2960	evening	14	22	15.00	2026-05-15 01:15:00.265588+00
2961	night	22	6	12.00	2026-05-15 01:15:00.265588+00
2962	morning	6	14	10.00	2026-05-15 01:22:30.145784+00
2963	evening	14	22	15.00	2026-05-15 01:22:30.145784+00
2964	night	22	6	12.00	2026-05-15 01:22:30.145784+00
2965	morning	6	14	10.00	2026-05-15 01:23:06.495159+00
2966	evening	14	22	15.00	2026-05-15 01:23:06.495159+00
2967	night	22	6	12.00	2026-05-15 01:23:06.495159+00
2968	morning	6	14	10.00	2026-05-15 01:23:20.015297+00
2969	evening	14	22	15.00	2026-05-15 01:23:20.015297+00
2970	night	22	6	12.00	2026-05-15 01:23:20.015297+00
2971	morning	6	14	10.00	2026-05-15 01:23:20.077265+00
2972	evening	14	22	15.00	2026-05-15 01:23:20.077265+00
2973	night	22	6	12.00	2026-05-15 01:23:20.077265+00
2974	morning	6	14	10.00	2026-05-15 01:23:20.134468+00
2975	evening	14	22	15.00	2026-05-15 01:23:20.134468+00
2976	night	22	6	12.00	2026-05-15 01:23:20.134468+00
2977	morning	6	14	10.00	2026-05-15 01:43:08.407158+00
2978	evening	14	22	15.00	2026-05-15 01:43:08.407158+00
2979	night	22	6	12.00	2026-05-15 01:43:08.407158+00
2980	morning	6	14	10.00	2026-05-15 01:48:45.554115+00
2981	evening	14	22	15.00	2026-05-15 01:48:45.554115+00
2982	night	22	6	12.00	2026-05-15 01:48:45.554115+00
2983	morning	6	14	10.00	2026-05-15 01:48:45.577909+00
2984	evening	14	22	15.00	2026-05-15 01:48:45.577909+00
2985	night	22	6	12.00	2026-05-15 01:48:45.577909+00
2986	morning	6	14	10.00	2026-05-15 01:48:45.583609+00
2987	evening	14	22	15.00	2026-05-15 01:48:45.583609+00
2988	night	22	6	12.00	2026-05-15 01:48:45.583609+00
2989	morning	6	14	10.00	2026-05-15 01:48:45.722844+00
2990	evening	14	22	15.00	2026-05-15 01:48:45.722844+00
2991	night	22	6	12.00	2026-05-15 01:48:45.722844+00
2992	morning	6	14	10.00	2026-05-15 06:39:02.550119+00
2993	evening	14	22	15.00	2026-05-15 06:39:02.550119+00
2994	night	22	6	12.00	2026-05-15 06:39:02.550119+00
2995	morning	6	14	10.00	2026-05-15 08:48:52.484106+00
2996	evening	14	22	15.00	2026-05-15 08:48:52.484106+00
2997	night	22	6	12.00	2026-05-15 08:48:52.484106+00
2998	morning	6	14	10.00	2026-05-15 08:48:52.954116+00
2999	evening	14	22	15.00	2026-05-15 08:48:52.954116+00
3000	night	22	6	12.00	2026-05-15 08:48:52.954116+00
3001	morning	6	14	10.00	2026-05-15 08:49:01.279346+00
3002	evening	14	22	15.00	2026-05-15 08:49:01.279346+00
3003	night	22	6	12.00	2026-05-15 08:49:01.279346+00
3004	morning	6	14	10.00	2026-05-15 08:49:17.142224+00
3005	evening	14	22	15.00	2026-05-15 08:49:17.142224+00
3006	night	22	6	12.00	2026-05-15 08:49:17.142224+00
3007	morning	6	14	10.00	2026-05-15 08:49:27.046629+00
3008	evening	14	22	15.00	2026-05-15 08:49:27.046629+00
3009	night	22	6	12.00	2026-05-15 08:49:27.046629+00
3010	morning	6	14	10.00	2026-05-15 08:49:27.125404+00
3011	evening	14	22	15.00	2026-05-15 08:49:27.125404+00
3012	night	22	6	12.00	2026-05-15 08:49:27.125404+00
3013	morning	6	14	10.00	2026-05-15 08:49:27.326076+00
3014	evening	14	22	15.00	2026-05-15 08:49:27.326076+00
3015	night	22	6	12.00	2026-05-15 08:49:27.326076+00
3016	morning	6	14	10.00	2026-05-15 08:50:33.148915+00
3017	evening	14	22	15.00	2026-05-15 08:50:33.148915+00
3018	night	22	6	12.00	2026-05-15 08:50:33.148915+00
3019	morning	6	14	10.00	2026-05-15 09:57:04.205477+00
3020	evening	14	22	15.00	2026-05-15 09:57:04.205477+00
3021	night	22	6	12.00	2026-05-15 09:57:04.205477+00
3022	morning	6	14	10.00	2026-05-15 09:57:15.006624+00
3023	evening	14	22	15.00	2026-05-15 09:57:15.006624+00
3024	night	22	6	12.00	2026-05-15 09:57:15.006624+00
3025	morning	6	14	10.00	2026-05-15 09:57:15.054649+00
3026	evening	14	22	15.00	2026-05-15 09:57:15.054649+00
3027	night	22	6	12.00	2026-05-15 09:57:15.054649+00
3028	morning	6	14	10.00	2026-05-15 09:57:15.769586+00
3029	evening	14	22	15.00	2026-05-15 09:57:15.769586+00
3030	night	22	6	12.00	2026-05-15 09:57:15.769586+00
3031	morning	6	14	10.00	2026-05-15 10:03:43.835945+00
3032	evening	14	22	15.00	2026-05-15 10:03:43.835945+00
3033	night	22	6	12.00	2026-05-15 10:03:43.835945+00
3034	morning	6	14	10.00	2026-05-15 10:03:43.852747+00
3035	evening	14	22	15.00	2026-05-15 10:03:43.852747+00
3036	night	22	6	12.00	2026-05-15 10:03:43.852747+00
3037	morning	6	14	10.00	2026-05-15 11:23:53.786045+00
3038	evening	14	22	15.00	2026-05-15 11:23:53.786045+00
3039	night	22	6	12.00	2026-05-15 11:23:53.786045+00
3040	morning	6	14	10.00	2026-05-15 11:24:04.583583+00
3041	evening	14	22	15.00	2026-05-15 11:24:04.583583+00
3042	night	22	6	12.00	2026-05-15 11:24:04.583583+00
3043	morning	6	14	10.00	2026-05-15 11:24:04.638402+00
3044	evening	14	22	15.00	2026-05-15 11:24:04.638402+00
3045	night	22	6	12.00	2026-05-15 11:24:04.638402+00
3046	morning	6	14	10.00	2026-05-15 11:24:04.658058+00
3047	evening	14	22	15.00	2026-05-15 11:24:04.658058+00
3048	night	22	6	12.00	2026-05-15 11:24:04.658058+00
3049	morning	6	14	10.00	2026-05-15 11:24:11.175187+00
3050	evening	14	22	15.00	2026-05-15 11:24:11.175187+00
3051	night	22	6	12.00	2026-05-15 11:24:11.175187+00
3052	morning	6	14	10.00	2026-05-15 11:33:37.066941+00
3053	evening	14	22	15.00	2026-05-15 11:33:37.066941+00
3054	night	22	6	12.00	2026-05-15 11:33:37.066941+00
3055	morning	6	14	10.00	2026-05-15 11:33:37.090938+00
3056	evening	14	22	15.00	2026-05-15 11:33:37.090938+00
3057	night	22	6	12.00	2026-05-15 11:33:37.090938+00
3058	morning	6	14	10.00	2026-05-15 11:33:37.140517+00
3059	evening	14	22	15.00	2026-05-15 11:33:37.140517+00
3060	night	22	6	12.00	2026-05-15 11:33:37.140517+00
3061	morning	6	14	10.00	2026-05-15 11:44:19.701711+00
3062	evening	14	22	15.00	2026-05-15 11:44:19.701711+00
3063	night	22	6	12.00	2026-05-15 11:44:19.701711+00
3064	morning	6	14	10.00	2026-05-15 12:53:23.12942+00
3065	evening	14	22	15.00	2026-05-15 12:53:23.12942+00
3066	night	22	6	12.00	2026-05-15 12:53:23.12942+00
3067	morning	6	14	10.00	2026-05-15 12:55:40.275565+00
3068	evening	14	22	15.00	2026-05-15 12:55:40.275565+00
3069	night	22	6	12.00	2026-05-15 12:55:40.275565+00
3070	morning	6	14	10.00	2026-05-15 12:55:50.03122+00
3071	evening	14	22	15.00	2026-05-15 12:55:50.03122+00
3072	night	22	6	12.00	2026-05-15 12:55:50.03122+00
3073	morning	6	14	10.00	2026-05-15 13:01:30.552895+00
3074	evening	14	22	15.00	2026-05-15 13:01:30.552895+00
3075	night	22	6	12.00	2026-05-15 13:01:30.552895+00
3076	morning	6	14	10.00	2026-05-15 13:01:30.668582+00
3077	evening	14	22	15.00	2026-05-15 13:01:30.668582+00
3078	night	22	6	12.00	2026-05-15 13:01:30.668582+00
3079	morning	6	14	10.00	2026-05-15 13:01:30.739671+00
3080	evening	14	22	15.00	2026-05-15 13:01:30.739671+00
3081	night	22	6	12.00	2026-05-15 13:01:30.739671+00
3082	morning	6	14	10.00	2026-05-15 13:01:36.091735+00
3083	evening	14	22	15.00	2026-05-15 13:01:36.091735+00
3084	night	22	6	12.00	2026-05-15 13:01:36.091735+00
3085	morning	6	14	10.00	2026-05-15 14:15:22.860773+00
3086	evening	14	22	15.00	2026-05-15 14:15:22.860773+00
3087	night	22	6	12.00	2026-05-15 14:15:22.860773+00
3088	morning	6	14	10.00	2026-05-15 14:39:21.274742+00
3089	evening	14	22	15.00	2026-05-15 14:39:21.274742+00
3090	night	22	6	12.00	2026-05-15 14:39:21.274742+00
3091	morning	6	14	10.00	2026-05-15 15:04:39.215596+00
3092	evening	14	22	15.00	2026-05-15 15:04:39.215596+00
3093	night	22	6	12.00	2026-05-15 15:04:39.215596+00
3094	morning	6	14	10.00	2026-05-15 15:04:39.886175+00
3095	evening	14	22	15.00	2026-05-15 15:04:39.886175+00
3096	night	22	6	12.00	2026-05-15 15:04:39.886175+00
3097	morning	6	14	10.00	2026-05-15 15:04:59.054635+00
3098	evening	14	22	15.00	2026-05-15 15:04:59.054635+00
3099	night	22	6	12.00	2026-05-15 15:04:59.054635+00
3100	morning	6	14	10.00	2026-05-15 15:05:09.998432+00
3101	evening	14	22	15.00	2026-05-15 15:05:09.998432+00
3102	night	22	6	12.00	2026-05-15 15:05:09.998432+00
3103	morning	6	14	10.00	2026-05-15 15:06:02.625056+00
3104	evening	14	22	15.00	2026-05-15 15:06:02.625056+00
3105	night	22	6	12.00	2026-05-15 15:06:02.625056+00
3106	morning	6	14	10.00	2026-05-15 15:07:23.84961+00
3107	evening	14	22	15.00	2026-05-15 15:07:23.84961+00
3108	night	22	6	12.00	2026-05-15 15:07:23.84961+00
3109	morning	6	14	10.00	2026-05-15 15:07:23.913427+00
3110	evening	14	22	15.00	2026-05-15 15:07:23.913427+00
3111	night	22	6	12.00	2026-05-15 15:07:23.913427+00
3112	morning	6	14	10.00	2026-05-15 15:12:16.330973+00
3113	evening	14	22	15.00	2026-05-15 15:12:16.330973+00
3114	night	22	6	12.00	2026-05-15 15:12:16.330973+00
3115	morning	6	14	10.00	2026-05-15 15:12:24.987962+00
3116	evening	14	22	15.00	2026-05-15 15:12:24.987962+00
3117	night	22	6	12.00	2026-05-15 15:12:24.987962+00
3118	morning	6	14	10.00	2026-05-15 15:12:25.784832+00
3119	evening	14	22	15.00	2026-05-15 15:12:25.784832+00
3120	night	22	6	12.00	2026-05-15 15:12:25.784832+00
3121	morning	6	14	10.00	2026-05-15 15:12:34.488732+00
3122	evening	14	22	15.00	2026-05-15 15:12:34.488732+00
3123	night	22	6	12.00	2026-05-15 15:12:34.488732+00
3124	morning	6	14	10.00	2026-05-15 15:13:07.990081+00
3125	evening	14	22	15.00	2026-05-15 15:13:07.990081+00
3126	night	22	6	12.00	2026-05-15 15:13:07.990081+00
3127	morning	6	14	10.00	2026-05-15 15:13:37.808514+00
3128	evening	14	22	15.00	2026-05-15 15:13:37.808514+00
3129	night	22	6	12.00	2026-05-15 15:13:37.808514+00
3130	morning	6	14	10.00	2026-05-15 15:13:37.988438+00
3131	evening	14	22	15.00	2026-05-15 15:13:37.988438+00
3132	night	22	6	12.00	2026-05-15 15:13:37.988438+00
3133	morning	6	14	10.00	2026-05-15 15:13:41.039216+00
3134	evening	14	22	15.00	2026-05-15 15:13:41.039216+00
3135	night	22	6	12.00	2026-05-15 15:13:41.039216+00
3136	morning	6	14	10.00	2026-05-15 15:21:11.535295+00
3137	evening	14	22	15.00	2026-05-15 15:21:11.535295+00
3138	night	22	6	12.00	2026-05-15 15:21:11.535295+00
3139	morning	6	14	10.00	2026-05-15 15:21:11.628281+00
3140	evening	14	22	15.00	2026-05-15 15:21:11.628281+00
3141	night	22	6	12.00	2026-05-15 15:21:11.628281+00
3142	morning	6	14	10.00	2026-05-15 15:21:11.74849+00
3143	evening	14	22	15.00	2026-05-15 15:21:11.74849+00
3144	night	22	6	12.00	2026-05-15 15:21:11.74849+00
3145	morning	6	14	10.00	2026-05-15 19:42:05.466117+00
3146	evening	14	22	15.00	2026-05-15 19:42:05.466117+00
3147	night	22	6	12.00	2026-05-15 19:42:05.466117+00
3148	morning	6	14	10.00	2026-05-15 19:42:15.897255+00
3149	evening	14	22	15.00	2026-05-15 19:42:15.897255+00
3150	night	22	6	12.00	2026-05-15 19:42:15.897255+00
3151	morning	6	14	10.00	2026-05-15 19:42:15.922376+00
3152	evening	14	22	15.00	2026-05-15 19:42:15.922376+00
3153	night	22	6	12.00	2026-05-15 19:42:15.922376+00
3154	morning	6	14	10.00	2026-05-15 19:49:26.221738+00
3155	evening	14	22	15.00	2026-05-15 19:49:26.221738+00
3156	night	22	6	12.00	2026-05-15 19:49:26.221738+00
3157	morning	6	14	10.00	2026-05-15 20:02:58.250832+00
3158	evening	14	22	15.00	2026-05-15 20:02:58.250832+00
3159	night	22	6	12.00	2026-05-15 20:02:58.250832+00
3160	morning	6	14	10.00	2026-05-15 20:08:06.276034+00
3161	evening	14	22	15.00	2026-05-15 20:08:06.276034+00
3162	night	22	6	12.00	2026-05-15 20:08:06.276034+00
3163	morning	6	14	10.00	2026-05-15 20:08:16.797531+00
3164	evening	14	22	15.00	2026-05-15 20:08:16.797531+00
3165	night	22	6	12.00	2026-05-15 20:08:16.797531+00
3166	morning	6	14	10.00	2026-05-15 20:08:35.340928+00
3167	evening	14	22	15.00	2026-05-15 20:08:35.340928+00
3168	night	22	6	12.00	2026-05-15 20:08:35.340928+00
3169	morning	6	14	10.00	2026-05-15 20:08:45.108006+00
3170	evening	14	22	15.00	2026-05-15 20:08:45.108006+00
3171	night	22	6	12.00	2026-05-15 20:08:45.108006+00
3172	morning	6	14	10.00	2026-05-15 20:08:45.161559+00
3173	evening	14	22	15.00	2026-05-15 20:08:45.161559+00
3174	night	22	6	12.00	2026-05-15 20:08:45.161559+00
3175	morning	6	14	10.00	2026-05-15 20:17:02.893845+00
3176	evening	14	22	15.00	2026-05-15 20:17:02.893845+00
3177	night	22	6	12.00	2026-05-15 20:17:02.893845+00
3178	morning	6	14	10.00	2026-05-15 20:26:29.110256+00
3179	evening	14	22	15.00	2026-05-15 20:26:29.110256+00
3180	night	22	6	12.00	2026-05-15 20:26:29.110256+00
3181	morning	6	14	10.00	2026-05-15 20:26:29.172357+00
3182	evening	14	22	15.00	2026-05-15 20:26:29.172357+00
3183	night	22	6	12.00	2026-05-15 20:26:29.172357+00
3184	morning	6	14	10.00	2026-05-15 20:26:51.761944+00
3185	evening	14	22	15.00	2026-05-15 20:26:51.761944+00
3186	night	22	6	12.00	2026-05-15 20:26:51.761944+00
3187	morning	6	14	10.00	2026-05-15 21:33:28.24279+00
3188	evening	14	22	15.00	2026-05-15 21:33:28.24279+00
3189	night	22	6	12.00	2026-05-15 21:33:28.24279+00
3190	morning	6	14	10.00	2026-05-15 21:33:28.495768+00
3191	evening	14	22	15.00	2026-05-15 21:33:28.495768+00
3192	night	22	6	12.00	2026-05-15 21:33:28.495768+00
3193	morning	6	14	10.00	2026-05-15 21:33:48.905416+00
3194	evening	14	22	15.00	2026-05-15 21:33:48.905416+00
3195	night	22	6	12.00	2026-05-15 21:33:48.905416+00
3196	morning	6	14	10.00	2026-05-15 21:33:58.349413+00
3197	evening	14	22	15.00	2026-05-15 21:33:58.349413+00
3198	night	22	6	12.00	2026-05-15 21:33:58.349413+00
3199	morning	6	14	10.00	2026-05-15 21:33:58.491846+00
3200	evening	14	22	15.00	2026-05-15 21:33:58.491846+00
3201	night	22	6	12.00	2026-05-15 21:33:58.491846+00
3202	morning	6	14	10.00	2026-05-15 21:33:58.506973+00
3203	evening	14	22	15.00	2026-05-15 21:33:58.506973+00
3204	night	22	6	12.00	2026-05-15 21:33:58.506973+00
3205	morning	6	14	10.00	2026-05-15 21:34:31.377114+00
3206	evening	14	22	15.00	2026-05-15 21:34:31.377114+00
3207	night	22	6	12.00	2026-05-15 21:34:31.377114+00
3208	morning	6	14	10.00	2026-05-15 22:08:54.799757+00
3209	evening	14	22	15.00	2026-05-15 22:08:54.799757+00
3210	night	22	6	12.00	2026-05-15 22:08:54.799757+00
3211	morning	6	14	10.00	2026-05-15 22:10:13.235293+00
3212	evening	14	22	15.00	2026-05-15 22:10:13.235293+00
3213	night	22	6	12.00	2026-05-15 22:10:13.235293+00
3214	morning	6	14	10.00	2026-05-15 22:10:13.270369+00
3215	evening	14	22	15.00	2026-05-15 22:10:13.270369+00
3216	night	22	6	12.00	2026-05-15 22:10:13.270369+00
3217	morning	6	14	10.00	2026-05-15 22:10:13.298906+00
3218	evening	14	22	15.00	2026-05-15 22:10:13.298906+00
3219	night	22	6	12.00	2026-05-15 22:10:13.298906+00
3220	morning	6	14	10.00	2026-05-15 22:10:13.31311+00
3221	evening	14	22	15.00	2026-05-15 22:10:13.31311+00
3222	night	22	6	12.00	2026-05-15 22:10:13.31311+00
3223	morning	6	14	10.00	2026-05-15 22:38:29.625988+00
3224	evening	14	22	15.00	2026-05-15 22:38:29.625988+00
3225	night	22	6	12.00	2026-05-15 22:38:29.625988+00
3226	morning	6	14	10.00	2026-05-15 22:38:30.153006+00
3227	evening	14	22	15.00	2026-05-15 22:38:30.153006+00
3228	night	22	6	12.00	2026-05-15 22:38:30.153006+00
3229	morning	6	14	10.00	2026-05-15 22:38:36.02146+00
3230	evening	14	22	15.00	2026-05-15 22:38:36.02146+00
3231	night	22	6	12.00	2026-05-15 22:38:36.02146+00
3232	morning	6	14	10.00	2026-05-15 22:38:51.365991+00
3233	evening	14	22	15.00	2026-05-15 22:38:51.365991+00
3234	night	22	6	12.00	2026-05-15 22:38:51.365991+00
3235	morning	6	14	10.00	2026-05-15 22:39:01.209036+00
3236	evening	14	22	15.00	2026-05-15 22:39:01.209036+00
3237	night	22	6	12.00	2026-05-15 22:39:01.209036+00
3238	morning	6	14	10.00	2026-05-15 22:39:01.509404+00
3239	evening	14	22	15.00	2026-05-15 22:39:01.509404+00
3240	night	22	6	12.00	2026-05-15 22:39:01.509404+00
3241	morning	6	14	10.00	2026-05-15 22:39:01.575113+00
3242	evening	14	22	15.00	2026-05-15 22:39:01.575113+00
3243	night	22	6	12.00	2026-05-15 22:39:01.575113+00
3244	morning	6	14	10.00	2026-05-15 22:41:32.454286+00
3245	evening	14	22	15.00	2026-05-15 22:41:32.454286+00
3246	night	22	6	12.00	2026-05-15 22:41:32.454286+00
3247	morning	6	14	10.00	2026-05-15 22:43:51.11561+00
3248	evening	14	22	15.00	2026-05-15 22:43:51.11561+00
3249	night	22	6	12.00	2026-05-15 22:43:51.11561+00
3250	morning	6	14	10.00	2026-05-15 22:57:18.087407+00
3251	evening	14	22	15.00	2026-05-15 22:57:18.087407+00
3252	night	22	6	12.00	2026-05-15 22:57:18.087407+00
3253	morning	6	14	10.00	2026-05-16 00:20:03.662557+00
3254	evening	14	22	15.00	2026-05-16 00:20:03.662557+00
3255	night	22	6	12.00	2026-05-16 00:20:03.662557+00
3256	morning	6	14	10.00	2026-05-16 00:20:15.930899+00
3257	evening	14	22	15.00	2026-05-16 00:20:15.930899+00
3258	night	22	6	12.00	2026-05-16 00:20:15.930899+00
3259	morning	6	14	10.00	2026-05-16 00:20:22.012208+00
3260	evening	14	22	15.00	2026-05-16 00:20:22.012208+00
3261	night	22	6	12.00	2026-05-16 00:20:22.012208+00
3262	morning	6	14	10.00	2026-05-16 00:20:22.031657+00
3263	evening	14	22	15.00	2026-05-16 00:20:22.031657+00
3264	night	22	6	12.00	2026-05-16 00:20:22.031657+00
3265	morning	6	14	10.00	2026-05-16 00:20:22.03347+00
3266	evening	14	22	15.00	2026-05-16 00:20:22.03347+00
3267	night	22	6	12.00	2026-05-16 00:20:22.03347+00
3268	morning	6	14	10.00	2026-05-16 00:20:28.435089+00
3269	evening	14	22	15.00	2026-05-16 00:20:28.435089+00
3270	night	22	6	12.00	2026-05-16 00:20:28.435089+00
3271	morning	6	14	10.00	2026-05-16 00:52:13.45282+00
3272	evening	14	22	15.00	2026-05-16 00:52:13.45282+00
3273	night	22	6	12.00	2026-05-16 00:52:13.45282+00
3274	morning	6	14	10.00	2026-05-16 00:52:36.247724+00
3275	evening	14	22	15.00	2026-05-16 00:52:36.247724+00
3276	night	22	6	12.00	2026-05-16 00:52:36.247724+00
3277	morning	6	14	10.00	2026-05-16 00:52:36.504576+00
3278	evening	14	22	15.00	2026-05-16 00:52:36.504576+00
3279	night	22	6	12.00	2026-05-16 00:52:36.504576+00
3280	morning	6	14	10.00	2026-05-16 00:52:36.555777+00
3281	evening	14	22	15.00	2026-05-16 00:52:36.555777+00
3282	night	22	6	12.00	2026-05-16 00:52:36.555777+00
3283	morning	6	14	10.00	2026-05-16 01:39:38.667841+00
3284	evening	14	22	15.00	2026-05-16 01:39:38.667841+00
3285	night	22	6	12.00	2026-05-16 01:39:38.667841+00
3286	morning	6	14	10.00	2026-05-16 01:40:00.568922+00
3287	evening	14	22	15.00	2026-05-16 01:40:00.568922+00
3288	night	22	6	12.00	2026-05-16 01:40:00.568922+00
3289	morning	6	14	10.00	2026-05-16 01:40:10.715364+00
3290	evening	14	22	15.00	2026-05-16 01:40:10.715364+00
3291	night	22	6	12.00	2026-05-16 01:40:10.715364+00
3292	morning	6	14	10.00	2026-05-16 01:40:10.74275+00
3293	evening	14	22	15.00	2026-05-16 01:40:10.74275+00
3294	night	22	6	12.00	2026-05-16 01:40:10.74275+00
3295	morning	6	14	10.00	2026-05-16 01:41:45.396733+00
3296	evening	14	22	15.00	2026-05-16 01:41:45.396733+00
3297	night	22	6	12.00	2026-05-16 01:41:45.396733+00
3298	morning	6	14	10.00	2026-05-16 01:42:12.698917+00
3299	evening	14	22	15.00	2026-05-16 01:42:12.698917+00
3300	night	22	6	12.00	2026-05-16 01:42:12.698917+00
3301	morning	6	14	10.00	2026-05-16 01:42:12.716399+00
3302	evening	14	22	15.00	2026-05-16 01:42:12.716399+00
3303	night	22	6	12.00	2026-05-16 01:42:12.716399+00
3304	morning	6	14	10.00	2026-05-16 02:01:55.874731+00
3305	evening	14	22	15.00	2026-05-16 02:01:55.874731+00
3306	night	22	6	12.00	2026-05-16 02:01:55.874731+00
3307	morning	6	14	10.00	2026-05-16 02:02:04.13397+00
3308	evening	14	22	15.00	2026-05-16 02:02:04.13397+00
3309	night	22	6	12.00	2026-05-16 02:02:04.13397+00
3310	morning	6	14	10.00	2026-05-16 02:02:20.555721+00
3311	evening	14	22	15.00	2026-05-16 02:02:20.555721+00
3312	night	22	6	12.00	2026-05-16 02:02:20.555721+00
3313	morning	6	14	10.00	2026-05-16 02:02:20.636375+00
3314	evening	14	22	15.00	2026-05-16 02:02:20.636375+00
3315	night	22	6	12.00	2026-05-16 02:02:20.636375+00
3316	morning	6	14	10.00	2026-05-16 02:23:28.006064+00
3317	evening	14	22	15.00	2026-05-16 02:23:28.006064+00
3318	night	22	6	12.00	2026-05-16 02:23:28.006064+00
3319	morning	6	14	10.00	2026-05-16 02:23:28.458387+00
3320	evening	14	22	15.00	2026-05-16 02:23:28.458387+00
3321	night	22	6	12.00	2026-05-16 02:23:28.458387+00
3323	morning	6	14	10.00	2026-05-16 02:30:29.776365+00
3324	evening	14	22	15.00	2026-05-16 02:30:29.776365+00
3325	night	22	6	12.00	2026-05-16 02:30:29.776365+00
3322	morning	6	14	10.00	2026-05-16 02:30:29.774872+00
3326	evening	14	22	15.00	2026-05-16 02:30:29.774872+00
3327	night	22	6	12.00	2026-05-16 02:30:29.774872+00
3328	morning	6	14	10.00	2026-05-16 02:30:29.819674+00
3329	evening	14	22	15.00	2026-05-16 02:30:29.819674+00
3330	night	22	6	12.00	2026-05-16 02:30:29.819674+00
3331	morning	6	14	10.00	2026-05-16 02:30:29.824125+00
3332	evening	14	22	15.00	2026-05-16 02:30:29.824125+00
3333	night	22	6	12.00	2026-05-16 02:30:29.824125+00
3334	morning	6	14	10.00	2026-05-16 02:30:29.924134+00
3335	evening	14	22	15.00	2026-05-16 02:30:29.924134+00
3336	night	22	6	12.00	2026-05-16 02:30:29.924134+00
3337	morning	6	14	10.00	2026-05-16 07:48:26.92303+00
3338	evening	14	22	15.00	2026-05-16 07:48:26.92303+00
3339	night	22	6	12.00	2026-05-16 07:48:26.92303+00
3340	morning	6	14	10.00	2026-05-16 07:48:28.711189+00
3341	evening	14	22	15.00	2026-05-16 07:48:28.711189+00
3342	night	22	6	12.00	2026-05-16 07:48:28.711189+00
3343	morning	6	14	10.00	2026-05-16 07:48:46.419655+00
3344	evening	14	22	15.00	2026-05-16 07:48:46.419655+00
3345	night	22	6	12.00	2026-05-16 07:48:46.419655+00
3346	morning	6	14	10.00	2026-05-16 07:48:46.474677+00
3347	evening	14	22	15.00	2026-05-16 07:48:46.474677+00
3348	night	22	6	12.00	2026-05-16 07:48:46.474677+00
3349	morning	6	14	10.00	2026-05-16 07:48:46.503382+00
3350	evening	14	22	15.00	2026-05-16 07:48:46.503382+00
3351	night	22	6	12.00	2026-05-16 07:48:46.503382+00
3352	morning	6	14	10.00	2026-05-16 07:48:46.51788+00
3353	evening	14	22	15.00	2026-05-16 07:48:46.51788+00
3354	night	22	6	12.00	2026-05-16 07:48:46.51788+00
3355	morning	6	14	10.00	2026-05-16 08:18:42.977181+00
3356	evening	14	22	15.00	2026-05-16 08:18:42.977181+00
3357	night	22	6	12.00	2026-05-16 08:18:42.977181+00
3358	morning	6	14	10.00	2026-05-16 08:19:07.043533+00
3359	evening	14	22	15.00	2026-05-16 08:19:07.043533+00
3360	night	22	6	12.00	2026-05-16 08:19:07.043533+00
3361	morning	6	14	10.00	2026-05-16 08:19:07.212642+00
3362	evening	14	22	15.00	2026-05-16 08:19:07.212642+00
3363	night	22	6	12.00	2026-05-16 08:19:07.212642+00
3364	morning	6	14	10.00	2026-05-16 08:19:07.375998+00
3365	evening	14	22	15.00	2026-05-16 08:19:07.375998+00
3366	night	22	6	12.00	2026-05-16 08:19:07.375998+00
3367	morning	6	14	10.00	2026-05-16 09:36:31.447914+00
3368	evening	14	22	15.00	2026-05-16 09:36:31.447914+00
3369	night	22	6	12.00	2026-05-16 09:36:31.447914+00
3370	morning	6	14	10.00	2026-05-16 10:59:36.583413+00
3372	evening	14	22	15.00	2026-05-16 10:59:36.583413+00
3373	night	22	6	12.00	2026-05-16 10:59:36.583413+00
3371	morning	6	14	10.00	2026-05-16 10:59:36.583852+00
3374	evening	14	22	15.00	2026-05-16 10:59:36.583852+00
3375	night	22	6	12.00	2026-05-16 10:59:36.583852+00
3376	morning	6	14	10.00	2026-05-16 11:00:45.112428+00
3377	evening	14	22	15.00	2026-05-16 11:00:45.112428+00
3378	night	22	6	12.00	2026-05-16 11:00:45.112428+00
3379	morning	6	14	10.00	2026-05-16 11:00:46.263053+00
3380	evening	14	22	15.00	2026-05-16 11:00:46.263053+00
3381	night	22	6	12.00	2026-05-16 11:00:46.263053+00
3382	morning	6	14	10.00	2026-05-16 11:01:04.691466+00
3383	evening	14	22	15.00	2026-05-16 11:01:04.691466+00
3384	night	22	6	12.00	2026-05-16 11:01:04.691466+00
3385	morning	6	14	10.00	2026-05-16 11:01:15.192606+00
3386	evening	14	22	15.00	2026-05-16 11:01:15.192606+00
3387	night	22	6	12.00	2026-05-16 11:01:15.192606+00
3388	morning	6	14	10.00	2026-05-16 11:01:15.200135+00
3389	evening	14	22	15.00	2026-05-16 11:01:15.200135+00
3390	night	22	6	12.00	2026-05-16 11:01:15.200135+00
3391	morning	6	14	10.00	2026-05-16 11:01:24.895737+00
3392	evening	14	22	15.00	2026-05-16 11:01:24.895737+00
3393	night	22	6	12.00	2026-05-16 11:01:24.895737+00
3394	morning	6	14	10.00	2026-05-16 11:02:29.800122+00
3395	evening	14	22	15.00	2026-05-16 11:02:29.800122+00
3396	night	22	6	12.00	2026-05-16 11:02:29.800122+00
3397	morning	6	14	10.00	2026-05-16 11:02:39.666454+00
3398	evening	14	22	15.00	2026-05-16 11:02:39.666454+00
3399	night	22	6	12.00	2026-05-16 11:02:39.666454+00
3400	morning	6	14	10.00	2026-05-16 11:20:22.886109+00
3401	evening	14	22	15.00	2026-05-16 11:20:22.886109+00
3402	night	22	6	12.00	2026-05-16 11:20:22.886109+00
3403	morning	6	14	10.00	2026-05-16 11:20:42.045134+00
3404	evening	14	22	15.00	2026-05-16 11:20:42.045134+00
3405	night	22	6	12.00	2026-05-16 11:20:42.045134+00
3406	morning	6	14	10.00	2026-05-16 11:20:42.055447+00
3407	evening	14	22	15.00	2026-05-16 11:20:42.055447+00
3408	night	22	6	12.00	2026-05-16 11:20:42.055447+00
3409	morning	6	14	10.00	2026-05-16 11:20:42.079657+00
3410	evening	14	22	15.00	2026-05-16 11:20:42.079657+00
3411	night	22	6	12.00	2026-05-16 11:20:42.079657+00
3412	morning	6	14	10.00	2026-05-16 11:20:42.110457+00
3413	evening	14	22	15.00	2026-05-16 11:20:42.110457+00
3414	night	22	6	12.00	2026-05-16 11:20:42.110457+00
3415	morning	6	14	10.00	2026-05-16 11:20:48.484556+00
3416	evening	14	22	15.00	2026-05-16 11:20:48.484556+00
3417	night	22	6	12.00	2026-05-16 11:20:48.484556+00
3418	morning	6	14	10.00	2026-05-16 11:20:58.070179+00
3419	evening	14	22	15.00	2026-05-16 11:20:58.070179+00
3420	night	22	6	12.00	2026-05-16 11:20:58.070179+00
3421	morning	6	14	10.00	2026-05-16 11:20:58.096016+00
3422	evening	14	22	15.00	2026-05-16 11:20:58.096016+00
3423	night	22	6	12.00	2026-05-16 11:20:58.096016+00
3424	morning	6	14	10.00	2026-05-16 11:20:58.142926+00
3425	evening	14	22	15.00	2026-05-16 11:20:58.142926+00
3426	night	22	6	12.00	2026-05-16 11:20:58.142926+00
3427	morning	6	14	10.00	2026-05-16 11:21:03.277259+00
3428	evening	14	22	15.00	2026-05-16 11:21:03.277259+00
3429	night	22	6	12.00	2026-05-16 11:21:03.277259+00
3430	morning	6	14	10.00	2026-05-16 11:21:03.322701+00
3431	evening	14	22	15.00	2026-05-16 11:21:03.322701+00
3432	night	22	6	12.00	2026-05-16 11:21:03.322701+00
3433	morning	6	14	10.00	2026-05-16 11:33:18.807427+00
3434	evening	14	22	15.00	2026-05-16 11:33:18.807427+00
3435	night	22	6	12.00	2026-05-16 11:33:18.807427+00
3436	morning	6	14	10.00	2026-05-16 11:33:19.958025+00
3437	evening	14	22	15.00	2026-05-16 11:33:19.958025+00
3438	night	22	6	12.00	2026-05-16 11:33:19.958025+00
3439	morning	6	14	10.00	2026-05-16 11:33:46.073351+00
3440	evening	14	22	15.00	2026-05-16 11:33:46.073351+00
3441	night	22	6	12.00	2026-05-16 11:33:46.073351+00
3442	morning	6	14	10.00	2026-05-16 11:33:56.067404+00
3443	evening	14	22	15.00	2026-05-16 11:33:56.067404+00
3444	night	22	6	12.00	2026-05-16 11:33:56.067404+00
3445	morning	6	14	10.00	2026-05-16 11:36:36.314152+00
3446	evening	14	22	15.00	2026-05-16 11:36:36.314152+00
3447	night	22	6	12.00	2026-05-16 11:36:36.314152+00
3448	morning	6	14	10.00	2026-05-16 11:36:36.410857+00
3449	evening	14	22	15.00	2026-05-16 11:36:36.410857+00
3450	night	22	6	12.00	2026-05-16 11:36:36.410857+00
3451	morning	6	14	10.00	2026-05-16 11:36:54.174575+00
3452	evening	14	22	15.00	2026-05-16 11:36:54.174575+00
3453	night	22	6	12.00	2026-05-16 11:36:54.174575+00
3454	morning	6	14	10.00	2026-05-16 11:50:06.160442+00
3455	evening	14	22	15.00	2026-05-16 11:50:06.160442+00
3456	night	22	6	12.00	2026-05-16 11:50:06.160442+00
3457	morning	6	14	10.00	2026-05-16 11:50:53.425281+00
3458	evening	14	22	15.00	2026-05-16 11:50:53.425281+00
3459	night	22	6	12.00	2026-05-16 11:50:53.425281+00
3460	morning	6	14	10.00	2026-05-16 11:52:00.673187+00
3461	evening	14	22	15.00	2026-05-16 11:52:00.673187+00
3462	night	22	6	12.00	2026-05-16 11:52:00.673187+00
3463	morning	6	14	10.00	2026-05-16 11:52:10.497387+00
3464	evening	14	22	15.00	2026-05-16 11:52:10.497387+00
3465	night	22	6	12.00	2026-05-16 11:52:10.497387+00
3466	morning	6	14	10.00	2026-05-16 11:52:10.505009+00
3467	evening	14	22	15.00	2026-05-16 11:52:10.505009+00
3468	night	22	6	12.00	2026-05-16 11:52:10.505009+00
3469	morning	6	14	10.00	2026-05-16 11:52:10.50754+00
3470	evening	14	22	15.00	2026-05-16 11:52:10.50754+00
3471	night	22	6	12.00	2026-05-16 11:52:10.50754+00
3472	morning	6	14	10.00	2026-05-16 11:52:10.542899+00
3473	evening	14	22	15.00	2026-05-16 11:52:10.542899+00
3474	night	22	6	12.00	2026-05-16 11:52:10.542899+00
3475	morning	6	14	10.00	2026-05-16 11:58:51.503058+00
3476	evening	14	22	15.00	2026-05-16 11:58:51.503058+00
3477	night	22	6	12.00	2026-05-16 11:58:51.503058+00
3478	morning	6	14	10.00	2026-05-16 11:58:52.609473+00
3479	evening	14	22	15.00	2026-05-16 11:58:52.609473+00
3480	night	22	6	12.00	2026-05-16 11:58:52.609473+00
3481	morning	6	14	10.00	2026-05-16 12:02:32.351963+00
3482	evening	14	22	15.00	2026-05-16 12:02:32.351963+00
3483	night	22	6	12.00	2026-05-16 12:02:32.351963+00
3484	morning	6	14	10.00	2026-05-16 12:03:27.241264+00
3485	evening	14	22	15.00	2026-05-16 12:03:27.241264+00
3486	night	22	6	12.00	2026-05-16 12:03:27.241264+00
3487	morning	6	14	10.00	2026-05-16 12:24:59.255644+00
3488	evening	14	22	15.00	2026-05-16 12:24:59.255644+00
3489	night	22	6	12.00	2026-05-16 12:24:59.255644+00
3490	morning	6	14	10.00	2026-05-16 12:25:04.932109+00
3491	evening	14	22	15.00	2026-05-16 12:25:04.932109+00
3492	night	22	6	12.00	2026-05-16 12:25:04.932109+00
3493	morning	6	14	10.00	2026-05-16 12:25:05.088583+00
3494	evening	14	22	15.00	2026-05-16 12:25:05.088583+00
3495	night	22	6	12.00	2026-05-16 12:25:05.088583+00
3496	morning	6	14	10.00	2026-05-16 12:25:05.15905+00
3497	evening	14	22	15.00	2026-05-16 12:25:05.15905+00
3498	night	22	6	12.00	2026-05-16 12:25:05.15905+00
3499	morning	6	14	10.00	2026-05-16 12:25:05.161677+00
3500	evening	14	22	15.00	2026-05-16 12:25:05.161677+00
3501	night	22	6	12.00	2026-05-16 12:25:05.161677+00
3502	morning	6	14	10.00	2026-05-16 12:25:05.165845+00
3503	evening	14	22	15.00	2026-05-16 12:25:05.165845+00
3504	night	22	6	12.00	2026-05-16 12:25:05.165845+00
3505	morning	6	14	10.00	2026-05-16 12:25:12.410963+00
3506	evening	14	22	15.00	2026-05-16 12:25:12.410963+00
3507	night	22	6	12.00	2026-05-16 12:25:12.410963+00
3508	morning	6	14	10.00	2026-05-16 12:41:01.450971+00
3509	evening	14	22	15.00	2026-05-16 12:41:01.450971+00
3510	night	22	6	12.00	2026-05-16 12:41:01.450971+00
3511	morning	6	14	10.00	2026-05-16 12:41:01.588729+00
3512	evening	14	22	15.00	2026-05-16 12:41:01.588729+00
3513	night	22	6	12.00	2026-05-16 12:41:01.588729+00
3514	morning	6	14	10.00	2026-05-16 12:41:14.079658+00
3515	evening	14	22	15.00	2026-05-16 12:41:14.079658+00
3516	night	22	6	12.00	2026-05-16 12:41:14.079658+00
3517	morning	6	14	10.00	2026-05-16 12:41:14.098237+00
3518	evening	14	22	15.00	2026-05-16 12:41:14.098237+00
3519	night	22	6	12.00	2026-05-16 12:41:14.098237+00
3520	morning	6	14	10.00	2026-05-16 12:41:14.121718+00
3521	evening	14	22	15.00	2026-05-16 12:41:14.121718+00
3522	night	22	6	12.00	2026-05-16 12:41:14.121718+00
3523	morning	6	14	10.00	2026-05-16 12:41:14.151376+00
3524	evening	14	22	15.00	2026-05-16 12:41:14.151376+00
3525	night	22	6	12.00	2026-05-16 12:41:14.151376+00
3526	morning	6	14	10.00	2026-05-16 12:41:22.283138+00
3527	evening	14	22	15.00	2026-05-16 12:41:22.283138+00
3528	night	22	6	12.00	2026-05-16 12:41:22.283138+00
3529	morning	6	14	10.00	2026-05-16 12:41:22.440229+00
3530	evening	14	22	15.00	2026-05-16 12:41:22.440229+00
3531	night	22	6	12.00	2026-05-16 12:41:22.440229+00
3532	morning	6	14	10.00	2026-05-16 12:41:22.554968+00
3533	evening	14	22	15.00	2026-05-16 12:41:22.554968+00
3534	night	22	6	12.00	2026-05-16 12:41:22.554968+00
3535	morning	6	14	10.00	2026-05-16 13:06:13.615859+00
3536	evening	14	22	15.00	2026-05-16 13:06:13.615859+00
3537	night	22	6	12.00	2026-05-16 13:06:13.615859+00
3538	morning	6	14	10.00	2026-05-16 13:06:13.64958+00
3539	evening	14	22	15.00	2026-05-16 13:06:13.64958+00
3540	night	22	6	12.00	2026-05-16 13:06:13.64958+00
3541	morning	6	14	10.00	2026-05-16 13:15:07.047979+00
3542	evening	14	22	15.00	2026-05-16 13:15:07.047979+00
3543	night	22	6	12.00	2026-05-16 13:15:07.047979+00
3544	morning	6	14	10.00	2026-05-16 13:15:07.1039+00
3545	evening	14	22	15.00	2026-05-16 13:15:07.1039+00
3546	night	22	6	12.00	2026-05-16 13:15:07.1039+00
3547	morning	6	14	10.00	2026-05-16 13:15:07.136964+00
3548	evening	14	22	15.00	2026-05-16 13:15:07.136964+00
3549	night	22	6	12.00	2026-05-16 13:15:07.136964+00
3550	morning	6	14	10.00	2026-05-16 13:15:07.202795+00
3551	evening	14	22	15.00	2026-05-16 13:15:07.202795+00
3552	night	22	6	12.00	2026-05-16 13:15:07.202795+00
3553	morning	6	14	10.00	2026-05-16 13:21:31.347488+00
3554	evening	14	22	15.00	2026-05-16 13:21:31.347488+00
3555	night	22	6	12.00	2026-05-16 13:21:31.347488+00
3556	morning	6	14	10.00	2026-05-16 13:21:41.587853+00
3557	evening	14	22	15.00	2026-05-16 13:21:41.587853+00
3558	night	22	6	12.00	2026-05-16 13:21:41.587853+00
3559	morning	6	14	10.00	2026-05-16 13:21:41.680801+00
3560	evening	14	22	15.00	2026-05-16 13:21:41.680801+00
3561	night	22	6	12.00	2026-05-16 13:21:41.680801+00
3562	morning	6	14	10.00	2026-05-16 13:21:41.833997+00
3563	evening	14	22	15.00	2026-05-16 13:21:41.833997+00
3564	night	22	6	12.00	2026-05-16 13:21:41.833997+00
3565	morning	6	14	10.00	2026-05-16 13:21:41.842261+00
3566	evening	14	22	15.00	2026-05-16 13:21:41.842261+00
3567	night	22	6	12.00	2026-05-16 13:21:41.842261+00
3568	morning	6	14	10.00	2026-05-16 13:21:41.884255+00
3569	evening	14	22	15.00	2026-05-16 13:21:41.884255+00
3570	night	22	6	12.00	2026-05-16 13:21:41.884255+00
3571	morning	6	14	10.00	2026-05-16 13:21:48.401876+00
3572	evening	14	22	15.00	2026-05-16 13:21:48.401876+00
3573	night	22	6	12.00	2026-05-16 13:21:48.401876+00
3574	morning	6	14	10.00	2026-05-16 13:22:04.271955+00
3575	evening	14	22	15.00	2026-05-16 13:22:04.271955+00
3576	night	22	6	12.00	2026-05-16 13:22:04.271955+00
3577	morning	6	14	10.00	2026-05-16 13:22:13.657079+00
3578	evening	14	22	15.00	2026-05-16 13:22:13.657079+00
3579	night	22	6	12.00	2026-05-16 13:22:13.657079+00
3580	morning	6	14	10.00	2026-05-16 13:22:13.790822+00
3581	evening	14	22	15.00	2026-05-16 13:22:13.790822+00
3582	night	22	6	12.00	2026-05-16 13:22:13.790822+00
3583	morning	6	14	10.00	2026-05-16 13:23:06.160259+00
3584	evening	14	22	15.00	2026-05-16 13:23:06.160259+00
3585	night	22	6	12.00	2026-05-16 13:23:06.160259+00
3586	morning	6	14	10.00	2026-05-16 13:23:06.188124+00
3587	evening	14	22	15.00	2026-05-16 13:23:06.188124+00
3588	night	22	6	12.00	2026-05-16 13:23:06.188124+00
3589	morning	6	14	10.00	2026-05-16 13:23:13.606605+00
3590	evening	14	22	15.00	2026-05-16 13:23:13.606605+00
3591	night	22	6	12.00	2026-05-16 13:23:13.606605+00
3592	morning	6	14	10.00	2026-05-16 13:23:13.69604+00
3593	evening	14	22	15.00	2026-05-16 13:23:13.69604+00
3594	night	22	6	12.00	2026-05-16 13:23:13.69604+00
3595	morning	6	14	10.00	2026-05-16 13:45:08.798313+00
3596	evening	14	22	15.00	2026-05-16 13:45:08.798313+00
3597	night	22	6	12.00	2026-05-16 13:45:08.798313+00
3598	morning	6	14	10.00	2026-05-16 13:45:49.260554+00
3599	evening	14	22	15.00	2026-05-16 13:45:49.260554+00
3600	night	22	6	12.00	2026-05-16 13:45:49.260554+00
3601	morning	6	14	10.00	2026-05-16 13:56:10.870994+00
3602	evening	14	22	15.00	2026-05-16 13:56:10.870994+00
3603	night	22	6	12.00	2026-05-16 13:56:10.870994+00
3604	morning	6	14	10.00	2026-05-16 13:57:22.680638+00
3605	evening	14	22	15.00	2026-05-16 13:57:22.680638+00
3606	night	22	6	12.00	2026-05-16 13:57:22.680638+00
3607	morning	6	14	10.00	2026-05-16 14:06:18.467198+00
3608	evening	14	22	15.00	2026-05-16 14:06:18.467198+00
3609	night	22	6	12.00	2026-05-16 14:06:18.467198+00
3610	morning	6	14	10.00	2026-05-16 14:06:18.53874+00
3611	evening	14	22	15.00	2026-05-16 14:06:18.53874+00
3612	night	22	6	12.00	2026-05-16 14:06:18.53874+00
3613	morning	6	14	10.00	2026-05-16 14:07:26.961129+00
3614	evening	14	22	15.00	2026-05-16 14:07:26.961129+00
3615	night	22	6	12.00	2026-05-16 14:07:26.961129+00
3616	morning	6	14	10.00	2026-05-16 14:15:34.45728+00
3617	evening	14	22	15.00	2026-05-16 14:15:34.45728+00
3618	night	22	6	12.00	2026-05-16 14:15:34.45728+00
3619	morning	6	14	10.00	2026-05-16 14:18:48.337637+00
3620	evening	14	22	15.00	2026-05-16 14:18:48.337637+00
3621	night	22	6	12.00	2026-05-16 14:18:48.337637+00
3622	morning	6	14	10.00	2026-05-16 14:32:30.227368+00
3623	evening	14	22	15.00	2026-05-16 14:32:30.227368+00
3624	night	22	6	12.00	2026-05-16 14:32:30.227368+00
3625	morning	6	14	10.00	2026-05-16 14:32:30.269846+00
3626	evening	14	22	15.00	2026-05-16 14:32:30.269846+00
3627	night	22	6	12.00	2026-05-16 14:32:30.269846+00
3628	morning	6	14	10.00	2026-05-16 14:55:52.622471+00
3629	evening	14	22	15.00	2026-05-16 14:55:52.622471+00
3630	night	22	6	12.00	2026-05-16 14:55:52.622471+00
3631	morning	6	14	10.00	2026-05-16 14:55:53.043822+00
3632	evening	14	22	15.00	2026-05-16 14:55:53.043822+00
3633	night	22	6	12.00	2026-05-16 14:55:53.043822+00
3634	morning	6	14	10.00	2026-05-16 15:12:50.70257+00
3635	evening	14	22	15.00	2026-05-16 15:12:50.70257+00
3636	night	22	6	12.00	2026-05-16 15:12:50.70257+00
3637	morning	6	14	10.00	2026-05-16 15:13:02.805645+00
3638	evening	14	22	15.00	2026-05-16 15:13:02.805645+00
3639	night	22	6	12.00	2026-05-16 15:13:02.805645+00
3640	morning	6	14	10.00	2026-05-16 15:13:02.861285+00
3641	evening	14	22	15.00	2026-05-16 15:13:02.861285+00
3642	night	22	6	12.00	2026-05-16 15:13:02.861285+00
3643	morning	6	14	10.00	2026-05-16 15:13:03.158518+00
3644	evening	14	22	15.00	2026-05-16 15:13:03.158518+00
3645	night	22	6	12.00	2026-05-16 15:13:03.158518+00
3646	morning	6	14	10.00	2026-05-16 15:13:03.304671+00
3647	evening	14	22	15.00	2026-05-16 15:13:03.304671+00
3648	night	22	6	12.00	2026-05-16 15:13:03.304671+00
3649	morning	6	14	10.00	2026-05-16 15:13:08.282798+00
3650	evening	14	22	15.00	2026-05-16 15:13:08.282798+00
3651	night	22	6	12.00	2026-05-16 15:13:08.282798+00
3652	morning	6	14	10.00	2026-05-16 15:13:08.412372+00
3653	evening	14	22	15.00	2026-05-16 15:13:08.412372+00
3654	night	22	6	12.00	2026-05-16 15:13:08.412372+00
3655	morning	6	14	10.00	2026-05-16 15:13:08.413063+00
3656	evening	14	22	15.00	2026-05-16 15:13:08.413063+00
3657	night	22	6	12.00	2026-05-16 15:13:08.413063+00
3658	morning	6	14	10.00	2026-05-16 15:13:24.885911+00
3659	evening	14	22	15.00	2026-05-16 15:13:24.885911+00
3660	night	22	6	12.00	2026-05-16 15:13:24.885911+00
3661	morning	6	14	10.00	2026-05-16 15:32:12.712372+00
3662	evening	14	22	15.00	2026-05-16 15:32:12.712372+00
3663	night	22	6	12.00	2026-05-16 15:32:12.712372+00
3664	morning	6	14	10.00	2026-05-16 17:21:01.521022+00
3665	evening	14	22	15.00	2026-05-16 17:21:01.521022+00
3666	night	22	6	12.00	2026-05-16 17:21:01.521022+00
3667	morning	6	14	10.00	2026-05-16 17:41:23.63956+00
3668	evening	14	22	15.00	2026-05-16 17:41:23.63956+00
3669	night	22	6	12.00	2026-05-16 17:41:23.63956+00
3670	morning	6	14	10.00	2026-05-16 17:41:35.446167+00
3671	evening	14	22	15.00	2026-05-16 17:41:35.446167+00
3672	night	22	6	12.00	2026-05-16 17:41:35.446167+00
3673	morning	6	14	10.00	2026-05-16 17:41:35.470914+00
3674	evening	14	22	15.00	2026-05-16 17:41:35.470914+00
3675	night	22	6	12.00	2026-05-16 17:41:35.470914+00
3676	morning	6	14	10.00	2026-05-16 17:41:44.553812+00
3677	evening	14	22	15.00	2026-05-16 17:41:44.553812+00
3678	night	22	6	12.00	2026-05-16 17:41:44.553812+00
3679	morning	6	14	10.00	2026-05-16 17:41:44.568104+00
3680	evening	14	22	15.00	2026-05-16 17:41:44.568104+00
3681	night	22	6	12.00	2026-05-16 17:41:44.568104+00
3682	morning	6	14	10.00	2026-05-16 18:03:36.661522+00
3683	evening	14	22	15.00	2026-05-16 18:03:36.661522+00
3684	night	22	6	12.00	2026-05-16 18:03:36.661522+00
3685	morning	6	14	10.00	2026-05-16 18:03:36.688569+00
3686	evening	14	22	15.00	2026-05-16 18:03:36.688569+00
3687	night	22	6	12.00	2026-05-16 18:03:36.688569+00
3688	morning	6	14	10.00	2026-05-16 21:15:47.888451+00
3689	evening	14	22	15.00	2026-05-16 21:15:47.888451+00
3690	night	22	6	12.00	2026-05-16 21:15:47.888451+00
3691	morning	6	14	10.00	2026-05-16 23:11:52.480488+00
3692	evening	14	22	15.00	2026-05-16 23:11:52.480488+00
3693	night	22	6	12.00	2026-05-16 23:11:52.480488+00
3694	morning	6	14	10.00	2026-05-16 23:12:58.280918+00
3695	evening	14	22	15.00	2026-05-16 23:12:58.280918+00
3696	night	22	6	12.00	2026-05-16 23:12:58.280918+00
3697	morning	6	14	10.00	2026-05-16 23:13:11.242425+00
3698	evening	14	22	15.00	2026-05-16 23:13:11.242425+00
3699	night	22	6	12.00	2026-05-16 23:13:11.242425+00
3700	morning	6	14	10.00	2026-05-16 23:13:11.507724+00
3701	evening	14	22	15.00	2026-05-16 23:13:11.507724+00
3702	night	22	6	12.00	2026-05-16 23:13:11.507724+00
3703	morning	6	14	10.00	2026-05-16 23:13:19.323253+00
3704	evening	14	22	15.00	2026-05-16 23:13:19.323253+00
3705	night	22	6	12.00	2026-05-16 23:13:19.323253+00
3706	morning	6	14	10.00	2026-05-16 23:13:20.619874+00
3707	evening	14	22	15.00	2026-05-16 23:13:20.619874+00
3708	night	22	6	12.00	2026-05-16 23:13:20.619874+00
3709	morning	6	14	10.00	2026-05-16 23:13:25.067394+00
3710	evening	14	22	15.00	2026-05-16 23:13:25.067394+00
3711	night	22	6	12.00	2026-05-16 23:13:25.067394+00
3712	morning	6	14	10.00	2026-05-16 23:13:25.070797+00
3713	evening	14	22	15.00	2026-05-16 23:13:25.070797+00
3714	night	22	6	12.00	2026-05-16 23:13:25.070797+00
3715	morning	6	14	10.00	2026-05-16 23:13:25.124106+00
3716	evening	14	22	15.00	2026-05-16 23:13:25.124106+00
3717	night	22	6	12.00	2026-05-16 23:13:25.124106+00
3718	morning	6	14	10.00	2026-05-16 23:13:25.205993+00
3719	evening	14	22	15.00	2026-05-16 23:13:25.205993+00
3720	night	22	6	12.00	2026-05-16 23:13:25.205993+00
3721	morning	6	14	10.00	2026-05-16 23:13:25.249805+00
3722	evening	14	22	15.00	2026-05-16 23:13:25.249805+00
3723	night	22	6	12.00	2026-05-16 23:13:25.249805+00
3724	morning	6	14	10.00	2026-05-16 23:44:50.924345+00
3726	evening	14	22	15.00	2026-05-16 23:44:50.924345+00
3727	night	22	6	12.00	2026-05-16 23:44:50.924345+00
3725	morning	6	14	10.00	2026-05-16 23:44:50.926391+00
3728	evening	14	22	15.00	2026-05-16 23:44:50.926391+00
3729	night	22	6	12.00	2026-05-16 23:44:50.926391+00
3730	morning	6	14	10.00	2026-05-16 23:47:33.899617+00
3731	evening	14	22	15.00	2026-05-16 23:47:33.899617+00
3732	night	22	6	12.00	2026-05-16 23:47:33.899617+00
3733	morning	6	14	10.00	2026-05-16 23:47:34.11235+00
3734	evening	14	22	15.00	2026-05-16 23:47:34.11235+00
3735	night	22	6	12.00	2026-05-16 23:47:34.11235+00
3736	morning	6	14	10.00	2026-05-16 23:47:52.62254+00
3737	evening	14	22	15.00	2026-05-16 23:47:52.62254+00
3738	night	22	6	12.00	2026-05-16 23:47:52.62254+00
3739	morning	6	14	10.00	2026-05-16 23:47:52.63839+00
3740	evening	14	22	15.00	2026-05-16 23:47:52.63839+00
3741	night	22	6	12.00	2026-05-16 23:47:52.63839+00
3742	morning	6	14	10.00	2026-05-17 00:11:16.387981+00
3743	evening	14	22	15.00	2026-05-17 00:11:16.387981+00
3744	night	22	6	12.00	2026-05-17 00:11:16.387981+00
3745	morning	6	14	10.00	2026-05-17 00:11:16.858863+00
3746	evening	14	22	15.00	2026-05-17 00:11:16.858863+00
3747	night	22	6	12.00	2026-05-17 00:11:16.858863+00
3748	morning	6	14	10.00	2026-05-17 00:11:20.162909+00
3749	evening	14	22	15.00	2026-05-17 00:11:20.162909+00
3750	night	22	6	12.00	2026-05-17 00:11:20.162909+00
3751	morning	6	14	10.00	2026-05-17 00:11:20.240486+00
3752	evening	14	22	15.00	2026-05-17 00:11:20.240486+00
3753	night	22	6	12.00	2026-05-17 00:11:20.240486+00
3754	morning	6	14	10.00	2026-05-17 00:11:20.52283+00
3755	evening	14	22	15.00	2026-05-17 00:11:20.52283+00
3756	night	22	6	12.00	2026-05-17 00:11:20.52283+00
3757	morning	6	14	10.00	2026-05-17 00:11:25.159904+00
3758	evening	14	22	15.00	2026-05-17 00:11:25.159904+00
3759	night	22	6	12.00	2026-05-17 00:11:25.159904+00
3760	morning	6	14	10.00	2026-05-17 00:11:25.258062+00
3761	evening	14	22	15.00	2026-05-17 00:11:25.258062+00
3762	night	22	6	12.00	2026-05-17 00:11:25.258062+00
3763	morning	6	14	10.00	2026-05-17 00:11:45.315407+00
3764	evening	14	22	15.00	2026-05-17 00:11:45.315407+00
3765	night	22	6	12.00	2026-05-17 00:11:45.315407+00
3766	morning	6	14	10.00	2026-05-17 00:11:51.295699+00
3767	evening	14	22	15.00	2026-05-17 00:11:51.295699+00
3768	night	22	6	12.00	2026-05-17 00:11:51.295699+00
3769	morning	6	14	10.00	2026-05-17 00:11:51.315347+00
3770	evening	14	22	15.00	2026-05-17 00:11:51.315347+00
3771	night	22	6	12.00	2026-05-17 00:11:51.315347+00
3772	morning	6	14	10.00	2026-05-17 00:11:51.365431+00
3773	evening	14	22	15.00	2026-05-17 00:11:51.365431+00
3774	night	22	6	12.00	2026-05-17 00:11:51.365431+00
3775	morning	6	14	10.00	2026-05-17 00:11:51.41258+00
3776	evening	14	22	15.00	2026-05-17 00:11:51.41258+00
3777	night	22	6	12.00	2026-05-17 00:11:51.41258+00
3778	morning	6	14	10.00	2026-05-17 00:11:51.413196+00
3779	evening	14	22	15.00	2026-05-17 00:11:51.413196+00
3780	night	22	6	12.00	2026-05-17 00:11:51.413196+00
3781	morning	6	14	10.00	2026-05-17 00:11:51.429623+00
3782	evening	14	22	15.00	2026-05-17 00:11:51.429623+00
3783	night	22	6	12.00	2026-05-17 00:11:51.429623+00
3784	morning	6	14	10.00	2026-05-17 10:19:13.552672+00
3785	evening	14	22	15.00	2026-05-17 10:19:13.552672+00
3786	night	22	6	12.00	2026-05-17 10:19:13.552672+00
3787	morning	6	14	10.00	2026-05-17 10:19:36.680433+00
3788	evening	14	22	15.00	2026-05-17 10:19:36.680433+00
3789	night	22	6	12.00	2026-05-17 10:19:36.680433+00
3790	morning	6	14	10.00	2026-05-17 10:19:36.818506+00
3791	evening	14	22	15.00	2026-05-17 10:19:36.818506+00
3792	night	22	6	12.00	2026-05-17 10:19:36.818506+00
3793	morning	6	14	10.00	2026-05-17 10:19:47.207791+00
3794	evening	14	22	15.00	2026-05-17 10:19:47.207791+00
3795	night	22	6	12.00	2026-05-17 10:19:47.207791+00
3796	morning	6	14	10.00	2026-05-17 11:31:45.80813+00
3797	evening	14	22	15.00	2026-05-17 11:31:45.80813+00
3798	night	22	6	12.00	2026-05-17 11:31:45.80813+00
3799	morning	6	14	10.00	2026-05-17 11:38:10.39242+00
3800	evening	14	22	15.00	2026-05-17 11:38:10.39242+00
3801	night	22	6	12.00	2026-05-17 11:38:10.39242+00
3802	morning	6	14	10.00	2026-05-17 11:39:11.541151+00
3803	evening	14	22	15.00	2026-05-17 11:39:11.541151+00
3804	night	22	6	12.00	2026-05-17 11:39:11.541151+00
3805	morning	6	14	10.00	2026-05-17 11:39:11.808233+00
3806	evening	14	22	15.00	2026-05-17 11:39:11.808233+00
3807	night	22	6	12.00	2026-05-17 11:39:11.808233+00
3808	morning	6	14	10.00	2026-05-17 11:47:13.379535+00
3809	evening	14	22	15.00	2026-05-17 11:47:13.379535+00
3810	night	22	6	12.00	2026-05-17 11:47:13.379535+00
3811	morning	6	14	10.00	2026-05-17 18:23:36.246336+00
3812	evening	14	22	15.00	2026-05-17 18:23:36.246336+00
3813	night	22	6	12.00	2026-05-17 18:23:36.246336+00
3814	morning	6	14	10.00	2026-05-17 18:23:36.751857+00
3815	evening	14	22	15.00	2026-05-17 18:23:36.751857+00
3816	night	22	6	12.00	2026-05-17 18:23:36.751857+00
3817	morning	6	14	10.00	2026-05-17 18:32:15.979942+00
3818	evening	14	22	15.00	2026-05-17 18:32:15.979942+00
3819	night	22	6	12.00	2026-05-17 18:32:15.979942+00
3820	morning	6	14	10.00	2026-05-17 18:32:16.577996+00
3821	evening	14	22	15.00	2026-05-17 18:32:16.577996+00
3822	night	22	6	12.00	2026-05-17 18:32:16.577996+00
3823	morning	6	14	10.00	2026-05-17 19:36:57.628258+00
3824	evening	14	22	15.00	2026-05-17 19:36:57.628258+00
3825	night	22	6	12.00	2026-05-17 19:36:57.628258+00
3826	morning	6	14	10.00	2026-05-17 19:36:58.120611+00
3827	evening	14	22	15.00	2026-05-17 19:36:58.120611+00
3828	night	22	6	12.00	2026-05-17 19:36:58.120611+00
3829	morning	6	14	10.00	2026-05-17 19:41:33.943389+00
3830	evening	14	22	15.00	2026-05-17 19:41:33.943389+00
3831	night	22	6	12.00	2026-05-17 19:41:33.943389+00
3832	morning	6	14	10.00	2026-05-17 19:41:35.019387+00
3833	evening	14	22	15.00	2026-05-17 19:41:35.019387+00
3834	night	22	6	12.00	2026-05-17 19:41:35.019387+00
3835	morning	6	14	10.00	2026-05-17 20:01:39.094031+00
3836	evening	14	22	15.00	2026-05-17 20:01:39.094031+00
3837	night	22	6	12.00	2026-05-17 20:01:39.094031+00
3838	morning	6	14	10.00	2026-05-17 20:02:13.456314+00
3839	evening	14	22	15.00	2026-05-17 20:02:13.456314+00
3840	night	22	6	12.00	2026-05-17 20:02:13.456314+00
3841	morning	6	14	10.00	2026-05-17 20:02:13.478159+00
3842	evening	14	22	15.00	2026-05-17 20:02:13.478159+00
3843	night	22	6	12.00	2026-05-17 20:02:13.478159+00
3844	morning	6	14	10.00	2026-05-17 20:02:13.514277+00
3845	evening	14	22	15.00	2026-05-17 20:02:13.514277+00
3846	night	22	6	12.00	2026-05-17 20:02:13.514277+00
3847	morning	6	14	10.00	2026-05-17 20:02:13.612502+00
3848	evening	14	22	15.00	2026-05-17 20:02:13.612502+00
3849	night	22	6	12.00	2026-05-17 20:02:13.612502+00
3850	morning	6	14	10.00	2026-05-17 20:08:58.574247+00
3851	evening	14	22	15.00	2026-05-17 20:08:58.574247+00
3852	night	22	6	12.00	2026-05-17 20:08:58.574247+00
3853	morning	6	14	10.00	2026-05-17 20:08:58.733338+00
3854	evening	14	22	15.00	2026-05-17 20:08:58.733338+00
3855	night	22	6	12.00	2026-05-17 20:08:58.733338+00
3856	morning	6	14	10.00	2026-05-17 20:12:31.319021+00
3857	evening	14	22	15.00	2026-05-17 20:12:31.319021+00
3858	night	22	6	12.00	2026-05-17 20:12:31.319021+00
3859	morning	6	14	10.00	2026-05-17 20:12:31.319663+00
3860	evening	14	22	15.00	2026-05-17 20:12:31.319663+00
3861	night	22	6	12.00	2026-05-17 20:12:31.319663+00
3862	morning	6	14	10.00	2026-05-17 20:24:21.380469+00
3863	evening	14	22	15.00	2026-05-17 20:24:21.380469+00
3864	night	22	6	12.00	2026-05-17 20:24:21.380469+00
3865	morning	6	14	10.00	2026-05-17 20:24:21.411131+00
3866	evening	14	22	15.00	2026-05-17 20:24:21.411131+00
3867	night	22	6	12.00	2026-05-17 20:24:21.411131+00
3868	morning	6	14	10.00	2026-05-17 22:40:10.167724+00
3869	evening	14	22	15.00	2026-05-17 22:40:10.167724+00
3870	night	22	6	12.00	2026-05-17 22:40:10.167724+00
3871	morning	6	14	10.00	2026-05-17 22:40:21.713394+00
3872	evening	14	22	15.00	2026-05-17 22:40:21.713394+00
3873	night	22	6	12.00	2026-05-17 22:40:21.713394+00
3874	morning	6	14	10.00	2026-05-17 22:40:21.732839+00
3875	evening	14	22	15.00	2026-05-17 22:40:21.732839+00
3876	night	22	6	12.00	2026-05-17 22:40:21.732839+00
3877	morning	6	14	10.00	2026-05-17 22:40:39.18507+00
3878	evening	14	22	15.00	2026-05-17 22:40:39.18507+00
3879	night	22	6	12.00	2026-05-17 22:40:39.18507+00
3880	morning	6	14	10.00	2026-05-17 22:46:12.13736+00
3881	evening	14	22	15.00	2026-05-17 22:46:12.13736+00
3882	night	22	6	12.00	2026-05-17 22:46:12.13736+00
3883	morning	6	14	10.00	2026-05-17 22:46:12.160198+00
3884	evening	14	22	15.00	2026-05-17 22:46:12.160198+00
3885	night	22	6	12.00	2026-05-17 22:46:12.160198+00
3886	morning	6	14	10.00	2026-05-17 22:46:12.396657+00
3887	evening	14	22	15.00	2026-05-17 22:46:12.396657+00
3888	night	22	6	12.00	2026-05-17 22:46:12.396657+00
3889	morning	6	14	10.00	2026-05-17 23:16:32.656769+00
3890	evening	14	22	15.00	2026-05-17 23:16:32.656769+00
3891	night	22	6	12.00	2026-05-17 23:16:32.656769+00
3892	morning	6	14	10.00	2026-05-17 23:16:37.965794+00
3893	evening	14	22	15.00	2026-05-17 23:16:37.965794+00
3894	night	22	6	12.00	2026-05-17 23:16:37.965794+00
3895	morning	6	14	10.00	2026-05-17 23:16:38.170786+00
3896	evening	14	22	15.00	2026-05-17 23:16:38.170786+00
3897	night	22	6	12.00	2026-05-17 23:16:38.170786+00
3898	morning	6	14	10.00	2026-05-17 23:16:52.341216+00
3899	evening	14	22	15.00	2026-05-17 23:16:52.341216+00
3900	night	22	6	12.00	2026-05-17 23:16:52.341216+00
3901	morning	6	14	10.00	2026-05-17 23:17:11.620465+00
3902	evening	14	22	15.00	2026-05-17 23:17:11.620465+00
3903	night	22	6	12.00	2026-05-17 23:17:11.620465+00
3904	morning	6	14	10.00	2026-05-17 23:29:10.494575+00
3905	evening	14	22	15.00	2026-05-17 23:29:10.494575+00
3906	night	22	6	12.00	2026-05-17 23:29:10.494575+00
3907	morning	6	14	10.00	2026-05-17 23:29:10.699511+00
3908	evening	14	22	15.00	2026-05-17 23:29:10.699511+00
3909	night	22	6	12.00	2026-05-17 23:29:10.699511+00
3910	morning	6	14	10.00	2026-05-17 23:29:10.726992+00
3911	evening	14	22	15.00	2026-05-17 23:29:10.726992+00
3912	night	22	6	12.00	2026-05-17 23:29:10.726992+00
3913	morning	6	14	10.00	2026-05-17 23:34:37.481403+00
3914	evening	14	22	15.00	2026-05-17 23:34:37.481403+00
3915	night	22	6	12.00	2026-05-17 23:34:37.481403+00
3916	morning	6	14	10.00	2026-05-17 23:45:26.149707+00
3918	evening	14	22	15.00	2026-05-17 23:45:26.149707+00
3919	night	22	6	12.00	2026-05-17 23:45:26.149707+00
3917	morning	6	14	10.00	2026-05-17 23:45:26.152312+00
3920	evening	14	22	15.00	2026-05-17 23:45:26.152312+00
3921	night	22	6	12.00	2026-05-17 23:45:26.152312+00
3922	morning	6	14	10.00	2026-05-17 23:45:26.170446+00
3923	evening	14	22	15.00	2026-05-17 23:45:26.170446+00
3924	night	22	6	12.00	2026-05-17 23:45:26.170446+00
3925	morning	6	14	10.00	2026-05-18 00:21:36.277216+00
3926	evening	14	22	15.00	2026-05-18 00:21:36.277216+00
3927	night	22	6	12.00	2026-05-18 00:21:36.277216+00
3928	morning	6	14	10.00	2026-05-18 00:21:47.988027+00
3929	evening	14	22	15.00	2026-05-18 00:21:47.988027+00
3930	night	22	6	12.00	2026-05-18 00:21:47.988027+00
3931	morning	6	14	10.00	2026-05-18 00:21:48.088666+00
3932	evening	14	22	15.00	2026-05-18 00:21:48.088666+00
3933	night	22	6	12.00	2026-05-18 00:21:48.088666+00
3934	morning	6	14	10.00	2026-05-18 00:21:48.198796+00
3935	evening	14	22	15.00	2026-05-18 00:21:48.198796+00
3936	night	22	6	12.00	2026-05-18 00:21:48.198796+00
3937	morning	6	14	10.00	2026-05-18 00:21:48.465121+00
3938	evening	14	22	15.00	2026-05-18 00:21:48.465121+00
3939	night	22	6	12.00	2026-05-18 00:21:48.465121+00
3940	morning	6	14	10.00	2026-05-18 00:21:58.117556+00
3941	evening	14	22	15.00	2026-05-18 00:21:58.117556+00
3942	night	22	6	12.00	2026-05-18 00:21:58.117556+00
3943	morning	6	14	10.00	2026-05-18 07:16:57.812102+00
3944	evening	14	22	15.00	2026-05-18 07:16:57.812102+00
3945	night	22	6	12.00	2026-05-18 07:16:57.812102+00
3946	morning	6	14	10.00	2026-05-18 09:39:32.04691+00
3947	evening	14	22	15.00	2026-05-18 09:39:32.04691+00
3948	night	22	6	12.00	2026-05-18 09:39:32.04691+00
3949	morning	6	14	10.00	2026-05-18 09:39:42.936277+00
3950	evening	14	22	15.00	2026-05-18 09:39:42.936277+00
3951	night	22	6	12.00	2026-05-18 09:39:42.936277+00
3952	morning	6	14	10.00	2026-05-18 09:39:42.942107+00
3953	evening	14	22	15.00	2026-05-18 09:39:42.942107+00
3954	night	22	6	12.00	2026-05-18 09:39:42.942107+00
3955	morning	6	14	10.00	2026-05-18 09:46:22.351289+00
3956	evening	14	22	15.00	2026-05-18 09:46:22.351289+00
3957	night	22	6	12.00	2026-05-18 09:46:22.351289+00
3958	morning	6	14	10.00	2026-05-18 09:46:22.382768+00
3959	evening	14	22	15.00	2026-05-18 09:46:22.382768+00
3960	night	22	6	12.00	2026-05-18 09:46:22.382768+00
3961	morning	6	14	10.00	2026-05-18 10:10:40.90262+00
3962	evening	14	22	15.00	2026-05-18 10:10:40.90262+00
3963	night	22	6	12.00	2026-05-18 10:10:40.90262+00
3964	morning	6	14	10.00	2026-05-18 11:00:50.633888+00
3965	evening	14	22	15.00	2026-05-18 11:00:50.633888+00
3966	night	22	6	12.00	2026-05-18 11:00:50.633888+00
3967	morning	6	14	10.00	2026-05-18 11:01:03.060685+00
3968	evening	14	22	15.00	2026-05-18 11:01:03.060685+00
3969	night	22	6	12.00	2026-05-18 11:01:03.060685+00
3970	morning	6	14	10.00	2026-05-18 11:01:03.224878+00
3971	evening	14	22	15.00	2026-05-18 11:01:03.224878+00
3972	night	22	6	12.00	2026-05-18 11:01:03.224878+00
3973	morning	6	14	10.00	2026-05-18 11:14:58.001242+00
3974	evening	14	22	15.00	2026-05-18 11:14:58.001242+00
3975	night	22	6	12.00	2026-05-18 11:14:58.001242+00
3976	morning	6	14	10.00	2026-05-18 11:14:58.555467+00
3977	evening	14	22	15.00	2026-05-18 11:14:58.555467+00
3978	night	22	6	12.00	2026-05-18 11:14:58.555467+00
3979	morning	6	14	10.00	2026-05-18 11:15:04.192164+00
3980	evening	14	22	15.00	2026-05-18 11:15:04.192164+00
3981	night	22	6	12.00	2026-05-18 11:15:04.192164+00
3982	morning	6	14	10.00	2026-05-18 11:15:04.256724+00
3983	evening	14	22	15.00	2026-05-18 11:15:04.256724+00
3984	night	22	6	12.00	2026-05-18 11:15:04.256724+00
3985	morning	6	14	10.00	2026-05-18 11:15:04.25998+00
3986	evening	14	22	15.00	2026-05-18 11:15:04.25998+00
3987	night	22	6	12.00	2026-05-18 11:15:04.25998+00
3988	morning	6	14	10.00	2026-05-18 11:15:04.339753+00
3989	evening	14	22	15.00	2026-05-18 11:15:04.339753+00
3990	night	22	6	12.00	2026-05-18 11:15:04.339753+00
3991	morning	6	14	10.00	2026-05-18 11:15:04.652444+00
3992	evening	14	22	15.00	2026-05-18 11:15:04.652444+00
3993	night	22	6	12.00	2026-05-18 11:15:04.652444+00
3994	morning	6	14	10.00	2026-05-18 11:15:04.889116+00
3995	evening	14	22	15.00	2026-05-18 11:15:04.889116+00
3996	night	22	6	12.00	2026-05-18 11:15:04.889116+00
3997	morning	6	14	10.00	2026-05-18 11:15:23.89885+00
3998	evening	14	22	15.00	2026-05-18 11:15:23.89885+00
3999	night	22	6	12.00	2026-05-18 11:15:23.89885+00
4000	morning	6	14	10.00	2026-05-18 11:15:31.123041+00
4001	evening	14	22	15.00	2026-05-18 11:15:31.123041+00
4002	night	22	6	12.00	2026-05-18 11:15:31.123041+00
4003	morning	6	14	10.00	2026-05-18 11:15:31.146414+00
4004	evening	14	22	15.00	2026-05-18 11:15:31.146414+00
4005	night	22	6	12.00	2026-05-18 11:15:31.146414+00
4006	morning	6	14	10.00	2026-05-18 11:15:31.171503+00
4007	evening	14	22	15.00	2026-05-18 11:15:31.171503+00
4008	night	22	6	12.00	2026-05-18 11:15:31.171503+00
4009	morning	6	14	10.00	2026-05-18 11:15:31.190443+00
4010	evening	14	22	15.00	2026-05-18 11:15:31.190443+00
4011	night	22	6	12.00	2026-05-18 11:15:31.190443+00
4012	morning	6	14	10.00	2026-05-18 11:15:31.28817+00
4013	evening	14	22	15.00	2026-05-18 11:15:31.28817+00
4014	night	22	6	12.00	2026-05-18 11:15:31.28817+00
4015	morning	6	14	10.00	2026-05-18 11:15:31.360561+00
4016	evening	14	22	15.00	2026-05-18 11:15:31.360561+00
4017	night	22	6	12.00	2026-05-18 11:15:31.360561+00
4018	morning	6	14	10.00	2026-05-18 11:29:18.262795+00
4019	evening	14	22	15.00	2026-05-18 11:29:18.262795+00
4020	night	22	6	12.00	2026-05-18 11:29:18.262795+00
4021	morning	6	14	10.00	2026-05-18 11:46:21.353827+00
4022	evening	14	22	15.00	2026-05-18 11:46:21.353827+00
4023	night	22	6	12.00	2026-05-18 11:46:21.353827+00
4024	morning	6	14	10.00	2026-05-18 11:47:03.309653+00
4025	evening	14	22	15.00	2026-05-18 11:47:03.309653+00
4026	night	22	6	12.00	2026-05-18 11:47:03.309653+00
4027	morning	6	14	10.00	2026-05-18 11:47:03.368804+00
4028	evening	14	22	15.00	2026-05-18 11:47:03.368804+00
4029	night	22	6	12.00	2026-05-18 11:47:03.368804+00
4030	morning	6	14	10.00	2026-05-18 12:27:47.896716+00
4031	evening	14	22	15.00	2026-05-18 12:27:47.896716+00
4032	night	22	6	12.00	2026-05-18 12:27:47.896716+00
4033	morning	6	14	10.00	2026-05-18 12:55:59.958031+00
4034	evening	14	22	15.00	2026-05-18 12:55:59.958031+00
4035	night	22	6	12.00	2026-05-18 12:55:59.958031+00
4036	morning	6	14	10.00	2026-05-18 12:56:10.756131+00
4037	evening	14	22	15.00	2026-05-18 12:56:10.756131+00
4038	night	22	6	12.00	2026-05-18 12:56:10.756131+00
4039	morning	6	14	10.00	2026-05-18 12:56:10.808397+00
4040	evening	14	22	15.00	2026-05-18 12:56:10.808397+00
4041	night	22	6	12.00	2026-05-18 12:56:10.808397+00
4042	morning	6	14	10.00	2026-05-18 12:56:46.507171+00
4043	evening	14	22	15.00	2026-05-18 12:56:46.507171+00
4044	night	22	6	12.00	2026-05-18 12:56:46.507171+00
4045	morning	6	14	10.00	2026-05-18 12:56:46.509759+00
4046	evening	14	22	15.00	2026-05-18 12:56:46.509759+00
4047	night	22	6	12.00	2026-05-18 12:56:46.509759+00
4048	morning	6	14	10.00	2026-05-18 13:44:13.789518+00
4049	evening	14	22	15.00	2026-05-18 13:44:13.789518+00
4050	night	22	6	12.00	2026-05-18 13:44:13.789518+00
4051	morning	6	14	10.00	2026-05-18 13:44:39.412652+00
4052	evening	14	22	15.00	2026-05-18 13:44:39.412652+00
4053	night	22	6	12.00	2026-05-18 13:44:39.412652+00
4054	morning	6	14	10.00	2026-05-18 13:44:39.717563+00
4055	evening	14	22	15.00	2026-05-18 13:44:39.717563+00
4056	night	22	6	12.00	2026-05-18 13:44:39.717563+00
4057	morning	6	14	10.00	2026-05-18 13:44:39.752891+00
4058	evening	14	22	15.00	2026-05-18 13:44:39.752891+00
4059	night	22	6	12.00	2026-05-18 13:44:39.752891+00
4060	morning	6	14	10.00	2026-05-18 13:44:47.59828+00
4061	evening	14	22	15.00	2026-05-18 13:44:47.59828+00
4062	night	22	6	12.00	2026-05-18 13:44:47.59828+00
4063	morning	6	14	10.00	2026-05-18 13:44:57.644204+00
4064	evening	14	22	15.00	2026-05-18 13:44:57.644204+00
4065	night	22	6	12.00	2026-05-18 13:44:57.644204+00
4066	morning	6	14	10.00	2026-05-18 13:44:57.730025+00
4067	evening	14	22	15.00	2026-05-18 13:44:57.730025+00
4068	night	22	6	12.00	2026-05-18 13:44:57.730025+00
4069	morning	6	14	10.00	2026-05-18 13:45:18.914709+00
4070	evening	14	22	15.00	2026-05-18 13:45:18.914709+00
4071	night	22	6	12.00	2026-05-18 13:45:18.914709+00
4072	morning	6	14	10.00	2026-05-18 13:45:18.919774+00
4073	evening	14	22	15.00	2026-05-18 13:45:18.919774+00
4074	night	22	6	12.00	2026-05-18 13:45:18.919774+00
4075	morning	6	14	10.00	2026-05-18 13:46:20.507355+00
4076	evening	14	22	15.00	2026-05-18 13:46:20.507355+00
4077	night	22	6	12.00	2026-05-18 13:46:20.507355+00
4078	morning	6	14	10.00	2026-05-18 14:00:16.928792+00
4079	evening	14	22	15.00	2026-05-18 14:00:16.928792+00
4080	night	22	6	12.00	2026-05-18 14:00:16.928792+00
4081	morning	6	14	10.00	2026-05-18 14:00:26.91256+00
4082	evening	14	22	15.00	2026-05-18 14:00:26.91256+00
4083	night	22	6	12.00	2026-05-18 14:00:26.91256+00
4084	morning	6	14	10.00	2026-05-18 14:00:27.093782+00
4085	evening	14	22	15.00	2026-05-18 14:00:27.093782+00
4086	night	22	6	12.00	2026-05-18 14:00:27.093782+00
4087	morning	6	14	10.00	2026-05-18 14:00:52.262189+00
4088	evening	14	22	15.00	2026-05-18 14:00:52.262189+00
4089	night	22	6	12.00	2026-05-18 14:00:52.262189+00
4090	morning	6	14	10.00	2026-05-18 14:03:42.028442+00
4091	evening	14	22	15.00	2026-05-18 14:03:42.028442+00
4092	night	22	6	12.00	2026-05-18 14:03:42.028442+00
4093	morning	6	14	10.00	2026-05-18 14:04:18.498103+00
4094	evening	14	22	15.00	2026-05-18 14:04:18.498103+00
4095	night	22	6	12.00	2026-05-18 14:04:18.498103+00
4096	morning	6	14	10.00	2026-05-18 14:04:19.691293+00
4097	evening	14	22	15.00	2026-05-18 14:04:19.691293+00
4098	night	22	6	12.00	2026-05-18 14:04:19.691293+00
4099	morning	6	14	10.00	2026-05-18 14:12:29.585386+00
4100	evening	14	22	15.00	2026-05-18 14:12:29.585386+00
4101	night	22	6	12.00	2026-05-18 14:12:29.585386+00
4102	morning	6	14	10.00	2026-05-18 14:14:15.20341+00
4103	evening	14	22	15.00	2026-05-18 14:14:15.20341+00
4104	night	22	6	12.00	2026-05-18 14:14:15.20341+00
4105	morning	6	14	10.00	2026-05-18 14:14:23.334076+00
4106	evening	14	22	15.00	2026-05-18 14:14:23.334076+00
4107	night	22	6	12.00	2026-05-18 14:14:23.334076+00
4108	morning	6	14	10.00	2026-05-18 14:14:30.19834+00
4109	evening	14	22	15.00	2026-05-18 14:14:30.19834+00
4110	night	22	6	12.00	2026-05-18 14:14:30.19834+00
4111	morning	6	14	10.00	2026-05-18 14:14:30.401884+00
4112	evening	14	22	15.00	2026-05-18 14:14:30.401884+00
4113	night	22	6	12.00	2026-05-18 14:14:30.401884+00
4114	morning	6	14	10.00	2026-05-18 14:14:37.306994+00
4115	evening	14	22	15.00	2026-05-18 14:14:37.306994+00
4116	night	22	6	12.00	2026-05-18 14:14:37.306994+00
4117	morning	6	14	10.00	2026-05-18 14:14:42.6147+00
4118	evening	14	22	15.00	2026-05-18 14:14:42.6147+00
4119	night	22	6	12.00	2026-05-18 14:14:42.6147+00
4120	morning	6	14	10.00	2026-05-18 14:16:57.769195+00
4121	evening	14	22	15.00	2026-05-18 14:16:57.769195+00
4122	night	22	6	12.00	2026-05-18 14:16:57.769195+00
4123	morning	6	14	10.00	2026-05-18 14:16:57.853617+00
4124	evening	14	22	15.00	2026-05-18 14:16:57.853617+00
4125	night	22	6	12.00	2026-05-18 14:16:57.853617+00
4126	morning	6	14	10.00	2026-05-18 14:17:02.249781+00
4127	evening	14	22	15.00	2026-05-18 14:17:02.249781+00
4128	night	22	6	12.00	2026-05-18 14:17:02.249781+00
4129	morning	6	14	10.00	2026-05-18 14:26:46.449168+00
4130	evening	14	22	15.00	2026-05-18 14:26:46.449168+00
4131	night	22	6	12.00	2026-05-18 14:26:46.449168+00
4132	morning	6	14	10.00	2026-05-18 14:27:09.072131+00
4133	evening	14	22	15.00	2026-05-18 14:27:09.072131+00
4134	night	22	6	12.00	2026-05-18 14:27:09.072131+00
4135	morning	6	14	10.00	2026-05-18 14:27:18.711794+00
4136	evening	14	22	15.00	2026-05-18 14:27:18.711794+00
4137	night	22	6	12.00	2026-05-18 14:27:18.711794+00
4138	morning	6	14	10.00	2026-05-18 14:27:18.728327+00
4139	evening	14	22	15.00	2026-05-18 14:27:18.728327+00
4140	night	22	6	12.00	2026-05-18 14:27:18.728327+00
4141	morning	6	14	10.00	2026-05-18 14:27:45.465198+00
4142	evening	14	22	15.00	2026-05-18 14:27:45.465198+00
4143	night	22	6	12.00	2026-05-18 14:27:45.465198+00
4144	morning	6	14	10.00	2026-05-18 14:35:37.684211+00
4145	evening	14	22	15.00	2026-05-18 14:35:37.684211+00
4146	night	22	6	12.00	2026-05-18 14:35:37.684211+00
4147	morning	6	14	10.00	2026-05-18 14:47:39.619767+00
4148	evening	14	22	15.00	2026-05-18 14:47:39.619767+00
4149	night	22	6	12.00	2026-05-18 14:47:39.619767+00
4150	morning	6	14	10.00	2026-05-18 14:48:17.082209+00
4151	evening	14	22	15.00	2026-05-18 14:48:17.082209+00
4152	night	22	6	12.00	2026-05-18 14:48:17.082209+00
4153	morning	6	14	10.00	2026-05-18 14:48:22.813078+00
4154	evening	14	22	15.00	2026-05-18 14:48:22.813078+00
4155	night	22	6	12.00	2026-05-18 14:48:22.813078+00
4156	morning	6	14	10.00	2026-05-18 14:48:23.030714+00
4157	evening	14	22	15.00	2026-05-18 14:48:23.030714+00
4158	night	22	6	12.00	2026-05-18 14:48:23.030714+00
4161	morning	6	14	10.00	2026-05-18 15:15:29.225168+00
4162	evening	14	22	15.00	2026-05-18 15:15:29.225168+00
4163	night	22	6	12.00	2026-05-18 15:15:29.225168+00
4159	morning	6	14	10.00	2026-05-18 15:15:29.224335+00
4164	evening	14	22	15.00	2026-05-18 15:15:29.224335+00
4165	night	22	6	12.00	2026-05-18 15:15:29.224335+00
4160	morning	6	14	10.00	2026-05-18 15:15:29.216258+00
4166	evening	14	22	15.00	2026-05-18 15:15:29.216258+00
4167	night	22	6	12.00	2026-05-18 15:15:29.216258+00
4168	morning	6	14	10.00	2026-05-18 15:15:29.262291+00
4169	evening	14	22	15.00	2026-05-18 15:15:29.262291+00
4170	night	22	6	12.00	2026-05-18 15:15:29.262291+00
4171	morning	6	14	10.00	2026-05-18 15:15:29.598713+00
4172	evening	14	22	15.00	2026-05-18 15:15:29.598713+00
4173	night	22	6	12.00	2026-05-18 15:15:29.598713+00
4174	morning	6	14	10.00	2026-05-18 15:15:29.604131+00
4175	evening	14	22	15.00	2026-05-18 15:15:29.604131+00
4176	night	22	6	12.00	2026-05-18 15:15:29.604131+00
4177	morning	6	14	10.00	2026-05-18 15:15:37.51895+00
4178	evening	14	22	15.00	2026-05-18 15:15:37.51895+00
4179	night	22	6	12.00	2026-05-18 15:15:37.51895+00
4180	morning	6	14	10.00	2026-05-18 15:26:42.62723+00
4181	evening	14	22	15.00	2026-05-18 15:26:42.62723+00
4182	night	22	6	12.00	2026-05-18 15:26:42.62723+00
4184	morning	6	14	10.00	2026-05-18 16:42:46.249109+00
4185	evening	14	22	15.00	2026-05-18 16:42:46.249109+00
4186	night	22	6	12.00	2026-05-18 16:42:46.249109+00
4183	morning	6	14	10.00	2026-05-18 16:42:46.249653+00
4187	evening	14	22	15.00	2026-05-18 16:42:46.249653+00
4188	night	22	6	12.00	2026-05-18 16:42:46.249653+00
4189	morning	6	14	10.00	2026-05-18 16:43:14.035932+00
4190	evening	14	22	15.00	2026-05-18 16:43:14.035932+00
4191	night	22	6	12.00	2026-05-18 16:43:14.035932+00
4192	morning	6	14	10.00	2026-05-18 16:44:02.186638+00
4193	evening	14	22	15.00	2026-05-18 16:44:02.186638+00
4194	night	22	6	12.00	2026-05-18 16:44:02.186638+00
4195	morning	6	14	10.00	2026-05-18 16:44:03.651789+00
4196	evening	14	22	15.00	2026-05-18 16:44:03.651789+00
4197	night	22	6	12.00	2026-05-18 16:44:03.651789+00
4198	morning	6	14	10.00	2026-05-18 16:44:54.360788+00
4199	evening	14	22	15.00	2026-05-18 16:44:54.360788+00
4200	night	22	6	12.00	2026-05-18 16:44:54.360788+00
4201	morning	6	14	10.00	2026-05-18 16:46:05.989353+00
4202	evening	14	22	15.00	2026-05-18 16:46:05.989353+00
4203	night	22	6	12.00	2026-05-18 16:46:05.989353+00
4204	morning	6	14	10.00	2026-05-18 16:54:50.303244+00
4205	evening	14	22	15.00	2026-05-18 16:54:50.303244+00
4206	night	22	6	12.00	2026-05-18 16:54:50.303244+00
4207	morning	6	14	10.00	2026-05-18 16:54:59.069477+00
4208	evening	14	22	15.00	2026-05-18 16:54:59.069477+00
4209	night	22	6	12.00	2026-05-18 16:54:59.069477+00
4210	morning	6	14	10.00	2026-05-18 16:54:59.094697+00
4211	evening	14	22	15.00	2026-05-18 16:54:59.094697+00
4212	night	22	6	12.00	2026-05-18 16:54:59.094697+00
4213	morning	6	14	10.00	2026-05-18 17:38:41.83357+00
4214	evening	14	22	15.00	2026-05-18 17:38:41.83357+00
4215	night	22	6	12.00	2026-05-18 17:38:41.83357+00
4216	morning	6	14	10.00	2026-05-18 17:38:53.593504+00
4217	evening	14	22	15.00	2026-05-18 17:38:53.593504+00
4218	night	22	6	12.00	2026-05-18 17:38:53.593504+00
4219	morning	6	14	10.00	2026-05-18 17:38:53.603316+00
4220	evening	14	22	15.00	2026-05-18 17:38:53.603316+00
4221	night	22	6	12.00	2026-05-18 17:38:53.603316+00
4222	morning	6	14	10.00	2026-05-18 17:41:23.200078+00
4223	evening	14	22	15.00	2026-05-18 17:41:23.200078+00
4224	night	22	6	12.00	2026-05-18 17:41:23.200078+00
4225	morning	6	14	10.00	2026-05-18 17:41:23.208284+00
4226	evening	14	22	15.00	2026-05-18 17:41:23.208284+00
4227	night	22	6	12.00	2026-05-18 17:41:23.208284+00
4228	morning	6	14	10.00	2026-05-18 17:47:44.049208+00
4229	evening	14	22	15.00	2026-05-18 17:47:44.049208+00
4230	night	22	6	12.00	2026-05-18 17:47:44.049208+00
4231	morning	6	14	10.00	2026-05-18 17:47:44.098686+00
4232	evening	14	22	15.00	2026-05-18 17:47:44.098686+00
4233	night	22	6	12.00	2026-05-18 17:47:44.098686+00
4234	morning	6	14	10.00	2026-05-18 21:32:05.105146+00
4235	evening	14	22	15.00	2026-05-18 21:32:05.105146+00
4236	night	22	6	12.00	2026-05-18 21:32:05.105146+00
4238	morning	6	14	10.00	2026-05-18 22:46:41.91916+00
4239	evening	14	22	15.00	2026-05-18 22:46:41.91916+00
4240	night	22	6	12.00	2026-05-18 22:46:41.91916+00
4237	morning	6	14	10.00	2026-05-18 22:46:41.914832+00
4241	evening	14	22	15.00	2026-05-18 22:46:41.914832+00
4242	night	22	6	12.00	2026-05-18 22:46:41.914832+00
4243	morning	6	14	10.00	2026-05-18 22:46:44.865513+00
4244	evening	14	22	15.00	2026-05-18 22:46:44.865513+00
4245	night	22	6	12.00	2026-05-18 22:46:44.865513+00
4246	morning	6	14	10.00	2026-05-18 22:46:44.972671+00
4247	evening	14	22	15.00	2026-05-18 22:46:44.972671+00
4248	night	22	6	12.00	2026-05-18 22:46:44.972671+00
4249	morning	6	14	10.00	2026-05-18 22:46:45.037866+00
4250	evening	14	22	15.00	2026-05-18 22:46:45.037866+00
4251	night	22	6	12.00	2026-05-18 22:46:45.037866+00
4252	morning	6	14	10.00	2026-05-18 22:46:45.151449+00
4253	evening	14	22	15.00	2026-05-18 22:46:45.151449+00
4254	night	22	6	12.00	2026-05-18 22:46:45.151449+00
4255	morning	6	14	10.00	2026-05-18 23:00:05.082792+00
4256	evening	14	22	15.00	2026-05-18 23:00:05.082792+00
4257	night	22	6	12.00	2026-05-18 23:00:05.082792+00
4258	morning	6	14	10.00	2026-05-18 23:16:58.47963+00
4259	evening	14	22	15.00	2026-05-18 23:16:58.47963+00
4260	night	22	6	12.00	2026-05-18 23:16:58.47963+00
4261	morning	6	14	10.00	2026-05-18 23:16:58.838436+00
4262	evening	14	22	15.00	2026-05-18 23:16:58.838436+00
4263	night	22	6	12.00	2026-05-18 23:16:58.838436+00
4264	morning	6	14	10.00	2026-05-18 23:17:24.582186+00
4265	evening	14	22	15.00	2026-05-18 23:17:24.582186+00
4266	night	22	6	12.00	2026-05-18 23:17:24.582186+00
4267	morning	6	14	10.00	2026-05-18 23:17:25.839+00
4268	evening	14	22	15.00	2026-05-18 23:17:25.839+00
4269	night	22	6	12.00	2026-05-18 23:17:25.839+00
4270	morning	6	14	10.00	2026-05-18 23:17:27.424188+00
4271	evening	14	22	15.00	2026-05-18 23:17:27.424188+00
4272	night	22	6	12.00	2026-05-18 23:17:27.424188+00
4273	morning	6	14	10.00	2026-05-18 23:17:27.484865+00
4274	evening	14	22	15.00	2026-05-18 23:17:27.484865+00
4275	night	22	6	12.00	2026-05-18 23:17:27.484865+00
4276	morning	6	14	10.00	2026-05-18 23:17:27.514807+00
4277	evening	14	22	15.00	2026-05-18 23:17:27.514807+00
4278	night	22	6	12.00	2026-05-18 23:17:27.514807+00
4279	morning	6	14	10.00	2026-05-18 23:18:17.480213+00
4280	evening	14	22	15.00	2026-05-18 23:18:17.480213+00
4281	night	22	6	12.00	2026-05-18 23:18:17.480213+00
4282	morning	6	14	10.00	2026-05-18 23:18:18.512095+00
4283	evening	14	22	15.00	2026-05-18 23:18:18.512095+00
4284	night	22	6	12.00	2026-05-18 23:18:18.512095+00
4285	morning	6	14	10.00	2026-05-18 23:18:23.284793+00
4286	evening	14	22	15.00	2026-05-18 23:18:23.284793+00
4287	night	22	6	12.00	2026-05-18 23:18:23.284793+00
4288	morning	6	14	10.00	2026-05-18 23:18:23.332925+00
4289	evening	14	22	15.00	2026-05-18 23:18:23.332925+00
4290	night	22	6	12.00	2026-05-18 23:18:23.332925+00
4291	morning	6	14	10.00	2026-05-18 23:18:23.35915+00
4292	evening	14	22	15.00	2026-05-18 23:18:23.35915+00
4293	night	22	6	12.00	2026-05-18 23:18:23.35915+00
4294	morning	6	14	10.00	2026-05-18 23:18:23.378371+00
4295	evening	14	22	15.00	2026-05-18 23:18:23.378371+00
4296	night	22	6	12.00	2026-05-18 23:18:23.378371+00
4297	morning	6	14	10.00	2026-05-18 23:18:23.43688+00
4298	evening	14	22	15.00	2026-05-18 23:18:23.43688+00
4299	night	22	6	12.00	2026-05-18 23:18:23.43688+00
4300	morning	6	14	10.00	2026-05-18 23:18:26.191116+00
4301	evening	14	22	15.00	2026-05-18 23:18:26.191116+00
4302	night	22	6	12.00	2026-05-18 23:18:26.191116+00
4303	morning	6	14	10.00	2026-05-18 23:18:31.044155+00
4304	evening	14	22	15.00	2026-05-18 23:18:31.044155+00
4305	night	22	6	12.00	2026-05-18 23:18:31.044155+00
4306	morning	6	14	10.00	2026-05-18 23:33:07.152474+00
4307	evening	14	22	15.00	2026-05-18 23:33:07.152474+00
4308	night	22	6	12.00	2026-05-18 23:33:07.152474+00
4309	morning	6	14	10.00	2026-05-18 23:33:36.867272+00
4310	evening	14	22	15.00	2026-05-18 23:33:36.867272+00
4311	night	22	6	12.00	2026-05-18 23:33:36.867272+00
4312	morning	6	14	10.00	2026-05-18 23:33:36.876866+00
4313	evening	14	22	15.00	2026-05-18 23:33:36.876866+00
4314	night	22	6	12.00	2026-05-18 23:33:36.876866+00
4315	morning	6	14	10.00	2026-05-18 23:33:49.262744+00
4316	evening	14	22	15.00	2026-05-18 23:33:49.262744+00
4317	night	22	6	12.00	2026-05-18 23:33:49.262744+00
4318	morning	6	14	10.00	2026-05-18 23:33:52.55644+00
4319	evening	14	22	15.00	2026-05-18 23:33:52.55644+00
4320	night	22	6	12.00	2026-05-18 23:33:52.55644+00
4321	morning	6	14	10.00	2026-05-18 23:33:52.558524+00
4322	evening	14	22	15.00	2026-05-18 23:33:52.558524+00
4323	night	22	6	12.00	2026-05-18 23:33:52.558524+00
4324	morning	6	14	10.00	2026-05-18 23:44:34.914415+00
4325	evening	14	22	15.00	2026-05-18 23:44:34.914415+00
4326	night	22	6	12.00	2026-05-18 23:44:34.914415+00
4327	morning	6	14	10.00	2026-05-18 23:44:34.928238+00
4328	evening	14	22	15.00	2026-05-18 23:44:34.928238+00
4329	night	22	6	12.00	2026-05-18 23:44:34.928238+00
4330	morning	6	14	10.00	2026-05-18 23:51:24.715165+00
4332	evening	14	22	15.00	2026-05-18 23:51:24.715165+00
4333	night	22	6	12.00	2026-05-18 23:51:24.715165+00
4331	morning	6	14	10.00	2026-05-18 23:51:24.732471+00
4334	evening	14	22	15.00	2026-05-18 23:51:24.732471+00
4335	night	22	6	12.00	2026-05-18 23:51:24.732471+00
4336	morning	6	14	10.00	2026-05-18 23:52:16.601788+00
4337	evening	14	22	15.00	2026-05-18 23:52:16.601788+00
4338	night	22	6	12.00	2026-05-18 23:52:16.601788+00
4339	morning	6	14	10.00	2026-05-18 23:52:16.643383+00
4340	evening	14	22	15.00	2026-05-18 23:52:16.643383+00
4341	night	22	6	12.00	2026-05-18 23:52:16.643383+00
4342	morning	6	14	10.00	2026-05-18 23:54:13.20923+00
4343	evening	14	22	15.00	2026-05-18 23:54:13.20923+00
4344	night	22	6	12.00	2026-05-18 23:54:13.20923+00
4345	morning	6	14	10.00	2026-05-18 23:54:52.960965+00
4346	evening	14	22	15.00	2026-05-18 23:54:52.960965+00
4347	night	22	6	12.00	2026-05-18 23:54:52.960965+00
4348	morning	6	14	10.00	2026-05-19 00:03:03.331107+00
4349	evening	14	22	15.00	2026-05-19 00:03:03.331107+00
4350	night	22	6	12.00	2026-05-19 00:03:03.331107+00
4351	morning	6	14	10.00	2026-05-19 00:03:18.796248+00
4352	evening	14	22	15.00	2026-05-19 00:03:18.796248+00
4353	night	22	6	12.00	2026-05-19 00:03:18.796248+00
4354	morning	6	14	10.00	2026-05-19 00:03:18.910884+00
4355	evening	14	22	15.00	2026-05-19 00:03:18.910884+00
4356	night	22	6	12.00	2026-05-19 00:03:18.910884+00
4357	morning	6	14	10.00	2026-05-19 00:05:18.885102+00
4358	evening	14	22	15.00	2026-05-19 00:05:18.885102+00
4359	night	22	6	12.00	2026-05-19 00:05:18.885102+00
4360	morning	6	14	10.00	2026-05-19 00:05:19.995169+00
4361	evening	14	22	15.00	2026-05-19 00:05:19.995169+00
4362	night	22	6	12.00	2026-05-19 00:05:19.995169+00
4363	morning	6	14	10.00	2026-05-19 00:08:28.403534+00
4364	evening	14	22	15.00	2026-05-19 00:08:28.403534+00
4365	night	22	6	12.00	2026-05-19 00:08:28.403534+00
4366	morning	6	14	10.00	2026-05-19 00:16:23.041349+00
4367	evening	14	22	15.00	2026-05-19 00:16:23.041349+00
4368	night	22	6	12.00	2026-05-19 00:16:23.041349+00
4369	morning	6	14	10.00	2026-05-19 00:16:27.514917+00
4370	evening	14	22	15.00	2026-05-19 00:16:27.514917+00
4371	night	22	6	12.00	2026-05-19 00:16:27.514917+00
4372	morning	6	14	10.00	2026-05-19 00:16:27.659088+00
4373	evening	14	22	15.00	2026-05-19 00:16:27.659088+00
4374	night	22	6	12.00	2026-05-19 00:16:27.659088+00
4375	morning	6	14	10.00	2026-05-19 00:16:27.775022+00
4376	evening	14	22	15.00	2026-05-19 00:16:27.775022+00
4377	night	22	6	12.00	2026-05-19 00:16:27.775022+00
4378	morning	6	14	10.00	2026-05-19 00:16:33.654639+00
4379	evening	14	22	15.00	2026-05-19 00:16:33.654639+00
4380	night	22	6	12.00	2026-05-19 00:16:33.654639+00
4381	morning	6	14	10.00	2026-05-19 00:16:33.842943+00
4382	evening	14	22	15.00	2026-05-19 00:16:33.842943+00
4383	night	22	6	12.00	2026-05-19 00:16:33.842943+00
4384	morning	6	14	10.00	2026-05-19 00:16:33.897384+00
4385	evening	14	22	15.00	2026-05-19 00:16:33.897384+00
4386	night	22	6	12.00	2026-05-19 00:16:33.897384+00
4387	morning	6	14	10.00	2026-05-19 08:46:16.877678+00
4388	evening	14	22	15.00	2026-05-19 08:46:16.877678+00
4389	night	22	6	12.00	2026-05-19 08:46:16.877678+00
4390	morning	6	14	10.00	2026-05-19 08:46:17.244567+00
4391	evening	14	22	15.00	2026-05-19 08:46:17.244567+00
4392	night	22	6	12.00	2026-05-19 08:46:17.244567+00
4393	morning	6	14	10.00	2026-05-19 08:46:33.384262+00
4394	evening	14	22	15.00	2026-05-19 08:46:33.384262+00
4395	night	22	6	12.00	2026-05-19 08:46:33.384262+00
4396	morning	6	14	10.00	2026-05-19 08:46:33.568711+00
4397	evening	14	22	15.00	2026-05-19 08:46:33.568711+00
4398	night	22	6	12.00	2026-05-19 08:46:33.568711+00
4399	morning	6	14	10.00	2026-05-19 08:46:33.579292+00
4400	evening	14	22	15.00	2026-05-19 08:46:33.579292+00
4401	night	22	6	12.00	2026-05-19 08:46:33.579292+00
4402	morning	6	14	10.00	2026-05-19 08:46:33.670352+00
4403	evening	14	22	15.00	2026-05-19 08:46:33.670352+00
4404	night	22	6	12.00	2026-05-19 08:46:33.670352+00
4405	morning	6	14	10.00	2026-05-19 11:22:20.835118+00
4406	evening	14	22	15.00	2026-05-19 11:22:20.835118+00
4407	night	22	6	12.00	2026-05-19 11:22:20.835118+00
4408	morning	6	14	10.00	2026-05-19 11:23:02.485411+00
4409	evening	14	22	15.00	2026-05-19 11:23:02.485411+00
4410	night	22	6	12.00	2026-05-19 11:23:02.485411+00
4411	morning	6	14	10.00	2026-05-19 11:23:02.613596+00
4412	evening	14	22	15.00	2026-05-19 11:23:02.613596+00
4413	night	22	6	12.00	2026-05-19 11:23:02.613596+00
4414	morning	6	14	10.00	2026-05-19 11:23:11.270893+00
4415	evening	14	22	15.00	2026-05-19 11:23:11.270893+00
4416	night	22	6	12.00	2026-05-19 11:23:11.270893+00
4417	morning	6	14	10.00	2026-05-19 11:23:11.344794+00
4418	evening	14	22	15.00	2026-05-19 11:23:11.344794+00
4419	night	22	6	12.00	2026-05-19 11:23:11.344794+00
4420	morning	6	14	10.00	2026-05-19 11:53:49.25107+00
4421	evening	14	22	15.00	2026-05-19 11:53:49.25107+00
4422	night	22	6	12.00	2026-05-19 11:53:49.25107+00
4423	morning	6	14	10.00	2026-05-19 11:53:49.613649+00
4424	evening	14	22	15.00	2026-05-19 11:53:49.613649+00
4425	night	22	6	12.00	2026-05-19 11:53:49.613649+00
4426	morning	6	14	10.00	2026-05-19 11:55:05.681031+00
4427	evening	14	22	15.00	2026-05-19 11:55:05.681031+00
4428	night	22	6	12.00	2026-05-19 11:55:05.681031+00
4429	morning	6	14	10.00	2026-05-19 11:58:00.443174+00
4430	evening	14	22	15.00	2026-05-19 11:58:00.443174+00
4431	night	22	6	12.00	2026-05-19 11:58:00.443174+00
4432	morning	6	14	10.00	2026-05-19 11:58:01.388368+00
4433	evening	14	22	15.00	2026-05-19 11:58:01.388368+00
4434	night	22	6	12.00	2026-05-19 11:58:01.388368+00
4435	morning	6	14	10.00	2026-05-19 12:35:10.406689+00
4436	evening	14	22	15.00	2026-05-19 12:35:10.406689+00
4437	night	22	6	12.00	2026-05-19 12:35:10.406689+00
4438	morning	6	14	10.00	2026-05-19 12:35:11.221487+00
4439	evening	14	22	15.00	2026-05-19 12:35:11.221487+00
4440	night	22	6	12.00	2026-05-19 12:35:11.221487+00
4441	morning	6	14	10.00	2026-05-19 12:35:37.537988+00
4442	evening	14	22	15.00	2026-05-19 12:35:37.537988+00
4443	night	22	6	12.00	2026-05-19 12:35:37.537988+00
4444	morning	6	14	10.00	2026-05-19 12:35:37.562372+00
4445	evening	14	22	15.00	2026-05-19 12:35:37.562372+00
4446	night	22	6	12.00	2026-05-19 12:35:37.562372+00
4447	morning	6	14	10.00	2026-05-19 12:35:42.966573+00
4448	evening	14	22	15.00	2026-05-19 12:35:42.966573+00
4449	night	22	6	12.00	2026-05-19 12:35:42.966573+00
4450	morning	6	14	10.00	2026-05-19 12:35:43.975592+00
4451	evening	14	22	15.00	2026-05-19 12:35:43.975592+00
4452	night	22	6	12.00	2026-05-19 12:35:43.975592+00
4453	morning	6	14	10.00	2026-05-19 12:35:44.017248+00
4454	evening	14	22	15.00	2026-05-19 12:35:44.017248+00
4455	night	22	6	12.00	2026-05-19 12:35:44.017248+00
4456	morning	6	14	10.00	2026-05-19 12:35:44.100932+00
4457	evening	14	22	15.00	2026-05-19 12:35:44.100932+00
4458	night	22	6	12.00	2026-05-19 12:35:44.100932+00
4459	morning	6	14	10.00	2026-05-19 12:43:49.485187+00
4460	evening	14	22	15.00	2026-05-19 12:43:49.485187+00
4461	night	22	6	12.00	2026-05-19 12:43:49.485187+00
4462	morning	6	14	10.00	2026-05-19 12:43:50.729737+00
4463	evening	14	22	15.00	2026-05-19 12:43:50.729737+00
4464	night	22	6	12.00	2026-05-19 12:43:50.729737+00
4465	morning	6	14	10.00	2026-05-19 12:44:43.706039+00
4466	evening	14	22	15.00	2026-05-19 12:44:43.706039+00
4467	night	22	6	12.00	2026-05-19 12:44:43.706039+00
4468	morning	6	14	10.00	2026-05-19 12:45:05.112213+00
4469	evening	14	22	15.00	2026-05-19 12:45:05.112213+00
4470	night	22	6	12.00	2026-05-19 12:45:05.112213+00
4471	morning	6	14	10.00	2026-05-19 12:45:05.166868+00
4472	evening	14	22	15.00	2026-05-19 12:45:05.166868+00
4473	night	22	6	12.00	2026-05-19 12:45:05.166868+00
4474	morning	6	14	10.00	2026-05-19 12:47:16.52723+00
4475	evening	14	22	15.00	2026-05-19 12:47:16.52723+00
4476	night	22	6	12.00	2026-05-19 12:47:16.52723+00
4477	morning	6	14	10.00	2026-05-19 12:58:51.779499+00
4478	evening	14	22	15.00	2026-05-19 12:58:51.779499+00
4479	night	22	6	12.00	2026-05-19 12:58:51.779499+00
4480	morning	6	14	10.00	2026-05-19 12:59:39.55078+00
4481	evening	14	22	15.00	2026-05-19 12:59:39.55078+00
4482	night	22	6	12.00	2026-05-19 12:59:39.55078+00
4483	morning	6	14	10.00	2026-05-19 12:59:47.474055+00
4484	evening	14	22	15.00	2026-05-19 12:59:47.474055+00
4485	night	22	6	12.00	2026-05-19 12:59:47.474055+00
4486	morning	6	14	10.00	2026-05-19 12:59:55.379358+00
4487	evening	14	22	15.00	2026-05-19 12:59:55.379358+00
4488	night	22	6	12.00	2026-05-19 12:59:55.379358+00
4489	morning	6	14	10.00	2026-05-19 12:59:55.448355+00
4490	evening	14	22	15.00	2026-05-19 12:59:55.448355+00
4491	night	22	6	12.00	2026-05-19 12:59:55.448355+00
4492	morning	6	14	10.00	2026-05-19 12:59:55.526723+00
4493	evening	14	22	15.00	2026-05-19 12:59:55.526723+00
4494	night	22	6	12.00	2026-05-19 12:59:55.526723+00
4495	morning	6	14	10.00	2026-05-19 13:30:58.985284+00
4496	evening	14	22	15.00	2026-05-19 13:30:58.985284+00
4497	night	22	6	12.00	2026-05-19 13:30:58.985284+00
4498	morning	6	14	10.00	2026-05-19 13:30:59.616918+00
4499	evening	14	22	15.00	2026-05-19 13:30:59.616918+00
4500	night	22	6	12.00	2026-05-19 13:30:59.616918+00
4501	morning	6	14	10.00	2026-05-19 13:31:16.774328+00
4502	evening	14	22	15.00	2026-05-19 13:31:16.774328+00
4503	night	22	6	12.00	2026-05-19 13:31:16.774328+00
4504	morning	6	14	10.00	2026-05-19 13:31:24.923508+00
4505	evening	14	22	15.00	2026-05-19 13:31:24.923508+00
4506	night	22	6	12.00	2026-05-19 13:31:24.923508+00
4507	morning	6	14	10.00	2026-05-19 13:31:26.205461+00
4508	evening	14	22	15.00	2026-05-19 13:31:26.205461+00
4509	night	22	6	12.00	2026-05-19 13:31:26.205461+00
4510	morning	6	14	10.00	2026-05-19 13:40:19.701398+00
4511	evening	14	22	15.00	2026-05-19 13:40:19.701398+00
4512	night	22	6	12.00	2026-05-19 13:40:19.701398+00
4513	morning	6	14	10.00	2026-05-19 13:40:20.181327+00
4514	evening	14	22	15.00	2026-05-19 13:40:20.181327+00
4515	night	22	6	12.00	2026-05-19 13:40:20.181327+00
4516	morning	6	14	10.00	2026-05-19 13:41:02.747199+00
4517	evening	14	22	15.00	2026-05-19 13:41:02.747199+00
4518	night	22	6	12.00	2026-05-19 13:41:02.747199+00
4519	morning	6	14	10.00	2026-05-19 13:41:02.769067+00
4520	evening	14	22	15.00	2026-05-19 13:41:02.769067+00
4521	night	22	6	12.00	2026-05-19 13:41:02.769067+00
4522	morning	6	14	10.00	2026-05-19 13:41:02.851496+00
4523	evening	14	22	15.00	2026-05-19 13:41:02.851496+00
4524	night	22	6	12.00	2026-05-19 13:41:02.851496+00
4525	morning	6	14	10.00	2026-05-19 13:50:45.989133+00
4526	evening	14	22	15.00	2026-05-19 13:50:45.989133+00
4527	night	22	6	12.00	2026-05-19 13:50:45.989133+00
4528	morning	6	14	10.00	2026-05-19 13:50:46.53062+00
4529	evening	14	22	15.00	2026-05-19 13:50:46.53062+00
4530	night	22	6	12.00	2026-05-19 13:50:46.53062+00
4531	morning	6	14	10.00	2026-05-19 13:51:14.997622+00
4532	evening	14	22	15.00	2026-05-19 13:51:14.997622+00
4533	night	22	6	12.00	2026-05-19 13:51:14.997622+00
4534	morning	6	14	10.00	2026-05-19 13:51:15.459421+00
4535	evening	14	22	15.00	2026-05-19 13:51:15.459421+00
4536	night	22	6	12.00	2026-05-19 13:51:15.459421+00
4537	morning	6	14	10.00	2026-05-19 13:51:32.096888+00
4538	evening	14	22	15.00	2026-05-19 13:51:32.096888+00
4539	night	22	6	12.00	2026-05-19 13:51:32.096888+00
4540	morning	6	14	10.00	2026-05-19 13:57:50.226177+00
4541	evening	14	22	15.00	2026-05-19 13:57:50.226177+00
4542	night	22	6	12.00	2026-05-19 13:57:50.226177+00
4543	morning	6	14	10.00	2026-05-19 13:58:00.536142+00
4544	evening	14	22	15.00	2026-05-19 13:58:00.536142+00
4545	night	22	6	12.00	2026-05-19 13:58:00.536142+00
4546	morning	6	14	10.00	2026-05-19 13:59:50.617351+00
4547	evening	14	22	15.00	2026-05-19 13:59:50.617351+00
4548	night	22	6	12.00	2026-05-19 13:59:50.617351+00
4549	morning	6	14	10.00	2026-05-19 13:59:50.649891+00
4550	evening	14	22	15.00	2026-05-19 13:59:50.649891+00
4551	night	22	6	12.00	2026-05-19 13:59:50.649891+00
4552	morning	6	14	10.00	2026-05-19 13:59:50.729536+00
4553	evening	14	22	15.00	2026-05-19 13:59:50.729536+00
4554	night	22	6	12.00	2026-05-19 13:59:50.729536+00
4555	morning	6	14	10.00	2026-05-19 13:59:50.905163+00
4556	evening	14	22	15.00	2026-05-19 13:59:50.905163+00
4557	night	22	6	12.00	2026-05-19 13:59:50.905163+00
4558	morning	6	14	10.00	2026-05-19 15:36:36.946476+00
4560	evening	14	22	15.00	2026-05-19 15:36:36.946476+00
4561	night	22	6	12.00	2026-05-19 15:36:36.946476+00
4559	morning	6	14	10.00	2026-05-19 15:36:36.943951+00
4562	evening	14	22	15.00	2026-05-19 15:36:36.943951+00
4563	night	22	6	12.00	2026-05-19 15:36:36.943951+00
4564	morning	6	14	10.00	2026-05-19 15:36:57.067527+00
4565	evening	14	22	15.00	2026-05-19 15:36:57.067527+00
4566	night	22	6	12.00	2026-05-19 15:36:57.067527+00
4567	morning	6	14	10.00	2026-05-19 15:36:57.169593+00
4568	evening	14	22	15.00	2026-05-19 15:36:57.169593+00
4569	night	22	6	12.00	2026-05-19 15:36:57.169593+00
4570	morning	6	14	10.00	2026-05-19 21:10:28.627636+00
4571	evening	14	22	15.00	2026-05-19 21:10:28.627636+00
4572	night	22	6	12.00	2026-05-19 21:10:28.627636+00
4573	morning	6	14	10.00	2026-05-19 21:10:31.566797+00
4574	evening	14	22	15.00	2026-05-19 21:10:31.566797+00
4575	night	22	6	12.00	2026-05-19 21:10:31.566797+00
4576	morning	6	14	10.00	2026-05-19 21:10:31.57789+00
4577	evening	14	22	15.00	2026-05-19 21:10:31.57789+00
4578	night	22	6	12.00	2026-05-19 21:10:31.57789+00
4579	morning	6	14	10.00	2026-05-19 21:10:31.650804+00
4580	evening	14	22	15.00	2026-05-19 21:10:31.650804+00
4581	night	22	6	12.00	2026-05-19 21:10:31.650804+00
4582	morning	6	14	10.00	2026-05-19 21:10:31.692029+00
4583	evening	14	22	15.00	2026-05-19 21:10:31.692029+00
4584	night	22	6	12.00	2026-05-19 21:10:31.692029+00
4585	morning	6	14	10.00	2026-05-19 21:10:31.883045+00
4586	evening	14	22	15.00	2026-05-19 21:10:31.883045+00
4587	night	22	6	12.00	2026-05-19 21:10:31.883045+00
4588	morning	6	14	10.00	2026-05-19 21:37:58.276916+00
4589	evening	14	22	15.00	2026-05-19 21:37:58.276916+00
4590	night	22	6	12.00	2026-05-19 21:37:58.276916+00
4591	morning	6	14	10.00	2026-05-19 21:38:14.085111+00
4592	evening	14	22	15.00	2026-05-19 21:38:14.085111+00
4593	night	22	6	12.00	2026-05-19 21:38:14.085111+00
4594	morning	6	14	10.00	2026-05-19 21:38:14.181184+00
4595	evening	14	22	15.00	2026-05-19 21:38:14.181184+00
4596	night	22	6	12.00	2026-05-19 21:38:14.181184+00
4597	morning	6	14	10.00	2026-05-19 21:38:14.266051+00
4598	evening	14	22	15.00	2026-05-19 21:38:14.266051+00
4599	night	22	6	12.00	2026-05-19 21:38:14.266051+00
4600	morning	6	14	10.00	2026-05-19 22:10:29.854104+00
4601	evening	14	22	15.00	2026-05-19 22:10:29.854104+00
4602	night	22	6	12.00	2026-05-19 22:10:29.854104+00
4603	morning	6	14	10.00	2026-05-19 22:37:59.835207+00
4604	evening	14	22	15.00	2026-05-19 22:37:59.835207+00
4605	night	22	6	12.00	2026-05-19 22:37:59.835207+00
4606	morning	6	14	10.00	2026-05-19 22:38:00.481085+00
4607	evening	14	22	15.00	2026-05-19 22:38:00.481085+00
4608	night	22	6	12.00	2026-05-19 22:38:00.481085+00
4610	morning	6	14	10.00	2026-05-19 22:46:45.468499+00
4611	evening	14	22	15.00	2026-05-19 22:46:45.468499+00
4612	night	22	6	12.00	2026-05-19 22:46:45.468499+00
4609	morning	6	14	10.00	2026-05-19 22:46:45.47431+00
4613	evening	14	22	15.00	2026-05-19 22:46:45.47431+00
4614	night	22	6	12.00	2026-05-19 22:46:45.47431+00
4615	morning	6	14	10.00	2026-05-19 22:46:47.892879+00
4616	evening	14	22	15.00	2026-05-19 22:46:47.892879+00
4617	night	22	6	12.00	2026-05-19 22:46:47.892879+00
4618	morning	6	14	10.00	2026-05-19 22:46:47.902971+00
4619	evening	14	22	15.00	2026-05-19 22:46:47.902971+00
4620	night	22	6	12.00	2026-05-19 22:46:47.902971+00
4621	morning	6	14	10.00	2026-05-19 22:46:47.96379+00
4622	evening	14	22	15.00	2026-05-19 22:46:47.96379+00
4623	night	22	6	12.00	2026-05-19 22:46:47.96379+00
4624	morning	6	14	10.00	2026-05-19 22:46:48.247836+00
4625	evening	14	22	15.00	2026-05-19 22:46:48.247836+00
4626	night	22	6	12.00	2026-05-19 22:46:48.247836+00
4627	morning	6	14	10.00	2026-05-19 23:04:40.972466+00
4628	evening	14	22	15.00	2026-05-19 23:04:40.972466+00
4629	night	22	6	12.00	2026-05-19 23:04:40.972466+00
4630	morning	6	14	10.00	2026-05-19 23:04:41.310672+00
4631	evening	14	22	15.00	2026-05-19 23:04:41.310672+00
4632	night	22	6	12.00	2026-05-19 23:04:41.310672+00
4633	morning	6	14	10.00	2026-05-19 23:04:48.927507+00
4634	evening	14	22	15.00	2026-05-19 23:04:48.927507+00
4635	night	22	6	12.00	2026-05-19 23:04:48.927507+00
4636	morning	6	14	10.00	2026-05-19 23:05:13.246892+00
4637	evening	14	22	15.00	2026-05-19 23:05:13.246892+00
4638	night	22	6	12.00	2026-05-19 23:05:13.246892+00
4639	morning	6	14	10.00	2026-05-19 23:06:13.244095+00
4640	evening	14	22	15.00	2026-05-19 23:06:13.244095+00
4641	night	22	6	12.00	2026-05-19 23:06:13.244095+00
4642	morning	6	14	10.00	2026-05-19 23:06:13.267746+00
4643	evening	14	22	15.00	2026-05-19 23:06:13.267746+00
4644	night	22	6	12.00	2026-05-19 23:06:13.267746+00
4645	morning	6	14	10.00	2026-05-20 00:34:33.968464+00
4646	evening	14	22	15.00	2026-05-20 00:34:33.968464+00
4647	night	22	6	12.00	2026-05-20 00:34:33.968464+00
4648	morning	6	14	10.00	2026-05-20 00:34:40.375685+00
4649	evening	14	22	15.00	2026-05-20 00:34:40.375685+00
4650	night	22	6	12.00	2026-05-20 00:34:40.375685+00
4651	morning	6	14	10.00	2026-05-20 00:34:40.467878+00
4652	evening	14	22	15.00	2026-05-20 00:34:40.467878+00
4653	night	22	6	12.00	2026-05-20 00:34:40.467878+00
4654	morning	6	14	10.00	2026-05-20 00:50:24.841989+00
4655	evening	14	22	15.00	2026-05-20 00:50:24.841989+00
4656	night	22	6	12.00	2026-05-20 00:50:24.841989+00
4657	morning	6	14	10.00	2026-05-20 00:50:49.967842+00
4658	evening	14	22	15.00	2026-05-20 00:50:49.967842+00
4659	night	22	6	12.00	2026-05-20 00:50:49.967842+00
4660	morning	6	14	10.00	2026-05-20 00:50:49.984975+00
4661	evening	14	22	15.00	2026-05-20 00:50:49.984975+00
4662	night	22	6	12.00	2026-05-20 00:50:49.984975+00
4663	morning	6	14	10.00	2026-05-20 00:50:50.564673+00
4664	evening	14	22	15.00	2026-05-20 00:50:50.564673+00
4665	night	22	6	12.00	2026-05-20 00:50:50.564673+00
4666	morning	6	14	10.00	2026-05-20 00:50:50.668404+00
4667	evening	14	22	15.00	2026-05-20 00:50:50.668404+00
4668	night	22	6	12.00	2026-05-20 00:50:50.668404+00
4669	morning	6	14	10.00	2026-05-20 00:56:20.9348+00
4670	evening	14	22	15.00	2026-05-20 00:56:20.9348+00
4671	night	22	6	12.00	2026-05-20 00:56:20.9348+00
4672	morning	6	14	10.00	2026-05-20 00:57:13.50956+00
4673	evening	14	22	15.00	2026-05-20 00:57:13.50956+00
4674	night	22	6	12.00	2026-05-20 00:57:13.50956+00
4675	morning	6	14	10.00	2026-05-20 00:57:18.059501+00
4676	evening	14	22	15.00	2026-05-20 00:57:18.059501+00
4677	night	22	6	12.00	2026-05-20 00:57:18.059501+00
4678	morning	6	14	10.00	2026-05-20 00:57:34.511908+00
4679	evening	14	22	15.00	2026-05-20 00:57:34.511908+00
4680	night	22	6	12.00	2026-05-20 00:57:34.511908+00
4681	morning	6	14	10.00	2026-05-20 00:57:35.298884+00
4682	evening	14	22	15.00	2026-05-20 00:57:35.298884+00
4683	night	22	6	12.00	2026-05-20 00:57:35.298884+00
4684	morning	6	14	10.00	2026-05-20 16:37:55.701341+00
4685	evening	14	22	15.00	2026-05-20 16:37:55.701341+00
4686	night	22	6	12.00	2026-05-20 16:37:55.701341+00
4687	morning	6	14	10.00	2026-05-20 23:46:58.519338+00
4688	evening	14	22	15.00	2026-05-20 23:46:58.519338+00
4689	night	22	6	12.00	2026-05-20 23:46:58.519338+00
4690	morning	6	14	10.00	2026-05-20 23:47:09.992479+00
4691	evening	14	22	15.00	2026-05-20 23:47:09.992479+00
4692	night	22	6	12.00	2026-05-20 23:47:09.992479+00
4693	morning	6	14	10.00	2026-05-20 23:47:10.340275+00
4694	evening	14	22	15.00	2026-05-20 23:47:10.340275+00
4695	night	22	6	12.00	2026-05-20 23:47:10.340275+00
4696	morning	6	14	10.00	2026-05-20 23:47:10.371039+00
4697	evening	14	22	15.00	2026-05-20 23:47:10.371039+00
4698	night	22	6	12.00	2026-05-20 23:47:10.371039+00
4699	morning	6	14	10.00	2026-05-21 08:22:22.262599+00
4700	evening	14	22	15.00	2026-05-21 08:22:22.262599+00
4701	night	22	6	12.00	2026-05-21 08:22:22.262599+00
4702	morning	6	14	10.00	2026-05-21 08:58:52.602913+00
4703	evening	14	22	15.00	2026-05-21 08:58:52.602913+00
4704	night	22	6	12.00	2026-05-21 08:58:52.602913+00
4705	morning	6	14	10.00	2026-05-21 08:58:52.78006+00
4706	evening	14	22	15.00	2026-05-21 08:58:52.78006+00
4707	night	22	6	12.00	2026-05-21 08:58:52.78006+00
4708	morning	6	14	10.00	2026-05-21 11:14:53.203805+00
4709	evening	14	22	15.00	2026-05-21 11:14:53.203805+00
4710	night	22	6	12.00	2026-05-21 11:14:53.203805+00
4711	morning	6	14	10.00	2026-05-21 11:15:04.465058+00
4712	evening	14	22	15.00	2026-05-21 11:15:04.465058+00
4713	night	22	6	12.00	2026-05-21 11:15:04.465058+00
4714	morning	6	14	10.00	2026-05-21 11:15:04.518054+00
4715	evening	14	22	15.00	2026-05-21 11:15:04.518054+00
4716	night	22	6	12.00	2026-05-21 11:15:04.518054+00
4717	morning	6	14	10.00	2026-05-21 12:02:32.364052+00
4718	evening	14	22	15.00	2026-05-21 12:02:32.364052+00
4719	night	22	6	12.00	2026-05-21 12:02:32.364052+00
4720	morning	6	14	10.00	2026-05-21 21:16:52.008194+00
4721	evening	14	22	15.00	2026-05-21 21:16:52.008194+00
4722	night	22	6	12.00	2026-05-21 21:16:52.008194+00
4723	morning	6	14	10.00	2026-05-21 21:16:52.514235+00
4724	evening	14	22	15.00	2026-05-21 21:16:52.514235+00
4725	night	22	6	12.00	2026-05-21 21:16:52.514235+00
4726	morning	6	14	10.00	2026-05-21 21:17:22.317215+00
4727	evening	14	22	15.00	2026-05-21 21:17:22.317215+00
4728	night	22	6	12.00	2026-05-21 21:17:22.317215+00
4729	morning	6	14	10.00	2026-05-21 21:17:31.691697+00
4730	evening	14	22	15.00	2026-05-21 21:17:31.691697+00
4731	night	22	6	12.00	2026-05-21 21:17:31.691697+00
4732	morning	6	14	10.00	2026-05-21 21:29:17.425206+00
4733	evening	14	22	15.00	2026-05-21 21:29:17.425206+00
4734	night	22	6	12.00	2026-05-21 21:29:17.425206+00
4735	morning	6	14	10.00	2026-05-21 21:29:38.662069+00
4736	evening	14	22	15.00	2026-05-21 21:29:38.662069+00
4737	night	22	6	12.00	2026-05-21 21:29:38.662069+00
4738	morning	6	14	10.00	2026-05-21 21:29:38.749156+00
4739	evening	14	22	15.00	2026-05-21 21:29:38.749156+00
4740	night	22	6	12.00	2026-05-21 21:29:38.749156+00
4741	morning	6	14	10.00	2026-05-21 21:29:38.749626+00
4742	evening	14	22	15.00	2026-05-21 21:29:38.749626+00
4743	night	22	6	12.00	2026-05-21 21:29:38.749626+00
4744	morning	6	14	10.00	2026-05-21 21:29:38.819508+00
4745	evening	14	22	15.00	2026-05-21 21:29:38.819508+00
4746	night	22	6	12.00	2026-05-21 21:29:38.819508+00
4747	morning	6	14	10.00	2026-05-21 21:29:38.831766+00
4748	evening	14	22	15.00	2026-05-21 21:29:38.831766+00
4749	night	22	6	12.00	2026-05-21 21:29:38.831766+00
4750	morning	6	14	10.00	2026-05-21 21:29:38.833975+00
4751	evening	14	22	15.00	2026-05-21 21:29:38.833975+00
4752	night	22	6	12.00	2026-05-21 21:29:38.833975+00
4753	morning	6	14	10.00	2026-05-21 21:29:54.844814+00
4754	evening	14	22	15.00	2026-05-21 21:29:54.844814+00
4755	night	22	6	12.00	2026-05-21 21:29:54.844814+00
4756	morning	6	14	10.00	2026-05-21 21:32:10.550003+00
4757	evening	14	22	15.00	2026-05-21 21:32:10.550003+00
4758	night	22	6	12.00	2026-05-21 21:32:10.550003+00
4759	morning	6	14	10.00	2026-05-22 00:17:13.801371+00
4760	evening	14	22	15.00	2026-05-22 00:17:13.801371+00
4761	night	22	6	12.00	2026-05-22 00:17:13.801371+00
4762	morning	6	14	10.00	2026-05-22 00:17:35.058789+00
4763	evening	14	22	15.00	2026-05-22 00:17:35.058789+00
4764	night	22	6	12.00	2026-05-22 00:17:35.058789+00
4765	morning	6	14	10.00	2026-05-22 00:33:06.14415+00
4766	evening	14	22	15.00	2026-05-22 00:33:06.14415+00
4767	night	22	6	12.00	2026-05-22 00:33:06.14415+00
4768	morning	6	14	10.00	2026-05-22 00:33:32.033661+00
4769	evening	14	22	15.00	2026-05-22 00:33:32.033661+00
4770	night	22	6	12.00	2026-05-22 00:33:32.033661+00
4771	morning	6	14	10.00	2026-05-22 00:33:32.067089+00
4772	evening	14	22	15.00	2026-05-22 00:33:32.067089+00
4773	night	22	6	12.00	2026-05-22 00:33:32.067089+00
4774	morning	6	14	10.00	2026-05-22 00:33:50.095424+00
4775	evening	14	22	15.00	2026-05-22 00:33:50.095424+00
4776	night	22	6	12.00	2026-05-22 00:33:50.095424+00
4777	morning	6	14	10.00	2026-05-22 00:33:50.107891+00
4778	evening	14	22	15.00	2026-05-22 00:33:50.107891+00
4779	night	22	6	12.00	2026-05-22 00:33:50.107891+00
4780	morning	6	14	10.00	2026-05-22 00:35:36.134887+00
4781	evening	14	22	15.00	2026-05-22 00:35:36.134887+00
4782	night	22	6	12.00	2026-05-22 00:35:36.134887+00
4783	morning	6	14	10.00	2026-05-22 01:02:22.850506+00
4784	evening	14	22	15.00	2026-05-22 01:02:22.850506+00
4785	night	22	6	12.00	2026-05-22 01:02:22.850506+00
4786	morning	6	14	10.00	2026-05-22 01:02:37.147543+00
4787	evening	14	22	15.00	2026-05-22 01:02:37.147543+00
4788	night	22	6	12.00	2026-05-22 01:02:37.147543+00
4789	morning	6	14	10.00	2026-05-22 01:02:37.448048+00
4790	evening	14	22	15.00	2026-05-22 01:02:37.448048+00
4791	night	22	6	12.00	2026-05-22 01:02:37.448048+00
4792	morning	6	14	10.00	2026-05-22 01:02:45.185672+00
4793	evening	14	22	15.00	2026-05-22 01:02:45.185672+00
4794	night	22	6	12.00	2026-05-22 01:02:45.185672+00
4795	morning	6	14	10.00	2026-05-22 01:02:51.087414+00
4796	evening	14	22	15.00	2026-05-22 01:02:51.087414+00
4797	night	22	6	12.00	2026-05-22 01:02:51.087414+00
4798	morning	6	14	10.00	2026-05-22 01:02:51.239659+00
4799	evening	14	22	15.00	2026-05-22 01:02:51.239659+00
4800	night	22	6	12.00	2026-05-22 01:02:51.239659+00
4801	morning	6	14	10.00	2026-05-22 01:02:51.243879+00
4803	evening	14	22	15.00	2026-05-22 01:02:51.243879+00
4804	night	22	6	12.00	2026-05-22 01:02:51.243879+00
4802	morning	6	14	10.00	2026-05-22 01:02:51.244408+00
4805	evening	14	22	15.00	2026-05-22 01:02:51.244408+00
4806	night	22	6	12.00	2026-05-22 01:02:51.244408+00
4807	morning	6	14	10.00	2026-05-22 01:02:51.322396+00
4808	evening	14	22	15.00	2026-05-22 01:02:51.322396+00
4809	night	22	6	12.00	2026-05-22 01:02:51.322396+00
4810	morning	6	14	10.00	2026-05-22 01:02:51.351941+00
4811	evening	14	22	15.00	2026-05-22 01:02:51.351941+00
4812	night	22	6	12.00	2026-05-22 01:02:51.351941+00
4813	morning	6	14	10.00	2026-05-22 01:27:49.75293+00
4814	evening	14	22	15.00	2026-05-22 01:27:49.75293+00
4815	night	22	6	12.00	2026-05-22 01:27:49.75293+00
4816	morning	6	14	10.00	2026-05-22 01:27:50.207043+00
4817	evening	14	22	15.00	2026-05-22 01:27:50.207043+00
4818	night	22	6	12.00	2026-05-22 01:27:50.207043+00
4819	morning	6	14	10.00	2026-05-22 01:27:58.672767+00
4820	evening	14	22	15.00	2026-05-22 01:27:58.672767+00
4821	night	22	6	12.00	2026-05-22 01:27:58.672767+00
4822	morning	6	14	10.00	2026-05-22 01:27:58.708874+00
4823	evening	14	22	15.00	2026-05-22 01:27:58.708874+00
4824	night	22	6	12.00	2026-05-22 01:27:58.708874+00
4825	morning	6	14	10.00	2026-05-22 01:27:58.793932+00
4826	evening	14	22	15.00	2026-05-22 01:27:58.793932+00
4827	night	22	6	12.00	2026-05-22 01:27:58.793932+00
4828	morning	6	14	10.00	2026-05-22 01:27:58.79931+00
4829	evening	14	22	15.00	2026-05-22 01:27:58.79931+00
4830	night	22	6	12.00	2026-05-22 01:27:58.79931+00
4831	morning	6	14	10.00	2026-05-22 07:26:14.480346+00
4832	evening	14	22	15.00	2026-05-22 07:26:14.480346+00
4833	night	22	6	12.00	2026-05-22 07:26:14.480346+00
4834	morning	6	14	10.00	2026-05-22 07:27:02.03952+00
4835	evening	14	22	15.00	2026-05-22 07:27:02.03952+00
4836	night	22	6	12.00	2026-05-22 07:27:02.03952+00
4837	morning	6	14	10.00	2026-05-22 07:27:02.085131+00
4838	evening	14	22	15.00	2026-05-22 07:27:02.085131+00
4839	night	22	6	12.00	2026-05-22 07:27:02.085131+00
4840	morning	6	14	10.00	2026-05-22 07:27:02.335455+00
4841	evening	14	22	15.00	2026-05-22 07:27:02.335455+00
4842	night	22	6	12.00	2026-05-22 07:27:02.335455+00
4843	morning	6	14	10.00	2026-05-22 07:27:10.7958+00
4844	evening	14	22	15.00	2026-05-22 07:27:10.7958+00
4845	night	22	6	12.00	2026-05-22 07:27:10.7958+00
4847	morning	6	14	10.00	2026-05-22 10:13:27.365644+00
4848	evening	14	22	15.00	2026-05-22 10:13:27.365644+00
4849	night	22	6	12.00	2026-05-22 10:13:27.365644+00
4846	morning	6	14	10.00	2026-05-22 10:13:27.364769+00
4850	evening	14	22	15.00	2026-05-22 10:13:27.364769+00
4851	night	22	6	12.00	2026-05-22 10:13:27.364769+00
4852	morning	6	14	10.00	2026-05-23 14:51:24.029211+00
4853	evening	14	22	15.00	2026-05-23 14:51:24.029211+00
4854	night	22	6	12.00	2026-05-23 14:51:24.029211+00
4855	morning	6	14	10.00	2026-05-23 14:51:43.116322+00
4856	evening	14	22	15.00	2026-05-23 14:51:43.116322+00
4857	night	22	6	12.00	2026-05-23 14:51:43.116322+00
4858	morning	6	14	10.00	2026-05-23 14:51:43.132999+00
4859	evening	14	22	15.00	2026-05-23 14:51:43.132999+00
4860	night	22	6	12.00	2026-05-23 14:51:43.132999+00
4861	morning	6	14	10.00	2026-05-23 14:51:43.844779+00
4862	evening	14	22	15.00	2026-05-23 14:51:43.844779+00
4863	night	22	6	12.00	2026-05-23 14:51:43.844779+00
4864	morning	6	14	10.00	2026-05-23 14:55:54.229334+00
4865	evening	14	22	15.00	2026-05-23 14:55:54.229334+00
4866	night	22	6	12.00	2026-05-23 14:55:54.229334+00
4867	morning	6	14	10.00	2026-05-23 14:56:16.784897+00
4868	evening	14	22	15.00	2026-05-23 14:56:16.784897+00
4869	night	22	6	12.00	2026-05-23 14:56:16.784897+00
4870	morning	6	14	10.00	2026-05-23 15:08:23.387807+00
4871	evening	14	22	15.00	2026-05-23 15:08:23.387807+00
4872	night	22	6	12.00	2026-05-23 15:08:23.387807+00
4873	morning	6	14	10.00	2026-05-23 15:08:23.636534+00
4874	evening	14	22	15.00	2026-05-23 15:08:23.636534+00
4875	night	22	6	12.00	2026-05-23 15:08:23.636534+00
4876	morning	6	14	10.00	2026-05-23 15:13:16.935013+00
4877	evening	14	22	15.00	2026-05-23 15:13:16.935013+00
4878	night	22	6	12.00	2026-05-23 15:13:16.935013+00
4879	morning	6	14	10.00	2026-05-23 15:19:10.522006+00
4880	evening	14	22	15.00	2026-05-23 15:19:10.522006+00
4881	night	22	6	12.00	2026-05-23 15:19:10.522006+00
4882	morning	6	14	10.00	2026-05-23 15:19:10.523604+00
4883	evening	14	22	15.00	2026-05-23 15:19:10.523604+00
4884	night	22	6	12.00	2026-05-23 15:19:10.523604+00
4885	morning	6	14	10.00	2026-05-23 15:19:10.663243+00
4886	evening	14	22	15.00	2026-05-23 15:19:10.663243+00
4887	night	22	6	12.00	2026-05-23 15:19:10.663243+00
4888	morning	6	14	10.00	2026-05-23 15:28:14.798811+00
4889	evening	14	22	15.00	2026-05-23 15:28:14.798811+00
4890	night	22	6	12.00	2026-05-23 15:28:14.798811+00
4891	morning	6	14	10.00	2026-05-23 15:31:52.27678+00
4892	evening	14	22	15.00	2026-05-23 15:31:52.27678+00
4893	night	22	6	12.00	2026-05-23 15:31:52.27678+00
4894	morning	6	14	10.00	2026-05-23 17:17:38.557653+00
4895	evening	14	22	15.00	2026-05-23 17:17:38.557653+00
4896	night	22	6	12.00	2026-05-23 17:17:38.557653+00
4897	morning	6	14	10.00	2026-05-23 17:17:38.681124+00
4898	evening	14	22	15.00	2026-05-23 17:17:38.681124+00
4899	night	22	6	12.00	2026-05-23 17:17:38.681124+00
4900	morning	6	14	10.00	2026-05-23 17:17:47.106501+00
4901	evening	14	22	15.00	2026-05-23 17:17:47.106501+00
4902	night	22	6	12.00	2026-05-23 17:17:47.106501+00
4903	morning	6	14	10.00	2026-05-23 17:18:08.479862+00
4904	evening	14	22	15.00	2026-05-23 17:18:08.479862+00
4905	night	22	6	12.00	2026-05-23 17:18:08.479862+00
4906	morning	6	14	10.00	2026-05-23 17:18:08.531103+00
4907	evening	14	22	15.00	2026-05-23 17:18:08.531103+00
4908	night	22	6	12.00	2026-05-23 17:18:08.531103+00
4909	morning	6	14	10.00	2026-05-23 17:24:11.783962+00
4910	evening	14	22	15.00	2026-05-23 17:24:11.783962+00
4911	night	22	6	12.00	2026-05-23 17:24:11.783962+00
4912	morning	6	14	10.00	2026-05-23 17:24:11.951987+00
4913	evening	14	22	15.00	2026-05-23 17:24:11.951987+00
4914	night	22	6	12.00	2026-05-23 17:24:11.951987+00
4915	morning	6	14	10.00	2026-05-23 21:37:28.002901+00
4916	evening	14	22	15.00	2026-05-23 21:37:28.002901+00
4917	night	22	6	12.00	2026-05-23 21:37:28.002901+00
4919	morning	6	14	10.00	2026-05-23 23:16:53.266079+00
4920	evening	14	22	15.00	2026-05-23 23:16:53.266079+00
4921	night	22	6	12.00	2026-05-23 23:16:53.266079+00
4918	morning	6	14	10.00	2026-05-23 23:16:53.251487+00
4922	evening	14	22	15.00	2026-05-23 23:16:53.251487+00
4923	night	22	6	12.00	2026-05-23 23:16:53.251487+00
4924	morning	6	14	10.00	2026-05-23 23:17:58.685967+00
4925	evening	14	22	15.00	2026-05-23 23:17:58.685967+00
4926	night	22	6	12.00	2026-05-23 23:17:58.685967+00
4927	morning	6	14	10.00	2026-05-23 23:17:58.707064+00
4928	evening	14	22	15.00	2026-05-23 23:17:58.707064+00
4929	night	22	6	12.00	2026-05-23 23:17:58.707064+00
4930	morning	6	14	10.00	2026-05-23 23:17:58.724996+00
4931	evening	14	22	15.00	2026-05-23 23:17:58.724996+00
4932	night	22	6	12.00	2026-05-23 23:17:58.724996+00
4933	morning	6	14	10.00	2026-05-23 23:21:21.078503+00
4934	evening	14	22	15.00	2026-05-23 23:21:21.078503+00
4935	night	22	6	12.00	2026-05-23 23:21:21.078503+00
4936	morning	6	14	10.00	2026-05-23 23:46:00.203109+00
4937	evening	14	22	15.00	2026-05-23 23:46:00.203109+00
4938	night	22	6	12.00	2026-05-23 23:46:00.203109+00
4939	morning	6	14	10.00	2026-05-23 23:46:00.21862+00
4940	evening	14	22	15.00	2026-05-23 23:46:00.21862+00
4941	night	22	6	12.00	2026-05-23 23:46:00.21862+00
4942	morning	6	14	10.00	2026-05-23 23:46:00.222185+00
4943	evening	14	22	15.00	2026-05-23 23:46:00.222185+00
4944	night	22	6	12.00	2026-05-23 23:46:00.222185+00
4945	morning	6	14	10.00	2026-05-23 23:46:00.759621+00
4946	evening	14	22	15.00	2026-05-23 23:46:00.759621+00
4947	night	22	6	12.00	2026-05-23 23:46:00.759621+00
4948	morning	6	14	10.00	2026-05-23 23:46:00.760595+00
4949	evening	14	22	15.00	2026-05-23 23:46:00.760595+00
4950	night	22	6	12.00	2026-05-23 23:46:00.760595+00
4951	morning	6	14	10.00	2026-05-23 23:46:00.769102+00
4952	evening	14	22	15.00	2026-05-23 23:46:00.769102+00
4953	night	22	6	12.00	2026-05-23 23:46:00.769102+00
4954	morning	6	14	10.00	2026-05-23 23:46:00.862953+00
4955	evening	14	22	15.00	2026-05-23 23:46:00.862953+00
4956	night	22	6	12.00	2026-05-23 23:46:00.862953+00
4957	morning	6	14	10.00	2026-05-24 09:23:06.968711+00
4958	evening	14	22	15.00	2026-05-24 09:23:06.968711+00
4959	night	22	6	12.00	2026-05-24 09:23:06.968711+00
4961	morning	6	14	10.00	2026-05-24 12:01:38.586161+00
4962	evening	14	22	15.00	2026-05-24 12:01:38.586161+00
4963	night	22	6	12.00	2026-05-24 12:01:38.586161+00
4960	morning	6	14	10.00	2026-05-24 12:01:38.584328+00
4964	evening	14	22	15.00	2026-05-24 12:01:38.584328+00
4965	night	22	6	12.00	2026-05-24 12:01:38.584328+00
4969	morning	6	14	10.00	2026-05-24 12:39:57.284487+00
4970	evening	14	22	15.00	2026-05-24 12:39:57.284487+00
4971	night	22	6	12.00	2026-05-24 12:39:57.284487+00
4966	morning	6	14	10.00	2026-05-24 12:39:57.268821+00
4972	evening	14	22	15.00	2026-05-24 12:39:57.268821+00
4973	night	22	6	12.00	2026-05-24 12:39:57.268821+00
4967	morning	6	14	10.00	2026-05-24 12:39:57.273248+00
4974	evening	14	22	15.00	2026-05-24 12:39:57.273248+00
4975	night	22	6	12.00	2026-05-24 12:39:57.273248+00
4968	morning	6	14	10.00	2026-05-24 12:39:57.276206+00
4976	evening	14	22	15.00	2026-05-24 12:39:57.276206+00
4977	night	22	6	12.00	2026-05-24 12:39:57.276206+00
4978	morning	6	14	10.00	2026-05-24 12:39:57.300011+00
4979	evening	14	22	15.00	2026-05-24 12:39:57.300011+00
4980	night	22	6	12.00	2026-05-24 12:39:57.300011+00
4981	morning	6	14	10.00	2026-05-24 12:39:57.417912+00
4982	evening	14	22	15.00	2026-05-24 12:39:57.417912+00
4983	night	22	6	12.00	2026-05-24 12:39:57.417912+00
4984	morning	6	14	10.00	2026-05-24 12:57:28.635306+00
4985	evening	14	22	15.00	2026-05-24 12:57:28.635306+00
4986	night	22	6	12.00	2026-05-24 12:57:28.635306+00
4987	morning	6	14	10.00	2026-05-24 12:57:28.705712+00
4988	evening	14	22	15.00	2026-05-24 12:57:28.705712+00
4989	night	22	6	12.00	2026-05-24 12:57:28.705712+00
4990	morning	6	14	10.00	2026-05-24 13:01:53.051776+00
4991	evening	14	22	15.00	2026-05-24 13:01:53.051776+00
4992	night	22	6	12.00	2026-05-24 13:01:53.051776+00
4993	morning	6	14	10.00	2026-05-24 13:11:13.978794+00
4994	evening	14	22	15.00	2026-05-24 13:11:13.978794+00
4995	night	22	6	12.00	2026-05-24 13:11:13.978794+00
4996	morning	6	14	10.00	2026-05-24 13:11:14.076463+00
4997	evening	14	22	15.00	2026-05-24 13:11:14.076463+00
4998	night	22	6	12.00	2026-05-24 13:11:14.076463+00
4999	morning	6	14	10.00	2026-05-24 13:27:29.817797+00
5000	evening	14	22	15.00	2026-05-24 13:27:29.817797+00
5001	night	22	6	12.00	2026-05-24 13:27:29.817797+00
5002	morning	6	14	10.00	2026-05-24 16:43:48.054188+00
5003	evening	14	22	15.00	2026-05-24 16:43:48.054188+00
5004	night	22	6	12.00	2026-05-24 16:43:48.054188+00
5005	morning	6	14	10.00	2026-05-24 16:44:03.91007+00
5006	evening	14	22	15.00	2026-05-24 16:44:03.91007+00
5007	night	22	6	12.00	2026-05-24 16:44:03.91007+00
5008	morning	6	14	10.00	2026-05-24 16:44:04.033942+00
5009	evening	14	22	15.00	2026-05-24 16:44:04.033942+00
5010	night	22	6	12.00	2026-05-24 16:44:04.033942+00
5011	morning	6	14	10.00	2026-05-24 16:45:32.906508+00
5012	evening	14	22	15.00	2026-05-24 16:45:32.906508+00
5013	night	22	6	12.00	2026-05-24 16:45:32.906508+00
5014	morning	6	14	10.00	2026-05-24 16:46:06.015741+00
5015	evening	14	22	15.00	2026-05-24 16:46:06.015741+00
5016	night	22	6	12.00	2026-05-24 16:46:06.015741+00
5017	morning	6	14	10.00	2026-05-24 18:46:48.215515+00
5018	evening	14	22	15.00	2026-05-24 18:46:48.215515+00
5019	night	22	6	12.00	2026-05-24 18:46:48.215515+00
5020	morning	6	14	10.00	2026-05-24 18:59:04.077038+00
5021	evening	14	22	15.00	2026-05-24 18:59:04.077038+00
5022	night	22	6	12.00	2026-05-24 18:59:04.077038+00
5023	morning	6	14	10.00	2026-05-24 18:59:59.796232+00
5024	evening	14	22	15.00	2026-05-24 18:59:59.796232+00
5025	night	22	6	12.00	2026-05-24 18:59:59.796232+00
5026	morning	6	14	10.00	2026-05-24 22:37:47.079124+00
5027	evening	14	22	15.00	2026-05-24 22:37:47.079124+00
5028	night	22	6	12.00	2026-05-24 22:37:47.079124+00
5029	morning	6	14	10.00	2026-05-24 22:37:58.206566+00
5030	evening	14	22	15.00	2026-05-24 22:37:58.206566+00
5031	night	22	6	12.00	2026-05-24 22:37:58.206566+00
5032	morning	6	14	10.00	2026-05-24 22:37:58.234699+00
5033	evening	14	22	15.00	2026-05-24 22:37:58.234699+00
5034	night	22	6	12.00	2026-05-24 22:37:58.234699+00
5035	morning	6	14	10.00	2026-05-24 22:37:58.261897+00
5036	evening	14	22	15.00	2026-05-24 22:37:58.261897+00
5037	night	22	6	12.00	2026-05-24 22:37:58.261897+00
5039	morning	6	14	10.00	2026-05-24 22:55:31.152673+00
5040	evening	14	22	15.00	2026-05-24 22:55:31.152673+00
5041	night	22	6	12.00	2026-05-24 22:55:31.152673+00
5038	morning	6	14	10.00	2026-05-24 22:55:31.153745+00
5042	evening	14	22	15.00	2026-05-24 22:55:31.153745+00
5043	night	22	6	12.00	2026-05-24 22:55:31.153745+00
5044	morning	6	14	10.00	2026-05-24 23:29:53.782144+00
5045	evening	14	22	15.00	2026-05-24 23:29:53.782144+00
5046	night	22	6	12.00	2026-05-24 23:29:53.782144+00
5047	morning	6	14	10.00	2026-05-24 23:29:54.204221+00
5048	evening	14	22	15.00	2026-05-24 23:29:54.204221+00
5049	night	22	6	12.00	2026-05-24 23:29:54.204221+00
5050	morning	6	14	10.00	2026-05-24 23:31:48.0236+00
5051	evening	14	22	15.00	2026-05-24 23:31:48.0236+00
5052	night	22	6	12.00	2026-05-24 23:31:48.0236+00
5053	morning	6	14	10.00	2026-05-24 23:32:01.35168+00
5054	evening	14	22	15.00	2026-05-24 23:32:01.35168+00
5055	night	22	6	12.00	2026-05-24 23:32:01.35168+00
5056	morning	6	14	10.00	2026-05-24 23:32:01.415555+00
5057	evening	14	22	15.00	2026-05-24 23:32:01.415555+00
5058	night	22	6	12.00	2026-05-24 23:32:01.415555+00
5059	morning	6	14	10.00	2026-05-24 23:32:28.917981+00
5060	evening	14	22	15.00	2026-05-24 23:32:28.917981+00
5061	night	22	6	12.00	2026-05-24 23:32:28.917981+00
5062	morning	6	14	10.00	2026-05-25 00:04:11.827323+00
5063	evening	14	22	15.00	2026-05-25 00:04:11.827323+00
5064	night	22	6	12.00	2026-05-25 00:04:11.827323+00
5065	morning	6	14	10.00	2026-05-25 00:04:11.926443+00
5066	evening	14	22	15.00	2026-05-25 00:04:11.926443+00
5067	night	22	6	12.00	2026-05-25 00:04:11.926443+00
5068	morning	6	14	10.00	2026-05-25 00:04:15.673349+00
5069	evening	14	22	15.00	2026-05-25 00:04:15.673349+00
5070	night	22	6	12.00	2026-05-25 00:04:15.673349+00
5071	morning	6	14	10.00	2026-05-25 00:04:15.872445+00
5072	evening	14	22	15.00	2026-05-25 00:04:15.872445+00
5073	night	22	6	12.00	2026-05-25 00:04:15.872445+00
5074	morning	6	14	10.00	2026-05-25 00:04:15.950987+00
5075	evening	14	22	15.00	2026-05-25 00:04:15.950987+00
5076	night	22	6	12.00	2026-05-25 00:04:15.950987+00
5077	morning	6	14	10.00	2026-05-25 00:04:16.219814+00
5078	evening	14	22	15.00	2026-05-25 00:04:16.219814+00
5079	night	22	6	12.00	2026-05-25 00:04:16.219814+00
5080	morning	6	14	10.00	2026-05-25 00:19:45.895029+00
5081	evening	14	22	15.00	2026-05-25 00:19:45.895029+00
5082	night	22	6	12.00	2026-05-25 00:19:45.895029+00
5083	morning	6	14	10.00	2026-05-25 00:19:58.2623+00
5084	evening	14	22	15.00	2026-05-25 00:19:58.2623+00
5085	night	22	6	12.00	2026-05-25 00:19:58.2623+00
5086	morning	6	14	10.00	2026-05-25 00:19:58.301482+00
5087	evening	14	22	15.00	2026-05-25 00:19:58.301482+00
5088	night	22	6	12.00	2026-05-25 00:19:58.301482+00
5089	morning	6	14	10.00	2026-05-25 00:19:58.332154+00
5090	evening	14	22	15.00	2026-05-25 00:19:58.332154+00
5091	night	22	6	12.00	2026-05-25 00:19:58.332154+00
5092	morning	6	14	10.00	2026-05-25 00:20:06.177502+00
5093	evening	14	22	15.00	2026-05-25 00:20:06.177502+00
5094	night	22	6	12.00	2026-05-25 00:20:06.177502+00
5096	morning	6	14	10.00	2026-05-25 00:46:36.74512+00
5097	evening	14	22	15.00	2026-05-25 00:46:36.74512+00
5098	night	22	6	12.00	2026-05-25 00:46:36.74512+00
5095	morning	6	14	10.00	2026-05-25 00:46:36.740536+00
5099	evening	14	22	15.00	2026-05-25 00:46:36.740536+00
5100	night	22	6	12.00	2026-05-25 00:46:36.740536+00
5101	morning	6	14	10.00	2026-05-25 01:06:38.971658+00
5102	evening	14	22	15.00	2026-05-25 01:06:38.971658+00
5103	night	22	6	12.00	2026-05-25 01:06:38.971658+00
5104	morning	6	14	10.00	2026-05-25 01:06:38.999879+00
5105	evening	14	22	15.00	2026-05-25 01:06:38.999879+00
5106	night	22	6	12.00	2026-05-25 01:06:38.999879+00
5107	morning	6	14	10.00	2026-05-25 01:07:32.231676+00
5108	evening	14	22	15.00	2026-05-25 01:07:32.231676+00
5109	night	22	6	12.00	2026-05-25 01:07:32.231676+00
5110	morning	6	14	10.00	2026-05-26 08:19:54.91919+00
5112	evening	14	22	15.00	2026-05-26 08:19:54.91919+00
5113	night	22	6	12.00	2026-05-26 08:19:54.91919+00
5111	morning	6	14	10.00	2026-05-26 08:19:54.916258+00
5114	evening	14	22	15.00	2026-05-26 08:19:54.916258+00
5115	night	22	6	12.00	2026-05-26 08:19:54.916258+00
5117	morning	6	14	10.00	2026-05-26 08:32:53.909577+00
5118	evening	14	22	15.00	2026-05-26 08:32:53.909577+00
5119	night	22	6	12.00	2026-05-26 08:32:53.909577+00
5116	morning	6	14	10.00	2026-05-26 08:32:53.892515+00
5120	evening	14	22	15.00	2026-05-26 08:32:53.892515+00
5121	night	22	6	12.00	2026-05-26 08:32:53.892515+00
5122	morning	6	14	10.00	2026-05-26 13:24:50.899063+00
5123	evening	14	22	15.00	2026-05-26 13:24:50.899063+00
5124	night	22	6	12.00	2026-05-26 13:24:50.899063+00
5125	morning	6	14	10.00	2026-05-26 13:24:51.204897+00
5126	evening	14	22	15.00	2026-05-26 13:24:51.204897+00
5127	night	22	6	12.00	2026-05-26 13:24:51.204897+00
5128	morning	6	14	10.00	2026-05-26 15:35:09.068749+00
5129	evening	14	22	15.00	2026-05-26 15:35:09.068749+00
5130	night	22	6	12.00	2026-05-26 15:35:09.068749+00
5131	morning	6	14	10.00	2026-05-26 15:35:09.264699+00
5132	evening	14	22	15.00	2026-05-26 15:35:09.264699+00
5133	night	22	6	12.00	2026-05-26 15:35:09.264699+00
5134	morning	6	14	10.00	2026-05-26 15:36:07.778673+00
5135	evening	14	22	15.00	2026-05-26 15:36:07.778673+00
5136	night	22	6	12.00	2026-05-26 15:36:07.778673+00
5137	morning	6	14	10.00	2026-05-26 15:36:08.772323+00
5138	evening	14	22	15.00	2026-05-26 15:36:08.772323+00
5139	night	22	6	12.00	2026-05-26 15:36:08.772323+00
5140	morning	6	14	10.00	2026-05-26 15:36:09.096571+00
5141	evening	14	22	15.00	2026-05-26 15:36:09.096571+00
5142	night	22	6	12.00	2026-05-26 15:36:09.096571+00
5143	morning	6	14	10.00	2026-05-26 17:28:32.010054+00
5144	evening	14	22	15.00	2026-05-26 17:28:32.010054+00
5145	night	22	6	12.00	2026-05-26 17:28:32.010054+00
5146	morning	6	14	10.00	2026-05-26 17:28:32.403915+00
5147	evening	14	22	15.00	2026-05-26 17:28:32.403915+00
5148	night	22	6	12.00	2026-05-26 17:28:32.403915+00
5149	morning	6	14	10.00	2026-05-26 21:54:07.971449+00
5150	evening	14	22	15.00	2026-05-26 21:54:07.971449+00
5151	night	22	6	12.00	2026-05-26 21:54:07.971449+00
5152	morning	6	14	10.00	2026-05-26 21:54:08.48197+00
5153	evening	14	22	15.00	2026-05-26 21:54:08.48197+00
5154	night	22	6	12.00	2026-05-26 21:54:08.48197+00
5155	morning	6	14	10.00	2026-05-26 22:02:40.12398+00
5156	evening	14	22	15.00	2026-05-26 22:02:40.12398+00
5157	night	22	6	12.00	2026-05-26 22:02:40.12398+00
5158	morning	6	14	10.00	2026-05-26 22:02:40.674625+00
5159	evening	14	22	15.00	2026-05-26 22:02:40.674625+00
5160	night	22	6	12.00	2026-05-26 22:02:40.674625+00
5161	morning	6	14	10.00	2026-05-26 22:02:48.289443+00
5162	evening	14	22	15.00	2026-05-26 22:02:48.289443+00
5163	night	22	6	12.00	2026-05-26 22:02:48.289443+00
5164	morning	6	14	10.00	2026-05-26 22:03:02.251007+00
5165	evening	14	22	15.00	2026-05-26 22:03:02.251007+00
5166	night	22	6	12.00	2026-05-26 22:03:02.251007+00
5167	morning	6	14	10.00	2026-05-26 22:04:56.891941+00
5168	evening	14	22	15.00	2026-05-26 22:04:56.891941+00
5169	night	22	6	12.00	2026-05-26 22:04:56.891941+00
5170	morning	6	14	10.00	2026-05-26 22:05:57.303104+00
5171	evening	14	22	15.00	2026-05-26 22:05:57.303104+00
5172	night	22	6	12.00	2026-05-26 22:05:57.303104+00
5173	morning	6	14	10.00	2026-05-26 22:17:23.556664+00
5174	evening	14	22	15.00	2026-05-26 22:17:23.556664+00
5175	night	22	6	12.00	2026-05-26 22:17:23.556664+00
5176	morning	6	14	10.00	2026-05-26 22:17:34.418626+00
5177	evening	14	22	15.00	2026-05-26 22:17:34.418626+00
5178	night	22	6	12.00	2026-05-26 22:17:34.418626+00
5179	morning	6	14	10.00	2026-05-26 22:17:34.500712+00
5180	evening	14	22	15.00	2026-05-26 22:17:34.500712+00
5181	night	22	6	12.00	2026-05-26 22:17:34.500712+00
5182	morning	6	14	10.00	2026-05-26 22:29:13.768858+00
5183	evening	14	22	15.00	2026-05-26 22:29:13.768858+00
5184	night	22	6	12.00	2026-05-26 22:29:13.768858+00
5185	morning	6	14	10.00	2026-05-26 22:29:23.811592+00
5186	evening	14	22	15.00	2026-05-26 22:29:23.811592+00
5187	night	22	6	12.00	2026-05-26 22:29:23.811592+00
5188	morning	6	14	10.00	2026-05-26 22:29:24.000033+00
5189	evening	14	22	15.00	2026-05-26 22:29:24.000033+00
5190	night	22	6	12.00	2026-05-26 22:29:24.000033+00
5191	morning	6	14	10.00	2026-05-26 22:29:33.249258+00
5192	evening	14	22	15.00	2026-05-26 22:29:33.249258+00
5193	night	22	6	12.00	2026-05-26 22:29:33.249258+00
5194	morning	6	14	10.00	2026-05-26 22:29:36.550553+00
5195	evening	14	22	15.00	2026-05-26 22:29:36.550553+00
5196	night	22	6	12.00	2026-05-26 22:29:36.550553+00
5197	morning	6	14	10.00	2026-05-26 22:29:37.560664+00
5198	evening	14	22	15.00	2026-05-26 22:29:37.560664+00
5199	night	22	6	12.00	2026-05-26 22:29:37.560664+00
5200	morning	6	14	10.00	2026-05-26 22:29:37.600464+00
5201	evening	14	22	15.00	2026-05-26 22:29:37.600464+00
5202	night	22	6	12.00	2026-05-26 22:29:37.600464+00
5203	morning	6	14	10.00	2026-05-26 22:29:37.65926+00
5204	evening	14	22	15.00	2026-05-26 22:29:37.65926+00
5205	night	22	6	12.00	2026-05-26 22:29:37.65926+00
5206	morning	6	14	10.00	2026-05-26 22:29:44.840901+00
5207	evening	14	22	15.00	2026-05-26 22:29:44.840901+00
5208	night	22	6	12.00	2026-05-26 22:29:44.840901+00
5209	morning	6	14	10.00	2026-05-26 22:29:44.86929+00
5210	evening	14	22	15.00	2026-05-26 22:29:44.86929+00
5211	night	22	6	12.00	2026-05-26 22:29:44.86929+00
5212	morning	6	14	10.00	2026-05-26 22:29:44.879322+00
5213	evening	14	22	15.00	2026-05-26 22:29:44.879322+00
5214	night	22	6	12.00	2026-05-26 22:29:44.879322+00
5215	morning	6	14	10.00	2026-05-26 22:29:44.919492+00
5216	evening	14	22	15.00	2026-05-26 22:29:44.919492+00
5217	night	22	6	12.00	2026-05-26 22:29:44.919492+00
5218	morning	6	14	10.00	2026-05-26 22:36:02.551191+00
5219	evening	14	22	15.00	2026-05-26 22:36:02.551191+00
5220	night	22	6	12.00	2026-05-26 22:36:02.551191+00
5221	morning	6	14	10.00	2026-05-26 22:36:12.728685+00
5222	evening	14	22	15.00	2026-05-26 22:36:12.728685+00
5223	night	22	6	12.00	2026-05-26 22:36:12.728685+00
5224	morning	6	14	10.00	2026-05-26 22:36:15.445399+00
5225	evening	14	22	15.00	2026-05-26 22:36:15.445399+00
5226	night	22	6	12.00	2026-05-26 22:36:15.445399+00
5227	morning	6	14	10.00	2026-05-26 22:36:15.471865+00
5228	evening	14	22	15.00	2026-05-26 22:36:15.471865+00
5229	night	22	6	12.00	2026-05-26 22:36:15.471865+00
5230	morning	6	14	10.00	2026-05-26 22:36:15.729862+00
5231	evening	14	22	15.00	2026-05-26 22:36:15.729862+00
5232	night	22	6	12.00	2026-05-26 22:36:15.729862+00
5233	morning	6	14	10.00	2026-05-26 22:38:12.234908+00
5234	evening	14	22	15.00	2026-05-26 22:38:12.234908+00
5235	night	22	6	12.00	2026-05-26 22:38:12.234908+00
5236	morning	6	14	10.00	2026-05-26 22:38:14.174107+00
5237	evening	14	22	15.00	2026-05-26 22:38:14.174107+00
5238	night	22	6	12.00	2026-05-26 22:38:14.174107+00
5239	morning	6	14	10.00	2026-05-26 22:38:15.008198+00
5240	evening	14	22	15.00	2026-05-26 22:38:15.008198+00
5241	night	22	6	12.00	2026-05-26 22:38:15.008198+00
5242	morning	6	14	10.00	2026-05-26 22:38:15.252626+00
5243	evening	14	22	15.00	2026-05-26 22:38:15.252626+00
5244	night	22	6	12.00	2026-05-26 22:38:15.252626+00
5245	morning	6	14	10.00	2026-05-26 22:38:15.256895+00
5246	evening	14	22	15.00	2026-05-26 22:38:15.256895+00
5247	night	22	6	12.00	2026-05-26 22:38:15.256895+00
5248	morning	6	14	10.00	2026-05-26 22:38:15.269493+00
5249	evening	14	22	15.00	2026-05-26 22:38:15.269493+00
5250	night	22	6	12.00	2026-05-26 22:38:15.269493+00
5251	morning	6	14	10.00	2026-05-26 22:38:15.273816+00
5252	evening	14	22	15.00	2026-05-26 22:38:15.273816+00
5253	night	22	6	12.00	2026-05-26 22:38:15.273816+00
5254	morning	6	14	10.00	2026-05-26 23:00:56.415323+00
5255	evening	14	22	15.00	2026-05-26 23:00:56.415323+00
5256	night	22	6	12.00	2026-05-26 23:00:56.415323+00
5257	morning	6	14	10.00	2026-05-26 23:01:38.10157+00
5258	evening	14	22	15.00	2026-05-26 23:01:38.10157+00
5259	night	22	6	12.00	2026-05-26 23:01:38.10157+00
5260	morning	6	14	10.00	2026-05-26 23:01:38.347086+00
5261	evening	14	22	15.00	2026-05-26 23:01:38.347086+00
5262	night	22	6	12.00	2026-05-26 23:01:38.347086+00
5263	morning	6	14	10.00	2026-05-26 23:01:38.59124+00
5264	evening	14	22	15.00	2026-05-26 23:01:38.59124+00
5265	night	22	6	12.00	2026-05-26 23:01:38.59124+00
5266	morning	6	14	10.00	2026-05-26 23:02:07.29881+00
5267	evening	14	22	15.00	2026-05-26 23:02:07.29881+00
5268	night	22	6	12.00	2026-05-26 23:02:07.29881+00
5269	morning	6	14	10.00	2026-05-27 05:26:04.23305+00
5270	evening	14	22	15.00	2026-05-27 05:26:04.23305+00
5271	night	22	6	12.00	2026-05-27 05:26:04.23305+00
5272	morning	6	14	10.00	2026-05-27 05:26:41.486265+00
5273	evening	14	22	15.00	2026-05-27 05:26:41.486265+00
5274	night	22	6	12.00	2026-05-27 05:26:41.486265+00
5275	morning	6	14	10.00	2026-05-27 05:55:38.627711+00
5276	evening	14	22	15.00	2026-05-27 05:55:38.627711+00
5277	night	22	6	12.00	2026-05-27 05:55:38.627711+00
5278	morning	6	14	10.00	2026-05-27 06:16:34.739457+00
5279	evening	14	22	15.00	2026-05-27 06:16:34.739457+00
5280	night	22	6	12.00	2026-05-27 06:16:34.739457+00
5281	morning	6	14	10.00	2026-05-27 06:20:40.791933+00
5282	evening	14	22	15.00	2026-05-27 06:20:40.791933+00
5283	night	22	6	12.00	2026-05-27 06:20:40.791933+00
5284	morning	6	14	10.00	2026-05-27 06:20:40.819648+00
5285	evening	14	22	15.00	2026-05-27 06:20:40.819648+00
5286	night	22	6	12.00	2026-05-27 06:20:40.819648+00
5287	morning	6	14	10.00	2026-05-27 06:20:41.274395+00
5288	evening	14	22	15.00	2026-05-27 06:20:41.274395+00
5289	night	22	6	12.00	2026-05-27 06:20:41.274395+00
5290	morning	6	14	10.00	2026-05-28 22:41:34.473849+00
5291	evening	14	22	15.00	2026-05-28 22:41:34.473849+00
5292	night	22	6	12.00	2026-05-28 22:41:34.473849+00
5293	morning	6	14	10.00	2026-05-28 22:41:34.511878+00
5294	evening	14	22	15.00	2026-05-28 22:41:34.511878+00
5295	night	22	6	12.00	2026-05-28 22:41:34.511878+00
5296	morning	6	14	10.00	2026-05-31 00:32:57.05329+00
5297	evening	14	22	15.00	2026-05-31 00:32:57.05329+00
5298	night	22	6	12.00	2026-05-31 00:32:57.05329+00
5299	morning	6	14	10.00	2026-05-31 18:11:40.822821+00
5300	evening	14	22	15.00	2026-05-31 18:11:40.822821+00
5301	night	22	6	12.00	2026-05-31 18:11:40.822821+00
5302	morning	6	14	10.00	2026-05-31 18:11:40.979918+00
5303	evening	14	22	15.00	2026-05-31 18:11:40.979918+00
5304	night	22	6	12.00	2026-05-31 18:11:40.979918+00
5306	morning	6	14	10.00	2026-06-02 07:30:48.224233+00
5307	evening	14	22	15.00	2026-06-02 07:30:48.224233+00
5308	night	22	6	12.00	2026-06-02 07:30:48.224233+00
5305	morning	6	14	10.00	2026-06-02 07:30:48.22629+00
5309	evening	14	22	15.00	2026-06-02 07:30:48.22629+00
5310	night	22	6	12.00	2026-06-02 07:30:48.22629+00
\.


--
-- Data for Name: referral_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referral_logs (id, referrer_id, referred_id, points_given, reason, created_at) FROM stdin;
1	161	9124	50	signup	2026-05-17 23:22:06.587955+00
2	161	9124	100	first_session	2026-05-20 00:57:25.750282+00
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, price, is_active, created_at, updated_at, sort_order, hidden_from_client) FROM stdin;
1	قهوة	20.00	t	2026-03-24 22:39:49.174125+00	2026-05-18 17:42:48.775617+00	0	f
8307	شاي	10.00	t	2026-05-18 17:47:44.206142+00	2026-05-18 17:47:44.206142+00	1	f
8309	عصير	20.00	t	2026-05-18 17:47:44.206142+00	2026-05-18 17:47:44.206142+00	2	f
2	شاي العروسة 	10.00	t	2026-03-24 22:39:49.174125+00	2026-05-18 17:43:46.005331+00	3	f
4037	ينسون 	10.00	t	2026-05-12 17:22:05.080551+00	2026-05-12 17:22:05.080551+00	4	f
3	مياه صغيرة 	7.00	t	2026-03-24 22:39:49.174125+00	2026-05-18 17:45:00.28149+00	5	f
4	عصير معلب	17.00	t	2026-03-24 22:39:49.174125+00	2026-05-18 17:45:15.837004+00	6	f
5	طباعة (ورقة)	1.00	t	2026-03-24 22:39:49.174125+00	2026-05-12 22:03:21.993134+00	7	f
6	سكانر	1.00	t	2026-03-24 22:39:49.174125+00	2026-04-12 18:42:49.630798+00	8	f
15	مياه	5.00	f	2026-03-25 10:38:09.227656+00	2026-03-25 10:38:09.227656+00	9	f
253	طباعة ورق ألوان 	2.00	t	2026-04-12 18:41:53.458798+00	2026-04-12 18:41:53.458798+00	10	f
9	مياه كبيرة 	12.00	t	2026-03-24 23:05:16.011849+00	2026-05-18 17:46:35.04258+00	11	f
254	مشروب غازي 	20.00	t	2026-04-12 18:42:33.322634+00	2026-04-12 18:42:33.322634+00	12	f
286	قهوة 	10.00	f	2026-04-12 21:03:07.662171+00	2026-04-12 21:03:07.662171+00	13	f
1004	بيج شبسي 	10.00	t	2026-04-27 19:23:18.42066+00	2026-04-27 19:23:18.42066+00	14	f
4290	باتيه بالجبنة 	10.00	t	2026-05-12 22:41:11.969458+00	2026-05-24 12:50:45.073574+00	15	f
2667	طربيزة هندسة 	5.00	t	2026-05-09 16:05:52.804692+00	2026-05-18 14:14:47.707491+00	16	f
8132	عناب 	15.00	t	2026-05-18 14:29:45.921062+00	2026-05-24 12:53:46.145154+00	17	f
8139	ايس لاتيه	70.00	t	2026-05-18 14:35:54.388392+00	2026-05-18 14:49:48.438871+00	18	f
8164	كابتشينو	60.00	t	2026-05-18 14:49:01.857268+00	2026-05-18 14:49:01.857268+00	19	f
8303	Ahmed tea	15.00	t	2026-05-18 17:44:04.986307+00	2026-05-23 15:35:03.487971+00	20	f
9818	زبادو	18.00	t	2026-05-24 12:50:09.832036+00	2026-05-24 12:50:09.832036+00	21	f
2692	ساعة إضافية 	100.00	t	2026-05-09 16:41:21.337021+00	2026-05-18 14:17:35.593187+00	23	t
8125	مشروب مجاني 	0.00	t	2026-05-18 14:27:29.240609+00	2026-05-18 14:28:29.923608+00	24	t
\.


--
-- Data for Name: session_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_orders (id, session_id, user_id, service_id, service_name, price, qty, added_by, added_by_name, can_remove, created_at) FROM stdin;
2	90	161	254	مشروب غازي 	20.00	1	staff	مدير النظام	t	2026-04-25 21:44:42.004374+00
3	90	161	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-04-25 21:44:51.428939+00
4	91	161	1	قهوة	20.00	1	staff	مدير النظام	t	2026-04-26 18:10:12.132864+00
5	91	161	4	عصير	15.00	1	staff	مدير النظام	t	2026-04-26 18:10:12.936336+00
6	92	161	9	مياه كبيرة 	10.00	1	staff	مدير النظام	t	2026-04-26 18:26:10.303958+00
7	92	161	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-04-26 18:26:12.585476+00
8	92	161	254	مشروب غازي 	20.00	1	staff	مدير النظام	t	2026-04-26 18:26:15.937929+00
9	92	161	1	قهوة	20.00	1	staff	مدير النظام	t	2026-04-26 18:26:16.81533+00
10	92	161	2	شاي	10.00	1	staff	مدير النظام	t	2026-04-26 18:26:18.182715+00
11	93	161	1	قهوة	20.00	1	staff	مدير النظام	t	2026-04-26 22:38:22.672414+00
12	93	161	2	شاي	10.00	1	staff	مدير النظام	t	2026-04-26 22:38:24.319035+00
13	93	161	4	عصير	15.00	1	staff	مدير النظام	t	2026-04-26 22:38:27.12571+00
14	93	161	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-04-26 22:38:30.687272+00
15	93	161	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-04-26 22:38:31.899007+00
16	94	73	4	عصير	15.00	1	staff	مدير النظام	t	2026-04-27 15:05:08.782731+00
17	94	73	5	طباعة (ورقة)	1.00	1	staff	مدير النظام	t	2026-04-27 15:05:13.744306+00
18	94	73	5	طباعة (ورقة)	1.00	1	staff	مدير النظام	t	2026-04-27 15:05:15.58132+00
19	94	73	253	طباعة ورق ألوان 	2.00	1	staff	مدير النظام	t	2026-04-27 15:05:17.195553+00
20	94	73	5	طباعة (ورقة)	1.00	1	staff	مدير النظام	t	2026-04-27 15:05:18.178687+00
21	95	161	253	طباعة ورق ألوان 	2.00	1	staff	مدير النظام	t	2026-04-27 18:47:54.885902+00
22	95	161	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-04-27 18:47:56.332911+00
23	95	161	4	عصير	15.00	1	staff	مدير النظام	t	2026-04-27 18:47:57.600374+00
24	95	161	1	قهوة	20.00	1	client	سالم عبدالواحد	f	2026-04-27 19:02:51.558549+00
25	96	161	3	مياه صغيرة 	5.00	1	client	سالم عبدالواحد	f	2026-04-27 19:05:57.649582+00
26	96	161	4	عصير	15.00	1	client	سالم عبدالواحد	f	2026-04-27 19:06:07.105608+00
27	97	75	1	قهوة	20.00	1	client	احمد عبد الرحيم ربيع	f	2026-04-27 19:15:03.317962+00
28	97	75	9	مياه كبيرة 	10.00	1	staff	مدير النظام	t	2026-04-27 19:15:44.036149+00
29	97	75	4	عصير	15.00	1	staff	مدير النظام	t	2026-04-27 19:15:45.295628+00
30	97	75	2	شاي	10.00	1	staff	مدير النظام	t	2026-04-27 19:15:47.084782+00
31	101	161	253	طباعة ورق ألوان 	2.00	1	staff	مدير النظام	t	2026-05-01 16:11:21.529083+00
32	102	161	1004	بيج شبسي 	10.00	1	staff	مدير النظام	t	2026-05-02 22:13:01.055075+00
33	103	161	2	شاي	10.00	1	staff	موظف الاستقبال	t	2026-05-02 22:16:13.633773+00
34	103	161	3	مياه صغيرة 	5.00	1	staff	موظف الاستقبال	t	2026-05-02 22:16:15.4337+00
35	104	73	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-05-03 06:01:10.545521+00
36	105	73	9	مياه كبيرة 	10.00	1	staff	حامد أحمد 	t	2026-05-03 06:13:00.073843+00
37	105	73	1004	بيج شبسي 	10.00	1	staff	حامد أحمد 	t	2026-05-03 06:13:01.773029+00
38	105	73	5	طباعة (ورقة)	1.00	1	staff	حامد أحمد 	t	2026-05-03 06:13:03.022232+00
39	105	73	253	طباعة ورق ألوان 	2.00	1	staff	حامد أحمد 	t	2026-05-03 06:13:04.029789+00
40	105	73	253	طباعة ورق ألوان 	2.00	1	staff	حامد أحمد 	t	2026-05-03 06:13:05.379176+00
41	105	73	1	قهوة	20.00	1	staff	حامد أحمد 	t	2026-05-03 06:13:06.395342+00
42	106	161	9	مياه كبيرة 	10.00	1	staff	موظف الاستقبال	t	2026-05-03 13:08:39.441084+00
43	107	631	9	مياه كبيرة 	10.00	1	staff	حامد أحمد 	t	2026-05-06 11:04:26.004941+00
44	107	631	2	شاي	10.00	1	staff	حامد أحمد 	t	2026-05-06 11:04:28.516514+00
46	109	2887	3	مياه صغيرة 	5.00	1	client	Abd Sh	f	2026-05-07 00:13:45.214136+00
47	109	2887	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-07 00:14:56.737037+00
48	109	2887	4	عصير	15.00	1	staff	مدير النظام	t	2026-05-07 00:14:57.796921+00
49	110	161	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-09 16:08:13.452909+00
50	111	76	2667	طربيزة هندسة 	5.00	1	client	Salah mohamed	f	2026-05-09 16:11:15.234175+00
51	111	76	5	طباعة (ورقة)	1.00	1	client	Salah mohamed	f	2026-05-09 16:11:23.052329+00
53	111	76	2	شاي	10.00	1	staff	مدير النظام	t	2026-05-09 16:11:50.435316+00
54	111	76	9	مياه كبيرة 	10.00	1	client	Salah mohamed	f	2026-05-09 16:13:00.10404+00
55	112	76	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-05-09 16:21:00.89343+00
56	112	76	5	طباعة (ورقة)	1.00	1	staff	مدير النظام	t	2026-05-09 16:21:02.398178+00
57	114	50	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-10 01:36:37.855862+00
58	116	74	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-10 15:31:38.720779+00
59	118	161	9	مياه كبيرة 	10.00	1	client	سالم عبدالواحد	f	2026-05-10 15:47:32.118107+00
60	118	161	2	شاي	10.00	1	client	سالم عبدالواحد	f	2026-05-10 15:47:34.706264+00
61	119	2887	1004	بيج شبسي 	10.00	1	staff	حامد أحمد 	t	2026-05-11 20:16:59.546299+00
62	120	4515	9	مياه كبيرة 	10.00	1	staff	مدير النظام	t	2026-05-12 17:25:07.512038+00
63	121	4213	2	شاي	10.00	1	staff	مدير النظام	t	2026-05-13 09:56:09.842285+00
64	128	4213	4	عصير	15.00	1	staff	مدير النظام	t	2026-05-14 00:12:59.915597+00
65	128	4213	1004	بيج شبسي 	10.00	1	staff	مدير النظام	t	2026-05-14 00:19:56.475104+00
66	130	4515	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-15 15:07:03.145299+00
67	132	2887	15	مياه	5.00	1	staff	مدير النظام	t	2026-05-15 19:49:05.862774+00
68	133	4515	1004	بيج شبسي 	10.00	1	staff	مدير النظام	t	2026-05-15 22:40:59.854869+00
69	136	4515	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-16 11:22:38.813834+00
70	136	4515	4037	ينسون 	10.00	1	staff	مدير النظام	t	2026-05-16 11:22:40.560438+00
71	136	4515	4	عصير	15.00	1	staff	مدير النظام	t	2026-05-16 11:22:42.015793+00
72	136	4515	254	مشروب غازي 	20.00	1	staff	مدير النظام	t	2026-05-16 11:22:43.257752+00
73	136	4515	4290	بتيه بالجبنة 	10.00	1	staff	مدير النظام	t	2026-05-16 11:22:45.186087+00
74	140	75	2	شاي	10.00	1	staff	مدير النظام	t	2026-05-16 11:58:44.555811+00
75	141	161	1	قهوة	20.00	1	client	سالم عبدالواحد	f	2026-05-16 12:05:17.139519+00
76	141	161	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-16 12:05:34.28693+00
78	142	4515	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-05-16 12:17:31.587228+00
79	143	73	15	مياه	5.00	1	staff	مدير النظام	t	2026-05-16 12:22:23.920513+00
80	143	73	4037	ينسون 	10.00	1	client	سالم علي	f	2026-05-16 12:23:05.677183+00
82	144	4515	1004	بيج شبسي 	10.00	1	staff	مدير النظام	t	2026-05-16 14:06:46.00885+00
83	144	4515	254	مشروب غازي 	20.00	1	staff	مدير النظام	t	2026-05-16 14:06:47.14218+00
84	144	4515	4290	بتيه بالجبنة 	10.00	1	staff	مدير النظام	t	2026-05-16 14:06:48.241042+00
85	144	4515	9	مياه كبيرة 	10.00	1	staff	مدير النظام	t	2026-05-16 14:06:50.809532+00
86	144	4515	253	طباعة ورق ألوان 	2.00	1	staff	مدير النظام	t	2026-05-16 14:06:54.97011+00
87	144	4515	253	طباعة ورق ألوان 	2.00	1	staff	مدير النظام	t	2026-05-16 14:06:55.948542+00
88	144	4515	5	طباعة (ورقة)	1.00	1	staff	مدير النظام	t	2026-05-16 14:07:02.522311+00
89	144	4515	4037	ينسون 	10.00	1	staff	مدير النظام	t	2026-05-16 14:07:03.805307+00
90	144	4515	2	شاي	10.00	1	staff	مدير النظام	t	2026-05-16 14:07:04.807867+00
91	144	4515	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-16 14:07:05.557229+00
92	151	9011	8125	مشروب مجاني 	0.00	1	staff	مدير النظام	t	2026-05-18 14:50:59.034254+00
93	155	9124	2	شاي العروسة 	10.00	1	staff	مدير النظام	t	2026-05-19 11:58:43.458025+00
94	161	8996	4037	ينسون 	10.00	1	staff	مدير النظام	t	2026-05-20 23:47:56.170975+00
95	165	4213	4290	بتيه بالجبنة 	10.00	1	staff	مدير النظام	t	2026-05-22 00:18:33.661952+00
96	165	4213	286	قهوة 	10.00	1	staff	مدير النظام	t	2026-05-22 00:18:36.16865+00
98	166	8996	8307	شاي	10.00	1	staff	مدير النظام	t	2026-05-23 15:07:20.892469+00
99	166	8996	4037	ينسون 	10.00	1	staff	مدير النظام	t	2026-05-23 15:07:22.21362+00
100	166	8996	9	مياه كبيرة 	12.00	1	client	مصطفى قمر	f	2026-05-23 15:09:25.832806+00
101	167	8996	8125	مشروب مجاني 	0.00	1	staff	مدير النظام	t	2026-05-23 15:31:36.024346+00
102	168	161	4	عصير معلب	17.00	1	client	سالم عبدالواحد	f	2026-05-23 23:20:47.567055+00
103	169	9011	15	مياه	5.00	1	staff	مدير النظام	t	2026-05-23 23:46:33.423003+00
104	170	73	1	قهوة	20.00	1	staff	مدير النظام	t	2026-05-24 12:46:20.107631+00
105	170	73	1004	بيج شبسي 	10.00	1	client	سالم علي	f	2026-05-24 12:47:09.679299+00
106	170	73	4290	بتيه بالجبنة 	10.00	1	client	سالم علي	f	2026-05-24 12:48:37.920617+00
107	170	73	4	عصير معلب	17.00	1	client	سالم علي	f	2026-05-24 12:49:22.524272+00
108	171	73	9818	زبادو	18.00	1	client	سالم علي	f	2026-05-26 22:05:43.411827+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, check_in, check_out, duration_min, price_per_hr, cost, payment_method, status, created_at, space_key, space_name, max_hours, subscription_id, is_subscription_session, created_by, guest_count) FROM stdin;
1	74	2026-03-22 16:26:17.007837+00	2026-03-22 16:26:17.071+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.007837+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
57	161	2026-04-13 07:36:38.518046+00	2026-04-13 07:36:45.645+00	1	30.00	30.00	wallet	completed	2026-04-13 07:36:38.518046+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
2	74	2026-03-22 16:26:17.099473+00	2026-03-22 16:26:17.156+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.099473+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
3	74	2026-03-22 16:26:17.173729+00	2026-03-22 16:26:17.369+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.173729+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
58	75	2026-04-13 12:52:29.620006+00	2026-04-13 12:52:36.107+00	1	30.00	30.00	wallet	completed	2026-04-13 12:52:29.620006+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
4	74	2026-03-22 16:27:53.709325+00	2026-03-22 16:27:53.872+00	1	15.00	0.25	wallet	completed	2026-03-22 16:27:53.709325+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
5	74	2026-03-22 16:27:53.937689+00	2026-03-22 16:27:54.118+00	1	15.00	0.25	wallet	completed	2026-03-22 16:27:53.937689+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
60	74	2026-04-13 12:55:10.020864+00	2026-04-13 17:43:06.799+00	288	30.00	120.00	wallet	completed	2026-04-13 12:55:10.020864+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
6	75	2026-03-22 16:55:47.060463+00	2026-03-23 06:49:04.886+00	834	15.00	208.50	wallet	completed	2026-03-22 16:55:47.060463+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
7	161	2026-03-22 23:28:29.694773+00	2026-03-24 17:20:00.961+00	2512	12.00	502.40	wallet	completed	2026-03-22 23:28:29.694773+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
8	73	2026-03-24 17:19:41.040407+00	2026-03-24 17:35:28.623+00	16	15.00	4.00	wallet	completed	2026-03-24 17:19:41.040407+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
61	76	2026-04-13 17:48:56.364132+00	2026-04-13 17:49:01.834+00	1	30.00	30.00	wallet	completed	2026-04-13 17:48:56.364132+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
9	73	2026-03-24 22:30:35.722137+00	2026-03-24 22:42:33.951+00	12	12.00	2.40	wallet	completed	2026-03-24 22:30:35.722137+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
10	73	2026-03-24 22:55:39.151875+00	2026-03-24 23:09:00.169+00	14	12.00	2.80	wallet	completed	2026-03-24 22:55:39.151875+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
11	73	2026-03-25 09:11:39.930753+00	2026-03-25 10:42:52.884+00	92	10.00	15.33	wallet	completed	2026-03-25 09:11:39.930753+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
63	76	2026-04-13 22:52:42.896368+00	2026-04-13 22:52:56.634+00	1	150.00	150.00	wallet	completed	2026-04-13 22:52:42.896368+00	meeting	غرفة الاجتماعات	12	\N	f	\N	1
12	73	2026-03-26 17:00:14.238112+00	2026-03-26 17:00:24.016+00	1	15.00	0.25	wallet	completed	2026-03-26 17:00:14.238112+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
62	161	2026-04-13 22:52:03.178183+00	2026-04-13 22:53:58.498+00	2	30.00	30.00	wallet	completed	2026-04-13 22:52:03.178183+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
13	73	2026-03-26 17:00:38.462156+00	2026-03-28 00:20:55.106+00	1881	15.00	60.00	wallet	completed	2026-03-26 17:00:38.462156+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
14	73	2026-03-28 16:40:22.146319+00	2026-03-28 16:43:20.539+00	3	15.00	0.75	wallet	completed	2026-03-28 16:40:22.146319+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
64	161	2026-04-13 22:54:28.278261+00	2026-04-13 22:54:34.338+00	1	200.00	200.00	wallet	completed	2026-04-13 22:54:28.278261+00	lessons	غرفة الدروس	12	\N	f	\N	1
15	73	2026-03-28 17:15:38.816663+00	2026-03-28 17:15:57.457+00	1	30.00	0.50	wallet	completed	2026-03-28 17:15:38.816663+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
16	161	2026-03-30 13:09:36.056537+00	2026-03-30 13:09:40.936+00	1	30.00	0.50	wallet	completed	2026-03-30 13:09:36.056537+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
59	75	2026-04-13 12:54:53.912921+00	2026-04-13 23:55:24.21+00	661	30.00	120.00	wallet	completed	2026-04-13 12:54:53.912921+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
17	73	2026-03-30 21:17:33.717131+00	2026-03-30 21:17:45.39+00	1	30.00	0.50	wallet	completed	2026-03-30 21:17:33.717131+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
18	161	2026-03-30 21:19:12.23873+00	2026-03-30 21:21:19.414+00	3	30.00	1.50	wallet	completed	2026-03-30 21:19:12.23873+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
19	161	2026-04-01 23:22:29.708089+00	2026-04-02 15:27:14.263+00	965	30.00	120.00	wallet	completed	2026-04-01 23:22:29.708089+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
65	73	2026-04-13 23:55:08.446219+00	2026-04-14 09:38:03.775+00	583	150.00	1500.00	wallet	completed	2026-04-13 23:55:08.446219+00	meeting	غرفة الاجتماعات	12	\N	f	\N	1
20	161	2026-04-02 15:28:00.386344+00	2026-04-09 17:44:24.027+00	10217	30.00	120.00	wallet	completed	2026-04-02 15:28:00.386344+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
21	73	2026-04-09 17:43:28.927434+00	2026-04-09 17:45:12.392+00	2	30.00	30.00	wallet	completed	2026-04-09 17:43:28.927434+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
22	73	2026-04-09 17:47:35.074878+00	2026-04-09 23:43:37.454+00	357	30.00	120.00	wallet	completed	2026-04-09 17:47:35.074878+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
66	76	2026-04-13 23:56:21.454531+00	2026-04-14 14:39:20.035+00	883	200.00	2400.00	wallet	completed	2026-04-13 23:56:21.454531+00	lessons	غرفة الدروس	12	\N	f	\N	1
23	73	2026-04-09 23:44:02.156463+00	2026-04-09 23:44:21.01+00	1	30.00	30.00	wallet	completed	2026-04-09 23:44:02.156463+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
68	161	2026-04-14 10:52:07.403917+00	2026-04-14 14:39:59.541+00	228	30.00	120.00	wallet	completed	2026-04-14 10:52:07.403917+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
24	73	2026-04-09 23:53:56.854953+00	2026-04-09 23:54:12.731+00	1	35.00	35.00	wallet	completed	2026-04-09 23:53:56.854953+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
25	161	2026-04-10 00:13:14.12352+00	2026-04-10 00:13:38.601+00	1	35.00	35.00	wallet	completed	2026-04-10 00:13:14.12352+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
67	65	2026-04-13 23:56:46.197474+00	2026-04-14 14:40:44.354+00	884	200.00	2400.00	wallet	completed	2026-04-13 23:56:46.197474+00	lessons	غرفة الدروس	12	\N	f	\N	1
26	161	2026-04-10 09:21:09.899437+00	2026-04-10 09:21:29.461+00	1	30.00	30.00	wallet	completed	2026-04-10 09:21:09.899437+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
69	75	2026-04-14 14:39:05.749542+00	2026-04-14 21:59:36.951+00	441	150.00	1200.00	wallet	completed	2026-04-14 14:39:05.749542+00	meeting	غرفة الاجتماعات	12	\N	f	\N	1
27	161	2026-04-10 09:30:31.116553+00	2026-04-10 09:30:37.042+00	1	30.00	30.00	wallet	completed	2026-04-10 09:30:31.116553+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
70	161	2026-04-14 14:40:17.637376+00	2026-04-14 22:00:09.114+00	440	200.00	1600.00	wallet	completed	2026-04-14 14:40:17.637376+00	lessons	غرفة الدروس	12	\N	f	\N	1
29	76	2026-04-10 13:05:33.404395+00	2026-04-10 13:05:43.241+00	1	30.00	30.00	wallet	completed	2026-04-10 13:05:33.404395+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
30	161	2026-04-10 21:07:33.163096+00	2026-04-10 21:07:48.495+00	1	30.00	30.00	wallet	completed	2026-04-10 21:07:33.163096+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
31	161	2026-04-10 21:19:04.714265+00	2026-04-10 21:19:15.673+00	1	30.00	30.00	wallet	completed	2026-04-10 21:19:04.714265+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
28	75	2026-04-10 13:05:18.673586+00	2026-04-10 22:40:26.687+00	576	30.00	120.00	wallet	completed	2026-04-10 13:05:18.673586+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
73	631	2026-04-15 09:30:02.03193+00	2026-04-15 09:31:48.726+00	2	30.00	30.00	wallet	completed	2026-04-15 09:30:02.03193+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
32	75	2026-04-10 23:24:45.733484+00	2026-04-10 23:24:57.966+00	1	30.00	30.00	wallet	completed	2026-04-10 23:24:45.733484+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
33	75	2026-04-10 23:27:23.287334+00	2026-04-10 23:27:29.324+00	1	30.00	30.00	wallet	completed	2026-04-10 23:27:23.287334+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
74	631	2026-04-15 09:42:18.383005+00	2026-04-15 09:42:23.262+00	1	30.00	30.00	wallet	completed	2026-04-15 09:42:18.383005+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
34	76	2026-04-10 23:29:50.527049+00	2026-04-10 23:30:04.989+00	1	30.00	30.00	wallet	completed	2026-04-10 23:29:50.527049+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
35	76	2026-04-10 23:41:09.881353+00	2026-04-10 23:41:17.585+00	1	30.00	30.00	wallet	completed	2026-04-10 23:41:09.881353+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
75	631	2026-04-15 09:50:21.743703+00	2026-04-15 09:50:28.934+00	1	30.00	30.00	wallet	completed	2026-04-15 09:50:21.743703+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
36	75	2026-04-10 23:42:52.017272+00	2026-04-10 23:42:59.123+00	1	30.00	30.00	wallet	completed	2026-04-10 23:42:52.017272+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
72	73	2026-04-14 22:16:05.258986+00	2026-04-15 10:03:57.534+00	708	200.00	800.00	wallet	completed	2026-04-14 22:16:05.258986+00	lessons	غرفة الدروس	4	\N	f	\N	1
37	76	2026-04-11 07:00:24.310014+00	2026-04-11 07:00:29.713+00	1	30.00	30.00	wallet	completed	2026-04-11 07:00:24.310014+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
71	74	2026-04-14 22:14:38.060792+00	2026-04-15 10:04:49.858+00	711	150.00	600.00	wallet	completed	2026-04-14 22:14:38.060792+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
38	75	2026-04-11 07:10:02.951467+00	2026-04-11 07:10:18.466+00	1	30.00	30.00	wallet	completed	2026-04-11 07:10:02.951467+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
39	76	2026-04-11 13:27:24.702161+00	2026-04-11 13:28:05.339+00	1	30.00	30.00	wallet	completed	2026-04-11 13:27:24.702161+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
40	76	2026-04-11 22:59:05.346505+00	2026-04-11 22:59:13.438+00	1	30.00	30.00	wallet	completed	2026-04-11 22:59:05.346505+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
76	631	2026-04-15 10:09:13.111833+00	2026-04-15 10:09:24.091+00	1	30.00	30.00	wallet	completed	2026-04-15 10:09:13.111833+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
41	75	2026-04-11 23:06:02.425441+00	2026-04-11 23:07:20.05+00	2	30.00	30.00	wallet	completed	2026-04-11 23:06:02.425441+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
42	76	2026-04-11 23:20:50.036592+00	2026-04-11 23:20:56.201+00	1	30.00	30.00	wallet	completed	2026-04-11 23:20:50.036592+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
43	73	2026-04-12 00:27:34.73088+00	2026-04-12 00:27:48.28+00	1	30.00	30.00	wallet	completed	2026-04-12 00:27:34.73088+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
44	161	2026-04-12 18:03:11.817178+00	2026-04-12 18:03:19.82+00	1	30.00	30.00	wallet	completed	2026-04-12 18:03:11.817178+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
45	161	2026-04-12 18:39:54.910179+00	2026-04-12 18:40:03.382+00	1	30.00	30.00	wallet	completed	2026-04-12 18:39:54.910179+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
46	161	2026-04-12 18:45:58.564089+00	2026-04-12 18:46:02.681+00	1	30.00	30.00	wallet	completed	2026-04-12 18:45:58.564089+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
47	76	2026-04-12 19:07:32.314125+00	2026-04-12 19:07:40.616+00	1	30.00	30.00	wallet	completed	2026-04-12 19:07:32.314125+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
48	76	2026-04-12 19:14:53.392601+00	2026-04-12 19:14:59.814+00	1	30.00	30.00	partial	completed	2026-04-12 19:14:53.392601+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
49	75	2026-04-12 19:16:18.442013+00	2026-04-12 20:09:08.306+00	53	30.00	30.00	wallet	completed	2026-04-12 19:16:18.442013+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
50	75	2026-04-12 20:09:53.814042+00	2026-04-12 20:09:58.438+00	1	30.00	30.00	partial	completed	2026-04-12 20:09:53.814042+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
51	76	2026-04-12 20:21:57.084353+00	2026-04-12 20:22:01.925+00	1	30.00	30.00	partial	completed	2026-04-12 20:21:57.084353+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
52	161	2026-04-12 20:32:08.975031+00	2026-04-12 20:32:13.504+00	1	30.00	30.00	partial	completed	2026-04-12 20:32:08.975031+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
53	76	2026-04-12 20:56:59.328839+00	2026-04-12 20:57:03.977+00	1	30.00	30.00	wallet	completed	2026-04-12 20:56:59.328839+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
54	73	2026-04-12 20:59:37.118545+00	2026-04-12 20:59:40.539+00	1	30.00	30.00	wallet	completed	2026-04-12 20:59:37.118545+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
55	74	2026-04-12 21:14:09.305994+00	2026-04-12 21:14:14.677+00	1	30.00	30.00	wallet	completed	2026-04-12 21:14:09.305994+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
56	76	2026-04-12 21:31:40.761888+00	2026-04-12 21:32:17.895+00	1	30.00	30.00	wallet	completed	2026-04-12 21:31:40.761888+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
77	631	2026-04-15 10:29:39.374799+00	2026-04-15 10:29:44.135+00	1	25.00	25.00	wallet	completed	2026-04-15 10:29:39.374799+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
80	75	2026-04-15 18:00:21.078488+00	2026-04-15 18:00:49.074+00	1	30.00	30.00	wallet	completed	2026-04-15 18:00:21.078488+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
78	631	2026-04-15 17:59:21.016533+00	2026-04-15 18:03:56.894+00	5	150.00	150.00	wallet	completed	2026-04-15 17:59:21.016533+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
82	65	2026-04-15 18:23:34.773609+00	2026-04-15 18:23:37.286+00	1	200.00	200.00	wallet	completed	2026-04-15 18:23:34.773609+00	lessons	غرفة الدروس	4	\N	f	\N	1
83	161	2026-04-15 18:38:10.944696+00	2026-04-15 18:38:15.539+00	1	30.00	30.00	wallet	completed	2026-04-15 18:38:10.944696+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
84	631	2026-04-15 18:44:14.28349+00	2026-04-15 18:44:22.433+00	1	200.00	200.00	wallet	completed	2026-04-15 18:44:14.28349+00	lessons	غرفة الدروس	4	\N	f	\N	1
81	75	2026-04-15 18:04:58.538923+00	2026-04-15 22:02:08.636+00	238	150.00	600.00	wallet	completed	2026-04-15 18:04:58.538923+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
85	631	2026-04-15 22:18:20.684162+00	2026-04-24 02:24:31.614+00	11767	150.00	600.00	wallet	completed	2026-04-15 22:18:20.684162+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
79	74	2026-04-15 17:59:38.610765+00	2026-04-24 02:24:51.386+00	12026	200.00	800.00	wallet	completed	2026-04-15 17:59:38.610765+00	lessons	غرفة الدروس	4	\N	f	\N	1
86	74	2026-04-24 09:58:43.769523+00	2026-04-24 09:58:56.537+00	1	150.00	150.00	partial	completed	2026-04-24 09:58:43.769523+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
87	73	2026-04-25 13:05:13.291656+00	2026-04-25 13:05:22.468+00	1	30.00	30.00	wallet	completed	2026-04-25 13:05:13.291656+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
88	73	2026-04-25 13:08:33.242969+00	2026-04-25 13:08:43.244+00	1	200.00	200.00	wallet	completed	2026-04-25 13:08:33.242969+00	lessons	غرفة الدروس	4	\N	f	\N	1
89	73	2026-04-25 13:28:49.804939+00	2026-04-25 13:29:04.577+00	1	30.00	30.00	wallet	completed	2026-04-25 13:28:49.804939+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
90	161	2026-04-25 20:16:32.127525+00	2026-04-25 22:32:27.361+00	136	30.00	90.00	wallet	completed	2026-04-25 20:16:32.127525+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
91	161	2026-04-26 18:09:58.31643+00	2026-04-26 18:24:45.022+00	15	30.00	30.00	wallet	completed	2026-04-26 18:09:58.31643+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
92	161	2026-04-26 18:26:04.723678+00	2026-04-26 22:37:22.569+00	252	150.00	600.00	wallet	completed	2026-04-26 18:26:04.723678+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
93	161	2026-04-26 22:38:12.957275+00	2026-04-26 22:39:01.326+00	1	200.00	200.00	wallet	completed	2026-04-26 22:38:12.957275+00	lessons	غرفة الدروس	4	\N	f	\N	1
94	73	2026-04-27 15:04:58.014193+00	2026-04-27 15:05:25.769+00	1	0.00	0.00	wallet	completed	2026-04-27 15:04:58.014193+00	cowork	منطقة العمل المشتركة	4	1	t	\N	1
95	161	2026-04-27 18:47:49.462318+00	2026-04-27 19:05:09.663+00	18	30.00	30.00	wallet	completed	2026-04-27 18:47:49.462318+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
96	161	2026-04-27 19:05:40.803759+00	2026-04-27 22:29:25.013+00	204	150.00	600.00	wallet	completed	2026-04-27 19:05:40.803759+00	meeting	غرفة الاجتماعات	4	\N	f	\N	1
97	75	2026-04-27 19:09:29.041399+00	2026-04-27 22:29:56.862+00	201	30.00	120.00	wallet	completed	2026-04-27 19:09:29.041399+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
98	76	2026-04-30 18:22:02.164598+00	2026-04-30 18:22:08.858+00	1	30.00	30.00	wallet	completed	2026-04-30 18:22:02.164598+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
99	161	2026-04-30 18:22:50.158879+00	2026-04-30 18:22:55.76+00	1	30.00	30.00	wallet	completed	2026-04-30 18:22:50.158879+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
100	161	2026-04-30 18:36:50.588954+00	2026-04-30 18:36:57.618+00	1	30.00	30.00	wallet	completed	2026-04-30 18:36:50.588954+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
101	161	2026-05-01 16:11:04.833332+00	2026-05-01 16:11:28.563+00	1	30.00	30.00	wallet	completed	2026-05-01 16:11:04.833332+00	cowork	منطقة العمل المشتركة	4	\N	f	\N	1
102	161	2026-05-02 22:12:48.205599+00	2026-05-02 22:13:18.669+00	1	200.00	200.00	wallet	completed	2026-05-02 22:12:48.205599+00	lessons	غرفة الدروس	4	\N	f	1	1
103	161	2026-05-02 22:16:06.627879+00	2026-05-02 22:16:26.807+00	1	30.00	30.00	wallet	completed	2026-05-02 22:16:06.627879+00	cowork	منطقة العمل المشتركة	4	\N	f	2	1
104	73	2026-05-03 06:01:04.368537+00	2026-05-03 06:01:16.808+00	1	0.00	0.00	wallet	completed	2026-05-03 06:01:04.368537+00	cowork	منطقة العمل المشتركة	4	1	t	1	1
105	73	2026-05-03 06:12:54.918429+00	2026-05-03 06:13:12.657+00	1	0.00	0.00	wallet	completed	2026-05-03 06:12:54.918429+00	cowork	منطقة العمل المشتركة	4	1	t	2291	1
106	161	2026-05-03 13:08:34.259845+00	2026-05-03 13:08:44.392+00	1	30.00	30.00	wallet	completed	2026-05-03 13:08:34.259845+00	cowork	منطقة العمل المشتركة	4	\N	f	2	1
107	631	2026-05-06 11:04:18.063708+00	2026-05-06 11:04:32.582+00	1	30.00	30.00	wallet	completed	2026-05-06 11:04:18.063708+00	cowork	منطقة العمل المشتركة	4	\N	f	2291	1
108	76	2026-05-06 11:05:33.615825+00	2026-05-06 11:05:41.485+00	1	30.00	30.00	wallet	completed	2026-05-06 11:05:33.615825+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
163	8996	2026-05-21 21:17:30.983745+00	2026-05-21 21:17:36.707+00	1	25.00	25.00	wallet	completed	2026-05-21 21:17:30.983745+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
109	2887	2026-05-07 00:13:05.661463+00	2026-05-07 00:15:49.701+00	3	30.00	30.00	wallet	completed	2026-05-07 00:13:05.661463+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
111	76	2026-05-09 16:10:47.016915+00	2026-05-09 16:13:07.25+00	3	30.00	30.00	wallet	completed	2026-05-09 16:10:47.016915+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
110	161	2026-05-09 16:06:28.708919+00	2026-05-09 16:17:21.108+00	11	30.00	30.00	wallet	completed	2026-05-09 16:06:28.708919+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
112	76	2026-05-09 16:20:48.572408+00	2026-05-09 16:21:12.295+00	1	150.00	150.00	wallet	completed	2026-05-09 16:20:48.572408+00	meeting	غرفة الاجتماعات	4	\N	f	1	1
113	73	2026-05-09 16:30:16.003764+00	2026-05-09 16:30:45.308+00	1	0.00	0.00	wallet	completed	2026-05-09 16:30:16.003764+00	cowork	منطقة العمل المشتركة	4	1	t	1	1
114	50	2026-05-10 01:36:25.121289+00	2026-05-10 01:36:47.553+00	1	30.00	30.00	wallet	completed	2026-05-10 01:36:25.121289+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
115	161	2026-05-10 13:11:29.516914+00	2026-05-10 13:11:38.738+00	1	30.00	30.00	wallet	completed	2026-05-10 13:11:29.516914+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
118	161	2026-05-10 15:32:52.232699+00	2026-05-10 18:43:27.564+00	191	30.00	120.00	wallet	completed	2026-05-10 15:32:52.232699+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
116	74	2026-05-10 14:42:07.150393+00	2026-05-10 18:44:18.805+00	243	30.00	120.00	wallet	completed	2026-05-10 14:42:07.150393+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
117	2887	2026-05-10 14:42:23.548059+00	2026-05-10 18:44:47.395+00	243	200.00	200.00	wallet	completed	2026-05-10 14:42:23.548059+00	lessons	غرفة الدروس	1	\N	f	1	1
119	2887	2026-05-11 20:16:44.634081+00	2026-05-11 20:17:07.884+00	1	30.00	30.00	wallet	completed	2026-05-11 20:16:44.634081+00	cowork	منطقة العمل المشتركة	4	\N	f	2291	1
120	4515	2026-05-12 17:24:31.262172+00	2026-05-12 17:25:16.847+00	1	30.00	30.00	wallet	completed	2026-05-12 17:24:31.262172+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
121	4213	2026-05-13 09:54:44.495511+00	2026-05-13 09:56:17.977+00	2	30.00	30.00	wallet	completed	2026-05-13 09:54:44.495511+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
122	4515	2026-05-13 13:47:03.748938+00	2026-05-13 13:54:41.97+00	8	30.00	30.00	wallet	completed	2026-05-13 13:47:03.748938+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
123	4213	2026-05-13 14:25:54.441467+00	2026-05-13 14:26:06.282+00	1	30.00	30.00	wallet	completed	2026-05-13 14:25:54.441467+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
124	4515	2026-05-13 17:07:07.408154+00	2026-05-13 17:07:20.503+00	1	30.00	30.00	wallet	completed	2026-05-13 17:07:07.408154+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
125	4515	2026-05-13 17:09:19.306763+00	2026-05-13 17:09:47.307+00	1	30.00	30.00	wallet	completed	2026-05-13 17:09:19.306763+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
126	4515	2026-05-13 21:05:28.699631+00	2026-05-13 21:05:57.803+00	1	30.00	30.00	wallet	completed	2026-05-13 21:05:28.699631+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
127	4515	2026-05-13 22:58:17.102678+00	2026-05-13 22:58:52.133+00	1	30.00	30.00	wallet	completed	2026-05-13 22:58:17.102678+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
128	4213	2026-05-13 23:45:23.654863+00	2026-05-14 23:40:53.714+00	1436	30.00	120.00	wallet	completed	2026-05-13 23:45:23.654863+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
129	4515	2026-05-15 08:49:41.792345+00	2026-05-15 08:49:55.022+00	1	30.00	90.00	wallet	completed	2026-05-15 08:49:41.792345+00	cowork	منطقة العمل المشتركة	4	\N	f	1	3
130	4515	2026-05-15 15:06:52.675829+00	2026-05-15 15:07:09.059+00	1	30.00	30.00	wallet	completed	2026-05-15 15:06:52.675829+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
131	75	2026-05-15 15:13:55.670669+00	2026-05-15 15:14:00.643+00	1	30.00	150.00	wallet	completed	2026-05-15 15:13:55.670669+00	cowork	منطقة العمل المشتركة	4	\N	f	1	5
132	2887	2026-05-15 19:48:58.717501+00	2026-05-15 19:49:21.31+00	1	30.00	60.00	wallet	completed	2026-05-15 19:48:58.717501+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
133	4515	2026-05-15 22:40:53.750823+00	2026-05-15 22:41:06.846+00	1	30.00	30.00	wallet	completed	2026-05-15 22:40:53.750823+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
134	161	2026-05-15 22:41:49.786499+00	2026-05-15 22:41:58.563+00	1	30.00	60.00	wallet	completed	2026-05-15 22:41:49.786499+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
135	161	2026-05-15 22:43:45.313514+00	2026-05-16 01:41:52.481+00	179	30.00	90.00	wallet	completed	2026-05-15 22:43:45.313514+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
136	4515	2026-05-16 11:22:33.182844+00	2026-05-16 11:22:53.778+00	1	30.00	210.00	wallet	completed	2026-05-16 11:22:33.182844+00	cowork	منطقة العمل المشتركة	4	\N	f	1	7
137	4213	2026-05-16 11:26:40.216796+00	2026-05-16 11:26:46.124+00	1	30.00	30.00	wallet	completed	2026-05-16 11:26:40.216796+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
138	2887	2026-05-16 11:35:13.017517+00	2026-05-16 11:35:18.942+00	1	30.00	90.00	wallet	completed	2026-05-16 11:35:13.017517+00	cowork	منطقة العمل المشتركة	4	\N	f	1	3
139	161	2026-05-16 11:50:15.921924+00	2026-05-16 11:50:28.893+00	1	30.00	60.00	wallet	completed	2026-05-16 11:50:15.921924+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
140	75	2026-05-16 11:58:22.551862+00	2026-05-16 11:59:26.988+00	2	30.00	150.00	wallet	completed	2026-05-16 11:58:22.551862+00	cowork	منطقة العمل المشتركة	4	\N	f	1	5
141	161	2026-05-16 12:02:41.093186+00	2026-05-16 12:08:05.723+00	6	30.00	30.00	wallet	completed	2026-05-16 12:02:41.093186+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
143	73	2026-05-16 12:22:13.608812+00	2026-05-16 12:24:00.532+00	2	0.00	0.00	wallet	completed	2026-05-16 12:22:13.608812+00	cowork	منطقة العمل المشتركة	4	1	t	1	1
142	4515	2026-05-16 12:15:03.91271+00	2026-05-16 13:56:53.636+00	102	30.00	60.00	wallet	completed	2026-05-16 12:15:03.91271+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
144	4515	2026-05-16 14:06:41.53167+00	2026-05-16 14:09:30.648+00	3	30.00	180.00	wallet	completed	2026-05-16 14:06:41.53167+00	cowork	منطقة العمل المشتركة	4	\N	f	1	6
145	4213	2026-05-16 23:47:23.513781+00	2026-05-16 23:47:36.426+00	1	30.00	60.00	wallet	completed	2026-05-16 23:47:23.513781+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
146	2887	2026-05-17 00:13:49.248482+00	2026-05-17 00:13:53.658+00	1	30.00	30.00	wallet	completed	2026-05-17 00:13:49.248482+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
147	9011	2026-05-17 20:17:46.734415+00	2026-05-17 20:23:22.298+00	6	30.00	120.00	wallet	completed	2026-05-17 20:17:46.734415+00	cowork	منطقة العمل المشتركة	4	\N	f	1	4
148	9011	2026-05-17 20:23:59.378606+00	2026-05-17 20:24:04.908+00	1	25.00	25.00	wallet	completed	2026-05-17 20:23:59.378606+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
149	8996	2026-05-17 20:28:02.839942+00	2026-05-17 20:28:11.272+00	1	25.00	25.00	wallet	completed	2026-05-17 20:28:02.839942+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
150	8996	2026-05-17 20:28:38.915457+00	2026-05-17 20:28:42.931+00	1	25.00	25.00	wallet	completed	2026-05-17 20:28:38.915457+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
152	161	2026-05-18 13:51:48.043901+00	2026-05-18 13:53:26.601+00	2	25.00	25.00	wallet	completed	2026-05-18 13:51:48.043901+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
151	9011	2026-05-18 13:46:04.099135+00	2026-05-18 23:54:24.941+00	609	25.00	100.00	wallet	completed	2026-05-18 13:46:04.099135+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
153	76	2026-05-18 17:41:15.40284+00	2026-05-19 00:05:34.827+00	385	25.00	100.00	wallet	completed	2026-05-18 17:41:15.40284+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
154	8996	2026-05-19 00:07:03.155698+00	2026-05-19 00:07:08.812+00	1	25.00	25.00	wallet	completed	2026-05-19 00:07:03.155698+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
164	8996	2026-05-21 21:30:43.857786+00	2026-05-21 21:30:50.034+00	1	25.00	25.00	wallet	completed	2026-05-21 21:30:43.857786+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
157	9011	2026-05-19 14:01:48.986606+00	2026-05-19 14:01:53.204+00	1	25.00	25.00	wallet	completed	2026-05-19 14:01:48.986606+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
158	9011	2026-05-19 14:03:06.509846+00	2026-05-19 14:03:44.865+00	1	25.00	100.00	wallet	completed	2026-05-19 14:03:06.509846+00	cowork	منطقة العمل المشتركة	4	\N	f	1	4
156	8996	2026-05-19 11:59:29.739048+00	2026-05-19 22:48:41.957+00	650	25.00	100.00	wallet	completed	2026-05-19 11:59:29.739048+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
165	4213	2026-05-22 00:18:04.929861+00	2026-05-22 00:34:07.293+00	17	25.00	75.00	wallet	completed	2026-05-22 00:18:04.929861+00	cowork	منطقة العمل المشتركة	4	\N	f	1	3
160	8996	2026-05-19 23:06:25.702887+00	2026-05-19 23:06:34.067+00	1	25.00	25.00	wallet	completed	2026-05-19 23:06:25.702887+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
159	9011	2026-05-19 22:48:19.449944+00	2026-05-20 00:51:10.738+00	123	25.00	300.00	wallet	completed	2026-05-19 22:48:19.449944+00	cowork	منطقة العمل المشتركة	4	\N	f	1	4
155	9124	2026-05-19 11:58:12.705314+00	2026-05-20 00:57:25.318+00	780	0.00	0.00	wallet	completed	2026-05-19 11:58:12.705314+00	cowork	منطقة العمل المشتركة	4	2	t	1	1
161	8996	2026-05-20 23:47:37.455744+00	2026-05-20 23:48:03.286+00	1	25.00	75.00	wallet	completed	2026-05-20 23:47:37.455744+00	cowork	منطقة العمل المشتركة	4	\N	f	1	3
166	8996	2026-05-23 15:03:56.49974+00	2026-05-23 15:10:43.035+00	7	25.00	50.00	wallet	completed	2026-05-23 15:03:56.49974+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
162	8996	2026-05-20 23:51:43.283464+00	2026-05-21 11:15:31.437+00	684	25.00	200.00	wallet	completed	2026-05-20 23:51:43.283464+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
168	161	2026-05-23 23:19:44.908364+00	2026-05-23 23:21:39.113+00	2	25.00	25.00	wallet	completed	2026-05-23 23:19:44.908364+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
170	73	2026-05-24 12:45:03.801144+00	2026-05-24 12:54:36.756+00	10	0.00	0.00	wallet	completed	2026-05-24 12:45:03.801144+00	cowork	منطقة العمل المشتركة	4	1	t	1	1
167	8996	2026-05-23 15:31:25.784137+00	2026-05-24 16:44:56.896+00	1514	25.00	100.00	wallet	completed	2026-05-23 15:31:25.784137+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
169	9011	2026-05-23 23:46:16.111176+00	2026-05-24 16:45:42.724+00	1020	25.00	100.00	wallet	completed	2026-05-23 23:46:16.111176+00	cowork	منطقة العمل المشتركة	4	\N	f	1	1
171	73	2026-05-25 00:22:25.638716+00	2026-05-26 22:06:06.036+00	2744	25.00	200.00	wallet	completed	2026-05-25 00:22:25.638716+00	cowork	منطقة العمل المشتركة	4	\N	f	1	2
\.


--
-- Data for Name: space_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.space_settings (id, space_key, name, first_hour, extra_hour, max_hours, updated_at) FROM stdin;
2	meeting	غرفة الاجتماعات	150.00	100.00	1	2026-04-10 00:22:06.182329+00
3	lessons	غرفة الدروس	200.00	100.00	1	2026-04-10 00:21:58.238988+00
1	cowork	منطقة العمل المشتركة	25.00	30.00	4	2026-05-17 20:22:42.830621+00
\.


--
-- Data for Name: staff_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_permissions (id, user_id, can_view_all, can_edit_prices, can_charge_wallet, can_add_points, notes, created_at, updated_at) FROM stdin;
15	2972	f	f	t	t	\N	2026-05-07 15:20:40.750703+00	2026-05-07 15:20:40.750703+00
17	3057	f	f	t	t	\N	2026-05-07 22:27:01.334572+00	2026-05-07 22:27:01.334572+00
1	2291	f	f	f	f	\N	2026-05-02 21:48:53.793165+00	2026-05-07 22:28:41.032166+00
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, price, features, discount_rooms, is_active, created_at, updated_at, covers_cowork) FROM stdin;
1	باقة أساسية	1200.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-24 22:39:49.177984+00	2026-04-25 14:05:47.561017+00	t
2	باقة بريميوم	1600.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-24 22:39:49.177984+00	2026-04-25 14:06:05.420498+00	t
3	باقة VIP	2300.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-24 22:39:49.177984+00	2026-04-25 14:06:35.575442+00	t
\.


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_subscriptions (id, user_id, plan_id, plan_name, plan_price, discount_rooms, covers_cowork, start_date, end_date, status, payment_method, note, created_at, cancel_reason, cancelled_at) FROM stdin;
2	9124	2	باقة بريميوم	1600.00	20	t	2026-05-17 23:24:43.959035+00	2026-06-15 23:24:44.234+00	active	cash	\N	2026-05-17 23:24:43.959035+00	\N	\N
1	73	1	باقة أساسية	1200.00	0	t	2026-04-25 14:06:56.366856+00	2026-05-24 14:06:56.642+00	expired	cash	\N	2026-04-25 14:06:56.366856+00	\N	\N
3	73	3	باقة VIP	2300.00	40	t	2026-05-26 22:38:43.195518+00	2026-06-24 22:38:43.462+00	cancelled	cash	\N	2026-05-26 22:38:43.195518+00	طلب العميل هذا لأنه يريت ان يتحول على الباقة الاساسية	2026-05-26 22:40:12.16404+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, phone, password, role, balance, points, qr_code, is_active, created_at, updated_at, qr_image, email, email_verified, reset_otp, reset_otp_expires, can_charge_wallet, can_add_points, can_edit_prices, can_create_coupons, can_view_reports, avatar_url, referral_code, referred_by, referral_count, referral_earned_points) FROM stdin;
1	مدير النظام	01000000000	$2a$12$07JTMuoPPatRGn9Yg8U5OOEkZPZYivXHBWa5pfEaHpZNG2DWJGvx.	admin	0.00	0	89aee623-c440-42d1-b32d-1f0edc6e672a	t	2026-03-21 13:11:58.641053+00	2026-03-21 13:11:58.641053+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	\N	\N	0	0
2	موظف الاستقبال	01100000000	$2a$12$/lhv1O7/gT2o/mEfOeNMxuV4vj49Y47UYC1q9bIC9a.Pr0aZlWFLu	staff	0.00	0	b091fcee-30e0-4250-8c07-5e7019d6e14e	t	2026-03-21 13:11:58.644617+00	2026-03-21 13:11:58.644617+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	\N	\N	0	0
2972	سالم المسلام 	01000123456	$2b$12$OM38PIZvd4DAOWUUXzj7aOfs2xTrljlwk2dPiAimR6sqH391XHLUy	staff	0.00	0	\N	t	2026-05-07 15:20:40.601326+00	2026-05-07 15:20:40.601326+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	\N	\N	0	0
73	سالم علي	01029947833	$2a$12$2l7rINl0qmphBQPBBWiJwu06XKqNcMJI8rOMNwb0mjGtAbYNWFVBK	client	0.00	83	7027644	t	2026-03-21 22:13:02.495873+00	2026-05-24 12:58:08.43196+00	\N	salem.abdulradi@gmail.com	f	\N	\N	f	f	f	f	f	https://res.cloudinary.com/dldzk1eqj/image/upload/v1779627487/linkspace/avatars/hbjxnr2qqmvv7h9vi9uo.jpg	-0103	\N	0	0
3057	صلاح محمد 	01000984634	$2b$12$wZnkVXmaI8FYt8aCZ18KEODmlbtfrgER2SokfIvtyTf3IkL1fi3.2	staff	0.00	0	\N	t	2026-05-07 22:27:01.249371+00	2026-05-07 22:27:01.249371+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	\N	\N	0	0
2291	حامد أحمد 	01001234567	$2a$12$tXw9/ziW6z/97Lm.lDVMoeYkxFiCwtpcsJp4AibRczjyzdKB1MZ0G	staff	0.00	0	\N	t	2026-05-02 21:48:53.70793+00	2026-05-02 21:48:53.70793+00	\N	hamed.ahmed.linlk@gmail.com	f	\N	\N	f	f	f	f	f	\N	\N	\N	0	0
3	أحمد محمد السيد	01012345678	$2a$12$me4Exf2tPJsX.rRcpgCCSebzykXtP7E5CGlu0HGlUp4/DwvRv69eC	client	145.50	87	5ca5f5e8-2a4c-4528-9ff8-ee2d5f4e27d6	t	2026-03-21 13:11:58.905618+00	2026-03-21 13:11:58.905618+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-ADDB	\N	0	0
4	سارة خالد إبراهيم	01123456789	$2a$12$s5mmf2.Tq14WPhIg/JtBfeIy1oGv7ADh2YDG7dHaQaQUMw1mbp0Xa	client	80.00	45	30d1f6cb-4bd3-468b-83b1-f3fc40df147b	t	2026-03-21 13:11:59.163901+00	2026-03-21 13:11:59.163901+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-0F2A	\N	0	0
5	محمد علي حسن	01234567890	$2a$12$8x2FGPirRr3U0EjWWY4gNeix2trM2ni0wIvqqcUP7hA5S7ZmpVMVW	client	200.00	120	85abf253-397a-4e75-b11c-054b9f8f36b3	t	2026-03-21 13:11:59.424733+00	2026-03-21 13:11:59.424733+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-8674	\N	0	0
6	نورا حسن أحمد	01345678901	$2a$12$pqxFFt5R7uy5OVvv1Rzb.u6DuPNpooHTiRaS8MFrxEYcCjcFXpKjy	client	50.00	20	bd525bb9-1ffa-409c-8709-17140a5406df	t	2026-03-21 13:11:59.683317+00	2026-03-21 13:11:59.683317+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-01D0	\N	0	0
7	كريم عبدالله	01456789012	$2a$12$UkW1uURkOXLkUrAG1EOXCOeNy.h/LmshVbln2V4TaMWRSpQv/DwW6	client	310.00	180	ce7bba68-2a8e-48e7-8433-24d55b3d119c	t	2026-03-21 13:11:59.941723+00	2026-03-21 13:11:59.941723+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-8F44	\N	0	0
65	سالم راضي	01029947832	$2a$12$ctDVj.V48s2cykEPLP8gt.tRH7YLfdlHwPfP5Qexav.t5orBRAFqC	client	0.00	160	4970823	t	2026-03-21 17:52:16.76334+00	2026-03-21 17:52:16.76334+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-EC35	\N	0	0
631	A. Sh	01045326581	$2a$12$myvH2gSw/BVpeihdc1fjS.j4peToOEGORoE.pTspr4ydeCD9U3NKi	client	0.00	113	3062212	t	2026-04-15 09:21:12.32619+00	2026-04-15 09:21:12.32619+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	ASH-D2FD	\N	0	0
8996	مصطفى قمر	01029947837	$2a$12$zfaozWNhi.cIYD43p.9zR.Nn/vfbUZzFV4Pl1pXII8rji3zb6C59.	client	0.00	64	4349245	t	2026-05-17 20:08:53.785036+00	2026-05-17 20:08:53.785036+00	\N	moftafa.mohamed.link@gmail.com	f	\N	\N	f	f	f	f	f	\N	REF-UA0D	\N	0	0
9011	قمر قمر	01029947838	$2a$12$qNLltyuRY7Zy4oXxF5mzousqx8PDnG4kXTI/tGgow.Li5Y60foj0W	client	0.00	76	3576587	t	2026-05-17 20:11:10.509347+00	2026-05-17 20:11:10.509347+00	\N	Tb3.moftafaqmarll.link@gmail.com	f	\N	\N	f	f	f	f	f	\N	REF-ZXTO	\N	0	0
75	احمد عبد الرحيم ربيع	01019839140	$2a$12$OcJ1ldKqVyG84Wxle5pxMeC11hfXdKUHu.golKW94X2EK7SozP1sa	client	20.00	293	3478485	t	2026-03-21 22:35:08.397302+00	2026-05-12 15:32:41.239639+00	\N	raheemmedo712@gmail.com	f	645095	2026-04-30 22:10:15.745+00	f	f	f	f	f	https://res.cloudinary.com/dldzk1eqj/image/upload/v1778599959/linkspace/avatars/vnqrfh4pyx4ewvank9sv.jpg	-0ABC	\N	0	0
50	سالم عبدالراضي	01029947831	$2a$12$M.NJtNQxp6sPcFFjFAFw6.5FsIoOhShNA2pTzTH13EOl.ZC0wyBJK	client	0.00	3	5421ed31-f739-4fa2-a45a-3df5ba0f8b89	t	2026-03-21 16:20:28.831894+00	2026-03-21 16:20:28.831894+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	-4BA6	\N	0	0
4515	محمود فتحي	01029947836	$2a$12$zdhmTrp5T0mlsPbIjoHdXu/0Z01Dlwmk4VNInfZSynjs9XynZT2de	client	0.00	78	9294946	t	2026-05-12 00:01:31.642865+00	2026-05-16 12:19:18.516245+00	\N	mahmud.fathi.link@gmail.com	f	\N	\N	f	f	f	f	f	https://res.cloudinary.com/dldzk1eqj/image/upload/v1778933957/linkspace/avatars/dlah28qvgo1oia79lgcq.jpg	-3188	\N	0	0
74	محمد عبد الراضي	01096267021	$2a$12$N.lf8rzBkxEPXk.aFzBJkOQ7PkGKoHU1Mi7tKX.GWOnKDcHWuQv.m	client	0.00	82	6866201	t	2026-03-21 22:16:22.96538+00	2026-04-29 23:07:47.351404+00	\N	mb161676@gmail.com	f	818462	2026-04-30 22:13:15.193+00	f	f	f	f	f	\N	-E7B4	\N	0	0
2887	Abd Sh	01000000001	$2a$12$5hbHHuvKaUd1KgoKp3vAOOvxKnjfDsh7rNWmwg2QMKNPXktgNfSgW	client	0.00	44	5078242	t	2026-05-07 00:11:44.06677+00	2026-05-07 00:12:54.402205+00	\N	a.b000771@gmail.com	f	\N	\N	f	f	f	f	f	\N	ABDS-7907	\N	0	0
9124	الكبير أوي	01029947839	$2a$12$mRwgteHx08FRbuyztUVJ/.6IbYFuPDnyo2fn1eRWy5eTzRhIbt9u2	client	0.00	0	2158503	t	2026-05-17 23:22:06.431347+00	2026-05-17 23:22:06.431347+00	\N	alkabeer.link@gmail.com	f	\N	\N	f	f	f	f	f	\N	REF-CWZX	161	0	0
76	Salah mohamed	01000984633	$2a$12$i2/RhN4IpmB2nqNZ/rdvse1jbpHWfx6IL9qaYvJe/EJ58NaW1IVOy	client	0.00	348	5017682	t	2026-03-21 22:46:42.236387+00	2026-05-12 16:16:08.559738+00	\N	salahalsafah64@gmail.com	f	\N	\N	f	f	f	f	f	https://res.cloudinary.com/dldzk1eqj/image/upload/v1778602567/linkspace/avatars/hxjeoyz5fywjrzp5xrso.jpg	SALA-CF94	\N	0	0
4213	Yousef	01111750379	$2a$12$BJOGA68jqUT.rT1.P92HKu5IJN/wIBwVGJVfGs2.k2PSyoqrpjVZe	client	0.00	34	6830918	t	2026-05-11 16:43:50.72356+00	2026-05-11 16:43:50.72356+00	\N	\N	f	\N	\N	f	f	f	f	f	\N	YOUS-526A	\N	0	0
161	سالم عبدالواحد	01029947834	$2a$12$aM5G3Aw7UyhsJG7cE0Y.2uZcThPSKrohkdSqwXljuldKZ7BD4zy9i	client	0.00	388	7536108	t	2026-03-22 17:43:51.399835+00	2026-05-10 18:48:13.761791+00	\N	salem.abdul-radi@hotmail.com	f	221761	2026-04-30 22:27:54.363+00	f	f	f	f	f	https://res.cloudinary.com/dldzk1eqj/image/upload/v1778438893/linkspace/avatars/h58ftnxot4wnijtiyo33.jpg	-CE5A	\N	1	150
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_transactions (id, user_id, type, amount, description, created_at) FROM stdin;
1	76	credit	50.00	شحن يدوي من الإدارة	2026-03-22 12:39:18.20194+00
2	75	credit	1.00	شحن يدوي من الإدارة	2026-03-22 13:11:48.689949+00
3	76	debit	30.00	خصم تكلفة جلسة	2026-04-10 13:05:43.234206+00
4	75	credit	5.00	شحن يدوي من الإدارة	2026-04-10 21:20:46.514572+00
5	75	credit	1.00	شحن يدوي من الإدارة	2026-04-10 23:27:16.390892+00
6	76	debit	20.00	فاتورة #INV-656022 (+ 10.00 ج كاش)	2026-04-11 23:21:02.116635+00
7	76	credit	30.00	شحن يدوي من الإدارة	2026-04-12 17:58:13.999533+00
8	161	credit	30.00	شحن يدوي من الإدارة	2026-04-12 18:39:45.324634+00
9	161	debit	30.00	خصم تكلفة جلسة	2026-04-12 18:40:03.380441+00
10	161	credit	20.00	شحن يدوي من الإدارة	2026-04-12 18:45:52.208128+00
11	161	debit	20.00	فاتورة #INV-564721 (+ 35.00 ج كاش)	2026-04-12 18:46:17.487396+00
12	76	debit	30.00	خصم تكلفة جلسة	2026-04-12 19:15:13.723182+00
13	75	debit	7.00	خصم تكلفة جلسة	2026-04-12 20:10:39.651807+00
14	76	credit	7.00	شحن يدوي من الإدارة	2026-04-12 20:20:26.121379+00
15	76	debit	7.00	خصم تكلفة جلسة	2026-04-12 20:22:47.310826+00
16	161	credit	5.00	شحن يدوي من الإدارة	2026-04-12 20:32:04.808853+00
17	161	debit	5.00	خصم تكلفة جلسة	2026-04-12 20:32:25.192346+00
18	76	credit	5.00	شحن يدوي من الإدارة	2026-04-12 20:56:52.555224+00
19	76	debit	5.00	فاتورة #INV-424343 (+ 59.00 ج كاش)	2026-04-12 20:57:22.609694+00
20	74	credit	50.00	شحن يدوي من الإدارة	2026-04-12 21:14:03.790612+00
21	74	debit	40.00	خصم تكلفة جلسة	2026-04-12 21:15:06.958461+00
22	74	debit	10.00	فاتورة #INV-455050 (+ 30.00 ج كاش)	2026-04-12 21:15:07.618786+00
23	76	credit	40.00	شحن يدوي من الإدارة	2026-04-12 21:31:29.306392+00
24	76	debit	30.00	خصم تكلفة جلسة	2026-04-12 21:32:26.622668+00
25	76	debit	10.00	فاتورة #INV-538308 (+ 20.00 ج كاش)	2026-04-12 21:32:27.147514+00
26	161	credit	70.00	شحن يدوي من الإدارة	2026-04-13 07:36:23.351424+00
27	161	debit	65.00	فاتورة #INV-805429	2026-04-13 07:37:22.154201+00
28	75	credit	70.00	شحن يدوي من الإدارة	2026-04-13 12:52:13.940491+00
29	75	debit	55.00	فاتورة #INV-756585	2026-04-13 12:52:56.085048+00
30	75	debit	15.00	فاتورة #INV-524407 (+ 105.00 ج كاش)	2026-04-13 23:55:35.48046+00
31	631	credit	50.00	شحن يدوي من الإدارة	2026-04-15 09:53:16.922375+00
32	631	debit	30.00	خصم تكلفة جلسة	2026-04-15 10:09:44.135787+00
33	631	debit	20.00	فاتورة #INV-764896 (+ 10.00 ج كاش)	2026-04-15 10:09:44.811077+00
34	631	credit	20.00	شحن يدوي من الإدارة	2026-04-15 18:00:03.118182+00
35	75	credit	50.00	شحن يدوي من الإدارة	2026-04-15 18:00:15.20018+00
36	75	debit	30.00	فاتورة #INV-052481	2026-04-15 18:01:09.533373+00
37	631	debit	20.00	فاتورة #INV-238223 (+ 130.00 ج كاش)	2026-04-15 18:04:08.052042+00
38	74	credit	10.00	شحن يدوي من الإدارة	2026-04-15 18:04:36.568071+00
39	161	debit	5.00	فاتورة #INV-380504 (+ 109.00 ج كاش)	2026-04-15 18:40:00.674801+00
40	631	credit	100.00	شحن يدوي من الإدارة	2026-04-15 18:44:05.703751+00
41	631	debit	100.00	فاتورة #INV-663752 (+ 145.00 ج كاش)	2026-04-15 18:44:47.401095+00
42	75	debit	20.00	فاتورة #INV-529131 (+ 625.00 ج كاش)	2026-04-15 22:02:43.960532+00
43	74	debit	10.00	خصم تكلفة جلسة	2026-04-24 10:02:25.207948+00
44	73	credit	50.00	شحن يدوي من الإدارة	2026-04-25 12:56:10.943177+00
45	73	debit	30.00	فاتورة #INV-322979	2026-04-25 13:05:52.869368+00
46	73	debit	20.00	فاتورة #INV-523774 (+ 220.00 ج كاش)	2026-04-25 13:09:04.971667+00
47	75	credit	20.00	شحن يدوي من الإدارة	2026-04-27 19:24:20.742639+00
48	76	credit	24.00	شحن يدوي من الإدارة	2026-05-09 16:19:33.644337+00
49	76	debit	24.00	فاتورة #INV-672683 (+ 137.00 ج كاش)	2026-05-09 16:23:18.153129+00
\.


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 23, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 157, true);


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playing_with_neon_id_seq', 10, true);


--
-- Name: price_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.price_settings_id_seq', 5310, true);


--
-- Name: referral_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.referral_logs_id_seq', 2, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 10473, true);


--
-- Name: session_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.session_orders_id_seq', 108, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 171, true);


--
-- Name: space_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.space_settings_id_seq', 5226, true);


--
-- Name: staff_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.staff_permissions_id_seq', 18, true);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 5226, true);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_subscriptions_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 12407, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 49, true);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: playing_with_neon playing_with_neon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playing_with_neon
    ADD CONSTRAINT playing_with_neon_pkey PRIMARY KEY (id);


--
-- Name: price_settings price_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_settings
    ADD CONSTRAINT price_settings_pkey PRIMARY KEY (id);


--
-- Name: referral_logs referral_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_logs
    ADD CONSTRAINT referral_logs_pkey PRIMARY KEY (id);


--
-- Name: services services_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_name_unique UNIQUE (name);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session_orders session_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_orders
    ADD CONSTRAINT session_orders_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: space_settings space_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_settings
    ADD CONSTRAINT space_settings_pkey PRIMARY KEY (id);


--
-- Name: space_settings space_settings_space_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_settings
    ADD CONSTRAINT space_settings_space_key_key UNIQUE (space_key);


--
-- Name: staff_permissions staff_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions
    ADD CONSTRAINT staff_permissions_pkey PRIMARY KEY (id);


--
-- Name: staff_permissions staff_permissions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions
    ADD CONSTRAINT staff_permissions_user_id_key UNIQUE (user_id);


--
-- Name: subscription_plans subscription_plans_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_unique UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_qr_code_key UNIQUE (qr_code);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: idx_coupons_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_user_id ON public.coupons USING btree (user_id);


--
-- Name: idx_invoices_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_created ON public.invoices USING btree (created_at DESC);


--
-- Name: idx_invoices_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_created_by ON public.invoices USING btree (created_by);


--
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);


--
-- Name: idx_session_orders_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_orders_session ON public.session_orders USING btree (session_id);


--
-- Name: idx_session_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_orders_user ON public.session_orders USING btree (user_id);


--
-- Name: idx_sessions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_created_by ON public.sessions USING btree (created_by);


--
-- Name: idx_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_status ON public.sessions USING btree (status);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_staff_perms_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_perms_user ON public.staff_permissions USING btree (user_id);


--
-- Name: idx_user_subs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subs_status ON public.user_subscriptions USING btree (status);


--
-- Name: idx_user_subs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subs_user_id ON public.user_subscriptions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_wallet_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_user_id ON public.wallet_transactions USING btree (user_id);


--
-- Name: coupons coupons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referral_logs referral_logs_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_logs
    ADD CONSTRAINT referral_logs_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(id);


--
-- Name: referral_logs referral_logs_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_logs
    ADD CONSTRAINT referral_logs_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: session_orders session_orders_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_orders
    ADD CONSTRAINT session_orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: session_orders session_orders_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_orders
    ADD CONSTRAINT session_orders_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_orders session_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_orders
    ADD CONSTRAINT session_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: staff_permissions staff_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions
    ADD CONSTRAINT staff_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id);


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict UOf0e75Nz5bPKtdNO8jKLBch0hijihfS7tb7i63AMsCcXC20eSjSW9nleJ6SbQB


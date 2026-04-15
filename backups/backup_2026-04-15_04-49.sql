--
-- PostgreSQL database dump
--

\restrict 9cCnqt07eZ4vILpelJElIhD3Am7nqKHLLoan5vcQUEUY7XDCfMW3CMrZEmDdzzM

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)

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
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
    user_id integer NOT NULL,
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
    space_name character varying(100) DEFAULT 'منطقة العمل المشتركة'::character varying NOT NULL
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
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    max_hours integer DEFAULT 4 NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    qr_image text
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
-- Name: price_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_settings ALTER COLUMN id SET DEFAULT nextval('public.price_settings_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: space_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_settings ALTER COLUMN id SET DEFAULT nextval('public.space_settings_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


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

COPY public.coupons (id, user_id, code, discount_pct, is_used, expires_at, created_at) FROM stdin;
5	\N	PROMO-QNS2HC	20	t	2026-05-10 11:41:13.711+00	2026-04-10 11:41:13.714235+00
4	\N	LINK20	20	t	2026-05-10 09:29:42.669+00	2026-04-10 09:29:42.670308+00
6	\N	LINK10	10	f	2026-05-10 22:46:25.952+00	2026-04-10 22:46:25.954184+00
7	73	LINK20-A2J29W	20	t	2026-05-12 00:04:36.229+00	2026-04-12 00:04:36.233726+00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, session_id, user_id, client_name, client_phone, session_cost, duration_min, price_per_hr, services, services_cost, coupon_code, discount_pct, discount_amount, subtotal, total, payment_method, note, created_at, wallet_paid, cash_paid, space_key, space_name) FROM stdin;
1	INV-955988	31	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 21:19:20.951721+00	0.00	0.00	cowork	منطقة العمل المشتركة
2	INV-825759	28	75	احمد عبد الرحيم ربيع	01019839140	120.00	576	30.00	[]	0.00	LINK20	20	24.00	120.00	96.00	wallet	\N	2026-04-10 22:40:58.188692+00	0.00	0.00	cowork	منطقة العمل المشتركة
3	INV-649706	33	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 23:29:39.240654+00	0.00	0.00	cowork	منطقة العمل المشتركة
4	INV-805401	34	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 23:40:21.583648+00	0.00	0.00	cowork	منطقة العمل المشتركة
5	INV-477916	35	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-10 23:41:52.081479+00	0.00	0.00	cowork	منطقة العمل المشتركة
6	INV-579604	36	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-10 23:43:17.87553+00	0.00	0.00	cowork	منطقة العمل المشتركة
7	INV-656022	42	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-11 23:21:02.116635+00	20.00	10.00	cowork	منطقة العمل المشتركة
8	INV-668037	43	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	LINK20-A2J29W	20	6.00	30.00	24.00	cash	\N	2026-04-12 00:28:36.157587+00	0.00	24.00	cowork	منطقة العمل المشتركة
9	INV-332301	44	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 18:25:40.120932+00	0.00	30.00	cowork	منطقة العمل المشتركة
10	INV-377818	45	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	30.00	\N	0	0.00	60.00	60.00	cash	\N	2026-04-12 18:44:31.585508+00	0.00	60.00	cowork	منطقة العمل المشتركة
11	INV-564721	46	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	25.00	\N	0	0.00	55.00	55.00	partial	\N	2026-04-12 18:46:17.487396+00	20.00	35.00	cowork	منطقة العمل المشتركة
12	INV-861371	47	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-04-12 19:08:38.474168+00	0.00	40.00	cowork	منطقة العمل المشتركة
13	INV-300521	48	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "عصير", "price": "15.00"}]	15.00	\N	0	0.00	45.00	45.00	partial	\N	2026-04-12 19:15:14.712254+00	0.00	45.00	cowork	منطقة العمل المشتركة
14	INV-548751	49	75	احمد عبد الرحيم ربيع	01019839140	30.00	53	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 20:09:29.302803+00	0.00	30.00	cowork	منطقة العمل المشتركة
15	INV-598838	50	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	12.00	\N	0	0.00	42.00	42.00	partial	\N	2026-04-12 20:10:40.727295+00	0.00	42.00	cowork	منطقة العمل المشتركة
16	INV-322318	51	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 3, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	10.00	\N	0	0.00	40.00	40.00	partial	\N	2026-04-12 20:22:48.123108+00	0.00	40.00	cowork	منطقة العمل المشتركة
17	INV-933880	52	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	partial	\N	2026-04-12 20:32:25.871545+00	0.00	50.00	cowork	منطقة العمل المشتركة
18	INV-424343	53	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	34.00	\N	0	0.00	64.00	64.00	partial	\N	2026-04-12 20:57:22.609694+00	5.00	59.00	cowork	منطقة العمل المشتركة
19	INV-581138	54	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 21:00:49.023983+00	0.00	30.00	cowork	منطقة العمل المشتركة
20	INV-455050	55	74	محمد عبد الراضي	01096267021	30.00	1	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	10.00	\N	0	0.00	40.00	40.00	wallet	\N	2026-04-12 21:15:07.618786+00	10.00	30.00	cowork	منطقة العمل المشتركة
21	INV-538308	56	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-12 21:32:27.147514+00	10.00	20.00	cowork	منطقة العمل المشتركة
22	INV-805429	57	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	35.00	\N	0	0.00	65.00	65.00	wallet	\N	2026-04-13 07:37:22.154201+00	65.00	0.00	cowork	منطقة العمل المشتركة
23	INV-756585	58	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	25.00	\N	0	0.00	55.00	55.00	wallet	\N	2026-04-13 12:52:56.085048+00	55.00	0.00	cowork	منطقة العمل المشتركة
24	INV-187271	60	74	محمد عبد الراضي	01096267021	120.00	288	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}]	30.00	\N	0	0.00	150.00	150.00	cash	\N	2026-04-13 17:43:33.557715+00	0.00	150.00	cowork	منطقة العمل المشتركة
25	INV-542239	61	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-04-13 17:49:49.186706+00	0.00	50.00	cowork	منطقة العمل المشتركة
26	INV-776787	63	76	Salah mohamed	01000984633	150.00	1	150.00	[]	0.00	\N	0	0.00	150.00	150.00	cash	\N	2026-04-13 22:53:34.542397+00	0.00	150.00	cowork	منطقة العمل المشتركة
27	INV-838656	62	161	سالم عبدالواحد	01029947834	30.00	2	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-13 22:54:10.583511+00	0.00	30.00	cowork	منطقة العمل المشتركة
28	INV-874484	64	161	سالم عبدالواحد	01029947834	200.00	1	200.00	[]	0.00	\N	0	0.00	200.00	200.00	cash	\N	2026-04-13 23:03:49.400936+00	0.00	200.00	cowork	منطقة العمل المشتركة
29	INV-524407	59	75	احمد عبد الرحيم ربيع	01019839140	120.00	661	30.00	[]	0.00	\N	0	0.00	120.00	120.00	partial	\N	2026-04-13 23:55:35.48046+00	15.00	105.00	cowork	منطقة العمل المشتركة
30	INV-484944	65	73	سالم علي	01029947833	1500.00	583	150.00	[]	0.00	\N	0	0.00	1500.00	1500.00	cash	\N	2026-04-14 09:41:38.623469+00	0.00	1500.00	cowork	منطقة العمل المشتركة
31	INV-561134	66	76	Salah mohamed	01000984633	2400.00	883	200.00	[]	0.00	\N	0	0.00	2400.00	2400.00	cash	\N	2026-04-14 14:39:30.006198+00	0.00	2400.00	cowork	منطقة العمل المشتركة
32	INV-600646	68	161	سالم عبدالواحد	01029947834	120.00	228	30.00	[]	0.00	\N	0	0.00	120.00	120.00	cash	\N	2026-04-14 14:40:06.048391+00	0.00	120.00	cowork	منطقة العمل المشتركة
33	INV-645449	67	65	سالم راضي	01029947832	2400.00	884	200.00	[]	0.00	\N	0	0.00	2400.00	2400.00	cash	\N	2026-04-14 14:40:52.606161+00	0.00	2400.00	cowork	منطقة العمل المشتركة
34	INV-978067	69	75	احمد عبد الرحيم ربيع	01019839140	1200.00	441	150.00	[]	0.00	\N	0	0.00	1200.00	1200.00	cash	\N	2026-04-14 21:59:47.828236+00	0.00	1200.00	cowork	منطقة العمل المشتركة
35	INV-090600	70	161	سالم عبدالواحد	01029947834	1600.00	440	200.00	[]	0.00	\N	0	0.00	1600.00	1600.00	cash	\N	2026-04-14 22:01:33.190935+00	0.00	1600.00	cowork	منطقة العمل المشتركة
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
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, price, is_active, created_at, updated_at) FROM stdin;
2	شاي	10.00	t	2026-03-24 22:39:49.174125+00	2026-03-24 22:39:49.174125+00
15	مياه	5.00	f	2026-03-25 10:38:09.227656+00	2026-03-25 10:38:09.227656+00
5	طباعة (ورقة)	1.00	t	2026-03-24 22:39:49.174125+00	2026-04-12 18:41:38.14657+00
253	طباعة ورق ألوان 	2.00	t	2026-04-12 18:41:53.458798+00	2026-04-12 18:41:53.458798+00
4	عصير	15.00	t	2026-03-24 22:39:49.174125+00	2026-04-12 18:42:20.782864+00
254	مشروب غازي 	20.00	t	2026-04-12 18:42:33.322634+00	2026-04-12 18:42:33.322634+00
6	سكانر	1.00	t	2026-03-24 22:39:49.174125+00	2026-04-12 18:42:49.630798+00
286	قهوة 	10.00	f	2026-04-12 21:03:07.662171+00	2026-04-12 21:03:07.662171+00
1	قهوة	20.00	t	2026-03-24 22:39:49.174125+00	2026-03-30 21:18:24.793431+00
3	مياه صغيرة 	5.00	t	2026-03-24 22:39:49.174125+00	2026-03-30 21:20:01.57091+00
9	مياه كبيرة 	10.00	t	2026-03-24 23:05:16.011849+00	2026-03-30 21:20:15.738262+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, check_in, check_out, duration_min, price_per_hr, cost, payment_method, status, created_at, space_key, space_name, max_hours) FROM stdin;
1	74	2026-03-22 16:26:17.007837+00	2026-03-22 16:26:17.071+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.007837+00	cowork	منطقة العمل المشتركة	4
57	161	2026-04-13 07:36:38.518046+00	2026-04-13 07:36:45.645+00	1	30.00	30.00	wallet	completed	2026-04-13 07:36:38.518046+00	cowork	منطقة العمل المشتركة	4
2	74	2026-03-22 16:26:17.099473+00	2026-03-22 16:26:17.156+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.099473+00	cowork	منطقة العمل المشتركة	4
3	74	2026-03-22 16:26:17.173729+00	2026-03-22 16:26:17.369+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.173729+00	cowork	منطقة العمل المشتركة	4
58	75	2026-04-13 12:52:29.620006+00	2026-04-13 12:52:36.107+00	1	30.00	30.00	wallet	completed	2026-04-13 12:52:29.620006+00	cowork	منطقة العمل المشتركة	4
4	74	2026-03-22 16:27:53.709325+00	2026-03-22 16:27:53.872+00	1	15.00	0.25	wallet	completed	2026-03-22 16:27:53.709325+00	cowork	منطقة العمل المشتركة	4
5	74	2026-03-22 16:27:53.937689+00	2026-03-22 16:27:54.118+00	1	15.00	0.25	wallet	completed	2026-03-22 16:27:53.937689+00	cowork	منطقة العمل المشتركة	4
60	74	2026-04-13 12:55:10.020864+00	2026-04-13 17:43:06.799+00	288	30.00	120.00	wallet	completed	2026-04-13 12:55:10.020864+00	cowork	منطقة العمل المشتركة	4
6	75	2026-03-22 16:55:47.060463+00	2026-03-23 06:49:04.886+00	834	15.00	208.50	wallet	completed	2026-03-22 16:55:47.060463+00	cowork	منطقة العمل المشتركة	4
7	161	2026-03-22 23:28:29.694773+00	2026-03-24 17:20:00.961+00	2512	12.00	502.40	wallet	completed	2026-03-22 23:28:29.694773+00	cowork	منطقة العمل المشتركة	4
8	73	2026-03-24 17:19:41.040407+00	2026-03-24 17:35:28.623+00	16	15.00	4.00	wallet	completed	2026-03-24 17:19:41.040407+00	cowork	منطقة العمل المشتركة	4
61	76	2026-04-13 17:48:56.364132+00	2026-04-13 17:49:01.834+00	1	30.00	30.00	wallet	completed	2026-04-13 17:48:56.364132+00	cowork	منطقة العمل المشتركة	4
9	73	2026-03-24 22:30:35.722137+00	2026-03-24 22:42:33.951+00	12	12.00	2.40	wallet	completed	2026-03-24 22:30:35.722137+00	cowork	منطقة العمل المشتركة	4
10	73	2026-03-24 22:55:39.151875+00	2026-03-24 23:09:00.169+00	14	12.00	2.80	wallet	completed	2026-03-24 22:55:39.151875+00	cowork	منطقة العمل المشتركة	4
11	73	2026-03-25 09:11:39.930753+00	2026-03-25 10:42:52.884+00	92	10.00	15.33	wallet	completed	2026-03-25 09:11:39.930753+00	cowork	منطقة العمل المشتركة	4
63	76	2026-04-13 22:52:42.896368+00	2026-04-13 22:52:56.634+00	1	150.00	150.00	wallet	completed	2026-04-13 22:52:42.896368+00	meeting	غرفة الاجتماعات	12
12	73	2026-03-26 17:00:14.238112+00	2026-03-26 17:00:24.016+00	1	15.00	0.25	wallet	completed	2026-03-26 17:00:14.238112+00	cowork	منطقة العمل المشتركة	4
62	161	2026-04-13 22:52:03.178183+00	2026-04-13 22:53:58.498+00	2	30.00	30.00	wallet	completed	2026-04-13 22:52:03.178183+00	cowork	منطقة العمل المشتركة	4
13	73	2026-03-26 17:00:38.462156+00	2026-03-28 00:20:55.106+00	1881	15.00	60.00	wallet	completed	2026-03-26 17:00:38.462156+00	cowork	منطقة العمل المشتركة	4
14	73	2026-03-28 16:40:22.146319+00	2026-03-28 16:43:20.539+00	3	15.00	0.75	wallet	completed	2026-03-28 16:40:22.146319+00	cowork	منطقة العمل المشتركة	4
64	161	2026-04-13 22:54:28.278261+00	2026-04-13 22:54:34.338+00	1	200.00	200.00	wallet	completed	2026-04-13 22:54:28.278261+00	lessons	غرفة الدروس	12
15	73	2026-03-28 17:15:38.816663+00	2026-03-28 17:15:57.457+00	1	30.00	0.50	wallet	completed	2026-03-28 17:15:38.816663+00	cowork	منطقة العمل المشتركة	4
16	161	2026-03-30 13:09:36.056537+00	2026-03-30 13:09:40.936+00	1	30.00	0.50	wallet	completed	2026-03-30 13:09:36.056537+00	cowork	منطقة العمل المشتركة	4
59	75	2026-04-13 12:54:53.912921+00	2026-04-13 23:55:24.21+00	661	30.00	120.00	wallet	completed	2026-04-13 12:54:53.912921+00	cowork	منطقة العمل المشتركة	4
17	73	2026-03-30 21:17:33.717131+00	2026-03-30 21:17:45.39+00	1	30.00	0.50	wallet	completed	2026-03-30 21:17:33.717131+00	cowork	منطقة العمل المشتركة	4
18	161	2026-03-30 21:19:12.23873+00	2026-03-30 21:21:19.414+00	3	30.00	1.50	wallet	completed	2026-03-30 21:19:12.23873+00	cowork	منطقة العمل المشتركة	4
19	161	2026-04-01 23:22:29.708089+00	2026-04-02 15:27:14.263+00	965	30.00	120.00	wallet	completed	2026-04-01 23:22:29.708089+00	cowork	منطقة العمل المشتركة	4
65	73	2026-04-13 23:55:08.446219+00	2026-04-14 09:38:03.775+00	583	150.00	1500.00	wallet	completed	2026-04-13 23:55:08.446219+00	meeting	غرفة الاجتماعات	12
20	161	2026-04-02 15:28:00.386344+00	2026-04-09 17:44:24.027+00	10217	30.00	120.00	wallet	completed	2026-04-02 15:28:00.386344+00	cowork	منطقة العمل المشتركة	4
21	73	2026-04-09 17:43:28.927434+00	2026-04-09 17:45:12.392+00	2	30.00	30.00	wallet	completed	2026-04-09 17:43:28.927434+00	cowork	منطقة العمل المشتركة	4
22	73	2026-04-09 17:47:35.074878+00	2026-04-09 23:43:37.454+00	357	30.00	120.00	wallet	completed	2026-04-09 17:47:35.074878+00	cowork	منطقة العمل المشتركة	4
66	76	2026-04-13 23:56:21.454531+00	2026-04-14 14:39:20.035+00	883	200.00	2400.00	wallet	completed	2026-04-13 23:56:21.454531+00	lessons	غرفة الدروس	12
23	73	2026-04-09 23:44:02.156463+00	2026-04-09 23:44:21.01+00	1	30.00	30.00	wallet	completed	2026-04-09 23:44:02.156463+00	cowork	منطقة العمل المشتركة	4
68	161	2026-04-14 10:52:07.403917+00	2026-04-14 14:39:59.541+00	228	30.00	120.00	wallet	completed	2026-04-14 10:52:07.403917+00	cowork	منطقة العمل المشتركة	4
24	73	2026-04-09 23:53:56.854953+00	2026-04-09 23:54:12.731+00	1	35.00	35.00	wallet	completed	2026-04-09 23:53:56.854953+00	cowork	منطقة العمل المشتركة	4
25	161	2026-04-10 00:13:14.12352+00	2026-04-10 00:13:38.601+00	1	35.00	35.00	wallet	completed	2026-04-10 00:13:14.12352+00	cowork	منطقة العمل المشتركة	4
67	65	2026-04-13 23:56:46.197474+00	2026-04-14 14:40:44.354+00	884	200.00	2400.00	wallet	completed	2026-04-13 23:56:46.197474+00	lessons	غرفة الدروس	12
26	161	2026-04-10 09:21:09.899437+00	2026-04-10 09:21:29.461+00	1	30.00	30.00	wallet	completed	2026-04-10 09:21:09.899437+00	cowork	منطقة العمل المشتركة	4
69	75	2026-04-14 14:39:05.749542+00	2026-04-14 21:59:36.951+00	441	150.00	1200.00	wallet	completed	2026-04-14 14:39:05.749542+00	meeting	غرفة الاجتماعات	12
27	161	2026-04-10 09:30:31.116553+00	2026-04-10 09:30:37.042+00	1	30.00	30.00	wallet	completed	2026-04-10 09:30:31.116553+00	cowork	منطقة العمل المشتركة	4
70	161	2026-04-14 14:40:17.637376+00	2026-04-14 22:00:09.114+00	440	200.00	1600.00	wallet	completed	2026-04-14 14:40:17.637376+00	lessons	غرفة الدروس	12
71	74	2026-04-14 22:14:38.060792+00	\N	\N	150.00	\N	wallet	active	2026-04-14 22:14:38.060792+00	meeting	غرفة الاجتماعات	4
29	76	2026-04-10 13:05:33.404395+00	2026-04-10 13:05:43.241+00	1	30.00	30.00	wallet	completed	2026-04-10 13:05:33.404395+00	cowork	منطقة العمل المشتركة	4
72	73	2026-04-14 22:16:05.258986+00	\N	\N	200.00	\N	wallet	active	2026-04-14 22:16:05.258986+00	lessons	غرفة الدروس	4
30	161	2026-04-10 21:07:33.163096+00	2026-04-10 21:07:48.495+00	1	30.00	30.00	wallet	completed	2026-04-10 21:07:33.163096+00	cowork	منطقة العمل المشتركة	4
31	161	2026-04-10 21:19:04.714265+00	2026-04-10 21:19:15.673+00	1	30.00	30.00	wallet	completed	2026-04-10 21:19:04.714265+00	cowork	منطقة العمل المشتركة	4
28	75	2026-04-10 13:05:18.673586+00	2026-04-10 22:40:26.687+00	576	30.00	120.00	wallet	completed	2026-04-10 13:05:18.673586+00	cowork	منطقة العمل المشتركة	4
32	75	2026-04-10 23:24:45.733484+00	2026-04-10 23:24:57.966+00	1	30.00	30.00	wallet	completed	2026-04-10 23:24:45.733484+00	cowork	منطقة العمل المشتركة	4
33	75	2026-04-10 23:27:23.287334+00	2026-04-10 23:27:29.324+00	1	30.00	30.00	wallet	completed	2026-04-10 23:27:23.287334+00	cowork	منطقة العمل المشتركة	4
34	76	2026-04-10 23:29:50.527049+00	2026-04-10 23:30:04.989+00	1	30.00	30.00	wallet	completed	2026-04-10 23:29:50.527049+00	cowork	منطقة العمل المشتركة	4
35	76	2026-04-10 23:41:09.881353+00	2026-04-10 23:41:17.585+00	1	30.00	30.00	wallet	completed	2026-04-10 23:41:09.881353+00	cowork	منطقة العمل المشتركة	4
36	75	2026-04-10 23:42:52.017272+00	2026-04-10 23:42:59.123+00	1	30.00	30.00	wallet	completed	2026-04-10 23:42:52.017272+00	cowork	منطقة العمل المشتركة	4
37	76	2026-04-11 07:00:24.310014+00	2026-04-11 07:00:29.713+00	1	30.00	30.00	wallet	completed	2026-04-11 07:00:24.310014+00	cowork	منطقة العمل المشتركة	4
38	75	2026-04-11 07:10:02.951467+00	2026-04-11 07:10:18.466+00	1	30.00	30.00	wallet	completed	2026-04-11 07:10:02.951467+00	cowork	منطقة العمل المشتركة	4
39	76	2026-04-11 13:27:24.702161+00	2026-04-11 13:28:05.339+00	1	30.00	30.00	wallet	completed	2026-04-11 13:27:24.702161+00	cowork	منطقة العمل المشتركة	4
40	76	2026-04-11 22:59:05.346505+00	2026-04-11 22:59:13.438+00	1	30.00	30.00	wallet	completed	2026-04-11 22:59:05.346505+00	cowork	منطقة العمل المشتركة	4
41	75	2026-04-11 23:06:02.425441+00	2026-04-11 23:07:20.05+00	2	30.00	30.00	wallet	completed	2026-04-11 23:06:02.425441+00	cowork	منطقة العمل المشتركة	4
42	76	2026-04-11 23:20:50.036592+00	2026-04-11 23:20:56.201+00	1	30.00	30.00	wallet	completed	2026-04-11 23:20:50.036592+00	cowork	منطقة العمل المشتركة	4
43	73	2026-04-12 00:27:34.73088+00	2026-04-12 00:27:48.28+00	1	30.00	30.00	wallet	completed	2026-04-12 00:27:34.73088+00	cowork	منطقة العمل المشتركة	4
44	161	2026-04-12 18:03:11.817178+00	2026-04-12 18:03:19.82+00	1	30.00	30.00	wallet	completed	2026-04-12 18:03:11.817178+00	cowork	منطقة العمل المشتركة	4
45	161	2026-04-12 18:39:54.910179+00	2026-04-12 18:40:03.382+00	1	30.00	30.00	wallet	completed	2026-04-12 18:39:54.910179+00	cowork	منطقة العمل المشتركة	4
46	161	2026-04-12 18:45:58.564089+00	2026-04-12 18:46:02.681+00	1	30.00	30.00	wallet	completed	2026-04-12 18:45:58.564089+00	cowork	منطقة العمل المشتركة	4
47	76	2026-04-12 19:07:32.314125+00	2026-04-12 19:07:40.616+00	1	30.00	30.00	wallet	completed	2026-04-12 19:07:32.314125+00	cowork	منطقة العمل المشتركة	4
48	76	2026-04-12 19:14:53.392601+00	2026-04-12 19:14:59.814+00	1	30.00	30.00	partial	completed	2026-04-12 19:14:53.392601+00	cowork	منطقة العمل المشتركة	4
49	75	2026-04-12 19:16:18.442013+00	2026-04-12 20:09:08.306+00	53	30.00	30.00	wallet	completed	2026-04-12 19:16:18.442013+00	cowork	منطقة العمل المشتركة	4
50	75	2026-04-12 20:09:53.814042+00	2026-04-12 20:09:58.438+00	1	30.00	30.00	partial	completed	2026-04-12 20:09:53.814042+00	cowork	منطقة العمل المشتركة	4
51	76	2026-04-12 20:21:57.084353+00	2026-04-12 20:22:01.925+00	1	30.00	30.00	partial	completed	2026-04-12 20:21:57.084353+00	cowork	منطقة العمل المشتركة	4
52	161	2026-04-12 20:32:08.975031+00	2026-04-12 20:32:13.504+00	1	30.00	30.00	partial	completed	2026-04-12 20:32:08.975031+00	cowork	منطقة العمل المشتركة	4
53	76	2026-04-12 20:56:59.328839+00	2026-04-12 20:57:03.977+00	1	30.00	30.00	wallet	completed	2026-04-12 20:56:59.328839+00	cowork	منطقة العمل المشتركة	4
54	73	2026-04-12 20:59:37.118545+00	2026-04-12 20:59:40.539+00	1	30.00	30.00	wallet	completed	2026-04-12 20:59:37.118545+00	cowork	منطقة العمل المشتركة	4
55	74	2026-04-12 21:14:09.305994+00	2026-04-12 21:14:14.677+00	1	30.00	30.00	wallet	completed	2026-04-12 21:14:09.305994+00	cowork	منطقة العمل المشتركة	4
56	76	2026-04-12 21:31:40.761888+00	2026-04-12 21:32:17.895+00	1	30.00	30.00	wallet	completed	2026-04-12 21:31:40.761888+00	cowork	منطقة العمل المشتركة	4
\.


--
-- Data for Name: space_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.space_settings (id, space_key, name, first_hour, extra_hour, max_hours, updated_at) FROM stdin;
1	cowork	منطقة العمل المشتركة	30.00	30.00	4	2026-04-10 00:22:10.341916+00
3	lessons	غرفة الدروس	200.00	100.00	4	2026-04-10 00:21:58.238988+00
2	meeting	غرفة الاجتماعات	150.00	100.00	4	2026-04-10 00:22:06.182329+00
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, price, features, discount_rooms, is_active, created_at, updated_at) FROM stdin;
1	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-24 22:39:49.177984+00	2026-03-24 22:39:49.177984+00
2	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-24 22:39:49.177984+00	2026-03-24 22:39:49.177984+00
3	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-24 22:39:49.177984+00	2026-03-24 22:39:49.177984+00
4	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-24 23:05:16.018821+00	2026-03-24 23:05:16.018821+00
5	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-24 23:05:16.018821+00	2026-03-24 23:05:16.018821+00
6	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-24 23:05:16.018821+00	2026-03-24 23:05:16.018821+00
7	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-25 10:38:09.230715+00	2026-03-25 10:38:09.230715+00
8	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-25 10:38:09.230715+00	2026-03-25 10:38:09.230715+00
9	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-25 10:38:09.230715+00	2026-03-25 10:38:09.230715+00
10	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-28 17:02:36.324104+00	2026-03-28 17:02:36.324104+00
11	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-28 17:02:36.324104+00	2026-03-28 17:02:36.324104+00
12	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-28 17:02:36.324104+00	2026-03-28 17:02:36.324104+00
13	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-28 17:07:39.128047+00	2026-03-28 17:07:39.128047+00
14	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-28 17:07:39.128047+00	2026-03-28 17:07:39.128047+00
15	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-28 17:07:39.128047+00	2026-03-28 17:07:39.128047+00
16	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-03-30 21:11:13.212708+00	2026-03-30 21:11:13.212708+00
17	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-03-30 21:11:13.212708+00	2026-03-30 21:11:13.212708+00
18	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-03-30 21:11:13.212708+00	2026-03-30 21:11:13.212708+00
19	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-09 17:30:39.659381+00	2026-04-09 17:30:39.659381+00
20	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-09 17:30:39.659381+00	2026-04-09 17:30:39.659381+00
21	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-09 17:30:39.659381+00	2026-04-09 17:30:39.659381+00
22	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-09 23:41:32.437342+00	2026-04-09 23:41:32.437342+00
23	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-09 23:41:32.437342+00	2026-04-09 23:41:32.437342+00
24	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-09 23:41:32.437342+00	2026-04-09 23:41:32.437342+00
25	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-09 23:51:15.473995+00	2026-04-09 23:51:15.473995+00
26	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-09 23:51:15.473995+00	2026-04-09 23:51:15.473995+00
27	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-09 23:51:15.473995+00	2026-04-09 23:51:15.473995+00
28	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 00:11:25.570222+00	2026-04-10 00:11:25.570222+00
29	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 00:11:25.570222+00	2026-04-10 00:11:25.570222+00
30	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 00:11:25.570222+00	2026-04-10 00:11:25.570222+00
31	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 09:15:46.6234+00	2026-04-10 09:15:46.6234+00
32	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 09:15:46.6234+00	2026-04-10 09:15:46.6234+00
33	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 09:15:46.6234+00	2026-04-10 09:15:46.6234+00
34	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 09:18:22.169236+00	2026-04-10 09:18:22.169236+00
35	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 09:18:22.169236+00	2026-04-10 09:18:22.169236+00
36	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 09:18:22.169236+00	2026-04-10 09:18:22.169236+00
37	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 09:28:45.344103+00	2026-04-10 09:28:45.344103+00
38	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 09:28:45.344103+00	2026-04-10 09:28:45.344103+00
39	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 09:28:45.344103+00	2026-04-10 09:28:45.344103+00
40	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 11:27:31.426183+00	2026-04-10 11:27:31.426183+00
41	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 11:27:31.426183+00	2026-04-10 11:27:31.426183+00
42	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 11:27:31.426183+00	2026-04-10 11:27:31.426183+00
43	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 21:03:48.374665+00	2026-04-10 21:03:48.374665+00
44	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 21:03:48.374665+00	2026-04-10 21:03:48.374665+00
45	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 21:03:48.374665+00	2026-04-10 21:03:48.374665+00
46	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 21:17:31.777817+00	2026-04-10 21:17:31.777817+00
47	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 21:17:31.777817+00	2026-04-10 21:17:31.777817+00
48	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 21:17:31.777817+00	2026-04-10 21:17:31.777817+00
49	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 21:45:39.170203+00	2026-04-10 21:45:39.170203+00
50	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 21:45:39.170203+00	2026-04-10 21:45:39.170203+00
51	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 21:45:39.170203+00	2026-04-10 21:45:39.170203+00
52	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 22:37:44.808531+00	2026-04-10 22:37:44.808531+00
53	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 22:37:44.808531+00	2026-04-10 22:37:44.808531+00
54	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 22:37:44.808531+00	2026-04-10 22:37:44.808531+00
55	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 23:22:52.761868+00	2026-04-10 23:22:52.761868+00
56	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 23:22:52.761868+00	2026-04-10 23:22:52.761868+00
57	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 23:22:52.761868+00	2026-04-10 23:22:52.761868+00
58	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-10 23:39:58.135419+00	2026-04-10 23:39:58.135419+00
59	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-10 23:39:58.135419+00	2026-04-10 23:39:58.135419+00
60	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-10 23:39:58.135419+00	2026-04-10 23:39:58.135419+00
61	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 06:50:19.933458+00	2026-04-11 06:50:19.933458+00
62	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 06:50:19.933458+00	2026-04-11 06:50:19.933458+00
63	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 06:50:19.933458+00	2026-04-11 06:50:19.933458+00
64	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 07:01:24.669304+00	2026-04-11 07:01:24.669304+00
65	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 07:01:24.669304+00	2026-04-11 07:01:24.669304+00
66	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 07:01:24.669304+00	2026-04-11 07:01:24.669304+00
67	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 07:10:48.7884+00	2026-04-11 07:10:48.7884+00
68	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 07:10:48.7884+00	2026-04-11 07:10:48.7884+00
69	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 07:10:48.7884+00	2026-04-11 07:10:48.7884+00
70	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 07:14:02.211665+00	2026-04-11 07:14:02.211665+00
71	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 07:14:02.211665+00	2026-04-11 07:14:02.211665+00
72	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 07:14:02.211665+00	2026-04-11 07:14:02.211665+00
73	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 13:28:19.917499+00	2026-04-11 13:28:19.917499+00
74	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 13:28:19.917499+00	2026-04-11 13:28:19.917499+00
75	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 13:28:19.917499+00	2026-04-11 13:28:19.917499+00
76	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 13:53:27.058929+00	2026-04-11 13:53:27.058929+00
77	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 13:53:27.058929+00	2026-04-11 13:53:27.058929+00
78	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 13:53:27.058929+00	2026-04-11 13:53:27.058929+00
79	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 22:44:41.878886+00	2026-04-11 22:44:41.878886+00
80	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 22:44:41.878886+00	2026-04-11 22:44:41.878886+00
81	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 22:44:41.878886+00	2026-04-11 22:44:41.878886+00
82	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 22:52:12.745448+00	2026-04-11 22:52:12.745448+00
83	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 22:52:12.745448+00	2026-04-11 22:52:12.745448+00
84	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 22:52:12.745448+00	2026-04-11 22:52:12.745448+00
85	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 22:59:23.52848+00	2026-04-11 22:59:23.52848+00
86	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 22:59:23.52848+00	2026-04-11 22:59:23.52848+00
87	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 22:59:23.52848+00	2026-04-11 22:59:23.52848+00
88	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 23:07:50.698167+00	2026-04-11 23:07:50.698167+00
89	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 23:07:50.698167+00	2026-04-11 23:07:50.698167+00
90	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 23:07:50.698167+00	2026-04-11 23:07:50.698167+00
91	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-11 23:13:28.510735+00	2026-04-11 23:13:28.510735+00
92	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-11 23:13:28.510735+00	2026-04-11 23:13:28.510735+00
93	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-11 23:13:28.510735+00	2026-04-11 23:13:28.510735+00
94	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 00:47:41.832581+00	2026-04-12 00:47:41.832581+00
95	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 00:47:41.832581+00	2026-04-12 00:47:41.832581+00
96	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 00:47:41.832581+00	2026-04-12 00:47:41.832581+00
97	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 00:58:22.887156+00	2026-04-12 00:58:22.887156+00
98	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 00:58:22.887156+00	2026-04-12 00:58:22.887156+00
99	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 00:58:22.887156+00	2026-04-12 00:58:22.887156+00
100	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 01:01:16.812404+00	2026-04-12 01:01:16.812404+00
101	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 01:01:16.812404+00	2026-04-12 01:01:16.812404+00
102	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 01:01:16.812404+00	2026-04-12 01:01:16.812404+00
103	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 01:08:15.635862+00	2026-04-12 01:08:15.635862+00
104	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 01:08:15.635862+00	2026-04-12 01:08:15.635862+00
105	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 01:08:15.635862+00	2026-04-12 01:08:15.635862+00
106	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 01:18:16.337764+00	2026-04-12 01:18:16.337764+00
107	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 01:18:16.337764+00	2026-04-12 01:18:16.337764+00
108	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 01:18:16.337764+00	2026-04-12 01:18:16.337764+00
109	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 01:22:22.218216+00	2026-04-12 01:22:22.218216+00
110	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 01:22:22.218216+00	2026-04-12 01:22:22.218216+00
111	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 01:22:22.218216+00	2026-04-12 01:22:22.218216+00
112	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 14:07:47.435229+00	2026-04-12 14:07:47.435229+00
113	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 14:07:47.435229+00	2026-04-12 14:07:47.435229+00
114	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 14:07:47.435229+00	2026-04-12 14:07:47.435229+00
115	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 14:36:07.775614+00	2026-04-12 14:36:07.775614+00
116	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 14:36:07.775614+00	2026-04-12 14:36:07.775614+00
117	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 14:36:07.775614+00	2026-04-12 14:36:07.775614+00
118	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 15:10:08.263922+00	2026-04-12 15:10:08.263922+00
119	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 15:10:08.263922+00	2026-04-12 15:10:08.263922+00
120	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 15:10:08.263922+00	2026-04-12 15:10:08.263922+00
121	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 18:17:28.552628+00	2026-04-12 18:17:28.552628+00
122	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 18:17:28.552628+00	2026-04-12 18:17:28.552628+00
123	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 18:17:28.552628+00	2026-04-12 18:17:28.552628+00
124	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 18:38:56.40544+00	2026-04-12 18:38:56.40544+00
125	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 18:38:56.40544+00	2026-04-12 18:38:56.40544+00
126	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 18:38:56.40544+00	2026-04-12 18:38:56.40544+00
127	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 19:05:01.53547+00	2026-04-12 19:05:01.53547+00
128	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 19:05:01.53547+00	2026-04-12 19:05:01.53547+00
129	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 19:05:01.53547+00	2026-04-12 19:05:01.53547+00
130	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 19:13:45.930182+00	2026-04-12 19:13:45.930182+00
131	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 19:13:45.930182+00	2026-04-12 19:13:45.930182+00
132	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 19:13:45.930182+00	2026-04-12 19:13:45.930182+00
133	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 20:20:41.355494+00	2026-04-12 20:20:41.355494+00
134	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 20:20:41.355494+00	2026-04-12 20:20:41.355494+00
135	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 20:20:41.355494+00	2026-04-12 20:20:41.355494+00
136	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 20:29:26.243138+00	2026-04-12 20:29:26.243138+00
137	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 20:29:26.243138+00	2026-04-12 20:29:26.243138+00
138	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 20:29:26.243138+00	2026-04-12 20:29:26.243138+00
139	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 20:46:12.987545+00	2026-04-12 20:46:12.987545+00
140	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 20:46:12.987545+00	2026-04-12 20:46:12.987545+00
141	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 20:46:12.987545+00	2026-04-12 20:46:12.987545+00
142	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-12 21:11:56.265944+00	2026-04-12 21:11:56.265944+00
143	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-12 21:11:56.265944+00	2026-04-12 21:11:56.265944+00
144	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-12 21:11:56.265944+00	2026-04-12 21:11:56.265944+00
145	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 05:20:21.353678+00	2026-04-13 05:20:21.353678+00
146	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 05:20:21.353678+00	2026-04-13 05:20:21.353678+00
147	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 05:20:21.353678+00	2026-04-13 05:20:21.353678+00
148	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 07:34:30.248134+00	2026-04-13 07:34:30.248134+00
149	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 07:34:30.248134+00	2026-04-13 07:34:30.248134+00
150	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 07:34:30.248134+00	2026-04-13 07:34:30.248134+00
151	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 07:49:56.434997+00	2026-04-13 07:49:56.434997+00
152	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 07:49:56.434997+00	2026-04-13 07:49:56.434997+00
153	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 07:49:56.434997+00	2026-04-13 07:49:56.434997+00
154	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 08:24:11.468394+00	2026-04-13 08:24:11.468394+00
155	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 08:24:11.468394+00	2026-04-13 08:24:11.468394+00
156	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 08:24:11.468394+00	2026-04-13 08:24:11.468394+00
157	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 10:33:19.51416+00	2026-04-13 10:33:19.51416+00
158	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 10:33:19.51416+00	2026-04-13 10:33:19.51416+00
159	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 10:33:19.51416+00	2026-04-13 10:33:19.51416+00
160	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 12:47:49.151842+00	2026-04-13 12:47:49.151842+00
161	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 12:47:49.151842+00	2026-04-13 12:47:49.151842+00
162	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 12:47:49.151842+00	2026-04-13 12:47:49.151842+00
163	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 22:16:23.31856+00	2026-04-13 22:16:23.31856+00
164	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 22:16:23.31856+00	2026-04-13 22:16:23.31856+00
165	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 22:16:23.31856+00	2026-04-13 22:16:23.31856+00
166	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 22:29:33.954268+00	2026-04-13 22:29:33.954268+00
167	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 22:29:33.954268+00	2026-04-13 22:29:33.954268+00
168	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 22:29:33.954268+00	2026-04-13 22:29:33.954268+00
169	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-13 22:42:00.554444+00	2026-04-13 22:42:00.554444+00
170	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-13 22:42:00.554444+00	2026-04-13 22:42:00.554444+00
171	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-13 22:42:00.554444+00	2026-04-13 22:42:00.554444+00
172	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-14 04:50:40.696807+00	2026-04-14 04:50:40.696807+00
173	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-14 04:50:40.696807+00	2026-04-14 04:50:40.696807+00
174	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-14 04:50:40.696807+00	2026-04-14 04:50:40.696807+00
175	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل	0	t	2026-04-14 14:33:58.800927+00	2026-04-14 14:33:58.800927+00
176	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	2026-04-14 14:33:58.800927+00	2026-04-14 14:33:58.800927+00
177	باقة VIP	1400.00	دخول غير محدود + خصم 40% على الغرف	40	t	2026-04-14 14:33:58.800927+00	2026-04-14 14:33:58.800927+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, phone, password, role, balance, points, qr_code, is_active, created_at, updated_at, qr_image) FROM stdin;
1	مدير النظام	01000000000	$2a$12$07JTMuoPPatRGn9Yg8U5OOEkZPZYivXHBWa5pfEaHpZNG2DWJGvx.	admin	0.00	0	89aee623-c440-42d1-b32d-1f0edc6e672a	t	2026-03-21 13:11:58.641053+00	2026-03-21 13:11:58.641053+00	\N
2	موظف الاستقبال	01100000000	$2a$12$/lhv1O7/gT2o/mEfOeNMxuV4vj49Y47UYC1q9bIC9a.Pr0aZlWFLu	staff	0.00	0	b091fcee-30e0-4250-8c07-5e7019d6e14e	t	2026-03-21 13:11:58.644617+00	2026-03-21 13:11:58.644617+00	\N
3	أحمد محمد السيد	01012345678	$2a$12$me4Exf2tPJsX.rRcpgCCSebzykXtP7E5CGlu0HGlUp4/DwvRv69eC	client	145.50	87	5ca5f5e8-2a4c-4528-9ff8-ee2d5f4e27d6	t	2026-03-21 13:11:58.905618+00	2026-03-21 13:11:58.905618+00	\N
4	سارة خالد إبراهيم	01123456789	$2a$12$s5mmf2.Tq14WPhIg/JtBfeIy1oGv7ADh2YDG7dHaQaQUMw1mbp0Xa	client	80.00	45	30d1f6cb-4bd3-468b-83b1-f3fc40df147b	t	2026-03-21 13:11:59.163901+00	2026-03-21 13:11:59.163901+00	\N
5	محمد علي حسن	01234567890	$2a$12$8x2FGPirRr3U0EjWWY4gNeix2trM2ni0wIvqqcUP7hA5S7ZmpVMVW	client	200.00	120	85abf253-397a-4e75-b11c-054b9f8f36b3	t	2026-03-21 13:11:59.424733+00	2026-03-21 13:11:59.424733+00	\N
6	نورا حسن أحمد	01345678901	$2a$12$pqxFFt5R7uy5OVvv1Rzb.u6DuPNpooHTiRaS8MFrxEYcCjcFXpKjy	client	50.00	20	bd525bb9-1ffa-409c-8709-17140a5406df	t	2026-03-21 13:11:59.683317+00	2026-03-21 13:11:59.683317+00	\N
7	كريم عبدالله	01456789012	$2a$12$UkW1uURkOXLkUrAG1EOXCOeNy.h/LmshVbln2V4TaMWRSpQv/DwW6	client	310.00	180	ce7bba68-2a8e-48e7-8433-24d55b3d119c	t	2026-03-21 13:11:59.941723+00	2026-03-21 13:11:59.941723+00	\N
50	سالم عبدالراضي	01029947831	$2a$12$M.NJtNQxp6sPcFFjFAFw6.5FsIoOhShNA2pTzTH13EOl.ZC0wyBJK	client	0.00	0	5421ed31-f739-4fa2-a45a-3df5ba0f8b89	t	2026-03-21 16:20:28.831894+00	2026-03-21 16:20:28.831894+00	\N
73	سالم علي	01029947833	$2a$12$GHMtqrcJNib253k8mCFYW.H1j7INsBNuSvbfhDltZzKKNZfPA/gvy	client	0.00	157	7027644	t	2026-03-21 22:13:02.495873+00	2026-03-21 22:13:02.495873+00	\N
76	Salah mohamed	01000984633	$2a$12$i2/RhN4IpmB2nqNZ/rdvse1jbpHWfx6IL9qaYvJe/EJ58NaW1IVOy	client	0.00	314	5017682	t	2026-03-21 22:46:42.236387+00	2026-03-21 22:46:42.236387+00	\N
65	سالم راضي	01029947832	$2a$12$ctDVj.V48s2cykEPLP8gt.tRH7YLfdlHwPfP5Qexav.t5orBRAFqC	client	0.00	240	4970823	t	2026-03-21 17:52:16.76334+00	2026-03-21 17:52:16.76334+00	\N
75	احمد عبد الرحيم ربيع	01019839140	$2a$12$OcJ1ldKqVyG84Wxle5pxMeC11hfXdKUHu.golKW94X2EK7SozP1sa	client	0.00	188	3478485	t	2026-03-21 22:35:08.397302+00	2026-03-21 22:35:08.397302+00	\N
161	سالم عبدالواحد	01029947834	$2a$12$aM5G3Aw7UyhsJG7cE0Y.2uZcThPSKrohkdSqwXljuldKZ7BD4zy9i	client	5.00	299	7536108	t	2026-03-22 17:43:51.399835+00	2026-03-22 17:43:51.399835+00	\N
74	محمد عبد الراضي	01096267021	$2a$12$N.lf8rzBkxEPXk.aFzBJkOQ7PkGKoHU1Mi7tKX.GWOnKDcHWuQv.m	client	0.00	15	6866201	t	2026-03-21 22:16:22.96538+00	2026-03-21 22:16:22.96538+00	\N
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
\.


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 7, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 35, true);


--
-- Name: price_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.price_settings_id_seq', 261, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 360, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 72, true);


--
-- Name: space_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.space_settings_id_seq', 177, true);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 177, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 616, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 30, true);


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
-- Name: price_settings price_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_settings
    ADD CONSTRAINT price_settings_pkey PRIMARY KEY (id);


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
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


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
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);


--
-- Name: idx_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_status ON public.sessions USING btree (status);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


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
-- Name: invoices invoices_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9cCnqt07eZ4vILpelJElIhD3Am7nqKHLLoan5vcQUEUY7XDCfMW3CMrZEmDdzzM


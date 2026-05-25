--
-- PostgreSQL database dump
--

\restrict C2MqpzbP7aOcRN8xjpmQWVoSsakb4vX8TqeTQjuQi4cuBsErUSLzQzdr5eJh6cj

-- Dumped from database version 17.8 (130b160)
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
    space_name character varying(100) DEFAULT 'منطقة العمل المشتركة'::character varying NOT NULL,
    invoice_type character varying(20) DEFAULT 'session'::character varying NOT NULL,
    subscription_id integer
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
    is_subscription_session boolean DEFAULT false NOT NULL
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
    created_at timestamp with time zone DEFAULT now() NOT NULL
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

COPY public.coupons (id, user_id, code, discount_pct, is_used, expires_at, created_at) FROM stdin;
5	\N	PROMO-QNS2HC	20	t	2026-05-10 11:41:13.711+00	2026-04-10 11:41:13.714235+00
4	\N	LINK20	20	t	2026-05-10 09:29:42.669+00	2026-04-10 09:29:42.670308+00
7	73	LINK20-A2J29W	20	t	2026-05-12 00:04:36.229+00	2026-04-12 00:04:36.233726+00
6	\N	LINK10	10	t	2026-05-10 22:46:25.952+00	2026-04-10 22:46:25.954184+00
8	631	LINK20-EDH9HD	20	t	2026-05-15 09:47:09.062+00	2026-04-15 09:47:09.066834+00
9	\N	LINK50	50	t	2026-05-15 10:32:04.027+00	2026-04-15 10:32:04.028553+00
10	161	LINK20-F4F7W3	20	f	2026-05-15 18:36:36.664+00	2026-04-15 18:36:36.667288+00
11	65	LINK20-GWVY9U	20	f	2026-05-15 18:42:54.976+00	2026-04-15 18:42:54.98182+00
12	74	LINK20-JVPW6L	20	t	2026-05-24 09:56:09.697+00	2026-04-24 09:56:09.82076+00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, session_id, user_id, client_name, client_phone, session_cost, duration_min, price_per_hr, services, services_cost, coupon_code, discount_pct, discount_amount, subtotal, total, payment_method, note, created_at, wallet_paid, cash_paid, space_key, space_name, invoice_type, subscription_id) FROM stdin;
1	INV-955988	31	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 21:19:20.951721+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N
2	INV-825759	28	75	احمد عبد الرحيم ربيع	01019839140	120.00	576	30.00	[]	0.00	LINK20	20	24.00	120.00	96.00	wallet	\N	2026-04-10 22:40:58.188692+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N
3	INV-649706	33	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 23:29:39.240654+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N
4	INV-805401	34	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-10 23:40:21.583648+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N
5	INV-477916	35	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-10 23:41:52.081479+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N
6	INV-579604	36	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-10 23:43:17.87553+00	0.00	0.00	cowork	منطقة العمل المشتركة	session	\N
7	INV-656022	42	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	partial	\N	2026-04-11 23:21:02.116635+00	20.00	10.00	cowork	منطقة العمل المشتركة	session	\N
8	INV-668037	43	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	LINK20-A2J29W	20	6.00	30.00	24.00	cash	\N	2026-04-12 00:28:36.157587+00	0.00	24.00	cowork	منطقة العمل المشتركة	session	\N
9	INV-332301	44	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 18:25:40.120932+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N
10	INV-377818	45	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	30.00	\N	0	0.00	60.00	60.00	cash	\N	2026-04-12 18:44:31.585508+00	0.00	60.00	cowork	منطقة العمل المشتركة	session	\N
11	INV-564721	46	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	25.00	\N	0	0.00	55.00	55.00	partial	\N	2026-04-12 18:46:17.487396+00	20.00	35.00	cowork	منطقة العمل المشتركة	session	\N
12	INV-861371	47	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}]	10.00	\N	0	0.00	40.00	40.00	cash	\N	2026-04-12 19:08:38.474168+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N
13	INV-300521	48	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "عصير", "price": "15.00"}]	15.00	\N	0	0.00	45.00	45.00	partial	\N	2026-04-12 19:15:14.712254+00	0.00	45.00	cowork	منطقة العمل المشتركة	session	\N
14	INV-548751	49	75	احمد عبد الرحيم ربيع	01019839140	30.00	53	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 20:09:29.302803+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N
15	INV-598838	50	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	12.00	\N	0	0.00	42.00	42.00	partial	\N	2026-04-12 20:10:40.727295+00	0.00	42.00	cowork	منطقة العمل المشتركة	session	\N
16	INV-322318	51	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 3, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	10.00	\N	0	0.00	40.00	40.00	partial	\N	2026-04-12 20:22:48.123108+00	0.00	40.00	cowork	منطقة العمل المشتركة	session	\N
17	INV-933880	52	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	partial	\N	2026-04-12 20:32:25.871545+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N
18	INV-424343	53	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	34.00	\N	0	0.00	64.00	64.00	partial	\N	2026-04-12 20:57:22.609694+00	5.00	59.00	cowork	منطقة العمل المشتركة	session	\N
19	INV-581138	54	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-12 21:00:49.023983+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N
20	INV-455050	55	74	محمد عبد الراضي	01096267021	30.00	1	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	10.00	\N	0	0.00	40.00	40.00	wallet	\N	2026-04-12 21:15:07.618786+00	10.00	30.00	cowork	منطقة العمل المشتركة	session	\N
21	INV-538308	56	76	Salah mohamed	01000984633	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-12 21:32:27.147514+00	10.00	20.00	cowork	منطقة العمل المشتركة	session	\N
22	INV-805429	57	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	35.00	\N	0	0.00	65.00	65.00	wallet	\N	2026-04-13 07:37:22.154201+00	65.00	0.00	cowork	منطقة العمل المشتركة	session	\N
23	INV-756585	58	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}]	25.00	\N	0	0.00	55.00	55.00	wallet	\N	2026-04-13 12:52:56.085048+00	55.00	0.00	cowork	منطقة العمل المشتركة	session	\N
24	INV-187271	60	74	محمد عبد الراضي	01096267021	120.00	288	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}]	30.00	\N	0	0.00	150.00	150.00	cash	\N	2026-04-13 17:43:33.557715+00	0.00	150.00	cowork	منطقة العمل المشتركة	session	\N
25	INV-542239	61	76	Salah mohamed	01000984633	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-04-13 17:49:49.186706+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N
26	INV-776787	63	76	Salah mohamed	01000984633	150.00	1	150.00	[]	0.00	\N	0	0.00	150.00	150.00	cash	\N	2026-04-13 22:53:34.542397+00	0.00	150.00	cowork	منطقة العمل المشتركة	session	\N
27	INV-838656	62	161	سالم عبدالواحد	01029947834	30.00	2	30.00	[]	0.00	\N	0	0.00	30.00	30.00	cash	\N	2026-04-13 22:54:10.583511+00	0.00	30.00	cowork	منطقة العمل المشتركة	session	\N
28	INV-874484	64	161	سالم عبدالواحد	01029947834	200.00	1	200.00	[]	0.00	\N	0	0.00	200.00	200.00	cash	\N	2026-04-13 23:03:49.400936+00	0.00	200.00	cowork	منطقة العمل المشتركة	session	\N
29	INV-524407	59	75	احمد عبد الرحيم ربيع	01019839140	120.00	661	30.00	[]	0.00	\N	0	0.00	120.00	120.00	partial	\N	2026-04-13 23:55:35.48046+00	15.00	105.00	cowork	منطقة العمل المشتركة	session	\N
30	INV-484944	65	73	سالم علي	01029947833	1500.00	583	150.00	[]	0.00	\N	0	0.00	1500.00	1500.00	cash	\N	2026-04-14 09:41:38.623469+00	0.00	1500.00	cowork	منطقة العمل المشتركة	session	\N
31	INV-561134	66	76	Salah mohamed	01000984633	2400.00	883	200.00	[]	0.00	\N	0	0.00	2400.00	2400.00	cash	\N	2026-04-14 14:39:30.006198+00	0.00	2400.00	cowork	منطقة العمل المشتركة	session	\N
32	INV-600646	68	161	سالم عبدالواحد	01029947834	120.00	228	30.00	[]	0.00	\N	0	0.00	120.00	120.00	cash	\N	2026-04-14 14:40:06.048391+00	0.00	120.00	cowork	منطقة العمل المشتركة	session	\N
33	INV-645449	67	65	سالم راضي	01029947832	2400.00	884	200.00	[]	0.00	\N	0	0.00	2400.00	2400.00	cash	\N	2026-04-14 14:40:52.606161+00	0.00	2400.00	cowork	منطقة العمل المشتركة	session	\N
34	INV-978067	69	75	احمد عبد الرحيم ربيع	01019839140	1200.00	441	150.00	[]	0.00	\N	0	0.00	1200.00	1200.00	cash	\N	2026-04-14 21:59:47.828236+00	0.00	1200.00	cowork	منطقة العمل المشتركة	session	\N
35	INV-090600	70	161	سالم عبدالواحد	01029947834	1600.00	440	200.00	[]	0.00	\N	0	0.00	1600.00	1600.00	cash	\N	2026-04-14 22:01:33.190935+00	0.00	1600.00	cowork	منطقة العمل المشتركة	session	\N
36	INV-509677	73	631	A. Sh	01045326581	30.00	2	30.00	[{"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	\N	2026-04-15 09:40:30.698155+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N
37	INV-144070	74	631	A. Sh	01045326581	30.00	1	30.00	[{"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	5.00	LINK10	10	3.50	35.00	31.50	cash	\N	2026-04-15 09:43:43.335528+00	0.00	31.50	cowork	منطقة العمل المشتركة	session	\N
38	INV-629739	75	631	A. Sh	01045326581	30.00	1	30.00	[{"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}, {"qty": 3, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 2, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}]	88.00	LINK20-EDH9HD	20	23.60	118.00	94.40	cash	\N	2026-04-15 09:52:24.543779+00	0.00	94.40	cowork	منطقة العمل المشتركة	session	\N
39	INV-438375	72	73	سالم علي	01029947833	800.00	708	200.00	[]	0.00	\N	0	0.00	800.00	800.00	cash	\N	2026-04-15 10:04:25.382052+00	0.00	800.00	cowork	منطقة العمل المشتركة	session	\N
40	INV-490654	71	74	محمد عبد الراضي	01096267021	600.00	711	150.00	[]	0.00	\N	0	0.00	600.00	600.00	cash	\N	2026-04-15 10:05:09.81444+00	0.00	600.00	cowork	منطقة العمل المشتركة	session	\N
41	INV-764896	76	631	A. Sh	01045326581	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-15 10:09:44.811077+00	20.00	10.00	cowork	منطقة العمل المشتركة	session	\N
42	INV-984981	77	631	A. Sh	01045326581	25.00	1	25.00	[]	0.00	LINK50	50	12.50	25.00	12.50	cash	\N	2026-04-15 10:34:05.450862+00	0.00	12.50	cowork	منطقة العمل المشتركة	session	\N
43	INV-052481	80	75	احمد عبد الرحيم ربيع	01019839140	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-15 18:01:09.533373+00	30.00	0.00	cowork	منطقة العمل المشتركة	session	\N
44	INV-238223	78	631	A. Sh	01045326581	150.00	5	150.00	[]	0.00	\N	0	0.00	150.00	150.00	partial	\N	2026-04-15 18:04:08.052042+00	20.00	130.00	meeting	غرفة الاجتماعات	session	\N
45	INV-418642	82	65	سالم راضي	01029947832	200.00	1	200.00	[]	0.00	\N	0	0.00	200.00	200.00	cash	\N	2026-04-15 18:23:45.104257+00	0.00	200.00	lessons	غرفة الدروس	session	\N
46	INV-380504	83	161	سالم عبدالواحد	01029947834	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "طباعة ورق ألوان ", "price": "2.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "طباعة (ورقة)", "price": "1.00"}, {"qty": 1, "name": "سكانر", "price": "1.00"}]	84.00	\N	0	0.00	114.00	114.00	partial	\N	2026-04-15 18:40:00.674801+00	5.00	109.00	cowork	منطقة العمل المشتركة	session	\N
47	INV-663752	84	631	A. Sh	01045326581	200.00	1	200.00	[{"qty": 5, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	45.00	\N	0	0.00	245.00	245.00	partial	\N	2026-04-15 18:44:47.401095+00	100.00	145.00	lessons	غرفة الدروس	session	\N
48	INV-529131	81	75	احمد عبد الرحيم ربيع	01019839140	600.00	238	150.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "مياه كبيرة ", "price": "10.00"}, {"qty": 1, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}]	45.00	\N	0	0.00	645.00	645.00	partial	\N	2026-04-15 22:02:43.960532+00	20.00	625.00	meeting	غرفة الاجتماعات	session	\N
49	INV-472609	85	631	A. Sh	01045326581	600.00	11767	150.00	[]	0.00	\N	0	0.00	600.00	600.00	cash	\N	2026-04-24 02:24:38.813351+00	0.00	600.00	meeting	غرفة الاجتماعات	session	\N
50	INV-492362	79	74	محمد عبد الراضي	01096267021	800.00	12026	200.00	[]	0.00	\N	0	0.00	800.00	800.00	cash	\N	2026-04-24 02:24:54.002196+00	0.00	800.00	lessons	غرفة الدروس	session	\N
51	INV-736966	86	74	محمد عبد الراضي	01096267021	150.00	1	150.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}, {"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}, {"qty": 5, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "عصير", "price": "15.00"}]	90.00	LINK20-JVPW6L	20	48.00	240.00	192.00	partial	\N	2026-04-24 10:02:26.509391+00	0.00	192.00	meeting	غرفة الاجتماعات	session	\N
52	INV-322979	87	73	سالم علي	01029947833	30.00	1	30.00	[]	0.00	\N	0	0.00	30.00	30.00	wallet	\N	2026-04-25 13:05:52.869368+00	30.00	0.00	cowork	منطقة العمل المشتركة	session	\N
53	INV-523774	88	73	سالم علي	01029947833	200.00	1	200.00	[{"qty": 1, "name": "قهوة", "price": "20.00"}, {"qty": 2, "name": "مياه صغيرة ", "price": "5.00"}, {"qty": 1, "name": "شاي", "price": "10.00"}]	40.00	\N	0	0.00	240.00	240.00	partial	\N	2026-04-25 13:09:04.971667+00	20.00	220.00	lessons	غرفة الدروس	session	\N
54	INV-745005	89	73	سالم علي	01029947833	30.00	1	30.00	[{"qty": 1, "name": "مشروب غازي ", "price": "20.00"}]	20.00	\N	0	0.00	50.00	50.00	cash	نسيت اضيف المشروب الغازي على الفاتروة السابقة 	2026-04-25 13:30:31.277606+00	0.00	50.00	cowork	منطقة العمل المشتركة	session	\N
55	SUB-016729	\N	73	سالم علي	01029947833	1200.00	\N	\N	[]	0.00	\N	0	0.00	1200.00	1200.00	cash	اشتراك باقة أساسية — ٢٥‏/٤‏/٢٠٢٦	2026-04-25 14:06:56.366856+00	0.00	1200.00	cowork	اشتراك شهري	subscription	1
56	INV-347266	90	161	سالم عبدالواحد	01029947834	90.00	136	30.00	[]	0.00	\N	0	0.00	90.00	90.00	cash	\N	2026-04-25 22:32:56.868966+00	0.00	90.00	cowork	منطقة العمل المشتركة	session	\N
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
-- Data for Name: session_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_orders (id, session_id, user_id, service_id, service_name, price, qty, added_by, added_by_name, can_remove, created_at) FROM stdin;
2	90	161	254	مشروب غازي 	20.00	1	staff	مدير النظام	t	2026-04-25 21:44:42.004374+00
3	90	161	3	مياه صغيرة 	5.00	1	staff	مدير النظام	t	2026-04-25 21:44:51.428939+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, check_in, check_out, duration_min, price_per_hr, cost, payment_method, status, created_at, space_key, space_name, max_hours, subscription_id, is_subscription_session) FROM stdin;
1	74	2026-03-22 16:26:17.007837+00	2026-03-22 16:26:17.071+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.007837+00	cowork	منطقة العمل المشتركة	4	\N	f
57	161	2026-04-13 07:36:38.518046+00	2026-04-13 07:36:45.645+00	1	30.00	30.00	wallet	completed	2026-04-13 07:36:38.518046+00	cowork	منطقة العمل المشتركة	4	\N	f
2	74	2026-03-22 16:26:17.099473+00	2026-03-22 16:26:17.156+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.099473+00	cowork	منطقة العمل المشتركة	4	\N	f
3	74	2026-03-22 16:26:17.173729+00	2026-03-22 16:26:17.369+00	1	15.00	0.25	wallet	completed	2026-03-22 16:26:17.173729+00	cowork	منطقة العمل المشتركة	4	\N	f
58	75	2026-04-13 12:52:29.620006+00	2026-04-13 12:52:36.107+00	1	30.00	30.00	wallet	completed	2026-04-13 12:52:29.620006+00	cowork	منطقة العمل المشتركة	4	\N	f
4	74	2026-03-22 16:27:53.709325+00	2026-03-22 16:27:53.872+00	1	15.00	0.25	wallet	completed	2026-03-22 16:27:53.709325+00	cowork	منطقة العمل المشتركة	4	\N	f
5	74	2026-03-22 16:27:53.937689+00	2026-03-22 16:27:54.118+00	1	15.00	0.25	wallet	completed	2026-03-22 16:27:53.937689+00	cowork	منطقة العمل المشتركة	4	\N	f
60	74	2026-04-13 12:55:10.020864+00	2026-04-13 17:43:06.799+00	288	30.00	120.00	wallet	completed	2026-04-13 12:55:10.020864+00	cowork	منطقة العمل المشتركة	4	\N	f
6	75	2026-03-22 16:55:47.060463+00	2026-03-23 06:49:04.886+00	834	15.00	208.50	wallet	completed	2026-03-22 16:55:47.060463+00	cowork	منطقة العمل المشتركة	4	\N	f
7	161	2026-03-22 23:28:29.694773+00	2026-03-24 17:20:00.961+00	2512	12.00	502.40	wallet	completed	2026-03-22 23:28:29.694773+00	cowork	منطقة العمل المشتركة	4	\N	f
8	73	2026-03-24 17:19:41.040407+00	2026-03-24 17:35:28.623+00	16	15.00	4.00	wallet	completed	2026-03-24 17:19:41.040407+00	cowork	منطقة العمل المشتركة	4	\N	f
61	76	2026-04-13 17:48:56.364132+00	2026-04-13 17:49:01.834+00	1	30.00	30.00	wallet	completed	2026-04-13 17:48:56.364132+00	cowork	منطقة العمل المشتركة	4	\N	f
9	73	2026-03-24 22:30:35.722137+00	2026-03-24 22:42:33.951+00	12	12.00	2.40	wallet	completed	2026-03-24 22:30:35.722137+00	cowork	منطقة العمل المشتركة	4	\N	f
10	73	2026-03-24 22:55:39.151875+00	2026-03-24 23:09:00.169+00	14	12.00	2.80	wallet	completed	2026-03-24 22:55:39.151875+00	cowork	منطقة العمل المشتركة	4	\N	f
11	73	2026-03-25 09:11:39.930753+00	2026-03-25 10:42:52.884+00	92	10.00	15.33	wallet	completed	2026-03-25 09:11:39.930753+00	cowork	منطقة العمل المشتركة	4	\N	f
63	76	2026-04-13 22:52:42.896368+00	2026-04-13 22:52:56.634+00	1	150.00	150.00	wallet	completed	2026-04-13 22:52:42.896368+00	meeting	غرفة الاجتماعات	12	\N	f
12	73	2026-03-26 17:00:14.238112+00	2026-03-26 17:00:24.016+00	1	15.00	0.25	wallet	completed	2026-03-26 17:00:14.238112+00	cowork	منطقة العمل المشتركة	4	\N	f
62	161	2026-04-13 22:52:03.178183+00	2026-04-13 22:53:58.498+00	2	30.00	30.00	wallet	completed	2026-04-13 22:52:03.178183+00	cowork	منطقة العمل المشتركة	4	\N	f
13	73	2026-03-26 17:00:38.462156+00	2026-03-28 00:20:55.106+00	1881	15.00	60.00	wallet	completed	2026-03-26 17:00:38.462156+00	cowork	منطقة العمل المشتركة	4	\N	f
14	73	2026-03-28 16:40:22.146319+00	2026-03-28 16:43:20.539+00	3	15.00	0.75	wallet	completed	2026-03-28 16:40:22.146319+00	cowork	منطقة العمل المشتركة	4	\N	f
64	161	2026-04-13 22:54:28.278261+00	2026-04-13 22:54:34.338+00	1	200.00	200.00	wallet	completed	2026-04-13 22:54:28.278261+00	lessons	غرفة الدروس	12	\N	f
15	73	2026-03-28 17:15:38.816663+00	2026-03-28 17:15:57.457+00	1	30.00	0.50	wallet	completed	2026-03-28 17:15:38.816663+00	cowork	منطقة العمل المشتركة	4	\N	f
16	161	2026-03-30 13:09:36.056537+00	2026-03-30 13:09:40.936+00	1	30.00	0.50	wallet	completed	2026-03-30 13:09:36.056537+00	cowork	منطقة العمل المشتركة	4	\N	f
59	75	2026-04-13 12:54:53.912921+00	2026-04-13 23:55:24.21+00	661	30.00	120.00	wallet	completed	2026-04-13 12:54:53.912921+00	cowork	منطقة العمل المشتركة	4	\N	f
17	73	2026-03-30 21:17:33.717131+00	2026-03-30 21:17:45.39+00	1	30.00	0.50	wallet	completed	2026-03-30 21:17:33.717131+00	cowork	منطقة العمل المشتركة	4	\N	f
18	161	2026-03-30 21:19:12.23873+00	2026-03-30 21:21:19.414+00	3	30.00	1.50	wallet	completed	2026-03-30 21:19:12.23873+00	cowork	منطقة العمل المشتركة	4	\N	f
19	161	2026-04-01 23:22:29.708089+00	2026-04-02 15:27:14.263+00	965	30.00	120.00	wallet	completed	2026-04-01 23:22:29.708089+00	cowork	منطقة العمل المشتركة	4	\N	f
65	73	2026-04-13 23:55:08.446219+00	2026-04-14 09:38:03.775+00	583	150.00	1500.00	wallet	completed	2026-04-13 23:55:08.446219+00	meeting	غرفة الاجتماعات	12	\N	f
20	161	2026-04-02 15:28:00.386344+00	2026-04-09 17:44:24.027+00	10217	30.00	120.00	wallet	completed	2026-04-02 15:28:00.386344+00	cowork	منطقة العمل المشتركة	4	\N	f
21	73	2026-04-09 17:43:28.927434+00	2026-04-09 17:45:12.392+00	2	30.00	30.00	wallet	completed	2026-04-09 17:43:28.927434+00	cowork	منطقة العمل المشتركة	4	\N	f
22	73	2026-04-09 17:47:35.074878+00	2026-04-09 23:43:37.454+00	357	30.00	120.00	wallet	completed	2026-04-09 17:47:35.074878+00	cowork	منطقة العمل المشتركة	4	\N	f
66	76	2026-04-13 23:56:21.454531+00	2026-04-14 14:39:20.035+00	883	200.00	2400.00	wallet	completed	2026-04-13 23:56:21.454531+00	lessons	غرفة الدروس	12	\N	f
23	73	2026-04-09 23:44:02.156463+00	2026-04-09 23:44:21.01+00	1	30.00	30.00	wallet	completed	2026-04-09 23:44:02.156463+00	cowork	منطقة العمل المشتركة	4	\N	f
68	161	2026-04-14 10:52:07.403917+00	2026-04-14 14:39:59.541+00	228	30.00	120.00	wallet	completed	2026-04-14 10:52:07.403917+00	cowork	منطقة العمل المشتركة	4	\N	f
24	73	2026-04-09 23:53:56.854953+00	2026-04-09 23:54:12.731+00	1	35.00	35.00	wallet	completed	2026-04-09 23:53:56.854953+00	cowork	منطقة العمل المشتركة	4	\N	f
25	161	2026-04-10 00:13:14.12352+00	2026-04-10 00:13:38.601+00	1	35.00	35.00	wallet	completed	2026-04-10 00:13:14.12352+00	cowork	منطقة العمل المشتركة	4	\N	f
67	65	2026-04-13 23:56:46.197474+00	2026-04-14 14:40:44.354+00	884	200.00	2400.00	wallet	completed	2026-04-13 23:56:46.197474+00	lessons	غرفة الدروس	12	\N	f
26	161	2026-04-10 09:21:09.899437+00	2026-04-10 09:21:29.461+00	1	30.00	30.00	wallet	completed	2026-04-10 09:21:09.899437+00	cowork	منطقة العمل المشتركة	4	\N	f
69	75	2026-04-14 14:39:05.749542+00	2026-04-14 21:59:36.951+00	441	150.00	1200.00	wallet	completed	2026-04-14 14:39:05.749542+00	meeting	غرفة الاجتماعات	12	\N	f
27	161	2026-04-10 09:30:31.116553+00	2026-04-10 09:30:37.042+00	1	30.00	30.00	wallet	completed	2026-04-10 09:30:31.116553+00	cowork	منطقة العمل المشتركة	4	\N	f
70	161	2026-04-14 14:40:17.637376+00	2026-04-14 22:00:09.114+00	440	200.00	1600.00	wallet	completed	2026-04-14 14:40:17.637376+00	lessons	غرفة الدروس	12	\N	f
29	76	2026-04-10 13:05:33.404395+00	2026-04-10 13:05:43.241+00	1	30.00	30.00	wallet	completed	2026-04-10 13:05:33.404395+00	cowork	منطقة العمل المشتركة	4	\N	f
30	161	2026-04-10 21:07:33.163096+00	2026-04-10 21:07:48.495+00	1	30.00	30.00	wallet	completed	2026-04-10 21:07:33.163096+00	cowork	منطقة العمل المشتركة	4	\N	f
31	161	2026-04-10 21:19:04.714265+00	2026-04-10 21:19:15.673+00	1	30.00	30.00	wallet	completed	2026-04-10 21:19:04.714265+00	cowork	منطقة العمل المشتركة	4	\N	f
28	75	2026-04-10 13:05:18.673586+00	2026-04-10 22:40:26.687+00	576	30.00	120.00	wallet	completed	2026-04-10 13:05:18.673586+00	cowork	منطقة العمل المشتركة	4	\N	f
73	631	2026-04-15 09:30:02.03193+00	2026-04-15 09:31:48.726+00	2	30.00	30.00	wallet	completed	2026-04-15 09:30:02.03193+00	cowork	منطقة العمل المشتركة	4	\N	f
32	75	2026-04-10 23:24:45.733484+00	2026-04-10 23:24:57.966+00	1	30.00	30.00	wallet	completed	2026-04-10 23:24:45.733484+00	cowork	منطقة العمل المشتركة	4	\N	f
33	75	2026-04-10 23:27:23.287334+00	2026-04-10 23:27:29.324+00	1	30.00	30.00	wallet	completed	2026-04-10 23:27:23.287334+00	cowork	منطقة العمل المشتركة	4	\N	f
74	631	2026-04-15 09:42:18.383005+00	2026-04-15 09:42:23.262+00	1	30.00	30.00	wallet	completed	2026-04-15 09:42:18.383005+00	cowork	منطقة العمل المشتركة	4	\N	f
34	76	2026-04-10 23:29:50.527049+00	2026-04-10 23:30:04.989+00	1	30.00	30.00	wallet	completed	2026-04-10 23:29:50.527049+00	cowork	منطقة العمل المشتركة	4	\N	f
35	76	2026-04-10 23:41:09.881353+00	2026-04-10 23:41:17.585+00	1	30.00	30.00	wallet	completed	2026-04-10 23:41:09.881353+00	cowork	منطقة العمل المشتركة	4	\N	f
75	631	2026-04-15 09:50:21.743703+00	2026-04-15 09:50:28.934+00	1	30.00	30.00	wallet	completed	2026-04-15 09:50:21.743703+00	cowork	منطقة العمل المشتركة	4	\N	f
36	75	2026-04-10 23:42:52.017272+00	2026-04-10 23:42:59.123+00	1	30.00	30.00	wallet	completed	2026-04-10 23:42:52.017272+00	cowork	منطقة العمل المشتركة	4	\N	f
72	73	2026-04-14 22:16:05.258986+00	2026-04-15 10:03:57.534+00	708	200.00	800.00	wallet	completed	2026-04-14 22:16:05.258986+00	lessons	غرفة الدروس	4	\N	f
37	76	2026-04-11 07:00:24.310014+00	2026-04-11 07:00:29.713+00	1	30.00	30.00	wallet	completed	2026-04-11 07:00:24.310014+00	cowork	منطقة العمل المشتركة	4	\N	f
71	74	2026-04-14 22:14:38.060792+00	2026-04-15 10:04:49.858+00	711	150.00	600.00	wallet	completed	2026-04-14 22:14:38.060792+00	meeting	غرفة الاجتماعات	4	\N	f
38	75	2026-04-11 07:10:02.951467+00	2026-04-11 07:10:18.466+00	1	30.00	30.00	wallet	completed	2026-04-11 07:10:02.951467+00	cowork	منطقة العمل المشتركة	4	\N	f
39	76	2026-04-11 13:27:24.702161+00	2026-04-11 13:28:05.339+00	1	30.00	30.00	wallet	completed	2026-04-11 13:27:24.702161+00	cowork	منطقة العمل المشتركة	4	\N	f
40	76	2026-04-11 22:59:05.346505+00	2026-04-11 22:59:13.438+00	1	30.00	30.00	wallet	completed	2026-04-11 22:59:05.346505+00	cowork	منطقة العمل المشتركة	4	\N	f
76	631	2026-04-15 10:09:13.111833+00	2026-04-15 10:09:24.091+00	1	30.00	30.00	wallet	completed	2026-04-15 10:09:13.111833+00	cowork	منطقة العمل المشتركة	4	\N	f
41	75	2026-04-11 23:06:02.425441+00	2026-04-11 23:07:20.05+00	2	30.00	30.00	wallet	completed	2026-04-11 23:06:02.425441+00	cowork	منطقة العمل المشتركة	4	\N	f
42	76	2026-04-11 23:20:50.036592+00	2026-04-11 23:20:56.201+00	1	30.00	30.00	wallet	completed	2026-04-11 23:20:50.036592+00	cowork	منطقة العمل المشتركة	4	\N	f
43	73	2026-04-12 00:27:34.73088+00	2026-04-12 00:27:48.28+00	1	30.00	30.00	wallet	completed	2026-04-12 00:27:34.73088+00	cowork	منطقة العمل المشتركة	4	\N	f
44	161	2026-04-12 18:03:11.817178+00	2026-04-12 18:03:19.82+00	1	30.00	30.00	wallet	completed	2026-04-12 18:03:11.817178+00	cowork	منطقة العمل المشتركة	4	\N	f
45	161	2026-04-12 18:39:54.910179+00	2026-04-12 18:40:03.382+00	1	30.00	30.00	wallet	completed	2026-04-12 18:39:54.910179+00	cowork	منطقة العمل المشتركة	4	\N	f
46	161	2026-04-12 18:45:58.564089+00	2026-04-12 18:46:02.681+00	1	30.00	30.00	wallet	completed	2026-04-12 18:45:58.564089+00	cowork	منطقة العمل المشتركة	4	\N	f
47	76	2026-04-12 19:07:32.314125+00	2026-04-12 19:07:40.616+00	1	30.00	30.00	wallet	completed	2026-04-12 19:07:32.314125+00	cowork	منطقة العمل المشتركة	4	\N	f
48	76	2026-04-12 19:14:53.392601+00	2026-04-12 19:14:59.814+00	1	30.00	30.00	partial	completed	2026-04-12 19:14:53.392601+00	cowork	منطقة العمل المشتركة	4	\N	f
49	75	2026-04-12 19:16:18.442013+00	2026-04-12 20:09:08.306+00	53	30.00	30.00	wallet	completed	2026-04-12 19:16:18.442013+00	cowork	منطقة العمل المشتركة	4	\N	f
50	75	2026-04-12 20:09:53.814042+00	2026-04-12 20:09:58.438+00	1	30.00	30.00	partial	completed	2026-04-12 20:09:53.814042+00	cowork	منطقة العمل المشتركة	4	\N	f
51	76	2026-04-12 20:21:57.084353+00	2026-04-12 20:22:01.925+00	1	30.00	30.00	partial	completed	2026-04-12 20:21:57.084353+00	cowork	منطقة العمل المشتركة	4	\N	f
52	161	2026-04-12 20:32:08.975031+00	2026-04-12 20:32:13.504+00	1	30.00	30.00	partial	completed	2026-04-12 20:32:08.975031+00	cowork	منطقة العمل المشتركة	4	\N	f
53	76	2026-04-12 20:56:59.328839+00	2026-04-12 20:57:03.977+00	1	30.00	30.00	wallet	completed	2026-04-12 20:56:59.328839+00	cowork	منطقة العمل المشتركة	4	\N	f
54	73	2026-04-12 20:59:37.118545+00	2026-04-12 20:59:40.539+00	1	30.00	30.00	wallet	completed	2026-04-12 20:59:37.118545+00	cowork	منطقة العمل المشتركة	4	\N	f
55	74	2026-04-12 21:14:09.305994+00	2026-04-12 21:14:14.677+00	1	30.00	30.00	wallet	completed	2026-04-12 21:14:09.305994+00	cowork	منطقة العمل المشتركة	4	\N	f
56	76	2026-04-12 21:31:40.761888+00	2026-04-12 21:32:17.895+00	1	30.00	30.00	wallet	completed	2026-04-12 21:31:40.761888+00	cowork	منطقة العمل المشتركة	4	\N	f
77	631	2026-04-15 10:29:39.374799+00	2026-04-15 10:29:44.135+00	1	25.00	25.00	wallet	completed	2026-04-15 10:29:39.374799+00	cowork	منطقة العمل المشتركة	4	\N	f
80	75	2026-04-15 18:00:21.078488+00	2026-04-15 18:00:49.074+00	1	30.00	30.00	wallet	completed	2026-04-15 18:00:21.078488+00	cowork	منطقة العمل المشتركة	4	\N	f
78	631	2026-04-15 17:59:21.016533+00	2026-04-15 18:03:56.894+00	5	150.00	150.00	wallet	completed	2026-04-15 17:59:21.016533+00	meeting	غرفة الاجتماعات	4	\N	f
82	65	2026-04-15 18:23:34.773609+00	2026-04-15 18:23:37.286+00	1	200.00	200.00	wallet	completed	2026-04-15 18:23:34.773609+00	lessons	غرفة الدروس	4	\N	f
83	161	2026-04-15 18:38:10.944696+00	2026-04-15 18:38:15.539+00	1	30.00	30.00	wallet	completed	2026-04-15 18:38:10.944696+00	cowork	منطقة العمل المشتركة	4	\N	f
84	631	2026-04-15 18:44:14.28349+00	2026-04-15 18:44:22.433+00	1	200.00	200.00	wallet	completed	2026-04-15 18:44:14.28349+00	lessons	غرفة الدروس	4	\N	f
81	75	2026-04-15 18:04:58.538923+00	2026-04-15 22:02:08.636+00	238	150.00	600.00	wallet	completed	2026-04-15 18:04:58.538923+00	meeting	غرفة الاجتماعات	4	\N	f
85	631	2026-04-15 22:18:20.684162+00	2026-04-24 02:24:31.614+00	11767	150.00	600.00	wallet	completed	2026-04-15 22:18:20.684162+00	meeting	غرفة الاجتماعات	4	\N	f
79	74	2026-04-15 17:59:38.610765+00	2026-04-24 02:24:51.386+00	12026	200.00	800.00	wallet	completed	2026-04-15 17:59:38.610765+00	lessons	غرفة الدروس	4	\N	f
86	74	2026-04-24 09:58:43.769523+00	2026-04-24 09:58:56.537+00	1	150.00	150.00	partial	completed	2026-04-24 09:58:43.769523+00	meeting	غرفة الاجتماعات	4	\N	f
87	73	2026-04-25 13:05:13.291656+00	2026-04-25 13:05:22.468+00	1	30.00	30.00	wallet	completed	2026-04-25 13:05:13.291656+00	cowork	منطقة العمل المشتركة	4	\N	f
88	73	2026-04-25 13:08:33.242969+00	2026-04-25 13:08:43.244+00	1	200.00	200.00	wallet	completed	2026-04-25 13:08:33.242969+00	lessons	غرفة الدروس	4	\N	f
89	73	2026-04-25 13:28:49.804939+00	2026-04-25 13:29:04.577+00	1	30.00	30.00	wallet	completed	2026-04-25 13:28:49.804939+00	cowork	منطقة العمل المشتركة	4	\N	f
90	161	2026-04-25 20:16:32.127525+00	2026-04-25 22:32:27.361+00	136	30.00	90.00	wallet	completed	2026-04-25 20:16:32.127525+00	cowork	منطقة العمل المشتركة	4	\N	f
\.


--
-- Data for Name: space_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.space_settings (id, space_key, name, first_hour, extra_hour, max_hours, updated_at) FROM stdin;
3	lessons	غرفة الدروس	200.00	100.00	4	2026-04-10 00:21:58.238988+00
2	meeting	غرفة الاجتماعات	150.00	100.00	4	2026-04-10 00:22:06.182329+00
1	cowork	منطقة العمل المشتركة	30.00	30.00	4	2026-04-15 17:59:01.832358+00
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

COPY public.user_subscriptions (id, user_id, plan_id, plan_name, plan_price, discount_rooms, covers_cowork, start_date, end_date, status, payment_method, note, created_at) FROM stdin;
1	73	1	باقة أساسية	1200.00	0	t	2026-04-25 14:06:56.366856+00	2026-05-24 14:06:56.642+00	active	cash	\N	2026-04-25 14:06:56.366856+00
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
76	Salah mohamed	01000984633	$2a$12$i2/RhN4IpmB2nqNZ/rdvse1jbpHWfx6IL9qaYvJe/EJ58NaW1IVOy	client	0.00	314	5017682	t	2026-03-21 22:46:42.236387+00	2026-03-21 22:46:42.236387+00	\N
65	سالم راضي	01029947832	$2a$12$ctDVj.V48s2cykEPLP8gt.tRH7YLfdlHwPfP5Qexav.t5orBRAFqC	client	0.00	160	4970823	t	2026-03-21 17:52:16.76334+00	2026-03-21 17:52:16.76334+00	\N
75	احمد عبد الرحيم ربيع	01019839140	$2a$12$OcJ1ldKqVyG84Wxle5pxMeC11hfXdKUHu.golKW94X2EK7SozP1sa	client	0.00	251	3478485	t	2026-03-21 22:35:08.397302+00	2026-03-21 22:35:08.397302+00	\N
631	A. Sh	01045326581	$2a$12$myvH2gSw/BVpeihdc1fjS.j4peToOEGORoE.pTspr4ydeCD9U3NKi	client	0.00	110	3062212	t	2026-04-15 09:21:12.32619+00	2026-04-15 09:21:12.32619+00	\N
74	محمد عبد الراضي	01096267021	$2a$12$N.lf8rzBkxEPXk.aFzBJkOQ7PkGKoHU1Mi7tKX.GWOnKDcHWuQv.m	client	0.00	70	6866201	t	2026-03-21 22:16:22.96538+00	2026-03-21 22:16:22.96538+00	\N
73	سالم علي	01029947833	$2a$12$GHMtqrcJNib253k8mCFYW.H1j7INsBNuSvbfhDltZzKKNZfPA/gvy	client	0.00	263	7027644	t	2026-03-21 22:13:02.495873+00	2026-03-21 22:13:02.495873+00	\N
161	سالم عبدالواحد	01029947834	$2a$12$aM5G3Aw7UyhsJG7cE0Y.2uZcThPSKrohkdSqwXljuldKZ7BD4zy9i	client	0.00	211	7536108	t	2026-03-22 17:43:51.399835+00	2026-03-22 17:43:51.399835+00	\N
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
\.


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 12, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 56, true);


--
-- Name: price_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.price_settings_id_seq', 465, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 769, true);


--
-- Name: session_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.session_orders_id_seq', 3, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 90, true);


--
-- Name: space_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.space_settings_id_seq', 381, true);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 381, true);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_subscriptions_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1093, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 46, true);


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
-- Name: idx_session_orders_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_orders_session ON public.session_orders USING btree (session_id);


--
-- Name: idx_session_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_orders_user ON public.session_orders USING btree (user_id);


--
-- Name: idx_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_status ON public.sessions USING btree (status);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_user_subs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subs_status ON public.user_subscriptions USING btree (status);


--
-- Name: idx_user_subs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subs_user_id ON public.user_subscriptions USING btree (user_id);


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
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict C2MqpzbP7aOcRN8xjpmQWVoSsakb4vX8TqeTQjuQi4cuBsErUSLzQzdr5eJh6cj


--
-- PostgreSQL database dump
--

\restrict 1KfoMo9bixVfbpKh2DTt0DagBRaKLnOt9Szi5saPjqgB8vhCXmo35msJIBwGrAD

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
    space_key character varying(30) DEFAULT 'cowork'::character varying NOT NULL,
    space_name character varying(100) DEFAULT 'منطقة العمل المشتركة'::character varying NOT NULL,
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
    payment_method character varying(20) DEFAULT 'cash'::character varying,
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
    covers_cowork boolean DEFAULT true NOT NULL,
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
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, session_id, user_id, client_name, client_phone, space_key, space_name, session_cost, duration_min, price_per_hr, services, services_cost, coupon_code, discount_pct, discount_amount, subtotal, total, payment_method, note, created_at, wallet_paid, cash_paid, invoice_type, subscription_id) FROM stdin;
\.


--
-- Data for Name: price_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_settings (id, period_name, start_hour, end_hour, price_per_hr, updated_at) FROM stdin;
1	morning	6	14	10.00	2026-04-23 23:38:25.492948+00
2	evening	14	22	15.00	2026-04-23 23:38:25.492948+00
3	night	22	6	12.00	2026-04-23 23:38:25.492948+00
4	morning	6	14	10.00	2026-04-23 23:38:30.234551+00
5	evening	14	22	15.00	2026-04-23 23:38:30.234551+00
6	night	22	6	12.00	2026-04-23 23:38:30.234551+00
7	morning	6	14	10.00	2026-04-23 23:39:01.554705+00
8	evening	14	22	15.00	2026-04-23 23:39:01.554705+00
9	night	22	6	12.00	2026-04-23 23:39:01.554705+00
10	morning	6	14	10.00	2026-04-23 23:39:01.65868+00
11	evening	14	22	15.00	2026-04-23 23:39:01.65868+00
12	night	22	6	12.00	2026-04-23 23:39:01.65868+00
13	morning	6	14	10.00	2026-04-23 23:39:05.631831+00
14	evening	14	22	15.00	2026-04-23 23:39:05.631831+00
15	night	22	6	12.00	2026-04-23 23:39:05.631831+00
16	morning	6	14	10.00	2026-04-23 23:39:05.665282+00
17	evening	14	22	15.00	2026-04-23 23:39:05.665282+00
18	night	22	6	12.00	2026-04-23 23:39:05.665282+00
19	morning	6	14	10.00	2026-04-23 23:39:07.218796+00
20	evening	14	22	15.00	2026-04-23 23:39:07.218796+00
21	night	22	6	12.00	2026-04-23 23:39:07.218796+00
22	morning	6	14	10.00	2026-04-23 23:39:11.234729+00
23	evening	14	22	15.00	2026-04-23 23:39:11.234729+00
24	night	22	6	12.00	2026-04-23 23:39:11.234729+00
25	morning	6	14	10.00	2026-04-23 23:39:11.33423+00
26	evening	14	22	15.00	2026-04-23 23:39:11.33423+00
27	night	22	6	12.00	2026-04-23 23:39:11.33423+00
28	morning	6	14	10.00	2026-04-23 23:39:26.330312+00
29	evening	14	22	15.00	2026-04-23 23:39:26.330312+00
30	night	22	6	12.00	2026-04-23 23:39:26.330312+00
31	morning	6	14	10.00	2026-04-23 23:39:33.11728+00
32	evening	14	22	15.00	2026-04-23 23:39:33.11728+00
33	night	22	6	12.00	2026-04-23 23:39:33.11728+00
34	morning	6	14	10.00	2026-04-23 23:39:39.032494+00
35	evening	14	22	15.00	2026-04-23 23:39:39.032494+00
36	night	22	6	12.00	2026-04-23 23:39:39.032494+00
37	morning	6	14	10.00	2026-04-23 23:40:09.651865+00
38	evening	14	22	15.00	2026-04-23 23:40:09.651865+00
39	night	22	6	12.00	2026-04-23 23:40:09.651865+00
40	morning	6	14	10.00	2026-04-23 23:40:13.025499+00
41	evening	14	22	15.00	2026-04-23 23:40:13.025499+00
42	night	22	6	12.00	2026-04-23 23:40:13.025499+00
43	morning	6	14	10.00	2026-04-23 23:40:15.623776+00
44	evening	14	22	15.00	2026-04-23 23:40:15.623776+00
45	night	22	6	12.00	2026-04-23 23:40:15.623776+00
46	morning	6	14	10.00	2026-04-23 23:40:17.99335+00
47	evening	14	22	15.00	2026-04-23 23:40:17.99335+00
48	night	22	6	12.00	2026-04-23 23:40:17.99335+00
49	morning	6	14	10.00	2026-04-23 23:40:21.533773+00
50	evening	14	22	15.00	2026-04-23 23:40:21.533773+00
51	night	22	6	12.00	2026-04-23 23:40:21.533773+00
52	morning	6	14	10.00	2026-04-23 23:40:22.389452+00
53	evening	14	22	15.00	2026-04-23 23:40:22.389452+00
54	night	22	6	12.00	2026-04-23 23:40:22.389452+00
55	morning	6	14	10.00	2026-04-23 23:40:24.103578+00
56	evening	14	22	15.00	2026-04-23 23:40:24.103578+00
57	night	22	6	12.00	2026-04-23 23:40:24.103578+00
58	morning	6	14	10.00	2026-04-23 23:40:30.078487+00
59	evening	14	22	15.00	2026-04-23 23:40:30.078487+00
60	night	22	6	12.00	2026-04-23 23:40:30.078487+00
61	morning	6	14	10.00	2026-04-23 23:40:31.072314+00
62	evening	14	22	15.00	2026-04-23 23:40:31.072314+00
63	night	22	6	12.00	2026-04-23 23:40:31.072314+00
64	morning	6	14	10.00	2026-04-23 23:40:34.813346+00
65	evening	14	22	15.00	2026-04-23 23:40:34.813346+00
66	night	22	6	12.00	2026-04-23 23:40:34.813346+00
67	morning	6	14	10.00	2026-04-23 23:40:35.681004+00
68	evening	14	22	15.00	2026-04-23 23:40:35.681004+00
69	night	22	6	12.00	2026-04-23 23:40:35.681004+00
70	morning	6	14	10.00	2026-04-23 23:40:41.466194+00
71	evening	14	22	15.00	2026-04-23 23:40:41.466194+00
72	night	22	6	12.00	2026-04-23 23:40:41.466194+00
73	morning	6	14	10.00	2026-04-23 23:41:52.639219+00
74	evening	14	22	15.00	2026-04-23 23:41:52.639219+00
75	night	22	6	12.00	2026-04-23 23:41:52.639219+00
76	morning	6	14	10.00	2026-04-23 23:49:34.509679+00
77	evening	14	22	15.00	2026-04-23 23:49:34.509679+00
78	night	22	6	12.00	2026-04-23 23:49:34.509679+00
79	morning	6	14	10.00	2026-04-23 23:49:34.678638+00
80	evening	14	22	15.00	2026-04-23 23:49:34.678638+00
81	night	22	6	12.00	2026-04-23 23:49:34.678638+00
82	morning	6	14	10.00	2026-04-23 23:49:34.683936+00
83	evening	14	22	15.00	2026-04-23 23:49:34.683936+00
84	night	22	6	12.00	2026-04-23 23:49:34.683936+00
85	morning	6	14	10.00	2026-04-23 23:50:46.35003+00
86	evening	14	22	15.00	2026-04-23 23:50:46.35003+00
87	night	22	6	12.00	2026-04-23 23:50:46.35003+00
88	morning	6	14	10.00	2026-04-23 23:50:47.083057+00
89	evening	14	22	15.00	2026-04-23 23:50:47.083057+00
90	night	22	6	12.00	2026-04-23 23:50:47.083057+00
91	morning	6	14	10.00	2026-04-23 23:56:08.737738+00
92	evening	14	22	15.00	2026-04-23 23:56:08.737738+00
93	night	22	6	12.00	2026-04-23 23:56:08.737738+00
94	morning	6	14	10.00	2026-04-23 23:56:32.618761+00
95	evening	14	22	15.00	2026-04-23 23:56:32.618761+00
96	night	22	6	12.00	2026-04-23 23:56:32.618761+00
97	morning	6	14	10.00	2026-04-23 23:56:38.916398+00
98	evening	14	22	15.00	2026-04-23 23:56:38.916398+00
99	night	22	6	12.00	2026-04-23 23:56:38.916398+00
100	morning	6	14	10.00	2026-04-23 23:56:39.297216+00
101	evening	14	22	15.00	2026-04-23 23:56:39.297216+00
102	night	22	6	12.00	2026-04-23 23:56:39.297216+00
104	morning	6	14	10.00	2026-04-24 00:06:29.798825+00
105	evening	14	22	15.00	2026-04-24 00:06:29.798825+00
106	night	22	6	12.00	2026-04-24 00:06:29.798825+00
103	morning	6	14	10.00	2026-04-24 00:06:29.806641+00
107	evening	14	22	15.00	2026-04-24 00:06:29.806641+00
108	night	22	6	12.00	2026-04-24 00:06:29.806641+00
109	morning	6	14	10.00	2026-04-24 00:06:30.078651+00
110	evening	14	22	15.00	2026-04-24 00:06:30.078651+00
111	night	22	6	12.00	2026-04-24 00:06:30.078651+00
112	morning	6	14	10.00	2026-04-24 00:06:30.08908+00
113	evening	14	22	15.00	2026-04-24 00:06:30.08908+00
114	night	22	6	12.00	2026-04-24 00:06:30.08908+00
115	morning	6	14	10.00	2026-04-24 00:15:26.677403+00
116	evening	14	22	15.00	2026-04-24 00:15:26.677403+00
117	night	22	6	12.00	2026-04-24 00:15:26.677403+00
118	morning	6	14	10.00	2026-04-24 00:15:26.934457+00
119	evening	14	22	15.00	2026-04-24 00:15:26.934457+00
120	night	22	6	12.00	2026-04-24 00:15:26.934457+00
121	morning	6	14	10.00	2026-04-24 00:23:43.539897+00
122	evening	14	22	15.00	2026-04-24 00:23:43.539897+00
123	night	22	6	12.00	2026-04-24 00:23:43.539897+00
124	morning	6	14	10.00	2026-04-24 00:23:43.784564+00
125	evening	14	22	15.00	2026-04-24 00:23:43.784564+00
126	night	22	6	12.00	2026-04-24 00:23:43.784564+00
127	morning	6	14	10.00	2026-04-24 00:42:46.685955+00
128	evening	14	22	15.00	2026-04-24 00:42:46.685955+00
129	night	22	6	12.00	2026-04-24 00:42:46.685955+00
130	morning	6	14	10.00	2026-04-24 00:42:46.825065+00
131	evening	14	22	15.00	2026-04-24 00:42:46.825065+00
132	night	22	6	12.00	2026-04-24 00:42:46.825065+00
133	morning	6	14	10.00	2026-04-24 00:42:51.505268+00
134	evening	14	22	15.00	2026-04-24 00:42:51.505268+00
135	night	22	6	12.00	2026-04-24 00:42:51.505268+00
136	morning	6	14	10.00	2026-04-24 00:42:51.522932+00
137	evening	14	22	15.00	2026-04-24 00:42:51.522932+00
138	night	22	6	12.00	2026-04-24 00:42:51.522932+00
139	morning	6	14	10.00	2026-04-24 00:43:41.034898+00
140	evening	14	22	15.00	2026-04-24 00:43:41.034898+00
141	night	22	6	12.00	2026-04-24 00:43:41.034898+00
142	morning	6	14	10.00	2026-04-24 00:43:41.863465+00
143	evening	14	22	15.00	2026-04-24 00:43:41.863465+00
144	night	22	6	12.00	2026-04-24 00:43:41.863465+00
145	morning	6	14	10.00	2026-04-24 00:45:54.111015+00
146	evening	14	22	15.00	2026-04-24 00:45:54.111015+00
147	night	22	6	12.00	2026-04-24 00:45:54.111015+00
148	morning	6	14	10.00	2026-04-24 00:45:54.952161+00
149	evening	14	22	15.00	2026-04-24 00:45:54.952161+00
150	night	22	6	12.00	2026-04-24 00:45:54.952161+00
151	morning	6	14	10.00	2026-04-24 00:45:55.277576+00
152	evening	14	22	15.00	2026-04-24 00:45:55.277576+00
153	night	22	6	12.00	2026-04-24 00:45:55.277576+00
154	morning	6	14	10.00	2026-04-24 01:25:55.671118+00
155	evening	14	22	15.00	2026-04-24 01:25:55.671118+00
156	night	22	6	12.00	2026-04-24 01:25:55.671118+00
157	morning	6	14	10.00	2026-04-24 01:26:27.207976+00
158	evening	14	22	15.00	2026-04-24 01:26:27.207976+00
159	night	22	6	12.00	2026-04-24 01:26:27.207976+00
160	morning	6	14	10.00	2026-04-24 01:26:32.466665+00
161	evening	14	22	15.00	2026-04-24 01:26:32.466665+00
162	night	22	6	12.00	2026-04-24 01:26:32.466665+00
163	morning	6	14	10.00	2026-04-24 01:27:28.150095+00
164	evening	14	22	15.00	2026-04-24 01:27:28.150095+00
165	night	22	6	12.00	2026-04-24 01:27:28.150095+00
277	morning	6	14	10.00	2026-04-24 01:34:37.290523+00
278	evening	14	22	15.00	2026-04-24 01:34:37.290523+00
279	night	22	6	12.00	2026-04-24 01:34:37.290523+00
280	morning	6	14	10.00	2026-04-24 01:34:37.46455+00
281	evening	14	22	15.00	2026-04-24 01:34:37.46455+00
282	night	22	6	12.00	2026-04-24 01:34:37.46455+00
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, price, is_active, created_at, updated_at) FROM stdin;
1	قهوة	15.00	t	2026-04-23 23:38:25.657613+00	2026-04-23 23:38:25.657613+00
2	شاي	10.00	t	2026-04-23 23:38:25.657613+00	2026-04-23 23:38:25.657613+00
3	مياه	5.00	t	2026-04-23 23:38:25.657613+00	2026-04-23 23:38:25.657613+00
4	عصير	20.00	t	2026-04-23 23:38:25.657613+00	2026-04-23 23:38:25.657613+00
5	طباعة (ورقة)	3.00	t	2026-04-23 23:38:25.657613+00	2026-04-23 23:38:25.657613+00
6	سكانر	5.00	t	2026-04-23 23:38:25.657613+00	2026-04-23 23:38:25.657613+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, check_in, check_out, duration_min, price_per_hr, cost, payment_method, status, created_at, space_key, space_name, max_hours, subscription_id, is_subscription_session) FROM stdin;
\.


--
-- Data for Name: space_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.space_settings (id, space_key, name, first_hour, extra_hour, max_hours, updated_at) FROM stdin;
1	cowork	منطقة العمل المشتركة	30.00	30.00	4	2026-04-23 23:38:25.574859+00
2	meeting	غرفة الاجتماعات	150.00	100.00	12	2026-04-23 23:38:25.574859+00
3	lessons	غرفة الدروس	200.00	100.00	12	2026-04-23 23:38:25.574859+00
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, price, features, discount_rooms, covers_cowork, is_active, created_at, updated_at) FROM stdin;
1	باقة أساسية	500.00	دخول غير محدود لمنطقة العمل المشتركة	0	t	t	2026-04-23 23:38:25.741833+00	2026-04-23 23:38:25.741833+00
2	باقة بريميوم	900.00	دخول غير محدود + خصم 20% على الغرف	20	t	t	2026-04-23 23:38:25.741833+00	2026-04-23 23:38:25.741833+00
3	باقة VIP	1400.00	دخول غير محدود + جميع الغرف + خدمات	40	t	t	2026-04-23 23:38:25.741833+00	2026-04-23 23:38:25.741833+00
\.


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_subscriptions (id, user_id, plan_id, plan_name, plan_price, discount_rooms, covers_cowork, start_date, end_date, status, payment_method, note, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, phone, password, role, balance, points, qr_code, is_active, created_at, updated_at, qr_image) FROM stdin;
1	مدير النظام	01000000000	$2a$12$r9l0j2P4V0m0qBFvPeqV2urDlp2F7cI979MmjCtt9T7eLfwHEe0fC	admin	0.00	0	72a505c2-c393-4257-a6d3-4c25b908df01	t	2026-04-23 23:38:32.31826+00	2026-04-23 23:38:32.31826+00	\N
2	موظف الاستقبال	01100000000	$2a$12$Kz/8udVTds9PsIyCOFrae.Ph4uV7DTRIIK01WNgHU99tvMuLZmE4i	staff	0.00	0	846b4311-04d5-4508-b905-5c3a866fa7c6	t	2026-04-23 23:38:32.401015+00	2026-04-23 23:38:32.401015+00	\N
7	أحمد محمد السيد	01012345678	$2a$12$BrT217iszbdfmYMq7rOPuu.4P9sLSbGNqc54jzyLmXDRbU9rv3nP.	client	145.50	87	9e06de92-7e9c-4add-8d29-057561a57507	t	2026-04-23 23:39:04.046177+00	2026-04-23 23:39:04.046177+00	\N
66	سارة خالد إبراهيم	01123456789	$2a$12$hjfyojnHvWcDhsmTPzBHxu1rUopt7t2iIm158USfdZpV7/TfOmrUe	client	80.00	45	cae47591-9077-446f-bb2f-e9bb81fc56ee	t	2026-04-23 23:49:37.640928+00	2026-04-23 23:49:37.640928+00	\N
69	محمد علي حسن	01234567890	$2a$12$bTjphnOmbleYLhZOLLw0oeWRxZ3uESNQFjczeU/7Mpxk7GUfTbOIq	client	200.00	120	a25b084b-685f-4864-9857-de1e585b7fc3	t	2026-04-23 23:49:38.097461+00	2026-04-23 23:49:38.097461+00	\N
72	نورا حسن أحمد	01345678901	$2a$12$FJh2yiWLDnh.UfcvjdwZWu2rBt/Dl37CGFoKrQbwsEy90IDfzNyqO	client	50.00	20	71d1244d-8691-4aa9-a865-a41ec1cf962c	t	2026-04-23 23:49:38.535685+00	2026-04-23 23:49:38.535685+00	\N
75	كريم عبدالله	01456789012	$2a$12$2gRiVy5N3IwDYISfPYpgR.McTW2YNz4tiv339NuoNzbGScyWuAURO	client	310.00	180	66e2145d-dcab-4a94-b3e4-27f4f29b2bf8	t	2026-04-23 23:49:38.980228+00	2026-04-23 23:49:38.980228+00	\N
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_transactions (id, user_id, type, amount, description, created_at) FROM stdin;
\.


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 11, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 48, true);


--
-- Name: price_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.price_settings_id_seq', 282, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 403, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 85, true);


--
-- Name: space_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.space_settings_id_seq', 198, true);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 198, true);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_subscriptions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 666, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 42, true);


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
-- Name: services services_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_name_key UNIQUE (name);


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
-- Name: subscription_plans subscription_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


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

\unrestrict 1KfoMo9bixVfbpKh2DTt0DagBRaKLnOt9Szi5saPjqgB8vhCXmo35msJIBwGrAD


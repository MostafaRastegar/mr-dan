--
-- PostgreSQL database dump
--

\restrict g2eCbdVNARngmQjGQZXCFmiBKZbRXwG3t9Ee2kplj0m5aKZ21EC6oEtGbCr7nuc

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: CacheEntry; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."CacheEntry" (
    key text NOT NULL,
    value jsonb NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CacheEntry" OWNER TO mr_dan;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    title text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO mr_dan;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    filename text NOT NULL,
    "originalFilename" text NOT NULL,
    "sourcePath" text NOT NULL,
    "fileType" text NOT NULL,
    "contentHash" text NOT NULL,
    "chunkCount" integer DEFAULT 0 NOT NULL,
    "ingestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Document" OWNER TO mr_dan;

--
-- Name: FreeTimeBudget; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."FreeTimeBudget" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "dayKey" text NOT NULL,
    "freeMinutes" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FreeTimeBudget" OWNER TO mr_dan;

--
-- Name: Group; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."Group" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "targetGrade" text,
    "targetField" text,
    color text DEFAULT '#4A90D9'::text NOT NULL,
    "counselorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Group" OWNER TO mr_dan;

--
-- Name: Homework; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."Homework" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    title text NOT NULL,
    subject text,
    priority integer NOT NULL,
    deadline timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Homework" OWNER TO mr_dan;

--
-- Name: HomeworkPlanEntry; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."HomeworkPlanEntry" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "dayKey" text NOT NULL,
    "homeworkId" text NOT NULL,
    "plannedMinutes" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HomeworkPlanEntry" OWNER TO mr_dan;

--
-- Name: IngestionRun; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."IngestionRun" (
    id text NOT NULL,
    "documentId" text,
    status text NOT NULL,
    "chunkCount" integer DEFAULT 0 NOT NULL,
    error text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone
);


ALTER TABLE public."IngestionRun" OWNER TO mr_dan;

--
-- Name: MealPlan; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."MealPlan" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "dayKey" text NOT NULL,
    "targetCalories" integer NOT NULL,
    meals jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "eatenSlots" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public."MealPlan" OWNER TO mr_dan;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    sources jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO mr_dan;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO mr_dan;

--
-- Name: User; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    email text,
    "passwordHash" text NOT NULL,
    role text NOT NULL,
    "fullName" text NOT NULL,
    grade text,
    "fieldOfStudy" text,
    "schoolName" text,
    "groupId" text,
    "counselorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "activityLevel" text,
    age integer,
    "dietGoal" text,
    gender text,
    "heightCm" integer,
    "weightKg" integer,
    "sleepMinutes" integer,
    "wakeMinutes" integer
);


ALTER TABLE public."User" OWNER TO mr_dan;

--
-- Name: WeeklyGoal; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."WeeklyGoal" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "weekKey" text NOT NULL,
    "studyMinutesTarget" integer DEFAULT 1500 NOT NULL,
    "testsTarget" integer DEFAULT 300 NOT NULL,
    "testsDone" integer DEFAULT 0 NOT NULL,
    "completedBlocks" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WeeklyGoal" OWNER TO mr_dan;

--
-- Name: WeeklySchedule; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."WeeklySchedule" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startMinute" integer NOT NULL,
    "endMinute" integer NOT NULL,
    subject text NOT NULL,
    teacher text,
    room text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WeeklySchedule" OWNER TO mr_dan;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO mr_dan;

--
-- Data for Name: CacheEntry; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."CacheEntry" (key, value, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."Conversation" (id, title, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."Document" (id, filename, "originalFilename", "sourcePath", "fileType", "contentHash", "chunkCount", "ingestedAt", "updatedAt") FROM stdin;
7861e6ac-5ad1-4354-aadb-38729dc71475	cf4d1f97-4503-46e7-8512-7133645de1dc-۱۰ سؤال پرتکرار کنکوری‌ها درباره برنامه‌.md	۱۰ سؤال پرتکرار کنکوری‌ها درباره برنامه‌.md	/tmp/mr-dan-uploads/cf4d1f97-4503-46e7-8512-7133645de1dc-۱۰ سؤال پرتکرار کنکوری‌ها درباره برنامه‌.md	md	9a11abc156af0767faeec9627b1574251076dda6b8498f2e56a318bfc657b37e	6	2026-11-22 12:43:12.457	2026-11-22 12:43:12.457
820d39fb-c0bc-4c4a-9642-de206f41796c	6f2cfd80-d5f9-433a-9879-3e31f28741f3-e2e-test.txt	e2e-test.txt	/tmp/mr-dan-uploads/6f2cfd80-d5f9-433a-9879-3e31f28741f3-e2e-test.txt	txt	c5e98d9640c66afdfbf29025eccf8b30aa1e5cd314fe569b51e61b53f868c1cd	1	2026-11-22 15:37:35.243	2026-11-22 15:37:35.243
\.


--
-- Data for Name: FreeTimeBudget; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."FreeTimeBudget" (id, "studentId", "dayKey", "freeMinutes", "createdAt", "updatedAt") FROM stdin;
8de840fc-3f48-4168-9d51-47006f75f8cd	26225efa-fa2e-4840-ba5a-7256d2f631a6	2026-11-23	390	2026-11-23 14:55:12.602	2026-11-23 14:55:12.602
76a5a2b4-2196-402d-aee9-4dc49964e8ce	817d3609-4063-4a9a-8d9b-1165016c5d13	2026-11-23	180	2026-11-23 15:02:18.436	2026-11-23 15:02:18.436
6ff009e7-8810-466c-9481-09cd4e426e53	3a40c3b5-1106-4403-8cd8-d21af0311081	2026-11-23	60	2026-11-23 15:02:18.419	2026-11-23 15:02:18.867
8ca3707a-957b-401d-ac98-6efc96a6fe6e	01763d1c-79dc-4deb-9057-163c35ddda17	2026-11-23	60	2026-11-23 15:02:56.617	2026-11-23 15:02:56.617
79adea7f-877f-4406-873f-a4327f3bdc52	02d83dc3-dfdb-444a-8a61-294b93fec37b	2026-11-23	180	2026-11-23 15:02:56.646	2026-11-23 15:02:56.826
\.


--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."Group" (id, name, description, "targetGrade", "targetField", color, "counselorId", "createdAt") FROM stdin;
91d79433-a212-494e-b2b6-e4282c0072e3	کلاس دوازدهم تجربی	\N	دوازدهم	علوم تجربی	#4A90D9	9572c19d-9cab-4592-9e63-da9e9c0f34b0	2026-11-22 15:12:10.145
\.


--
-- Data for Name: Homework; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."Homework" (id, "studentId", title, subject, priority, deadline, "completedAt", "createdAt", "updatedAt") FROM stdin;
41c3a621-aae1-4a58-9283-a956232d4136	26225efa-fa2e-4840-ba5a-7256d2f631a6	تمرین ریاضی	riazi	3	2026-11-24 20:30:00	\N	2026-11-23 10:13:46.842	2026-11-23 14:46:53.527
46c1aa71-600e-4495-9143-d0fa47b68a01	26225efa-fa2e-4840-ba5a-7256d2f631a6	تمرین زبان	farsi	3	2026-11-24 20:30:00	\N	2026-11-23 10:14:11.298	2026-11-23 14:46:55.595
249ecbbc-3810-42ce-9b31-01b63cbb7b15	26225efa-fa2e-4840-ba5a-7256d2f631a6	باشگاه	\N	3	2026-11-24 20:30:00	\N	2026-11-23 14:56:34.062	2026-11-23 14:56:34.062
52fd066a-5641-4b8b-9198-e6d334799756	35eb97c4-418e-413e-8abf-7e5ed08d7569	مشق ریاضی	\N	1	2026-11-22 20:30:00	\N	2026-11-23 14:59:23.957	2026-11-23 14:59:23.957
312321f5-05b0-4ebb-bdcd-e8c85ed9b113	37d36c15-a21f-47bf-ba22-9b8fa7f8a826	مشق فیزیک	\N	1	2026-11-22 20:30:00	\N	2026-11-23 14:59:23.967	2026-11-23 14:59:23.967
df5be061-ec46-4336-ae98-652fbe3ebc8b	817d3609-4063-4a9a-8d9b-1165016c5d13	مشق ریاضی	\N	1	2026-11-22 20:30:00	\N	2026-11-23 15:02:17.387	2026-11-23 15:02:17.387
a4b7c5a1-fd35-4b63-b430-fe454fb42ead	3a40c3b5-1106-4403-8cd8-d21af0311081	مشق فیزیک	\N	1	2026-11-22 20:30:00	\N	2026-11-23 15:02:17.412	2026-11-23 15:02:17.412
ea6677e7-b2b9-4ed0-9edd-ada1a1b1fa98	01763d1c-79dc-4deb-9057-163c35ddda17	مشق فیزیک	\N	1	2026-11-22 20:30:00	\N	2026-11-23 15:02:55.53	2026-11-23 15:02:55.53
da42102f-ab0b-4fe1-a39f-885f640b760e	02d83dc3-dfdb-444a-8a61-294b93fec37b	مشق ریاضی	\N	1	2026-11-22 20:30:00	\N	2026-11-23 15:02:55.57	2026-11-23 15:02:55.57
\.


--
-- Data for Name: HomeworkPlanEntry; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."HomeworkPlanEntry" (id, "studentId", "dayKey", "homeworkId", "plannedMinutes", "createdAt", "updatedAt") FROM stdin;
3ae2982a-78db-4480-9a6e-1e482f35d3e0	26225efa-fa2e-4840-ba5a-7256d2f631a6	2026-11-23	41c3a621-aae1-4a58-9283-a956232d4136	135	2026-11-23 14:55:15.455	2026-11-23 14:55:53.276
ee9ad185-315a-4f92-8406-3bda455560bc	26225efa-fa2e-4840-ba5a-7256d2f631a6	2026-11-23	249ecbbc-3810-42ce-9b31-01b63cbb7b15	180	2026-11-23 14:56:56.455	2026-11-23 14:56:56.455
2094822b-d081-404a-87a8-8855548cc913	26225efa-fa2e-4840-ba5a-7256d2f631a6	2026-11-23	46c1aa71-600e-4495-9143-d0fa47b68a01	60	2026-11-23 14:56:04.552	2026-11-23 14:58:03.34
967256b3-bf3a-4124-8a8c-a5165531b9f5	817d3609-4063-4a9a-8d9b-1165016c5d13	2026-11-23	df5be061-ec46-4336-ae98-652fbe3ebc8b	90	2026-11-23 15:02:19.2	2026-11-23 15:02:19.2
1e9907b6-a037-41e5-9942-4725ac53e47f	02d83dc3-dfdb-444a-8a61-294b93fec37b	2026-11-23	da42102f-ab0b-4fe1-a39f-885f640b760e	90	2026-11-23 15:02:57.53	2026-11-23 15:02:57.736
\.


--
-- Data for Name: IngestionRun; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."IngestionRun" (id, "documentId", status, "chunkCount", error, "startedAt", "finishedAt") FROM stdin;
9e3e1fc8-5698-46b5-8a7c-8ad372bb655e	7861e6ac-5ad1-4354-aadb-38729dc71475	succeeded	6	\N	2026-11-22 12:43:12.467	\N
312a9847-1c56-49a3-817a-d65d9bbf31b7	820d39fb-c0bc-4c4a-9642-de206f41796c	succeeded	1	\N	2026-11-22 15:37:35.268	\N
\.


--
-- Data for Name: MealPlan; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."MealPlan" (id, "studentId", "dayKey", "targetCalories", meals, "createdAt", "updatedAt", "eatenSlots") FROM stdin;
3d1dd20a-6098-4452-bae7-7593fd850563	5aa82b03-8198-4b18-ab25-643ee2070cd0	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:09:19.395	2026-11-23 13:09:19.395	{}
7b0bb0c3-d23f-44d0-8085-590bd2b09035	41d7cb52-ac9e-469b-b13f-41dd94708760	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:09:40.271	2026-11-23 13:09:40.271	{}
62bbbce6-4c1d-4ccf-b1d6-f768962f5c62	45b99a02-118c-465b-947a-d7c532b90769	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:18:31.73	2026-11-23 13:18:31.73	{}
cfe9357b-e531-49ba-93d5-21bf04d6cd5c	ac9203a8-992d-4e49-a02a-05293a09a3ef	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:12:10.107	2026-11-23 13:12:10.107	{}
6fb6b119-9a29-4ef3-adb7-719d049a11d8	fbd351c8-c791-44fc-bd60-e1064e66a668	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:22:55.049	2026-11-23 13:22:55.049	{}
e30c2e35-61ce-4e1e-8e9e-4c98c11f5413	da32ab60-6c1b-4e4b-b631-54301e43cf5c	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:24:41.4	2026-11-23 13:24:41.4	{}
343b0859-21a7-440a-a9ca-7f4a67d7ad8c	9ad2d604-c372-4465-a590-1105c3201bea	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:25:47.9	2026-11-23 13:25:47.9	{}
989a87de-cc8f-4033-bd81-2f7d4150ba81	26225efa-fa2e-4840-ba5a-7256d2f631a6	2026-11-24	2302	[{"slot": "breakfast", "label": "صبحانه", "calories": 576}, {"slot": "lunch", "label": "ناهار", "calories": 806}, {"slot": "dinner", "label": "شام", "calories": 691}, {"slot": "snack", "label": "میان‌وعده", "calories": 229}]	2026-11-24 06:17:17.842	2026-11-24 06:17:17.842	{}
eb40a0c0-ad20-455e-8724-27e042131523	f090564b-528a-4426-9312-9496482aaae1	2026-11-23	2705	[{"slot": "breakfast", "label": "صبحانه", "calories": 676}, {"slot": "lunch", "label": "ناهار", "calories": 947}, {"slot": "dinner", "label": "شام", "calories": 812}, {"slot": "snack", "label": "میان‌وعده", "calories": 270}]	2026-11-23 13:26:27.7	2026-11-23 13:26:27.7	{}
82b57cd3-0df5-4896-9fe2-e4663bd54f7f	26225efa-fa2e-4840-ba5a-7256d2f631a6	2026-11-23	2302	[{"slot": "breakfast", "label": "صبحانه", "calories": 576}, {"slot": "lunch", "label": "ناهار", "calories": 806}, {"slot": "dinner", "label": "شام", "calories": 691}, {"slot": "snack", "label": "میان‌وعده", "calories": 229}]	2026-11-23 13:48:13.141	2026-11-23 14:10:33.079	{}
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."Message" (id, "conversationId", role, content, sources, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."Session" (id, "tokenHash", "userId", "expiresAt", "createdAt") FROM stdin;
9fde1f74-03ff-47f7-8c95-f64b1a82839f	12875a09434af559d87d06f2590acb5f76ac7fb0aab846ca4ad5eb2801d84ee1	b6ecd02c-97e9-4cfb-b73b-7082c1188944	2026-11-29 15:36:02.082	2026-11-22 15:36:02.082
6a68ebd4-fc1c-4c4e-bdde-5f1da984946f	084a09beb213f53e51fa5186a99aae57dba764dab6cc0d63fd1b769fcc88735b	cfce0342-76b4-4177-b4f2-62731952b766	2026-11-29 15:36:35.41	2026-11-22 15:36:35.411
e0a3016e-1b5b-4004-8ef3-d98ae42ae3b7	4145458190c8eaa4d5a87219afde1cc02675e99efc199611d0d207eb9928e72b	fb2bfeaf-9abf-4221-b572-35f2a2deab4b	2026-11-29 15:36:46.247	2026-11-22 15:36:46.248
ed781541-178a-4db8-a8ab-e0a6d7f5a828	5ef83bcfbb874df6a505afe4686887f052eb1e663ef10b4c1f2052b2d7e98c91	79e869b1-a764-48b5-9a0a-0116729f40f3	2026-11-29 15:37:28.781	2026-11-22 15:37:28.782
0661363a-703c-41a9-9726-531cb369e005	c41814743d0b0259d929bda44f0bda826b5d1a74331cae6e4ef98265ae6b629a	c4ef6ff3-fdd4-4c51-b9d3-f6bd11182e82	2026-11-29 15:38:51.523	2026-11-22 15:38:51.523
0b9c783b-3399-4ba1-95d8-27c41df6ac66	ebeb96753ca19081a8d95d3c066d00d95179cad46ac7fba565ae8f6575ecfffe	90a01375-94e1-4b30-a1f5-79eb88a71c28	2026-11-30 06:24:30.616	2026-11-23 06:24:30.616
f28aca17-8110-4baf-9fb8-045d33ddd011	bab185dc09bcb31d6ee6adb5a9529c6f3095c41f88d82b21440790c67a31750d	d4c1811e-4e7e-4b35-b915-3b4c33d33689	2026-11-30 06:42:38.543	2026-11-23 06:42:38.543
3c3d7fd5-752d-44d2-9248-0db58bfb1b1e	373043515906f2da482bfa14b56eae9f642f681a581b21eb98818f6e1ebc16d9	ed4cbc7d-e665-4ba0-b074-5df7c889e5e0	2026-11-29 15:40:31.759	2026-11-22 15:40:31.76
c834b27a-2292-43d6-803e-1301d0ec89e4	b6cfb15431721f6daa096ad6c34e3044d0bc68a85ddfd88ea325f164e593dc44	0fe6a31c-5fa5-40d5-8fd7-74c8955d15df	2026-11-30 06:58:53.919	2026-11-23 06:58:53.92
572da909-0409-404a-9e86-d017e739f39f	d7038a9e3323a7e43c0d47ed660b86a0f12a8f33b5cb157c73ad573ddc84b4f6	309f847a-4507-4d3e-8e21-ec2d72d31374	2026-11-30 04:55:09.447	2026-11-23 04:55:09.447
1c9d2dab-1f3e-4d91-a0ae-96349e2bbea9	aaacec43f69665ddb6e1d39ea37a427e5096af683ce8ed623138a04a802dae27	51581476-ee0e-499a-bfc5-71ed25e3ab67	2026-11-30 10:07:26.452	2026-11-23 10:07:26.455
15267167-2855-4d20-b03c-80f51abedd2a	d4e970e3caf38ad66005c5658778769a19658cdc4cc77ba14290bd1c08e4ce68	77cb2f5c-fe58-4bc0-9518-3f1211518f60	2026-11-30 10:07:26.471	2026-11-23 10:07:26.472
01a404d9-4856-4c2e-b47b-665b3ba8eb2b	014a5c714fdccd21c8951a369cbf0bbc3f5633417b9ad442772f8960af4afcdb	5c9751dc-9611-49ed-8632-f5335905fb33	2026-11-30 10:10:18.899	2026-11-23 10:10:18.901
7437228f-93e3-458a-a5a9-9337f6b7811c	26a78fae2e696c9d176abb11c8699ec7d2f3a87fa6bbe38421b15c27abdddcd6	831343e1-ee56-4e6e-9947-c7e9485549ec	2026-11-30 10:11:15.32	2026-11-23 10:11:15.323
d523c407-4c8a-4ef0-9826-a52815b4248c	e4547b0611e8a58dda0fa0d9492365dd2c7baef2b1e1a1069a36595874557a0f	9d3f657c-9455-4927-a984-e173e4674777	2026-11-30 10:11:15.324	2026-11-23 10:11:15.325
ce3a3c73-8bee-42e8-95b0-55f0c6087dd5	b444dff671d12b7bcc77496e3deecc3c89e520cbf1286b06a14a1fb58ea7aa0a	a2b04ff9-29cf-49d9-ae48-cbf692c1db3c	2026-11-30 04:58:46.667	2026-11-23 04:58:46.667
ab4948de-f6d0-4785-bded-09d7c3e57e59	bbe39c08ef49d18cc55e7d2bdf9eb07b43f2a8449d2fd4ac823c424ebf3d0d6b	350f6aca-f3fa-41ae-ae6a-82e1c298c76c	2026-11-30 10:15:17.881	2026-11-23 10:15:17.881
9bc24335-e68f-42ef-bab3-27304acaddf8	32306ee03bf311666b52357d025e452b3844133987282f1b9c72eecaa3cf2268	0f014fc3-64f6-46bc-a84f-a1f9a4125d51	2026-11-30 05:00:21.316	2026-11-23 05:00:21.316
d5ae69f0-fdd9-47d2-b7f2-425c65e6c355	0eb5daf34152a610324afd9cfcfdc57a13c36c1aa197c7d70e9d2df9abc7b7fe	b277c296-d9a4-4505-b0d2-de537e8ed47d	2026-11-30 10:15:17.882	2026-11-23 10:15:17.883
a4814165-5dd4-46df-bb73-384ae493307f	05bc1adc445d189352f9ed5c60f0108d837ab0ff4e17d3bed5f407bb92cdf951	0225be15-a126-4583-b142-8922eb4868c1	2026-11-30 10:16:06.169	2026-11-23 10:16:06.169
781d80b8-0ae9-4026-8fa5-c910158ee8d7	90460f06bd60c2222ed0df97652b771b79b1580533d5360dfd924076a137b7ec	bf051d9f-ea61-4c52-8468-56ccf0ac0e98	2026-11-30 10:16:06.243	2026-11-23 10:16:06.243
e952747b-93c4-46da-bbb4-e12215b9e698	3b27349c1f591060bf19fbc934e136b136f1b6fb09d5d098dfdfbdea114ec279	ad46ff0a-468d-4eb3-95be-31411b298c91	2026-11-30 05:22:15.383	2026-11-23 05:22:15.383
ae521be1-3dc1-425e-802b-17bbeeec806a	84d70c5ad10890aeecfb86497babefdedbb1683010e342cc010c3ebc1d14fe1a	4e7b6973-abdf-4669-ab67-e9fe2d1ccb8c	2026-11-30 10:21:18.056	2026-11-23 10:21:18.056
a5a18d92-9422-4397-8d30-e4b2766a5f4a	9718a0983a281104a2682d7f1072ba49fd74eebe8a03c9cd69385a25b29aa563	cc88c2c7-822a-4f04-b590-dd0919bdf763	2026-11-30 05:24:44.323	2026-11-23 05:24:44.324
1fc07fa5-24ff-4797-b861-018fc281dc1e	ba363a64d9ad45314a376c54dd5cc169a563d699aa81005a4127cfa3be03f08e	fb3ec988-094f-44c9-97d0-e67e283f6763	2026-11-30 10:21:18.068	2026-11-23 10:21:18.069
96eaba81-4fc8-4235-92c8-a9e63ec08e66	ab8e82b419a9fced7f980bc066e43e44af2fe30f64b5c37013467daca43281fe	47ca57f9-33a0-4ded-88eb-62df2c7aa57d	2026-11-30 13:01:03.899	2026-11-23 13:01:03.901
ec3e63f4-5b84-4e6c-8142-4acad6e0023f	587ee753e8fd51d4d6e13b82c832483dde4f9080fec840c1f397870122854bfd	ea56249f-48e7-4988-85c1-6f6a40d7baa3	2026-11-30 13:02:33.9	2026-11-23 13:02:33.9
84a76e7a-f6b0-4b42-b3a0-fba795ed67db	9b02e99bceb0a00d1f1409ea70925f943b9b9c9a4f4a069bab3d31522778662d	e4a95153-8c5a-4e4d-a95e-d80b7771f30f	2026-11-30 13:02:33.903	2026-11-23 13:02:33.903
338907dd-91ad-4190-a337-1fe4fac5df69	f7d1ed16682cff9969b61233b1db26ece099f401f3e580ea8861cc962a7f6475	1e295e31-b1f3-4211-8f0f-067c6cdd3502	2026-11-30 13:05:02.377	2026-11-23 13:05:02.378
de04d82f-05e5-4269-874f-800b18b5fda5	2b6a1ec5036d772fc261847dc01a14a355789b63207f51afce0154aed4d3953e	a833163c-5463-4de6-ae94-f8c68559c7a3	2026-11-30 13:05:02.437	2026-11-23 13:05:02.438
882152a1-2a6d-4bad-ab7f-ea2f61adf923	88474105d0ac17c95c138e034ce42eaf1542fc75f9b25045dddff574b16c5ab2	b9e96834-646a-4aba-ad04-aa8490a08434	2026-11-30 13:06:29.984	2026-11-23 13:06:29.984
c28d9c5b-5ba2-4abe-99b9-a01c0f899993	8f02dad2bfff68a752d5fbfeceef0bd7e275530d8ac9d6b8bd84ce3055a5e271	6b69e054-0ff8-4314-a61e-dc2ef6222980	2026-11-30 13:06:30.043	2026-11-23 13:06:30.044
6cc16367-3712-4b98-85cf-2030dde2ac7d	5c1c98deae72a2cfdaca206d70e1f29dab35e82423ea84b5e6a3c908435a23cb	20eb0fc3-d5a3-456b-ae59-cb407fe5910e	2026-11-30 13:07:29.172	2026-11-23 13:07:29.172
cddc373a-98e9-4757-8276-e9d292d8c434	53ed4dc85d32afd06722c589945a8c3329ae98db323d043d62c6959d635dfda0	6044823b-8cf8-4138-9957-edcdfccf6b9f	2026-11-30 13:07:29.257	2026-11-23 13:07:29.257
5db5d1fe-7d84-4e19-b0ac-1b991b477fc2	531fb2dd4224dc8a6b924ecd22b22e2c86f13ff3b8bc98480825160175f9422b	8edbd51a-78cb-4640-9687-95e6a3de9926	2026-11-30 13:09:16.946	2026-11-23 13:09:16.948
703d2967-0438-49ee-857b-12d128c5a64b	a2f1ef983a989642ae2f5d8e963063bc230f849b22b31595abc0c441a3ee34fb	5aa82b03-8198-4b18-ab25-643ee2070cd0	2026-11-30 13:09:16.949	2026-11-23 13:09:16.949
8ec4cc64-8a89-4f01-b8e6-74f18a6e1b60	ccc7eed557e745beba7bc045ac9b9cb9201bb9da3d5a80854dd5ae7ecd929273	41d7cb52-ac9e-469b-b13f-41dd94708760	2026-11-30 13:09:38.316	2026-11-23 13:09:38.317
6d929e24-d3b4-4861-b378-3fcef9e609f1	840ca76cc38c56ff9902701c8d8fdc0aa9f87f33a2d59e996e0860f5b0ae89c5	3fa91bdc-c8a6-48f6-9633-569b5d5bcd00	2026-11-30 13:09:38.337	2026-11-23 13:09:38.338
c62a128f-fe6a-4273-b304-6fd84f73c306	5a411b140187c35b2b2db702540ef76d579666f4da5303d0e9805cb2bd3d7cfe	049061ee-f431-403e-a9b6-eae834332004	2026-11-30 13:12:08.223	2026-11-23 13:12:08.224
7e5570cd-34c1-40e9-96e5-270fca5ed33c	ca594703e42aee8676d62f9d872fe625ccbb552a0ac7f5cf37e24ec04db77070	ac9203a8-992d-4e49-a02a-05293a09a3ef	2026-11-30 13:12:08.263	2026-11-23 13:12:08.263
a670f054-53e1-44cc-a93c-2892e3e8b775	aad2c6f0e100f018c75c095b599a858e8f8b449f757f7f444155aeb546bae339	3951efa7-a3e0-426e-a016-0835223f4262	2026-11-30 13:18:29.518	2026-11-23 13:18:29.519
90d5c080-a32a-4438-afc1-6ad4b414258c	98caadf5f1e43495a06cc6c36136680fddf99f34e92a8f12ef7f0e2e21768836	45b99a02-118c-465b-947a-d7c532b90769	2026-11-30 13:18:29.521	2026-11-23 13:18:29.522
c2b7f327-ec79-42f4-8d52-b41d642beeb9	406d503b6522b1b1119df8f275d8bf40665220adff38c0f18af25d0680c7e904	9460382b-0b90-434f-bfea-e7ad7463bfcd	2026-11-30 13:20:41.357	2026-11-23 13:20:41.359
adeda554-59d5-4dc5-8ba8-c3e9deb2758a	f6c067caa3a2f65e9925dfc5e093caadef444c54602a6a882b3c6da06c823832	af2b4d0f-8c5e-424a-ba3f-6c94f187c85a	2026-11-30 13:20:41.36	2026-11-23 13:20:41.36
05d506af-5c1f-45f2-a107-86806ccea283	3f0f5a64d7a1cd6b5496cfbdd43cea95ce9456ad9c72d8675e2727e52f6e6954	fbd351c8-c791-44fc-bd60-e1064e66a668	2026-11-30 13:22:52.75	2026-11-23 13:22:52.751
8ce0fa4f-aa8e-44ed-b301-199303f8d33a	db28296942765860a84ed0663e2116bd9d0cc2426c7219e6834b873e67af6d72	ac89aa72-db5e-4c3e-b76e-e1cfebbbf40a	2026-11-30 13:22:52.76	2026-11-23 13:22:52.76
51de726d-59a3-48d3-b977-137668365e2e	cbd813721d9d6877cd8eb693c3ce597567d6d73bc135ddebf3f3c217e5fff369	9dd813c1-2c4a-478a-9230-ed0ad10865fe	2026-11-30 13:24:39.111	2026-11-23 13:24:39.113
e221516b-bd65-49d4-beaa-82c4f0694553	5f947afa41945bbaec5c9677215c12b7ca63eb3fb4952475c4aa1b8c9fad9d73	da32ab60-6c1b-4e4b-b631-54301e43cf5c	2026-11-30 13:24:39.114	2026-11-23 13:24:39.114
47d31083-5424-4437-afd5-e23887b67674	77c8e3a1a246a406c6cb539dd5cf42d5ad1bfa3b29a37de6a028bc675e2ab718	fd460652-2582-45dd-8783-093e45a5dad4	2026-11-30 13:25:45.65	2026-11-23 13:25:45.651
c00a4f75-f518-4435-bc7c-d3549d6b05e2	f0d7dbe6d5850a88267ff108f9c1644c46301cc5c9da0ac77c8a3c58118d0aea	9ad2d604-c372-4465-a590-1105c3201bea	2026-11-30 13:25:45.652	2026-11-23 13:25:45.653
a9c4d9fd-9aac-4860-8411-24bb398dcef6	300e11890eeba12f9dcb1270febfab0c96b8ed32122af91a528082840ec63af7	f090564b-528a-4426-9312-9496482aaae1	2026-11-30 13:26:25.369	2026-11-23 13:26:25.37
53e6ec40-17ff-4b74-a94a-b495cbe0dfab	2716da9d98d78518c2f5962aad7bdd1804df93cf59734e8244f3add41920f1d7	7b805c62-dbce-443d-90ba-7013b39b4fdb	2026-11-30 13:26:25.371	2026-11-23 13:26:25.372
4db65374-0368-4222-8692-7b780989b08f	c970b0f1d4ae6431537b7a23c274cc88d8116b2f1667191b718342fef05c3e0e	35eb97c4-418e-413e-8abf-7e5ed08d7569	2026-11-30 14:59:21.004	2026-11-23 14:59:21.007
f8866297-079c-4f39-b615-32f862721113	f57aa97ffeb952783de030286fdbaf6e934f0be59314d03a9ee33b4ddcaebe52	62c3278c-b93c-4c12-b599-98f9f1e74191	2026-11-30 14:59:21.043	2026-11-23 14:59:21.044
f7636ca2-4442-402e-8d8e-bb55a1c94032	32a8b63cdee91abace878896dd398e397a6689a7eb0cee88c66279360ef161d2	37d36c15-a21f-47bf-ba22-9b8fa7f8a826	2026-11-30 14:59:21.622	2026-11-23 14:59:21.623
e849ea25-906b-4f82-81a2-eb72ddad4bbe	cbcb88c8c511baafa132d53c4767f2c66fd9c5d1e6fb5e0af4fc5cf218485e3c	2377d2e0-d562-4f5a-b37a-2e58b303a1b5	2026-11-30 14:59:21.624	2026-11-23 14:59:21.625
3e70dbfe-1277-4774-8ac5-8ad000f38511	5eabf2a9fe09e47a8621b3311637553087e93127ce631c1853312ca4de6509a3	142b07d7-069c-42f2-9bc5-3d9f0b7a494f	2026-11-30 14:59:21.626	2026-11-23 14:59:21.626
5c7b1bca-7f71-4ffe-9f7f-c5735de12d94	cc402518ff396497e6fb9425767204b73201524ccea7c24b3380e16e6d2ee3da	33c681bb-aee6-4eaf-ba66-3ac7b6f6095d	2026-11-30 15:02:14.797	2026-11-23 15:02:14.799
69bdd432-f639-426b-95f2-2327d52b7f71	261c1113852614d2d23bd68694fa6dc77ff17d7aebb37668cd8bd3421c370c3f	1fb0369c-eddb-4c45-9e57-fd427b0f45db	2026-11-30 15:02:14.805	2026-11-23 15:02:14.806
5d3cb685-99bd-439c-88a9-0b92c46526c7	235fafbeb250680b3dfd8a9d8484acd88b6c141722133278fb352b4491f7496c	737d53e1-7bd6-42e4-9b60-478410ee2d64	2026-11-30 15:02:14.808	2026-11-23 15:02:14.808
cb76e687-74ee-416f-82ea-a175fe3cb38a	572250bdc119e35242bdd59facb6ace84a9d60f56e68f671550e91109294d0de	817d3609-4063-4a9a-8d9b-1165016c5d13	2026-11-30 15:02:14.81	2026-11-23 15:02:14.811
246bf561-87c2-49fb-b48f-9af40b19964d	675ba62226e52a11b3801fceb2eba824b2b536b06e9619bdcdbc598cd25be761	3a40c3b5-1106-4403-8cd8-d21af0311081	2026-11-30 15:02:14.835	2026-11-23 15:02:14.836
81622808-466d-427d-9339-35f2da7b686a	b98c1f20d2b9145ae7ea504bb7c5fc4b884e60aa24f2ae64b61444efba7e65c9	01763d1c-79dc-4deb-9057-163c35ddda17	2026-11-30 15:02:52.933	2026-11-23 15:02:52.935
e4b28103-0af9-4788-bc02-1006b6b95432	53bd26c7792d7f4e259704bb32daad527a1d8229089d03f78d7f01d99df58ad9	069acbb6-b050-40f9-93d6-fb1aaba45ac8	2026-11-30 15:02:52.937	2026-11-23 15:02:52.937
15bffd63-badc-4007-9751-55f321be863d	d1b4d92e3fff9cc05444cf340c236e6bfa0b6e628443bd04504a33817e6353c8	02d83dc3-dfdb-444a-8a61-294b93fec37b	2026-11-30 15:02:52.941	2026-11-23 15:02:52.942
8319677d-3e7e-4fcf-be49-b835d457dc1b	559e0112b9bfc4960b3ab74e68923dc3a954f79fda93ea0da9adc303ca2bf9ce	671ac9e1-8527-42d7-894d-2eb71712e039	2026-11-30 15:02:52.943	2026-11-23 15:02:52.944
0f4082a3-8a1a-430d-8a99-d810b742ddfb	25ab3b3e0293413c2f7c28a2ffbb67d7bce18fd0eb78a96147c4cd421c06429a	ef71a5cb-13ef-45f2-a7b5-ae80cabd2df0	2026-11-30 15:02:52.962	2026-11-23 15:02:52.963
2a80c8ef-02ec-45e1-b381-a787606a8dde	da7b4a809930f530a5124d73ed8f6334858c51f4f5f492eef6f7cd694f0285b6	687bfce1-29a0-4bd8-88c8-a14ec61ca50c	2026-12-01 08:34:29.372	2026-11-24 08:34:29.373
3b82308f-23ba-44f5-81a8-a35e456189ea	c662fd9ae45e9badb622e996f428e9c17d71bcd9270b72f2fad1cd8767f8b73d	9572c19d-9cab-4592-9e63-da9e9c0f34b0	2026-12-01 09:41:57.82	2026-11-24 09:41:57.821
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."User" (id, username, email, "passwordHash", role, "fullName", grade, "fieldOfStudy", "schoolName", "groupId", "counselorId", "createdAt", "updatedAt", "activityLevel", age, "dietGoal", gender, "heightCm", "weightKg", "sleepMinutes", "wakeMinutes") FROM stdin;
b6ecd02c-97e9-4cfb-b73b-7082c1188944	e2e_1795361753436	\N	scrypt$16384$8$1$cV7D62ziUF0agmg1FpWSTw$bP1p_2vudb1rkN-kKRuLsEvWpdHHIEMIyw_d5mRDeFQzASCr6jbZYkwkrMJRr1A9sxpmLQSopVCL0ilLFTgHgQ	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-22 15:36:00.622	2026-11-22 15:36:01.444	\N	\N	\N	\N	\N	\N	\N	\N
cfce0342-76b4-4177-b4f2-62731952b766	e2e_1795361789361	\N	scrypt$16384$8$1$_sNVJrTr_OkNa67Aj-_joA$VCv1-3uk6ks0YqD-KTYIqavEtVaMgvdErwc8PEjMLnJJC6YtCKJSwJq6X_KasrAhrB7I3UyKsvo4lvIZXuhXUw	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-22 15:36:33.983	2026-11-22 15:36:34.822	\N	\N	\N	\N	\N	\N	\N	\N
fb2bfeaf-9abf-4221-b572-35f2a2deab4b	e2e_1795361802603	\N	scrypt$16384$8$1$OZ56NDxUwzdPOzSAfjfvtQ$t_XeI5meDoM7XXREWBWjsRDZNc3fFbYkEHZxy7j1xA0ezM8ub88ZJSl0bTkOAseNriHYzAIcM9IiHw1U5DeP-w	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-22 15:36:45.349	2026-11-22 15:36:45.698	\N	\N	\N	\N	\N	\N	\N	\N
79e869b1-a764-48b5-9a0a-0116729f40f3	e2e_1795361845539	\N	scrypt$16384$8$1$RxhxVdlMMaBSDc8crHWtSA$kbtszgm3C83_okE153tLvhYQiwnsR56413-cvu1GEb6J7YYAjH2Vdm60C5JZ3zWaHVArWhpn1ux2Auyi-oyIVA	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-22 15:37:27.767	2026-11-22 15:37:28.208	\N	\N	\N	\N	\N	\N	\N	\N
c4ef6ff3-fdd4-4c51-b9d3-f6bd11182e82	e2e_1795361928689	\N	scrypt$16384$8$1$7qY8SSsGlOdmEcXFK4XXfw$eEY8U7bQiiUrfoxgbU2OEyodam76_gXEOQUXC5inanSCHAvp0cNHBqXLl2gbefQKBSbjlWoE4KrT_RNPZKzhmw	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-22 15:38:50.148	2026-11-22 15:38:50.874	\N	\N	\N	\N	\N	\N	\N	\N
309f847a-4507-4d3e-8e21-ec2d72d31374	e2e_1795409704782	\N	scrypt$16384$8$1$vNCsrV24MyGjW03ChgmqQg$OwgOoj8VuaL_Kj06XGLJBGP0lRWoo6gn_pyKyGczBj-HPb4beVRks0P31fyrU7a7DLuA99SeLJdMXLB-HTPKbw	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 04:55:07.852	2026-11-23 04:55:08.639	\N	\N	\N	\N	\N	\N	\N	\N
0fe6a31c-5fa5-40d5-8fd7-74c8955d15df	e2e_1795417127720	\N	scrypt$16384$8$1$-t5OYPoc662CEjKBPX0_tg$FbNY9loUhfklYijv0tDIYIdxKE8s7aQCe1Tm1xw5NqNGNeUXjO0hSTaQiNIfDHxr0cZuzL0IziURzL4sZGYiaQ	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 06:58:52.181	2026-11-23 06:58:53	\N	\N	\N	\N	\N	\N	\N	\N
350f6aca-f3fa-41ae-ae6a-82e1c298c76c	e2e-study_1795428916458	\N	scrypt$16384$8$1$nHnDyiRMt5DX7I95LvO8Pg$73W_3yQDcCAlHPvvBSQQ_1WOllLQfbmTiStz7wDXKaUNJSTjRCuP5QpMKczdrfU3IA9op-l0UkvHWh9J4TKm1g	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:15:17.866	2026-11-23 10:15:17.866	\N	\N	\N	\N	\N	\N	\N	\N
47ca57f9-33a0-4ded-88eb-62df2c7aa57d	e2e-leisure_1795438860523_70193	\N	scrypt$16384$8$1$9MXJA0LLqeHB6zzTcea_xQ$mGHvcyRRETAFz5XkJN3fzlCKFxGA2xQ2t-HRbIcG7f1Xm3mnGUMpcdI5QvVSUfsPiuF4fSEC95SbSb51Gh-rZg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:01:03.894	2026-11-23 13:01:03.894	\N	\N	\N	\N	\N	\N	\N	\N
e4a95153-8c5a-4e4d-a95e-d80b7771f30f	e2e-leisure_mwt9zu6z9094	\N	scrypt$16384$8$1$Q1UTJSqCZdtiMd9E7Ji6sA$nsB7bd1eEV6USgpqLSW3N8HVM7dQeEdVNCvjjLy-BIBmHGuKEHdrrDaaSspdwByxTM6yEDSGaoYBhpGELvv0sw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:02:33.898	2026-11-23 13:02:33.898	\N	\N	\N	\N	\N	\N	\N	\N
a833163c-5463-4de6-ae94-f8c68559c7a3	e2e-leisure_mwta30ru8662	\N	scrypt$16384$8$1$kE7zjwvsPXdYN2yLegmpLg$SkSUXk8GS9AwxHvrqOotT5mMNKXwLHYOQAoy-XHrY2QaERlrAekvlNkuc3axC0vZkvDI48k_KevJl6iooh95Ug	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:05:02.411	2026-11-23 13:05:02.411	\N	\N	\N	\N	\N	\N	\N	\N
6b69e054-0ff8-4314-a61e-dc2ef6222980	e2e-leisure_mwta4wdr2022	\N	scrypt$16384$8$1$uOUPqXuSWMYBLbbm1KliBg$2kRsXLnKlGFE163nKOxiUEZWW-CCXHVg6EnXOu4IIT5nHqYiK2Fs61Bc1GpFxvsY0f8Cmek6pZbU5lkVeDNs2A	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:06:30.019	2026-11-23 13:06:30.019	\N	\N	\N	\N	\N	\N	\N	\N
6044823b-8cf8-4138-9957-edcdfccf6b9f	e2e-leisure_mwta663p5693	\N	scrypt$16384$8$1$3zHPAlE0qoaRheo6D55jNQ$ypBaxd_E_yX27FTlirkd7LcHxSUjcmJlz8e7jZdBHDxHo3oCyf2Fd5twBiDKgAGbZ9WxlUPI-r7b_tUDxmxeyw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:07:29.239	2026-11-23 13:07:29.239	\N	\N	\N	\N	\N	\N	\N	\N
92a74291-37a5-4625-b9f1-a40d86ea920d	admin	admin@example.com	scrypt$16384$8$1$ZE6lrsgCqJRxY0fCbZNP2w$cZuASZP_nWk4WLq_8DA9ogS80Xrvw8qjSnC3pc71SMVCLTnCHYyfWpja53u4IYNeg_DHKCARjnl5KHEUX2QiyA	admin	admin	\N	\N	\N	\N	\N	2026-11-23 07:19:38.588	2026-11-23 07:20:32.909	\N	\N	\N	\N	\N	\N	\N	\N
5aa82b03-8198-4b18-ab25-643ee2070cd0	e2e-nutrition_mwta8grx4306	\N	scrypt$16384$8$1$UTtY8l7nNs0o-msniPii5g$FlTw4FWfW5Qpx1WRxg1LKrxtpjInu62IHYi7mHqHvsqO57b_8Sb_Aj9Bpi4x6jvuAYlFJ_K9d_-FOseFf9wONA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:09:16.939	2026-11-23 13:09:19.075	moderate	17	maintain	male	180	70	\N	\N
9460382b-0b90-434f-bfea-e7ad7463bfcd	e2e-leisure_mwtan4627848	\N	scrypt$16384$8$1$9npKi-N-tWQ3q92O_j5gig$6DNylJBAwwBn0elAtNHukw10VEKoacytrZlOlatfEnGX82XF9yYCgpvGK5IhQvVb7nJxOYhX6OmiFgUwFc5kFg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:20:41.355	2026-11-23 13:20:41.355	\N	\N	\N	\N	\N	\N	\N	\N
ac89aa72-db5e-4c3e-b76e-e1cfebbbf40a	e2e-leisure_mwtapxm61602	\N	scrypt$16384$8$1$ATHnqgz-r0R9pTmk_NNhQg$xIHQtQFmfHn3pkBUSyH730X_UeNwBPzH7LvKsQtFQcmy-TWrB3FtUprUmVBlCNEMR0tTKD1mXVhjbMtuuyfEOQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:22:52.742	2026-11-23 13:22:52.742	\N	\N	\N	\N	\N	\N	\N	\N
5c9751dc-9611-49ed-8632-f5335905fb33	e2e_1795428616174	\N	scrypt$16384$8$1$3lreBgbtOi0nUQHmlc9Ksg$n2dG3s7J5r3UkHmyKK4zfK3jUCUsXHrUiKt4_NgGpXhWmGk4PHSKxo96kl0e62H6_qh-j2Oj5D1kaoklcIhWow	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:10:18.894	2026-11-23 10:10:18.894	\N	\N	\N	\N	\N	\N	\N	\N
fd460652-2582-45dd-8783-093e45a5dad4	e2e-leisure_mwtatn1c4100	\N	scrypt$16384$8$1$04NYi2yn4jzSEPwqvRLwEw$gn0Ju_oogqF5E5Uso3HSMcSk4ZsbP80iCh-Tspo4J_yn1PtxmR3uOTve9beG66k4JIMCCaZam-38bwMYjgSifQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:25:45.646	2026-11-23 13:25:45.646	\N	\N	\N	\N	\N	\N	\N	\N
9d3f657c-9455-4927-a984-e173e4674777	e2e-study_1795428672571	\N	scrypt$16384$8$1$IMns4hiCERbEYJPlITyhlA$LvhQrOb4D-CpH34rsVurddJSf7dGK5D1K900p_gIDZSZKmqIdpEEgGsy9LeEKjXGKntLGPStcLgZoeiZOTqlQA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:11:15.317	2026-11-23 10:11:15.317	\N	\N	\N	\N	\N	\N	\N	\N
3951efa7-a3e0-426e-a016-0835223f4262	e2e-leisure_mwtak9156803	\N	scrypt$16384$8$1$oIm0eKqeaW-ceHPKMpJL1w$ENAdhJ_y3tKkbFdfmhCrl6gLjtN-k4_1n-vtpIq0dQfFhn6E_sARlTWaapEKh6U6MIUaVTWwZhYpJl9YrgVU9Q	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:18:29.513	2026-11-23 13:18:29.513	\N	\N	\N	\N	\N	\N	\N	\N
9572c19d-9cab-4592-9e63-da9e9c0f34b0	counselor	\N	scrypt$16384$8$1$tUAZlWDQChunkHc6HvtPhA$rfgWjsKiNjEtdYXkPhbWo05ERmmabRefGAclsGL_09_iEyvDqKa3jBgnLiKTxf-rzp16OZJtC8jK-Ujh4WutsA	counselor	مریم رضایی	\N	\N	\N	\N	\N	2026-11-22 15:12:10.133	2026-11-22 15:12:10.133	\N	\N	\N	\N	\N	\N	\N	\N
ed4cbc7d-e665-4ba0-b074-5df7c889e5e0	e2e_1795362027908	\N	scrypt$16384$8$1$HxFixqKw_a9BrZTkMOU-AA$PV52Lu3KldGdGlV7PUzfp89gkdhvoX_fyI1u-Jz_gyG4W1BVmxjUaFXMRHsemSLXhpIvvOueGcUojDxnibM5Mg	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-22 15:40:30.398	2026-11-22 15:40:31.124	\N	\N	\N	\N	\N	\N	\N	\N
a2b04ff9-29cf-49d9-ae48-cbf692c1db3c	e2e_1795409922236	\N	scrypt$16384$8$1$lzf1IbBEOqHHqaUFBaHRLA$u1UR6drKWkhWhtbKKtyb88gFF9iwYrh0-6SLEtJkAcuAQw9_O3vA3OedJkjCHD1FzEZONIs4hWNKrcgLLI2BXw	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 04:58:45.494	2026-11-23 04:58:45.84	\N	\N	\N	\N	\N	\N	\N	\N
ad46ff0a-468d-4eb3-95be-31411b298c91	e2e_1795411330175	\N	scrypt$16384$8$1$q-t_kDgFIIp4hi03eczK2Q$vtEoF6Ex46fafOJ2I8vXwcDio5b3E4-JFt1DQVwARgWJBl3E6y1fOlAb5wzVFOilw3zPm3GJgTJCepXG4avE8g	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 05:22:14.13	2026-11-23 05:22:14.485	\N	\N	\N	\N	\N	\N	\N	\N
0f014fc3-64f6-46bc-a84f-a1f9a4125d51	e2e_1795410017197	\N	scrypt$16384$8$1$gQ9_4D3vXnfyh_Ap1jD7Sg$ANDkBDyQYNJ4S8Fg6Pxg1Ni9RNIleE2OU8YaoUs8b40x1ADnZYbKJA8T43vhpIAJnteHHO3ZxC39dxCv8Rx5LA	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 05:00:19.631	2026-11-23 05:00:20.442	\N	\N	\N	\N	\N	\N	\N	\N
b277c296-d9a4-4505-b0d2-de537e8ed47d	e2e-sched_1795428916514	\N	scrypt$16384$8$1$6E0NnrVxox6CF9W9LNgMYw$Hx_vAxcubT4208feZBQMt8NN-Tl_7tIPsHD_2AIY7dQSWVHXJGK13iJQlGEApw5bo94sZT9At9uWAhVOFtcKlA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:15:17.88	2026-11-23 10:15:17.88	\N	\N	\N	\N	\N	\N	\N	\N
90a01375-94e1-4b30-a1f5-79eb88a71c28	e2e_1795415062448	\N	scrypt$16384$8$1$FK71qzVeqDrp4xsdX3FxNA$eVt8X2av6VCAlioRKCLqd7zRTmASr1y1stBQO5Zs-ivYxOBLdIX5IeYeaHhKNDXSCDm2_jPtmk1JhlVbAHegDw	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 06:24:29.04	2026-11-23 06:24:29.827	\N	\N	\N	\N	\N	\N	\N	\N
cc88c2c7-822a-4f04-b590-dd0919bdf763	e2e_1795411477689	\N	scrypt$16384$8$1$dOrWoRXfoEfDkCnmFFueDg$uKnjODgnOMJ5zfXG15h7o1q-LLIy03xjGC9qnYh27NeQAnQ2kGpgMzH-mT-0K9ap2uXpei-5uVrjqnQqgx4QXA	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 05:24:42.68	2026-11-23 05:24:43.47	\N	\N	\N	\N	\N	\N	\N	\N
ea56249f-48e7-4988-85c1-6f6a40d7baa3	e2e-nutrition_mwt9zu615226	\N	scrypt$16384$8$1$H4kCd1tTHeH0YgMPmbo1xQ$qXJ-ku7nN18315n464oNq2tLmpASyqqlKZcm_GKLyB7oAlKwbj4M4flW98_KtLwXWdUb9qrfebvOIKERGMXzgQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:02:33.897	2026-11-23 13:02:33.897	\N	\N	\N	\N	\N	\N	\N	\N
d4c1811e-4e7e-4b35-b915-3b4c33d33689	e2e_1795416151315	\N	scrypt$16384$8$1$QtqjwlKqlyZAJL7P96b51w$iMVf53Ya7YHi1IRiNRQsa1jVZ619Sp0V0FNeYjdDtIQZuHFvZo45XHFYqHgCZVvmJkttPnZwX7hS0gKPSqPPxA	student	دانش‌آموز آزمایشی	\N	\N	دبیرستان دوم	\N	\N	2026-11-23 06:42:36.919	2026-11-23 06:42:37.676	\N	\N	\N	\N	\N	\N	\N	\N
1e295e31-b1f3-4211-8f0f-067c6cdd3502	e2e-nutrition_mwta30rf1102	\N	scrypt$16384$8$1$62bVl65tVw_G3mgtvDqlKQ$EJ729zUzkbVE-V12kK6_LhE2ndQ9t1fI7d8p3Oq2ts3-xjuokz1pyu-1GGskjBrKCwtTCKQ-E_buojN8TRmDJA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:05:02.375	2026-11-23 13:05:02.375	\N	\N	\N	\N	\N	\N	\N	\N
b9e96834-646a-4aba-ad04-aa8490a08434	e2e-nutrition_mwta4wc15435	\N	scrypt$16384$8$1$cQYxjfF4jjT1joF_un45FA$G0lFIfg7KQDy6aeryND75x6MTpzqoa0aUtbG8pYp2FfbexFOL7Oc9CbXnN3s2ZV6uXpmKM827xr8mRXMykq2YA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:06:29.98	2026-11-23 13:06:29.98	\N	\N	\N	\N	\N	\N	\N	\N
20eb0fc3-d5a3-456b-ae59-cb407fe5910e	e2e-nutrition_mwta66203161	\N	scrypt$16384$8$1$vQH2OwpugSZId6wncjfQuQ$ciBnrb1KbLYp7sHqJgCwSCUP9hgzKBgcBSUrLH1QhRZ3EeEMLT63sHoSLTXYD_DFXThr3gqvcgNp6OokHsYs7g	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:07:29.166	2026-11-23 13:07:29.166	\N	\N	\N	\N	\N	\N	\N	\N
8edbd51a-78cb-4640-9687-95e6a3de9926	e2e-leisure_mwta8gtl7611	\N	scrypt$16384$8$1$2dthHqto3puaGpVZsfiJDw$jv3XgW58a0H48ky5Aj_7I6U4rONvo-r9zr9OvQbz_Zqo5ccMMfm4c4IlgNfFZQRAsJZ18-qNTymLnkoAhCxXkg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:09:16.931	2026-11-23 13:09:16.931	\N	\N	\N	\N	\N	\N	\N	\N
3fa91bdc-c8a6-48f6-9633-569b5d5bcd00	e2e-leisure_mwta8xlh8524	\N	scrypt$16384$8$1$rby8TFEV7Mpc26if_ts2WA$ZIRh0UHjNF4Mheg-TM-yNKsY2TGsJ-FNqJDcmsbA_JVK2dPIX3rzVagKuvNVNlVnqefNGCRuWuXYHMRovtrzUw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:09:38.335	2026-11-23 13:09:38.335	\N	\N	\N	\N	\N	\N	\N	\N
41d7cb52-ac9e-469b-b13f-41dd94708760	e2e-nutrition_mwta8xlu416	\N	scrypt$16384$8$1$-q8i5NSmkFqJrpPKqO9ykQ$7l4eGwUxrdktqHUXqMlm7oINRXyf9tUF8sy0ItjqQc-mJ6dZWOHEcE8COyGHuIjUKsiBXSYA-JIiE4gT55e1nw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:09:38.314	2026-11-23 13:09:39.979	moderate	17	maintain	male	180	70	\N	\N
af2b4d0f-8c5e-424a-ba3f-6c94f187c85a	e2e-nutrition_mwtan499731	\N	scrypt$16384$8$1$pQJnF7Dn4mmBgbWh5XJDSA$guA5uGKq3Tz_dic8FqAZFoEQRl3hVtO0B26pa9Lqy_jNbNZQCVzkiXow0VM3gDLFZE9P8_yFiW8VIrWudAecmA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:20:41.356	2026-11-23 13:20:41.356	\N	\N	\N	\N	\N	\N	\N	\N
9dd813c1-2c4a-478a-9230-ed0ad10865fe	e2e-leisure_mwtas7p76487	\N	scrypt$16384$8$1$EipycJMgk2FbdlRv08Xq7g$hDCukmJvEZbLBvcVuGdzSihc0VaUxhI2D0Joh0C804aU81szFeq4LRmxSRlt6_oIhdpZn8VEFigl0DHV5rBquQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:24:39.105	2026-11-23 13:24:39.105	\N	\N	\N	\N	\N	\N	\N	\N
0225be15-a126-4583-b142-8922eb4868c1	e2e-sched_1795428964747	\N	scrypt$16384$8$1$ZjSDpzaNJB6_JE-viYMZXw$IIJ_Vv5gv6zRKzYQtkKzyfFHUwt11Fu1TR1bQjtS1fLxW5jDH1ZiRK2yVv9oMq-RNs8fTLOtSi5vrgrYLwaUuw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:16:06.164	2026-11-23 10:16:06.164	\N	\N	\N	\N	\N	\N	\N	\N
bf051d9f-ea61-4c52-8468-56ccf0ac0e98	e2e-study_1795428964819	\N	scrypt$16384$8$1$KyMwj4wNmLzaY1IjDH-K3g$a2j2sx8Th_QyNUyXAe0rsKTSxLfxd20ki6pU-tnyf0iPDbxkRERWS6OxP6N6BBHWdjXJBBNKR1i_aKm7gq3H8w	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:16:06.216	2026-11-23 10:16:06.216	\N	\N	\N	\N	\N	\N	\N	\N
9ad2d604-c372-4465-a590-1105c3201bea	e2e-nutrition_mwtatn0e7366	\N	scrypt$16384$8$1$GCvvaRqMrEnwcOpPHXJJTg$NNsSTyINOceRzHAMsFjAuFjausyuiTiX1Yvj_o5-CLal-1EBEium-1Put9JhIRUD5b2C82NR5AAWazOIMeFJbg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:25:45.647	2026-11-23 13:25:47.642	moderate	17	maintain	male	180	70	\N	\N
26225efa-fa2e-4840-ba5a-7256d2f631a6	m.rastegar991@gmail.com	m.rastegar991@gmail.com	scrypt$16384$8$1$lhy0TI6XXfOcTvqEqs-zaA$lMshiq7FfMYBH1Yy0b-TVd2wE9TPlMiXNAkTBZ0K1o2gTSjIYhxKk2SatZWUTidJK8SCjkye64R6jxvLCD-1fQ	student	مصطفی رستگار	دوازدهم	ریاضی فیزیک	اسوه	\N	\N	2026-11-23 07:23:27.137	2026-11-24 06:17:16.384	sedentary	36	gain	male	171	85	\N	\N
45b99a02-118c-465b-947a-d7c532b90769	e2e-nutrition_mwtak9156945	\N	scrypt$16384$8$1$3quQTM2_Qwo-FTCo44Dllw$Rm-4oROl1xUV9vRkmHSGyttjNHnAwsBAA_fa-Etxg2Td3R9HNT_vtsWeRc6WW32HZRZUQcwZci7WSQq2eTYqrg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:18:29.514	2026-11-23 13:18:31.411	moderate	17	maintain	male	180	70	\N	\N
51581476-ee0e-499a-bfc5-71ed25e3ab67	e2e_1795428442636	\N	scrypt$16384$8$1$rSC_YIxZrY4W7vDfR4KtOA$YHkeK9xPT0tntoIQZN0Exc4ogFlBj0jhY1QIVIE7KePVa9ckhKQO14_6wSm46QI7Pzk5JGBk0h-nm23H-YdlYQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:07:26.449	2026-11-23 10:07:26.449	\N	\N	\N	\N	\N	\N	\N	\N
77cb2f5c-fe58-4bc0-9518-3f1211518f60	e2e_1795428442635	\N	scrypt$16384$8$1$j1yxo3OBDKi-lVP-yZ0gWQ$ixoxUdM4IzJ9D1OLn-apAwZnL4f4SjnF1O72h3JlZoYS8ZFHf2-liMMIkADiDjGLZ9FBbN5Ep_9NAMNQj3YWWA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:07:26.469	2026-11-23 10:07:26.469	\N	\N	\N	\N	\N	\N	\N	\N
831343e1-ee56-4e6e-9947-c7e9485549ec	e2e-sched_1795428672588	\N	scrypt$16384$8$1$UwdOcGEnRfwdeapPq_UKzA$uZVWTpplSJQqBrY3JXD_O5WJv1wow_ZNVk7y8-xCrdxGZ7lT9AHvAgKmYOMaYVYyRHnpWteyNcgOAsSoFvOzQg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:11:15.315	2026-11-23 10:11:15.315	\N	\N	\N	\N	\N	\N	\N	\N
4e7b6973-abdf-4669-ab67-e9fe2d1ccb8c	e2e-study_1795429276053	\N	scrypt$16384$8$1$1HA9DgfnUcQvW9mmIiuYUw$sRveW-VypC3OE6FqdXPl7vuiE2kJfVMTSIiwV-W1l5YsSMDT1V3qE80Vajt2OKzCYpvQUIJCi67jbfgQT0mO6w	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:21:18.009	2026-11-23 10:21:18.009	\N	\N	\N	\N	\N	\N	\N	\N
fb3ec988-094f-44c9-97d0-e67e283f6763	e2e-sched_1795429276052	\N	scrypt$16384$8$1$f0P_lptqtp8Xb5VzgoVvRg$9cW_KpyYoMlWGAbDyNTQXLybsd-nJVuPr_MjEZ-WvSSAurN9Vyncorp1ZNnyepuTVP0z4nHpD_sWuA8wsCeZ7A	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 10:21:17.956	2026-11-23 10:21:17.956	\N	\N	\N	\N	\N	\N	\N	\N
fbd351c8-c791-44fc-bd60-e1064e66a668	e2e-nutrition_mwtapxmt7794	\N	scrypt$16384$8$1$CtvYt8z2WJZtLKlEa-YHYA$z3qJoF1G7WskZcRYqEMuLbCOFqDITyDGONMwL8jCY3Elcd-kZ-kfyQBRDdBPe9v_hvYoh29KYn7M5KioikIBJg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:22:52.741	2026-11-23 13:22:54.774	moderate	17	maintain	male	180	70	\N	\N
da32ab60-6c1b-4e4b-b631-54301e43cf5c	e2e-nutrition_mwtas7p37746	\N	scrypt$16384$8$1$5c__9AH7aj4Bw4J7yFZqNQ$wEXnw8Jhmvs7olmqKRKnl8lgw6vcsWndpNSXqIpM1YPI7yVVs1YB1GycRFbXxzQ-zamD-1Q4S-9wDrAwBWEM4A	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:24:39.106	2026-11-23 13:24:41.141	moderate	17	maintain	male	180	70	\N	\N
7b805c62-dbce-443d-90ba-7013b39b4fdb	e2e-leisure_mwtauhnr2668	\N	scrypt$16384$8$1$4HxC7JYEVQMTg15kxlm-sw$z7POFhDKHdUbnlKklnobccGKLn44gK-LZkaBITx1PnrZyyaYgeSYrWyt_WpwCHiOurBT87v2lfy6NQnTQaMEHQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:26:25.355	2026-11-23 13:26:25.355	\N	\N	\N	\N	\N	\N	\N	\N
f090564b-528a-4426-9312-9496482aaae1	e2e-nutrition_mwtauho77967	\N	scrypt$16384$8$1$KUZajRWZ7BLZ5nm6pLiA3w$oOzIJpOoHBAHjrr5RKzsJdwZByel__ooHyx4_Zhgixh0Rw7CGhH-IrgSBxHtNELLGrc7bpI-YBLMmPZrbST9jQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:26:25.354	2026-11-23 13:26:27.393	moderate	17	maintain	male	180	70	\N	\N
049061ee-f431-403e-a9b6-eae834332004	e2e-leisure_mwtac5b86186	\N	scrypt$16384$8$1$tCV0rOYbkV9hN_KB9-WU9g$_3Oh6SnyWATdiQl-nIyLCDMGh9JPIu-3y-P_KpApLXDj-daXW_GoIm94nJJrpPIKVGGehTz-8p57dqC0Iv6PVw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:12:08.209	2026-11-23 13:12:08.209	\N	\N	\N	\N	\N	\N	\N	\N
ac9203a8-992d-4e49-a02a-05293a09a3ef	e2e-nutrition_mwtac5bn7618	\N	scrypt$16384$8$1$1WCtzreSRT_DpvDmbESU0A$KiclNOXzPU5yAx4SGNI5GbIvBEkprVLEHA3eNYRpwQqtF3RRJO9AkuydnQTuVPLAiQA4CXbiNTa2kuJVuaAJ0w	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 13:12:08.233	2026-11-23 13:12:09.801	moderate	17	maintain	male	180	70	\N	\N
35eb97c4-418e-413e-8abf-7e5ed08d7569	e2e-budget_mwte5y3g4476	\N	scrypt$16384$8$1$proKqe5pupG5UI8OW0SsPw$dJNjBIumZNbvN92WGaMMZEIq5Dhyv2ZhzL-DUnoy2bEvv1_SzLqyX9psek02RIWRDJTDw2UGEik4kyWIIg1usg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 14:59:20.994	2026-11-23 14:59:20.994	\N	\N	\N	\N	\N	\N	\N	\N
62c3278c-b93c-4c12-b599-98f9f1e74191	e2e-budget-nav_mwte5y2y3562	\N	scrypt$16384$8$1$tVO8-a2NJ_JTl_5PSdalBA$-gY8N7lE0Vkc5mjPX9OvEeDUQ_IIN805F09e-40ogtAbi6aU-MvjfSKRAZdEgn6QUGQn75qOCxgU1kjOPbq6Dg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 14:59:21.008	2026-11-23 14:59:21.008	\N	\N	\N	\N	\N	\N	\N	\N
37d36c15-a21f-47bf-ba22-9b8fa7f8a826	e2e-budget-cap_mwte5y2o2256	\N	scrypt$16384$8$1$vB6hvOu9nJNpPdiNQjO4xQ$WL_phDCR4b1yly21siYVvr9jZKGcSRpd76zymrc7sawlBrqak1gRNgH_ug6BLmtVKzCE_qWOVqf6fgR169_aVg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 14:59:21.569	2026-11-23 14:59:21.569	\N	\N	\N	\N	\N	\N	\N	\N
142b07d7-069c-42f2-9bc5-3d9f0b7a494f	e2e-budget-date_mwte5y2l7687	\N	scrypt$16384$8$1$rMPnz28LKhdP90FX4VOORw$HrnjzyXXanecShNSVqrYi-knwfn1PInm55kguKDfeJzyTAwYz88xpBgTyTlSUNZzsZ3hYhZ5VvJ80aUPQkGAzA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 14:59:21.57	2026-11-23 14:59:21.57	\N	\N	\N	\N	\N	\N	\N	\N
2377d2e0-d562-4f5a-b37a-2e58b303a1b5	e2e-sched_1795445956043	\N	scrypt$16384$8$1$HKCJdFV4ydx1t0Ns_O6_9g$o407pojLpXKFKXqe3fz7uQk8u6s6p_p-5JN3MreIAeN9frCTmcDKQqvguWU9lccIP7vq_w3Rzo0AXHRPQh_ulA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 14:59:21.571	2026-11-23 14:59:21.571	\N	\N	\N	\N	\N	\N	\N	\N
33c681bb-aee6-4eaf-ba66-3ac7b6f6095d	e2e-budget-date_mwte9pd55100	\N	scrypt$16384$8$1$6G3ME4fH9rS9GZBMjgq97Q$MZSFA9Q1vmNjE_CphPS9C5OIYN-cTqbVXmr977gESdFkaEVIk470z4xNUFCZoSoQ-4Zm20siy0b3lAs3GiURUA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:14.779	2026-11-23 15:02:14.779	\N	\N	\N	\N	\N	\N	\N	\N
737d53e1-7bd6-42e4-9b60-478410ee2d64	e2e-sched_1795446131350	\N	scrypt$16384$8$1$gGeX54VD3msTV0_ENFVREQ$wZN-txGOVYPAlSY2GGC2ju6k5wDKVmcjbbkaWc46TfhzEXRLnYoDOQGndpP_qu69MnqddZiCi_rJDIHFzqa3EA	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:14.781	2026-11-23 15:02:14.781	\N	\N	\N	\N	\N	\N	\N	\N
1fb0369c-eddb-4c45-9e57-fd427b0f45db	e2e-budget-nav_mwte9paq4767	\N	scrypt$16384$8$1$RxQEeB7kjh9DEqi6HNBVmA$KE2uWyiXOIKvvgDqiCDq6WUGUBSV8m5qACMMLn4m7Oz88wmDxjrzg6ALp71gsbAVnLdAUjnUXcSP7991wg2v9g	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:14.783	2026-11-23 15:02:14.783	\N	\N	\N	\N	\N	\N	\N	\N
817d3609-4063-4a9a-8d9b-1165016c5d13	e2e-budget_mwte9pdu395	\N	scrypt$16384$8$1$iNpu-qTPDSxcGfhOB02i-Q$rIF2F5qwZeOvNt_7Woh6ctpUZjyo1W_XcKRTdRCPtXqWsjmY3YuiXoKVN5jtamJRsWcSZih2B8ygl5bHJ9pK8g	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:14.784	2026-11-23 15:02:14.784	\N	\N	\N	\N	\N	\N	\N	\N
3a40c3b5-1106-4403-8cd8-d21af0311081	e2e-budget-cap_mwte9pa08277	\N	scrypt$16384$8$1$VJZiGx_4y1Wl8ipeddugVQ$rpRmlhj549IMF7OL3TjvRwQ6hS9MLwsc8JI6axG_lDalqPuMZQLyrqCFO3AUCqhhuWvB4EJx6CDgL0KvCrIfeQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:14.826	2026-11-23 15:02:14.826	\N	\N	\N	\N	\N	\N	\N	\N
687bfce1-29a0-4bd8-88c8-a14ec61ca50c	student	\N	scrypt$16384$8$1$tUAZlWDQChunkHc6HvtPhA$rfgWjsKiNjEtdYXkPhbWo05ERmmabRefGAclsGL_09_iEyvDqKa3jBgnLiKTxf-rzp16OZJtC8jK-Ujh4WutsA	student	علی احمدی	دوازدهم	علوم تجربی	دبیرستان نمونه	91d79433-a212-494e-b2b6-e4282c0072e3	9572c19d-9cab-4592-9e63-da9e9c0f34b0	2026-11-22 15:12:10.153	2026-11-24 11:21:45.892	\N	\N	\N	\N	\N	\N	\N	\N
ef71a5cb-13ef-45f2-a7b5-ae80cabd2df0	e2e-budget-nav_mwteaiqd4490	\N	scrypt$16384$8$1$oOuWVjqydyDhtZFVH3h52w$lVbLHFFEze1h75nRrZBG0E8Qv7soYMTpiP7iPc1NYWB_1JgLH4vFCHZdk3svTO5LWdapmH4R5qNy0G9J6p6esQ	student	دانش‌آموز آزمایشی	\N	\N	\N	91d79433-a212-494e-b2b6-e4282c0072e3	9572c19d-9cab-4592-9e63-da9e9c0f34b0	2026-11-23 15:02:52.952	2026-11-24 09:42:59.06	\N	\N	\N	\N	\N	\N	\N	\N
01763d1c-79dc-4deb-9057-163c35ddda17	e2e-budget-cap_mwteaitp4630	\N	scrypt$16384$8$1$qtxNTFyVNIjh2Bjd5YTKlw$eRaQViwNUnmYMHa2krco3G092EE7f7AynPSMJCIH80bCJtW4wSBrfjR6yWRVEe42QyiNdfYEJx2-2eu3OWywxQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:52.913	2026-11-23 15:02:52.913	\N	\N	\N	\N	\N	\N	\N	\N
069acbb6-b050-40f9-93d6-fb1aaba45ac8	e2e-sched_1795446169525	\N	scrypt$16384$8$1$nNIj6h1TEuGD-x3qGA7zmQ$vVNa_wrNxQLy9e3I0Ez7b2HxLYvFJaVoaDdb8G8kLDWgCYYO0GJCgiTQOYSZZlf6OzHTkn5JkRB1rR8OOpmHFw	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:52.925	2026-11-23 15:02:52.925	\N	\N	\N	\N	\N	\N	\N	\N
02d83dc3-dfdb-444a-8a61-294b93fec37b	e2e-budget_mwteaisl2215	\N	scrypt$16384$8$1$mlHPaW_HNobyx4zrSpRJVw$26L9REeNA1bunyCPMIzLdDQOnil9hxzIw2D00KSyWAyhU_V69WDvOh0plV5eZOmP3ueZYaVwv-OOnEFT9umsQQ	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:52.929	2026-11-23 15:02:52.929	\N	\N	\N	\N	\N	\N	\N	\N
671ac9e1-8527-42d7-894d-2eb71712e039	e2e-budget-date_mwteairm1698	\N	scrypt$16384$8$1$ddcFBOUYCiGh12c1mB2yog$wvyQP1s55IXJ-wFl5gJNLK4S7M9PVdzilqX43eVJcANj81iDQiq_QopxF7allaWXOy1oBg32j8mVtRpD3cmtrg	student	دانش‌آموز آزمایشی	\N	\N	\N	\N	\N	2026-11-23 15:02:52.93	2026-11-23 15:02:52.93	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: WeeklyGoal; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."WeeklyGoal" (id, "studentId", "weekKey", "studyMinutesTarget", "testsTarget", "testsDone", "completedBlocks", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WeeklySchedule; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."WeeklySchedule" (id, "studentId", "dayOfWeek", "startMinute", "endMinute", subject, teacher, room, "createdAt", "updatedAt") FROM stdin;
bbf34aa0-02cd-420b-8338-09e7c4ed17f7	26225efa-fa2e-4840-ba5a-7256d2f631a6	2	480	540	ejtemaei	\N	\N	2026-11-24 06:12:24.918	2026-11-24 06:12:24.918
4fe75d37-366b-408a-88c7-c6df4a77ada2	687bfce1-29a0-4bd8-88c8-a14ec61ca50c	1	480	720	dini	\N	\N	2026-11-24 08:38:10.38	2026-11-24 08:38:10.38
644b3e9f-ca91-435a-ac8d-44cc6a23853a	687bfce1-29a0-4bd8-88c8-a14ec61ca50c	2	480	540	riazi	\N	\N	2026-11-24 08:39:11.223	2026-11-24 08:39:11.223
1501c434-7f7a-4871-9a84-02deac55968e	831343e1-ee56-4e6e-9947-c7e9485549ec	2	480	540	riazi	\N	\N	2026-11-23 10:11:17.779	2026-11-23 10:11:17.779
c273723d-28c1-4ee4-bb1d-bcca7e44abba	26225efa-fa2e-4840-ba5a-7256d2f631a6	0	480	540	dini	\N	\N	2026-11-23 10:12:40.916	2026-11-23 10:12:40.916
ebbf181f-f445-45a5-ad00-093b25491796	26225efa-fa2e-4840-ba5a-7256d2f631a6	1	480	600	farsi	\N	\N	2026-11-23 10:12:58.98	2026-11-23 10:12:58.98
ec1f0b2c-2f3b-4ed4-b209-7dd5b815a5f4	26225efa-fa2e-4840-ba5a-7256d2f631a6	1	660	900	farsi	\N	\N	2026-11-23 10:13:10.529	2026-11-23 10:13:10.529
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c4720214-0cae-4c0b-9b99-5d9b7ece2896	c020c236254795ed0977d62eca618de5d9baf4ed7a35c8cb54117d412b015693	2026-11-22 10:58:18.631674+00	20261122035538_init	\N	\N	2026-11-22 10:58:18.606395+00	1
f7bd0d69-1a96-45f0-9ede-2b5dc46ae668	5f0d43025ad1844675ef0a2155521c54c3b2e762686500cbd7be3d0676c730a7	2026-11-22 14:56:39.053006+00	20261122145638_add_advising_identity	\N	\N	2026-11-22 14:56:38.953273+00	1
4bbcd146-3881-4cb6-b5ca-cc1096d6c306	34a699f95c0bf537ab61c92bac75b842b6500c1a489c74f4f4c9b82292bfaefb	2026-11-23 08:02:40.039744+00	20261123080240_add_advising_schedule_homework_study	\N	\N	2026-11-23 08:02:40.01871+00	1
e92a5383-a4a4-4ca0-9626-f607294457a5	1e6d86abf945f1947c9f73b72f50f50ab3c617383cb39a5b2a0a0a141378a9f7	2026-11-23 12:30:32.237632+00	20261123123032_add_advising_nutrition_leisure	\N	\N	2026-11-23 12:30:32.204598+00	1
13c2a261-c1ac-4b60-a26c-da4cfc01f32d	29ff2fc9002d6e708f0fb5c754a22932d239e1085f4f7b72fd150d4ff96f42dc	2026-11-23 14:26:53.714739+00	20261123142653_phase_5_3_1_free_time_budget	\N	\N	2026-11-23 14:26:53.698936+00	1
7d888fcf-0bc7-4b5b-a71f-d433ed579dfd	91396f9ca95f1da892f749026e7a7e58d8f59d89b13cc68d73dda3d1708734d3	2026-11-23 15:55:16.268308+00	20261123155516_lite_dashboard_settings	\N	\N	2026-11-23 15:55:16.259907+00	1
\.


--
-- Name: CacheEntry CacheEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."CacheEntry"
    ADD CONSTRAINT "CacheEntry_pkey" PRIMARY KEY (key);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: FreeTimeBudget FreeTimeBudget_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."FreeTimeBudget"
    ADD CONSTRAINT "FreeTimeBudget_pkey" PRIMARY KEY (id);


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY (id);


--
-- Name: HomeworkPlanEntry HomeworkPlanEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."HomeworkPlanEntry"
    ADD CONSTRAINT "HomeworkPlanEntry_pkey" PRIMARY KEY (id);


--
-- Name: Homework Homework_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Homework"
    ADD CONSTRAINT "Homework_pkey" PRIMARY KEY (id);


--
-- Name: IngestionRun IngestionRun_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."IngestionRun"
    ADD CONSTRAINT "IngestionRun_pkey" PRIMARY KEY (id);


--
-- Name: MealPlan MealPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."MealPlan"
    ADD CONSTRAINT "MealPlan_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WeeklyGoal WeeklyGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."WeeklyGoal"
    ADD CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY (id);


--
-- Name: WeeklySchedule WeeklySchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."WeeklySchedule"
    ADD CONSTRAINT "WeeklySchedule_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CacheEntry_expiresAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "CacheEntry_expiresAt_idx" ON public."CacheEntry" USING btree ("expiresAt");


--
-- Name: Conversation_updatedAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Conversation_updatedAt_idx" ON public."Conversation" USING btree ("updatedAt");


--
-- Name: Document_contentHash_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "Document_contentHash_key" ON public."Document" USING btree ("contentHash");


--
-- Name: Document_ingestedAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Document_ingestedAt_idx" ON public."Document" USING btree ("ingestedAt");


--
-- Name: FreeTimeBudget_studentId_dayKey_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "FreeTimeBudget_studentId_dayKey_key" ON public."FreeTimeBudget" USING btree ("studentId", "dayKey");


--
-- Name: Group_counselorId_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Group_counselorId_idx" ON public."Group" USING btree ("counselorId");


--
-- Name: HomeworkPlanEntry_homeworkId_dayKey_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "HomeworkPlanEntry_homeworkId_dayKey_key" ON public."HomeworkPlanEntry" USING btree ("homeworkId", "dayKey");


--
-- Name: HomeworkPlanEntry_studentId_dayKey_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "HomeworkPlanEntry_studentId_dayKey_idx" ON public."HomeworkPlanEntry" USING btree ("studentId", "dayKey");


--
-- Name: Homework_studentId_completedAt_priority_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Homework_studentId_completedAt_priority_idx" ON public."Homework" USING btree ("studentId", "completedAt", priority);


--
-- Name: IngestionRun_documentId_startedAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "IngestionRun_documentId_startedAt_idx" ON public."IngestionRun" USING btree ("documentId", "startedAt");


--
-- Name: MealPlan_studentId_dayKey_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "MealPlan_studentId_dayKey_key" ON public."MealPlan" USING btree ("studentId", "dayKey");


--
-- Name: Message_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Message_conversationId_createdAt_idx" ON public."Message" USING btree ("conversationId", "createdAt");


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_tokenHash_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "Session_tokenHash_key" ON public."Session" USING btree ("tokenHash");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: User_counselorId_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "User_counselorId_idx" ON public."User" USING btree ("counselorId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_groupId_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "User_groupId_idx" ON public."User" USING btree ("groupId");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: WeeklyGoal_studentId_weekKey_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "WeeklyGoal_studentId_weekKey_key" ON public."WeeklyGoal" USING btree ("studentId", "weekKey");


--
-- Name: WeeklySchedule_studentId_dayOfWeek_startMinute_key; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE UNIQUE INDEX "WeeklySchedule_studentId_dayOfWeek_startMinute_key" ON public."WeeklySchedule" USING btree ("studentId", "dayOfWeek", "startMinute");


--
-- Name: FreeTimeBudget FreeTimeBudget_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."FreeTimeBudget"
    ADD CONSTRAINT "FreeTimeBudget_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Group Group_counselorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HomeworkPlanEntry HomeworkPlanEntry_homeworkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."HomeworkPlanEntry"
    ADD CONSTRAINT "HomeworkPlanEntry_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES public."Homework"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HomeworkPlanEntry HomeworkPlanEntry_studentId_dayKey_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."HomeworkPlanEntry"
    ADD CONSTRAINT "HomeworkPlanEntry_studentId_dayKey_fkey" FOREIGN KEY ("studentId", "dayKey") REFERENCES public."FreeTimeBudget"("studentId", "dayKey") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Homework Homework_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Homework"
    ADD CONSTRAINT "Homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IngestionRun IngestionRun_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."IngestionRun"
    ADD CONSTRAINT "IngestionRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MealPlan MealPlan_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."MealPlan"
    ADD CONSTRAINT "MealPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_counselorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Group"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WeeklyGoal WeeklyGoal_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."WeeklyGoal"
    ADD CONSTRAINT "WeeklyGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WeeklySchedule WeeklySchedule_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."WeeklySchedule"
    ADD CONSTRAINT "WeeklySchedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict g2eCbdVNARngmQjGQZXCFmiBKZbRXwG3t9Ee2kplj0m5aKZ21EC6oEtGbCr7nuc


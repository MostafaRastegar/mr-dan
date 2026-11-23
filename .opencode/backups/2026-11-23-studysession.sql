--
-- PostgreSQL database dump
--

\restrict egXtcSEIAEUUprCOXPCejnpgrsoyVP7n1uALjojSigUwNdhs8RNiSaIM6bsL3Mf

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
-- Name: StudySession; Type: TABLE; Schema: public; Owner: mr_dan
--

CREATE TABLE public."StudySession" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    category text NOT NULL,
    subject text,
    "durationMinutes" integer NOT NULL,
    "focusLevel" integer,
    "startedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StudySession" OWNER TO mr_dan;

--
-- Data for Name: StudySession; Type: TABLE DATA; Schema: public; Owner: mr_dan
--

COPY public."StudySession" (id, "studentId", category, subject, "durationMinutes", "focusLevel", "startedAt", "createdAt") FROM stdin;
bdd8bc6b-6650-4056-a9de-d1e38e1a3c72	9d3f657c-9455-4927-a984-e173e4674777	study	\N	25	4	2026-11-23 10:11:16.445	2026-11-23 10:11:16.78
638158de-c1af-4d67-81fe-e54b6e823f5a	350f6aca-f3fa-41ae-ae6a-82e1c298c76c	study	\N	25	4	2026-11-23 10:15:18.568	2026-11-23 10:15:18.948
89a9bfae-29f8-4540-b1e9-13d4eeb903c2	bf051d9f-ea61-4c52-8468-56ccf0ac0e98	study	\N	25	4	2026-11-23 10:16:06.767	2026-11-23 10:16:07.103
d185aad2-fb48-47d6-a6f8-bb9d94763adc	4e7b6973-abdf-4669-ab67-e9fe2d1ccb8c	study	\N	25	4	2026-11-23 10:21:19.104	2026-11-23 10:21:19.465
\.


--
-- Name: StudySession StudySession_pkey; Type: CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."StudySession"
    ADD CONSTRAINT "StudySession_pkey" PRIMARY KEY (id);


--
-- Name: StudySession_studentId_startedAt_idx; Type: INDEX; Schema: public; Owner: mr_dan
--

CREATE INDEX "StudySession_studentId_startedAt_idx" ON public."StudySession" USING btree ("studentId", "startedAt");


--
-- Name: StudySession StudySession_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mr_dan
--

ALTER TABLE ONLY public."StudySession"
    ADD CONSTRAINT "StudySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict egXtcSEIAEUUprCOXPCejnpgrsoyVP7n1uALjojSigUwNdhs8RNiSaIM6bsL3Mf


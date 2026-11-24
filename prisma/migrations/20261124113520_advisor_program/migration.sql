/*
  Warnings:

  - You are about to drop the column `studyMinutesTarget` on the `WeeklyGoal` table. All the data in the column will be lost.
  - You are about to drop the column `testsTarget` on the `WeeklyGoal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "spentMinutes" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "homeworkAverageMinutes" INTEGER,
ADD COLUMN     "needId" TEXT,
ADD COLUMN     "otherOccupiedMinutes" INTEGER[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0]::INTEGER[],
ADD COLUMN     "schoolMode" TEXT,
ADD COLUMN     "takesMockExams" BOOLEAN;

-- AlterTable
ALTER TABLE "WeeklyGoal" DROP COLUMN "studyMinutesTarget",
DROP COLUMN "testsTarget";

-- CreateTable
CREATE TABLE "Need" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Need_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExamResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "taraz" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProgramEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProgramEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "testsTarget" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlanEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "chapterIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplementaryCourse" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "weeklyMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplementaryCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Need_code_key" ON "Need"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_code_key" ON "Exam"("code");

-- CreateIndex
CREATE INDEX "StudentExamResult_studentId_updatedAt_idx" ON "StudentExamResult"("studentId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExamResult_studentId_examId_key" ON "StudentExamResult"("studentId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProgramEntry_studentId_dayOfWeek_subject_key" ON "SchoolProgramEntry"("studentId", "dayOfWeek", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlan_studentId_key" ON "StudyPlan"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlanEntry_studentId_dayOfWeek_subject_key" ON "StudyPlanEntry"("studentId", "dayOfWeek", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_subject_field_grade_number_key" ON "Chapter"("subject", "field", "grade", "number");

-- CreateIndex
CREATE UNIQUE INDEX "TestRecord_studentId_subject_weekKey_key" ON "TestRecord"("studentId", "subject", "weekKey");

-- CreateIndex
CREATE INDEX "SupplementaryCourse_studentId_idx" ON "SupplementaryCourse"("studentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExamResult" ADD CONSTRAINT "StudentExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExamResult" ADD CONSTRAINT "StudentExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProgramEntry" ADD CONSTRAINT "SchoolProgramEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanEntry" ADD CONSTRAINT "StudyPlanEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudyPlan"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRecord" ADD CONSTRAINT "TestRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementaryCourse" ADD CONSTRAINT "SupplementaryCourse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

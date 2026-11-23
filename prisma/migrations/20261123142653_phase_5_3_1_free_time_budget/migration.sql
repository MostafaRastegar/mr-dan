/*
  Warnings:

  - You are about to drop the `StudySession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_studentId_fkey";

-- DropTable
DROP TABLE "StudySession";

-- CreateTable
CREATE TABLE "FreeTimeBudget" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "freeMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeTimeBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkPlanEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreeTimeBudget_studentId_dayKey_key" ON "FreeTimeBudget"("studentId", "dayKey");

-- CreateIndex
CREATE INDEX "HomeworkPlanEntry_studentId_dayKey_idx" ON "HomeworkPlanEntry"("studentId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "HomeworkPlanEntry_homeworkId_dayKey_key" ON "HomeworkPlanEntry"("homeworkId", "dayKey");

-- AddForeignKey
ALTER TABLE "FreeTimeBudget" ADD CONSTRAINT "FreeTimeBudget_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkPlanEntry" ADD CONSTRAINT "HomeworkPlanEntry_studentId_dayKey_fkey" FOREIGN KEY ("studentId", "dayKey") REFERENCES "FreeTimeBudget"("studentId", "dayKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkPlanEntry" ADD CONSTRAINT "HomeworkPlanEntry_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

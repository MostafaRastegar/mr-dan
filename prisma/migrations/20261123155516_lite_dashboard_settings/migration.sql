-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "eatenSlots" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sleepMinutes" INTEGER,
ADD COLUMN     "wakeMinutes" INTEGER;

-- CreateTable
CREATE TABLE "WeeklyGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "studyMinutesTarget" INTEGER NOT NULL DEFAULT 1500,
    "testsTarget" INTEGER NOT NULL DEFAULT 300,
    "testsDone" INTEGER NOT NULL DEFAULT 0,
    "completedBlocks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyGoal_studentId_weekKey_key" ON "WeeklyGoal"("studentId", "weekKey");

-- AddForeignKey
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

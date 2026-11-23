import type { ReactNode } from "react";
import { Table, Empty } from "antd";
import type { StudyAnalysis } from "@/modules/advising/application/study";
import { subjectLabel } from "@/modules/advising/domain/subjects";
import { formatDuration } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";

interface StudyAnalysisViewProps {
  analysis: StudyAnalysis;
}

export function StudyAnalysisView({ analysis }: StudyAnalysisViewProps): ReactNode {
  const {
    today,
    days,
    subjects,
    totalStudyMinutes,
    productivityRate,
    averageFocus,
  } = analysis;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">تحلیل مطالعه</h2>
      </div>

      {totalStudyMinutes === 0 ? (
        <div data-testid={TEST_IDS.STUDY.EMPTY}>
          <Empty description="هیچ داده‌ای ثبت نشده است" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-slate-500 text-sm">مطالعه امروز</dt>
              <dd className="text-2xl font-bold">{formatDuration(today.studyMinutes)}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-slate-500 text-sm">استراحت امروز</dt>
              <dd className="text-2xl font-bold">{formatDuration(today.breakMinutes)}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-slate-500 text-sm">ضیعت امروز</dt>
              <dd className="text-2xl font-bold">{formatDuration(today.wasteMinutes)}</dd>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-slate-500 text-sm">نرخ بهره</dt>
            <dd className="text-2xl font-bold dir-ltr">{Math.round(productivityRate * 100)}%</dd>
          </div>

          {averageFocus !== null && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-slate-500 text-sm">میانگین تمرکز</dt>
              <dd className="text-2xl font-bold dir-ltr">{averageFocus}/۵</dd>
            </div>
          )}

          <Table
            data-testid={TEST_IDS.STUDY.TABLE}
            rowKey="day"
            scroll={{ x: "max-content" }}
            dataSource={days}
            columns={[
              {
                title: "روز",
                key: "day",
                render: (day: string) => day,
              },
              {
                title: "دקות",
                key: "minutes",
                render: (minutes: number) => formatDuration(minutes),
              },
            ]}
          />

          {subjects.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <Table
                data-testid={TEST_IDS.STUDY.TABLE + "-subjects"}
                rowKey="subject"
                scroll={{ x: "max-content" }}
                dataSource={subjects}
                columns={[
                  {
                    title: "درس",
                    key: "subject",
                    render: (subject: string | null) =>
                      subject ? subjectLabel(subject) : "بدون درس",
                  },
                  {
                    title: "دקות",
                    key: "minutes",
                    render: (minutes: number) => formatDuration(minutes),
                  },
                ]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

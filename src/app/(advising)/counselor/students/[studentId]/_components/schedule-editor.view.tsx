import type { ReactNode } from "react";
import {
  Button,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  type FormInstance,
} from "antd";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { FormSheet } from "@/app/_components/form-sheet";
import {
  DAYS_OF_WEEK,
  type SubjectRow,
  type WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import { labelOf, subjectOptions } from "@/modules/advising/domain/catalog";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

export interface ScheduleEditorFormValues {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
}

interface ScheduleEditorViewProps {
  entries: WeeklyScheduleEntry[];
  canWrite: boolean;
  labels: Record<string, string>;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  form: FormInstance<ScheduleEditorFormValues>;
  editingId: string | null;
  isFormOpen: boolean;
  pending: boolean;
  formError: string | null;
  onOpenCreate: (day: number) => void;
  onOpenEdit: (entry: WeeklyScheduleEntry) => void;
  onCloseForm: () => void;
  onSubmit: (values: ScheduleEditorFormValues) => void;
  onDelete: () => void;
}

export function ScheduleEditorView(props: ScheduleEditorViewProps): ReactNode {
  const {
    entries,
    canWrite,
    labels,
    fieldOfStudy,
    subjects,
    form,
    editingId,
    isFormOpen,
    pending,
    formError,
    onOpenCreate,
    onOpenEdit,
    onCloseForm,
    onSubmit,
    onDelete,
  } = props;

  const timeRule = {
    required: true,
    pattern: /^([01]\d|2[0-3]):[0-5]\d$/,
    message: "زمان را به شکل ۰۸:۳۰ وارد کنید",
  };

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.SCHEDULE_EDITOR.SECTION}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold">برنامه هفتگی دانش‌آموز</h2>
        <p className="mt-1 text-sm text-slate-500">
          {canWrite
            ? "برای هر روز می‌توانید برنامه اضافه کنید؛ روی هر ردیف بزنید تا ویرایش شود."
            : "نمایش فقط‌خواندنی؛ برنامهٔ هفتگی را مشاور دانش‌آموز ثبت می‌کند."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {DAYS_OF_WEEK.map((day) => {
          const dayEntries = entries
            .filter((entry) => entry.dayOfWeek === day.day)
            .sort((a, b) => a.startMinute - b.startMinute);
          return (
            <div
              key={day.day}
              className="rounded-lg border border-slate-100 bg-slate-50/60 p-2"
              data-testid={TEST_IDS.SCHEDULE_EDITOR.DAY(day.day)}
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <span className="text-sm font-semibold">{day.label}</span>
                {canWrite ? (
                  <Button
                    type="text"
                    size="small"
                    className="min-h-11 min-w-11"
                    icon={<IconPlus size={16} stroke={2} aria-hidden="true" />}
                    aria-label={`افزودن برنامه به ${day.label}`}
                    onClick={() => onOpenCreate(day.day)}
                    data-testid={TEST_IDS.SCHEDULE_EDITOR.CREATE_DAY(day.day)}
                  />
                ) : null}
              </div>

              {dayEntries.length === 0 ? (
                <p className="px-1 py-2 text-xs text-slate-400">برنامه‌ای نیست</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {dayEntries.map((entry) => {
                    const body = (
                      <>
                        <span className="block dir-ltr text-xs text-slate-500">
                          {formatClock(entry.startMinute)} —{" "}
                          {formatClock(entry.endMinute)}
                        </span>
                        <span className="block text-xs font-medium">
                          {labelOf(labels, entry.subject)}
                        </span>
                        {entry.teacher ? (
                          <span className="block text-xs text-slate-500">
                            {entry.teacher}
                          </span>
                        ) : null}
                      </>
                    );
                    return (
                      <li key={entry.id}>
                        {canWrite ? (
                          <button
                            type="button"
                            onClick={() => onOpenEdit(entry)}
                            className="w-full min-h-11 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                            data-testid={TEST_IDS.SCHEDULE_EDITOR.ENTRY(entry.id)}
                          >
                            {body}
                          </button>
                        ) : (
                          <div
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5"
                            data-testid={TEST_IDS.SCHEDULE_EDITOR.ENTRY(entry.id)}
                          >
                            {body}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div className="mt-4" data-testid={TEST_IDS.SCHEDULE_EDITOR.EMPTY}>
          <Empty description="هیچ برنامه‌ای برای این دانش‌آموز ثبت نشده است" />
        </div>
      ) : null}

      {canWrite ? (
        <FormSheet
          open={isFormOpen}
          onClose={onCloseForm}
          title={editingId ? "ویرایش برنامه" : "افزودن برنامه"}
          testId={TEST_IDS.SCHEDULE_EDITOR.FORM}
        >
          <Form<ScheduleEditorFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={onSubmit}
            className="space-y-4"
          >
            <Form.Item
              name="dayOfWeek"
              label="روز هفته"
              rules={[{ required: true, message: "روز هفته را انتخاب کنید" }]}
              style={{ marginBottom: 0 }}
            >
              <Select placeholder="انتخاب روز">
                {DAYS_OF_WEEK.map((day) => (
                  <Select.Option key={day.day} value={day.day}>
                    {day.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                name="startTime"
                label="زمان شروع"
                rules={[timeRule]}
                style={{ marginBottom: 0 }}
              >
                <Input dir="ltr" inputMode="numeric" placeholder="08:30" />
              </Form.Item>
              <Form.Item
                name="endTime"
                label="زمان پایان"
                rules={[timeRule]}
                style={{ marginBottom: 0 }}
              >
                <Input dir="ltr" inputMode="numeric" placeholder="10:00" />
              </Form.Item>
            </div>

            <Form.Item
              name="subject"
              label="درس"
              rules={[{ required: true, message: "درس را انتخاب کنید" }]}
              style={{ marginBottom: 0 }}
            >
              <Select placeholder="انتخاب درس">
                {subjectOptions(subjects, {
                  field: fieldOfStudy,
                  grade: null,
                }).map((option) => (
                  <Select.Option key={option.slug} value={option.slug}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="teacher" label="معلم (اختیاری)" style={{ marginBottom: 0 }}>
                <Input placeholder="نام معلم" />
              </Form.Item>
              <Form.Item name="room" label="اتاق (اختیاری)" style={{ marginBottom: 0 }}>
                <Input placeholder="شماره اتاق" />
              </Form.Item>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {editingId ? (
                <Popconfirm
                  title="این برنامه حذف شود؟"
                  okText="حذف"
                  cancelText="انصراف"
                  onConfirm={onDelete}
                >
                  <Button
                    danger
                    loading={pending}
                    icon={<IconTrash size={16} stroke={1.6} aria-hidden="true" />}
                    data-testid={TEST_IDS.SCHEDULE_EDITOR.DELETE}
                  >
                    حذف
                  </Button>
                </Popconfirm>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={onCloseForm}>انصراف</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={pending}
                  data-testid={TEST_IDS.SCHEDULE_EDITOR.SUBMIT}
                >
                  ذخیره
                </Button>
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            ) : null}
          </Form>
        </FormSheet>
      ) : null}
    </section>
  );
}

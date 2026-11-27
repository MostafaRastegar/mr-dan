"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import type {
  SubjectRow,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import {
  useActionMutation,
  useFormAction,
  useServerFormErrors,
} from "@/utils/use-form-action";

import {
  createScheduleEntryAction,
  deleteScheduleEntryAction,
  updateScheduleEntryAction,
} from "@/app/(advising)/schedule/schedule.actions";
import {
  ScheduleEditorView,
  type ScheduleEditorFormValues,
} from "./schedule-editor.view";

interface ScheduleEditorProps {
  studentId: string;
  entries: WeeklyScheduleEntry[];
  canWrite: boolean;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

function toClockInput(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

/**
 * Weekly schedule editor for the counselor's student-detail page.
 *
 * Authoring is counselor-of-record only: every mutation goes through
 * `schedule.actions.ts`, which the use cases re-authorize server-side. The
 * read-only supervision view renders the same component with `canWrite=false`.
 */
export function ScheduleEditor({
  studentId,
  entries,
  canWrite,
  fieldOfStudy,
  subjects,
  labels,
}: ScheduleEditorProps) {
  const [editing, setEditing] = useState<WeeklyScheduleEntry | null>(null);
  const [creatingDay, setCreatingDay] = useState<number | null>(null);
  const [form] = Form.useForm<ScheduleEditorFormValues>();
  const router = useRouter();

  const create = useFormAction(createScheduleEntryAction);
  const update = useFormAction(updateScheduleEntryAction);
  const remove = useActionMutation(deleteScheduleEntryAction);

  const activeState = editing ? update.state : create.state;
  const formError = useServerFormErrors(activeState, form);
  const deleteError =
    remove.state && !remove.state.ok ? remove.state.error.message : null;

  const closeForm = useCallback(() => {
    setEditing(null);
    setCreatingDay(null);
  }, []);

  useEffect(() => {
    if (!create.state?.ok) return;
    form.resetFields();
    closeForm();
    router.refresh();
  }, [create.state, form, closeForm, router]);

  useEffect(() => {
    if (!update.state?.ok) return;
    form.resetFields();
    closeForm();
    router.refresh();
  }, [update.state, form, closeForm, router]);

  useEffect(() => {
    if (!remove.state?.ok) return;
    closeForm();
    router.refresh();
  }, [remove.state, closeForm, router]);

  const openCreate = (day: number) => {
    setEditing(null);
    setCreatingDay(day);
    form.resetFields();
    form.setFieldsValue({ dayOfWeek: day });
  };

  const openEdit = (entry: WeeklyScheduleEntry) => {
    setCreatingDay(null);
    setEditing(entry);
    form.setFieldsValue({
      dayOfWeek: entry.dayOfWeek,
      startTime: toClockInput(entry.startMinute),
      endTime: toClockInput(entry.endMinute),
      subject: entry.subject,
      teacher: entry.teacher ?? "",
      room: entry.room ?? "",
    });
  };

  const submit = (values: ScheduleEditorFormValues) => {
    if (editing) {
      update.submit({ id: editing.id, ...values });
      return;
    }
    create.submit({ studentId, ...values });
  };

  const onDelete = () => {
    if (!editing) return;
    remove.run({ id: editing.id });
  };

  return (
    <ScheduleEditorView
      entries={entries}
      canWrite={canWrite}
      labels={labels}
      fieldOfStudy={fieldOfStudy}
      subjects={subjects}
      form={form}
      editingId={editing?.id ?? null}
      isFormOpen={editing !== null || creatingDay !== null}
      pending={create.pending || update.pending || remove.pending}
      formError={formError ?? deleteError}
      onOpenCreate={openCreate}
      onOpenEdit={openEdit}
      onCloseForm={closeForm}
      onSubmit={submit}
      onDelete={onDelete}
    />
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Form } from "antd";
import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { useRouter } from "next/navigation";

import {
  addSchoolProgramEntryAction,
  deleteSchoolProgramEntryAction,
} from "../school-program.actions";
import { SchoolProgramFormView } from "./school-program-form.view";
import type { SchoolProgramEntry } from "./school-program-form.view";

interface SchoolProgramFormVMProps {
  initialEntries: SchoolProgramEntry[];
}

export function SchoolProgramForm({ initialEntries }: SchoolProgramFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [entries, setEntries] = useState<SchoolProgramEntry[]>(initialEntries);
  const [savedAt, setSavedAt] = useState<boolean | null>(null);

  const { state: addState, submit: addSubmit, pending: addPending } = useFormAction(
    addSchoolProgramEntryAction,
  );
  const formError = useServerFormErrors(addState, form);
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    if (addState?.ok) {
      setSavedAt(true);
      router.refresh();
    }
  }, [addState]);

  const handleAdd = (dayOfWeek: number, subject: string, hours: number) => {
    addSubmit({ dayOfWeek, subject, hours });
  };

  const handleDelete = (id: string) => {
    startDelete(async () => {
      const result = await deleteSchoolProgramEntryAction(id);
      if (result.ok) {
        setSavedAt(true);
        router.refresh();
      }
    });
  };

  return (
    <SchoolProgramFormView
      form={form}
      entries={entries}
      savedAt={savedAt}
      formError={formError}
      pending={addPending || deletePending}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
    />
  );
}

"use client";

import { Drawer } from "antd";
import type { ReactNode } from "react";

interface FormSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  testId?: string;
  children: ReactNode;
}

/** Shared mobile-style bottom sheet for add/edit forms. One behavior
 *  everywhere: slides up, drag handle, dismiss via handle/ESC/backdrop.
 *  On desktop it stays a bottom sheet, centered and capped. */
export function FormSheet({
  open,
  onClose,
  title,
  testId,
  children,
}: FormSheetProps): ReactNode {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      height="auto"
      title={title}
      rootClassName="form-sheet"
      styles={{
        wrapper: { maxHeight: "85dvh" },
        body: {
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          overflowY: "auto",
          overscrollBehavior: "contain",
        },
      }}
      data-testid={testId}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300"
      />
      <div className="mx-auto max-w-lg">{children}</div>
    </Drawer>
  );
}

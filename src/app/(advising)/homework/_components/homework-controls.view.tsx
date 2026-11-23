import type { ReactNode } from "react";
import { Button, Popconfirm } from "antd";
import { IconCheck, IconTrash } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";

export function HomeworkControlsView(props: {
  itemId: string;
  completed: boolean;
  isPending: boolean;
  onToggle: () => void;
  onDelete: () => void;
}): ReactNode {
  const { itemId, completed, isPending, onToggle, onDelete } = props;

  return (
    <div className="flex items-center gap-2">
      <Button
        icon={completed ? <IconCheck size={14} stroke={1.8} /> : null}
        size="small"
        onClick={onToggle}
        data-testid={`homework-toggle-${itemId}`}
      >
        {completed ? "برگردان" : "انجام شد"}
      </Button>
      <Popconfirm
        title="آیا از حذف این تکلیف مطمئن هستید؟"
        onConfirm={onDelete}
        okButtonProps={{
          loading: isPending,
        }}
        cancelText="لغو"
        okText="حذف"
      >
        <Button
          icon={<IconTrash size={14} stroke={1.6} />}
          size="small"
          danger
          data-testid={`${TEST_IDS.HOMEWORK.DELETE}-${itemId}`}
        />
      </Popconfirm>
    </div>
  );
}

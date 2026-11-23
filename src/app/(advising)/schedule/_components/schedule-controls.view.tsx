import type { ReactNode } from "react";
import { Button, Popconfirm } from "antd";
import { IconTrash } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";

export function ScheduleControlsView(props: {
  entryId: string;
  isPending: boolean;
  onDelete: () => void;
}): ReactNode {
  const { isPending, onDelete } = props;

  return (
    <Popconfirm
      title="آیا از حذف این برنامه مطمئن هستید؟"
      onConfirm={onDelete}
      okButtonProps={{
        loading: isPending,
      }}
      cancelText="لغو"
      okText="حذف"
    >
      <Button
        icon={<IconTrash size={16} stroke={1.6} />}
        size="small"
        danger
        aria-label="حذف"
        data-testid={TEST_IDS.SCHEDULE.DELETE_ENTRY}
      />
    </Popconfirm>
  );
}

// @ts-nocheck

"use client";

import { DataTable, ColumnDef } from "@/components/ui";
import { User } from "@/models/user";

export interface UserTableProps {
  items: User[];
  loading?: boolean;
  onEdit?: (item: User) => void;
  onDelete?: (item: User) => void;
  onView?: (item: User) => void;
  className?: string;
}

const columns: ColumnDef<User>[] = [
  {
    key: "username",
    label: "Username",
    sortable: true,
  },
  {
    key: "email",
    label: "Email Address",
    sortable: true,
  },
  {
    key: "firstName",
    label: "First Name",
    sortable: true,
  },
  {
    key: "lastName",
    label: "Last Name",
    sortable: true,
  },
  {
    key: "isActive",
    label: "Active Status",
    sortable: true,
    formatter: "boolean",
  },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    formatter: "datetime",
  },
];

export default function UserTable({
  items,
  loading = false,
  onEdit,
  onDelete,
  onView,
  className = "",
}: UserTableProps) {
  return (
    <DataTable
      data={items}
      columns={columns}
      searchFields={["username", "email", "firstName", "lastName"]}
      sortField="createdAt"
      sortOrder="desc"
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      loading={loading}
      className={className}
      title="Users"
    />
  );
}

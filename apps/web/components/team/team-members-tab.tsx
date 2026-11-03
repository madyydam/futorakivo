"use client";

import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteStaff,
  useDepartments,
  useStaff,
  useUpdateStaff,
  type StaffMember,
} from "@/hooks/use-staff";
import { usePay } from "@/hooks/use-hr";
import { useCurrentUser } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  Banknote,
  DollarSign,
  Edit2,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AddTeamMemberDialog } from "./add-team-member-dialog";
import { EditSalaryDialog } from "./edit-salary-dialog";
import { EditMemberDialog } from "./edit-member-dialog";

function getRoleBadgeStyle(roleLabel: string) {
  const l = roleLabel.toLowerCase();
  if (l.includes("admin") || l.includes("owner") || l.includes("manager")) {
    return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25";
  }
  if (l.includes("cashier") || l.includes("billing")) {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25";
  }
  if (
    l.includes("waiter") ||
    l.includes("captain") ||
    l.includes("service") ||
    l.includes("server")
  ) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  }
  if (l.includes("chef") || l.includes("cook") || l.includes("kitchen")) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25";
  }
  if (l.includes("delivery") || l.includes("rider")) {
    return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25";
  }
  return "bg-secondary text-secondary-foreground border-border";
}

function getAvatarGradient(name: string) {
  const gradients = [
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return gradients[charCode % gradients.length];
}

export function TeamMembersTab({ branchId }: { branchId: string | null }) {
  const { data: staff, isLoading: isStaffLoading } = useStaff();
  const { data: payList, isLoading: isPayLoading } = usePay(branchId);
  const { data: currentUser } = useCurrentUser();
  const { data: departments } = useDepartments();

  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  // Search and Filter states
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Dialog states
  const [salaryMember, setSalaryMember] = useState<{
    member: StaffMember;
    payType: "MONTHLY" | "HOURLY" | null;
    rate: number | null;
  } | null>(null);

  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  // Map pay data by userId
  const payMap = useMemo(() => {
    const map = new Map<string, { payType: "MONTHLY" | "HOURLY" | null; rate: number | null }>();
    if (payList) {
      for (const p of payList) {
        map.set(p.userId, { payType: p.payType, rate: p.rate });
      }
    }
    return map;
  }, [payList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter((m) => {
      // 1. Search filter
      const q = search.trim().toLowerCase();
      if (q) {
        const matchName = m.name.toLowerCase().includes(q);
        const matchPhone = m.phone?.toLowerCase().includes(q) ?? false;
        const matchEmail = m.email?.toLowerCase().includes(q) ?? false;
        const matchRole = m.role.label.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchRole) return false;
      }

      // 2. Department filter
      if (deptFilter !== "all") {
        if (deptFilter === "none") {
          if (m.departmentId) return false;
        } else if (m.departmentId !== deptFilter) {
          return false;
        }
      }

      // 3. Status filter
      if (statusFilter === "active" && !m.isActive) return false;
      if (statusFilter === "inactive" && m.isActive) return false;

      return true;
    });
  }, [staff, search, deptFilter, statusFilter]);

  // Executive KPI summary metrics
  const metrics = useMemo(() => {
    if (!staff) return { total: 0, active: 0, inactive: 0, monthlyPayroll: 0 };
    const total = staff.length;
    const active = staff.filter((s) => s.isActive).length;
    const inactive = total - active;

    let monthlyPayroll = 0;
    if (payList) {
      for (const p of payList) {
        if (p.payType === "MONTHLY" && p.rate) {
          monthlyPayroll += Number(p.rate);
        } else if (p.payType === "HOURLY" && p.rate) {
          // Estimate standard 160 hours / month for baseline preview
          monthlyPayroll += Number(p.rate) * 160;
        }
      }
    }

    return { total, active, inactive, monthlyPayroll };
  }, [staff, payList]);

  const onDelete = (member: StaffMember) => {
    if (
      !confirm(
        `Are you sure you want to delete ${member.name}? Their login access will be permanently revoked.`
      )
    )
      return;

    deleteStaff.mutate(member.id, {
      onSuccess: () => toast.success(`${member.name} deleted from team`),
      onError: (err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Could not delete staff member"
        ),
    });
  };

  const onToggleActive = (member: StaffMember, checked: boolean) => {
    updateStaff.mutate(
      { id: member.id, dto: { isActive: checked } },
      {
        onSuccess: () =>
          toast.success(
            `${member.name} is now ${checked ? "active" : "deactivated"}`
          ),
        onError: (err) =>
          toast.error(
            err instanceof ApiError ? err.message : "Could not update status"
          ),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Executive Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Total Team Size
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.total} Staff
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <UserCheck className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Active on Roster
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.active}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({metrics.inactive} off duty)
              </span>
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Banknote className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Monthly Salary Budget
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.monthlyPayroll)}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <UtensilsCrossed className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Stations & Roles
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {departments ? departments.length : 0} Departments
            </span>
          </div>
        </Card>
      </div>

      {/* 2. Main Staff Directory Card */}
      <Card className="flex flex-col gap-4 p-5">
        {/* Controls Bar: Search, Filters, Add Button */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff, phone, role…"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-hidden focus:border-ring"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Add Staff Button Dialog */}
          <div className="flex items-center gap-2">
            <AddTeamMemberDialog branchId={branchId} />
          </div>
        </div>

        {/* Department Quick Filter Chips */}
        {departments && departments.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              Department:
            </span>
            {[
              { id: "all", name: "All Stations" },
              ...departments,
              { id: "none", name: "No Department" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDeptFilter(d.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  deptFilter === d.id
                    ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* Staff Table */}
        {isStaffLoading || isPayLoading ? (
          <div className="flex flex-col gap-2 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-72">Staff Member</TableHead>
                  <TableHead>Role & Station</TableHead>
                  <TableHead>Compensation / Salary</TableHead>
                  <TableHead className="hidden lg:table-cell">Branch</TableHead>
                  <TableHead className="text-center w-24">Active</TableHead>
                  <TableHead className="text-right w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const pay = payMap.get(member.id);
                  const isCurrent = member.id === currentUser?.user.id;
                  const initials = member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      {/* 1. Name & Contact with Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(
                                member.name
                              )} text-xs font-bold text-white shadow-xs`}
                            >
                              {initials}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background ${
                                member.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                              }`}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground truncate">
                                {member.name}
                              </span>
                              {isCurrent && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              {member.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="size-3" />
                                  {member.phone}
                                </span>
                              )}
                              {member.email && (
                                <span className="inline-flex items-center gap-1 truncate max-w-44">
                                  <Mail className="size-3" />
                                  {member.email}
                                </span>
                              )}
                              {!member.phone && !member.email && <span>No contact info</span>}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Role Badge & Department */}
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant="outline"
                            className={`font-semibold border ${getRoleBadgeStyle(
                              member.role.label
                            )}`}
                          >
                            {member.role.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {member.department?.name ?? "No department"}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Salary & Pay Rate Column */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pay && pay.rate != null && pay.rate > 0 ? (
                            <div
                              onClick={() =>
                                setSalaryMember({
                                  member,
                                  payType: pay.payType,
                                  rate: pay.rate,
                                })
                              }
                              className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-500/60 dark:text-emerald-300"
                            >
                              <Banknote className="size-3.5" />
                              <span>
                                {formatCurrency(pay.rate)}
                                <span className="font-normal opacity-80">
                                  {" "}
                                  / {pay.payType === "MONTHLY" ? "mo" : "hr"}
                                </span>
                              </span>
                              <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setSalaryMember({
                                  member,
                                  payType: "MONTHLY",
                                  rate: 0,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            >
                              <Plus className="size-3" />
                              Set Salary
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* 4. Branch assignment */}
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {member.branches.map((b) => b.branch.name).join(", ") || "All Branches"}
                      </TableCell>

                      {/* 5. Active Status Toggle */}
                      <TableCell className="text-center">
                        <Switch
                          aria-label={`${member.name} active status`}
                          checked={member.isActive}
                          disabled={isCurrent}
                          onCheckedChange={(checked) =>
                            onToggleActive(member, checked)
                          }
                        />
                      </TableCell>

                      {/* 6. Action Menu */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                setSalaryMember({
                                  member,
                                  payType: pay?.payType ?? "MONTHLY",
                                  rate: pay?.rate ?? 0,
                                })
                              }
                            >
                              <Banknote className="size-4 mr-2 text-emerald-600" />
                              Manage Salary
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setEditingMember(member)}
                            >
                              <Edit2 className="size-4 mr-2" />
                              Edit Profile & Role
                            </DropdownMenuItem>

                            {!isCurrent && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => onDelete(member)}
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Delete Member
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Empty Search / Directory State */
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Users className="size-7" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <p className="text-base font-semibold text-foreground">
                {search || deptFilter !== "all" || statusFilter !== "all"
                  ? "No staff matching your filters"
                  : "No team members added yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {search || deptFilter !== "all" || statusFilter !== "all"
                  ? "Try clearing your search query or department filter above."
                  : "Start by onboarding your waiters, kitchen chefs, cashiers, and managers to start managing operations."}
              </p>
            </div>
            {(!search && deptFilter === "all" && statusFilter === "all") && (
              <AddTeamMemberDialog
                branchId={branchId}
                trigger={
                  <Button size="sm" className="mt-2">
                    <Plus className="size-4 mr-1.5" />
                    Add First Team Member
                  </Button>
                }
              />
            )}
          </div>
        )}
      </Card>

      {/* Salary Edit Dialog */}
      {salaryMember && (
        <EditSalaryDialog
          branchId={branchId}
          open={!!salaryMember}
          onOpenChange={(open) => !open && setSalaryMember(null)}
          member={{
            id: salaryMember.member.id,
            name: salaryMember.member.name,
            roleName: salaryMember.member.role.label,
          }}
          initialPayType={salaryMember.payType}
          initialRate={salaryMember.rate}
        />
      )}

      {/* Profile Edit Dialog */}
      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        />
      )}
    </div>
  );
}

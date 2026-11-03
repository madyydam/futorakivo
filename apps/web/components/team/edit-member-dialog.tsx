"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDepartments,
  useStaffRoles,
  useUpdateStaff,
  type StaffMember,
} from "@/hooks/use-staff";
import { ApiError } from "@/lib/api";
import { UserCheck } from "lucide-react";

interface EditMemberDialogProps {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
}: EditMemberDialogProps) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [roleId, setRoleId] = useState(member.roleId);
  const [departmentId, setDepartmentId] = useState(member.departmentId || "none");

  const { data: roles } = useStaffRoles();
  const { data: departments } = useDepartments();
  const updateStaff = useUpdateStaff();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!roleId) {
      toast.error("Please select a role");
      return;
    }

    updateStaff.mutate(
      {
        id: member.id,
        dto: {
          name: name.trim(),
          email: email.trim() ? email.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined,
          roleId,
          departmentId: departmentId === "none" ? null : departmentId,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${name}'s profile updated`);
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError ? err.message : "Could not update staff member"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <UserCheck className="size-5 text-primary" />
              Edit Team Member Profile
            </DialogTitle>
            <DialogDescription>
              Update personal info, role, and department assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-role">Role *</Label>
                <Select value={roleId} onValueChange={(v) => setRoleId(v ?? "")}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-dept">Department</Label>
                <Select
                  value={departmentId}
                  onValueChange={(v) => setDepartmentId(v ?? "none")}
                >
                  <SelectTrigger id="edit-dept">
                    <SelectValue placeholder="Department…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateStaff.isPending}>
              {updateStaff.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

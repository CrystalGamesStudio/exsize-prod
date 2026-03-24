import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getTasks,
  createTask,
  acceptTask,
  approveTask,
  rejectTask,
  completeTask,
  getFamily,
  type UserResponse,
  type TaskResponse,
} from "@/api";

interface TasksPageProps {
  user: UserResponse;
}

const statusStyles: Record<TaskResponse["status"], string> = {
  assigned: "bg-gray-100 text-gray-700",
  accepted: "bg-blue-100 text-blue-700",
  completed: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: TaskResponse["status"] }) {
  return (
    <span
      data-testid="status-badge"
      className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function TasksPage({ user }: TasksPageProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exbucks, setExbucks] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
    retry: false,
  });

  const { data: family } = useQuery({
    queryKey: ["family"],
    queryFn: getFamily,
    retry: false,
    enabled: user.role === "parent",
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setName("");
      setDescription("");
      setExbucks("");
      setAssignedTo("");
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["exbucks-balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["child-transactions"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const children = family?.members.filter((m) => m.role === "child") ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>

      {user.role === "parent" && (
        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  name,
                  description,
                  exbucks: Number(exbucks),
                  assigned_to: Number(assignedTo),
                });
              }}
            >
              <div>
                <Label htmlFor="task-name">Name</Label>
                <Input
                  id="task-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="task-description">Description</Label>
                <Input
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="task-exbucks">ExBucks</Label>
                <Input
                  id="task-exbucks"
                  type="number"
                  value={exbucks}
                  onChange={(e) => setExbucks(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="task-assign">Assign to</Label>
                <select
                  id="task-assign"
                  className="w-full rounded border p-2"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Select child</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.email}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Create Task</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{task.name}</span>
                <StatusBadge status={task.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {task.description}
                {task.description && " · "}
                {task.exbucks} ExBucks
              </p>
            </div>
            <div className="flex gap-2">
              {user.role === "parent" && task.status === "completed" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(task.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => rejectMutation.mutate(task.id)}
                  >
                    Reject
                  </Button>
                </>
              )}
              {user.role === "child" && task.status === "assigned" && (
                <Button
                  size="sm"
                  onClick={() => acceptMutation.mutate(task.id)}
                >
                  Accept
                </Button>
              )}
              {user.role === "child" && task.status === "accepted" && (
                <Button
                  size="sm"
                  onClick={() => completeMutation.mutate(task.id)}
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

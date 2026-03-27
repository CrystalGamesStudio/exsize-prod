import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  type UserResponse,
  type RewardResponse,
} from "@/api";

interface RewardsPageProps {
  user: UserResponse;
}

export default function RewardsPage({ user }: RewardsPageProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: getRewards,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setName("");
      setDescription("");
      setPrice("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description: string; price: number } }) =>
      updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  function startEdit(reward: RewardResponse) {
    setEditingId(reward.id);
    setEditName(reward.name);
    setEditDescription(reward.description);
    setEditPrice(String(reward.price));
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rewards</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({ name, description, price: Number(price) });
            }}
          >
            <div>
              <Label htmlFor="reward-name">Name</Label>
              <Input id="reward-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reward-description">Description</Label>
              <Input id="reward-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reward-price">Price</Label>
              <Input id="reward-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <Button type="submit">Create Reward</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {!rewards || rewards.length === 0 ? (
            <p className="text-muted-foreground">No rewards yet.</p>
          ) : (
            <div className="space-y-2">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  {editingId === reward.id ? (
                    <>
                      <div className="flex flex-1 gap-2">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      </div>
                      <div className="ml-2 flex gap-1">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              id: reward.id,
                              data: { name: editName, description: editDescription, price: Number(editPrice) },
                            })
                          }
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">{reward.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {reward.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reward.price}</span>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(reward)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(reward.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRewards,
  getBalance,
  getPurchases,
  purchaseReward,
  getFamily,
  getChildPurchases,
  type UserResponse,
  type PurchaseResponse,
} from "@/api";

interface ShopPageProps {
  user: UserResponse;
}

function PurchaseList({ purchases }: { purchases: PurchaseResponse[] }) {
  return (
    <div className="space-y-2">
      {purchases.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded border p-3">
          <span className="font-medium">{p.reward_name}</span>
          <div className="flex items-center gap-4">
            <span className="font-semibold">{p.price} ExBucks</span>
            <span className="text-sm text-muted-foreground">
              {new Date(p.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopPage({ user }: ShopPageProps) {
  const queryClient = useQueryClient();
  const isChild = user.role === "child";
  const isParent = user.role === "parent";
  const [selectedChildId, setSelectedChildId] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: getRewards,
    retry: false,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["exbucks-balance"],
    queryFn: getBalance,
    retry: false,
    enabled: isChild,
  });

  const { data: purchases } = useQuery({
    queryKey: ["purchases"],
    queryFn: getPurchases,
    retry: false,
    enabled: isChild,
  });

  const { data: family } = useQuery({
    queryKey: ["family"],
    queryFn: getFamily,
    retry: false,
    enabled: isParent,
  });

  const { data: childPurchases } = useQuery({
    queryKey: ["child-purchases", selectedChildId],
    queryFn: () => getChildPurchases(Number(selectedChildId)),
    retry: false,
    enabled: isParent && selectedChildId !== "",
  });

  const purchaseMutation = useMutation({
    mutationFn: purchaseReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exbucks-balance"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setPurchaseError("");
    },
    onError: (error: Error) => {
      setPurchaseError(error.message);
    },
  });

  const balance = balanceData?.balance ?? 0;
  const children = family?.members.filter((m) => m.role === "child") ?? [];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shop</h1>

      {isChild && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Reward Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseError && (
                <p className="mb-4 text-sm text-red-600">{purchaseError}</p>
              )}
              {!rewards || rewards.length === 0 ? (
                <p className="text-muted-foreground">No rewards available.</p>
              ) : (
                <div className="space-y-2">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <span className="font-medium">{reward.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {reward.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reward.price} ExBucks</span>
                        <Button
                          size="sm"
                          disabled={balance < reward.price}
                          onClick={() => purchaseMutation.mutate(reward.id)}
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {!purchases || purchases.length === 0 ? (
                <p className="text-muted-foreground">No purchases yet.</p>
              ) : (
                <PurchaseList purchases={purchases} />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isParent && (
        <Card>
          <CardHeader>
            <CardTitle>Children's Purchases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="child-purchase-select" className="text-sm font-medium">
                Select Child
              </label>
              <select
                id="child-purchase-select"
                className="w-full rounded border p-2"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                <option value="">Select child</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.email}
                  </option>
                ))}
              </select>
            </div>
            {childPurchases && (
              childPurchases.length === 0 ? (
                <p className="text-muted-foreground">No purchases yet.</p>
              ) : (
                <PurchaseList purchases={childPurchases} />
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

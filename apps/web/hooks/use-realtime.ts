"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { REALTIME_EVENTS, realtimeInvalidations } from "@/lib/realtime-keys";
import { setRealtimeState } from "@/lib/realtime-status";
import { resolveWsUrl } from "@/lib/ws-url";
import { DEMO_MODE } from "@/lib/demo-mode";

export function useRealtime(branchId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!branchId) return;

    if (DEMO_MODE) {
      setRealtimeState("live");
      return;
    }

    const socket = io(resolveWsUrl(), { query: { branchId }, withCredentials: true });
    let wasDown = false;

    socket.on("connect", () => {
      setRealtimeState("live");
      if (wasDown) {
        wasDown = false;
        void queryClient.invalidateQueries();
      }
    });
    const down = () => {
      wasDown = true;
      setRealtimeState("offline");
    };
    socket.on("disconnect", down);
    socket.on("connect_error", down);

    for (const event of REALTIME_EVENTS) {
      socket.on(event, () => {
        realtimeInvalidations(event, branchId).forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        );
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [branchId, queryClient]);
}

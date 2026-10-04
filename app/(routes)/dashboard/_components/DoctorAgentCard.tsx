"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

export type doctorAgent = {
  id: number;
  specialist: string;
  description: string;
  image: string;
  agentPrompt: string;
  voiceId?: string;
  subscriptionRequired: boolean;
};
type props = {
  doctorAgent: doctorAgent;
};

function DoctorAgentCard({ doctorAgent }: props) {
  const [startingSession, setStartingSession] = useState(false);
  const router = useRouter();
  const { has } = useAuth();
  //@ts-ignore
  const paidUser = has && has({ plan: "pro" });
  console.log("Paid User:", paidUser);

  const onStartConsultation = async () => {
    if (!doctorAgent) {
      console.warn("⚠️ No doctor selected");
      return;
    }

    console.log("➡️ Starting session");
    console.log("👨‍⚕️ Selected doctor:", doctorAgent);

    try {
      setStartingSession(true);

      const res = await axios.post("/api/session-chat", {
        note: "New Consultation",
        selectedDoctor: doctorAgent,
      });

      console.log("✅ Session API response:", res.data);

      if (res.data?.sessionId) {
        console.log("🎉 Session created:", res.data.sessionId);
        router.push("/dashboard/medical-agent/" + res.data.sessionId);
      }
    } catch (err) {
      console.error("❌ Failed to start session:", err);
    } finally {
      setStartingSession(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative h-40 w-full overflow-hidden rounded-xl">
        {doctorAgent.subscriptionRequired && (
          <Badge className="absolute top-2 right-2 z-10">Premium</Badge>
        )}

        <Image
          src={doctorAgent.image}
          alt={doctorAgent.specialist}
          fill
          className="object-cover"
        />
      </div>

      <h2 className="mt-3 text-base font-semibold">{doctorAgent.specialist}</h2>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
        {doctorAgent.description}
      </p>
      <Button
        className="mt-3 h-10 w-full rounded-xl bg-slate-950 text-xs hover:bg-cyan-700 dark:bg-white dark:text-slate-950"
        onClick={onStartConsultation}
        disabled={!paidUser && doctorAgent.subscriptionRequired}
      >
        {" "}
        Start Consultation{" "}
        {startingSession ? (
          <Loader2Icon className="ml-2 animate-spin" />
        ) : (
          <IconArrowRight />
        )}
      </Button>
    </div>
  );
}

export default DoctorAgentCard;

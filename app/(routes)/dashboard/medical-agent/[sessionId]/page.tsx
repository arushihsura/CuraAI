"use client";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { doctorAgent } from "../../_components/DoctorAgentCard";
import { Circle, Loader, PhoneCall, PhoneOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

export type SessionDetail = {
  id: number;
  note: string;
  sessionId: string;
  report: Record<string, any>;
  selectedDoctor: doctorAgent;
  createdOn: string;
};
type message = {
  role: string;
  text: string;
};

function MedicalVoiceAgent() {
  const { sessionId } = useParams();
  console.log("params:", sessionId);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail>();
  const [callStarted, setCallStarted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>();
  const [currentRole, setCurrentRole] = useState<string | null>();
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [messages, setMessages] = useState<Array<message>>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const messagesRef = useRef<Array<message>>([]);
  const liveTranscriptRef = useRef<{ role: string | null; text: string }>({
    role: null,
    text: "",
  });
  const reportGenerationStartedRef = useRef(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  useEffect(() => {
    sessionId && GetSessionDetails();
  }, [sessionId]);

  useEffect(() => {
    if (!callStarted) return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callStarted]);

  const GetSessionDetails = async () => {
    const result = await axios.get("/api/session-chat?sessionId=" + sessionId);
    console.log(result.data);
    setSessionDetail(result.data);
  };

  const GenerateReport = async (conversation: Array<message>) => {
    const result = await axios.post("/api/medical-report", {
      messages: conversation,
      sessionDetail: sessionDetail,
      sessionId: Array.isArray(sessionId) ? sessionId[0] : sessionId,
    });
    console.log("Report generation result:", result.data);
    return result.data;
  };

  const generateReportAfterDisconnect = async () => {
    if (reportGenerationStartedRef.current) return;
    reportGenerationStartedRef.current = true;
    setLoading(true);

    try {
      // Allow Vapi to deliver any final transcript event after call-end.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalMessages = [...messagesRef.current];
      const pendingTranscript = liveTranscriptRef.current;
      if (pendingTranscript.text.trim()) {
        finalMessages.push({
          role: pendingTranscript.role || "user",
          text: pendingTranscript.text,
        });
      }

      console.log("Generating report from final transcript:", finalMessages);
      await GenerateReport(finalMessages);
      setCallStarted(false);
      setVapiInstance(null);
      setLiveTranscript("");
      toast.success("Call ended and report generated successfully!");
      router.replace("/dashboard");
    } catch (err) {
      console.error("Error generating report after call ended:", err);
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.details ||
            err.response?.data?.error ||
            "The report could not be generated.",
        );
      } else {
        toast.error("The report could not be generated.");
      }
      reportGenerationStartedRef.current = false;
      setElapsedSeconds(0);
    } finally {
      setLoading(false);
    }
  };

  const StartCall = () => {
    console.log(location.protocol)
    reportGenerationStartedRef.current = false;
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi);

    const doctorPrompt = sessionDetail?.selectedDoctor?.agentPrompt || "You are a helpful medical AI assistant.";
    const medicalConstraint = 
      "\n\nCRITICAL DIRECTIVE: You are a specialized medical AI assistant. You must ONLY answer questions, discuss topics, or provide advice related to your specific medical specialty. " +
      "If the user asks about ANY unrelated, general, or non-medical topics (such as general knowledge, science, space, history, mathematics, unrelated technology, sports, entertainment, or questions like 'how many moons does Jupiter have'), you must politely refuse to answer. " +
      "State clearly and concisely that you are a specialized medical assistant and can only help with questions related to your medical domain. Keep your responses short, professional, and conversational.";

    const assistantOverrides = {
      model: {
        provider: "openai" as const,
        model: "gpt-4o-mini" as const,
        systemPrompt: `${doctorPrompt}${medicalConstraint}`,
      },
    };
    //@ts-ignore

    vapi.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID, assistantOverrides);
    vapi.on("call-start", () => {
      console.log("Call started");
      setCallStarted(true);
    });
    vapi.on("call-end", () => {
      setCallStarted(false);
      console.log("Call ended");
      void generateReportAfterDisconnect();
    });
    vapi.on("message", (message) => {
      const { role, transcriptType, transcript } = message;
      if (message.type === "transcript") {
        console.log(`${message.role}: ${message.transcript}`);
        if (transcriptType === "partial") {
          setLiveTranscript(transcript);
          setCurrentRole(role);
          liveTranscriptRef.current = { role, text: transcript };
        } else if (transcriptType === "final") {
          const nextMessage = { role, text: transcript };
          messagesRef.current = [...messagesRef.current, nextMessage];
          setMessages(messagesRef.current);
          setLiveTranscript("");
          setCurrentRole(null);
          liveTranscriptRef.current = { role: null, text: "" };
        }
      }
    });
    vapi.on("speech-start", () => {
      console.log("Assistant started speaking");
      setCurrentRole("assistant");
    });
    vapi.on("speech-end", () => {
      console.log("Assistant stopped speaking");
      setCurrentRole("user");
    });
  };
  const endCall = async () => {
  if (!vapiInstance) return;

  try {
    console.log("🛑 End call triggered");

    // The call-end listener generates the report after Vapi flushes its final transcript.
    vapiInstance.stop();
    await generateReportAfterDisconnect();
  } catch (err) {
    console.error("❌ Error ending call:", err);
    if (axios.isAxiosError(err)) {
      console.error("Report API error:", err.response?.data);
      toast.error(
        err.response?.data?.details ||
          err.response?.data?.error ||
          "The report could not be generated."
      );
    } else {
      toast.error("The report could not be generated.");
    }
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="mx-auto max-w-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
        <h2 className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {" "}
          <Circle
            className={`h-4 w-4 rounded-full ${
              callStarted ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {callStarted ? "Connected..." : "Not Connected"}
        </h2>
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}
        </h2>
      </div>
      {sessionDetail && (
        <div className="flex items-center flex-col mt-10">
          <Image
            src={sessionDetail?.selectedDoctor?.image}
            alt={sessionDetail?.selectedDoctor?.specialist ?? ""}
            width={80}
            height={80}
            className="h-[100px] w-[100px] object-cover rounded-full"
          />
          <h2 className="mt-3 text-xl font-semibold">
            {sessionDetail?.selectedDoctor?.specialist}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-full ${callStarted ? "bg-green-500" : "bg-slate-300"}`} />
            {callStarted ? "Consultation in progress" : "Ready to begin"}
          </p>

          <div className="mt-10 h-72 w-full overflow-y-auto border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            {messages?.slice(-4).map((msg: message, index) => (
              <h2 key={index} className="border-b border-slate-200/70 p-3 text-sm text-slate-600 last:border-0 dark:border-slate-800 dark:text-slate-300">
                {msg.role}:{msg.text}
              </h2>
            ))}
            {liveTranscript && liveTranscript?.length > 0 && (
              <h2 className="mt-3 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
                {currentRole}:{liveTranscript}
              </h2>
            )}
          </div>

          {!callStarted ? (
            <Button className="mt-8 h-12 rounded-xl bg-slate-950 px-6 hover:bg-cyan-700 dark:bg-white dark:text-slate-950" onClick={StartCall} disabled={loading}>
              {loading? <Loader className="animate-spin mr-2 h-4 w-4"/>: <PhoneCall />}
               Start Call
            </Button>
          ) : (
            <Button variant={"destructive"} onClick={endCall} disabled={loading} className="mt-8 h-12 rounded-xl px-6">
              {loading? <Loader className="animate-spin mr-2 h-4 w-4"/>: <PhoneOff />}
              Disconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;

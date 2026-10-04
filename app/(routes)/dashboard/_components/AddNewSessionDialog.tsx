"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogClose } from "@radix-ui/react-dialog";
import { ArrowRight, Loader2 } from "lucide-react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import axios from "axios";
import { doctorAgent } from "./DoctorAgentCard";
import SuggestedDoctorCard from "./SuggestedDoctorCard";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SessionDetail } from "../medical-agent/[sessionId]/page";
import { toast } from "sonner";

type Step = "symptoms" | "doctors" | "emergency";
type TriageResult = {
  urgency: "EMERGENCY" | "URGENT" | "ROUTINE";
  specialty: string;
  reason: string;
  should_book: boolean;
  red_flags: string[];
};

export default function AddNewSessionDialog() {
  // ---------------- STATE ----------------
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const [fetchingDoctors, setFetchingDoctors] = useState(false);
  const [checkingSymptoms, setCheckingSymptoms] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  const [suggestedDoctors, setSuggestedDoctors] = useState<doctorAgent[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const [step, setStep] = useState<Step>("symptoms");

  const [historyList, setHistoryList] = useState<SessionDetail[]>([]);

  const router = useRouter();
  const { has } = useAuth();
  // @ts-ignore
  const paidUser = has && has({ plan: "pro" });

  // ---------------- HISTORY ----------------
  useEffect(() => {
    GetHistoryList();
  }, []);

  const GetHistoryList = async () => {
    const result = await axios.get("/api/session-chat?sessionId=all");
    setHistoryList(result.data);
  };

  // ---------------- RESET ----------------
  const resetDialog = () => {
    setNote("");
    setSuggestedDoctors([]);
    setSelectedDoctor(null);
    setTriageResult(null);
    setStep("symptoms");
  };

  // ---------------- FETCH DOCTORS ----------------
  const onClickNext = async () => {
    if (!note.trim()) return;

    try {
      setCheckingSymptoms(true);

      const triage = await axios.post<TriageResult>("/api/triage", {
        symptoms: note,
      });

      setTriageResult(triage.data);
      if (triage.data.urgency === "EMERGENCY") {
        setStep("emergency");
        return;
      }

      setFetchingDoctors(true);

      const res = await axios.post("/api/suggest-doctors", {
        notes: note,
      });

      const doctors = Array.isArray(res.data?.suggestedDoctors)
        ? res.data.suggestedDoctors
        : [];

      setSuggestedDoctors(doctors);
      setStep("doctors"); // ✅ explicit step change
    } catch (err) {
      console.error("Failed to triage symptoms or fetch doctors:", err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;
      toast.error(message || "We could not assess your symptoms. Please try again.");
    } finally {
      setCheckingSymptoms(false);
      setFetchingDoctors(false);
    }
  };

  // ---------------- START SESSION ----------------
  const onStartConsultation = async () => {
    if (!selectedDoctor) return;

    try {
      setStartingSession(true);

      const res = await axios.post("/api/session-chat", {
        note,
        selectedDoctor,
      });

      if (res.data?.sessionId) {
        router.push("/dashboard/medical-agent/" + res.data.sessionId);
      }
    } catch (err) {
      console.error("❌ Failed to start session:", err);
    } finally {
      setStartingSession(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="mt-3"
          disabled={!paidUser && historyList?.length >= 1}
        >
          + Book a Consultation
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Basic Details</DialogTitle>
          <DialogDescription>
            Describe your symptoms or choose a doctor
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {step === "symptoms" ? (
            <>
              <h2 className="font-semibold">Add Symptoms</h2>
              <Textarea
                className="mt-2 h-[200px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe your symptoms clearly..."
              />
            </>
          ) : step === "emergency" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-950 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-red-900 dark:text-red-200">
                    Immediate medical attention may be needed
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
                    {triageResult?.reason || "Your symptoms may require urgent evaluation by a medical professional."}
                  </p>
                </div>
              </div>
              {triageResult?.red_flags.length ? (
                <div className="mt-4 border-t border-red-200 pt-4 dark:border-red-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                    Concerning symptoms detected
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-800 dark:text-red-300">
                    {triageResult.red_flags.map((flag) => (
                      <li key={flag} className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-4 text-sm font-medium text-red-900 dark:text-red-200">
                Contact local emergency services or go to the nearest emergency department. Do not use an AI consultation for emergencies.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-3 font-semibold">Select the Doctor</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {suggestedDoctors.map((doctor) => (
                  <SuggestedDoctorCard
                    key={doctor.id}
                    doctorAgent={doctor}
                    isSelected={selectedDoctor?.id === doctor.id}
                    onSelect={setSelectedDoctor}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          {step === "symptoms" ? (
            <Button
              disabled={!note.trim() || fetchingDoctors || checkingSymptoms}
              onClick={onClickNext}
            >
              Next
              {fetchingDoctors || checkingSymptoms ? (
                <Loader2 className="ml-2 animate-spin" />
              ) : (
                <ArrowRight className="ml-2" />
              )}
            </Button>
          ) : step === "doctors" ? (
            <Button
              disabled={!selectedDoctor || startingSession}
              onClick={onStartConsultation}
            >
              Start Consultation
              {startingSession ? (
                <Loader2 className="ml-2 animate-spin" />
              ) : (
                <ArrowRight className="ml-2" />
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

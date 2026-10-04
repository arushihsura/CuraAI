import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { SessionDetail } from "../medical-agent/[sessionId]/page";

type Props = {
  record: SessionDetail;
};

function ViewReportDialog({ record }: Props) {
  const report = record.report;

  // 🔒 HARD NORMALIZATION (prevents all map() crashes)
  const symptoms: string[] = Array.isArray(report?.symptoms)
    ? report.symptoms
    : [];

  const medications: string[] = Array.isArray(report?.medicationsMentioned)
    ? report.medicationsMentioned
    : [];

  const recommendations: string[] = Array.isArray(report?.recommendations)
    ? report.recommendations
    : [];
  const carePlan: string[] = Array.isArray(report?.carePlan)
    ? report.carePlan
    : [];
  const followUp =
    report?.followUp && typeof report.followUp === "object"
      ? report.followUp as {
          recommended?: boolean;
          days?: number;
          reason?: string;
        }
      : null;

  if (!report) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm">
          View Report
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-slate-950 dark:text-white">
              CuraAi consultation report
          </DialogTitle>
          <DialogDescription className="text-center">
            Review the informational summary from this consultation.
          </DialogDescription>
        </DialogHeader>

        {/* Session Info */}
        <Section title="Session Info">
          <TwoCol
            left={`Doctor: ${record.selectedDoctor?.specialist}`}
            right={`User: ${report.user || "Anonymous"}`}
          />
          <TwoCol
            left={`Consulted On: ${moment(new Date(record.createdOn)).format(
              "MMMM Do YYYY, h:mm a"
            )}`}
            right={`Agent: ${report.agent}`}
          />
        </Section>

        {/* Chief Complaint */}
        <Section title="Chief Complaint">
          <p>{report.chiefComplaint || "Not specified."}</p>
        </Section>

        {/* Summary */}
        <Section title="Summary">
          <p>{report.summary}</p>
        </Section>

        {/* Symptoms */}
        <Section title="Symptoms">
          {symptoms.length > 0 ? (
            <ul className="list-disc pl-5">
              {symptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p>No symptoms recorded.</p>
          )}
        </Section>

        {/* Duration & Severity */}
        <Section title="Duration & Severity">
          <TwoCol
            left={`Duration: ${report.duration || "N/A"}`}
            right={`Severity: ${report.severity || "N/A"}`}
          />
        </Section>

        {/* Medications */}
        <Section title="Medications Mentioned">
          {medications.length > 0 ? (
            <ul className="list-disc pl-5">
              {medications.map((med, i) => (
                <li key={i}>{med}</li>
              ))}
            </ul>
          ) : (
            <p>No medications mentioned.</p>
          )}
        </Section>

        {/* Recommendations */}
        <Section title="Recommendations">
          {recommendations.length > 0 ? (
            <ul className="list-disc pl-5">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          ) : (
            <p>No recommendations provided.</p>
          )}
        </Section>

        <Section title="Care Plan">
          {carePlan.length > 0 ? (
            <ul className="space-y-2">
              {carePlan.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          ) : (
            <p>No care plan was generated.</p>
          )}
        </Section>

        <Section title="Follow-up">
          {followUp?.recommended ? (
            <div>
              <p className="font-medium">
                Recommended in {followUp.days || "a few"} day
                {followUp.days === 1 ? "" : "s"}.
              </p>
              <p className="mt-1">{followUp.reason || "Continue monitoring your symptoms."}</p>
            </div>
          ) : (
            <p>No follow-up was recommended.</p>
          )}
        </Section>

        {/* Footer Disclaimer */}
        <p className="mt-4 text-xs text-center text-gray-400">
          This report was generated by an AI Medical Assistant for informational
          purposes only.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default ViewReportDialog;

/* ----------------- Helpers ----------------- */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
    <h3 className="mb-2 border-b border-slate-200 pb-2 font-semibold text-cyan-700 dark:border-slate-700 dark:text-cyan-300">
      {title}
    </h3>
    <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div>
  </div>
);

const TwoCol = ({ left, right }: { left: string; right: string }) => (
  <div className="grid grid-cols-2 gap-4 text-sm">
    <p>{left}</p>
    <p>{right}</p>
  </div>
);

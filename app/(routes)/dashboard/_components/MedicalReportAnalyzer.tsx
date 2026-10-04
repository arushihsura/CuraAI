"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { ChangeEvent, useState } from "react";
import axios from "axios";

type Analysis = {
  documentType: string;
  summary: string;
  results: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: "LOW" | "NORMAL" | "HIGH" | "UNKNOWN";
  }>;
  whatThisMayMean: string[];
  questionsForDoctor: string[];
  disclaimer: string;
};

const statusStyles = {
  LOW: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  NORMAL: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  HIGH: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  UNKNOWN: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function MedicalReportAnalyzer() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const analyzeFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please upload a file smaller than 8 MB.");
      return;
    }
    if (!["text/plain", "text/csv", "application/json", "image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Upload a JPG, PNG, TXT, CSV, or JSON medical report.");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setAnalysis(null);

    try {
      const content = file.type.startsWith("image/")
        ? await readAsDataUrl(file)
        : await file.text();
      const response = await axios.post<Analysis>("/api/documents/analyze", {
        fileName: file.name,
        mimeType: file.type,
        content,
      });
      setAnalysis(response.data);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      toast.error(message || "The report could not be analyzed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
        Medical documents
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
        Understand your report
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        Upload a lab report and get a clear, patient-friendly explanation of the values shown. CuraAi does not diagnose or replace a licensed professional.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <label className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-300 bg-white p-8 text-center shadow-sm transition hover:border-cyan-500 hover:bg-cyan-50/40 focus-within:ring-2 focus-within:ring-[#087ea4] focus-within:ring-offset-2 dark:border-cyan-900 dark:bg-slate-900 dark:hover:bg-cyan-950/20">
          <input
            type="file"
            accept=".txt,.csv,.json,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={analyzeFile}
            disabled={loading}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </div>
          <h2 className="mt-5 text-lg font-semibold">{loading ? "Analyzing report..." : "Upload a medical report"}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose a JPG, PNG, TXT, CSV, or JSON file
          </p>
          <Button type="button" variant="outline" className="mt-6 rounded-lg" disabled={loading}>
            Choose file
          </Button>
          {fileName && !loading ? <p className="mt-4 text-xs text-cyan-700 dark:text-cyan-300">{fileName}</p> : null}
        </label>

        {analysis ? <AnalysisResult analysis={analysis} /> : (
          <div className="flex min-h-80 flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
            <FileSearch className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-5 text-xl font-semibold">Your explanation will appear here</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              We’ll highlight reported values, reference ranges, helpful context, and questions to discuss with your clinician.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisResult({ analysis }: { analysis: Analysis }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">{analysis.documentType}</p>
          <h2 className="mt-1 text-xl font-semibold">Report overview</h2>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{analysis.summary}</p>

      {analysis.results.length ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          {analysis.results.map((result) => (
            <div key={`${result.name}-${result.value}`} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center dark:border-slate-800">
              <div>
                <p className="text-sm font-medium">{result.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reference: {result.referenceRange || "Not provided"}</p>
              </div>
              <p className="text-sm font-semibold">{result.value} {result.unit}</p>
              <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[result.status]}`}>{result.status}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoList title="What this may mean" items={analysis.whatThisMayMean} icon={<CheckCircle2 className="h-4 w-4" />} />
        <InfoList title="Questions for your doctor" items={analysis.questionsForDoctor} icon={<AlertCircle className="h-4 w-4" />} />
      </div>
      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400 dark:border-slate-800">{analysis.disclaimer}</p>
    </div>
  );
}

function InfoList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <h3 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
        {items.length ? items.map((item) => <li key={item}>• {item}</li>) : <li>No additional notes.</li>}
      </ul>
    </div>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the image."));
    reader.readAsDataURL(file);
  });
}

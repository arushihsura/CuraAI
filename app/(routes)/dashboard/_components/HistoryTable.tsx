import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SessionDetail } from "../medical-agent/[sessionId]/page";
import { Button } from "@/components/ui/button";
import moment from "moment";
import ViewReportDialog from "./ViewReportDialog";
type Props = {
    historyList:SessionDetail[]
};

function HistoryTable({ historyList }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Table className="min-w-[640px]">
        <TableCaption className="pb-4 text-slate-500">Previous consultation reports</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead >AI Medical Specialist</TableHead>
            <TableHead >Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {historyList.map((record:SessionDetail,index:number) => (
            <TableRow key={record.id ?? `${record.sessionId}-${index}`}>
              <TableCell className="font-medium">{record.selectedDoctor.specialist}</TableCell>
              <TableCell>{record.note}</TableCell>
              <TableCell>{formatRelativeDate(record.createdOn)}</TableCell>
              <TableCell className="text-right">
                 <ViewReportDialog record={record}/>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return moment(date).fromNow();
}

export default HistoryTable;

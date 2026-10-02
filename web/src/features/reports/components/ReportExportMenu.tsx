import { useRef, useState } from "react";
import JSZip from "jszip";
import {
  ChevronDown,
  Download,
  FileArchive,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  buildCsv,
  downloadBlob,
  downloadCsvFile,
  todayFileKey,
  type CsvRow,
} from "../utils/csv-export";

type ReportExportMenuProps = {
  overviewRows: CsvRow[];
  nutritionRows: CsvRow[] | null;
  competencyRows: CsvRow[] | null;
  overviewScope: string;
  nutritionScope: string;
  competencyScope: string;
  hasOverviewData: boolean;
  refreshing: boolean;
  onRefreshAll: () => void;
  onPrint: () => void;
};

const safeFilePart = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "latest";

export function ReportExportMenu({
  overviewRows,
  nutritionRows,
  competencyRows,
  overviewScope,
  nutritionScope,
  competencyScope,
  hasOverviewData,
  refreshing,
  onRefreshAll,
  onPrint,
}: ReportExportMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [isZipping, setIsZipping] = useState(false);
  const dateKey = todayFileKey();

  const closeMenu = () => menuRef.current?.removeAttribute("open");
  const downloadOverview = () => {
    downloadCsvFile(
      `smartkidcare-overview-${safeFilePart(overviewScope)}-${dateKey}.csv`,
      overviewRows,
    );
    closeMenu();
  };
  const downloadNutrition = () => {
    if (!nutritionRows) return;
    downloadCsvFile(
      `smartkidcare-nutrition-${safeFilePart(nutritionScope)}-${dateKey}.csv`,
      nutritionRows,
    );
    closeMenu();
  };
  const downloadCompetency = () => {
    if (!competencyRows) return;
    downloadCsvFile(
      `smartkidcare-competency-${safeFilePart(competencyScope)}-${dateKey}.csv`,
      competencyRows,
    );
    closeMenu();
  };

  const downloadAll = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      if (hasOverviewData) {
        zip.file(
          `overview-${safeFilePart(overviewScope)}.csv`,
          buildCsv(overviewRows),
        );
      }
      if (nutritionRows) {
        zip.file(
          `health-nutrition-${safeFilePart(nutritionScope)}.csv`,
          buildCsv(nutritionRows),
        );
      }
      if (competencyRows) {
        zip.file(
          `academic-competency-${safeFilePart(competencyScope)}.csv`,
          buildCsv(competencyRows),
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(`smartkidcare-analytics-${dateKey}.zip`, blob);
      closeMenu();
    } finally {
      setIsZipping(false);
    }
  };

  const hasAnyData =
    hasOverviewData || Boolean(nutritionRows) || Boolean(competencyRows);

  return (
    <div className="grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:w-auto sm:flex sm:flex-wrap sm:items-center">
      <Button
        size="md"
        onClick={onRefreshAll}
        disabled={refreshing}
        icon={
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        }
      >
        {refreshing ? "Refreshing..." : "Refresh All"}
      </Button>

      <details ref={menuRef} className="relative">
        <summary className="inline-flex min-h-11 w-full cursor-pointer list-none items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto">
          <Download className="h-4 w-4" />
          Export Report
          <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Download CSV
          </p>
          <MenuButton onClick={downloadOverview} disabled={!hasOverviewData}>
            Overview
          </MenuButton>
          <MenuButton onClick={downloadNutrition} disabled={!nutritionRows}>
            Health & Nutrition
          </MenuButton>
          <MenuButton onClick={downloadCompetency} disabled={!competencyRows}>
            Academic Competency
          </MenuButton>
          <MenuButton
            onClick={() => void downloadAll()}
            disabled={!hasAnyData || isZipping}
          >
            <FileArchive className="h-4 w-4" />
            {isZipping ? "Preparing ZIP..." : "All CSV files (.zip)"}
          </MenuButton>
          <div className="my-2 border-t border-gray-100 dark:border-slate-800" />
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Print
          </p>
          <MenuButton
            onClick={() => {
              closeMenu();
              onPrint();
            }}
            disabled={!hasAnyData}
          >
            <Printer className="h-4 w-4" />
            Full Analytics Report
          </MenuButton>
        </div>
      </details>
    </div>
  );
}

function MenuButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-teal-900/30 dark:hover:text-teal-300"
    >
      {children}
    </button>
  );
}

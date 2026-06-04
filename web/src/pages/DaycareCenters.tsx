import { useEffect, useMemo, useState } from "react";
import { Search, Building2, CheckCircle, XCircle, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import {
  getDaycareCenters,
  type DaycareCenter,
} from "@/api/daycare-center.api";

export default function DaycareCenters() {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<DaycareCenter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadCenters = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getDaycareCenters();
        setCenters(result);
      } catch (loadError: any) {
        setError(loadError?.message || "Failed to load centers.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCenters();
  }, []);

  const filteredCenters = useMemo(() => {
    let result = centers;

    // Apply status filter
    if (statusFilter !== "all") {
      const targetStatus = statusFilter === "active";
      result = result.filter((c) => (c.isActive !== false) === targetStatus);
    }

    // Apply search query
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((center) => {
        const name = center.name.toLowerCase();
        const barangay = center.barangay.toLowerCase();
        const code = center.code.toLowerCase();
        return (
          name.includes(query) ||
          barangay.includes(query) ||
          code.includes(query)
        );
      });
    }

    return result;
  }, [centers, search, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
  const paginatedCenters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCenters.slice(start, start + itemsPerPage);
  }, [filteredCenters, currentPage]);

  const activeCount = centers.filter((center) => center.isActive !== false).length;
  const inactiveCount = centers.length - activeCount;

  return (
    <Layout
      activeItem="centers"
      breadcrumbs={["Admin", "Child Development Centers"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
              Child Development Centers
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Manage the Dagupan City barangay center list used for teacher assignments.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Centers"
            value={centers.length}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Active Centers"
            value={activeCount}
            icon={CheckCircle}
            color="teal"
          />
          <StatCard
            title="Inactive Centers"
            value={inactiveCount}
            icon={XCircle}
            color="rose"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-teal-50 p-2 dark:bg-teal-500/10">
                <Filter size={18} className="text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Dagupan Centers
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative group w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-teal-600 dark:text-slate-500 dark:group-focus-within:text-teal-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by center or barangay..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-all hover:bg-gray-50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <p className="flex items-center gap-2">
                <XCircle size={16} />
                {error}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Center Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Barangay
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Identification
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                      Loading centers...
                    </td>
                  </tr>
                ) : paginatedCenters.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                      No centers match your search.
                    </td>
                  </tr>
                ) : (
                  paginatedCenters.map((center) => (
                    <tr 
                      key={center._id} 
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {center.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {center.address || "Dagupan City, Pangasinan"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {center.barangay}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        <code className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {center.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            center.isActive !== false
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                          }`}
                        >
                          {center.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-slate-700">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
              <span>
                {filteredCenters.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCenters.length)} of {filteredCenters.length}
              </span>
              <select
                value={itemsPerPage}
                onChange={(event) => {
                  setCurrentPage(1);
                  setItemsPerPage(Number(event.target.value));
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={isLoading || currentPage <= 1 || totalPages === 0}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Page {totalPages === 0 ? 0 : currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    totalPages > 0 ? Math.min(totalPages, prev + 1) : prev,
                  )
                }
                disabled={isLoading || totalPages === 0 || currentPage >= totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: number;
  icon: any;
  color?: "blue" | "teal" | "rose";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100">{value}</p>
          </div>
        </div>
        <div className={`rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

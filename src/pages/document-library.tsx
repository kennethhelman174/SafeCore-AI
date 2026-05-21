import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Search, Info } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { toast } from "sonner";

interface Document {
  id: string;
  docNumber: string;
  title: string;
  type: { name: string };
  category: { name: string };
  department: { name: string };
  status: { name: string };
  riskLevel: string;
  sifPotential: boolean;
  version: string;
  updatedAt: string;
  author: {
    name: string;
  };
}

export function DocumentLibrary() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [masterData, setMasterData] = useState<any>(null);
  const [search, setSearch] = useState(initialSearch);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    typeId: "all",
    categoryId: "all",
    departmentId: "all",
    statusId: "all",
    riskLevel: "all"
  });

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeStatusId = filters.statusId;
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        typeId: filters.typeId,
        categoryId: filters.categoryId,
        departmentId: filters.departmentId,
        statusId: activeStatusId,
        riskLevel: filters.riskLevel
      });

      let data = await apiRequest(`/api/documents?${params.toString()}`);
      let docsList = data?.data || [];
      let totalCount = data?.meta?.total || 0;
      let totalPagesCount = data?.meta?.totalPages || 1;

      // Fallback: If filtered by "active" but library returned 0 items, and no other filters/searches are set,
      // let's try calling with statusId: "all" to check if there are draft documents we can display instead.
      if (
        docsList.length === 0 &&
        activeStatusId === "active" &&
        !search &&
        filters.typeId === "all" &&
        filters.categoryId === "all" &&
        filters.departmentId === "all" &&
        filters.riskLevel === "all"
      ) {
        const fallbackParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          search,
          typeId: filters.typeId,
          categoryId: filters.categoryId,
          departmentId: filters.departmentId,
          statusId: "all",
          riskLevel: filters.riskLevel
        });
        const fallbackData = await apiRequest(`/api/documents?${fallbackParams.toString()}`);
        if (fallbackData?.data && fallbackData.data.length > 0) {
          docsList = fallbackData.data;
          totalCount = fallbackData.meta?.total || 0;
          totalPagesCount = fallbackData.meta?.totalPages || 1;
          setFilters(prev => ({ ...prev, statusId: "all" }));
        }
      }

      setDocuments(docsList);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
        totalPages: totalPagesCount
      }));
    } catch (err) {
      console.error("Failed to load documents", err);
      setError((err as Error).message || "Unable to load document library.");
      toast.error(`Error loading document library: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/api/master-data")
      .then(setMasterData)
      .catch((err) => {
        console.error("Master-data load failed", err);
        toast.error("Could not load master setup data");
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.page, pagination.limit, search, filters]);

  // Handle filter changes - reset to page 1
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'published':
      case 'approved':
        return <span className="flex w-fit items-center gap-1.5 font-bold text-green-600">● {status}</span>;
      case 'in review':
      case 'submitted for review':
        return <span className="flex w-fit items-center gap-1.5 font-bold text-blue-600">● {status}</span>;
      case 'revision requested':
        return <span className="flex w-fit items-center gap-1.5 font-bold text-orange-500">● Revision</span>;
      case 'archived':
        return <span className="flex w-fit items-center gap-1.5 font-bold text-slate-400">● {status}</span>;
      case 'draft':
      default:
        return <span className="flex w-fit items-center gap-1.5 font-bold text-slate-500">● {status}</span>;
    }
  };

  const getRiskBadge = (level: string) => {
    switch(level.toLowerCase()) {
      case 'sif':
        return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">SIF RISK</span>;
      case 'high':
        return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">HIGH</span>;
      case 'medium':
        return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">MEDIUM</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">LOW</span>;
    }
  };

  const isDbEmpty = pagination.total === 0 && !search && 
    filters.typeId === "all" && 
    filters.categoryId === "all" && 
    filters.departmentId === "all" && 
    (filters.statusId === "all" || filters.statusId === "active") && 
    filters.riskLevel === "all";

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Document Library</h2>
          <p className="text-xs text-slate-500">Manage all {pagination.total} warehouse safety procedures and JSAs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              fetchDocuments();
              toast.success("Library reloaded");
            }}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            REFRESH LIBRARY
          </button>
          <button 
            onClick={() => {
              setSearch("");
              setFilters({
                typeId: "all",
                categoryId: "all",
                departmentId: "all",
                statusId: "all",
                riskLevel: "all"
              });
              setPagination(prev => ({ ...prev, page: 1 }));
              toast.success("All filters cleared");
            }}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            CLEAR FILTERS
          </button>
          <button 
            onClick={() => navigate("/documents/new")}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            + NEW DOCUMENT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, Title, keywords..."
            className="w-full rounded border border-slate-300 bg-white py-1.5 pl-8 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <select 
          className="rounded border border-slate-300 bg-white py-1.5 px-3 text-xs focus:outline-none font-medium text-slate-700"
          value={filters.typeId}
          onChange={(e) => handleFilterChange({ typeId: e.target.value })}
        >
          <option value="all">All Types</option>
          {masterData?.types?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select 
          className="rounded border border-slate-300 bg-white py-1.5 px-3 text-xs focus:outline-none font-medium text-slate-700"
          value={filters.categoryId}
          onChange={(e) => handleFilterChange({ categoryId: e.target.value })}
        >
          <option value="all">All Categories</option>
          {masterData?.categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          className="rounded border border-slate-300 bg-white py-1.5 px-3 text-xs focus:outline-none font-medium text-slate-700"
          value={filters.departmentId}
          onChange={(e) => handleFilterChange({ departmentId: e.target.value })}
        >
          <option value="all">All Departments</option>
          {masterData?.departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select 
          className="rounded border border-slate-300 bg-white py-1.5 px-3 text-xs focus:outline-none font-medium text-slate-700"
          value={filters.statusId}
          onChange={(e) => handleFilterChange({ statusId: e.target.value })}
        >
          <option value="active">Active Documents</option>
          <option value="all">All Statuses</option>
          {masterData?.statuses?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select 
          className="rounded border border-slate-300 bg-white py-1.5 px-3 text-xs focus:outline-none font-medium text-slate-700"
          value={filters.riskLevel}
          onChange={(e) => handleFilterChange({ riskLevel: e.target.value })}
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="sif">SIF Risk</option>
        </select>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white min-h-[300px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-xs font-bold uppercase text-slate-700">
            Documents: showing {documents.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Per page:</span>
            <select 
              className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-bold focus:outline-none"
              value={pagination.limit}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value);
                setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
              }}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {loading && !documents.length ? (
             <div className="flex h-64 flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connecting to Vault...</p>
             </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-8">
               <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
               <button onClick={() => fetchDocuments()} className="mt-4 text-[10px] font-bold text-blue-600 underline">RETRY CONNECTION</button>
            </div>
          ) : isDbEmpty ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg m-4 border border-dashed border-slate-300">
               <Info className="h-8 w-8 text-slate-400 mb-2" />
               <p className="text-sm font-black text-slate-700 uppercase tracking-tight">No documents found. The database may need to be seeded.</p>
               <p className="mt-2 text-xs text-slate-400 max-w-sm">No protocols, training modules or hazard registers currently reside in EHS library.</p>
               <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-left max-w-sm">
                 <p className="text-[9px] uppercase font-black tracking-widest text-blue-700">Development Environment Guideline</p>
                 <p className="text-xs text-blue-600 mt-1">To automatically populate standard warehouse EHS SOPs, JSAs and audit templates, execute:</p>
                 <code className="block bg-slate-900 text-slate-100 font-mono text-[10px] p-2 rounded mt-2 select-all">npm run db:seed</code>
               </div>
            </div>
          ) : documents.length === 0 ? (
             <div className="flex h-64 flex-col items-center justify-center text-center p-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching safety protocols found</p>
                <p className="mt-2 text-[10px] text-slate-300 font-medium max-w-xs">Adjust your site filters or deploy a new protocol to start your site library.</p>
             </div>
          ) : (
            <>
            <table className="w-full text-left" role="table">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2 w-1/3">Title</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Dept</th>
                  <th className="px-4 py-2 text-center text-nowrap">Risk</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {documents.map((doc) => (
                  <tr key={doc.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 last:border-0 transition-colors" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <td className="px-4 py-3 font-mono text-slate-400">{doc.docNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{doc.title} {doc.sifPotential && "⚠️"}</td>
                    <td className="px-4 py-3 text-slate-500">{doc.type?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.department?.name}</td>
                    <td className="px-4 py-3 text-center">{getRiskBadge(doc.riskLevel)}</td>
                    <td className="px-4 py-3">{getStatusBadge(doc.status?.name || "Draft")}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{format(new Date(doc.updatedAt), "MMM d, y") }</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                PREVIOUS
              </button>
              
              {/* Pagination Dots/Numbers could go here, but keeping it simple for now */}
              <div className="flex gap-1 overflow-x-auto max-w-[200px] no-scrollbar">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || (p >= pagination.page - 1 && p <= pagination.page + 1))
                  .map((p, index, array) => {
                    const prev = array[index - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <div key={p} className="flex gap-1">
                        {showEllipsis && <span className="text-[10px] text-slate-300 pt-1">...</span>}
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                          className={`min-w-[24px] rounded border px-2 py-1 text-[10px] font-bold transition-colors ${
                            pagination.page === p 
                            ? "border-blue-600 bg-blue-600 text-white" 
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })
                }
              </div>

              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

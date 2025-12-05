import { useAuth } from "@/hooks/useAuth";
import { DatabaseQueryPanel } from "@/components/DatabaseQueryPanel";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "wouter";
import { useEffect } from "react";

export default function DatabaseAdmin() {
  const { user } = useAuth();
  const [, navigate] = useNavigate();

  useEffect(() => {
    // Only allow master admins
    if (user?.role !== "master_admin" && user?.email !== "cellsync.hub@gmail.com") {
      navigate("/");
    }
  }, [user, navigate]);

  if (user?.role !== "master_admin" && user?.email !== "cellsync.hub@gmail.com") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h1 className="font-bold text-red-900">Access Denied</h1>
          </div>
          <p className="text-red-800">
            Only master administrators can access the database admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Administration</h1>
          <p className="text-gray-600 mt-2">
            Direct database access for master administrators. Use with caution!
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">Important</h3>
              <p className="text-sm text-yellow-800 mt-1">
                This panel allows direct access to the database. Any changes made here are permanent
                and affect all users. Please be extremely careful when executing mutations.
              </p>
            </div>
          </div>
        </div>

        <DatabaseQueryPanel />
      </div>
    </div>
  );
}

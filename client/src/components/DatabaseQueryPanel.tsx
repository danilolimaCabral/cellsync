import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Copy, Play, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function DatabaseQueryPanel() {
  const [selectQuery, setSelectQuery] = useState("SELECT * FROM plans LIMIT 10;");
  const [mutationQuery, setMutationQuery] = useState("");
  const [confirmMutation, setConfirmMutation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const executeSelectMutation = trpc.databaseQuery.executeQuery.useQuery(
    { query: selectQuery, limit: 100 },
    { enabled: false }
  );

  const executeMutationMutation = trpc.databaseQuery.executeMutation.useMutation();
  const getDatabaseInfoQuery = trpc.databaseQuery.getDatabaseInfo.useQuery();

  const handleExecuteSelect = async () => {
    if (!selectQuery.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/trpc/databaseQuery.executeQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: selectQuery, limit: 100 })
      });

      const data = await response.json();
      if (data.result?.data?.json?.success) {
        setResult(data.result.data.json);
        toast.success(`Query executed: ${data.result.data.json.rowCount} rows returned`);
      } else {
        toast.error(data.result?.data?.json?.error || "Query failed");
        setResult(data.result?.data?.json);
      }
    } catch (error) {
      toast.error("Failed to execute query");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMutation = async () => {
    if (!mutationQuery.trim()) {
      toast.error("Please enter a query");
      return;
    }

    if (!confirmMutation) {
      toast.error("Please confirm the mutation");
      return;
    }

    setLoading(true);
    try {
      const response = await executeMutationMutation.mutateAsync({
        query: mutationQuery,
        confirm: true
      });

      setResult(response);
      if (response.success) {
        toast.success(`Mutation executed: ${response.affectedRows} rows affected`);
        setMutationQuery("");
        setConfirmMutation(false);
      } else {
        toast.error(response.error || "Mutation failed");
      }
    } catch (error) {
      toast.error("Failed to execute mutation");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Query Panel</CardTitle>
          <CardDescription>
            Execute SQL queries directly on the database. Only for master admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="select" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select">SELECT</TabsTrigger>
              <TabsTrigger value="mutation">Mutation</TabsTrigger>
              <TabsTrigger value="info">Database Info</TabsTrigger>
            </TabsList>

            {/* SELECT Tab */}
            <TabsContent value="select" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SELECT Query</label>
                <Textarea
                  value={selectQuery}
                  onChange={(e) => setSelectQuery(e.target.value)}
                  placeholder="SELECT * FROM plans LIMIT 10;"
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleExecuteSelect}
                disabled={loading}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                {loading ? "Executing..." : "Execute Query"}
              </Button>

              {result?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">
                      {result.rowCount} rows returned
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          {result.data?.[0] &&
                            Object.keys(result.data[0]).map((key) => (
                              <th key={key} className="text-left p-2 font-semibold">
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data?.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-green-100">
                            {Object.values(row).map((value: any, i: number) => (
                              <td key={i} className="p-2">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result?.success === false && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-900">{result.error}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Mutation Tab */}
            <TabsContent value="mutation" className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900">Caution</p>
                    <p className="text-sm text-yellow-800">
                      Mutations (INSERT, UPDATE, DELETE) will directly modify the database.
                      Please be careful!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mutation Query</label>
                <Textarea
                  value={mutationQuery}
                  onChange={(e) => setMutationQuery(e.target.value)}
                  placeholder="UPDATE plans SET price_monthly = 9700 WHERE slug = 'basico';"
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmMutation}
                  onChange={(e) => setConfirmMutation(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="confirm" className="text-sm">
                  I understand this will modify the database
                </label>
              </div>

              <Button
                onClick={handleExecuteMutation}
                disabled={loading || !confirmMutation}
                className="w-full"
                variant={confirmMutation ? "destructive" : "secondary"}
              >
                <Play className="w-4 h-4 mr-2" />
                {loading ? "Executing..." : "Execute Mutation"}
              </Button>

              {result?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-900">
                      {result.affectedRows} rows affected
                    </span>
                  </div>
                </div>
              )}

              {result?.success === false && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-900">{result.error}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Database Info Tab */}
            <TabsContent value="info" className="space-y-4">
              <Button
                onClick={() => getDatabaseInfoQuery.refetch()}
                disabled={getDatabaseInfoQuery.isLoading}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {getDatabaseInfoQuery.isLoading ? "Loading..." : "Refresh Info"}
              </Button>

              {getDatabaseInfoQuery.data?.success && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Database:</strong> {getDatabaseInfoQuery.data.database}
                    </p>
                    <p className="text-sm text-blue-900">
                      <strong>Version:</strong> {getDatabaseInfoQuery.data.version}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Tables</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-gray-100">
                            <th className="text-left p-2">Table</th>
                            <th className="text-right p-2">Rows</th>
                            <th className="text-right p-2">Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getDatabaseInfoQuery.data.tables?.map(
                            (table: any) => (
                              <tr key={table.TABLE_NAME} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-mono">{table.TABLE_NAME}</td>
                                <td className="text-right p-2">{table.TABLE_ROWS || 0}</td>
                                <td className="text-right p-2">
                                  {(
                                    (table.DATA_LENGTH + table.INDEX_LENGTH) /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSelectQuery("SELECT * FROM plans;");
              handleExecuteSelect();
            }}
          >
            View All Plans
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const query = `UPDATE plans SET price_monthly = 9700, price_yearly = 97000 WHERE slug = 'basico';
UPDATE plans SET price_monthly = 19700, price_yearly = 197000 WHERE slug = 'profissional';
UPDATE plans SET price_monthly = 59900, price_yearly = 599000 WHERE slug = 'empresarial';`;
              setMutationQuery(query);
            }}
          >
            Fix Plans Pricing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

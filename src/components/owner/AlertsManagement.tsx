import { useEffect, useState } from "react";
import { alertsApi } from "@/services/backendApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Alert {
  id: string;
  alert_type: "low_stock" | "expiry_warning" | "expired";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  branch_id: string;
  medicine_id: string;
  current_quantity: number | null;
  threshold_quantity: number | null;
  expiry_date: string | null;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  branches: { name: string } | null;
  medicines: { name: string } | null;
}

export const AlertsManagement = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");

  const fetchAlerts = async () => {
    try {
      const data = await alertsApi.getAll();
      
      let filtered = data;
      if (filter === "unread") {
        filtered = data.filter((a: any) => !a.is_read);
      } else if (filter === "critical") {
        filtered = data.filter((a: any) => a.severity === "critical");
      }
      
      setAlerts(filtered as Alert[]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const markAsRead = async (alertId: string) => {
    try {
      await alertsApi.markAsRead(alertId);
      fetchAlerts();
      toast.success("Alert marked as read");
    } catch (error) {
      console.error("Error marking alert as read:", error);
      toast.error("Failed to mark alert as read");
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await alertsApi.resolve(alertId);
      fetchAlerts();
      toast.success("Alert resolved successfully");
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast.error("Failed to resolve alert");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "warning";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5" />;
      case "high":
        return <AlertTriangle className="h-5 w-5" />;
      case "medium":
        return <AlertCircle className="h-5 w-5" />;
      case "low":
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "low_stock":
        return "Low Stock";
      case "expiry_warning":
        return "Expiry Warning";
      case "expired":
        return "Expired";
      default:
        return type;
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Alerts & Notifications
        </h2>
        <p className="text-muted-foreground mt-2">
          Monitor stock levels and expiry dates across all branches
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{criticalCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-16 w-16 text-success mb-4" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm text-muted-foreground">
                  All systems are running smoothly
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`transition-all hover:shadow-lg ${
                  !alert.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                } ${alert.is_resolved ? "opacity-60" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {alert.branches?.name} • {alert.medicines?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-4">{alert.message}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    {alert.current_quantity !== null && (
                      <div>
                        <span className="font-medium">Current Stock:</span> {alert.current_quantity}
                      </div>
                    )}
                    {alert.threshold_quantity !== null && (
                      <div>
                        <span className="font-medium">Threshold:</span> {alert.threshold_quantity}
                      </div>
                    )}
                    {alert.expiry_date && (
                      <div>
                        <span className="font-medium">Expiry Date:</span>{" "}
                        {format(new Date(alert.expiry_date), "MMM dd, yyyy")}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {format(new Date(alert.created_at), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    {!alert.is_resolved && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                    {alert.is_resolved && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

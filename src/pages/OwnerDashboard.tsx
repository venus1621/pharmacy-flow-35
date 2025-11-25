import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Pill, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BranchManagement } from "@/components/owner/BranchManagement";
import { MedicineManagement } from "@/components/owner/MedicineManagement";
import { MainStockManagement } from "@/components/owner/MainStockManagement";
import { PharmacistManagement } from "@/components/owner/PharmacistManagement";
import { StockTransferManagement } from "@/components/owner/StockTransferManagement";
import { ReportsManagement } from "@/components/owner/ReportsManagement";
import { AdvancedInventoryControl } from "@/components/owner/AdvancedInventoryControl";
import { TransactionHistory } from "@/components/owner/TransactionHistory";
import { BranchStockView } from "@/components/owner/BranchStockView";
import { AnalyticsDashboard } from "@/components/owner/AnalyticsDashboard";
import { AlertsManagement } from "@/components/owner/AlertsManagement";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const OwnerDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("branches");

  // Fetch pharmacy data
  const { data: pharmacy } = useQuery({
    queryKey: ["pharmacy", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("pharmacies")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "branches":
        return <BranchManagement />;
      case "medicines":
        return <MedicineManagement />;
      case "stock":
        return <MainStockManagement />;
      case "branch-stock":
        return <BranchStockView />;
      case "inventory":
        return <AdvancedInventoryControl />;
      case "pharmacists":
        return <PharmacistManagement />;
      case "transfers":
        return <StockTransferManagement />;
      case "transactions":
        return <TransactionHistory />;
      case "alerts":
        return <AlertsManagement />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "reports":
        return <ReportsManagement />;
      default:
        return <BranchManagement />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <OwnerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Pill className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {pharmacy?.name || "Pharmacy System"}
                    </h1>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Owner Dashboard</p>
                      {(!pharmacy?.plan || pharmacy?.plan === 'testing') && (
                        <Badge variant="secondary" className="text-xs">
                          <TestTube className="h-3 w-3 mr-1" />
                          Testing Mode
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OwnerDashboard;

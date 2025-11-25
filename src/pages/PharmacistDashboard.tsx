import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Pill, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { POSSystem } from "@/components/pharmacist/POSSystem";
import { BranchStockView } from "@/components/pharmacist/BranchStockView";
import { StockRequestForm } from "@/components/pharmacist/StockRequestForm";
import { MyTransactions } from "@/components/pharmacist/MyTransactions";
import { PharmacistSidebar } from "@/components/pharmacist/PharmacistSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const PharmacistDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pos");

  // Fetch branch assignment for pharmacist
  const { data: assignment } = useQuery({
    queryKey: ["pharmacist-assignment", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacist_assignments")
        .select("branch_id, branches(name, pharmacy_id, pharmacies(name))")
        .eq("pharmacist_id", user!.id)
        .single();
      
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
      case "pos":
        return <POSSystem />;
      case "stock":
        return <BranchStockView />;
      case "requests":
        return <StockRequestForm />;
      case "transactions":
        return <MyTransactions />;
      default:
        return <POSSystem />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PharmacistSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Pill className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {assignment?.branches?.pharmacies?.name || "Gebeta Pharmacy"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {assignment?.branches?.name || "Loading branch..."}
                    </p>
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

export default PharmacistDashboard;

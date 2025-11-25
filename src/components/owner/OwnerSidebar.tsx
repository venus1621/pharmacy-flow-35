import { Building2, Pill, Package, PackageSearch, Users, ArrowRightLeft, FileText, Receipt, Warehouse, BarChart3, Bell } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Branches", icon: Building2, value: "branches" },
  { title: "Medicines", icon: Pill, value: "medicines" },
  { title: "Main Stock", icon: Package, value: "stock" },
  { title: "Branch Stock", icon: Warehouse, value: "branch-stock" },
  { title: "Inventory Control", icon: PackageSearch, value: "inventory" },
  { title: "Pharmacists", icon: Users, value: "pharmacists" },
  { title: "Stock Transfers", icon: ArrowRightLeft, value: "transfers" },
  { title: "Transactions", icon: Receipt, value: "transactions" },
  { title: "Alerts", icon: Bell, value: "alerts" },
  { title: "Analytics", icon: BarChart3, value: "analytics" },
  { title: "Reports", icon: FileText, value: "reports" },
];

export function OwnerSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (value: string) => void }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={isCollapsed ? "text-center" : ""}>
            {isCollapsed ? "Menu" : "Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                    className="cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Venus Software Branding */}
      <div className={`border-t border-sidebar-border p-4 ${isCollapsed ? "text-center" : ""}`}>
        <p className="text-xs text-sidebar-foreground/60">
          {isCollapsed ? "GP" : "Powered by Gebeta Pharmacy"}
        </p>
      </div>
      </SidebarContent>
    </Sidebar>
  );
}

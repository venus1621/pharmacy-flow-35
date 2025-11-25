import { ShoppingCart, Package, Send, Receipt } from "lucide-react";
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
  { title: "Point of Sale", icon: ShoppingCart, value: "pos" },
  { title: "Branch Stock", icon: Package, value: "stock" },
  { title: "Request Stock", icon: Send, value: "requests" },
  { title: "My Transactions", icon: Receipt, value: "transactions" },
];

export function PharmacistSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (value: string) => void }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "text-center" : ""}>
            {isCollapsed ? "Menu" : "Pharmacist"}
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
      </SidebarContent>
      <div className={`border-t border-sidebar-border p-4 ${isCollapsed ? "text-center" : ""}`}>
        <p className="text-xs text-sidebar-foreground/60">
          {isCollapsed ? "GP" : "Powered by Gebeta Pharmacy"}
        </p>
      </div>
    </Sidebar>
  );
}

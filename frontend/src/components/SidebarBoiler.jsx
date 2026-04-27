import React from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

const SidebarBoiler = ({ children }) => {
    return (
        <SidebarProvider className="hidden lg:block">
            <Sidebar className="h-full mt-16">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>{children}</SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </SidebarProvider>
    );
};

const SidebarItem = ({ children, onClick }) => {
    return (
        <SidebarMenuItem onClick={onClick}>
            <SidebarMenuButton asChild>{children}</SidebarMenuButton>
        </SidebarMenuItem>
    );
};

export { SidebarBoiler, SidebarItem };

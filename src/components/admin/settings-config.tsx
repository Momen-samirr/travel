"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export function SettingsConfig() {
  // This is a placeholder for future feature flags or settings
  // For now, we'll show system status
  const systemStatus = {
    database: true, // Would check actual connection
    payments: true,
    email: true,
    storage: true,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {systemStatus.database ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">Database</span>
            </div>
            <Badge variant={systemStatus.database ? "default" : "destructive"}>
              {systemStatus.database ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {systemStatus.payments ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">Payment Gateways</span>
            </div>
            <Badge variant={systemStatus.payments ? "default" : "destructive"}>
              {systemStatus.payments ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {systemStatus.email ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">Email Service</span>
            </div>
            <Badge variant={systemStatus.email ? "default" : "destructive"}>
              {systemStatus.email ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {systemStatus.storage ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">File Storage</span>
            </div>
            <Badge variant={systemStatus.storage ? "default" : "destructive"}>
              {systemStatus.storage ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


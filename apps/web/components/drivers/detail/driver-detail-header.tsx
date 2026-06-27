"use client";

import React from "react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Mail, Calendar, Phone, Truck, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function DriverDetailHeader({ driver }: { driver: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/staff/drivers">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Driver Profile</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center text-gray-400 text-3xl font-bold">
            {driver.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1D1D1F]">
                {driver.name}
              </h2>
              <Badge
                className={
                  driver.availability === "ONLINE"
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : driver.availability === "ON_DELIVERY"
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                }>
                {driver.availability.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Phone size={14} />
                {driver.phone}
              </div>
              {driver.email && (
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  {driver.email}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {format(new Date(driver.createdAt), "MMM d, yyyy")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {driver.vehicle && (
                <Badge
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-100 gap-1">
                  <Truck size={12} />
                  {driver.vehicle.licensePlate} ({driver.vehicle.make}{" "}
                  {driver.vehicle.model})
                </Badge>
              )}
              {driver.deliveryPartner && (
                <Badge
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 border-purple-100">
                  {driver.deliveryPartner.name}
                </Badge>
              )}
              {!driver.deliveryPartner && (
                <Badge
                  variant="secondary"
                  className="bg-gray-50 text-gray-700 border-gray-100">
                  In-house
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Add edit button or status toggle here */}
        </div>
      </div>
    </div>
  );
}

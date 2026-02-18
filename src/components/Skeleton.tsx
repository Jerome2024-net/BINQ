"use client";

import React from "react";

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SkeletonBox className="h-8 w-64 mb-2" />
          <SkeletonBox className="h-5 w-96" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
            <SkeletonBox className="w-10 h-10 rounded-xl" />
            <SkeletonBox className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Wallet Card */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-5">
          <SkeletonBox className="w-12 h-12 rounded-xl !bg-white/10" />
          <div>
            <SkeletonBox className="h-4 w-28 !bg-white/10 mb-2" />
            <SkeletonBox className="h-8 w-48 !bg-white/10" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
            <SkeletonBox className="h-4 w-24 mb-3" />
            <SkeletonBox className="h-7 w-20 mb-2" />
            <SkeletonBox className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <SkeletonBox className="h-6 w-32 mb-6" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl mb-3">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <SkeletonBox className="h-4 w-40 mb-2" />
                <SkeletonBox className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SkeletonBox className="h-6 w-28 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 mb-2">
                <SkeletonBox className="w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <SkeletonBox className="h-4 w-32 mb-1" />
                  <SkeletonBox className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Portefeuille skeleton */
export function PortefeuilleSkeleton() {
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBox className="h-8 w-48 mb-2" />
          <SkeletonBox className="h-5 w-64" />
        </div>
      </div>

      {/* Balance */}
      <div className="bg-gray-900 rounded-xl p-8">
        <div className="flex items-center gap-5">
          <SkeletonBox className="w-14 h-14 rounded-xl !bg-white/10" />
          <div>
            <SkeletonBox className="h-4 w-28 !bg-white/10 mb-3" />
            <SkeletonBox className="h-10 w-56 !bg-white/10" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200">
            <SkeletonBox className="h-4 w-24 mb-3" />
            <SkeletonBox className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SkeletonBox className="h-6 w-40 mb-6" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
            <SkeletonBox className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <SkeletonBox className="h-4 w-44 mb-2" />
              <SkeletonBox className="h-3 w-28" />
            </div>
            <SkeletonBox className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Explorer skeleton */
export function ExplorerSkeleton() {
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBox className="h-8 w-56 mb-2" />
          <SkeletonBox className="h-5 w-72" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-2 sm:p-3 rounded-xl border border-gray-200">
            <SkeletonBox className="h-4 w-20 mb-2" />
            <SkeletonBox className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <SkeletonBox className="h-12 flex-1 rounded-xl" />
        <SkeletonBox className="h-12 w-32 rounded-xl" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <SkeletonBox className="w-12 h-12 rounded-xl" />
              <div className="flex-1">
                <SkeletonBox className="h-5 w-32 mb-2" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
            <SkeletonBox className="h-4 w-full mb-3" />
            <div className="flex justify-between">
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tontine Detail skeleton */
export function TontineDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBox className="w-8 h-8 rounded-lg" />
        <SkeletonBox className="h-7 w-48" />
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <SkeletonBox className="w-16 h-16 rounded-xl" />
          <div className="flex-1">
            <SkeletonBox className="h-6 w-48 mb-2" />
            <SkeletonBox className="h-4 w-32 mb-2" />
            <SkeletonBox className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <SkeletonBox key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
            <SkeletonBox className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <SkeletonBox className="h-4 w-40 mb-2" />
              <SkeletonBox className="h-3 w-56" />
            </div>
            <SkeletonBox className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Transactions skeleton */
export function TransactionsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SkeletonBox className="h-8 w-40 mb-2" />
          <SkeletonBox className="h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-10 w-28 rounded-lg" />
          <SkeletonBox className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200">
            <SkeletonBox className="h-4 w-24 mb-3" />
            <SkeletonBox className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <SkeletonBox className="h-12 flex-1 rounded-xl" />
        <SkeletonBox className="h-12 w-32 rounded-xl" />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
            <SkeletonBox className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <SkeletonBox className="h-4 w-48 mb-2" />
              <SkeletonBox className="h-3 w-32" />
            </div>
            <SkeletonBox className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { SkeletonBox };

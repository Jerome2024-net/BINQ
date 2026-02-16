"use client";

import Link from "next/link";
import { useTontine } from "@/contexts/TontineContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ParticipantProfileCard from "@/components/ParticipantProfileCard";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function ParticipantDetailPage({
  params,
}: {
  params: { id: string; membreId: string };
}) {
  const { id, membreId } = params;
  const { getTontineById } = useTontine();
  const { user } = useAuth();

  const tontine = getTontineById(id);

  if (!tontine) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link href="/tontines" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour aux tontines
          </Link>
          <div className="card text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Tontine introuvable</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const membre = tontine.membres.find((m) => m.id === membreId);

  if (!membre) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link href={`/tontines/${id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour à {tontine.nom}
          </Link>
          <div className="card text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Membre introuvable dans cette tontine</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href={`/tontines/${id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour à {tontine.nom}
          </Link>
        </div>

        <ParticipantProfileCard membre={membre} tontine={tontine} expanded />
      </div>
    </DashboardLayout>
  );
}

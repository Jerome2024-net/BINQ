"use client";

import { QRCodeSVG } from "qrcode.react";
import { Shield, MapPin, UserCircle2 } from "lucide-react";

interface BadgeProps {
  member: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    role: string;
    qr_code: string;
    actif: boolean;
    photo_url: string | null;
    access_spaces: { nom: string; adresse: string | null } | null;
  };
}

export default function BadgeContent({ member }: BadgeProps) {
  const space = member.access_spaces as { nom: string; adresse: string | null } | null;

  const roleColor = () => {
    switch (member.role) {
      case "VIP":
        return "bg-amber-500";
      case "visiteur":
        return "bg-blue-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Badge card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header band */}
          <div className={`${roleColor()} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white text-[15px] font-black">BINQ ACCESS</span>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              member.actif
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/60"
            }`}>
              {member.actif ? "ACTIF" : "INACTIF"}
            </span>
          </div>

          {/* Identity */}
          <div className="px-6 pt-5 pb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 overflow-hidden">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={`${member.prenom} ${member.nom}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle2 className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h1 className="text-[22px] font-black text-gray-900">
              {member.prenom} {member.nom}
            </h1>
            <span className={`inline-block mt-1 text-[12px] font-bold px-3 py-1 rounded-full ${
              member.role === "VIP"
                ? "bg-amber-50 text-amber-600"
                : member.role === "visiteur"
                ? "bg-blue-50 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}>
              {member.role.toUpperCase()}
            </span>
          </div>

          {/* Space info */}
          {space && (
            <div className="mx-6 px-4 py-3 bg-gray-50 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[14px] font-bold text-gray-900">{space.nom}</p>
                  {space.adresse && (
                    <p className="text-[11px] text-gray-500">{space.adresse}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="px-6 pb-6">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 flex flex-col items-center">
              <QRCodeSVG
                value={member.qr_code}
                size={220}
                level="H"
                includeMargin
              />
              <p className="mt-3 text-[16px] font-mono font-black text-gray-700 tracking-wider">
                {member.qr_code}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center">
            <p className="text-[11px] text-gray-400">
              Présentez ce badge au scanner pour accéder à l&apos;espace
            </p>
          </div>
        </div>

        {/* Powered by */}
        <div className="text-center mt-4">
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
            Propulsé par
            <span className="font-bold text-gray-600">Binq</span>
          </p>
        </div>
      </div>
    </div>
  );
}

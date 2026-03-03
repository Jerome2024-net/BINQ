"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  SendHorizonal,
  Search,
  User,
  Loader2,
  CheckCircle2,
  ArrowRight,
  X,
  Wallet,
  MessageSquare,
} from "lucide-react";

interface UserResult {
  id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
}

export default function EnvoyerPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<"search" | "amount" | "confirm" | "success">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [solde, setSolde] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ reference: string; montant: number; destinataire: string } | null>(null);

  // Fetch wallet balance
  useEffect(() => {
    if (user) {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => { if (data.wallet) setSolde(data.wallet.solde || 0); })
        .catch(() => {});
    }
  }, [user]);

  // Search users
  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchUsers(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchUsers]);

  const selectUser = (u: UserResult) => {
    setSelectedUser(u);
    setStep("amount");
  };

  const goToConfirm = () => {
    const montant = parseFloat(amount);
    if (!montant || montant <= 0) return;
    if (montant > solde) {
      showToast("error", "Solde insuffisant", `Votre solde est de ${solde.toFixed(2)} €`);
      return;
    }
    setStep("confirm");
  };

  const handleSend = async () => {
    if (!selectedUser || !amount) return;
    setSending(true);
    try {
      const res = await fetch("/api/transferts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinataire_id: selectedUser.id,
          montant: parseFloat(amount),
          message: message || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Erreur", data.error || "Transfert échoué");
        return;
      }
      setResult(data.transfert);
      setSolde((prev) => prev - parseFloat(amount));
      setStep("success");
      showToast("success", "Envoi confirmé", `${parseFloat(amount).toFixed(2)} € envoyé à ${selectedUser.prenom}`);
    } catch {
      showToast("error", "Erreur", "Erreur lors du transfert");
    } finally { setSending(false); }
  };

  const reset = () => {
    setStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setAmount("");
    setMessage("");
    setResult(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5 sm:space-y-6 pb-12">

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Envoyer de l&apos;<span className="text-amber-600">argent</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Transférez de l&apos;argent instantanément à un autre utilisateur Binq.</p>
      </div>

      {/* Solde banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
        <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-600">
          Solde disponible : <span className="font-bold text-gray-900">{solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
        </p>
      </div>

      {/* Steps */}
      <div className="bg-white border border-gray-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">

        {/* ── Step 1: Search user ── */}
        {step === "search" && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Choisir un destinataire</h3>
                <p className="text-xs text-gray-400">Recherchez par prénom ou nom</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                autoFocus
              />
            </div>

            {searching && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold uppercase">{u.prenom[0]}{u.nom[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{u.prenom} {u.nom}</p>
                      <p className="text-[11px] text-gray-400">Membre Binq</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8">
                <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Amount ── */}
        {step === "amount" && selectedUser && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase">{selectedUser.prenom[0]}{selectedUser.nom[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</p>
                  <p className="text-[11px] text-gray-400">Destinataire</p>
                </div>
              </div>
              <button onClick={reset} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4">Montant</p>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-5xl font-black text-gray-900 placeholder-gray-200 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
              <p className="text-center text-xs text-gray-400 mt-2">EUR</p>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    amount === amt.toString()
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {amt} €
                </button>
              ))}
            </div>

            {/* Optional message */}
            <div className="relative">
              <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message (optionnel)"
                maxLength={100}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>

            <button
              onClick={goToConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continuer
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === "confirm" && selectedUser && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vous envoyez</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                {parseFloat(amount).toFixed(2)} <span className="text-2xl text-gray-300">€</span>
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-500">à</span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold uppercase">{selectedUser.prenom[0]}{selectedUser.nom[0]}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</span>
                </div>
              </div>
              {message && (
                <p className="mt-4 text-sm text-gray-500 italic">&ldquo;{message}&rdquo;</p>
              )}
              <div className="mt-6 pt-4 border-t border-gray-200 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frais</span>
                  <span className="text-green-600 font-bold">Gratuit</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Total débité</span>
                  <span className="text-gray-900">{parseFloat(amount).toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("amount")} className="flex-[1] py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm">
                Retour
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-[2] py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
                {sending ? "Envoi en cours..." : "Confirmer l'envoi"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === "success" && result && (
          <div className="p-5 sm:p-6 text-center py-10">
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Envoi réussi !</h3>
            <p className="text-base text-gray-500 mb-2">
              <span className="text-gray-900 font-bold">{result.montant.toFixed(2)} €</span> envoyé à <span className="text-gray-900 font-bold">{result.destinataire}</span>
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl py-3 px-5 inline-block mt-4 mb-8">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Référence</p>
              <p className="font-mono text-sm text-gray-600">{result.reference}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm">
                Nouvel envoi
              </button>
              <a href="/portefeuille" className="flex-1 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors text-sm text-center">
                Mon portefeuille
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

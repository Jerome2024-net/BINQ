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

  useEffect(() => {
    if (user) {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => { if (data.wallet) setSolde(data.wallet.solde || 0); })
        .catch(() => {});
    }
  }, [user]);

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
      showToast("success", "Envoyé !", `${parseFloat(amount).toFixed(2)} € envoyé à ${selectedUser.prenom}`);
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
    <div className="space-y-5 pb-8">

      <div>
        <h1 className="text-xl font-black tracking-tight">
          Envoyer de l&apos;<span className="text-emerald-400">argent</span>
        </h1>
        <p className="text-white/30 text-sm mt-0.5">Transfert instantané et gratuit.</p>
      </div>

      {/* Solde banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <Wallet className="w-4 h-4 text-white/20 shrink-0" />
        <p className="text-sm text-white/40">
          Solde : <span className="font-bold text-white">{solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
        </p>
      </div>

      {/* ── Step 1: Search ── */}
      {step === "search" && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Choisir un destinataire</h3>
              <p className="text-[11px] text-white/25">Recherchez par nom ou prénom</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
              autoFocus
            />
          </div>

          {searching && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left active:bg-white/[0.06]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-black uppercase">{u.prenom[0]}{u.nom[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/80">{u.prenom} {u.nom}</p>
                    <p className="text-[10px] text-white/20">Membre Binq</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/15" />
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <User className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/25">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Amount ── */}
      {step === "amount" && selectedUser && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-black uppercase">{selectedUser.prenom[0]}{selectedUser.nom[0]}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white/80">{selectedUser.prenom} {selectedUser.nom}</p>
                <p className="text-[10px] text-white/20">Destinataire</p>
              </div>
            </div>
            <button onClick={reset} className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider text-center mb-4">Montant</p>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-5xl font-black text-white placeholder-white/10 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
            <p className="text-center text-[11px] text-white/20 mt-2">EUR</p>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                  amount === amt.toString()
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/[0.06] text-white/30 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                {amt} €
              </button>
            ))}
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message (optionnel)"
              maxLength={100}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
            />
          </div>

          <button
            onClick={goToConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Continuer
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === "confirm" && selectedUser && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-5">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6 text-center">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2">Vous envoyez</p>
            <p className="text-4xl font-black text-white tracking-tight mb-4">
              {parseFloat(amount).toFixed(2)} <span className="text-xl text-white/20">€</span>
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-white/30">à</span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-[8px] font-black uppercase">{selectedUser.prenom[0]}{selectedUser.nom[0]}</span>
                </div>
                <span className="text-sm font-bold text-white/80">{selectedUser.prenom} {selectedUser.nom}</span>
              </div>
            </div>
            {message && (
              <p className="mt-4 text-sm text-white/30 italic">&ldquo;{message}&rdquo;</p>
            )}
            <div className="mt-6 pt-4 border-t border-white/[0.05] text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Frais</span>
                <span className="text-emerald-400 font-bold">Gratuit</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-white/60">Total débité</span>
                <span className="text-white">{parseFloat(amount).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("amount")} className="flex-[1] py-4 rounded-xl border border-white/[0.08] text-white/40 font-bold hover:bg-white/[0.04] transition-colors text-sm active:scale-[0.98]">
              Retour
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-[2] py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
              {sending ? "Envoi..." : "Confirmer"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Success ── */}
      {step === "success" && result && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 text-center py-10">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Envoyé !</h3>
          <p className="text-base text-white/40 mb-2">
            <span className="text-white font-bold">{result.montant.toFixed(2)} €</span> envoyé à <span className="text-white font-bold">{result.destinataire}</span>
          </p>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3 px-5 inline-block mt-4 mb-8">
            <p className="text-[10px] text-white/20 uppercase tracking-wider font-bold">Référence</p>
            <p className="font-mono text-sm text-white/40">{result.reference}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-4 rounded-xl border border-white/[0.08] text-white/40 font-bold hover:bg-white/[0.04] transition-colors text-sm active:scale-[0.98]">
              Nouvel envoi
            </button>
            <a href="/portefeuille" className="flex-1 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors text-sm text-center active:scale-[0.98]">
              Historique
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

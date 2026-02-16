// Fonctions utilitaires

export function formatMontant(montant: number, devise: string = "EUR"): string {
  if (devise === "USD") {
    return `$${montant.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  // EUR par défaut
  return `${montant.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    en_attente: "En attente",
    terminee: "Terminée",
    suspendue: "Suspendue",
    en_cours: "En cours",
    complete: "Complété",
    a_venir: "À venir",
    en_retard: "En retard",
    confirme: "Confirmé",
    echoue: "Échoué",
    actif: "Actif",
    exclu: "Exclu",
    annulee: "Annulée",
    annule: "Annulé",
  };
  return labels[statut] || statut;
}

export function getStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    active: "badge-success",
    en_attente: "badge-warning",
    terminee: "badge-info",
    suspendue: "badge-danger",
    en_cours: "badge-warning",
    complete: "badge-success",
    a_venir: "badge-info",
    en_retard: "badge-danger",
    confirme: "badge-success",
    echoue: "badge-danger",
    actif: "badge-success",
    exclu: "badge-danger",
    annulee: "badge-danger",
    annule: "badge-danger",
  };
  return colors[statut] || "badge-info";
}

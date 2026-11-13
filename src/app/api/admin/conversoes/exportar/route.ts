import { getPermissionAccess } from "@/features/auth/permissions";
import { channelLabels } from "@/features/conversions/attribution";
import { stageLabels } from "@/features/conversions/commercial";
import { getConversionLeadNames, getConversionReport, parseReportFilters } from "@/features/conversions/queries";
import { csv, localDay } from "@/features/conversions/report";

export async function GET(request: Request) {
  for (const permission of ["conversions.view", "leads.view", "conversions.export"] as const) {
    if (!await getPermissionAccess(permission)) return new Response("Acesso não autorizado.", { status: 403 });
  }
  const filters = parseReportFilters(Object.fromEntries(new URL(request.url).searchParams));
  const { leads, caravans, owners } = await getConversionReport(filters);
  if (leads.length > 10_000) return new Response("Selecione um período menor para exportar até 10.000 leads.", { status: 422 });
  const names = await getConversionLeadNames(leads.map((lead) => lead.id));
  const caravanNames = new Map(caravans.map(({ id, title }) => [id, title]));
  const ownerNames = new Map(owners.map(({ id, name }) => [id, name]));
  const evidenceLabels = { observed: "Observada no site", reported: "Informada pela equipe", legacy: "UTMs anteriores", unknown: "Desconhecida" };
  const rows = leads.map((lead) => {
    const contact = names.get(lead.id);
    const origin = lead.reportOrigin;
    const stage = lead.commercial_stage as keyof typeof stageLabels | null;
    return [lead.id, contact?.name, contact?.phone, channelLabels[origin.channel], origin.medium, origin.campaign, origin.campaignId, evidenceLabels[lead.reportEvidence],
      lead.source, caravanNames.get(lead.caravan_id ?? ""), ownerNames.get(lead.assigned_to ?? ""), stage ? stageLabels[stage] : "", localDay(lead.created_at), lead.is_test ? "Sim" : "Não"];
  });
  return new Response(csv([["ID do lead","Nome","WhatsApp","Origem","Mídia","Campanha","ID da campanha","Evidência","Canal de atendimento","Caravana","Consultor","Etapa","Criado em","Teste"], ...rows]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="leehov-leads.csv"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

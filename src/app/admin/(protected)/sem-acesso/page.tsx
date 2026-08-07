import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NoAccessPage() {
  return <Card className="mx-auto max-w-xl rounded-[24px] border-leehov-border p-8 text-center"><ShieldX className="mx-auto size-10 text-leehov-blue-600" /><h2 className="mt-5 text-2xl font-extrabold text-leehov-navy-950">Acesso ainda não configurado</h2><p className="mt-3 text-sm leading-6 text-leehov-muted">Sua conta está ativa, mas não possui permissão para nenhum módulo. Peça ao administrador geral para ajustar seu acesso.</p><Button asChild variant="outline" className="mt-6"><Link href="/admin/minha-conta">Abrir minha conta</Link></Button></Card>;
}

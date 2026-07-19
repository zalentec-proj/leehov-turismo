export const metadata = {
  title: "Política de Privacidade",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PrivacyPage() {
  return (
    <main className="bg-white pb-24">
      <header className="bg-leehov-navy-950 px-5 pb-24 pt-40 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-300">Privacidade e transparência</p><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Política de Privacidade</h1><p className="mt-5 leading-7 text-white/65">Como tratamos dados de contato, inscrições, preferências e integrações do site.</p></div></header>
      <section className="px-5 pt-16 sm:px-8 lg:px-12"><div className="mx-auto max-w-3xl">
        <div className="space-y-6 leading-8 text-leehov-muted">
          <p>
            A Leehov usa os dados informados nos formulários para responder contatos, registrar interesses em caravanas e, quando solicitado, enviar a newsletter. Dados de atendimento ficam acessíveis somente à equipe autorizada.
          </p>
          <p>
            A newsletter exige confirmação por e-mail e pode ser cancelada pelo link enviado ao inscrito. Não usamos a inscrição para ocultar se um endereço já existe em nossa base.
          </p>
          <p>
            Cookies essenciais mantêm preferências e segurança. Google Analytics, Google Tag Manager e Meta Pixel somente são carregados após a escolha “Aceitar analíticos”. A preferência pode ser revista a qualquer momento e expira em até 180 dias.
          </p>
          <p>
            Avaliações do Google, quando a integração for ativada, serão exibidas com sua origem identificada. Credenciais de serviços e tokens nunca são enviados ao navegador.
          </p>
          <p>
            A Leehov pode configurar destinos externos de automação por Webhooks. Nesses casos, enviamos apenas os identificadores e dados mínimos necessários ao evento, com assinatura de autenticidade, histórico de entrega e retenção limitada. O destino escolhido passa a tratar esses dados conforme sua própria política de privacidade.
          </p>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Este texto precisa de revisão jurídica antes do deploy em produção.
          </p>
        </div>
      </div></section>
    </main>
  );
}

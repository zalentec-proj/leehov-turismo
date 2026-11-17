import { EraseMeasurement } from "@/features/conversions/components/erase-measurement";

export const metadata = {
  title: "Política de Privacidade",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PrivacyPage() {
  return (
    <main className="bg-white pb-24">
      <header className="bg-leehov-navy-950 px-10 pb-24 pt-40 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-300">Privacidade e transparência</p><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Política de Privacidade</h1><p className="mt-5 leading-7 text-white/65">Como tratamos dados de contato, inscrições, preferências e integrações do site.</p></div></header>
      <section className="px-10 pt-16 sm:px-8 lg:px-12"><div className="mx-auto max-w-3xl">
        <div className="space-y-6 leading-8 text-leehov-muted">
          <p>
            A Leehov usa os dados informados nos formulários para responder contatos, registrar interesses em pacotes e, quando solicitado, enviar a newsletter. Dados de atendimento ficam acessíveis somente à equipe autorizada.
          </p>
          <p>
            A newsletter exige confirmação por e-mail e pode ser cancelada pelo link enviado ao inscrito. Não usamos a inscrição para ocultar se um endereço já existe em nossa base.
          </p>
          <p>
            Cookies essenciais mantêm preferências e segurança. Google Analytics, Google Tag Manager e Meta Pixel somente são carregados após a escolha “Aceitar analíticos”. A preferência pode ser revista a qualquer momento e expira em até 180 dias.
          </p>
          <p>
            Com sua autorização, a Leehov mede visitas, interesse em caravanas e cliques no WhatsApp no próprio site. Identificadores aleatórios ajudam a reconhecer a origem da visita por até 30 dias. Uma referência sem dados pessoais pode ser adicionada ao WhatsApp para a equipe associar a conversa, caso você envie a mensagem. O site não lê suas conversas. Você pode rever o aceite; os eventos de navegação são mantidos por até 180 dias.
          </p>
          <EraseMeasurement />
          <p>
            Após um aceite que inclua a OpenAI, enviamos o evento de clique em links de WhatsApp pelo navegador e pelo servidor para medir campanhas. O mesmo identificador de evento permite contar cada clique uma vez. Quando disponível, a referência do anúncio é mantida na sessão da aba e pode acompanhar o evento. O envio contém o horário e a página do clique, sem conteúdo de formulários ou mensagens. Você pode retirar a permissão em “Rever cookies”.
          </p>
          <p>
            Avaliações do Google, quando a integração for ativada, serão exibidas com sua origem identificada. Credenciais de serviços e tokens nunca são enviados ao navegador.
          </p>
          <p>
            Para medir campanhas, a Leehov pode enviar à Meta um evento de compra fechado no RD Station CRM. O evento contém valor, moeda, data, roteiro e identificadores de correspondência — como e-mail, telefone, ID do contato e, quando disponível, nome — transformados em hash SHA-256 antes do envio. Não enviamos nome, e-mail, telefone, mensagens, documentos ou o payload completo em texto aberto para essa finalidade.
          </p>
          <p>
            Esse compartilhamento ocorre conforme o consentimento para tecnologias analíticas quando aplicável ou outra base legal adotada pela Leehov. A Meta trata os dados recebidos segundo os próprios termos e política de privacidade. A Leehov mantém controles de acesso, registros operacionais mínimos e não armazena o payload completo da conversão.
          </p>
        </div>
      </div></section>
    </main>
  );
}

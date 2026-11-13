# Conversões e Leads

**Objetivo:** acompanhar a origem da visita e os resultados reais do atendimento no admin da Leehov, com dados no Supabase. A base é a main `592e459`, que já inclui o Pixel OpenAI por Image Tag.

1. Validar a origem (Google Ads, Meta Ads, ChatGPT Ads, orgânico, referência e outros), guardar a primeira origem e a sessão e aplicar a última origem não direta na conversão dentro de 30 dias. Usar apenas dados permitidos e sanitizados. Revisar cookies deve interromper a medição.
2. Registrar visitas, visualizações de caravanas e tentativas no servidor. Anexar referência opaca ao WhatsApp sem aguardar rede nem interferir no Pixel existente. Em formulários, associar a medição apenas quando houver aceite e registrar o envio após persistir o lead.
3. Evoluir o CRM leve: deduplicar novos registros pelo telefone, manter interesses, vincular referências e confirmar contatos manualmente, registrar etapas, valores, cancelamentos e auditoria. Preservar os status legados.
4. Exibir totais, evolução diária, campanhas, caravanas e funil de coorte com filtros, exportação protegida e investimento manual por moeda e período comparável. Separar origem observada de informada, e tráfego medido de resultados operacionais.
5. Validar com testes de navegador desktop/mobile, unitários e PostgreSQL isolado; preservar o Pixel e verificar permissões e idempotência. Sem mudanças externas, migrations remotas, commit ou publicação.

# **Como lidar com dados de venda falsos**

Squad UGC • Controle de vendas informadas pelas marcas

Não dá para eliminar, só tornar a fraude **cara, detectável e pouco vantajosa**. Toda rede de afiliados convive com isso. O que funciona, em ordem de impacto:

# **1\. Tire o incentivo de mentir**

Se 100% da receita depende da venda que a marca declara, ela tem motivo para esconder. Cobre a contratação de UGC como fixo antecipado e deixe a comissão como variável em cima. Assim, quando a marca subnotifica, perde-se margem, não o negócio.

# **2\. Tenha um sinal que a marca não controla**

O link do creator passa por um redirect do Squad UGC antes de chegar na loja. Isso permite contar cliques por creator sem depender de ninguém. Com isso o n8n compara:

* Creator com 800 cliques e zero venda declarada: alerta.

* Conversão da marca muito abaixo do histórico dela ou da média das outras marcas na mesma categoria: alerta.

O próprio BI vira o detector de fraude: quanto mais marcas, mais fácil ver quem está fora da curva.

# **3\. Compra-teste**

Uma ou duas compras pequenas por mês com cupom de creator, em cada marca. Se o pedido não aparecer no relatório, há prova concreta. Custa pouco e é o controle mais forte que existe. Coloque no contrato que isso pode acontecer: só o aviso já inibe.

# **4\. Creator como auditor**

Mostre ao creator os cliques e as vendas dele no painel. Seguidora que comprou avisa a creator, e a creator reclama com o Squad UGC. São dezenas de fiscais de graça.

# **5\. Contrato com dente**

* Direito de auditoria: acesso de leitura ao painel da loja quando houver divergência.

* Multa por omissão, por exemplo 10 vezes a comissão sonegada.

* Arquivo obrigatoriamente no export nativo da plataforma, não em planilha digitada.

# **6\. Prefira dado que vem da fonte**

Webhook e API entregam o pedido direto da plataforma, sem a marca editar. Por isso a planilha é a porta de entrada, mas a integração é para onde se empurra todo cliente que cresce. Dá para incentivar: taxa menor para quem integra.

# **O ponto que afeta o BI**

Dado falso contamina o benchmark que será vendido. Grave em cada venda a **origem** (API ou planilha) e use só o dado verificado nos relatórios de mercado. Planilha serve para pagar comissão; API serve para vender inteligência.

# **O que implantar agora**

Fixo antecipado, redirect com contagem de cliques e a cláusula de auditoria com compra-teste. Os três são baratos, cabem numa pessoa só, e o alerta de conversão anormal roda sozinho no n8n. O restante entra conforme o volume crescer.
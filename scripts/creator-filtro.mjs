// Filtro compartilhado (Instagram e TikTok): pessoa creator × marca/loja × página, e Brasil de verdade.
export const CREATOR = /\bugc\b|creator|criador[ae]? de conte[uú]do|influenc|parcerias?|publi|m[ií]dia ?kit|media ?kit|contato comercial|comercial:|collab|presskit|portf[oó]lio/i;
export const BRAND = /\bloja\b|compre|comprar|frete|envio para|enviamos|atacado|varejo|cnpj|pedidos?|encomend|delivery|whats.*pedido|site oficial|loja oficial|cat[aá]logo|cupom de desconto da loja|distribuidora|ind[uú]stria|fábrica|fabrica|ltda|\bme\b|eireli/i;
export const BRAND_CAT = /shopping|retail|brand|product\/service|clothing|cosmetics store|beauty, cosmetic|e-commerce|company|business|store|restaurant|food & beverage|health\/beauty$/i;
// páginas (frases, fofoca, notícias) e vendedores de curso de UGC não entregam conteúdo para marca
export const PAGE = /frases|versos|mensage(m|ns)|t[eé]cnicas de conquista|te ajudando se relacionar|reflex[oõ]es|memes?|curiosidades|not[ií]cias|jornal|portal|cobrimos|fofoca|famosos|celebridades|palavras para|vers[ií]culo|ora[cç][aã]o|motiva[cç][aã]o di[aá]ria|\bensino\b|mentoria|mentora|\bcurso\b|aprenda a|m[eé]todo .*ugc/i;
// Brasil de verdade (não basta "português": espanhol e Portugal ficam de fora)
const BR_STRONG = /🇧🇷|\bbrasil\b|\bbrazil\b|brasileir|\+55|\(\d{2}\)\s?9?\d{4}|\b(SP|RJ|MG|BH|PR|RS|SC|BA|PE|CE|GO|DF|ES|PA|AM|MT|MS|PB|RN|AL|SE|PI|MA|TO|RO|AC|AP|RR)\b|s[aã]o paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|salvador|recife|fortaleza|bras[ií]lia|goi[aâ]nia|florian[oó]polis|campinas|manaus|bel[eé]m|vit[oó]ria|natal|jo[aã]o pessoa|macei[oó]|aracaju|teresina|cuiab[aá]|santos/;
export const PT_BR = /[ãõ]|\b(voc[eê]s?|conte[uú]do|parcerias?|contato|n[aã]o|tamb[eé]m|minha|meu|pra)\b/i;
export const ES = /ñ|¿|¡|\b(contenido|creadora de contenido|colaboraciones|también|aquí|mexic|argentin|colombi|españa|chile|per[uú]|cdmx|buenos aires)\b|🇲🇽|🇦🇷|🇨🇴|🇪🇸|🇨🇱|🇵🇪|🇺🇾|🇻🇪/i;
export const PORTUGAL = /🇵🇹|\bportugal\b|lisboa|\+351|\bporto\b(?!\s*alegre)/i;
export const isBrazil = (t) => (BR_STRONG.test(t) || /brasil|brazil|s[aã]o paulo|rio de janeiro/i.test(t) || PT_BR.test(t)) && !ES.test(t) && !PORTUGAL.test(t);

export function classify(p) {
  const bio = `${p.biography || ''} ${p.fullName || ''}`;
  const cat = p.businessCategoryName || '';
  const isBrand = BRAND.test(bio) || (BRAND_CAT.test(cat) && !/creator|blogger|influencer|personal|public figure|artist|digital/i.test(cat));
  // a pessoa precisa se apresentar como creator NA BIO (categoria "criador digital" sozinha pega páginas de frases/memes)
  const isPage = PAGE.test(bio);
  const isCreator = CREATOR.test(bio) && !isPage;
  return { creator: isCreator && !isBrand, brand: isBrand, page: isPage, br: isBrazil(bio) };
}
console.assert(classify({ biography: 'UGC creator ✨ parcerias: contato@x.com' }).creator, 'creator');
console.assert(!classify({ biography: 'Loja de roupas 🛍️ enviamos para todo Brasil' }).creator, 'marca');
console.assert(!classify({ biography: 'Tudo sobre o mundo dos famosos! publi: contato' }).creator && !classify({ biography: 'Ensino a ganhar R$ como UGC' }).creator, 'pagina/mentor');
console.assert(classify({ biography: 'UGC creator 🇧🇷 São Paulo' }).br && !classify({ biography: 'Creadora de contenido UGC 🇲🇽' }).br && !classify({ biography: 'UGC creator | Lisboa 🇵🇹' }).br && !classify({ biography: 'UGC creator based in LA' }).br, 'brasil');

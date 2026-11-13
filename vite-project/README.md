# Tech & Cia

Protótipo de loja virtual de eletrônicos feito com React e Vite. O catálogo
inicial permite buscar produtos, adicionar e ajustar itens no carrinho e
cadastrar, editar ou excluir produtos na área administrativa.

## Executar localmente

```sh
npm install
npm run dev
```

O catálogo e o carrinho são armazenados no `localStorage` do navegador. Os
dados são locais a cada navegador e não substituem uma API ou um sistema de
autenticação para uso em produção.

## Importar produtos de uma API

Abra **Carregar catálogo de uma API**, informe a URL da rota e carregue a lista.
A rota precisa retornar um array JSON com produtos que tenham nome e preço.
São aceitos os nomes de campo `name`/`nome`/`title`/`titulo` e
`price`/`preco`/`valor`. Descrição e categoria são opcionais; podem usar
`description`/`descricao` e `category`/`categoria`.

Também é possível definir a URL inicial no ambiente de desenvolvimento usando
a variável `VITE_API_URL`.

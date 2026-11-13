import { useState } from 'react'
import './App.css'

const STORAGE_KEY = 'ptac-store-products'
const CART_KEY = 'ptac-store-cart'

const produtosIniciais = [
  {
    id: 'fone-bluetooth',
    name: 'Fone Bluetooth',
    description: 'Som nítido e confortável para acompanhar sua rotina.',
    category: 'Áudio',
    price: 189.9,
  },
  {
    id: 'teclado-mecanico',
    name: 'Teclado Mecânico',
    description: 'Teclas responsivas para trabalhar e jogar.',
    category: 'Periféricos',
    price: 329.9,
  },
  {
    id: 'mouse-sem-fio',
    name: 'Mouse sem fio',
    description: 'Precisão e liberdade com conexão sem fio.',
    category: 'Periféricos',
    price: 119.9,
  },
  {
    id: 'monitor-full-hd',
    name: 'Monitor Full HD',
    description: 'Imagem nítida para estudos, trabalho e entretenimento.',
    category: 'Monitores',
    price: 899.9,
  },
]

const formularioVazio = {
  name: '',
  description: '',
  category: '',
  price: '',
}

function lerArmazenamento(chave, valorInicial) {
  try {
    const salvo = localStorage.getItem(chave)
    if (salvo === null) return { value: valorInicial, error: '' }

    const valor = JSON.parse(salvo)
    return Array.isArray(valor)
      ? { value: valor, error: '' }
      : { value: valorInicial, error: 'Os dados locais estavam em um formato inesperado.' }
  } catch {
    return {
      value: valorInicial,
      error: 'Não foi possível ler os dados salvos neste navegador.',
    }
  }
}

function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

function normalizarProduto(item, indice) {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return null
  }

  const nome = item.name ?? item.nome ?? item.title ?? item.titulo
  const preco = Number(item.price ?? item.preco ?? item.valor)

  if (typeof nome !== 'string' || nome.trim() === '' || !Number.isFinite(preco) || preco < 0) {
    return null
  }

  return {
    id: String(item.id ?? item._id ?? `api-${indice}-${nome}`),
    name: nome.trim(),
    description: String(item.description ?? item.descricao ?? ''),
    category: String(item.category ?? item.categoria ?? 'Eletrônicos'),
    price: preco,
  }
}

function App() {
  const [dadosIniciais] = useState(() => ({
    produtos: lerArmazenamento(STORAGE_KEY, produtosIniciais),
    carrinho: lerArmazenamento(CART_KEY, []),
  }))
  const [produtos, setProdutos] = useState(() => {
    return dadosIniciais.produtos.value
  })
  const [carrinho, setCarrinho] = useState(() => {
    return dadosIniciais.carrinho.value
  })
  const [busca, setBusca] = useState('')
  const [urlApi, setUrlApi] = useState(import.meta.env.VITE_API_URL ?? '')
  const [carregandoApi, setCarregandoApi] = useState(false)
  const [erroApi, setErroApi] = useState('')
  const [aviso, setAviso] = useState(() => (
    [dadosIniciais.produtos.error, dadosIniciais.carrinho.error]
      .filter(Boolean)
      .join(' ')
  ))
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null)
  const [formulario, setFormulario] = useState(formularioVazio)

  function salvarCatalogo(novosProdutos, mensagem) {
    setProdutos(novosProdutos)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosProdutos))
      setAviso(mensagem)
    } catch {
      setAviso('Não foi possível salvar o catálogo neste navegador.')
    }
  }

  function salvarCarrinho(novoCarrinho, mensagem) {
    setCarrinho(novoCarrinho)
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(novoCarrinho))
      setAviso(mensagem)
    } catch {
      setAviso('Não foi possível salvar o carrinho neste navegador.')
    }
  }

  const produtosFiltrados = produtos.filter(produto => {
    const texto = `${produto.name} ${produto.description} ${produto.category}`.toLocaleLowerCase('pt-BR')
    return texto.includes(busca.trim().toLocaleLowerCase('pt-BR'))
  })

  const quantidadeNoCarrinho = carrinho.reduce((total, item) => total + item.quantity, 0)
  const totalCarrinho = carrinho.reduce((total, item) => {
    const produto = produtos.find(itemProduto => itemProduto.id === item.id)
    return total + (produto ? produto.price * item.quantity : 0)
  }, 0)

  function adicionarAoCarrinho(produto) {
    const existente = carrinho.find(item => item.id === produto.id)
    const novoCarrinho = existente
      ? carrinho.map(item => (
        item.id === produto.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
      : [...carrinho, { id: produto.id, quantity: 1 }]

    salvarCarrinho(novoCarrinho, `${produto.name} adicionado ao carrinho.`)
  }

  function alterarQuantidade(id, variacao) {
    const novoCarrinho = carrinho
      .map(item => (
        item.id === id ? { ...item, quantity: item.quantity + variacao } : item
      ))
      .filter(item => item.quantity > 0)
    salvarCarrinho(novoCarrinho, 'Carrinho atualizado.')
  }

  function iniciarEdicao(produto) {
    setProdutoEmEdicao(produto.id)
    setFormulario({
      name: produto.name,
      description: produto.description,
      category: produto.category,
      price: String(produto.price),
    })
  }

  function cancelarEdicao() {
    setProdutoEmEdicao(null)
    setFormulario(formularioVazio)
  }

  function salvarProduto(event) {
    event.preventDefault()
    const preco = Number(formulario.price)

    if (!formulario.name.trim() || !Number.isFinite(preco) || preco < 0) {
      setAviso('Informe um nome e um preço válido para o produto.')
      return
    }

    const dadosProduto = {
      name: formulario.name.trim(),
      description: formulario.description.trim(),
      category: formulario.category.trim() || 'Eletrônicos',
      price: preco,
    }

    if (produtoEmEdicao !== null) {
      const atualizados = produtos.map(produto => (
        produto.id === produtoEmEdicao ? { ...produto, ...dadosProduto } : produto
      ))
      salvarCatalogo(atualizados, 'Produto atualizado.')
    } else {
      salvarCatalogo([
        ...produtos,
        { id: `produto-${Date.now()}`, ...dadosProduto },
      ], 'Produto cadastrado.')
    }

    cancelarEdicao()
  }

  function excluirProduto(id) {
    const produto = produtos.find(item => item.id === id)
    salvarCatalogo(
      produtos.filter(item => item.id !== id),
      `${produto?.name ?? 'Produto'} excluído do catálogo.`,
    )
    const novoCarrinho = carrinho.filter(item => item.id !== id)
    if (novoCarrinho.length !== carrinho.length) {
      salvarCarrinho(novoCarrinho, 'Carrinho atualizado.')
    }
    if (produtoEmEdicao === id) cancelarEdicao()
  }

  async function carregarCatalogoApi(event) {
    event.preventDefault()
    setCarregandoApi(true)
    setErroApi('')
    setAviso('')

    try {
      const resposta = await fetch(urlApi)
      if (!resposta.ok) {
        throw new Error(`A API respondeu com status ${resposta.status}.`)
      }

      const dados = await resposta.json()
      if (!Array.isArray(dados)) {
        throw new Error('A resposta da API precisa ser uma lista JSON de produtos.')
      }

      const catalogo = dados.map(normalizarProduto).filter(Boolean)
      if (dados.length > 0 && catalogo.length === 0) {
        throw new Error('Nenhum produto válido foi encontrado. Cada item precisa de nome e preço.')
      }

      salvarCatalogo(catalogo, `${catalogo.length} produtos carregados da API.`)
      salvarCarrinho([], 'Carrinho limpo após carregar o catálogo.')
    } catch (error) {
      setErroApi(error instanceof TypeError
        ? 'Não foi possível acessar a API. Verifique a URL, a conexão e o CORS.'
        : error.message)
    } finally {
      setCarregandoApi(false)
    }
  }

  return (
    <main className="store">
      <header className="store-header">
        <a className="brand" href="#inicio" aria-label="Tech & Cia, início">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>tech<span className="brand-highlight">&</span>cia</span>
        </a>
        <a className="cart-link" href="#carrinho">
          Carrinho <span className="cart-count">{quantidadeNoCarrinho}</span>
        </a>
      </header>

      <section className="hero" id="inicio">
        <div>
          <p className="eyebrow">Tecnologia para o seu dia a dia</p>
          <h1>Encontre seu próximo favorito.</h1>
          <p>Explore produtos selecionados para trabalhar, estudar e se divertir.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span>⌁</span>
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Nossa seleção</p>
            <h2 id="catalog-title">Catálogo de produtos</h2>
          </div>
          <label className="search-box">
            <span className="visually-hidden">Buscar produtos</span>
            <span aria-hidden="true">⌕</span>
            <input
              onChange={event => setBusca(event.target.value)}
              placeholder="Buscar produtos"
              type="search"
              value={busca}
            />
          </label>
        </div>

        {produtosFiltrados.length === 0 ? (
          <p className="empty-state">Nenhum produto encontrado para essa busca.</p>
        ) : (
          <ul className="product-grid">
            {produtosFiltrados.map((produto, indice) => (
              <li className="product-card" key={produto.id}>
                <div className={`product-art product-art-${indice % 4}`} aria-hidden="true">
                  <span>{produto.category.slice(0, 1).toUpperCase()}</span>
                </div>
                <div className="product-info">
                  <p className="product-category">{produto.category}</p>
                  <h3>{produto.name}</h3>
                  <p className="product-description">
                    {produto.description || 'Qualidade e praticidade para sua rotina.'}
                  </p>
                  <div className="product-buy">
                    <strong>{formatarPreco(produto.price)}</strong>
                    <button onClick={() => adicionarAoCarrinho(produto)} type="button">
                      Adicionar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cart-section" id="carrinho" aria-labelledby="cart-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sua seleção</p>
            <h2 id="cart-title">Carrinho</h2>
          </div>
        </div>
        {carrinho.length === 0 ? (
          <p className="empty-state">Seu carrinho está vazio. Adicione produtos do catálogo.</p>
        ) : (
          <>
            <ul className="cart-list">
              {carrinho.map(item => {
                const produto = produtos.find(itemProduto => itemProduto.id === item.id)
                if (!produto) return null

                return (
                  <li className="cart-item" key={item.id}>
                    <div>
                      <strong>{produto.name}</strong>
                      <span>{formatarPreco(produto.price)}</span>
                    </div>
                    <div className="quantity-controls" aria-label={`Quantidade de ${produto.name}`}>
                      <button
                        aria-label={`Remover uma unidade de ${produto.name}`}
                        onClick={() => alterarQuantidade(item.id, -1)}
                        type="button"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`Adicionar uma unidade de ${produto.name}`}
                        onClick={() => alterarQuantidade(item.id, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="cart-total"><span>Total</span><strong>{formatarPreco(totalCarrinho)}</strong></p>
          </>
        )}
      </section>

      <section className="admin-section" aria-labelledby="admin-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gestão da loja</p>
            <h2 id="admin-title">Área administrativa</h2>
          </div>
        </div>

        <form className="product-form" onSubmit={salvarProduto}>
          <h3>{produtoEmEdicao !== null ? 'Editar produto' : 'Cadastrar produto'}</h3>
          <div className="form-grid">
            <label>
              Nome
              <input
                onChange={event => setFormulario({ ...formulario, name: event.target.value })}
                required
                value={formulario.name}
              />
            </label>
            <label>
              Categoria
              <input
                onChange={event => setFormulario({ ...formulario, category: event.target.value })}
                placeholder="Eletrônicos"
                value={formulario.category}
              />
            </label>
            <label>
              Preço (R$)
              <input
                min="0"
                onChange={event => setFormulario({ ...formulario, price: event.target.value })}
                required
                step="0.01"
                type="number"
                value={formulario.price}
              />
            </label>
            <label className="description-field">
              Descrição
              <input
                onChange={event => setFormulario({ ...formulario, description: event.target.value })}
                value={formulario.description}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {produtoEmEdicao !== null ? 'Salvar alterações' : 'Cadastrar produto'}
            </button>
            {produtoEmEdicao !== null && (
              <button className="secondary-button" onClick={cancelarEdicao} type="button">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <ul className="admin-list">
          {produtos.map(produto => (
            <li className="admin-item" key={produto.id}>
              <div>
                <strong>{produto.name}</strong>
                <span>{produto.category} · {formatarPreco(produto.price)}</span>
              </div>
              <div className="admin-actions">
                <button className="text-button" onClick={() => iniciarEdicao(produto)} type="button">
                  Editar
                </button>
                <button className="delete-button" onClick={() => excluirProduto(produto.id)} type="button">
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="api-section" aria-labelledby="api-title">
        <details>
          <summary id="api-title">Carregar catálogo de uma API</summary>
          <p>
            A rota deve retornar uma lista JSON com nome e preço. Campos em português
            ou inglês são aceitos (por exemplo, <code>nome</code>/<code>preco</code>).
          </p>
          <form className="api-form" onSubmit={carregarCatalogoApi}>
            <label htmlFor="api-url">URL completa da listagem</label>
            <div className="api-controls">
              <input
                id="api-url"
                onChange={event => setUrlApi(event.target.value)}
                placeholder="http://localhost:3000/produtos"
                required
                type="url"
                value={urlApi}
              />
              <button disabled={carregandoApi} type="submit">
                {carregandoApi ? 'Carregando...' : 'Carregar produtos'}
              </button>
            </div>
          </form>
          {erroApi && <p className="error-message" role="alert">{erroApi}</p>}
        </details>
      </section>

      {aviso && <p className="status-message" role="status">{aviso}</p>}
      <footer className="store-footer">Tech & Cia · Sua loja de tecnologia</footer>
    </main>
  )
}

export default App

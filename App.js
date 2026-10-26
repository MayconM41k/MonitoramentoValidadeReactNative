import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@monitor_validade_produtos';

// Utilitário para formatar data (DD/MM/AAAA)
const formatarData = (data) => {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

// Dados de exemplo para o app nunca iniciar vazio na apresentação
const obterProdutosIniciais = () => {
  const hoje = new Date();

  const vencido = new Date(hoje);
  vencido.setDate(hoje.getDate() - 3);

  const hojeData = new Date(hoje);

  const urgente = new Date(hoje);
  urgente.setDate(hoje.getDate() + 2);

  const seguro = new Date(hoje);
  seguro.setDate(hoje.getDate() + 45);

  return [
    {
      id: '1',
      nome: 'Iogurte Natural',
      categoria: 'GELADEIRA',
      dataValidade: formatarData(vencido),
      quantidade: '2 potes',
    },
    {
      id: '2',
      nome: 'Leite Integral',
      categoria: 'GELADEIRA',
      dataValidade: formatarData(hojeData),
      quantidade: '1 litro',
    },
    {
      id: '3',
      nome: 'Amoxicilina 500mg',
      categoria: 'MEDICAMENTOS',
      dataValidade: formatarData(urgente),
      quantidade: '1 frasco',
    },
    {
      id: '4',
      nome: 'Paracetamol 750mg',
      categoria: 'MEDICAMENTOS',
      dataValidade: formatarData(seguro),
      quantidade: '1 caixa',
    },
  ];
};

// Converte string "DD/MM/AAAA" para objeto Date
const converterDataParaObjeto = (dataStr) => {
  if (!dataStr || dataStr.length !== 10) return new Date();
  const [dia, mes, ano] = dataStr.split('/').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  return data;
};

// Calcula a quantidade de dias restantes até o vencimento
const calcularDiasRestantes = (dataStr) => {
  const dataValidade = converterDataParaObjeto(dataStr);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diferencaTempo = dataValidade.getTime() - hoje.getTime();
  return Math.round(diferencaTempo / (1000 * 60 * 60 * 24));
};

// Retorna cores e texto de status com base na urgência
const obterStatusValidade = (dias) => {
  if (dias < 0) {
    return {
      tipo: 'VENCIDO',
      texto: dias === -1 ? 'Venceu ontem' : `Vencido há ${Math.abs(dias)} dias`,
      corTexto: '#b91c1c',
      corFundo: '#fee2e2',
      corBorda: '#ef4444',
      icone: 'alert-circle',
    };
  }
  if (dias === 0) {
    return {
      tipo: 'HOJE',
      texto: 'Vence hoje!',
      corTexto: '#c2410c',
      corFundo: '#ffedd5',
      corBorda: '#f97316',
      icone: 'warning',
    };
  }
  if (dias <= 3) {
    return {
      tipo: 'URGENTE',
      texto: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      corTexto: '#b45309',
      corFundo: '#fef3c7',
      corBorda: '#f59e0b',
      icone: 'time',
    };
  }
  return {
    tipo: 'SEGURO',
    texto: `Válido (${dias} dias)`,
    corTexto: '#15803d',
    corFundo: '#dcfce7',
    corBorda: '#22c55e',
    icone: 'checkmark-circle',
  };
};

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [modalVisivel, setModalVisivel] = useState(false);

  // Estados do formulário de cadastro
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('GELADEIRA');
  const [dataValidade, setDataValidade] = useState('');
  const [quantidade, setQuantidade] = useState('');

  // Carrega os dados salvos no AsyncStorage ao iniciar
  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const dadosSalvos = await AsyncStorage.getItem(STORAGE_KEY);
      if (dadosSalvos !== null) {
        setProdutos(JSON.parse(dadosSalvos));
      } else {
        // Primeira execução: define produtos de exemplo
        const iniciais = obterProdutosIniciais();
        setProdutos(iniciais);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(iniciais));
      }
    } catch (erro) {
      console.log('Erro ao carregar produtos:', erro);
    }
  };

  const salvarLista = async (novaLista) => {
    setProdutos(novaLista);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    } catch (erro) {
      console.log('Erro ao salvar produtos:', erro);
    }
  };

  // Aplica máscara automática DD/MM/AAAA enquanto digita
  const aplicarMascaraData = (texto) => {
    const apenasNumeros = texto.replace(/\D/g, '').slice(0, 8);
    if (apenasNumeros.length <= 2) {
      setDataValidade(apenasNumeros);
    } else if (apenasNumeros.length <= 4) {
      setDataValidade(`${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`);
    } else {
      setDataValidade(
        `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`
      );
    }
  };

  // Adiciona novo produto
  const adicionarProduto = () => {
    if (!nome.trim()) {
      mostrarAlerta('Atenção', 'Informe o nome do produto.');
      return;
    }

    if (dataValidade.length !== 10) {
      mostrarAlerta('Atenção', 'Informe a data completa no formato DD/MM/AAAA.');
      return;
    }

    // Validação básica da data
    const [dia, mes, ano] = dataValidade.split('/').map(Number);
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || ano < 2000 || ano > 2100) {
      mostrarAlerta('Data Inválida', 'Por favor, insira uma data válida.');
      return;
    }

    const novoItem = {
      id: Date.now().toString(),
      nome: nome.trim(),
      categoria,
      dataValidade,
      quantidade: quantidade.trim() || '1 un',
    };

    const novaLista = [...produtos, novoItem];
    salvarLista(novaLista);

    // Limpa os campos e fecha o modal
    setNome('');
    setDataValidade('');
    setQuantidade('');
    setCategoria('GELADEIRA');
    setModalVisivel(false);
  };

  // Confirmação e remoção de produto
  const confirmarExclusao = (item) => {
    if (Platform.OS === 'web') {
      const confirmou = window.confirm(`Remover "${item.nome}"?`);
      if (confirmou) {
        removerProduto(item.id);
      }
    } else {
      Alert.alert(
        'Remover Produto',
        `Deseja realmente remover "${item.nome}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: () => removerProduto(item.id) },
        ]
      );
    }
  };

  const removerProduto = (id) => {
    const listaFiltrada = produtos.filter((p) => p.id !== id);
    salvarLista(listaFiltrada);
  };

  const mostrarAlerta = (titulo, mensagem) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}: ${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  };

  // ORDENAÇÃO AUTOMÁTICA por proximidade de vencimento (mais urgente primeiro)
  const produtosOrdenados = [...produtos].sort((a, b) => {
    const dataA = converterDataParaObjeto(a.dataValidade);
    const dataB = converterDataParaObjeto(b.dataValidade);
    return dataA.getTime() - dataB.getTime();
  });

  // Filtragem combinada por categoria e por critério de validade
  const produtosFiltrados = produtosOrdenados.filter((item) => {
    // 1. Filtro por Categoria (Geladeira ou Medicamento)
    if (filtro !== 'TODOS' && item.categoria !== filtro) {
      return false;
    }

    // 2. Filtro por Critério de Status (Total, Vencidos, Atenção, No Prazo)
    const dias = calcularDiasRestantes(item.dataValidade);
    if (filtroStatus === 'VENCIDOS' && dias >= 0) return false;
    if (filtroStatus === 'ATENCAO' && (dias < 0 || dias > 3)) return false;
    if (filtroStatus === 'NOPRAZO' && dias <= 3) return false;

    return true;
  });

  // Métricas do Dashboard para apresentação
  const totalItens = produtos.length;
  const totalVencidos = produtos.filter((p) => calcularDiasRestantes(p.dataValidade) < 0).length;
  const totalUrgentes = produtos.filter((p) => {
    const dias = calcularDiasRestantes(p.dataValidade);
    return dias >= 0 && dias <= 3;
  }).length;
  const totalSeguros = produtos.filter((p) => calcularDiasRestantes(p.dataValidade) > 3).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitulo}>Monitor de Validade</Text>
          <Text style={styles.headerSubtitulo}>Geladeira & Medicamentos</Text>
        </View>
        <TouchableOpacity
          style={styles.botaoAdicionarTopo}
          onPress={() => setModalVisivel(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.textoBotaoTopo}>Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Painel de Resumo / Métricas Rápidas (Clicáveis para filtrar) */}
        <View style={styles.painelMetricas}>
          <TouchableOpacity
            style={[
              styles.cardMetrica,
              { borderColor: filtroStatus === 'TODOS' ? '#2563eb' : '#e2e8f0' },
              filtroStatus === 'TODOS' && styles.cardMetricaAtivo,
            ]}
            onPress={() => setFiltroStatus('TODOS')}
            activeOpacity={0.7}
          >
            <Text style={styles.numeroMetrica}>{totalItens}</Text>
            <Text style={styles.rotuloMetrica}>Total</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cardMetrica,
              {
                borderColor: filtroStatus === 'VENCIDOS' ? '#dc2626' : '#fca5a5',
                backgroundColor: '#fef2f2',
              },
              filtroStatus === 'VENCIDOS' && styles.cardMetricaAtivo,
            ]}
            onPress={() => setFiltroStatus(filtroStatus === 'VENCIDOS' ? 'TODOS' : 'VENCIDOS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.numeroMetrica, { color: '#dc2626' }]}>{totalVencidos}</Text>
            <Text style={[styles.rotuloMetrica, { color: '#b91c1c' }]}>Vencidos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cardMetrica,
              {
                borderColor: filtroStatus === 'ATENCAO' ? '#d97706' : '#fcd34d',
                backgroundColor: '#fffbeb',
              },
              filtroStatus === 'ATENCAO' && styles.cardMetricaAtivo,
            ]}
            onPress={() => setFiltroStatus(filtroStatus === 'ATENCAO' ? 'TODOS' : 'ATENCAO')}
            activeOpacity={0.7}
          >
            <Text style={[styles.numeroMetrica, { color: '#d97706' }]}>{totalUrgentes}</Text>
            <Text style={[styles.rotuloMetrica, { color: '#b45309' }]}>Atenção</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cardMetrica,
              {
                borderColor: filtroStatus === 'NOPRAZO' ? '#16a34a' : '#86efac',
                backgroundColor: '#f0fdf4',
              },
              filtroStatus === 'NOPRAZO' && styles.cardMetricaAtivo,
            ]}
            onPress={() => setFiltroStatus(filtroStatus === 'NOPRAZO' ? 'TODOS' : 'NOPRAZO')}
            activeOpacity={0.7}
          >
            <Text style={[styles.numeroMetrica, { color: '#16a34a' }]}>{totalSeguros}</Text>
            <Text style={[styles.rotuloMetrica, { color: '#15803d' }]}>No Prazo</Text>
          </TouchableOpacity>
        </View>

        {/* Barra indicadora caso um critério de status esteja ativo */}
        {filtroStatus !== 'TODOS' && (
          <View style={styles.barraFiltroAtivo}>
            <Text style={styles.textoFiltroAtivoInfo}>
              Filtrando por:{' '}
              <Text style={styles.destaqueFiltroAtivo}>
                {filtroStatus === 'VENCIDOS' && '🔴 Vencidos'}
                {filtroStatus === 'ATENCAO' && '🟡 Em Atenção (até 3 dias)'}
                {filtroStatus === 'NOPRAZO' && '🟢 No Prazo Seguro'}
              </Text>
            </Text>
            <TouchableOpacity onPress={() => setFiltroStatus('TODOS')} activeOpacity={0.7}>
              <Text style={styles.botaoLimparFiltroStatus}>Ver Todos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filtros por Categoria */}
        <View style={styles.containerFiltros}>
          <TouchableOpacity
            style={[styles.botaoFiltro, filtro === 'TODOS' && styles.botaoFiltroAtivo]}
            onPress={() => setFiltro('TODOS')}
          >
            <Text style={[styles.textoFiltro, filtro === 'TODOS' && styles.textoFiltroAtivo]}>
              Todos ({totalItens})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoFiltro, filtro === 'GELADEIRA' && styles.botaoFiltroAtivo]}
            onPress={() => setFiltro('GELADEIRA')}
          >
            <Text style={[styles.textoFiltro, filtro === 'GELADEIRA' && styles.textoFiltroAtivo]}>
              🧊 Geladeira
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoFiltro, filtro === 'MEDICAMENTOS' && styles.botaoFiltroAtivo]}
            onPress={() => setFiltro('MEDICAMENTOS')}
          >
            <Text style={[styles.textoFiltro, filtro === 'MEDICAMENTOS' && styles.textoFiltroAtivo]}>
              💊 Medicamentos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Itens com Ordenação e Cores de Urgência */}
        {produtosFiltrados.length === 0 ? (
          <View style={styles.containerVazio}>
            <Ionicons name="cube-outline" size={54} color="#94a3b8" />
            <Text style={styles.textoVazio}>Nenhum produto cadastrado nesta categoria.</Text>
            <Text style={styles.subtextoVazio}>Toque em "+ Novo" no topo para adicionar.</Text>
          </View>
        ) : (
          produtosFiltrados.map((item) => {
            const dias = calcularDiasRestantes(item.dataValidade);
            const status = obterStatusValidade(dias);

            return (
              <View
                key={item.id}
                style={[
                  styles.cardProduto,
                  { borderLeftColor: status.corBorda, borderLeftWidth: 5 },
                ]}
              >
                <View style={styles.infoProduto}>
                  <View style={styles.linhaTitulo}>
                    <Text style={styles.iconeCategoria}>
                      {item.categoria === 'GELADEIRA' ? '🧊' : '💊'}
                    </Text>
                    <Text style={styles.nomeProduto}>{item.nome}</Text>
                  </View>

                  <Text style={styles.detalhesProduto}>
                    Qtd: <Text style={styles.destaqueDetalhe}>{item.quantidade}</Text> • Vence em:{' '}
                    <Text style={styles.destaqueDetalhe}>{item.dataValidade}</Text>
                  </Text>

                  {/* Badge de Alerta Visual */}
                  <View style={[styles.badgeStatus, { backgroundColor: status.corFundo }]}>
                    <Ionicons name={status.icone} size={15} color={status.corTexto} />
                    <Text style={[styles.textoStatus, { color: status.corTexto }]}>
                      {status.texto}
                    </Text>
                  </View>
                </View>

                {/* Botão de Excluir */}
                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => confirmarExclusao(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Cadastro de Novo Produto */}
      <Modal visible={modalVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalCabecalho}>
              <Text style={styles.modalTitulo}>Cadastrar Produto</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Campo: Nome */}
            <Text style={styles.labelInput}>Nome do Produto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Leite Integral, Dipirona 500mg"
              value={nome}
              onChangeText={setNome}
              placeholderTextColor="#94a3b8"
            />

            {/* Campo: Categoria */}
            <Text style={styles.labelInput}>Categoria</Text>
            <View style={styles.seletorCategoria}>
              <TouchableOpacity
                style={[
                  styles.opcaoCategoria,
                  categoria === 'GELADEIRA' && styles.opcaoCategoriaAtiva,
                ]}
                onPress={() => setCategoria('GELADEIRA')}
              >
                <Text
                  style={[
                    styles.textoCategoria,
                    categoria === 'GELADEIRA' && styles.textoCategoriaAtivo,
                  ]}
                >
                  🧊 Geladeira
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.opcaoCategoria,
                  categoria === 'MEDICAMENTOS' && styles.opcaoCategoriaAtiva,
                ]}
                onPress={() => setCategoria('MEDICAMENTOS')}
              >
                <Text
                  style={[
                    styles.textoCategoria,
                    categoria === 'MEDICAMENTOS' && styles.textoCategoriaAtivo,
                  ]}
                >
                  💊 Medicamento
                </Text>
              </TouchableOpacity>
            </View>

            {/* Campo: Data de Validade */}
            <Text style={styles.labelInput}>Data de Vencimento (DD/MM/AAAA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 31/12/2026"
              value={dataValidade}
              onChangeText={aplicarMascaraData}
              keyboardType="numeric"
              maxLength={10}
              placeholderTextColor="#94a3b8"
            />

            {/* Campo: Quantidade / Observação */}
            <Text style={styles.labelInput}>Quantidade ou Embalagem</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2 potes, 1 caixa, 500ml"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholderTextColor="#94a3b8"
            />

            {/* Botões do Modal */}
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoSalvar}
                onPress={adicionarProduto}
              >
                <Text style={styles.textoBotaoSalvar}>Salvar Produto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitulo: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  botaoAdicionarTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
  },
  textoBotaoTopo: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  painelMetricas: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cardMetrica: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardMetricaAtivo: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  barraFiltroAtivo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textoFiltroAtivoInfo: {
    fontSize: 12,
    color: '#475569',
  },
  destaqueFiltroAtivo: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  botaoLimparFiltroStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  numeroMetrica: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  rotuloMetrica: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  containerFiltros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  botaoFiltro: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  botaoFiltroAtivo: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  textoFiltro: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  textoFiltroAtivo: {
    color: '#ffffff',
  },
  cardProduto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoProduto: {
    flex: 1,
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconeCategoria: {
    fontSize: 18,
  },
  nomeProduto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detalhesProduto: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  destaqueDetalhe: {
    fontWeight: '600',
    color: '#334155',
  },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  textoStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  botaoExcluir: {
    padding: 8,
    marginLeft: 8,
  },
  containerVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  textoVazio: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  subtextoVazio: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalConteudo: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
  },
  modalCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  labelInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
  },
  seletorCategoria: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  opcaoCategoria: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  opcaoCategoriaAtiva: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  textoCategoria: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  textoCategoriaAtivo: {
    color: '#2563eb',
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  botaoCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  textoBotaoCancelar: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  botaoSalvar: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  textoBotaoSalvar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

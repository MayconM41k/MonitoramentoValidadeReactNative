# ⏰ Monitor de Validade (Geladeira & Medicamentos)

Aplicativo mobile multiplataforma desenvolvido em **React Native com Expo**, com foco em simplicidade, facilidade de manutenção e alto valor prático para o dia a dia.

---

## 🎯 Objetivo do Projeto
Atender 100% aos requisitos do tema **Monitor de Validade (Geladeira e Medicamentos)**:
- Cadastro rápido de produtos com nome, categoria, data de vencimento e quantidade.
- **Ordenação automática por proximidade da data de validade** (o mais urgente sempre aparece no topo).
- **Alertas visuais de urgência baseados em cores**:
  - 🔴 **Vermelho**: Vencido.
  - 🟠 **Laranja**: Vence hoje.
  - 🟡 **Amarelo**: Atenção (vence nos próximos 3 dias).
  - 🟢 **Verde**: No prazo / Seguro (mais de 3 dias de validade).
- Filtros por categoria (Todos, 🧊 Geladeira e 💊 Medicamentos).
- Painel de métricas no topo com contagem em tempo real.
- Persistência local com `AsyncStorage` (os dados não se perdem ao fechar o app).
- Dados iniciais pré-carregados para demonstração imediata no Live Preview.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js instalado no computador.
- Celular físico com o aplicativo **Expo Go** instalado (disponível na Google Play Store e Apple App Store) **OU** navegador web no computador.

### Passo a passo

1. **Instalar dependências (caso seja clonado do GitHub)**:
   ```bash
   npm install
   ```

2. **Iniciar o aplicativo**:
   - Para rodar no celular físico ou emulador:
     ```bash
     npx expo start
     ```
     > Abra o app **Expo Go** no celular e escaneie o QR Code que aparecerá no terminal.
   
   - Para rodar diretamente no navegador web do computador (ideal para projetar na sala de aula):
     ```bash
     npx expo start --web
     ```

---

## 📂 Estrutura do Código

O projeto foi estruturado com código limpo e direto, em nível iniciante, facilitando o entendimento de cada linha:

```text
├── App.js           # Toda a interface, lógica de ordenação, validações e persistência
├── app.json         # Configurações do Expo (nome, ícone, orientações)
├── package.json     # Dependências do projeto (Expo, React Native, AsyncStorage)
└── README.md        # Documentação e roteiro técnico da apresentação
```

---

## 🎤 Estrutura Obrigatória da Apresentação Técnica

> *Este roteiro cobre na íntegra os 4 tópicos obrigatórios exigidos para a apresentação da dupla.*

### 1. Tecnologias Utilizadas
- **Framework Base**: **React Native** com ecossistema **Expo (SDK 58)**, permitindo compilação multiplataforma simultânea para Android, iOS e Web.
- **Gerenciamento de Estado**: Hooks nativos do React (`useState` para controle de inputs, listas e filtros; `useEffect` para ciclo de vida e carregamento inicial).
- **Persistência de Dados**: `@react-native-async-storage/async-storage` para armazenamento local assíncrono chave-valor diretamente no dispositivo.
- **Componentes Nativos & Ícones**: `@expo/vector-icons` (`Ionicons`) para iconografia vetorial e componentes nativos (`SafeAreaView`, `FlatList`, `Modal`, `TextInput`, `TouchableOpacity`, `Alert`).

---

### 2. Três Principais Desafios Técnicos Encontrados & Soluções

1. **Cálculo de Diferença de Dias e Tratamento de Datas**:
   - *Desafio*: Evitar discrepâncias de fuso horário e cálculos errados de "dias restantes" ao comparar a data atual com a data de validade digitada.
   - *Solução*: Criamos funções utilitárias puras (`converterDataParaObjeto` e `calcularDiasRestantes`) que normalizam as horas para meia-noite (`00:00:00`), garantindo cálculo exato de dias em qualquer dispositivo.

2. **Ordenação Automática em Tempo Real sem Perda de Performance**:
   - *Desafio*: Manter a lista sempre ordenada por urgência sem travar a interface quando o usuário cadastra ou remove itens.
   - *Solução*: Aplicamos o método `.sort()` ordenando pelo timestamp de vencimento antes da filtragem, garantindo que o item vencido ou mais próximo do vencimento suba imediatamente para o topo.

3. **Compatibilidade Multiplataforma (Celular e Navegador Web)**:
   - *Desafio*: O componente nativo `Alert.alert` com múltiplos botões de confirmação se comporta de maneira diferente no navegador web.
   - *Solução*: Implementamos uma checagem com `Platform.OS === 'web'` usando `window.confirm` no navegador e `Alert.alert` nativo no mobile, tornando a demonstração segura tanto em projetores com PC quanto no celular.

---

### 3. O Que Funcionou e O Que Melhoraria

- **O que funcionou perfeitamente**:
  - Cadastro rápido com máscara de digitação de data automática (`DD/MM/AAAA`).
  - Alertas visuais com cores muito claras e identificação por categorias.
  - Carregamento de dados instantâneo e persistência local 100% estável.
  - Dashboard superior que resume a quantidade de itens vencidos e com urgência.
- **O que seria refatorado/melhorado em uma versão futura**:
  - Adição de **notificações push locais** (`expo-notifications`) para avisar o usuário no celular quando faltarem 2 dias para o produto vencer.
  - Leitura de **código de barras** via câmera (`expo-camera`) para preencher automaticamente o nome do produto.
  - Separação de componentes em arquivos modulares (ex: `ProductCard.js`, `Header.js`, `Metrics.js`).

---

### 4. Lições Aprendidas e Experiência da Equipe
- **Domínio do fluxo do React Native**: Entendemos na prática como o React Native gerencia re-renderizações ao atualizar estados com `useState`.
- **Importância da validação de dados**: Percebemos que guiar o usuário com máscaras simples evita erros de digitação e garante que o cálculo de validade não quebre o app.
- **Trabalho em dupla**: Dividimos o desenvolvimento entre lógica de negócio (cálculo de datas e persistência) e design da interface (cores de urgência e responsividade), resultando em uma aplicação funcional e coesa.

---

## 🎬 Roteiro Sugerido para o Live Preview (Demonstração ao Vivo)

1. **Abertura (30s)**:
   - "Nosso aplicativo é o **Monitor de Validade para Geladeira e Medicamentos**."
   - Mostrar os 4 cards de métricas no topo e explicar que o app já abre com exemplos reais.
2. **Alertas por Cores e Ordenação Automática (45s)**:
   - Apontar o card vermelho (vencido no topo), o amarelo (atenção) e o verde (seguro).
   - Explicar que a ordenação é automática por proximidade de data.
3. **Filtros por Categoria (30s)**:
   - Tocar em "🧊 Geladeira" para ver apenas os alimentos.
   - Tocar em "💊 Medicamentos" para ver os remédios.
   - Voltar para "Todos".
4. **Cadastro ao Vivo (45s)**:
   - Clicar em "+ Novo", digitar um produto (ex: "Iogurte", "Geladeira", colocar a data de amanhã).
   - Salvar e mostrar que ele entra na lista já na cor correta de urgência e na posição certa.
5. **Persistência e Exclusão (30s)**:
   - Excluir um item com a confirmação.
   - Recarregar a tela para provar que os dados estão salvos no `AsyncStorage`.

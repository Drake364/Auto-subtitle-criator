# Guia de Contribuição — LegendaFácil AI 🤝

Agradecemos o seu interesse em contribuir com o **LegendaFácil AI**! Este documento orienta você sobre as diretrizes e o fluxo de trabalho para submeter melhorias, novas funcionalidades ou correções de bugs no GitHub.

---

## 📋 Código de Conduta

Ao participar deste projeto, você concorda em manter um ambiente acolhedor, respeitoso e livre de assédio para todos os colaboradores, independentemente do nível de experiência, identidade de gênero, orientação sexual, deficiência, aparência pessoal ou etnia.

---

## 🔄 Fluxo de Trabalho com Git & GitHub

### 1. Fazer um Fork do Repositório
No GitHub, clique no botão **Fork** no canto superior direito para criar uma cópia do projeto em sua conta pessoal.

### 2. Clonar o seu Fork Localmente
```bash
git clone https://github.com/SEU-USUARIO/legendafacil-ai.git
cd legendafacil-ai
```

### 3. Criar uma Nova Branch
Crie uma branch com um nome descritivo para a sua alteração:
```bash
# Para nova funcionalidade:
git checkout -b feat/nome-da-funcionalidade

# Para correção de bug:
git checkout -b fix/descricao-do-problema

# Para melhorias de documentação:
git checkout -b docs/atualizacao-readme
```

### 4. Instalar as Dependências e Iniciar o Ambiente
```bash
npm install
npm run dev
```

### 5. Fazer suas Modificações
- Mantenha o código limpo, modular e coeso.
- Adicione comentários objetivos quando a lógica envolver processamento de áudio ou cálculos de tempo de legendas.
- Preserve a convenção de IDs em elementos interativos HTML (`id="btn-..."`, `id="player-..."`).

### 6. Validar o Código
Antes de submeter o commit, certifique-se de que não existem erros de TypeScript e de compilação:
```bash
# Validação de tipos do TypeScript
npm run lint

# Teste de compilação do Vite
npm run build
```

### 7. Fazer o Commit das Alterações
Siga o padrão de **Conventional Commits**:
- `feat: adiciona novo formato de exportação (.ass)`
- `fix: corrige dessincronia no cálculo de timestamps em vídeos longos`
- `docs: atualiza instruções de variáveis de ambiente no README`
- `style: aprimora espaçamento dos botões no rodapé móvel`
- `refactor: otimiza fatiamento de áudio no Web Audio API`

```bash
git add .
git commit -m "feat: descrição objetiva da sua melhoria"
```

### 8. Enviar para o seu Fork e Abrir um Pull Request
```bash
git push origin sua-branch
```
No GitHub, acesse a página do seu fork e clique em **Compare & Pull Request**. Preencha a descrição explicando:
- O que foi alterado.
- Por que a alteração foi necessária.
- Como testar a alteração.

---

## 📐 Padrões de Código

- **Linguagem:** TypeScript estrito. Evite o uso de `any` sempre que possível; utilize ou estenda as interfaces em `src/types.ts`.
- **Estilização:** Tailwind CSS v4 diretamente nos elementos via classes utilitárias.
- **Ícones:** Utilize exclusivamente a biblioteca `lucide-react`. Não insira SVGs inline sem necessidade.
- **Animações:** Utilize o pacote `motion` (`motion/react`).
- **Segurança de Memória:** Funções que manipulam `File`, `Blob` ou `ArrayBuffer` devem evitar carregar arquivos inteiros na memória sem fatiamento se o tamanho exceder 25MB.

---

## 🐛 Relatando Bugs

Se você encontrar um bug:
1. Verifique se já não existe uma *Issue* aberta sobre o assunto.
2. Se não existir, abra uma nova *Issue* contendo:
   - Descrição clara do comportamento incorreto.
   - Passos reproduzíveis para manifestar o erro.
   - Formato e tamanho do vídeo utilizado (se aplicável).
   - Navegador e sistema operacional (ex: Chrome 124 no Windows 11 ou Android).

---

Agradecemos imensamente a sua contribuição para tornar o **LegendaFácil AI** cada vez melhor! 🚀

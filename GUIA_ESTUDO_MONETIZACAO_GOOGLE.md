# GUIA ESTRATÉGICO DE ESTUDO E IMPLANTAÇÃO: MONETIZAÇÃO NO GOOGLE
**Documento Exclusivo de Engenharia e Negócios para hermesriobranco@gmail.com**  
*Projeto: LegendaFácil AI (Auto Subtitle Generator Offline)*

---

## 1. Visão Geral do Modelo de Negócio

O mercado de criadores de conteúdo (Shorts, Reels, TikTok, Podcasts e YouTube) cresce exponencialmente. Mais de **80% dos usuários assistem vídeos em ambientes públicos sem som**, tornando legendas dinâmicas indispensáveis para retenção e engajamento.

A principal vantagem competitiva deste aplicativo em relação a concorrentes (como CapCut, Blink e AutoCap) é:
1. **100% Offline (Sem Servidor na Nuvem):** Custo de infraestrutura para você como desenvolvedor é **ZERO** (R$ 0,00 por transcrição), pois o processamento roda no processador do celular do usuário.
2. **Privacidade Absoluta:** O usuário não teme que seus vídeos e áudios confidenciais vazem para servidores de terceiros.
3. **Suporte a Vídeos Longos:** Concorrentes limitam a 1 ou 3 minutos no plano grátis; seu app suporta fatiamento de vídeos de 15 minutos até 3 horas.

---

## 2. O Modelo Freemium Híbrido Recomendado

| Recurso | Plano Gratuito (Monetizado via AdMob) | Plano Pro / VIP (Google Play Billing) |
| :--- | :--- | :--- |
| **Duração do Vídeo** | Vídeos Curtos (até 60s) gratuitos | Vídeos Longos Ilimitados (Podcasts, YouTube, Aulas) |
| **Anúncios** | Banners discretos + Recompensa para exportar | Zero Anúncios |
| **Estilos de Legenda** | Estilos Básicos (Clássico, Mínimo) | Todos os Estilos Virais (TikTok, MrBeast, Hormozi, Neon) |
| **Efeito Karaokê** | Disponível com anúncio recompensado | Totalmente liberado |
| **Exportação** | .SRT, .VTT com anúncio recompensado | .SRT, .VTT, .TXT e Vídeo Queimado sem marcas |
| **Preço Sugerido** | R$ 0,00 | R$ 19,90/mês ou R$ 89,90/vitalício |

---

## 3. Google AdMob: Implementação e Melhores Práticas

### A. Tipos de Anúncios Recomendados

1. **Rewarded Video Ads (Vídeos Recompensados) — *Maior eCPM (R$ 25 - R$ 80 a cada 1.000 visualizações)*:**
   - **Gatilho de Uso:** O usuário do plano gratuito clica em "Exportar Vídeo" ou "Processar Vídeo Longo".
   - **Mensagem:** *"Assista a um vídeo curto de 15 segundos para desbloquear a exportação em alta resolução sem pagar nada!"*.
   - **Benefício:** Taxa de aceitação superior a 85%, pois o usuário sente que está no controle e ganha um benefício claro.

2. **Adaptive Banner Ads (Banners Adaptativos no Rodapé) — *Renda Passiva Contínua*:**
   - Exibido discretamente no rodapé da tela do editor, longe dos controles de reprodução do vídeo para evitar cliques acidentais e penalidades do Google.

3. **Interstitial Ads (Anúncios Intersticiais de Tela Cheia):**
   - **Regra de Ouro:** NUNCA exiba durante a edição ou no momento em que o usuário está digitando.
   - **Momento Correto:** Apenas após a finalização com sucesso da exportação, enquanto o arquivo é salvo no aparelho.

### B. Código de Implementação Android (Google Mobile Ads SDK)

#### 1. Configuração do `build.gradle` (Module: app)
```groovy
dependencies {
    implementation 'com.google.android.gms:play-services-ads:23.0.0'
}
```

#### 2. Declaração no `AndroidManifest.xml`
```xml
<manifest>
    <application>
        <!-- ID do aplicativo AdMob (Obtido no painel do AdMob) -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
    </application>
</manifest>
```

#### 3. Carregamento do Anúncio Recompensado (Rewarded Ad em Kotlin)
```kotlin
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.gms.ads.LoadAdError

class AdMobManager(private val context: Context) {
    private var rewardedAd: RewardedAd? = null

    fun loadRewardedAd(adUnitId: String, onLoaded: () -> Unit) {
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(context, adUnitId, adRequest, object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                rewardedAd = ad
                onLoaded()
            }
            override fun onAdFailedToLoad(error: LoadAdError) {
                rewardedAd = null
            }
        })
    }

    fun showRewardAd(activity: Activity, onRewardGranted: () -> Unit) {
        rewardedAd?.show(activity) { rewardItem ->
            // Usuário assistiu o anúncio completo: libera a exportação!
            onRewardGranted()
            // Carrega o próximo anúncio em segundo plano
            loadRewardedAd("ID_DO_BLOCO") {}
        } ?: run {
            // Se o anúncio não carregou (ex: sem internet), libera para não travar o usuário
            onRewardGranted()
        }
    }
}
```

---

## 4. Google Play Billing: Assinaturas e Compras In-App

### A. Estrutura de Produtos no Google Play Console

1. **Assinatura Mensal (Auto-renovável):**
   - ID: `sub_pro_monthly`
   - Preço sugerido Brasil: R$ 19,90 / mês (com 3 dias de teste grátis).
   - Preço sugerido Internacional: $4.99 / month.

2. **Assinatura Anual (Maior LTV - Lifetime Value):**
   - ID: `sub_pro_annual`
   - Preço sugerido: R$ 99,90 / ano (equivalente a R$ 8,32/mês - 58% de desconto).

3. **Compra Única Vitalícia (One-time Purchase):**
   - ID: `inapp_pro_lifetime`
   - Preço sugerido: R$ 149,90. Ideal para usuários que odeiam mensalidades.

### B. Fluxo de Implementação do Google Play Billing Library 6+

#### 1. Configuração do `build.gradle`
```groovy
dependencies {
    implementation 'com.android.billingclient:billing-ktx:6.2.1'
}
```

#### 2. Inicialização e Conexão com o Google Play
```kotlin
import com.android.billingclient.api.*

class BillingManager(private val context: Context) : PurchasesUpdatedListener {
    private val billingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    fun startConnection(onReady: () -> Unit) {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    onReady()
                }
            }
            override fun onBillingServiceDisconnected() {
                // Tenta reconectar em caso de queda
            }
        })
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            // Desbloqueia recursos Pro permanentemente no SQLite / SharedPreferences local
            saveProStatusLocally(isPro = true)

            // Confirma a compra com o Google para evitar reembolso automático
            if (!purchase.isAcknowledged) {
                val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
                billingClient.acknowledgePurchase(acknowledgePurchaseParams) { }
            }
        }
    }
}
```

---

## 5. Checklist Passo a Passo para Publicação no Google Play Console

1. **Conta de Desenvolvedor Google Play:**
   - Taxa única de **$25 USD** no site oficial: `https://play.google.com/console/signup`.
   - Requer documento oficial e cartão de crédito internacional.

2. **Requisito dos 20 Testadores por 14 Dias (Para contas de pessoas físicas criadas após Nov/2023):**
   - O Google exige que seu aplicativo passe por um teste fechado com pelo menos 20 pessoas durante 14 dias antes de solicitar a publicação na loja aberta.
   - **Dica Prática:** Use comunidades de desenvolvedores (Reddit `r/AndroidClosedTesting`, grupos de criadores de conteúdo ou amigos/familiares) cadastrando seus e-mails na lista de Closed Testing.

3. **Classificação de Conteúdo & Declaração de Privacidade:**
   - Seu app tem **Privacidade por Design**: nenhum áudio sai do dispositivo.
   - Declare: *"O aplicativo não coleta, não transmite e não armazena dados de voz em servidores remotos. Toda transcrição é executada no próprio hardware local do usuário."* Isso garante aprovação rápida na verificação de segurança de dados do Google.

4. **ASO (App Store Optimization - Palavras-chave em Português):**
   - **Título:** *Legenda Automática para Vídeos - Offline & IA*
   - **Subtítulo:** *Gere legendas dinâmicas para Shorts, Reels, Podcasts e YouTube sem internet.*
   - **Tags estratégicas:** *legendas automáticas, legendas tiktok, auto subtitle, srt generator, transcrever áudio, podcast transcrição.*

---

## 6. Projeção de Faturamento Estimada (Cenário Realista)

Com base em 10.000 usuários ativos mensais (MAU) em 6 meses:

- **AdMob (Anúncios Recompensados + Banners):**
  - ~60.000 impressões/mês com eCPM médio de R$ 30,00 = **R$ 1.800,00 / mês**.
- **Assinaturas Google Play (Conversão de 1.5% para Plano Pro):**
  - 150 assinantes Pro a R$ 19,90/mês = **R$ 2.985,00 / mês**.
- **Compras Vitalícias (0.5% da base):**
  - 50 compras a R$ 149,90 (R$ 7.495,00 pontuais).
- **Custo de Servidor para você:** **R$ 0,00** (processamento 100% offline).
- **Margem Líquida Estimada:** **> 85%** (descontando apenas a taxa de 15% do Google Play).

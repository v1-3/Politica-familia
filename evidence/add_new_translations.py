"""Append Portuguese strings for the Jucimar and Lucca reports to report-locale.js."""
import json, re, subprocess
from pathlib import Path
root = Path(__file__).resolve().parent.parent
path = root / 'report-locale.js'
s = path.read_text(encoding='utf-8')

NAMES = {
 'Federalism':'Federalismo','Pragmatic Liberalism':'Liberalismo pragmático','Stalinist Socialism':'Socialismo stalinista','Liberalism':'Liberalismo','Democracy':'Democracia','Neutrality':'Neutralidade','Moderate':'Moderado','Civic Integration':'Integração cívica',
 'Argentina':'Argentina','Panama':'Panamá','Macau (China)':'Macau (China)','Washington, D.C. (United States)':'Washington, D.C. (Estados Unidos)','Polish-Lithuanian Commonwealth':'Comunidade Polaco-Lituana',
 'Brazil Union (UNIÃO)':'União Brasil (UNIÃO)','German Democratic Party (DDP)':'Partido Democrático Alemão (DDP)','Forza Italia (FI)':'Força Itália (FI)','Falange Española':'Falange Espanhola','Workers\' Party of Korea (WPK)':'Partido dos Trabalhadores da Coreia (WPK)',
 'Federal republic with market reforms':'República federal com reformas de mercado','Former Car Wash judge · 1972–':'Ex-juiz da Lava Jato · 1972–','Noble republic with an elected king · 1569–1795':'República nobiliárquica com rei eleito · 1569–1795','Party · 1918–1933 · Weimar Republic':'Partido · 1918–1933 · República de Weimar',
 'Pol Pot':'Pol Pot','Joseph Stalin':'Josef Stálin','Joseph Goebbels':'Joseph Goebbels',
 'An Inconvenient Truth':'Uma Verdade Inconveniente','Common Sense':'Senso Comum','Al Gore':'Al Gore',
 'I want a fiscally responsible liberal democracy, open to the world, far from heavy statism and libertarian radicalism.':'Quero uma democracia liberal fiscalmente responsável, aberta ao mundo e distante tanto do estatismo pesado quanto do radicalismo libertário.',
 'Center-right with Moderate social values':'Centro-direita com valores sociais moderados',
 'Christian Conservatism':'Conservadorismo cristão','Conservatism':'Conservadorismo','Alt-Lite':'Alt-Lite','Pragmatic Conservatism':'Conservadorismo pragmático','Techno-Communism':'Tecnocomunismo','Anarchist':'Anarquista',
 'Defensive Militarism':'Militarismo defensivo','Pragmatism':'Pragmatismo','Religious Conservatism':'Conservadorismo religioso',
 'Armenia':'Armênia','Croatia':'Croácia','Old Swiss Confederacy':'Antiga Confederação Suíça','Oregon (United States)':'Oregon (Estados Unidos)','Kingdom of Bavaria':'Reino da Baviera',
 'Canadian psychologist · 1962–':'Psicólogo canadense · 1962–','Constitutional-Catholic monarchy · 1805–1918':'Monarquia constitucional-católica · 1805–1918','National-diasporic republic':'República nacional-diaspórica','Party · 1945–1965 · Brazil (Vargas Era)':'Partido · 1945–1965 · Brasil (Era Vargas)',
 'Christian Democracy (DC)':'Democracia Cristã (DC)','Social Democratic Party (historical PSD)':'Partido Social Democrático (PSD histórico)','Freedom Party of Austria (FPÖ)':'Partido da Liberdade da Áustria (FPÖ)',"Brothers of Italy (Fratelli d'Italia)":"Irmãos da Itália (Fratelli d'Italia)",
 'Soviet Union (USSR)':'União Soviética (URSS)','Paris Commune':'Comuna de Paris','Subcomandante Marcos':'Subcomandante Marcos','Élisée Reclus':'Élisée Reclus','Ezra Heywood':'Ezra Heywood',
 '12 Rules for Life':'12 Regras para a Vida','Environmentalist Psychosis: Ecoterrorists Want to End Your Business':'Psicose ambientalista: ecoterroristas querem acabar com o seu negócio','Summa Theologica':'Suma Teológica',
 'I want a society faithful to Christian morals and faith, protecting family, life and inherited customs against the erosion of the times.':'Quero uma sociedade fiel à moral e à fé cristãs, que proteja a família, a vida e os costumes herdados contra a erosão dos tempos.',
 'Center-right with Strongly traditionalist social values':'Centro-direita com valores sociais fortemente tradicionalistas',
}
DESC = {
 'Liberal Centrism':'Vertente centrista favorável ao mercado que combina responsabilidade fiscal, democracia liberal, abertura internacional moderada e reforma institucional, rejeitando tanto o estatismo amplo quanto o radicalismo libertário como programa político.',
 'Argentina':'República federal presidencialista, a Argentina de Javier Milei, desde 2023, persegue contenção fiscal, desregulamentação e privatizações, mantendo serviços públicos e alinhando-se aos Estados Unidos e a Israel, em ruptura com o peronismo.',
 'Polish-Lithuanian Commonwealth':'União da Polônia e da Lituânia de 1569 a 1795, a Comunidade Polaco-Lituana foi uma república nobiliárquica com rei eleito, Sejm e liberum veto, tolerância religiosa incomum e vasto território multiétnico, até ser dividida entre Rússia, Prússia e Áustria.',
 'Sérgio Moro':'Ex-juiz federal, Moro conduziu a Operação Lava Jato, a maior investigação de corrupção do Brasil, que atingiu a petroleira estatal Petrobras; depois foi ministro da Justiça de Bolsonaro até renunciar e, em 2026, disputa o governo do Paraná.',
 'Brazil Union (UNIÃO)':'Partido de centro-direita criado em 2022 pela fusão de DEM e PSL, núcleo do centrão e hoje em federação com o PP. Defende a economia de mercado, o agronegócio e um conservadorismo moral moderado, com ministros no governo Lula e vínculos com o Congresso.',
 'German Democratic Party (DDP)':'Partido liberal de esquerda da República de Weimar, com Hugo Preuss, Theodor Wolff e Walther Rathenau. Defendeu a Constituição de 1919, a democracia parlamentar, a economia de mercado com responsabilidade social, os direitos civis e a reconciliação europeia, até desaparecer em 1933.',
 'Pragmatic Liberalism':'Liberalismo que defende a democracia, os direitos individuais e a economia de mercado, mas testa cada política com evidências: aceita regulação, rede de proteção e intervenção pontual quando corrigem falhas de mercado, como na Terceira Via de Clinton.',
 'Federalism':'Doutrina que organiza o Estado por meio da divisão constitucional de poderes entre um governo central e unidades regionais autônomas, como cantões ou estados, com competências próprias, tribunais independentes e freios mútuos contra a concentração excessiva de poder.',
 'Stalinist Socialism':'Modelo soviético consolidado por Stálin, marcado por industrialização acelerada, coletivização agrícola, planejamento central rígido, liderança personalista e repressão política em massa.',
 'Christian Conservatism':'Corrente que fundamenta a política na moral e na tradição cristãs, defendendo a família, a vida e os valores religiosos dentro da democracia, com ênfase na preservação dos costumes e do patrimônio cultural do povo.',
 'Armenia':'República semipresidencialista no Cáucaso, a Armênia combina identidade nacional cristã e rivalidade histórica com o Azerbaijão e a Turquia, buscando equilíbrio entre Rússia, Ocidente e Irã.',
 'Kingdom of Bavaria':'Reino do sul da Alemanha, aliado à Confederação Germânica e depois ao Império Alemão, marcado por forte identidade católica, conservadorismo e autonomia regional.',
 'Jordan Peterson':'Psicólogo canadense, Peterson tornou-se referência do conservadorismo cultural liberal, criticando o progressismo identitário e defendendo a responsabilidade individual, a tradição, a liberdade de expressão e a ordem simbólica.',
 'Christian Democracy (DC)':'Pequeno partido democrata-cristão centrado na família, na defesa da vida desde a concepção e na fé cristã na vida pública, com economia moderada e proteção social, conhecido pelas candidaturas presidenciais de Eymael.',
 'Social Democratic Party (historical PSD)':'Partido de centro-direita fundado em 1945 por interventores de Vargas, com base rural e oligárquica. Aliado ao PTB nos governos de 1945 a 1964, teve Dutra e Juscelino Kubitschek e defendeu o desenvolvimento, a ordem constitucional e a conciliação.',
 'Conservatism':'Tradição política que valoriza a ordem, os costumes, a família e as instituições consolidadas, preferindo a mudança gradual e prudente à ruptura, com base na experiência histórica e no ceticismo diante das utopias.',
 'Alt-Lite':'Ramo da direita radical nacionalista e antiglobalista, que enfatiza a identidade cultural, a crítica à imigração e a oposição ao politicamente correto, sem adotar posições de base racial.',
 'Pragmatic Conservatism':'Conservadorismo que protege instituições, família e ordem sem rigidez doutrinária: admite reformas graduais e concessões para conservar o essencial, na linha de Burke e Disraeli, em vez de restaurar um passado idealizado.',
 'Techno-Communism':'Corrente que combina a etapa final do comunismo com a aceleração tecnológica, usando automação e IA para superar a escassez, o trabalho necessário e a propriedade privada.',
}

ROLES = {
 'Catholic-bureaucratic viceroyalty':'Vice-reino católico-burocrático','French-speaking federal province':'Província federal francófona','Federal-institutional district':'Distrito federal-institucional',
 'Presidential republic and service economy':'República presidencialista e economia de serviços','Hyper-open recreational region':'Região recreativa hiperaberta','Federal Reserve Chair (2018–2026)':'Presidente do Federal Reserve (2018–2026)',
 'Philosopher and writer':'Filósofo e escritor','Podcaster and Comedian':'Podcaster e humorista','Businessman and politician':'Empresário e político','Politician':'Político','Thinker':'Pensador',
 'Catholic-touristic parliamentary republic':'República parlamentarista católico-turística','Customary cantonal confederation':'Confederação cantonal consuetudinária','Psychologist and essayist':'Psicólogo e ensaísta',
 'Former President of Poland':'Ex-presidente da Polônia','Monarchist pretender':'Pretendente monarquista','Political strategist':'Estrategista político','Physicist and astronomer':'Físico e astrônomo','Theologian and philosopher':'Teólogo e filósofo',
}
DISTINCT = {
 'Jucimar':'Posição mais incomum: Economia. Segundo o relatório, 87% das ideologias são menos orientadas ao polo privado. Posição mais típica: Intervenção, no centro, assim como o catálogo.',
 'Lucca':'Posição mais incomum: Religião. Segundo o relatório, 81% das ideologias são menos religiosas. Posição mais típica: Economia, na mediana do catálogo. Combinação destacada: liberdade e militarismo, presente em apenas 6 das 274 ideologias do catálogo do relatório.',
}

def split(src, name):
    i = src.index(f'const {name}={{'); j = src.index('\n};', i)
    return i, j
def add(src, name, entries):
    i, j = split(src, name)
    block = src[i:j]
    existing = set(re.findall(r"^\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|(\w+)):", block, re.M))
    keys = {a or b or c for a, b, c in existing}
    lines = [f' {json.dumps(k, ensure_ascii=False)}:{json.dumps(v, ensure_ascii=False)}' for k, v in entries.items() if k not in keys and k.replace("\\'", "'") not in keys]
    if not lines: return src
    block = block.rstrip()
    sep = '' if block.endswith(',') else ','
    return src[:i] + block + sep + '\n' + ',\n'.join(lines) + src[j:]

if '"Stalinist Socialism"' not in s:
    first_run = True
else:
    first_run = False
if first_run:
    s = add(s, 'REPORT_PT', NAMES)
    s = add(s, 'REPORT_DESCRIPTIONS_PT', DESC)
    s = add(s, 'REPORT_DISTINCT_PT', DISTINCT)
    s = add(s, 'REPORT_PT', ROLES)
    path.write_text(s, encoding='utf-8')
if not first_run and '"Theologian and philosopher"' not in s:
    s = add(s, 'REPORT_PT', ROLES)
    path.write_text(s, encoding='utf-8')
print('ok')

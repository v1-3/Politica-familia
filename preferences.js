// Translate rendered interface text, including results inserted after a selection changes.
const UI_COPY = {
 'For every candidate, take the lowest individual compatibility among the selected people. Rank that minimum highest first. Ties use the median individual score, then the mean, then the name. Each card shows all selected individual scores.':'Para cada candidato, usa-se a menor compatibilidade individual entre as pessoas selecionadas. Os maiores mínimos aparecem primeiro. Empates são resolvidos pela mediana individual, depois pela média e pelo nome. Cada cartão mostra todas as pontuações individuais selecionadas.',
 'Median-profile mode scores the synthetic vector of selected axis medians. It is a different question. The minimum-score filter still requires every selected person to pass.':'O modo de mediana pontua o perfil calculado com as medianas dos eixos selecionados. O filtro mínimo continua exigindo que todas as pessoas selecionadas alcancem o valor definido.',
 'All 15 nonempty selections have been computed against the full source catalogs. The page retains the top 24 matches per category and method, eight field winners and 12 books. Search operates on those retained matches.':'As 15 seleções não vazias foram calculadas nos catálogos completos. A página preserva as 24 primeiras correspondências por categoria e método, oito vencedores por área e 12 livros. A busca considera apenas essas correspondências preservadas.',
 'Both match methods honor the original recommendation filter of every selected person. Osmar’s link specifies Catholic; the other links specify none. The source’s exclusion and exclusivity rules are retained. This describes a filter, not an inferred religious identity.':'Os dois métodos respeitam o filtro original de recomendações de cada pessoa. O link de Osmar especifica católico; os demais não especificam filtro. As regras de exclusão e exclusividade da fonte são preservadas. Isso descreve um filtro, não uma identidade religiosa inferida.',
 'The compass is an illustrative projection. Matching uses the full 12-axis scoring formula: 42% per-axis similarity, 33% direction, 18% intensity, 7% worst-axis agreement. Matches are not probabilities or endorsements.':'A bússola é uma projeção ilustrativa. As correspondências usam a fórmula completa dos 12 eixos: 42% similaridade por eixo, 33% direção, 18% intensidade e 7% concordância no pior eixo. As pontuações não são probabilidades nem endossos.',
 'Individual rows retain that person’s own original recommendation filter. Group lists require eligibility for every selected person.':'Cada linha individual mantém o filtro original daquela pessoa. Nas listas do grupo, o candidato precisa ser elegível para todas as pessoas selecionadas.',
 'A geometry of your differences.':['Compare all 12 political axes.','Compare os 12 eixos políticos.'],
 'Compatible with your combination.':['Matches for the selected people.','Correspondências para as pessoas selecionadas.'],
 'Read the ideas behind the matches.':['Books by authors with similar profiles.','Livros de autores com perfis semelhantes.'],
 'Choose any combination below. The radar shows scores; the distance map shows separation.':['Select people below. The radar compares their scores on each axis. The map summarizes the differences between their profiles.','Selecione as pessoas abaixo. O radar compara suas pontuações em cada eixo. O mapa resume as diferenças entre os perfis.'],
 'Center = 0%, outer ring = 100% of each named pole. A larger shape does not mean a stronger or better ideology.':['Each label names the position measured from 0% at the center to 100% at the outer ring. Area does not measure political strength or quality.','Cada rótulo indica a posição medida de 0% no centro a 100% no anel externo. A área não mede força ou qualidade política.'],
 'Closer points mean more similar test answers across all 12 axes. Horizontal and vertical directions have no political meaning.':['Closer points indicate more similar scores across the 12 axes. The map directions do not represent left, right, authority or freedom.','Pontos próximos indicam pontuações mais semelhantes nos 12 eixos. As direções do mapa não representam esquerda, direita, autoridade ou liberdade.'],
 'Map: classical multidimensional scaling of root-mean-square (RMS) gaps. It is a two-dimensional approximation; use the table for exact gaps. All axes have equal weight. Selecting a different group may rotate or reposition the map.':['The map approximates the differences in two dimensions. The table shows the exact RMS score gaps in percentage points, with equal weight for every axis. Changing the group can rotate or reposition the map.','O mapa aproxima as diferenças em duas dimensões. A tabela mostra as distâncias RMS exatas em pontos percentuais, com peso igual para cada eixo. Mudar o grupo pode girar ou reposicionar o mapa.'],
 'Median profile':['Match to the group median','Correspondência com a mediana do grupo'],
 'Shared matches':['Best minimum individual match','Melhor correspondência individual mínima'],
 'Minimum for every person':['Minimum individual compatibility','Compatibilidade individual mínima'],
 'Minimum author fit for each person':['Minimum individual author compatibility','Compatibilidade individual mínima com o autor'],
 'The 12-axis radar':'Radar dos 12 eixos', 'How far apart are your profiles?':'Qual é a distância entre os perfis?',
 'ALL 12 AXES, ONE SHAPE':'OS 12 EIXOS EM UM GRÁFICO', 'Median & mean':'Mediana e média', 'Connections':'Conexões',
 'Geometry':'Geometria','Compass':'Bússola','12 axes':'12 eixos','Matches':'Correspondências','Books':'Livros','PDF reports':'Relatórios PDF',
 'Print / PDF ↗':'Imprimir / PDF ↗','FAMILY EDITION':'EDIÇÃO FAMÍLIA','Skip to content':'Ir para o conteúdo',
 'Federal':'Federalista','Democratic':'Democrático','Security-focused':'Foco em segurança','Assimilationist':'Assimilacionista','Militarist':'Militarista','Non-interventionist':'Não intervencionista','Public economy':'Economia pública','Planned economy':'Economia planejada','Protectionist':'Protecionista','Irreligious':'Irreligioso','Progressive':'Progressista','Pro-technology':'Pró-tecnologia',
 'Median':'Mediana','Mean':'Média','Arithmetic mean':'Média aritmética','Everyone':'Todos','Clear':'Limpar','No one selected':'Ninguém selecionado','No people selected':'Nenhuma pessoa selecionada',
 'Include in these graphs':'Incluir nestes gráficos','Include in these matches':'Incluir nestas correspondências','Include in this reading list':'Incluir nesta lista de leitura',
 'Set people across the page':'Definir pessoas para toda a página','Resets all section groups · compass, axes and PDFs follow this selection':'Redefine todos os grupos · bússola, eixos e PDFs seguem esta seleção',
 'Choose at least one person.':'Selecione pelo menos uma pessoa.','Select everyone':'Selecionar todos','Select people below':'Selecione as pessoas abaixo',
 'Choose a family combination':'Escolher uma combinação da família','Show selected median':'Mostrar mediana da seleção',
 'YOUR POSITIONS, ON THE ORIGINAL SCALE':'SUAS POSIÇÕES NA ESCALA ORIGINAL','The political compass.':'A bússola política.',
 'Economic left to right. Libertarian to authoritarian. Each point keeps its exact coordinates.':'Da esquerda à direita econômica. Do libertário ao autoritário. Cada ponto mantém suas coordenadas exatas.',
 'SELECTED PROFILES':'PERFIS SELECIONADOS','Social values':'Valores sociais','Traditionalist':'Tradicionalista',
 'The median point is the projection of the selected axis medians. It is not the average of these dots.':'O ponto da mediana é a projeção das medianas dos eixos selecionados. Não é a média destes pontos.',
 'How the compass is calculated':'Como a bússola é calculada',
 'Economic right = 60% private economy + 40% free market. Authority = the average of security, autocracy and unitary scores. Traditionalism = 100 minus the progressive score. These are the original 12 Axes formulas.':'Direita econômica = 60% economia privada + 40% livre mercado. Autoridade = média das pontuações de segurança, autocracia e unitarismo. Tradicionalismo = 100 menos a pontuação progressista. Estas são as fórmulas originais do 12 Axes.',
 'The eight-region color map follows the original site. The graph is a summary; the complete 12-axis profile determines matches.':'O mapa de oito regiões segue o site original. O gráfico é um resumo; o perfil completo dos 12 eixos determina as correspondências.',
 'ALL TWELVE DIMENSIONS':'AS DOZE DIMENSÕES','Where you agree. Where you differ.':'Concordâncias e diferenças.','Sort axes':'Ordenar eixos','Original order':'Ordem original','Largest differences':'Maiores diferenças','Closest agreement':'Maior concordância','Original bars':'Barras originais','Compare':'Comparar','Values':'Valores',
 'IDEAS, PLACES, PEOPLE & PARTIES':'IDEIAS, LUGARES, PESSOAS E PARTIDOS','Show more matches ↓':'Mostrar mais correspondências ↓','Compare each person’s individual top matches':'Comparar as principais correspondências de cada pessoa',
 'YOUR GROUP’S READING LIST':'LISTA DE LEITURA DO GRUPO','Books from the original catalog, ranked by their authors’ compatibility with the selected people.':'Livros do catálogo original, ordenados pela compatibilidade dos autores com as pessoas selecionadas.',
 'Author portraits, not book covers':'Retratos dos autores; não são capas de livros','PERSON TO PERSON':'PESSOA A PESSOA','Compare the connections.':'Compare as diferenças entre pares.',
 'Average absolute gap across 12 equally weighted axes. Smaller means closer test profiles.':'Diferença absoluta média nos 12 eixos, com pesos iguais. Valores menores indicam perfis mais próximos.',
 'Countries':'Países','Leaders':'Líderes','Ideologies':'Ideologias','All personalities':'Todas as personalidades','By field':'Por área','Parties':'Partidos','Historical states':'Estados históricos','Historical parties':'Partidos históricos','Distant matches':'Correspondências mais distantes',
 'Politics':'Política','Intellectuals':'Intelectuais','Business':'Negócios','Philosophy':'Filosofia','Activism':'Ativismo','Theory':'Teoria','Economics':'Economia','Religion':'Religião',
 'Radical Left':'Esquerda radical','Left':'Esquerda','Center':'Centro','Right':'Direita','Far-Right':'Extrema direita','Third Position':'Terceira posição','Libertarian':'Libertário','Anarchist':'Anarquista',
 'PRESERVED FROM THE FOUR PDF REPORTS':'PRESERVADO DOS QUATRO RELATÓRIOS PDF','The original results, side by side.':'Os resultados originais, lado a lado.',
 'Explore the supplied reports from October 17, 2026. Each card remains attached to its person and source page.':['Read the reports from October 17, 2026 in English or Portuguese. Each result identifies its person and source page.','Leia os relatórios de 17 de outubro de 2026 em português ou inglês. Cada resultado identifica a pessoa e a página de origem.'],
 'Overview':'Visão geral','Figures & leaders':'Personalidades e líderes','Original books':'Livros originais','Timeline':'Linha do tempo','Full report text':'Texto integral do relatório',
 'Sources, filters & calculation details':'Fontes, filtros e cálculos','Source snapshot':'Versão da fonte','Shared compatibility':'Compatibilidade compartilhada','Original recommendation filters':'Filtros originais de recomendação',
 'Download current selections ↓':'Baixar seleções atuais ↓','Download full catalog & all combinations ↓':'Baixar catálogo completo e todas as combinações ↓','Source catalog':'Catálogo de origem',
 'Swipe the chart sideways to read all twelve spokes →':'Deslize o gráfico para ler os doze eixos →',
 'Select any person, pair, trio or everyone using the buttons above.':'Selecione uma pessoa, dupla, trio ou todos nos botões acima.',
 'Choose at least one person above.':'Selecione pelo menos uma pessoa acima.',
 'YOUR FAMILY’S RESULTS, TOGETHER':'OS RESULTADOS DA FAMÍLIA, JUNTOS','Different perspectives.':'Perspectivas diferentes.','Find your common ground.':'Encontre pontos em comum.',
 'Explore your matches ↓':'Explorar correspondências ↓','Compare the geometry ↗':'Comparar os gráficos ↗',
 'Compare four individual results. Select any combination to discover the ideas, places and people that fit your group.':'Compare quatro resultados individuais. Selecione qualquer combinação para descobrir as ideias, lugares e pessoas com perfis semelhantes ao grupo.'
};
const UI_PHRASES = {
 'Dots: people · diamond: median · ring: mean':'Pontos: pessoas · losango: mediana · anel: média',
 'Scores: % of the named pole. Differences: percentage points.':'Pontuações: % do polo indicado. Diferenças: pontos percentuais.',
 'Separate ':'Compatibilidades separadas de ','minimum individual':'mínimo individual','median-profile':'perfil mediano',
 'fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.':'usando os conjuntos de eixos de cada dimensão da fonte. São independentes do filtro mínimo acima.',
 ' matches':' correspondências','The median’s most unusual axis:':'Eixo mais incomum da mediana:','Most typical:':'Mais típico:',
 'points from the ideology catalog’s median.':'pontos da mediana do catálogo de ideologias.',
 'This compares with catalog entries, not the population.':'A comparação é com os registros do catálogo, não com a população.',
 'A distinctive combination:':'Uma combinação distintiva:','Only ':'Apenas ',' source ideologies share the median’s side on both axes. This is a catalog observation, not a conflict or diagnosis.':' ideologias da fonte estão do mesmo lado da mediana em ambos os eixos. É uma observação do catálogo, não um conflito ou diagnóstico.',
 'A balanced combination:':'Uma combinação equilibrada:',
 'The source’s distinctive-pole rule did not identify a rare pair for this median profile. All twelve dimensions remain available above.':'A regra de polos distintivos da fonte não identificou um par raro neste perfil mediano. As doze dimensões continuam disponíveis acima.',
 'Median vectors are rounded to one decimal only for source compatibility matching; displayed medians and graph coordinates use full precision.':'Os vetores medianos são arredondados a uma casa decimal apenas no cálculo de compatibilidade com a fonte; as medianas exibidas e as coordenadas usam a precisão completa.',
 '4 family members · 15 possible combinations · 12 axes · images included offline':'4 familiares · 15 combinações possíveis · 12 eixos · imagens disponíveis off-line',
 'Structure':'Estrutura','Representation':'Representação','Power':'Poder','Immigration':'Imigração','Diplomacy':'Diplomacia','Intervention':'Intervenção','Economy':'Economia','Control':'Controle','Trade':'Comércio','Morality':'Moralidade','Technology':'Tecnologia','Government':'Governo','Society':'Sociedade',
 'Democracy':'Democracia','Autocracy':'Autocracia','Security':'Segurança','Liberty':'Liberdade','Assimilation':'Assimilação','Multiculturalism':'Multiculturalismo','Pacifist':'Pacifista','Nationalist':'Nacionalista','Unitary':'Unitário','Public':'Pública','Private':'Privada','Planning':'Planejamento','Free market':'Livre mercado','Protectionism':'Protecionismo','Globalism':'Globalismo','Religious':'Religioso','Biology':'Biologia',
 'Geometry combination':'Combinação dos gráficos','Matches combination':'Combinação das correspondências','Books combination':'Combinação dos livros','Geometry people':'Pessoas nos gráficos','Matches people':'Pessoas nas correspondências','Books people':'Pessoas nos livros','Scrollable radar chart':'Gráfico radar com rolagem',
 'Search names, categories or roles':'Buscar nomes, categorias ou funções','Search matches':'Buscar correspondências','Search':'Buscar','Selected median':'Mediana da seleção','The whole family':'Toda a família','Economic right':'Direita econômica','Authority':'Autoridade','Profile':'Perfil',
 'Left end = 100% of the left pole. Right end = 100% of the right pole. Colored dots show people; the diamond shows the selected median; the brown ring shows the mean. The line spans the selected people.':'Extremo esquerdo = 100% do polo esquerdo. Extremo direito = 100% do polo direito. Os pontos coloridos representam as pessoas; o losango é a mediana e o anel marrom é a média. A linha cobre a amplitude das pontuações selecionadas.',
 'Original':'Original','Selected':'Selecionada','score':'pontuação','median':'mediana','Explain':'Explicar','Values =':'Valores =',
 'Show ':'Mostrar ',' more matches ↓':' correspondências adicionais ↓','MATCH ':'CORRESPONDÊNCIA ','LOW COMPATIBILITY':'BAIXA COMPATIBILIDADE',
 'Historical state':'Estado histórico','Country / territory':'País / território','Political party':'Partido político','Historical party':'Partido histórico',
 'Independent family comparison based on':'Comparação independente da família baseada em',
 'October 17, 2026':'17 de outubro de 2026',
 'Matches to one synthetic median profile.':'Correspondências com um perfil mediano calculado.',
 'These use the middle of your selected axis scores. A high median fit can still be low for an individual, so every card also shows each person’s score.':'Usam a mediana das pontuações selecionadas em cada eixo. Uma compatibilidade alta com a mediana pode ser baixa para uma pessoa; por isso, cada cartão também mostra as pontuações individuais.',
 'A match has to work for everyone selected.':'A ordenação considera a menor compatibilidade entre as pessoas selecionadas.',
 'Each candidate is ranked by the lowest individual compatibility.':'Cada candidato é ordenado pela menor compatibilidade individual.',
 'With one person selected, this is their individual score.':'Com uma pessoa selecionada, esta é sua pontuação individual.',
 'The cards show who sets that minimum.':'Os cartões mostram quem determina esse mínimo.',
 'Search and the minimum filter apply to this match category. Books have their own people and minimum below.':'A busca e o filtro mínimo se aplicam a esta categoria. Os livros têm seleção de pessoas e mínimo próprios abaixo.',
 'Osmar’s original Catholic recommendation filter is included.':'O filtro católico de recomendações do link original de Osmar está incluído.',
 'Three of the least compatible profiles from each source catalog.':'Três dos perfis menos compatíveis de cada catálogo de origem.',
 'The best match in each of eight fields.':'A melhor correspondência em cada uma das oito áreas.',
 'retained matches from the full source catalog.':'correspondências preservadas do catálogo completo.',
 'match your filters.':'atendem aos filtros.','The top ':'As primeiras ',
 'No retained matches meet these filters.':'Nenhuma correspondência preservada atende a estes filtros.',
 'Lower the minimum or clear the search. Results outside the retained list are not searched.':'Reduza o mínimo ou limpe a busca. A busca considera apenas a lista preservada.',
 'No retained books meet the minimum.':'Nenhum livro preservado atende ao mínimo.',
 'Lower the author-fit minimum in this section to restore the reading list.':'Reduza a compatibilidade mínima com o autor nesta seção para recuperar a lista.',
 'One profile selected. Add another person to create a distance.':'Um perfil selecionado. Adicione outra pessoa para calcular a distância.',
 'This 2D view retains ':'Esta projeção 2D preserva ',
 '% of the squared-distance variation.':'% da variação das distâncias ao quadrado.',
 'All selected distances fit in two dimensions.':'Todas as distâncias selecionadas cabem em duas dimensões.',
 'Some separation is compressed; the exact table is authoritative.':'Parte da separação foi comprimida; consulte a tabela para os valores exatos.',
 'Exact RMS distance · percentage points · lower means closer':'Distância RMS exata · pontos percentuais · menor indica maior proximidade',
 'Source description':'Descrição original','Book details':'Detalhes do livro','Original online result':'Resultado original on-line',
 'Original top ideology':'Principal ideologia no original','Closest country':'País mais próximo','Closest figure':'Personalidade mais próxima','Closest era':'Época mais próxima','Compass classification in PDF':'Classificação na bússola do PDF',
 'Generated summary & distinctive axes':'Resumo gerado e eixos distintivos','Source-generated statement, page 1':'Declaração gerada pela fonte, página 1',
 'Present-day country':'País atual','Active party':'Partido ativo','Historical match':'Correspondência histórica','By dimension':'Por dimensão','Furthest in the report':'Mais distante no relatório','Top match':'Principal correspondência','Other close ideologies':'Outras ideologias próximas','Furthest ideology':'Ideologia mais distante',
 'author fit':'compatibilidade com o autor','catalog fit':'compatibilidade no catálogo','PDF · page ':'PDF · página ',
 'Original three books per selected person. Scores refer to the author; the images are author portraits. The group reading list above uses the selected matching method.':'Os três livros originais de cada pessoa selecionada. As pontuações se referem ao autor; as imagens são seus retratos. A lista de leitura do grupo acima usa o método selecionado.',
 'Full extracted text from all eight pages of each selected report. Expand any page to inspect the source wording.':'Texto integral extraído das oito páginas de cada relatório selecionado. Abra uma página para consultar a redação original no idioma da fonte.',
 'These are the supplied reports’ original matches and rounded percentages. Group matches above come from the HTML’s preserved catalog snapshot and can differ. Similarity is a test result, not an endorsement or a definitive personal label.':'Estas são as correspondências originais e as porcentagens arredondadas dos relatórios. As correspondências do grupo acima usam o catálogo preservado do HTML e podem diferir. A similaridade é um resultado do teste, não um endosso ou rótulo pessoal definitivo.',
 'A wider view of your results.':'Outras perspectivas dos resultados.','All 12 axes':'Todos os 12 eixos','9 social and institutional axes':'9 eixos sociais e institucionais','Economy, control and trade':'Economia, controle e comércio',
 'Political':'Política','Social':'Social','Economic':'Econômica','Personality':'Personalidade','Country / state':'País / Estado','Party':'Partido','Person':'Pessoa','Ideology':'Ideologia',
 'Original result':'Resultado original','Open result':'Abrir resultado','Source catalog book':'Livro do catálogo original','Details':'Detalhes','Source':'Fonte','Lowest individual:':'Menor compatibilidade individual:',
 'minimum author fit':'menor compatibilidade com o autor','author fit to median':'compatibilidade do autor com a mediana',
 'Select at least two people.':'Selecione pelo menos duas pessoas.','Each pair will show its average gap and the differences on every axis.':'Cada dupla mostra sua diferença média e as diferenças em cada eixo.',
 'Axis-by-axis distance. A zero means identical scores on that axis.':'Distância eixo a eixo. Zero significa pontuações idênticas naquele eixo.',
 'percentage point gap':'pontos percentuais de diferença','point range':'pontos de amplitude','Axis / left pole':'Eixo / polo esquerdo',
 'All percentages measure the named left pole. The opposite score is 100 minus that value. Gaps and MAD are percentage points.':'Todas as porcentagens medem o polo esquerdo indicado. A pontuação oposta é 100 menos esse valor. Diferenças e desvio absoluto mediano (MAD) são expressos em pontos percentuais.',
 'independent selection':'seleção independente','Authors ranked against the median of this combination.':'Autores ordenados pela compatibilidade com a mediana desta combinação.',
 'Authors ranked by their lowest fit among these people.':'Autores ordenados pela menor compatibilidade individual entre estas pessoas.',
 'Images are author portraits.':'As imagens são retratos dos autores.','individual fit':'compatibilidade individual','minimum fit for everyone':'menor compatibilidade individual','fit to the median profile':'compatibilidade com o perfil mediano',
 'lowest individual score':'menor pontuação individual','synthetic median profile':'perfil mediano calculado','Country':'País','Leader':'Líder',
 'TOP SHARED CATALOG MATCH':'MELHOR CORRESPONDÊNCIA COMPARTILHADA','TOP MEDIAN-PROFILE CATALOG MATCH':'MELHOR CORRESPONDÊNCIA COM A MEDIANA',
 'No people selected for these matches':'Nenhuma pessoa selecionada para estas correspondências','Choose people for these graphs.':'Selecione pessoas para estes gráficos.','Choose people for these matches.':'Selecione pessoas para estas correspondências.','Choose people for this reading list.':'Selecione pessoas para esta lista de leitura.',
 'For each axis, average the middle two of the four scores.':'Em cada eixo, calcule a média das duas pontuações centrais das quatro.',
 'For each axis, take the middle of the three selected scores.':'Em cada eixo, use a pontuação central das três selecionadas.',
 'With two people, the median is their average. It does not resist a single outlier.':'Com duas pessoas, a mediana é sua média e é sensível a um valor extremo.',
 'One person selected. Their original scores are shown unchanged.':'Uma pessoa selecionada. Suas pontuações originais são exibidas sem alteração.',
 'points RMS':'pontos RMS','percentage points':'pontos percentuais','Mean:':'Média:','Median:':'Mediana:',
 'Public catalog snapshot':'Versão do catálogo público','commit':'commit','Page ':'Página ','Source page':'Página de origem','Compatibility':'Compatibilidade','Range':'Amplitude','Gap':'Diferença','Author':'Autor','Read more':'Ler mais'
};
Object.assign(UI_PHRASES,{
 'Ranked by the lowest compatibility among the selected people.':'Ordenado pela menor compatibilidade entre as pessoas selecionadas.',
 'Ranked against the selected group’s median profile.':'Ordenado pela compatibilidade com o perfil mediano do grupo selecionado.',
 'Separate median-profile fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.':'As correspondências com a mediana são calculadas separadamente para cada dimensão, usando os eixos definidos pela fonte. O filtro mínimo acima não se aplica aqui.',
 'Separate minimum individual fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.':'A menor compatibilidade individual é calculada separadamente para cada dimensão, usando os eixos definidos pela fonte. O filtro mínimo acima não se aplica aqui.',
 'Third position with Strongly traditionalist social values':'Terceira posição com valores sociais fortemente tradicionalistas',
 'Centrist with Traditionalist social values':'Centro com valores sociais tradicionalistas','Right with Traditionalist social values':'Direita com valores sociais tradicionalistas','Centrist with Moderate social values':'Centro com valores sociais moderados',
 'Book matching method':'Método de compatibilidade dos livros',
 'The main bars show the selected median; each person’s score stays visible.':'As visualizações mostram a mediana da seleção e as pontuações individuais.',
 'CLOSEST AXIS':'EIXO COM MAIOR CONCORDÂNCIA','WIDEST DIFFERENCE':'MAIOR DIFERENÇA','CLOSEST PAIR':'DUPLA MAIS PRÓXIMA',
 'percentage point range among the selected people.':'pontos percentuais de amplitude entre as pessoas selecionadas.',
 'percentage points. Every individual stays visible.':'pontos percentuais. Todas as pontuações individuais continuam visíveis.',
 'percentage points apart on average.':'pontos percentuais de diferença, em média.',
 'The main bars show the selected median; each person’s score stays visible.':'As visualizações mostram a mediana da seleção e as pontuações individuais.',
 'Highlighted values determine the median. Individual values below measure':'Os valores destacados determinam a mediana. Os valores individuais abaixo medem',
 'Median':'Mediana','Mean':'Média','Federal':'Federalista','Militarist':'Militarista','Non-interventionist':'Não intervencionista','Irreligious':'Irreligioso','Progressive':'Progressista','Traditionalist':'Tradicionalista',
 'Political matches':'Correspondências políticas','Social matches':'Correspondências sociais','Economic matches':'Correspondências econômicas',
 'Search these matches':'Buscar nestas correspondências','Axis view':'Visualização dos eixos','Match category':'Categoria de correspondências','Compatibility method':'Método de compatibilidade','Original report category':'Categoria dos relatórios originais',
 'Default people; changing these resets all section selections':'Seleção geral; alterá-la redefine as seleções de todas as seções',
 'Twelve-axis comparison for':'Comparação dos doze eixos de',
 'Each spoke measures the named pole from zero at the center to one hundred at the edge. Individual profiles are colored; the median is dark green and the mean is dashed brown.':'Cada eixo mede o polo indicado de zero no centro a cem na borda. Os perfis individuais são coloridos; a mediana tem linha contínua e a média tem linha tracejada.',
 'Geometric distance map for':'Mapa de distâncias entre os perfis de',
 'Two-dimensional projection of root-mean-square score differences. Distances and projection quality appear below.':'Projeção em duas dimensões das diferenças RMS entre pontuações. As distâncias exatas e a qualidade da projeção aparecem abaixo.',
 'Political compass for':'Bússola política de',
 'Economic right increases from left to right. Authority increases from bottom to top. Points use the original formulas. Exact scores appear in the adjacent table.':'A direita econômica aumenta da esquerda para a direita. A autoridade aumenta de baixo para cima. Os pontos usam as fórmulas originais. As pontuações exatas estão na tabela.',
 'Authoritarian':'Autoritário','Authority ↑':'Autoridade ↑','Economic right →':'Direita econômica →',
 ' of ':' de '
});
let uiLanguage=localStorage.getItem('family-language')||'en';
const uiOriginal=new WeakMap();
const uiAttributes=new WeakMap();
const uiPhraseMap={...Object.fromEntries(Object.entries(UI_COPY).filter(([,v])=>typeof v==='string')),...UI_PHRASES};
const uiPhrasePattern=new RegExp('(?<![A-Za-z])(?:'+Object.keys(uiPhraseMap).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![A-Za-z])','g');
function uiText(raw){
 const trim=raw.trim(),entry=UI_COPY[trim];
 if(entry){const value=Array.isArray(entry)?entry[uiLanguage==='pt'?1:0]:(uiLanguage==='pt'?entry:trim);return raw.replace(trim,value);}
 if(uiLanguage!=='pt')return raw;
 let text=raw;
 // Match against the original English text once: translated output is never retranslated.
 text=text.replace(uiPhrasePattern,match=>uiPhraseMap[match]);
 return text;
}
function translateInterface(){
 uiObserver.disconnect();
 const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,#page-preferences,#report-content,#report-note,.original-text,.report-quote,.report-item details p,.book-body h3,.card-title,.dimension-entry strong,.hero-match h3,.hero-image-item strong,.book-portrait>span,.report-item h5')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 while(walk.nextNode()){
  const node=walk.currentNode,previous=uiOriginal.get(node);
  const raw=previous&&node.nodeValue===previous.rendered?previous.raw:node.nodeValue;
  const rendered=uiText(raw);if(node.nodeValue!==rendered)node.nodeValue=rendered;
  uiOriginal.set(node,{raw,rendered});
 }
 document.querySelectorAll('[aria-label],[placeholder],[title]').forEach(el=>{
  const saved=uiAttributes.get(el)||{};
  for(const attr of ['aria-label','placeholder','title']){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr),prior=saved[attr],raw=prior&&value===prior.rendered?prior.raw:value,rendered=uiText(raw);el.setAttribute(attr,rendered);saved[attr]={raw,rendered};}
  uiAttributes.set(el,saved);
 });
 document.documentElement.lang=uiLanguage==='pt'?'pt-BR':'en';
 document.getElementById('language-toggle').textContent=uiLanguage==='pt'?'English':'Português';
 document.getElementById('theme-toggle').textContent=document.documentElement.dataset.theme==='dark'?(uiLanguage==='pt'?'Modo claro':'Light mode'):(uiLanguage==='pt'?'Modo escuro':'Dark mode');
 uiObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
}
const uiObserver=new MutationObserver(()=>translateInterface());
const preferences=document.createElement('div');preferences.id='page-preferences';preferences.innerHTML='<button type="button" id="language-toggle">Português</button><button type="button" id="theme-toggle">Dark mode</button>';
document.querySelector('.nav').append(preferences);
document.documentElement.dataset.theme=localStorage.getItem('family-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.getElementById('language-toggle').addEventListener('click',()=>{uiLanguage=uiLanguage==='en'?'pt':'en';localStorage.setItem('family-language',uiLanguage);if(D&&S.mask)renderReports();translateInterface();});
document.getElementById('theme-toggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('family-theme',document.documentElement.dataset.theme);translateInterface();});
translateInterface();

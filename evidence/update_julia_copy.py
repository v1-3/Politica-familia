"""Update the bilingual family counts and recommendation-filter wording."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
replacements = {
    'Compare eight individual results.': 'Compare nine individual results.',
    'Compare oito resultados individuais.': 'Compare nove resultados individuais.',
    '8 family members · 255 possible combinations': '9 family members · 511 possible combinations',
    '8 familiares · 255 combinações possíveis': '9 familiares · 511 combinações possíveis',
    'All 255 nonempty selections': 'All 511 nonempty selections',
    'As 255 seleções não vazias': 'As 511 seleções não vazias',
    'The 96 scores are preserved exactly from the eight supplied URLs.': 'The 108 scores are preserved exactly from the nine supplied URLs.',
    'As 96 pontuações foram preservadas exatamente dos oito links fornecidos.': 'As 108 pontuações foram preservadas exatamente dos nove links fornecidos.',
    'All eight people and their combinations': 'All nine people and their combinations',
    'Todas as oito pessoas e suas combinações foram calculados': 'Todas as nove pessoas e suas combinações foram calculadas',
    'Jucimar and Lucca': 'Jucimar, Lucca and Julia',
    'Lucca’s links specify Catholic; the other links specify none.': 'Lucca’s links specify Catholic; Julia’s specifies Protestant; the other links specify none.',
    'Lucca especificam católico; os demais não especificam filtro.': 'Lucca especificam católico; o de Julia especifica protestante; os demais não especificam filtro.',
    'n<=8': 'n<=9',
}
for name in ['build-family.py', 'preferences.js']:
    path=root/name
    text=path.read_text(encoding='utf-8')
    for old,new in replacements.items():
        text=text.replace(old,new)
    path.write_text(text,encoding='utf-8')

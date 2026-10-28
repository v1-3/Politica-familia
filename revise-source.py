from pathlib import Path
p=Path('enhancement.js')
s=p.read_text(encoding='utf-8')
s=s[:s.index('function renderRobust(){')]+s[s.index('const pdfThumb='):]
s=s[:s.index('// The original demonstration')]
s=s.replace("const cx=320,cy=282,r=183", "const cx=360,cy=260,r=175")
s=s.replace('viewBox="0 0 640 565"','viewBox="0 0 720 535"')
start=s.index(' D.axes.forEach((a,j)=>{const p=at(j,100)')
end=s.index('\n [0,25,50,75,100]',start)
s=s[:start]+''' const labels=['Federal?','Democratic?','Security-focused?','Assimilationist?','Militarist?','Non-interventionist?','Public economy?','Planned economy?','Protectionist?','Irreligious?','Progressive?','Pro-technology?'];
 D.axes.forEach((a,j)=>{const p=at(j,100),l=at(j,100,35),anchor=Math.abs(l[0]-cx)<8?'middle':l[0]>cx?'start':'end';svg+=`<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#deddd1"/><text class="radar-axis-label" x="${l[0]}" y="${l[1]+4}" text-anchor="${anchor}" fill="#203c2e" font-size="16" font-weight="600">${esc(labels[j])}</text>`;});'''+s[end:]
p.write_text(s,encoding='utf-8')

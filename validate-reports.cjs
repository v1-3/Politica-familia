const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('evidence/pdf_profiles.json','utf8'));
const locale=vm.runInNewContext(fs.readFileSync('report-locale.js','utf8')+';({names:REPORT_PT,descriptions:REPORT_DESCRIPTIONS_PT,distinct:REPORT_DISTINCT_PT})');
let descriptions=0,items=0,pages=0;
function inspect(value){
 if(Array.isArray(value)){value.forEach(inspect);return;}
 if(!value||typeof value!=='object')return;
 if(value.description){assert.ok(value.name,'Description requires a title');assert.ok(locale.descriptions[value.name],'Missing Portuguese description: '+value.name);descriptions++;}
 if(value.source_page&&!value.eras&&('match' in value||'author_match' in value)){assert.ok(value.name||value.title,'Score item has no title');items++;}
 for(const [key,entry] of Object.entries(value))if(!['source_text','image','flag'].includes(key))inspect(entry);
}
for(const [name,person] of Object.entries(data.people)){assert.ok(locale.distinct[name]);assert.equal(Object.keys(person.source_text).length,8);pages+=8;inspect(person);}
assert.equal(pages,Object.keys(data.people).length*8);
console.log(JSON.stringify({result:'passed',translatedDescriptions:descriptions,scoreItemsWithTitles:items,preservedSourcePages:pages}));

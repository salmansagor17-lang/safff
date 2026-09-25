// Builds a reviewable atomic content update and a local rollback from a live snapshot.
// Uses only the public read key. Apply the SQL through the authorized admin connector.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8'),ctx);
const config=ctx.window.APP_CONFIG;
const rows=JSON.parse(fs.readFileSync(path.join(root,'data/question-bank-v0.9.0.json'),'utf8'));
const audit=JSON.parse(fs.readFileSync(path.join(root,'data/content-audit.json'),'utf8'));
const cols=['id','game_id','category_id','points','type','question','answer','options','media_type','media_path','media_alt','sort_order','active','metadata'];
const cast='id text,game_id text,category_id text,points integer,type text,question text,answer text,options jsonb,media_type text,media_path text,media_alt text,sort_order integer,active boolean,metadata jsonb';
const jsonSql=(value)=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
function upsertQuestions(pool){return `insert into public.game_questions (${cols.join(',')}) select ${cols.join(',')} from jsonb_to_recordset(${jsonSql(pool)}) as x(${cast}) on conflict(id) do update set ${cols.slice(1).map(c=>`${c}=excluded.${c}`).join(',')},updated_at=now();`;}
function upsertCategories(pool){return `insert into public.game_categories (id,game_id,title,sort_order,active) select id,game_id,title,sort_order,active from jsonb_to_recordset(${jsonSql(pool)}) as x(id text,game_id text,title text,sort_order integer,active boolean) on conflict(id) do update set title=excluded.title,sort_order=excluded.sort_order,active=excluded.active;`;}
async function load(table){
 const result=[];
 for(let offset=0;;offset+=500){
  const response=await fetch(`${config.supabaseUrl}/rest/v1/${table}?game_id=eq.family-challenge&select=*&order=id&offset=${offset}&limit=500`,{headers:{apikey:config.supabasePublishableKey}});
  if(!response.ok)throw Error(`${table}: ${response.status}`);
  const page=await response.json();result.push(...page);if(page.length<500)return result;
 }
}
(async()=>{
 const questions=await load('game_questions');const categories=await load('game_categories');
 if(questions.length<2200)throw Error('Incomplete live backup');
 const directory=path.join(root,'.local-backups');fs.mkdirSync(directory,{recursive:true});
 const backup=path.join(directory,'before-topic-sync.json');
 if(fs.existsSync(backup))throw Error('Backup already exists; review before replacing');
 fs.writeFileSync(backup,JSON.stringify({questions,categories},null,2));
 const nextCategories=audit.map((c,i)=>({id:c.id,game_id:'family-challenge',title:c.title,sort_order:i+1,active:true}));
 const states=questions.map(q=>({id:q.id,updated_at:q.updated_at}));
 const query=`begin;
select pg_advisory_xact_lock(hashtext('family-challenge-topic-expansion'));
do $$ begin
 if (select count(*) from public.game_questions where game_id='family-challenge' and active)= ${questions.length} then null; else raise exception 'Live question count changed'; end if;
 if exists(select 1 from jsonb_to_recordset(${jsonSql(states)}) as b(id text,updated_at timestamptz) left join public.game_questions q on q.id=b.id where q.id is null or q.updated_at is distinct from b.updated_at) then raise exception 'Live content changed since backup'; end if;
end $$;
${upsertCategories(nextCategories)}
${upsertQuestions(rows.map(q=>Object.fromEntries(cols.map(c=>[c,q[c]]))))}
do $$ begin
 if (select count(*) from public.game_questions where game_id='family-challenge' and active) <> ${rows.length} then raise exception 'Unexpected final count'; end if;
 if exists(select c.id from public.game_categories c cross join (values(100),(200),(300),(400),(500)) p(points) left join public.game_questions q on q.category_id=c.id and q.points=p.points and q.active where c.game_id='family-challenge' and c.active group by c.id,p.points having count(q.id)<10) then raise exception 'Missing difficulty questions'; end if;
end $$;
commit;`;
 fs.writeFileSync(path.join(directory,'topic-sync.sql'),query);
 const oldIds=new Set(questions.map(q=>q.id));
 const newIds=rows.filter(q=>!oldIds.has(q.id)).map(q=>q.id);
 const oldCats=new Set(categories.map(c=>c.id));
 const newCats=nextCategories.filter(c=>!oldCats.has(c.id)).map(c=>c.id);
 fs.writeFileSync(path.join(directory,'topic-rollback.sql'),`begin;\n${upsertQuestions(questions)}\n${upsertCategories(categories)}\nupdate public.game_questions set active=false where id in (select jsonb_array_elements_text(${jsonSql(newIds)}));\nupdate public.game_categories set active=false where id in (select jsonb_array_elements_text(${jsonSql(newCats)}));\ncommit;`);
 console.log(JSON.stringify({before:questions.length,after:rows.length,categories:nextCategories.length,newQuestions:newIds.length,sqlBytes:Buffer.byteLength(query)}));
})().catch(e=>{console.error(e);process.exitCode=1;});

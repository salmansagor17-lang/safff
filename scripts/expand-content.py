"""Deterministic import and topic audit. Original IDs survive category moves."""
import json, re, hashlib, zipfile, collections
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / '.local-backups/before-topic-expansion.json'
BACKUP.parent.mkdir(exist_ok=True)
BANK = ROOT / 'data/question-bank-v0.9.0.json'
if not BACKUP.exists():
    BACKUP.write_bytes(BANK.read_bytes())
bank = json.loads(BACKUP.read_text(encoding='utf-8'))
titles = {q['category_id']: q['category'] for q in bank}
titles.update({'fc-makeup':'ميكاب','fc-disney':'ديزني','fc-math':'رياضيات',
 'fc-science':'علوم وطبيعة','fc-quran':'القرآن الكريم','fc-seerah':'السيرة النبوية',
 'fc-quran-stories':'قصص القرآن','fc-islamic':'عبادات ومعارف إسلامية','fc-currencies':'عملات العالم'})
levels = [100,200,300,400,500]
diff = dict(zip(levels,['very_easy','easy','medium','hard','very_hard']))

def move(q, cid):
    if cid != q['category_id']:
        q['metadata']['previous_category_id'] = q['category_id']
    q['category_id'], q['category'] = cid, titles[cid]

for q in bank:
    t, cid, src = q['question'], q['category_id'], q['metadata'].get('source','')
    if src in ('generated-math','generated-logic','generated-sports'):
        move(q,'fc-math')
    elif cid == 'fc-islamic':
        if any(w in t for w in ['سورة','سور القرآن','ذكرًا بالاسم','ذُكر اسمه صراحة']): move(q,'fc-quran')
        elif any(w in t for w in ['السفينة','الحوت','قوم عاد','النبيان']): move(q,'fc-quran-stories')
        elif any(w in t for w in ['النبي','هاجر','الغزوة','الخلفاء']): move(q,'fc-seerah')
        else: move(q,'fc-islamic')
    elif cid == 'fc-geography' and 'العملة' in t: move(q,'fc-currencies')
    elif cid == 'fc-riddles' and 'الضرب' in t:
        move(q,'fc-math')
    elif cid == 'fc-general':
        if any(w in t for w in ['صفرًا','لا يقبل القسمة','الإحصائية','الثابت']):
            move(q,'fc-math');continue
        if any(w in t for w in ['تحول الماء','تردد الصوت','الكائن الحي','البارومتر','الطيف','التردد','الدم','جولًا','الإلكترونات']):
            move(q,'fc-science');continue
        if re.search('ضلع|أضلاع|زاوية|الزاوية|عدد أولي|العدد الأولي|عدد صحيح|أصفار|لوغاريتم|الجذر|أس |متتالية|المتتالية|مثلث|المثلث|مضلع|المضلع|مربع|المربع|الروماني|أويلر|العشريني|كاملة|عددًا أوليًا',t): move(q,'fc-math')
        elif re.search('محيط|الاستواء|شمال في الاتجاهات',t): move(q,'fc-geography')
        elif re.search('كوكب|الكوكب|الغاز|غاز|العضو|المادة|المعدن|الحيوان|حيوان|القطة|الدجاجة|الحاسة|عينًا|أصبع|الشم|الألوان|اللون|درجة الحرارة|الشمس|الخلية|الخلايا|الطاقة|الطول|الكتلة|كيميائي|الكيميائي|العنصر|عنصر|النبات|الضوء|الضوئي|الهواء|الجوي|الجسم|جسم|الذرة|الذري|الجسيم|جسيم|الإنزيم|البروتين|الكهربائي|الكهرباء|الكهربائية|موجات|الموجات|الجاذبية|الحموضة|الكروموسوم|الكلوروفيل|المعدة|عظمة|أفوجادرو|الكون|الصبغة|الضغط|الزلازل|المجرة|مجرة|النووي|الإشعاعي|نواة|الانصهار|التبخر|القشرة|المغناطيس|الهرتز|للأرض|الأرض|للصوديوم|الأوزون|الميتوكوندريا|الأرصاد|قوس قزح|أصلب|الشحنة|التحول|هايزنبرغ|ثابت بلانك|الإضاءة|الشمسية|المقاومة|القدرة',t): move(q,'fc-science')

def add(cid, points, question, answer, metadata=None, qid=None):
    if any(q['category_id']==cid and q['question']==question for q in bank): return
    bank.append(dict(id=qid or cid+'-new-'+hashlib.sha1(question.encode()).hexdigest()[:12],
        game_id='family-challenge',category_id=cid,category=titles[cid],points=points,
        type='text',question=question,answer=str(answer),options=[],media_type='none',
        media_path=None,media_alt='',active=True,sort_order=5000+len(bank),
        metadata={'source':'curated-topic-expansion','difficulty':diff[points],
                  'bank_version':'0.12.0',**(metadata or {})}))

z=zipfile.ZipFile(Path.home()/'Downloads/Makeup_Brand_Game_300.zip')
makeup=json.loads(z.read('makeup_brand_game_300/questions_with_answers.json'))
assert len(makeup)==300
def product_name(q):
    aliases=[q['answer']]
    aliases += {'Dior Beauty':['Dior'],'Chanel Beauty':['Chanel'],
                'e.l.f. Cosmetics':['e.l.f.']}.get(q['answer'],[])
    name=q['product']
    for brand in aliases:
        name=re.sub(re.escape(brand), '', name, flags=re.I)
    return name.strip(' -')
generic={'Lip Pencil','Stick Highlighter','Liquid Liner','Stick Blush','Bronzing Powder','Luminous Foundation'}
for q in makeup:
    # The supplied archive has no image files. Never publish broken image questions.
    product=product_name(q)
    if product in generic:
        companion=next(x for x in makeup if x['answer']==q['answer'] and x['id']!=q['id'] and product_name(x) not in generic)
        product+='» و«'+product_name(companion)
    add('fc-makeup',q['difficulty'],f'ما ماركة منتج الميكاب «{product}»؟',q['answer'],
        {'source':'user_makeup_archive','source_id':q['id'],'product':q['product'],
         'source_url':q['source_url'],'original_level':q['difficulty'],'format':'product-name'},
        f"fc-makeup-{q['id']:03}")
disney_path=ROOT.parent/'Disney_Questions_1995_2013_AR.xlsx'
disney_archive=ROOT/'data/disney-import.json'
if disney_path.exists():
    disney=list(openpyxl.load_workbook(disney_path,read_only=True,data_only=True).worksheets[0].values)[1:]
    disney_archive.write_text(json.dumps(disney,ensure_ascii=False,indent=2),encoding='utf-8')
else: disney=json.loads(disney_archive.read_text(encoding='utf-8'))
for row in disney:
    if not row or not isinstance(row[0],int): continue
    num,points,level,film,english,year,studio,kind,question,answer,code=row
    question=f'في فيلم «{film}» ({year}): {question}'
    add('fc-disney',points,question,answer,{'source':'user_disney_workbook',
        'source_id':code,'film':film,'year':year,'original_level':points},f'fc-disney-{num:03}')

# Human-authored additions with explicit levels; no arithmetic filler in other topics.
extra=json.loads((ROOT/'data/topic-additions.json').read_text(encoding='utf-8'))
for cid, rows in extra.items():
    for p,question,answer in rows: add(cid,p,question,answer)

# Currency rows previously occupied only the first three geography levels.
# Preserve their relative difficulty order and distribute the dedicated bank
# into five equally sized levels, recording the source level for review.
currency_rows=sorted([q for q in bank if q['category_id']=='fc-currencies'],key=lambda q:(q['points'],q['sort_order']))
for i,q in enumerate(currency_rows):
    q['metadata'].setdefault('original_level',q['points'])
    q['points']=levels[min(4,i*5//len(currency_rows))]
    q['metadata']['difficulty']=diff[q['points']]

# Ensure every category can play all five levels. Existing difficulty is retained
# whenever possible; imported workbook/archive levels are never changed.
for cid in titles:
    pool=[q for q in bank if q['category_id']==cid]
    if not pool: continue
    for p in levels:
        while sum(q['points']==p for q in pool)<2:
            counts=collections.Counter(q['points'] for q in pool)
            candidates=[q for q in pool if counts[q['points']]>2 and q['metadata'].get('source') not in ('user_makeup_archive','user_disney_workbook')]
            if not candidates: raise ValueError(f'Not enough questions for {cid}/{p}')
            q=min(candidates,key=lambda q:abs(q['points']-p))
            q['metadata'].setdefault('original_level',q['points'])
            q['points']=p;q['metadata']['difficulty']=diff[p]

assert len({q['id'] for q in bank})==len(bank)
assert sum(q['category_id']=='fc-makeup' for q in bank)==300
assert sum(q['category_id']=='fc-disney' for q in bank)==250
for q in bank:
    assert q['question'].strip() and str(q['answer']).strip() and q['points'] in levels
    q.pop('updated_at',None)
bank.sort(key=lambda q:(list(titles).index(q['category_id']),q['points'],q['id']))
BANK.write_text(json.dumps(bank,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
categories=[]
for cid,title in titles.items():
    pool=[q for q in bank if q['category_id']==cid]
    if not pool:continue
    questions=[]
    for p in levels:
        for q in [q for q in pool if q['points']==p][:2]:
            questions.append({**{k:q[k] for k in ('id','points','type','question','answer','options','metadata')},
                'media':dict(type=q['media_type'],path=q['media_path'],alt=q['media_alt'])})
    categories.append(dict(id=cid,category=title,questions=questions))
(ROOT/'games/family-challenge/js/defaultQuestions.js').write_text('const defaultQuestions = '+json.dumps(categories,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
report=[dict(id=c['id'],title=c['category'],count=sum(q['category_id']==c['id'] for q in bank),levels={str(p):sum(q['category_id']==c['id'] and q['points']==p for q in bank) for p in levels}) for c in categories]
(ROOT/'data/content-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));print('TOTAL',len(bank))

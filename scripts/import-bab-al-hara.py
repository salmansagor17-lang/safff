"""Import the supplied workbook once; retain normalized questions, not the workbook."""
import json
from pathlib import Path
import sys
import openpyxl

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
rows = []
for values in openpyxl.load_workbook(source, data_only=True).worksheets[0].iter_rows(min_row=4, values_only=True):
    number, level, question, *rest = values
    if not isinstance(number, int):
        continue
    options, answer = list(rest[:4]), rest[4]
    points = int(level.split(' - ')[0]) * 100
    assert points in (100, 200, 300, 400, 500) and answer in options
    rows.append(dict(id=f'fc-bab-al-hara-{number:03}', game_id='family-challenge',
        category_id='fc-bab-al-hara', category='باب الحارة', points=points, type='text',
        question=question, answer=answer, options=options, media_type='none', media_path=None,
        media_alt='', sort_order=3000+number, active=True,
        metadata=dict(source='user_workbook', source_row=number, source_level=level, bank_version='0.10.0')))
assert len(rows) == 100 and len({r['id'] for r in rows}) == 100
assert all(sum(r['points'] == p for r in rows) == 20 for p in (100,200,300,400,500))
(root/'data/bab-al-hara.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
bank_path = root/'data/question-bank-v0.9.0.json'
bank = [r for r in json.loads(bank_path.read_text(encoding='utf-8')) if r['category_id'] != 'fc-bab-al-hara'] + rows
bank_path.write_text(json.dumps(bank, ensure_ascii=False, separators=(',',':')), encoding='utf-8')
# A self-contained miniature bank also includes the new category.
categories = []
for cid in dict.fromkeys(r['category_id'] for r in bank):
    pool = [r for r in bank if r['category_id'] == cid]
    questions = []
    for points in (100,200,300,400,500):
        for q in [r for r in pool if r['points'] == points][:2]:
            questions.append({**{k:q[k] for k in ('id','points','type','question','answer','options','metadata')},
                'media': dict(type=q['media_type'], path=q['media_path'], alt=q['media_alt'])})
    categories.append(dict(id=cid, category=pool[0]['category'], questions=questions))
(root/'games/family-challenge/js/defaultQuestions.js').write_text('const defaultQuestions = '+json.dumps(categories,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('Imported 100 questions: 20 at each level; bank total', len(bank))

"""Amendment 7: split AH 784 and 789 out of the 783 and 788 year files.
redact_suluk.py missed these two headings because the Sulūk spells them 'سنه' (ha) not 'سنة' (ta marbuta).
Run once on the Amendment 6 redacted folder. Redaction itself is unchanged; only lines move between files."""
import json, hashlib, sys, pathlib
R = pathlib.Path(sys.argv[1]); TOK = '⟦REDACTED⟧'
FIX = {783: (784, '### | سنه أربع وثمانين وسبعمائة'), 788: (789, '### | سنه تسع وثمانين وسبعمائة')}
m = json.load(open(R/'MANIFEST.json'))
for host,(yr,head) in FIX.items():
    p = R/f'ah_{host:04d}.txt'; L = p.read_text(encoding='utf-8').split('\n')
    i = [k for k,l in enumerate(L) if l.strip()==head]; assert len(i)==1, (host,i); i=i[0]
    p.write_text('\n'.join(L[:i]).rstrip('\n')+'\n', encoding='utf-8')
    (R/f'ah_{yr:04d}.txt').write_text('\n'.join([f'# AH {yr}']+L[i:]).rstrip('\n')+'\n', encoding='utf-8')
m['missing_headings']=[]; m['headed_years']=197
m['amendment7']={'script':'split_fix_784_789.py','script_sha256':hashlib.sha256(open(__file__,'rb').read()).hexdigest(),
 'reason':"headings spelled 'سنه' were missed by the splitter",
 'blank_counts_after_split':{str(y):(R/f'ah_{y:04d}.txt').read_text(encoding='utf-8').count(TOK) for y in (783,784,788,789)},
 'prior_manifest_sha256':open(R/'MANIFEST.sha256').read().split()[0]}
json.dump(m, open(R/'MANIFEST.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
h=hashlib.sha256(open(R/'MANIFEST.json','rb').read()).hexdigest()
open(R/'MANIFEST.sha256','w').write(f'{h}  MANIFEST.json\n'); print(h, m['amendment7'])

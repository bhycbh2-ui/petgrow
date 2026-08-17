from pathlib import Path
p=Path('api/music.js')
s=p.read_text(encoding='utf-8')
s=s.replace('const seedKey="petmusic-starter-sixteen-v3";','const seedKey="petmusic-starter-thirtytwo-v4";',1)
anchor='\n  ];\n  for (const track of tracks) {'
if anchor not in s:
    raise SystemExit('tracks anchor not found')
new_tracks='''
    ,{id:'new-dog-sleep-02',title:'포근한 낮잠',description:'잔잔한 휴식 시간에 어울리는 강아지 수면 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-01.webp',audio:'/petmusic/new-dog-sleep-02.mp3'}
    ,{id:'new-dog-sleep-03',title:'꿈속 꼬리 흔들기',description:'편안한 밤과 낮잠 시간에 함께 듣기 좋은 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-02.webp',audio:'/petmusic/new-dog-sleep-03.mp3'}
    ,{id:'new-dog-sleep-04',title:'조용한 밤의 숨결',description:'차분하게 쉬고 싶은 시간에 어울리는 부드러운 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-03.webp',audio:'/petmusic/new-dog-sleep-04.mp3'}
    ,{id:'new-dog-sleep-05',title:'별빛 아래 깊은 잠',description:'수면 전 편안한 분위기를 만들어주는 강아지 휴식 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-04.webp',audio:'/petmusic/new-dog-sleep-05.mp3'}
    ,{id:'new-cat-window-00',title:'창가의 고양이',description:'창가에서 조용히 쉬는 고양이의 분위기를 담은 잔잔한 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-05.webp',audio:'/petmusic/new-cat-window-00.mp3'}
    ,{id:'new-cat-window-01',title:'햇살 드는 창가',description:'따뜻한 햇살 아래 쉬는 고양이에게 어울리는 편안한 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-06.webp',audio:'/petmusic/new-cat-window-01.mp3'}
    ,{id:'new-cat-window-02',title:'창가의 오후',description:'느긋한 오후의 고양이 휴식 시간에 어울리는 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-07.webp',audio:'/petmusic/new-cat-window-02.mp3'}
    ,{id:'new-cat-window-03',title:'창문 너머 바람',description:'창밖을 바라보는 고양이의 차분한 시간을 담은 음악이에요.',species:'cat',vocalType:'instrumental',mood:'nature',cover:'/petmusic/covers/cover-08.webp',audio:'/petmusic/new-cat-window-03.mp3'}
    ,{id:'new-cat-window-04',title:'고요한 창가',description:'조용한 실내에서 편안하게 듣기 좋은 고양이 휴식 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-09.webp',audio:'/petmusic/new-cat-window-04.mp3'}
    ,{id:'new-cat-window-05',title:'달빛 창가',description:'늦은 밤 고양이의 차분한 휴식에 어울리는 잔잔한 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-10.webp',audio:'/petmusic/new-cat-window-05.mp3'}
    ,{id:'new-dog-fluffy-00',title:'몽글몽글 강아지',description:'포근하고 말랑한 분위기의 강아지 휴식 음악이에요.',species:'dog',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-11.webp',audio:'/petmusic/new-dog-fluffy-00.mp3'}
    ,{id:'new-dog-fluffy-01',title:'포근포근 강아지 구름',description:'느긋한 휴식과 낮잠에 잘 어울리는 부드러운 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-12.webp',audio:'/petmusic/new-dog-fluffy-01.mp3'}
    ,{id:'new-cat-breath-00',title:'고양이 숨결',description:'고양이의 조용한 숨결을 닮은 차분한 휴식 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-13.webp',audio:'/petmusic/new-cat-breath-00.mp3'}
    ,{id:'new-cat-breath-01',title:'새벽의 고양이 숨결',description:'새벽처럼 고요한 분위기의 고양이 수면 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-14.webp',audio:'/petmusic/new-cat-breath-01.mp3'}
    ,{id:'new-dog-alley-walk-00',title:'골목 끝 산책',description:'가볍게 걷는 산책 시간의 설렘을 담은 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'play',cover:'/petmusic/covers/cover-15.webp',audio:'/petmusic/new-dog-alley-walk-00.mp3'}
    ,{id:'new-dog-alley-walk-01',title:'노을빛 골목 산책',description:'산책을 마무리하는 포근한 저녁 분위기의 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'nature',cover:'/petmusic/covers/cover-16.webp',audio:'/petmusic/new-dog-alley-walk-01.mp3'}
'''
s=s.replace(anchor,new_tracks+anchor,1)
p.write_text(s,encoding='utf-8')
print('Patched PetMusic starter seed to 32 tracks')

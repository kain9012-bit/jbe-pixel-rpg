# 교행몬 · 전북 에디션

전북교육청 교육행정직을 「교행몬」으로 삼은 도트 RPG. 브라우저에서 바로 실행

## 실행
- 배포 주소에서 바로 실행 (휴대폰·컴퓨터)
- 내려받아 실행: `index.html`을 브라우저로 열기

## 조작
| 키 | 기능 |
|---|---|
| 방향키 / W·A·S·D | 이동 |
| Z / Space | 확인 |
| X / Esc | 취소 |
| Enter | 메뉴 |

- 휴대폰: 화면 아래 십자키·A·B·START 버튼
- 저장: 메뉴 → 저장 (브라우저 저장소, 같은 브라우저에서만 이어하기)

## 체험판 범위
- 완산 마을 → 1번 도로 → 전주 → 서류숲 → 완주교육지원청 관장전(새싹 배지)

## 폴더
| 위치 | 내용 |
|---|---|
| `index.html` | 배포용 완성 파일 (빌드 결과) |
| `src/` | 게임 코드 |
| `tools/` | 도트 그림(`art_*.py`), 화면 틀(`shell.html`), 빌드(`build.py`) |
| `docs/` | 기획서·시나리오 |

## 고친 뒤 다시 만들기
```
python tools/build.py
```
- 필요: Python 3, Pillow(`pip install pillow`), Node.js(npm)
- 처음 한 번 갈무리 글꼴을 npm에서 받아 `tools/.cache`에 둠
- 결과: 저장소 맨 위 `index.html` 갱신

## 배포 (Vercel)
- 빌드 없이 정적 배포: Framework Preset `Other`, Build Command 비움, Output Directory 비움
- `main`에 올리면 자동 재배포

## 저작권
- 그림·음악·글: 자체 제작
- 원작 게임의 이름·그림·음악은 쓰지 않음
- 글꼴: 갈무리(Galmuri) — SIL Open Font License 1.1, `tools/LICENSE-Galmuri.txt`

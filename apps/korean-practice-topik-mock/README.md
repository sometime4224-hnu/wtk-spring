# 한국어 연습(토픽) 기말 모의고사

한국어연습2 자료를 바탕으로 만든 별도 모의고사/복습 앱입니다. 3B 읽기(한국어연습) 수업진도표 기준으로 중간고사 이후 기말고사 범위인 읽기 유형 3~4, 듣기 유형 4~5만 포함합니다.

## 원본 자료 관리

원본 PDF, HWP, ZIP 파일은 저장소에 넣지 않습니다. 문항별 크롭 이미지는 로컬 전용 폴더인 `private-assets/`에 생성하며, 이 폴더는 `.gitignore`에 등록되어 있습니다.

듣기 음원은 TOPIK 공식 홈페이지 공개 자료로 확인된 범위에서 이 모의고사에 한해 저장소에 포함할 수 있도록 `assets/audio/`에 생성합니다.

```powershell
cd C:\Users\somet\Desktop\00.my_app_project\korean3Bimprove\apps\korean-practice-topik-mock
.\scripts\prepare-private-assets.ps1
```

Windows 실행 정책 때문에 막히면 현재 실행에만 우회 옵션을 붙입니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\prepare-private-assets.ps1
```

기본값은 `C:\Users\somet\Downloads`에서 원본 파일을 찾습니다. 다른 폴더에 원본이 있으면 다음처럼 지정합니다.

```powershell
.\scripts\prepare-private-assets.ps1 -Downloads "D:\materials\topik-practice"
```

생성되는 로컬 파일:

- `private-assets/questions/*.jpg`
- `assets/audio/type-4/q-*.mp3`
- `assets/audio/type-5/q-*.mp3`

## 실행

저장소 루트에서 정적 서버를 실행합니다.

```powershell
cd C:\Users\somet\Desktop\00.my_app_project\korean3Bimprove
npm run serve:test
```

브라우저에서 `http://127.0.0.1:4173/apps/korean-practice-topik-mock/`를 엽니다.

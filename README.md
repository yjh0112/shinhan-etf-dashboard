# Shinhan Premier · ETF 수익률 대시보드

> React + Vite 기반 국내 ETF 분석 대시보드  
> 레버리지·인버스 제외 / 신탁·퇴직연금 가능 여부 관리

---

## 🚀 GitHub Pages 배포 순서 (처음 1회)

### 1단계 — GitHub 저장소 만들기
1. [github.com](https://github.com) 로그인
2. 우상단 `+` → **New repository**
3. 이름: `shinhan-etf-dashboard`
4. **Public** 선택
5. **Create repository** 클릭

---

### 2단계 — 내 PC에 Git 설치 (처음 1회)
- [git-scm.com](https://git-scm.com) 에서 다운로드·설치
- Node.js도 없으면: [nodejs.org](https://nodejs.org) LTS 설치

---

### 3단계 — 이 폴더를 GitHub에 올리기

```bash
# 이 폴더(shinhan-etf-dashboard)에서 터미널 열기

git init
git add .
git commit -m "첫 커밋"
git branch -M main
git remote add origin https://github.com/[내아이디]/shinhan-etf-dashboard.git
git push -u origin main
```

> ⚠️ `[내아이디]` 부분을 본인 GitHub 아이디로 바꿔주세요

---

### 4단계 — GitHub Pages 활성화

1. GitHub 저장소 페이지 → **Settings** 탭
2. 왼쪽 메뉴 **Pages** 클릭
3. Source: **Deploy from a branch**
4. Branch: **gh-pages** / **(root)** 선택 → **Save**

> GitHub Actions가 자동으로 빌드·배포합니다 (약 1~2분 소요)

---

### 완료! 접속 URL

```
https://[내아이디].github.io/shinhan-etf-dashboard/
```

---

## 🔄 이후 업데이트 방법

코드 수정 후 터미널에서 3줄만 입력:

```bash
git add .
git commit -m "수정 내용 메모"
git push
```

→ **1~2분 후 URL 자동 반영**

---

## ⚡ 로컬 개발 (파일 저장 즉시 반영)

```bash
npm install    # 처음 1회
npm run dev    # http://localhost:5173 에서 확인
```

---

## 📁 파일 구조

```
shinhan-etf-dashboard/
├── .github/workflows/deploy.yml  ← GitHub 자동 배포 설정
├── src/
│   ├── App.jsx                   ← 전체 레이아웃
│   ├── index.css                 ← 색상·폰트 (디자인 토큰)
│   ├── components/               ← UI 컴포넌트 (각 화면)
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── KpiStrip.jsx
│   │   ├── Top5Panels.jsx
│   │   ├── ConstituentPanel.jsx
│   │   ├── CompareTable.jsx
│   │   ├── StatsSection.jsx
│   │   ├── Heatmap.jsx
│   │   └── EligibilityModal.jsx
│   ├── hooks/
│   │   ├── useEtfData.js         ← 데이터 로드
│   │   └── useEligibility.js    ← 신탁·연금 목록
│   └── utils/
│       ├── constants.js          ← 색상·상수
│       └── parseXlsx.js         ← 엑셀 파싱
└── public/fonts/                 ← 원신한체 .woff2 파일 여기에
```

---

## 🛠 자주 수정하는 파일

| 수정하고 싶은 것 | 파일 |
|---|---|
| 전체 색상·폰트 | `src/index.css` |
| KPI 카드 내용 | `src/components/KpiStrip.jsx` |
| TOP5 → TOP10 | `src/components/Top5Panels.jsx` |
| 비교 테이블 컬럼 | `src/components/CompareTable.jsx` |
| 사이드바 메뉴 | `src/components/Sidebar.jsx` |

---

## 🔤 원신한체 적용

1. 신한 브랜드사이트에서 원신한체 `.woff2` 파일 다운로드
2. `public/fonts/` 폴더에 저장
3. `src/index.css` 상단 `@font-face` 주석 해제
4. `git add . && git commit -m "원신한체 적용" && git push`


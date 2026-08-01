# Easy English PWA

영어 초보자를 위한 회화 필수 단어 학습 웹앱입니다. 서버나 계정 없이 브라우저의 LocalStorage에 학습 상태를 저장하며, iPhone Safari의 **홈 화면에 추가**로 앱처럼 사용할 수 있습니다.

## 기술 구성

- Next.js App Router · React · TypeScript · Tailwind CSS
- PWA manifest · service worker · 오프라인 안내 화면
- LocalStorage 기반 체크 상태, 즐겨찾기, 복습 일정, 완벽 암기, 오답노트, 시험 결과, 통계
- en-US 음성 우선 선택과 Web Speech API 기반 발음 듣기·말하기 평가
- 540개 회화 핵심 단어를 품사·명사 주제별 JSON으로 관리
- 10개 초과 품사는 번호형 고밀도 단어장, 기초 품사는 카드 UI
- 체크한 단어 대상 4종 시험과 자동 오답 저장·재시험
- Vercel 배포 준비 완료

## 1. 설치

Node.js 20 이상을 권장합니다.

```bash
npm install
```

## 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다. PWA와 service worker는 localhost 또는 HTTPS 환경에서 동작합니다.

## 3. 프로덕션 빌드

```bash
npm run lint
npm run build
npm run start
```

## 4. GitHub 업로드 방법

GitHub에서 빈 저장소를 만든 뒤, 프로젝트 루트에서 아래 명령을 실행합니다. `<YOUR_GITHUB_URL>`은 새 저장소 주소로 바꿉니다.

```bash
git init
git add .
git commit -m "Initial Easy English PWA"
git branch -M main
git remote add origin <YOUR_GITHUB_URL>
git push -u origin main
```

`.env.local`, `node_modules`, `.next`, `.vercel`은 `.gitignore`에서 제외됩니다.

## 5. Vercel 배포 방법

1. [Vercel](https://vercel.com)에 로그인합니다.
2. **Add New → Project**를 선택합니다.
3. GitHub 저장소를 Import합니다.
4. Framework Preset이 **Next.js**인지 확인합니다.
5. **Deploy**를 누릅니다.

별도 환경변수는 필요하지 않습니다. 배포가 끝나면 HTTPS URL이 발급됩니다. 예: `https://easyenglish.vercel.app`

Vercel CLI를 사용한다면 다음도 가능합니다.

```bash
npm install -g vercel
vercel
```

## iPhone 홈 화면 추가

1. 배포된 HTTPS URL을 iPhone의 **Safari**에서 엽니다.
2. 하단의 **공유** 버튼을 누릅니다.
3. **홈 화면에 추가**를 선택합니다.
4. 이름을 확인한 뒤 **추가**를 누릅니다.
5. 홈 화면의 Easy English 아이콘을 누르면 독립 앱 화면으로 실행됩니다.

첫 접속 후 앱 화면과 정적 자산이 캐시됩니다. 인터넷이 끊긴 상태에서 아직 방문하지 않은 페이지를 열면 오프라인 안내 화면이 표시됩니다.

## 프로젝트 구조

```text
app/                 Next.js App Router, 메타데이터, iPhone head 설정
components/          학습 화면, 카드/리스트, 말하기 평가, 단어 시험
public/              manifest, service worker, favicon, Apple 아이콘, splash, offline page
src/data/            품사별 JSON 콘텐츠
src/lib/             LocalStorage, 간격 반복, 미국식 음성 로직
src/types/           TypeScript 타입
vercel.json          service worker/manifest 캐시 헤더
```

## 콘텐츠 추가

새 단어는 `src/data/`의 JSON 파일에 추가합니다. 각 항목은 아래 필드를 사용합니다.

```json
{
  "id": "noun-055",
  "word": "water",
  "pronunciation": "워러",
  "meaning": "물",
  "partOfSpeech": "명사",
  "category": "음료",
  "explanation": "물을 뜻하며 일상 회화에서 자주 쓰는 명사입니다.",
  "example": "We talked about water.",
  "exampleTranslation": "우리는 물에 대해 이야기했어요."
}
```

새 JSON 파일을 추가했다면 `src/data/index.ts`에 import와 목록 추가만 하면 됩니다.

## 음성 기능 참고

발음 재생은 기기에서 제공하는 `en-US` 음성을 우선 사용합니다. 말하기 평가는 브라우저 음성 인식 결과를 활용한 간단한 점수이므로 전문 음성학 분석과는 다릅니다. iPhone에서는 Safari의 마이크 권한을 허용해야 하며, 음성 인식은 브라우저 정책에 따라 인터넷 연결이 필요할 수 있습니다. 단어·예문·체크·복습·오답 데이터는 오프라인에서도 사용할 수 있습니다.
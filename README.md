# Easy English PWA

영어 초보자를 위한 회화 필수 단어 학습 웹앱입니다. 서버나 계정 없이 브라우저의 LocalStorage에 학습 상태를 저장하며, iPhone Safari의 **홈 화면에 추가**로 앱처럼 사용할 수 있습니다.

## 기술 구성

- Next.js App Router · React · TypeScript · Tailwind CSS
- PWA manifest · service worker · 오프라인 안내 화면
- LocalStorage 기반 즐겨찾기, 학습 완료, 복습 일정, 완벽 암기, 통계
- Web Speech API 기반 발음 듣기와 따라 말하기
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
components/          재사용 가능한 학습 화면과 단어 카드
public/              manifest, service worker, favicon, Apple 아이콘, splash, offline page
src/data/            품사별 JSON 콘텐츠
src/lib/             LocalStorage와 간격 반복 로직
src/types/           TypeScript 타입
vercel.json          service worker/manifest 캐시 헤더
```

## 콘텐츠 추가

새 단어는 `src/data/`의 JSON 파일에 추가합니다. 각 항목은 아래 필드를 사용합니다.

```json
{
  "id": "unique-id",
  "word": "water",
  "pronunciation": "워터",
  "meaning": "물",
  "partOfSpeech": "명사",
  "category": "음식",
  "explanation": "마시는 물이에요.",
  "example": "Can I have water?"
}
```

새 JSON 파일을 추가했다면 `src/data/index.ts`에 import와 목록 추가만 하면 됩니다.

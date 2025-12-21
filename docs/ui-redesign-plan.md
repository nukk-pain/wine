# Wine Tracker UI 재디자인 계획서
## "Wine Cellar" Luxury Minimalism

**작성일**: 2025-12-21
**디자인 컨셉**: 고급 와인 셀러의 분위기를 모바일 디지털 경험으로 재해석
**타겟 디바이스**: 모바일 전용 (iOS/Android)
**구현 방식**: 점진적 개선 (기존 컴포넌트 구조 유지)

---

## 1. 디자인 철학

### 핵심 원칙
- **Luxury & Refinement**: 와인의 프리미엄 속성을 시각적으로 표현
- **Mobile-First Excellence**: 모바일 환경에 최적화된 터치 인터랙션
- **Functional Elegance**: 아름다움과 사용성의 균형
- **Distinctive Identity**: 일반적인 AI 생성 디자인 탈피

### 사용 시나리오 고려
1. **와인샵/레스토랑**: 실내 조명 환경 (다크 테마 우선)
2. **와인 셀러**: 어두운 환경에서 편안한 시인성
3. **한 손 조작**: 엄지 도달 범위 내 주요 액션 배치
4. **장갑 착용 가능**: 넉넉한 터치 타겟 (최소 48px)

---

## 2. 색상 시스템

### 색상 팔레트
```javascript
wine: {
  // 배경 그라데이션
  dark: '#1a0a0a',      // 딥 블랙 (상단)
  deep: '#2d1215',      // 버건디 블랙 (중단)
  midnight: '#0a0506',  // 완전한 블랙 (하단)

  // 액센트 컬러
  gold: '#c9a050',      // 골드 (주요 CTA, 하이라이트)
  goldDark: '#a68340',  // 어두운 골드 (호버 상태)
  red: '#722f37',       // 와인 레드 (보조 액센트)

  // 텍스트 컬러
  cream: '#f5f0e6',     // 크림 (기본 텍스트)
  creamDim: '#d4cfc5',  // 디밍된 크림 (보조 텍스트)
  creamDark: '#a39d92', // 어두운 크림 (비활성 텍스트)

  // 글래스 효과
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(201, 160, 80, 0.2)',
  glassHover: 'rgba(255, 255, 255, 0.1)',
}
```

### 상태별 색상 매핑
| 상태 | 색상 | 사용처 |
|------|------|--------|
| **Primary Action** | wine-gold | 업로드, 분석, 저장 버튼 |
| **Success** | wine-gold + green tint | 완료 상태, 체크마크 |
| **Warning** | wine-gold + orange tint | 재분석, 경고 메시지 |
| **Error** | wine-red | 오류 상태, 삭제 버튼 |
| **Neutral** | wine-cream | 일반 텍스트 |
| **Disabled** | wine-creamDark | 비활성 요소 |

---

## 3. 타이포그래피 시스템

### 폰트 패밀리
```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

font-playfair: ['Playfair Display', 'serif']    // 제목, 빈티지, 와인명
font-body: ['Source Sans 3', 'sans-serif']      // 본문, 레이블, UI 요소
```

### 타이포그래피 스케일 (모바일 최적화)
| 요소 | 폰트 | 크기 | 용도 |
|------|------|------|------|
| **H1** | Playfair Display Light | 32px / 2rem | 메인 타이틀 |
| **H2** | Playfair Display Regular | 24px / 1.5rem | 섹션 제목 |
| **H3** | Playfair Display Medium | 20px / 1.25rem | 카드 제목, 와인명 |
| **Vintage** | Playfair Display Light | 28px / 1.75rem | 빈티지 연도 (강조) |
| **Body** | Source Sans 3 Regular | 16px / 1rem | 기본 텍스트 |
| **Label** | Source Sans 3 Medium | 14px / 0.875rem | 레이블, 버튼 |
| **Caption** | Source Sans 3 Regular | 13px / 0.8125rem | 보조 정보 |
| **Small** | Source Sans 3 Regular | 12px / 0.75rem | 메타데이터 |

### 모바일 가독성 규칙
- **최소 폰트 크기**: 13px (iOS 확대 방지)
- **라인 하이트**: 본문 1.6, 제목 1.3
- **자간**: 제목 +0.5px, 본문 normal
- **색상 대비**: WCAG AA 이상 (최소 4.5:1)

---

## 4. 레이아웃 시스템

### 그리드 & 스페이싱
```javascript
spacing: {
  xs: '8px',   // 0.5rem - 밀집된 요소 간격
  sm: '12px',  // 0.75rem - 관련 요소 그룹핑
  md: '16px',  // 1rem - 기본 간격
  lg: '24px',  // 1.5rem - 섹션 내부 간격
  xl: '32px',  // 2rem - 섹션 간 간격
  2xl: '48px', // 3rem - 주요 블록 간격
}
```

### 컨테이너 구조
```tsx
<main className="min-h-screen px-4 py-6 max-w-md mx-auto">
  // max-width: 448px (28rem) - 모바일 최적 너비
  // padding: 16px 양옆 여백 (엄지 도달 범위)
  // padding-top: 24px (상단 safe-area 고려)
</main>
```

### 터치 타겟 가이드라인
- **최소 크기**: 48px × 48px (애플 HIG 권장)
- **권장 크기**: 56px × 56px (구글 Material 권장)
- **간격**: 최소 8px (오터치 방지)
- **주요 액션**: 화면 하단 1/3 영역 배치

---

## 5. 컴포넌트별 개선 계획

### 5.1 메인 배경 (pages/index.tsx)

**현재**:
```tsx
bg-gradient-to-br from-blue-50 to-indigo-100
```

**개선**:
```tsx
<main className="min-h-screen bg-wine-dark relative overflow-hidden">
  {/* 메인 그라데이션 배경 */}
  <div className="absolute inset-0 bg-gradient-to-b from-wine-dark via-wine-deep to-wine-midnight" />

  {/* 노이즈 텍스처 (cellar 질감) */}
  <div className="absolute inset-0 opacity-[0.03]"
       style={{
         backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
         backgroundRepeat: 'repeat',
       }}
  />

  {/* 상단 글로우 효과 (와인 셀러 조명 암시) */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80
                  bg-wine-gold/10 rounded-full blur-[120px] pointer-events-none" />

  {/* 컨텐츠 레이어 */}
  <div className="relative z-10">
    {children}
  </div>
</main>
```

**모바일 최적화**:
- 고정 배경으로 스크롤 성능 향상
- GPU 가속 사용 (transform, opacity)
- 노이즈는 SVG 데이터 URI로 HTTP 요청 제거

---

### 5.2 헤더 (pages/index.tsx)

**현재**:
```tsx
<h1 className="text-3xl font-bold text-gray-900 mb-2">🍷 Wine tracker</h1>
<p className="text-gray-600">라벨을 촬영해서 와인 정보를 기록하세요</p>
```

**개선**:
```tsx
<header className="text-center mb-10 pt-6">
  {/* 로고/타이틀 */}
  <div className="mb-3">
    <h1 className="font-playfair text-[32px] font-light text-wine-gold
                   tracking-wide leading-tight">
      Wine Cellar
    </h1>
    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-wine-gold/50 to-transparent mx-auto mt-2" />
  </div>

  {/* 서브타이틀 */}
  <p className="font-body text-[13px] text-wine-creamDim tracking-[0.1em] uppercase">
    Personal Collection
  </p>
</header>
```

**디자인 의도**:
- 이모지 제거 → 세련된 인상
- 얇은 구분선 → 럭셔리 디테일
- 대문자 + 자간 → 에디토리얼 느낌

---

### 5.3 섹션 카드 (ProcessingStep)

**현재**:
```tsx
bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500
```

**개선**:
```tsx
<section className="relative group">
  {/* 글래스모피즘 컨테이너 */}
  <div className="relative backdrop-blur-xl bg-wine-glass
                  border border-wine-glassBorder rounded-2xl p-6
                  transition-all duration-500
                  hover:bg-wine-glassHover hover:border-wine-gold/30">

    {/* 상단 장식선 */}
    <div className="absolute top-0 left-0 right-0 h-[1px]
                    bg-gradient-to-r from-transparent via-wine-gold/40 to-transparent" />

    {/* 섹션 아이콘 + 제목 */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-wine-gold/10
                      flex items-center justify-center">
        <CustomIcon className="w-5 h-5 text-wine-gold" />
      </div>
      <h2 className="font-playfair text-xl text-wine-cream font-normal">
        {title}
      </h2>
    </div>

    {/* 컨텐츠 */}
    <div className="relative z-10">
      {children}
    </div>

    {/* 호버 시 미묘한 글로우 */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                    transition-opacity duration-500 pointer-events-none
                    bg-gradient-radial from-wine-gold/5 to-transparent rounded-2xl" />
  </div>
</section>
```

**모바일 터치 피드백**:
```tsx
// active 상태 추가
active:scale-[0.99] active:bg-wine-glass/80
```

---

### 5.4 이미지 업로드 (components/ImageUpload.tsx)

**현재**: 파란색 점선 박스 + 이모지

**개선**:
```tsx
<div className="relative">
  {/* 드래그 오버레이 */}
  {isDragOver && (
    <div className="absolute inset-0 z-50 backdrop-blur-sm
                    bg-wine-gold/20 rounded-2xl border-2 border-wine-gold
                    flex items-center justify-center">
      <div className="text-center">
        <UploadIcon className="w-16 h-16 text-wine-gold mx-auto mb-2 animate-bounce" />
        <p className="font-body text-wine-gold text-lg font-medium">
          Drop to Upload
        </p>
      </div>
    </div>
  )}

  {/* 메인 업로드 영역 */}
  <div className={`
    relative backdrop-blur-xl bg-wine-glass border-2 border-dashed
    ${isDragOver ? 'border-wine-gold' : 'border-wine-glassBorder'}
    rounded-2xl p-8 text-center cursor-pointer
    transition-all duration-300
    hover:bg-wine-glassHover hover:border-wine-gold/50
    active:scale-[0.98]
  `}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onClick={() => fileInputRef.current?.click()}>

    {/* 커스텀 와인 아이콘 */}
    <div className="mb-6">
      <WineBottleIcon className="w-20 h-20 text-wine-gold/60 mx-auto" />
    </div>

    {/* 타이틀 */}
    <h3 className="font-playfair text-2xl text-wine-cream mb-3 font-light">
      Add Bottles
    </h3>

    {/* 설명 */}
    <p className="font-body text-wine-creamDim text-sm mb-6 leading-relaxed">
      Capture wine labels or receipts<br />
      to automatically track your collection
    </p>

    {/* 업로드 버튼 */}
    <button className="w-full py-4 px-6
                       bg-gradient-to-r from-wine-gold to-wine-goldDark
                       text-wine-dark text-base font-body font-semibold
                       rounded-xl shadow-wine
                       hover:shadow-wine-lg hover:from-wine-goldDark hover:to-wine-gold
                       transition-all duration-300
                       active:scale-95
                       min-h-[56px]">
      <CameraIcon className="inline w-5 h-5 mr-2 -mt-0.5" />
      Open Camera
    </button>

    {/* 보조 설명 */}
    <p className="font-body text-wine-creamDark text-xs mt-4">
      or drag and drop images
    </p>
  </div>
</div>
```

**모바일 카메라 최적화**:
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  capture="environment"  // 후면 카메라 우선
  multiple={multiple}
  onChange={handleFileChange}
  className="hidden"
/>
```

---

### 5.5 와인 카드 (components/WineInfoCard.tsx)

**현재**: 흰색 박스 + 파란 테두리

**개선**:
```tsx
<article className={`
  relative overflow-hidden rounded-2xl
  bg-gradient-to-br from-wine-glass to-wine-glass/50
  backdrop-blur-md border transition-all duration-300
  ${isSelected
    ? 'border-wine-gold shadow-wine-selected'
    : 'border-wine-glassBorder hover:border-wine-gold/40'}
`}>

  {/* 선택 시 글로우 효과 */}
  {isSelected && (
    <div className="absolute inset-0 bg-gradient-radial
                    from-wine-gold/10 to-transparent pointer-events-none" />
  )}

  {/* 상단: 이미지 + 빈티지 (세로 와인 라벨 고려하여 높이 확장) */}
  <div className="relative h-40 overflow-hidden">
    {/* 이미지 배경 */}
    <div className="absolute inset-0 bg-gradient-to-b from-wine-deep/30 to-wine-dark/80" />
    <img
      src={item.preview}
      alt={data.Name}
      className="w-full h-full object-cover opacity-60"
    />

    {/* 빈티지 오버레이 */}
    {data.Vintage && (
      <div className="absolute bottom-2 right-3">
        <span className="font-playfair text-[28px] font-light text-wine-gold
                         drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {data.Vintage}
        </span>
      </div>
    )}

    {/* 체크박스 (왼쪽 상단) */}
    <label className="absolute top-3 left-3 cursor-pointer">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleCheckboxChange}
        className="w-6 h-6 rounded border-2 border-wine-gold/50
                   bg-wine-dark/50 backdrop-blur-sm
                   checked:bg-wine-gold checked:border-wine-gold
                   focus:ring-2 focus:ring-wine-gold/50 focus:ring-offset-0
                   transition-all duration-200"
      />
    </label>
  </div>

  {/* 중단: 와인 정보 */}
  <div className="p-4 space-y-3">
    {/* 와인명 + 상태 */}
    <div>
      <h3 className="font-playfair text-lg text-wine-cream font-medium
                     leading-tight line-clamp-2 mb-1.5">
        {data.Name || '(No Name)'}
      </h3>

      {/* 상태 배지 */}
      <StatusBadge status={item.status} />
    </div>

    {/* 구분선 */}
    <div className="h-[1px] bg-gradient-to-r from-transparent
                    via-wine-glassBorder to-transparent" />

    {/* 상세 정보 그리드 */}
    <dl className="space-y-2 text-sm">
      {data['Region/Producer'] && (
        <div className="flex items-start gap-3">
          <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
            Producer
          </dt>
          <dd className="font-body text-wine-cream flex-1 font-medium">
            {data['Region/Producer']}
          </dd>
        </div>
      )}

      {data['Varietal(품종)'] && (
        <div className="flex items-start gap-3">
          <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
            Varietal
          </dt>
          <dd className="font-body text-wine-creamDim flex-1">
            {Array.isArray(data['Varietal(품종)'])
              ? data['Varietal(품종)'].join(', ')
              : data['Varietal(품종)']}
          </dd>
        </div>
      )}

      {data.Price && (
        <div className="flex items-center gap-3">
          <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
            Price
          </dt>
          <dd className="font-body text-wine-gold flex-1 font-semibold">
            {formatKRW(data.Price)}
          </dd>
        </div>
      )}
    </dl>
  </div>

  {/* 하단: 액션 버튼 */}
  <div className="p-4 pt-0 space-y-2">
    {/* 주요 액션 */}
    <div className="flex gap-2">
      <button
        onClick={() => onEdit(item.id)}
        className="flex-1 py-3 px-4
                   bg-wine-glass border border-wine-gold/50
                   text-wine-gold font-body font-medium text-sm
                   rounded-xl hover:bg-wine-gold/10
                   transition-all duration-200 active:scale-95
                   min-h-[48px]">
        Edit
      </button>

      <button
        onClick={() => onSaveIndividual(item.id, convertToNotionFormat(data))}
        className="flex-1 py-3 px-4
                   bg-gradient-to-r from-wine-gold to-wine-goldDark
                   text-wine-dark font-body font-semibold text-sm
                   rounded-xl shadow-wine hover:shadow-wine-lg
                   transition-all duration-200 active:scale-95
                   min-h-[48px]">
        Save
      </button>
    </div>

    {/* 보조 액션 */}
    <div className="flex gap-2">
      <button
        onClick={() => onRetryAnalysis(item.id)}
        className="flex-1 py-2.5 px-3
                   bg-wine-red/20 border border-wine-red/40
                   text-wine-red font-body font-medium text-xs
                   rounded-lg hover:bg-wine-red/30
                   transition-all duration-200 active:scale-95
                   min-h-[44px]">
        Re-analyze
      </button>

      <button
        onClick={() => onDelete(item.id)}
        className="flex-1 py-2.5 px-3
                   bg-wine-glass border border-wine-glassBorder
                   text-wine-creamDark font-body font-medium text-xs
                   rounded-lg hover:bg-wine-red/10 hover:border-wine-red/40
                   transition-all duration-200 active:scale-95
                   min-h-[44px]">
        Delete
      </button>
    </div>
  </div>
</article>
```

**모바일 최적화 포인트**:
- 이미지 높이 고정 (160px, h-40) → 세로 와인 라벨에 적합한 비율
- 버튼 최소 높이 48px → 엄지 터치 용이
- 액션 버튼 하단 배치 → 도달성 향상
- 빈티지를 큰 숫자로 강조 → 시각적 임팩트

---

### 5.6 프로그레스 표시 (components/ProcessingProgress.tsx)

**현재**: 가로 프로그레스 바 + 상태 그리드

**개선**:
```tsx
<div className="space-y-6">
  {/* 상단 고정 미니 프로그레스 바 - 스크롤 중에도 진행률 확인 가능 */}
  <div className="fixed top-0 left-0 right-0 z-50 safe-top">
    <div className="h-1 bg-wine-glass">
      <div
        className="h-full bg-gradient-to-r from-wine-gold to-wine-goldDark transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>

  {/* 전체 진행률 - 원형 프로그레스 */}
  <div className="text-center">
    <div className="relative inline-block">
      {/* SVG 원형 프로그레스 */}
      <svg className="w-32 h-32 transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-wine-glass"
        />
        {/* 진행률 원 */}
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={`${progress * 3.51} 351.86`}
          className="text-wine-gold transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-playfair text-3xl font-light text-wine-gold">
          {progress}%
        </span>
        <span className="font-body text-xs text-wine-creamDim uppercase tracking-wider mt-1">
          Processing
        </span>
      </div>
    </div>
  </div>

  {/* 상태 통계 */}
  <div className="grid grid-cols-2 gap-3">
    <StatCard
      icon={<ClockIcon />}
      label="Waiting"
      count={waitingCount}
      color="wine-creamDark"
    />
    <StatCard
      icon={<SpinnerIcon />}
      label="Processing"
      count={processingCount}
      color="wine-gold"
    />
    <StatCard
      icon={<CheckIcon />}
      label="Completed"
      count={completedCount}
      color="wine-gold"
    />
    <StatCard
      icon={<AlertIcon />}
      label="Errors"
      count={errorCount}
      color="wine-red"
    />
  </div>

  {/* 현재 처리 중인 항목 (있을 경우) */}
  {processingItem && (
    <div className="backdrop-blur-md bg-wine-glass border border-wine-gold/30
                    rounded-xl p-4 animate-pulse-subtle">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <img src={processingItem.preview} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="font-body text-wine-cream text-sm font-medium">
            Analyzing label...
          </p>
          <p className="font-body text-wine-creamDark text-xs mt-0.5">
            {processingItem.file.name}
          </p>
        </div>
        <SpinnerIcon className="w-5 h-5 text-wine-gold animate-spin" />
      </div>
    </div>
  )}
</div>
```

**StatCard 컴포넌트**:
```tsx
function StatCard({ icon, label, count, color }) {
  return (
    <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder
                    rounded-xl p-4 text-center">
      <div className={`w-8 h-8 mx-auto mb-2 text-${color}`}>
        {icon}
      </div>
      <div className={`font-playfair text-2xl font-light text-${color} mb-1`}>
        {count}
      </div>
      <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
```

---

### 5.7 버튼 시스템

**Primary Button (CTA)**:
```tsx
className="
  py-4 px-6 min-h-[56px]
  bg-gradient-to-r from-wine-gold to-wine-goldDark
  text-wine-dark font-body font-semibold text-base
  rounded-xl shadow-wine
  hover:shadow-wine-lg hover:from-wine-goldDark hover:to-wine-gold
  active:scale-95
  disabled:opacity-40 disabled:cursor-not-allowed
  transition-all duration-300
  relative overflow-hidden
"

// 버튼 내부 shimmer 효과
<span className="relative z-10">{children}</span>
<div className="absolute inset-0 bg-gradient-to-r from-transparent
                via-white/20 to-transparent translate-x-[-100%]
                group-hover:translate-x-[100%] transition-transform duration-700" />
```

**Secondary Button (Outline)**:
```tsx
className="
  py-3 px-5 min-h-[48px]
  bg-wine-glass border border-wine-gold/50
  text-wine-gold font-body font-medium text-sm
  rounded-xl hover:bg-wine-gold/10 hover:border-wine-gold
  active:scale-95
  transition-all duration-200
"
```

**Tertiary Button (Ghost)**:
```tsx
className="
  py-2.5 px-4 min-h-[44px]
  bg-transparent border border-wine-glassBorder
  text-wine-creamDim font-body font-medium text-sm
  rounded-lg hover:bg-wine-glass hover:text-wine-cream
  active:scale-95
  transition-all duration-200
"
```

**Danger Button (Delete)**:
```tsx
className="
  py-2.5 px-4 min-h-[44px]
  bg-wine-red/20 border border-wine-red/40
  text-wine-red font-body font-medium text-sm
  rounded-lg hover:bg-wine-red/30 hover:border-wine-red
  active:scale-95
  transition-all duration-200
"
```

---

### 5.8 Toast/Snackbar 시스템 (components/Toast.tsx)

**목적**: 저장 성공, 오류, 알림 등의 피드백 UI

**구현**:
```tsx
// components/Toast.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
}

const toastStyles = {
  success: 'bg-wine-gold/20 border-wine-gold/50 text-wine-gold',
  error: 'bg-wine-red/20 border-wine-red/50 text-wine-red',
  info: 'bg-wine-glass border-wine-glassBorder text-wine-cream',
  warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
};

const toastIcons = {
  success: <CheckIcon className="w-5 h-5" />,
  error: <CloseIcon className="w-5 h-5" />,
  info: <InfoIcon className="w-5 h-5" />,
  warning: <AlertIcon className="w-5 h-5" />,
};

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed left-4 right-4 z-50 safe-bottom-toast"
          style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          <div className={`
            flex items-center gap-3 px-4 py-3
            backdrop-blur-md border rounded-xl shadow-wine
            ${toastStyles[type]}
          `}>
            <div className="flex-shrink-0">
              {toastIcons[type]}
            </div>
            <p className="flex-1 font-body text-sm font-medium">
              {message}
            </p>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close notification"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Toast Hook**:
```tsx
// hooks/useToast.ts
import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type, isVisible: true });

    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, duration);
  }, [duration]);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
```

**사용 예시**:
```tsx
// pages/index.tsx
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

function HomePage() {
  const { toast, showToast, hideToast } = useToast();

  const handleSave = async () => {
    try {
      await saveToNotion(data);
      showToast('Wine saved to collection!', 'success');
    } catch (error) {
      showToast('Failed to save. Please try again.', 'error');
    }
  };

  return (
    <>
      {/* ... 기존 컨텐츠 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}
```

**Toast 스타일 가이드**:
| 타입 | 사용처 | 지속 시간 |
|------|--------|----------|
| **success** | 저장 완료, 업로드 성공 | 3초 |
| **error** | API 오류, 저장 실패 | 5초 (또는 수동 닫기) |
| **info** | 일반 알림, 힌트 | 3초 |
| **warning** | 재분석 필요, 데이터 누락 | 4초 |

---

## 6. 커스텀 아이콘 시스템

### 이모지 → SVG 아이콘 교체 매핑
| 현재 이모지 | 새 아이콘 | 컴포넌트명 |
|-----------|---------|-----------|
| 🍷 | 와인 잔 실루엣 | `<WineGlassIcon />` |
| 📷 | 카메라 아웃라인 | `<CameraIcon />` |
| 🖼️ | 업로드 화살표 | `<UploadIcon />` |
| 🚀 | 분석 아이콘 (돋보기+AI) | `<AnalyzeIcon />` |
| 📊 | 차트 아이콘 | `<ChartIcon />` |
| ✅ | 체크마크 원형 | `<CheckIcon />` |
| ❌ | X 마크 원형 | `<CloseIcon />` |
| 🔄 | 회전 화살표 | `<RefreshIcon />` |
| ⏳ | 시계 아이콘 | `<ClockIcon />` |
| 💾 | 저장 아이콘 | `<SaveIcon />` |
| ✏️ | 편집 아이콘 | `<EditIcon />` |
| 🗑️ | 휴지통 아이콘 | `<TrashIcon />` |
| ℹ️ | 정보 아이콘 (Toast용) | `<InfoIcon />` |
| ⚠️ | 경고 아이콘 (Toast용) | `<AlertIcon />` |

### 아이콘 구현 방식
```tsx
// components/icons/WineGlassIcon.tsx
export function WineGlassIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 2h8M12 15v5m-4 2h8M7 2l1 6c0 3 2 5 4 5s4-2 4-5l1-6" />
    </svg>
  );
}
```

**아이콘 사이즈 가이드**:
- Small: 16px (w-4 h-4) - 버튼 내부, 인라인 텍스트
- Medium: 20px (w-5 h-5) - 레이블, 기본 아이콘
- Large: 24px (w-6 h-6) - 섹션 헤더
- XLarge: 40px (w-10 h-10) - 업로드 영역
- Hero: 64px (w-16 h-16) - 메인 플레이스홀더

---

## 7. 애니메이션 시스템

### 페이지 로드 애니메이션
```tsx
// pages/index.tsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // easeOutExpo
    }
  }
};

// 사용
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={itemVariants}>
    <Header />
  </motion.div>
  <motion.div variants={itemVariants}>
    <UploadSection />
  </motion.div>
  {/* ... */}
</motion.div>
```

### 마이크로 인터랙션

**버튼 호버 효과** (CSS only):
```css
@layer components {
  .btn-shimmer {
    @apply relative overflow-hidden;
  }
  .btn-shimmer::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent;
    transform: translateX(-100%);
    transition: transform 0.7s ease;
  }
  .btn-shimmer:hover::before {
    transform: translateX(100%);
  }
}
```

**카드 선택 애니메이션**:
```tsx
// WineInfoCard.tsx
<motion.article
  layout
  animate={{
    borderColor: isSelected ? 'rgba(201, 160, 80, 1)' : 'rgba(201, 160, 80, 0.2)',
    scale: isSelected ? 1.02 : 1,
  }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```

**프로그레스 카운터 애니메이션**:
```tsx
import { useSpring, animated } from 'react-spring';

function AnimatedProgress({ value }) {
  const props = useSpring({
    number: value,
    from: { number: 0 },
    config: { tension: 20, friction: 10 }
  });

  return (
    <animated.span className="font-playfair text-3xl text-wine-gold">
      {props.number.to(n => Math.floor(n))}%
    </animated.span>
  );
}
```

**스켈레톤 로딩**:
```tsx
// 데이터 로딩 중
<div className="animate-pulse space-y-3">
  <div className="h-32 bg-wine-glass rounded-2xl" />
  <div className="h-4 bg-wine-glass rounded w-3/4" />
  <div className="h-4 bg-wine-glass rounded w-1/2" />
</div>

// tailwind.config.js에 커스텀 애니메이션 추가
animation: {
  'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
},
keyframes: {
  'pulse-subtle': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.85 },
  }
}
```

### 터치 피드백
```tsx
// 모든 인터랙티브 요소에 적용
className="
  transition-transform duration-150 ease-out
  active:scale-95
  tap-highlight-transparent
"

// globals.css에 추가
* {
  -webkit-tap-highlight-color: transparent;
}
```

---

## 8. 반응형 전략 (모바일 전용)

### 디바이스 타겟
```javascript
// 지원 디바이스
- iPhone SE (375px) ~ iPhone Pro Max (430px)
- Android small (360px) ~ Android large (428px)
- 세로 모드 전용 (가로 모드 미지원)
```

### 안전 영역 처리
```css
/* globals.css */
.safe-top {
  padding-top: max(24px, env(safe-area-inset-top));
}

.safe-bottom {
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

/* 하단 고정 버튼 (있을 경우) */
.sticky-bottom {
  position: sticky;
  bottom: 0;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: linear-gradient(to bottom, transparent, #1a0a0a 20%);
}
```

### 뷰포트 설정
```html
<!-- pages/_app.tsx or _document.tsx -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
/>
```

### 스크롤 최적화
```css
/* 부드러운 스크롤 */
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* 오버스크롤 바운스 제거 (선택적) */
body {
  overscroll-behavior-y: none;
}
```

---

## 9. 성능 최적화

### 이미지 처리
```tsx
// 썸네일 사이즈 제한
const MAX_PREVIEW_SIZE = { width: 400, height: 400 };

// 업로드 전 리사이징 (client-side)
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

const compressedFile = await imageCompression(file, options);
```

### CSS 애니메이션 성능
```css
/* GPU 가속 속성만 사용 */
.optimized-animation {
  /* ✅ 권장 */
  transform: translateY(10px);
  opacity: 0.5;

  /* ❌ 피할 것 (layout shift 유발) */
  /* top: 10px; */
  /* height: 100px; */
}

/* will-change 신중하게 사용 */
.will-animate {
  will-change: transform, opacity;
}
.will-animate:hover {
  transform: scale(1.05);
}
```

### 백드롭 블러 성능
```tsx
// 블러 강도 제한 (모바일에서 무거움)
backdrop-blur-xl  // 24px - 최대값
backdrop-blur-lg  // 16px - 권장
backdrop-blur-md  // 12px - 가벼움
```

### 폰트 로딩 전략
```tsx
// pages/_document.tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600&family=Source+Sans+3:wght@400;500;600&display=swap"
  rel="stylesheet"
/>

// CSS에서 폰트 폴백
font-family: 'Playfair Display', Georgia, serif;
font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

---

## 10. 접근성 (Accessibility)

### 색상 대비
```
텍스트 대비 (WCAG AA 기준 4.5:1)
- wine-cream (#f5f0e6) on wine-dark (#1a0a0a): 13.2:1 ✅
- wine-gold (#c9a050) on wine-dark (#1a0a0a): 7.8:1 ✅
- wine-creamDim (#d4cfc5) on wine-dark (#1a0a0a): 10.5:1 ✅

큰 텍스트 대비 (WCAG AA 기준 3:1)
- wine-creamDark (#a39d92) on wine-dark (#1a0a0a): 6.2:1 ✅
```

### 포커스 인디케이터
```css
/* 키보드 포커스 스타일 */
.focusable {
  @apply focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-wine-gold focus-visible:ring-offset-2
         focus-visible:ring-offset-wine-dark;
}

/* 터치 디바이스에서는 포커스 링 제거 */
@media (hover: none) {
  .focusable:focus {
    outline: none;
  }
}
```

### 시맨틱 HTML
```tsx
// ✅ 좋은 예
<main>
  <header>
    <h1>Wine Cellar</h1>
  </header>

  <section aria-labelledby="upload-heading">
    <h2 id="upload-heading">Add Bottles</h2>
    {/* ... */}
  </section>

  <article aria-label={`Wine card: ${wineName}`}>
    {/* ... */}
  </article>
</main>

// ❌ 나쁜 예
<div>
  <div>
    <div className="text-3xl">Wine Cellar</div>
  </div>
</div>
```

### 스크린 리더 지원
```tsx
// 로딩 상태
<div role="status" aria-live="polite">
  <span className="sr-only">Analyzing {fileName}...</span>
  <SpinnerIcon aria-hidden="true" />
</div>

// 프로그레스
<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
  {progress}%
</div>

// 숨겨진 레이블
<button aria-label="Delete wine entry">
  <TrashIcon aria-hidden="true" />
</button>
```

---

## 11. 다크 테마 세부 조정

### 가독성 향상 기법
```css
/* 텍스트에 미묘한 글로우 (가독성 향상) */
.text-glow {
  text-shadow: 0 0 20px rgba(245, 240, 230, 0.1);
}

/* 입력 필드 가독성 */
input, textarea {
  @apply bg-wine-dark/50 backdrop-blur-sm
         border border-wine-glassBorder
         text-wine-cream placeholder:text-wine-creamDark
         focus:bg-wine-dark/70 focus:border-wine-gold;
}

/* 어두운 배경에서 이미지 선명도 향상 */
img {
  @apply brightness-95 contrast-105;
}
```

### 눈의 피로 감소
```css
/* 순수 검정 피하기 (눈의 피로 감소) */
background: #1a0a0a; /* ✅ 미세하게 밝은 검정 */
background: #000000; /* ❌ 순수 검정 */

/* 순수 흰색 피하기 */
color: #f5f0e6; /* ✅ 크림색 */
color: #ffffff; /* ❌ 순수 흰색 */
```

---

## 12. 구현 우선순위 & 일정

### Phase 1: 기반 구축 (1-2일)
**목표**: 색상 시스템 및 타이포그래피 적용

- [ ] `tailwind.config.js` 색상 팔레트 정의
- [ ] Google Fonts 연동 (Playfair Display, Source Sans 3)
- [ ] `globals.css` 기본 스타일 업데이트
- [ ] 메인 배경 그라데이션 + 노이즈 텍스처 적용
- [ ] 헤더 재디자인

**검증**:
- 색상 대비 WCAG AA 통과
- 폰트 로딩 시간 < 1초

---

### Phase 2: 핵심 컴포넌트 (3-4일)
**목표**: 주요 UI 컴포넌트 재디자인

- [ ] `ProcessingStep` 글래스모피즘 카드 적용
- [ ] `ImageUpload` 재디자인 (커스텀 아이콘, 새 스타일)
- [ ] `WineInfoCard` 완전 재구축
  - [ ] 이미지 헤더 레이아웃 (h-40, 160px)
  - [ ] 빈티지 오버레이
  - [ ] 정보 그리드
  - [ ] 액션 버튼
- [ ] 버튼 시스템 표준화 (Primary/Secondary/Tertiary/Danger)
- [ ] `Toast` 컴포넌트 및 `useToast` 훅 구현

**검증**:
- 터치 타겟 최소 48px
- 스크롤 성능 60fps 유지

---

### Phase 3: 아이콘 & 애니메이션 (2-3일)
**목표**: 이모지 제거 및 모션 추가

- [ ] SVG 아이콘 컴포넌트 생성 (14개, Toast용 InfoIcon/AlertIcon 포함)
- [ ] 모든 이모지 → 아이콘 교체
- [ ] Framer Motion 설치 및 페이지 로드 애니메이션
- [ ] 버튼 shimmer 효과
- [ ] 프로그레스 카운터 애니메이션
- [ ] 카드 선택 애니메이션

**검증**:
- 애니메이션 60fps 유지
- 번들 사이즈 증가 < 50KB

---

### Phase 4: 세부 조정 & 폴리싱 (1-2일)
**목표**: 디테일 완성도 향상

- [ ] `ProcessingProgress` 원형 프로그레스 적용
- [ ] 폼 입력 필드 스타일링 (`WineEditForm`, `ManualWineForm`)
- [ ] 에러 메시지 디자인
- [ ] 로딩 스켈레톤 추가
- [ ] 모든 호버/액티브 상태 확인
- [ ] 안전 영역 처리 테스트 (iPhone 노치)

**검증**:
- 전체 컴포넌트 디자인 일관성 체크
- 실제 디바이스 테스트 (iPhone, Galaxy)

---

### Phase 5: 최적화 & 접근성 (1일)
**목표**: 성능 및 접근성 기준 충족

- [ ] 이미지 압축 로직 추가
- [ ] 폰트 프리로드 최적화
- [ ] 불필요한 backdrop-blur 제거
- [ ] ARIA 레이블 추가
- [ ] 스크린 리더 테스트
- [ ] 색상 대비 최종 검증
- [ ] Lighthouse 점수 측정

**검증**:
- Lighthouse Performance > 90
- Lighthouse Accessibility > 95
- First Contentful Paint < 1.5s

---

## 13. 테스트 계획

### 시각적 회귀 테스트
```bash
# Playwright 컴포넌트 스크린샷
npm install -D @playwright/test

# tests/visual/wine-card.spec.ts
test('WineInfoCard matches design', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="wine-card"]')).toHaveScreenshot();
});
```

### 디바이스 테스트 체크리스트
- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Galaxy S22 (360px)
- [ ] Pixel 7 (412px)

### 접근성 테스트
```bash
# axe-core 자동화 테스트
npm install -D @axe-core/playwright

# tests/a11y/color-contrast.spec.ts
test('color contrast meets WCAG AA', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### 성능 측정
```bash
# Lighthouse CI
npm install -D @lhci/cli

# lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
      },
    },
  },
};
```

---

## 14. 위험 요소 및 대응

### 위험 요소 1: 다크 테마 가독성
**문제**: 일부 사용자가 밝은 환경에서 사용 시 가독성 저하
**대응**:
- 텍스트 대비 최소 7:1 유지 (WCAG AAA)
- **밝기 부스트 토글 추가** (다크 테마 유지하면서 텍스트/UI 밝기만 증가)
- 자동 밝기 감지 옵션 검토 (CSS `prefers-contrast` 또는 ambient light sensor)
- 베타 테스트로 사용자 피드백 수집

**밝기 부스트 구현**:
```tsx
// 상태 관리
const [brightnessBoost, setBrightnessBoost] = useState(false);

// 적용
<main className={brightnessBoost ? 'brightness-boost' : ''}>

// CSS
.brightness-boost {
  --wine-cream: #ffffff;
  --wine-creamDim: #e8e3d9;
  --wine-creamDark: #c4bfb5;
  --wine-gold: #d4ad5a;
}
```

### 위험 요소 2: 백드롭 블러 성능
**문제**: 저사양 안드로이드 디바이스에서 버벅임
**대응**:
- CSS `@supports`로 기능 감지 후 폴백
```css
@supports (backdrop-filter: blur(12px)) {
  .glass { backdrop-filter: blur(12px); }
}
@supports not (backdrop-filter: blur(12px)) {
  .glass { background: rgba(255, 255, 255, 0.1); }
}
```
- 성능 테스트 후 블러 강도 조정 (xl → lg → md)

### 위험 요소 3: 폰트 로딩 지연
**문제**: 초기 로딩 시 시스템 폰트 → 커스텀 폰트 깜빡임
**대응**:
- `font-display: swap` 대신 `optional` 사용
- 크리티컬 텍스트만 커스텀 폰트 적용
- 폰트 서브셋 생성 (영문 + 숫자만)

### 위험 요소 4: 디자인 일관성 유지
**문제**: 여러 컴포넌트 수정 시 스타일 불일치
**대응**:
- `components/ui/` 폴더에 공통 컴포넌트 정리
- Storybook 도입 (선택적)
- 디자인 토큰 문서화

---

## 15. 성공 지표 (KPI)

### 정량적 지표
| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **Lighthouse Performance** | ? | > 90 | Lighthouse CI |
| **Lighthouse Accessibility** | ? | > 95 | Lighthouse CI |
| **First Contentful Paint** | ? | < 1.5s | Web Vitals |
| **Time to Interactive** | ? | < 3s | Web Vitals |
| **번들 사이즈 증가** | - | < 100KB | webpack-bundle-analyzer |

### 정성적 지표
- [ ] "와인 앱 같다"는 느낌 (vs 일반 웹앱)
- [ ] 프리미엄/고급스러운 인상
- [ ] 일관된 디자인 언어
- [ ] 이모지 없이도 직관적인 UI

---

## 16. 참고 자료

### 디자인 영감
- **Wine Spectator Mobile App** - 에디토리얼 타이포그래피
- **Vivino** - 와인 카드 레이아웃
- **Apple Music (Dark Mode)** - 글래스모피즘 효과
- **Stripe Dashboard** - 미니멀 럭셔리

### 기술 문서
- [Tailwind CSS Customization](https://tailwindcss.com/docs/configuration)
- [Framer Motion Variants](https://www.framer.com/motion/animation/)
- [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS Backdrop Filter Support](https://caniuse.com/css-backdrop-filter)

### 폰트
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) - High-contrast serif
- [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) - Clean humanist sans

---

## 17. 부록: 코드 스니펫

### A. Tailwind Config 전체
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          dark: '#1a0a0a',
          deep: '#2d1215',
          midnight: '#0a0506',
          red: '#722f37',
          gold: '#c9a050',
          goldDark: '#a68340',
          cream: '#f5f0e6',
          creamDim: '#d4cfc5',
          creamDark: '#a39d92',
          glass: 'rgba(255, 255, 255, 0.05)',
          glassBorder: 'rgba(201, 160, 80, 0.2)',
          glassHover: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        wine: '0 10px 40px -10px rgba(114, 47, 55, 0.3)',
        'wine-lg': '0 20px 60px -15px rgba(114, 47, 55, 0.5)',
        'wine-selected': '0 0 0 2px rgba(201, 160, 80, 0.5), 0 10px 40px -10px rgba(201, 160, 80, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
```

### B. Global Styles 전체
```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }

  body {
    @apply font-body bg-wine-dark text-wine-cream;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
  }

  /* iOS 입력 확대 방지 */
  input, select, textarea {
    font-size: 16px !important;
  }

  /* 터치 타겟 최소 사이즈 */
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }

  /* 터치 하이라이트 제거 */
  * {
    -webkit-tap-highlight-color: transparent;
  }
}

@layer components {
  /* 버튼 shimmer 효과 */
  .btn-shimmer {
    @apply relative overflow-hidden;
  }
  .btn-shimmer::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent;
    transform: translateX(-100%);
    transition: transform 0.7s ease;
  }
  .btn-shimmer:hover::before {
    transform: translateX(100%);
  }

  /* 스크린 리더 전용 */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}

@layer utilities {
  /* 안전 영역 */
  .safe-top {
    padding-top: max(24px, env(safe-area-inset-top));
  }

  .safe-bottom {
    padding-bottom: max(24px, env(safe-area-inset-bottom));
  }

  /* 텍스트 글로우 */
  .text-glow {
    text-shadow: 0 0 20px rgba(245, 240, 230, 0.1);
  }

  /* 백드롭 블러 폴백 */
  @supports not (backdrop-filter: blur(12px)) {
    .backdrop-blur-xl {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .backdrop-blur-md {
      background-color: rgba(255, 255, 255, 0.08);
    }
  }
}
```

### C. 아이콘 컴포넌트 예시
```tsx
// components/icons/index.tsx
export function WineGlassIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 2h8M12 15v5m-4 2h8M7 2l1 6c0 3 2 5 4 5s4-2 4-5l1-6" />
    </svg>
  );
}

export function CameraIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </svg>
  );
}

export function UploadIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

// ... 나머지 아이콘들
```

---

## 18. 체크리스트 요약

### 시작 전 확인사항
- [ ] 디자인 컨셉 승인 받기
- [ ] 기존 코드 백업
- [ ] 새 브랜치 생성 (`git checkout -b ui-redesign-wine-cellar`)
- [ ] 디자인 토큰 문서 공유

### Phase별 체크리스트
- [ ] **Phase 1**: 색상 시스템 구축
- [ ] **Phase 2**: 핵심 컴포넌트 재디자인
- [ ] **Phase 3**: 아이콘 & 애니메이션
- [ ] **Phase 4**: 세부 조정 & 폴리싱
- [ ] **Phase 5**: 최적화 & 접근성

### 완료 후 검증
- [ ] 모든 디바이스 테스트 통과
- [ ] Lighthouse 점수 목표 달성
- [ ] 접근성 자동 테스트 통과
- [ ] 사용자 피드백 수집
- [ ] 문서 업데이트 (README, CLAUDE.md)

---

**문서 버전**: 1.1
**최종 수정**: 2025-12-21
**작성자**: Claude (Wine Tracker UI Redesign Agent)
**수정 이력**:
- v1.1: 상단 고정 미니 프로그레스 바 추가, 밝기 부스트 토글 추가, 이미지 높이 h-32→h-40 확장, Toast/Snackbar 시스템 추가

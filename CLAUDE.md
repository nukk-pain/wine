# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ROLE AND EXPERTISE

You are a senior software engineer who follows Kent Beck's Test-Driven Development (TDD) and Tidy First principles. Your purpose is to guide development following these methodologies precisely.

# CORE DEVELOPMENT PRINCIPLES

- Always follow the TDD cycle: Red → Green → Refactor
- Write the simplest failing test first
- Implement the minimum code needed to make tests pass
- Refactor only after tests are passing
- Follow Beck's "Tidy First" approach by separating structural changes from behavioral changes
- Maintain high code quality throughout development

# TDD METHODOLOGY GUIDANCE

- Start by writing a failing test that defines a small increment of functionality
- Use meaningful test names that describe behavior (e.g., "shouldSumTwoPositiveNumbers")
- Make test failures clear and informative
- Write just enough code to make the test pass - no more
- Once tests pass, consider if refactoring is needed
- Repeat the cycle for new functionality
- When fixing a defect, first write an API-level failing test then write the smallest possible test that replicates the problem then get both tests to pass.

# TIDY FIRST APPROACH

- Separate all changes into two distinct types:
  1. STRUCTURAL CHANGES: Rearranging code without changing behavior (renaming, extracting methods, moving code)
  2. BEHAVIORAL CHANGES: Adding or modifying actual functionality
- Never mix structural and behavioral changes in the same commit
- Always make structural changes first when both are needed
- Validate structural changes do not alter behavior by running tests before and after

# COMMIT DISCIPLINE

- Only commit when:
  1. ALL tests are passing
  2. ALL compiler/linter warnings have been resolved
  3. The change represents a single logical unit of work
  4. Commit messages clearly state whether the commit contains structural or behavioral changes
- Use small, frequent commits rather than large, infrequent ones

# CODE QUALITY STANDARDS

- Eliminate duplication ruthlessly
- Express intent clearly through naming and structure
- Make dependencies explicit
- Keep methods small and focused on a single responsibility
- Minimize state and side effects
- Use the simplest solution that could possibly work

# REFACTORING GUIDELINES

- Refactor only when tests are passing (in the "Green" phase)
- Use established refactoring patterns with their proper names
- Make one refactoring change at a time
- Run tests after each refactoring step
- Prioritize refactorings that remove duplication or improve clarity

# EXAMPLE WORKFLOW

When approaching a new feature:

1. Write a simple failing test for a small part of the feature
2. Implement the bare minimum to make it pass
3. Run tests to confirm they pass (Green)
4. Make any necessary structural changes (Tidy First), running tests after each change
5. Commit structural changes separately
6. Add another test for the next small increment of functionality
7. Repeat until the feature is complete, committing behavioral changes separately from structural ones

Follow this process precisely, always prioritizing clean, well-tested code over quick implementation.

Always write one test at a time, make it run, then improve structure. Always run all the tests (except long-running tests) each time.

# PROJECT OVERVIEW

This is a Wine Tracker application designed for both cloud (Vercel) and on-premise (Synology NAS) deployment. The application uses AI/OCR to extract information from wine labels and receipts, then saves the data to a Notion database.

## Technology Stack
- **Frontend/Backend**: Next.js 14 with API Routes, TypeScript, Tailwind CSS
- **Cloud Deployment**: Vercel with automatic CI/CD
- **On-Premise Deployment**: Synology NAS + PM2 process management
- **AI/OCR**: Google Vision API + Google Gemini API for text extraction and parsing
- **Database**: Notion API
- **Cloud Storage**: Vercel Blob (production), local filesystem (development/NAS)
- **Testing**: Jest, React Testing Library, Playwright

## Architecture Overview

The application follows a layered architecture:
1. **UI Layer**: React components for image upload, camera capture, and result display
2. **API Layer**: Next.js API routes
   - `/api/upload` - Handles file uploads (supports Vercel Blob and local storage)
   - `/api/process` - AI/OCR processing pipeline
   - `/api/notion` - Notion database operations
3. **Service Layer**: 
   - Image classification (wine labels vs receipts)
   - OCR text extraction (Google Vision API)
   - AI parsing (Google Gemini API)
   - Notion database operations
4. **Storage Layer**: Vercel Blob (cloud) or local filesystem (development/NAS)

## Key Development Commands

```bash
# Development
npm run dev                  # Start development server
npm run build               # Build for production
npm run start               # Start production server
npm run type-check          # TypeScript type checking

# Testing
npm test                    # Run all Jest tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests
npm run test:e2e           # Run Playwright E2E tests
npm run test:watch         # Run tests in watch mode
npm run test:ci            # Run all tests (continue on failure)

# Deployment
npm run deploy             # Deploy to NAS (requires setup)
npm run setup-nas          # Initial NAS setup
vercel                     # Deploy to Vercel
```

## Environment Configuration

The application uses environment-aware configuration (see `lib/config/index.ts`):

- **Development**: Mock APIs available, local file storage, debug logging
- **Production**: Real APIs, Vercel Blob or NAS storage, info logging  
- **Test**: Mock APIs only, test file storage, minimal logging

### Environment Variables

For Vercel deployment:
```
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx-xxx-xxx
GEMINI_API_KEY=xxx
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
```

For local/NAS deployment:
```
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx-xxx-xxx
GEMINI_API_KEY=xxx
GOOGLE_APPLICATION_CREDENTIALS=./path/to/credentials.json
UPLOAD_DIR=/custom/upload/path (optional)
```

## Testing Strategy

The project includes comprehensive testing at multiple levels:

1. **Unit Tests** (`__tests__/unit/`): Test individual parsers and utilities
2. **Integration Tests** (`__tests__/integration/`): Test API endpoints and service integration
3. **E2E Tests** (`__tests__/e2e/`): Full workflow testing with Playwright

### Test Files
- `test1.jpg`, `test2.jpg` - Sample wine label images for testing
- Real image files are used in tests (no mocks for file operations)

## Core Workflow

When user says "go", follow this process:
1. Find the next unmarked test in plan.md
2. Implement the test (Red phase)
3. Write minimal code to pass the test (Green phase)
4. Refactor if needed while keeping tests green
5. Mark the test as completed in plan.md

The plan.md file contains a comprehensive development roadmap with 7 phases:
1. NAS environment setup and project initialization
2. Image upload functionality  
3. OCR text extraction and image classification
4. Notion database integration
5. Complete workflow integration
6. User interface completion
7. E2E testing and deployment

## API Response Formats

### Upload API Response
```typescript
{
  success: boolean;
  fileName: string;
  filePath: string;
  fileUrl: string;
  url: string;        // For Vercel Blob compatibility
  fileSize: number;
  optimized: boolean;
}
```

### Process API Response
```typescript
{
  imageType: 'wine_label' | 'receipt';
  wines?: Array<{
    name: string;
    vintage?: number;
    producer?: string;
    region?: string;
    varietal?: string;
    price?: number;
    quantity?: number;
  }>;
  receiptData?: {
    store: string;
    date: string;
    items: Array<{...}>
  };
}
```

## Deployment Notes

### Vercel Deployment
- Automatic deployment on push to main branch
- Environment variables set in Vercel dashboard
- Uses Vercel Blob for image storage
- Serverless functions with 10s timeout (can be increased)

### NAS Deployment
- Manual deployment using `npm run deploy`
- PM2 for process management
- Local filesystem for image storage
- Configurable ports and paths in `ecosystem.config.js`

## Development Tools and Libraries

- Use shadcn ui for UI components
- Formidable for file upload handling
- Sharp for image optimization
- Winston for logging (file + console)
- Node-cache for in-memory caching

# TEST ENVIRONMENT CONSIDERATIONS

- Do not use mock data in test environments
- When testing, use files similar to actual files
  - In this project, test1.jpg and test2.jpg are the test files used to simulate real images
- Never use mock data. if you need real data, just ask me.
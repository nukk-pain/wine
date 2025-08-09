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

This is a Wine Tracker application (version 1.0.7) designed primarily for cloud deployment on Vercel with mobile-first UI. The application uses AI/OCR to extract information from wine labels and receipts, then saves the data to a Notion database.

## Technology Stack
- **Frontend/Backend**: Next.js 14 with API Routes, TypeScript, Tailwind CSS
- **Primary Deployment**: Vercel with automatic CI/CD
- **AI/OCR**: Google Vision API (@google-cloud/vision v4.3.3) + Google Gemini API (@google/genai v1.10.0)
- **Database**: Notion API (@notionhq/client v2.3.0)
- **Storage**: Vercel Blob (@vercel/blob v1.1.1) for production images
- **Testing**: Jest, React Testing Library, Playwright
- **Image Processing**: Sharp v0.32.6, Formidable v3.5.1, Node-cache v5.1.2

## Architecture Overview

The application follows a layered architecture:
1. **UI Layer**: Mobile-first React components
   - `UnifiedWorkflow.tsx` - Main workflow component
   - `ImageUpload.tsx` - Camera/file upload with preview
   - `WineResultDisplay.tsx` - Results with edit capabilities
   - `ProcessingProgress.tsx` - Real-time progress indication
2. **API Layer**: Next.js API routes
   - `/api/upload` & `/api/upload-multiple` - File uploads with Vercel Blob
   - `/api/process` & `/api/process-multiple` - AI processing pipeline
   - `/api/process-with-edit` - Edit workflow support
   - `/api/notion` & `/api/batch-notion` - Database operations
   - `/api/cleanup-blobs` - Storage cleanup
3. **Service Layer**: 
   - Image classification and OCR caching (`lib/vision-cache.ts`)
   - Structured AI parsing with Gemini (`lib/gemini-parser.ts`)
   - Environment-aware configuration (`lib/config/`)
   - Error handling and validation (`lib/error-handling.ts`, `lib/validation.ts`)
4. **Storage Layer**: Vercel Blob with automatic cleanup

## Key Development Commands

```bash
# Development
npm run dev                  # Start development server
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # ESLint check
npm run type-check          # TypeScript type checking

# Testing (using custom test runner)
npm test                    # Run all Jest tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests
npm run test:performance   # Run performance tests
npm run test:vision        # Run Vision API specific tests
npm run test:all           # Run all test suites
npm run test:ci            # Run all tests (continue on failure)
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run Playwright E2E tests

# Deployment (legacy scripts maintained)
npm run deploy             # Deploy to NAS (requires setup)
npm run setup-nas          # Initial NAS setup
npm run backup             # Backup deployment
vercel                     # Deploy to Vercel
```

## Environment Configuration

The application uses sophisticated environment-aware configuration (see `lib/config/index.ts`):

- **Development**: Real APIs with caching, local file storage, comprehensive logging
- **Production**: Optimized for Vercel serverless, Blob storage, structured logging  
- **Test**: Mock APIs with __mocks__ system, test file storage, minimal logging

Key configuration features:
- Memory management with configurable limits
- Vision API caching with TTL
- Automatic Vercel vs local environment detection
- Service timeout and retry configuration

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

1. **Unit Tests** (`__tests__/unit/`): Individual components, parsers, and utilities
2. **Integration Tests** (`__tests__/integration/`): API endpoints, workflow, and service integration
3. **Performance Tests** (`__tests__/performance/`): Vision API caching and memory management
4. **E2E Tests** (`__tests__/e2e/`): Full workflow with Playwright

### Test Infrastructure
- Custom test runner (`scripts/test-runner.js`) with categorized test execution
- Comprehensive mocks (`__mocks__/@google/genai.js`, `__mocks__/@vercel/blob.js`)
- Real image assets (`test-assets/test1.jpg`, `test-assets/test2.jpg`)
- Test-specific upload directories and cleanup
- Coverage reporting with detailed HTML reports

## Core Workflow

## Current Development Status

The application is now in production (v1.0.7) with the following completed features:
- ✅ Mobile-first responsive UI with camera integration
- ✅ Multiple image upload and batch processing
- ✅ AI-powered image classification and OCR
- ✅ Structured data extraction with Gemini
- ✅ Edit workflow for manual corrections
- ✅ Notion database integration with batch operations
- ✅ Vercel Blob storage with cleanup
- ✅ Comprehensive test suite and performance monitoring
- ✅ Production deployment with error handling

### Active Development Areas
- Re-submission functionality for failed processing
- Advanced caching strategies for Vision API
- Enhanced mobile UX improvements
- Cost optimization for API usage

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

### Vercel Deployment (Primary)
- Automatic deployment on push to master branch (current: vercel branch)
- Environment variables configured in Vercel dashboard
- Vercel Blob storage for images with automatic cleanup
- Serverless functions optimized for mobile API usage
- Recent commits focus on re-submission functionality and Gemini prompt optimization

### Legacy NAS Support
- Deployment scripts maintained for compatibility
- Local filesystem fallback available
- PM2 configuration preserved in deployment folder

## Key Libraries and Tools

- **UI Framework**: React with TypeScript, mobile-first responsive design
- **File Handling**: Formidable v3.5.1 with multipart support
- **Image Processing**: Sharp v0.32.6 for optimization
- **Caching**: Node-cache v5.1.2 with memory management
- **Testing**: Custom test runner with Jest and Playwright
- **AI APIs**: Structured output with Google Gemini, Vision API caching
- **Storage**: Vercel Blob with automatic cleanup mechanisms

# CURRENT PROJECT STATUS

## Production Application
The Wine Tracker is a fully functional production app deployed on Vercel with:
- Mobile-optimized interface for wine label and receipt processing
- Real-time AI analysis with progress feedback
- Edit capabilities for manual corrections
- Automatic Notion database integration
- Batch processing support for multiple images

## Test Environment
- Comprehensive test coverage with real image assets
- Mock system for API services during testing
- Performance tests for Vision API caching
- E2E testing with Playwright for full workflow validation
- Use `test-assets/test1.jpg` and `test-assets/test2.jpg` for testing

## Development Guidelines
- Follow mobile-first responsive design principles
- Maintain environment-aware configuration
- Use structured AI outputs with proper error handling
- Implement proper caching for API cost management
- Ensure all changes maintain backward compatibility
- Always run full test suite before significant changes
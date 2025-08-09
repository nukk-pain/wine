import { ImageAnnotatorClient } from '@google-cloud/vision';
import { classifyImage, ImageType } from './parsers/image-classifier';
import { parseWineLabel } from './parsers/wine-label';
import { parseReceipt } from './parsers/receipt';
import { 
  generateCacheKey, 
  getCachedResult, 
  setCachedResult,
  getCacheStats 
} from './vision-cache';
import { getConfig, isServiceEnabled, getServiceTimeout } from './config';
import { refineWineDataWithGemini } from './gemini';
import fs from 'fs';
import path from 'path';

export interface ProcessedImageResult {
  imageType: ImageType;
  confidence: number;
  data: any;
  rawText: string;
}

export async function processWineImage(imageUrl: string): Promise<ProcessedImageResult> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  console.log('Wine image processing started:', {
    requestId,
    imageUrl: maskSensitiveData(imageUrl),
    timestamp: new Date().toISOString()
  });

  try {
    // 1. OCR로 텍스트 추출
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting OCR text extraction:', { requestId });
    }
    const extractedText = await extractTextFromImage(imageUrl);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('OCR completed:', {
        requestId,
        textLength: extractedText.length,
        hasText: extractedText.length > 0
      });
    }
    
    // 2. 이미지 타입 분류
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting image classification:', { requestId });
    }
    const classification = await classifyImage(extractedText);
    
    console.log('Image classified:', {
      requestId,
      imageType: classification.type,
      confidence: classification.confidence,
      indicators: classification.indicators
    });
    
    // 3. 적절한 파서로 데이터 추출
    let parsedData;
    let parsingError = null;
    
    try {
      switch (classification.type) {
        case ImageType.WINE_LABEL:
          if (process.env.NODE_ENV === 'development') {
            console.log('Parsing wine label data:', { requestId });
          }
          const wineData = parseWineLabel(extractedText);
          
          let geminiData = null;
          let usedGemini = false;
          
          try {
            // Use Gemini to refine the OCR text
            if (process.env.NODE_ENV === 'development') {
              console.log('Calling Gemini for data refinement:', { requestId });
            }
            geminiData = await refineWineDataWithGemini(extractedText);
            usedGemini = true;
          } catch (geminiError) {
            console.warn('Gemini refinement failed, falling back to rule-based parser:', {
              requestId,
              error: geminiError instanceof Error ? geminiError.message : 'Unknown error'
            });
          }
          
          // Map to WineData interface expected by ResultDisplay
          // Prioritize Gemini results, fallback to rule-based parser
          parsedData = {
            name: geminiData?.name || wineData.name || 'Unknown Wine',
            vintage: geminiData?.vintage || wineData.vintage,
            'Region/Producer': geminiData?.producer || wineData.producer || wineData.region || geminiData?.region,
            'Varietal(품종)': geminiData?.grape_variety || wineData.variety,
            price: undefined,
            quantity: undefined
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Wine label parsing completed:', {
              requestId,
              hasName: !!parsedData.name,
              hasVintage: !!parsedData.vintage,
              hasProducer: !!parsedData['Region/Producer'],
              usedGemini
            });
          }
          break;
          
        case ImageType.RECEIPT:
          if (process.env.NODE_ENV === 'development') {
            console.log('Parsing receipt data:', { requestId });
          }
          const receiptData = parseReceipt(extractedText);
          // Map to ReceiptData interface expected by ResultDisplay
          parsedData = {
            store: receiptData.store || 'Unknown Store',
            items: receiptData.items || [],
            total: receiptData.total || 0
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Receipt parsing completed:', {
              requestId,
              hasStore: !!receiptData.store,
              itemCount: receiptData.items?.length || 0,
              hasTotal: !!receiptData.total
            });
          }
          break;
          
        default:
          console.warn('Unknown image type detected:', {
            requestId,
            imageType: classification.type,
            confidence: classification.confidence
          });
          parsedData = { error: 'Unknown image type' };
      }
    } catch (parseError: any) {
      parsingError = parseError;
      console.error('Data parsing failed:', {
        requestId,
        imageType: classification.type,
        error: {
          message: parseError.message,
          stack: parseError.stack
        }
      });
      
      parsedData = { 
        error: 'Failed to parse image data',
        details: parseError.message 
      };
    }
    
    const processingTime = Date.now() - startTime;
    const result = {
      imageType: classification.type,
      confidence: classification.confidence,
      data: parsedData,
      rawText: extractedText
    };
    
    console.log('Wine image processing completed:', {
      requestId,
      imageType: classification.type,
      confidence: classification.confidence,
      processingTime,
      textLength: extractedText.length,
      hasParsingError: !!parsingError,
      success: !parsedData.error
    });
    
    return result;
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('Wine image processing failed:', {
      requestId,
      imageUrl: maskSensitiveData(imageUrl),
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      processingTime,
      success: false
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Google Cloud Vision API를 사용하여 이미지에서 텍스트를 추출합니다.
 * @param imageUrl 로컬 파일 경로 또는 HTTP URL
 * @returns 추출된 텍스트 (텍스트가 없으면 빈 문자열)
 * @throws {Error} 파일을 찾을 수 없거나, 지원하지 않는 형식이거나, API 오류가 발생한 경우
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const config = getConfig();
  
  console.log('Vision API request started:', {
    requestId,
    imageUrl: maskSensitiveData(imageUrl),
    timestamp: new Date().toISOString(),
    environment: config.environment,
    visionEnabled: config.vision.enabled,
    mockMode: config.vision.mockMode
  });

  try {
    // 1. 입력 검증
    validateImagePath(imageUrl);
    
    // 2. 환경별 모의 데이터 처리
    if (config.vision.mockMode || config.environment === 'test') {
      // 테스트/모의 환경에서 모의 OCR 결과 반환
      const mockText = getMockTextForTestImage(imageUrl);
      
      console.log('Vision API mock response:', {
        requestId,
        imageUrl: maskSensitiveData(imageUrl),
        textLength: mockText.length,
        processingTime: Date.now() - startTime,
        isMock: true,
        environment: config.environment
      });
      
      return mockText;
    }
    
    // 3. 서비스 활성화 확인
    if (!isServiceEnabled('vision')) {
      throw new Error('Vision API is disabled in current environment');
    }
    
    // 4. 캐시 확인 (캐시가 활성화된 경우)
    if (isServiceEnabled('cache')) {
      const cacheKey = await generateCacheKey(imageUrl);
      const cachedResult = getCachedResult(cacheKey);
      
      if (cachedResult !== undefined) {
        const processingTime = Date.now() - startTime;
        
        console.log('Vision API cache hit:', {
          requestId,
          imageUrl: maskSensitiveData(imageUrl),
          cacheKey,
          textLength: cachedResult.length,
          processingTime,
          cached: true
        });
        
        return cachedResult;
      }
    }
    
    // 5. Google Cloud Vision API 클라이언트 생성 (환경별 설정)
    const clientOptions: any = {};
    
    if (config.vision.projectId) {
      clientOptions.projectId = config.vision.projectId;
    }
    
    if (config.vision.keyFilename && fs.existsSync(config.vision.keyFilename)) {
      clientOptions.keyFilename = config.vision.keyFilename;
    }
    
    const client = new ImageAnnotatorClient(clientOptions);
    
    // 6. 요청 객체 생성 (로컬 파일 vs URL)
    const request = createVisionRequest(imageUrl);
    
    // 7. OCR 실행 (환경별 타임아웃 적용)
    const timeout = getServiceTimeout('vision');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Vision API timeout')), timeout);
    });
    
    const visionPromise = client.textDetection(request);
    const [result] = await Promise.race([visionPromise, timeoutPromise]) as any[];
    
    const detections = result.textAnnotations;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Vision API request completed:', {
        requestId,
        imageUrl: maskSensitiveData(imageUrl),
        requestType: imageUrl.startsWith('http') ? 'url' : 'file',
        annotationCount: detections?.length || 0,
        timeout
      });
    }
    
    // 8. 결과 처리
    const extractedText = detections && detections.length > 0 
      ? detections[0].description || ''
      : '';
    
    // 9. 결과 캐싱 (캐시가 활성화된 경우)
    if (isServiceEnabled('cache')) {
      const cacheKey = await generateCacheKey(imageUrl);
      setCachedResult(cacheKey, extractedText);
    }
    
    const processingTime = Date.now() - startTime;
    const cacheStats = isServiceEnabled('cache') ? getCacheStats() : null;
    
    // 10. 성공 로깅
    console.log('Vision API request successful:', {
      requestId,
      imageUrl: maskSensitiveData(imageUrl),
      textLength: extractedText.length,
      annotationCount: detections?.length || 0,
      processingTime,
      cached: false,
      timeout,
      cacheEnabled: isServiceEnabled('cache'),
      cacheStats
    });
    
    return extractedText;
      
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('Vision API request failed:', {
      requestId,
      imageUrl: maskSensitiveData(imageUrl),
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      processingTime,
      success: false
    });
    
    return handleVisionError(error, imageUrl);
  }
}

/**
 * 이미지 파일 경로의 유효성을 검증합니다.
 */
function validateImagePath(imageUrl: string): void {
  // 테스트 환경에서는 테스트 이미지 파일 허용
  if (process.env.NODE_ENV === 'test' && (imageUrl.includes('test-assets/test1.jpg') || imageUrl.includes('test-assets/test2.jpg'))) {
    return;
  }
  
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
  const extension = path.extname(imageUrl).toLowerCase();
  
  if (!validExtensions.includes(extension)) {
    throw new Error('Unsupported image format');
  }
}

/**
 * Vision API 요청 객체를 생성합니다.
 */
function createVisionRequest(imageUrl: string) {
  if (imageUrl.startsWith('http')) {
    // URL인 경우
    return { image: { source: { imageUri: imageUrl } } };
  } else {
    // 로컬 파일인 경우
    const imageBuffer = fs.readFileSync(imageUrl);
    return { image: { content: imageBuffer.toString('base64') } };
  }
}

/**
 * 요청 ID를 생성합니다.
 */
function generateRequestId(): string {
  return `vision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 민감한 데이터를 마스킹합니다.
 */
function maskSensitiveData(imageUrl: string): string {
  // 파일 경로에서 민감한 정보 제거 (사용자 이름 등)
  return imageUrl.replace(/\/Users\/[^\/]+\//, '/Users/***/')
                .replace(/C:\\Users\\[^\\]+\\/, 'C:\\Users\\***\\')
                .replace(/\/home\/[^\/]+\//, '/home/***/');
}

/**
 * 테스트 이미지를 위한 모의 텍스트를 반환합니다.
 */
function getMockTextForTestImage(imageUrl: string): string {
  // Handle both relative and absolute paths for test images
  if (imageUrl.includes('test-assets/test1.jpg') || imageUrl.includes('test1.jpg')) {
    return `CHÂTEAU MARGAUX
PREMIER GRAND CRU CLASSÉ
APPELLATION MARGAUX CONTRÔLÉE
2019
750 ML
13.5% VOL
PRODUCT OF FRANCE
Estate Bottled`;
  } else if (imageUrl.includes('test-assets/test2.jpg') || imageUrl.includes('test2.jpg')) {
    return `Receipt
Store: Wine Shop
Date: 2024-01-15
Item: Château Margaux 2019
Price: $500.00
Total: $500.00`;
  }
  // Default mock text for any test image
  return `CHÂTEAU TEST WINE
MOCK WINE LABEL
2020
FRANCE
750 ML`;
}

/**
 * Vision API 에러를 처리합니다.
 */
function handleVisionError(error: any, imageUrl: string): never {
  // 파일 없음 에러
  if (error.message?.includes('ENOENT') || error.message?.includes('No such file')) {
    throw new Error(`File not found: ${imageUrl}`);
  }
  
  // 이미지 형식 에러
  if (error.message?.includes('Unsupported image format')) {
    throw error;
  }
  
  // 인증 에러
  if (error.message?.includes('Could not load the default credentials') || 
      error.message?.includes('GOOGLE_APPLICATION_CREDENTIALS') ||
      (error.code === 'ENOENT' && error.path?.includes('vision.json'))) {
    throw new Error('Google Vision API credentials not configured. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
  }
  
  // 할당량 초과 에러 (향상된 처리)
  if (error.code === 'QUOTA_EXCEEDED' || error.message?.includes('quota')) {
    throw new Error('Google Vision API quota exceeded. Please try again later.');
  }
  
  // 잘못된 인수 에러 (손상된 이미지 등)
  if (error.code === 'INVALID_ARGUMENT') {
    throw new Error('Invalid image format or corrupted file.');
  }
  
  // 서비스 사용 불가 에러
  if (error.code === 'UNAVAILABLE') {
    throw new Error('Google Vision API is temporarily unavailable. Please try again later.');
  }
  
  // 요청 크기 초과 에러
  if (error.code === 'REQUEST_TOO_LARGE' || error.message?.includes('payload size exceeds')) {
    throw new Error('Image file is too large. Please use a smaller image.');
  }
  
  // 속도 제한 에러
  if (error.code === 'RATE_LIMIT_EXCEEDED' || error.message?.includes('rate limit')) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }
  
  // 기타 에러
  throw new Error(`Vision API failed: ${error.message}`);
}
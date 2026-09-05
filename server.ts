import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "placeholder_key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Retry helper with exponential backoff for transient rate-limit (429) errors
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelayMs = 2500): Promise<T> {
  let lastError: any;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      const isRateLimit =
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("quota") ||
        err?.status === 429 ||
        err?.code === 429;

      if (isRateLimit && attempt < maxRetries) {
        console.warn(`[Gemini API] 429 Rate limit / Quota exceeded. Retrying attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Format Gemini error into clear, actionable Korean message
function formatGeminiError(error: any): { statusCode: number; message: string; isQuotaExceeded: boolean } {
  const errMsg = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
  const isQuotaExceeded =
    errMsg.includes("429") ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("quota") ||
    errMsg.includes("Quota") ||
    error?.status === 429 ||
    error?.code === 429;

  if (isQuotaExceeded) {
    return {
      statusCode: 429,
      message:
        "Google Gemini API 사용량 한도(분당 요청 수 또는 일일 무료 할당량)가 일시적으로 초과되었습니다 (429 RESOURCE_EXHAUSTED).\n\n• 분당 요청 제한(RPM)인 경우 약 30초~1분 뒤 다시 시도하시면 정상 작동합니다.\n• 무료 일일 할당량(RPD)이 모두 소진된 경우, Google AI Studio 좌측 상단 메뉴의 [Settings > Secrets] 패널에서 결제(Billing)가 등록된 개인 Gemini API Key를 선택/등록하시면 제한 없이 이용하실 수 있습니다.",
      isQuotaExceeded: true,
    };
  }

  return {
    statusCode: 500,
    message: errMsg || "콘텐츠 생성 중 오류가 발생했습니다.",
    isQuotaExceeded: false,
  };
}

// API Endpoint 1: Generate 4 Title & Topic Options
app.post("/api/generate-titles", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "주제(topic)를 입력해주세요." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
너는 네이버 블로그 전문 마케팅 기획자이자 콘텐츠 에디터이다.
구글 실시간 웹 검색(Google Search)을 활용하여 최신 정보, 최신 뉴스, 실시간 검색 트렌드를 수집하고 수집된 정보를 바탕으로 글을 기획하라.
사용자가 입력한 주제 또는 메모 글을 바탕으로, 네이버 검색 상위노출에 유리하며 블로그 독자의 클릭률(CTR)을 극대화할 수 있는 **4가지 서로 다른 매력적인 블로그 주제 및 제목 옵션**을 제시하라.

[조건]
1. 실시간 구글 웹 검색 데이터 기반으로 2026년 최신 트렌드 및 실제 검색어를 반영한다.
2. 4가지 옵션은 각각 다른 각도(예: 1. 정보제공/종합가이드형, 2. 실전경험/솔직후기형, 3. 문제해결/비교분석형, 4. Q&A/핵심 요약형)로 다양하게 기획한다.
3. 각 옵션마다 네이버 스마트블록 검색에 걸릴 수 있는 핵심 키워드(메인키워드 1개, 서브키워드 2~3개)를 명확히 추출한다.
4. 한국어로 작성하며 친근하고 눈길을 사로잡는 제목 스타일을 적용한다.
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `사용자가 작성하고 싶은 주제/아이디어: "${topic}"\n\n구글 실시간 웹 검색(Google Search)을 참고하여 최신 트렌드와 정보를 조사한 후, 위 주제를 바탕으로 네이버 상위노출을 위한 4가지 블로그 제목 및 타겟 옵션을 생성해주세요.`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "4개의 제목 옵션 리스트",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                title: { type: Type.STRING, description: "메인키워드와 서브키워드가 결합된 블로그 제목" },
                subTitle: { type: Type.STRING, description: "부제목 또는 서브 헤드라인" },
                mainKeyword: { type: Type.STRING, description: "타겟 메인 키워드" },
                subKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "연관 서브 키워드 2~3개",
                },
                targetAudience: { type: Type.STRING, description: "이 글의 타깃 독자층" },
                angle: { type: Type.STRING, description: "콘셉트 및 접근 방식 (예: 실전 가이드, 경험 후기, 비교 분석 등)" },
              },
              required: ["id", "title", "mainKeyword", "subKeywords", "targetAudience", "angle"],
            },
          },
        },
      })
    );

    const text = response.text || "[]";
    const titles = JSON.parse(text);
    return res.json({ titles });
  } catch (error: any) {
    console.error("Error generating titles:", error);
    const formatted = formatGeminiError(error);
    return res.status(formatted.statusCode).json({
      error: formatted.message,
      isQuotaExceeded: formatted.isQuotaExceeded,
    });
  }
});

// API Endpoint 2: Sequential Content Generation (Blog Post -> Image Prompts -> YouTube Package)
app.post("/api/generate-content", async (req, res) => {
  try {
    const { topic, selectedTitleOption } = req.body;
    if (!selectedTitleOption || !selectedTitleOption.title) {
      return res.status(400).json({ error: "선택된 제목 옵션 정보가 필요합니다." });
    }

    const ai = getGeminiClient();

    const promptInstructions = `
너는 대한민국 최고의 네이버 블로그 상위노출 전문가 및 종합 멀티미디어 콘텐츠 크리에이터이다.
사용자가 선택한 제목과 키워드를 기반으로 순차적 작업을 완료하여 JSON 형태로 출력하라.

===============================================
[구글 실시간 웹 검색(Google Search Grounding) 최신 정보 수집 & 참조]
===============================================
- **[실시간 웹 검색 필수 수행]**: 선택된 주제 및 키워드("${selectedTitleOption.mainKeyword}")와 관련된 최신 정보, 최신 뉴스, 2026년 기준 통계 및 정부/지자체/공신력 있는 기관의 최근 발표 자료, 변경된 법률/정책/가격 정보를 구글 실시간 웹 검색(Google Search)으로 수집하여 글의 근거로 적극 인용 및 반영하라.
- 검색으로 확인된 실제 데이터, 최신 동향, 사실(Fact) 중심의 고품질 정보를 바탕으로 독자에게 높은 신뢰성을 주는 원고를 작성하라.

===============================================
[1단계: 네이버 상위노출 최적화 블로그 글 작성 가이드]
===============================================
1. **[키워드 최적화]**:
   - 메인키워드("${selectedTitleOption.mainKeyword}")와 서브키워드들을 본문에 자연스럽게 5~6회 배치.
   - 제목, 서론 첫 문장, 중간 소제목 및 문단, 결론에도 자연스럽게 포함.
   - 스마트블록 연관 키워드를 적절히 추가.
2. **[구조화된 글 작성]**:
   - 서론: 글의 개요와 실시간 웹 검색으로 파악한 최신 이슈/배경 정보 도입.
   - 본론: 실시간 검색 정보를 포함한 상세 분석, 사례, 실전 경험/비교 내용 포함. 본론 소제목에는 메인키워드와 서브키워드를 명시.
   - 표(Table) 데이터: 핵심 정보나 금액, 비교 항목이 있는 경우 Markdown 표 또는 정형화된 데이터 형태로 구성.
   - 결론: 핵심 요약 및 독자의 행동 유도(Call To Action).
   - 태그: **줄바꿈 없이 15개**를 한 줄로 생성 (예: #키워드1 #키워드2 #키워드3 ... #키워드15).
3. **[최신 웹 검색 데이터 반영]**:
   - 2026년 최신 웹 검색 결과를 바탕으로 최신 법규/트렌드/뉴스/연구결과/실제 현황을 자연스럽게 포함.
4. **[신뢰성 강화]**:
   - 웹 검색을 통해 확인된 실제 수치("209만 6270원", "84.2%" 등) 및 공신력 있는 최신 자료 인용.
5. **[네이버 정책 준수 및 문체]**:
   - 과도한 광고/성적/폭언 금지. 장점과 단점을 균형있게 정보 중심으로 작성.
   - **AI 인사말(예: '안녕하세요! AI입니다' 등) 절대 금지!** 첫 줄부터 자연스럽게 시작.
   - 인간이 쓴 듯 문장 길이를 불규칙하게(짧은 문장과 긴 문장 교차) 구성.
   - 친근한 존댓말(~해요, ~있답니다, ~해보세요)과 이모지 적절히 활용.

===============================================
[2단계: 블로그 맞춤형 트렌디 실사 사진 장면 묘사 및 미드저니 프롬프트 8장 작성]
===============================================
- 블로그 글의 전체 흐름(서론 2장, 본론 세션들 5장, 결론 1장)에 맞춰 **정확히 8개**의 실사 사진 이미지 프롬프트를 생성하라.
- **[핵심 품질 및 트렌드 조건]**:
  1. 올드하거나 세련되지 못한 어색한 이미지를 철저히 지양하고, **2026년 최신 한국 감성의 모던하고 트렌디한 고화질 실사(Photorealistic)** 사진을 연출하라.
  2. 인물이 등장할 경우 세련되고 자연스러운 현대 한국인(Modern Korean) 모델, 깨끗하고 감성적인 인테리어 및 감각적인 라이프스타일 구도를 적용하라.
  3. 모든 이미지의 추천 비율(recommendedAspect)은 반드시 1:1 정방향 (고정)으로 지정하고, 영문 미드저니 프롬프트 끝에는 항상 --ar 1:1 을 붙여라.
  4. 영문 미드저니 프롬프트(midjourneyPromptEn): "Photorealistic, modern Korean lifestyle aesthetic, clean composition, soft natural morning daylight, Canon EOS R5 85mm f/1.4, high detail skin texture, 8k resolution, cinematic atmosphere --ar 1:1" 형태의 세련되고 문맥에 딱 맞는 완벽한 영문 프롬프트로 생성하라.
  5. 한글 장면 상세 묘사 (sceneDescriptionKo): 독자가 글을 읽으며 떠올릴 수 있는 매력적이고 구체적인 한국어 장면 설명.

===============================================
[3단계: 유튜브 스크립트 & 스토리보드 (나레이션 대사 & 16~20자 단위 장면 묘사 분리)]
===============================================
- **엄격 조건**: 사용자가 나레이션 대사와 시각 장면을 각각 따로 편리하게 활용할 수 있도록 작성하라!
- 대사(narrationScript)는 **16자~20자 이내의 짧고 명확한 한 문장/구절** 단위로 세분화하라.
- **[TTS 나레이션 문장 기호 필수 조건]**: TTS 생성 시 템포가 뒤엉키는 문제를 방지하기 위해 나레이션 대사(narrationScript)에는 **마침표(.)나 쉼표(,)를 절대로 포함하지 마라!** (느낌표(!)나 물음표(?)는 필요한 경우 사용 가능).
- 각 대사(16~20자)마다 **1:1로 짝을 이루는 시각 장면 묘사(visualBrollDescription)**를 구체적이고 생생하게 작성하라. (즉, 장면의 개수가 대사의 구절 개수와 1:1로 밀접하게 일치하여 15~20개 이상의 촘촘한 스토리보드가 완성되어야 함).
- 유튜브 설명글(descriptionText) 및 검색 태그(tags) 포함.
`;

    const userMessage = `
[선택된 제목 옵션]
- 제목: ${selectedTitleOption.title}
- 메인 키워드: ${selectedTitleOption.mainKeyword}
- 서브 키워드: ${selectedTitleOption.subKeywords.join(", ")}
- 타겟 독자: ${selectedTitleOption.targetAudience}
- 원본 요청 주제: ${topic}

위 가이드라인에 따라 1) 네이버 상위노출 블로그 글, 2) 미드저니 프롬프트 8장, 3) 16~20자 대사 단위 1:1 장면 분리 유튜브 스크립트 패키지를 완전하게 생성해 주세요.
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userMessage,
        config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: promptInstructions,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedTitle: { type: Type.STRING },
            blogPost: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                mainKeyword: { type: Type.STRING },
                subKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                intro: { type: Type.STRING, description: "블로그 서론 (키워드 및 최신 데이터 포함)" },
                sections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subheading: { type: Type.STRING, description: "본론 소제목 (메인/서브 키워드 포함)" },
                      content: { type: Type.STRING, description: "본론 단락 내용 (구체적 수치 및 정보 포함)" },
                    },
                    required: ["subheading", "content"],
                  },
                },
                tableData: {
                  type: Type.OBJECT,
                  description: "선택사항: 비교/통계 데이터 표",
                  properties: {
                    headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    rows: {
                      type: Type.ARRAY,
                      items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                  },
                },
                conclusion: { type: Type.STRING, description: "결론 단락" },
                callToAction: { type: Type.STRING, description: "행동 유도 문구" },
                hashtags: { type: Type.STRING, description: "줄바꿈 없이 15개 해시태그 (#태그1 #태그2 ...)" },
                wordCount: { type: Type.INTEGER, description: "글 전체 약 글자 수" },
                keywordCount: { type: Type.INTEGER, description: "메인 키워드 노출 횟수" },
              },
              required: ["title", "mainKeyword", "subKeywords", "intro", "sections", "conclusion", "callToAction", "hashtags"],
            },
            imagePrompts: {
              type: Type.ARRAY,
              description: "정확히 8개의 글 맞춤형 사진 장면 및 미드저니 프롬프트 리스트",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  sectionName: { type: Type.STRING, description: "관련 소제목/섹션" },
                  sceneDescriptionKo: { type: Type.STRING, description: "한국어 생생한 장면 글 묘사" },
                  midjourneyPromptEn: { type: Type.STRING, description: "영문 미드저니 실사 스타일 프롬프트" },
                  recommendedAspect: { type: Type.STRING, description: "추천 비율 (예: 16:9, 3:4)" },
                  cameraStyle: { type: Type.STRING, description: "카메라/조명 필름 스타일 설정" },
                },
                required: ["id", "sectionName", "sceneDescriptionKo", "midjourneyPromptEn", "recommendedAspect", "cameraStyle"],
              },
            },
            youtubePackage: {
              type: Type.OBJECT,
              properties: {
                videoTitle: { type: Type.STRING, description: "유튜브 영상 제목" },
                descriptionText: { type: Type.STRING, description: "유튜브 영상 설명글" },
                scriptScenes: {
                  type: Type.ARRAY,
                  description: "16~20자 단위 대사 및 1:1 매칭 구체적 Visual 장면 묘사 세그먼트들",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: { type: Type.INTEGER },
                      timestamp: { type: Type.STRING, description: "예: 00:00 - 00:05" },
                      narrationScript: { type: Type.STRING, description: "16자~20자 이내의 짧고 명확한 나레이션 대사" },
                      visualBrollDescription: { type: Type.STRING, description: "해당 16~20자 대사에 어울리는 구체적인 Visual/B-roll 장면 묘사" },
                      toneInstruction: { type: Type.STRING, description: "진행자 어조 및 감정 표현" },
                    },
                    required: ["sceneNumber", "timestamp", "narrationScript", "visualBrollDescription", "toneInstruction"],
                  },
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "유튜브 검색 태그",
                },
              },
              required: ["videoTitle", "descriptionText", "scriptScenes", "tags"],
            },
          },
          required: ["selectedTitle", "blogPost", "imagePrompts", "youtubePackage"],
        },
      },
    }));

    const text = response.text || "{}";
    const resultData = JSON.parse(text);
    return res.json(resultData);
  } catch (error: any) {
    console.error("Error generating sequential content:", error);
    const formatted = formatGeminiError(error);
    return res.status(formatted.statusCode).json({
      error: formatted.message,
      isQuotaExceeded: formatted.isQuotaExceeded,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
